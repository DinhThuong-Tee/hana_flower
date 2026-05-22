from fastapi import APIRouter, Body, Depends, HTTPException, UploadFile, File, Header
from app.core.security import decode_access_token
from typing import Optional
from app.core.database import get_db
from app.models.schemas import OrderModel
from bson import ObjectId  
from datetime import datetime 
import random, string
import shutil
from dotenv import load_dotenv
import os

load_dotenv()  
router = APIRouter()

# Hàm kiểm tra Token của User (giống Admin nhưng kiểm tra quyền cơ bản)
async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Vui lòng đăng nhập")
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Phiên đăng nhập hết hạn")
    return payload # Trả về thông tin uid và role

# 1. Tạo đơn hàng (CheckoutPage.tsx)
@router.post("/")
async def create_order(order_data: dict = Body(...), db = Depends(get_db)):
    try:
        # 1. Tạo mã đơn hàng ngẫu nhiên (Ví dụ: FLOA12)
        order_code = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
        
        total = 0
        total_profit = 0
        items_processed = []
        now = datetime.now()

        # 2. Duyệt qua từng sản phẩm khách đặt
        for item in order_data["items"]:
            # Tìm thông tin sản phẩm trong kho
            prod = await db["products"].find_one({"_id": ObjectId(item["product_id"])})
            if not prod:
                continue
            
            # Mặc định lấy giá gốc
            final_price = prod["price"]
            original_price = prod["original_price"]


            # Kiểm tra xem sản phẩm này có đang Flash Sale không
            flash_sale = await db["flash_sales"].find_one({"product_id": item["product_id"]})
            if flash_sale:
                try:
                    # Ép kiểu thời gian để so sánh
                    st = flash_sale["start_time"]
                    start_dt = datetime.fromisoformat(st.replace("Z", "")) if isinstance(st, str) else st
                    et = flash_sale["end_time"]
                    end_dt = datetime.fromisoformat(et.replace("Z", "")) if isinstance(et, str) else et
                    
                    if start_dt <= now <= end_dt:
                        final_price = flash_sale["sale_price"]
                except:
                    pass # Nếu lỗi ngày tháng thì dùng giá gốc


            item_revenue = final_price * item["quantity"]
            item_profit = (final_price - original_price) * item["quantity"]

            # Cộng dồn tổng tiền
            total += item_revenue
            total_profit += item_profit

            # Lưu "Ảnh chụp" thông tin sản phẩm lúc mua (Tránh việc sau này sửa tên/giá hoa làm đơn hàng cũ bị sai)
            items_processed.append({
                "product_id": item["product_id"],
                "product_name": prod.get("name", "Sản phẩm không tên"), # <-- LƯU TÊN SẢN PHẨM
                "quantity": item["quantity"],
                "price_at_purchase": final_price,
                 "original_price_at_purchase": original_price
            })

        # 3. Lấy tên tài khoản người đặt (Account Name)
        account_name = "Khách vãng lai"
        user_id = order_data.get("user_id")
        
        if user_id:
            # Tìm trong bảng users dựa trên ID gửi từ Frontend
            user = await db["users"].find_one({"_id": ObjectId(user_id)})
            if user:
                # Lấy displayName (tên lúc đăng ký), nếu không có thì lấy email
                account_name = user.get("displayName") or user.get("email") or "Thành viên Flora"

        # 4. Cấu trúc toàn bộ dữ liệu đơn hàng để lưu vào Database
        order_to_save = {
            "order_code": order_code,
            "user_id": user_id,
            "account_name": account_name,       # <-- LƯU TÊN NGƯỜI ĐẶT
            "customer_info": {
                "name": order_data["customer_info"]["name"],
                "phone": order_data["customer_info"]["phone"],
                "address": order_data["customer_info"]["address"]
            },
            "delivery_details": {
                "date": order_data["delivery_details"]["date"],
                "time_slot": order_data["delivery_details"]["time_slot"],
                "card_message": order_data["delivery_details"].get("card_message", "")
            },
            "items": items_processed,
            "total_amount": total,
            "total_profit": total_profit,
            "payment_method": order_data["payment_method"],
            "order_status": "pending",          # Trạng thái mặc định: Chờ duyệt
            "payment_status": "pending",        # Trạng thái mặc định: Chưa thanh toán
            "payment_receipt": None,            # Ảnh bill (khách sẽ gửi sau)
            "created_at": datetime.now()        # Thời gian đặt hàng
        }

        # 5. Thực hiện lưu vào MongoDB
        result = await db["orders"].insert_one(order_to_save)
        
        # 6. Trả về thông tin cho Frontend để hiện trang "Đặt hàng thành công"
        return {
            "_id": str(result.inserted_id),
            "order_code": order_code,
            "total_amount": total,
            "total_profit": total_profit,
            "status": "success"
        }
        
    except Exception as e:
        print(f"LỖI TẠO ĐƠN: {e}")
        raise HTTPException(status_code=500, detail="Có lỗi xảy ra khi xử lý đơn hàng")
    

# 2. Theo dõi đơn hàng (TrackingPage.tsx)
@router.get("/track")
async def track_order(phone: str, orderCode: str, db = Depends(get_db)):
    # Frontend gửi mã có dấu # (VD: #ABCXYZ), ta cần trim nó
    clean_code = orderCode.replace("#", "").strip()
    order = await db["orders"].find_one({
        "customer_info.phone": phone,
        "order_code": clean_code
    })
    if not order:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")
    order["_id"] = str(order["_id"])
    return order

# 3. Cập nhật ảnh biên lai (PATCH từ FE)
@router.patch("/{order_id}/receipt")
async def upload_receipt(order_id: str, receipt: UploadFile = File(...), db = Depends(get_db)):
    try:
        # 1. Tạo thư mục 'uploads' nếu chưa có
        upload_dir = "uploads"
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)

        # 2. Tạo tên file duy nhất (để không bị trùng)
        file_extension = receipt.filename.split(".")[-1]
        file_name = f"receipt_{order_id}.{file_extension}"
        file_path = os.path.join(upload_dir, file_name)

        # 3. Lưu file vào ổ cứng
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(receipt.file, buffer)

        # 4. Tạo đường dẫn URL (Link ảnh chạy trên localhost)
        # Lưu ý: Port 8000 là port của Backend
        file_url = f"http://localhost:8000/uploads/{file_name}"

        # 5. Cập nhật link này vào Database
        await db["orders"].update_one(
            {"_id": ObjectId(order_id)},
            {"$set": {"payment_receipt": file_url}}
        )

        return {"receiptUrl": file_url}
    except Exception as e:
        print(f"Lỗi lưu file: {e}")
        raise HTTPException(status_code=500, detail="Không thể lưu ảnh minh chứng")

# 4. Hủy đơn hàng
@router.put("/{order_id}/cancel")
async def cancel_order(order_id: str, db = Depends(get_db), current_user = Depends(get_current_user)):
    # BẢO MẬT: Kiểm tra xem đơn hàng này có đúng là của người đang yêu cầu hủy không
    order = await db["orders"].find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(404, "Không thấy đơn hàng")
    
    if order.get("user_id") != current_user.get("uid"):
        raise HTTPException(403, "Bạn không thể hủy đơn của người khác")

    result = await db["orders"].update_one(
        {"_id": ObjectId(order_id), "order_status": "pending"},
        {"$set": {"order_status": "cancelled"}}
    )
    return {"message": "Đã hủy"}

# Lấy danh sách đơn hàng của một người dùng cụ thể (Dùng cho trang Hành trình của hoa)
@router.get("/user/{user_id}")
async def get_user_orders(user_id: str, db = Depends(get_db), current_user = Depends(get_current_user)):
    # BẢO MẬT: Chỉ cho phép lấy đơn hàng nếu UID trong Token trùng với user_id trong URL
    if current_user.get("uid") != user_id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xem đơn hàng của người khác")
    
    cursor = db["orders"].find({"user_id": user_id}).sort("created_at", -1)
    orders = await cursor.to_list(length=100)
    for o in orders: o["_id"] = str(o["_id"])
    return orders
    
    # API LẤY LINK MÃ QR THANH TOÁN (CheckoutPage.tsx gọi API này)
@router.get("/payments/vietqr/{order_code}")
async def get_vietqr_link(order_code: str, db = Depends(get_db)):
    try:
        # 1. Tìm đơn hàng trong Database
        order = await db["orders"].find_one({"order_code": order_code})
        if not order:
            raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")

        # 2. CẤU HÌNH THÔNG TIN NGÂN HÀNG CỦA BẠN
        BANK_ID = os.getenv("VITE_BANK_ID")      # Mã ngân hàng (mbbank, vcb, tcb, icb...)
        ACCOUNT_NO = os.getenv("VITE_BANK_ACCOUNT_NO") # SỐ TÀI KHOẢN của bạn
        ACCOUNT_NAME = os.getenv("VITE_BANK_ACCOUNT_NAME") # TÊN TÀI KHOẢN (Viết hoa không dấu)

        amount = int(order["total_amount"])
        description = f"Flora {order_code}" # Nội dung chuyển khoản

        # 3. Tạo link ảnh QR theo chuẩn VietQR (sử dụng dịch vụ vietqr.io miễn phí)
        # compact2 là mẫu QR tối giản hiện số tiền và nội dung
        qr_url = f"https://img.vietqr.io/image/{BANK_ID}-{ACCOUNT_NO}-compact2.png?amount={amount}&addInfo={description}&accountName={ACCOUNT_NAME}"

        return {"qrUrl": qr_url}
    
    except Exception as e:
        print(f"Lỗi tạo QR: {e}")
        raise HTTPException(status_code=500, detail="Không thể tạo mã QR lúc này")
    
    # API lấy đơn hàng mới nhất của người dùng để điền sẵn thông tin (Auto-fill)
@router.get("/latest-info/{user_id}")
async def get_latest_order_info(user_id: str, db = Depends(get_db), current_user = Depends(get_current_user)):
    # Bảo mật: Chỉ chính chủ mới lấy được info của mình
    if current_user.get("uid") != user_id:
        raise HTTPException(status_code=403, detail="Không có quyền")

    # Tìm đơn hàng gần nhất, sắp xếp theo thời gian giảm dần
    latest_order = await db["orders"].find_one(
        {"user_id": user_id},
        sort=[("created_at", -1)]
    )
    
    if not latest_order:
        return None # Trả về rỗng nếu là khách mới chưa mua bao giờ
        
    return {
        "name": latest_order["customer_info"]["name"],
        "phone": latest_order["customer_info"]["phone"],
        "address": latest_order["customer_info"]["address"]
    }