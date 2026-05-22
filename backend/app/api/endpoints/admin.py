from fastapi import APIRouter, Depends, Body , HTTPException, Header
from tifffile import product
from app.core.database import get_db
from bson import ObjectId
from typing import Optional
from datetime import datetime, timedelta
from app.core.security import decode_access_token

router = APIRouter()

async def get_current_admin(authorization: Optional[str] = Header(None)):
    """
    Hàm kiểm tra Token gửi từ Frontend. 
    Nếu Token hợp lệ và có quyền 'admin' thì mới cho phép đi tiếp.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Yêu cầu đăng nhập quản trị")
    
    token = authorization.split(" ")[1]
    payload = decode_access_token(token) # Giải mã chuỗi hash
    
    if not payload:
        raise HTTPException(status_code=401, detail="Phiên làm việc hết hạn")
    
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bạn không có quyền truy cập vùng này")
    
    return payload

# 1. API lấy thống kê (Stats)
@router.get("/stats")
async def get_admin_stats(db = Depends(get_db)):
    seven_days_ago = datetime.now() - timedelta(days=7)
    
    # 1. Lấy dữ liệu 7 ngày qua cho biểu đồ Doanh thu & Lợi nhuận
    daily_data = await db["orders"].aggregate([
        {
            "$match": {
                "order_status": "completed",
                "created_at": {"$gte": seven_days_ago}
            }
        },
        {
            "$group": {
                "_id": {"$dateToString": {"format": "%d/%m", "date": "$created_at"}},
                "revenue": {"$sum": "$total_amount"},
                "profit": {"$sum": "$total_profit"}
            }
        },
        {"$sort": {"_id": 1}},
        {"$project": {"date": "$_id", "revenue": 1, "profit": 1, "_id": 0}}
    ]).to_list(10)

    # 2. Lấy dữ liệu phân bổ sản phẩm theo danh mục
    category_data = await db["products"].aggregate([
        {"$unwind": "$categories"},
        {"$group": {"_id": "$categories", "count": {"$sum": 1}}},
        {"$project": {"name": "$_id", "value": "$count", "_id": 0}}
    ]).to_list(100)

    # 3. Tính tổng số liệu tổng quát
    total_rev = sum(d['revenue'] for d in daily_data)
    total_profit = sum(d['profit'] for d in daily_data)
    active_orders = await db["orders"].count_documents({"order_status": {"$in": ["pending", "shipping"]}})
    total_products = await db["products"].count_documents({})

    return {
        "totalRev": total_rev,
        "totalProfit": total_profit,
        "dailyStats": daily_data,      # <--- Key này phải khớp với data={detailedStats.dailyStats}
        "categoryStats": category_data, # <--- Key này phải khớp với data={detailedStats.categoryStats}
        "activeOrders": active_orders,
        "totalProducts": total_products,
        "completionRate": 100.0
    }

# 2. API lấy danh sách toàn bộ đơn hàng
@router.get("/orders")
async def get_admin_orders(db = Depends(get_db)):
    orders = await db["orders"].find().sort("created_at", -1).to_list(100)
    for o in orders:
        o["_id"] = str(o["_id"])
    return orders

# 3. API lấy danh sách toàn bộ đánh giá
@router.get("/reviews")
async def get_admin_reviews(db = Depends(get_db)):
    # Chỉ lấy những đánh giá mà trường 'hidden_from_admin' KHÔNG PHẢI là True
    reviews = await db["reviews"].find({
        "hidden_from_admin": {"$ne": True}
    }).sort("created_at", -1).to_list(100)
    
    for r in reviews:
        r["_id"] = str(r["_id"])
    return reviews

# 4. API THÊM SẢN PHẨM (Nút "Lưu Tác Phẩm" gọi API này)
@router.post("/products")
async def add_product(product: dict = Body(...), db = Depends(get_db), admin = Depends(get_current_admin)):
    if product.get("price", 0) < 0 or product.get("original_price", 0) < 0:
        raise HTTPException(status_code=400, detail="Giá sản phẩm không được là số âm")
        product["created_at"] = datetime.now()
    result = await db["products"].insert_one(product)
    return {"status": "success", "id": str(result.inserted_id)}

@router.post("/flash-sales")
async def add_flash_sale(data: dict = Body(...), db = Depends(get_db), admin = Depends(get_current_admin)):
    # Chuẩn hóa dữ liệu thời gian (Vì FE gửi chuỗi ISO)
    # Ví dụ: data['start_time'] = "2026-05-19T03:08"
    
    # Lưu vào collection flash_sales
    result = await db["flash_sales"].insert_one(data)
    
    # Cập nhật giá này vào sản phẩm nếu cần hoặc chỉ để collection riêng
    # Thông thường Flash Sale sẽ được lưu riêng để đối chiếu thời gian
    
    return {"status": "success", "id": str(result.inserted_id)}

@router.put("/flash-sales/{fs_id}")
async def update_flash_sale(fs_id: str, data: dict = Body(...), db = Depends(get_db), admin = Depends(get_current_admin)):
    if "_id" in data: del data["_id"]
    await db["flash_sales"].update_one({"_id": ObjectId(fs_id)}, {"$set": data})
    return {"status": "success"}

# API để xóa Flash Sale (Frontend có nút Trash)
@router.delete("/flash-sales/{id}")
async def delete_flash_sale(id: str, db = Depends(get_db)):
    await db["flash_sales"].delete_one({"_id": ObjectId(id)})
    return {"status": "deleted"}

@router.patch("/orders/{order_id}/status")
async def update_order_status(order_id: str, payload: dict = Body(...), db = Depends(get_db)):
    try:
        # Lấy trạng thái mới từ Frontend gửi lên (ví dụ: {"status": "cancelled"})
        new_status = payload.get("status")
        
        if not new_status:
            raise HTTPException(status_code=400, detail="Thiếu thông tin trạng thái")

        # Cập nhật trong MongoDB
        result = await db["orders"].update_one(
            {"_id": ObjectId(order_id)},
            {"$set": {"order_status": new_status}}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")

        return {"message": "Cập nhật trạng thái thành công", "status": new_status}
    
    except Exception as e:
        print(f"Lỗi cập nhật đơn hàng: {e}")
        raise HTTPException(status_code=500, detail="Lỗi hệ thống khi cập nhật")
    
    # API DUYỆT ĐÁNH GIÁ (AdminPage.tsx gọi hàm toggleReviewStatus)
@router.patch("/reviews/{review_id}/status")
async def update_review_status(review_id: str, payload: dict = Body(...), db = Depends(get_db)):
    try:
        # Lấy trạng thái duyệt mới từ Frontend (True hoặc False)
        new_status = payload.get("is_approved")
        
        # Cập nhật trong MongoDB
        result = await db["reviews"].update_one(
            {"_id": ObjectId(review_id)},
            {"$set": {"is_approved": new_status}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Không tìm thấy đánh giá")
            
        return {"message": "Cập nhật trạng thái đánh giá thành công", "is_approved": new_status}
    
    except Exception as e:
        print(f"Lỗi duyệt đánh giá: {e}")
        raise HTTPException(status_code=500, detail="Lỗi hệ thống")

# API XÓA ĐÁNH GIÁ (Nút thùng rác trong trang Admin)
@router.delete("/reviews/{review_id}")
async def hide_review_from_admin(review_id: str, db = Depends(get_db)):
    try:
        # Thay vì xóa, chúng ta cập nhật trường hidden_from_admin thành True
        result = await db["reviews"].update_one(
            {"_id": ObjectId(review_id)},
            {"$set": {"hidden_from_admin": True,
                      "is_approved": False}}  # Đồng thời đảm bảo đánh giá không được duyệt
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Không tìm thấy đánh giá")
            
        return {"message": "Đã ẩn đánh giá khỏi danh sách quản trị"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    # API XÓA SẢN PHẨM (AdminPage.tsx gọi hàm deleteProduct)
@router.delete("/products/{product_id}")
async def delete_product(product_id: str, db = Depends(get_db)):
    try:
        # 1. Thực hiện xóa sản phẩm trong collection 'products'
        result = await db["products"].delete_one({"_id": ObjectId(product_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm để xóa")
        
        # 2. (Tùy chọn) Xóa luôn các đợt Flash Sale liên quan đến sản phẩm này để sạch DB
        await db["flash_sales"].delete_many({"product_id": product_id})
        
        return {"message": "Đã xóa sản phẩm thành công"}
        
    except Exception as e:
        print(f"Lỗi khi xóa sản phẩm: {e}")
        raise HTTPException(status_code=500, detail="Lỗi hệ thống khi xóa sản phẩm")
    
    # API CẬP NHẬT THÔNG TIN SẢN PHẨM
@router.put("/products/{product_id}")
async def update_product(product_id: str, data: dict = Body(...), db = Depends(get_db), admin = Depends(get_current_admin)):
    try:
        if data.get("price", 0) < 0 or data.get("original_price", 0) < 0:
            raise HTTPException(status_code=400, detail="Giá sản phẩm không được là số âm")
    

        if "_id" in data:
            del data["_id"]
            
        result = await db["products"].update_one(
            {"_id": ObjectId(product_id)},
            {"$set": data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm")
            
        return {"status": "success", "message": "Cập nhật thành công"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    # API CẬP NHẬT TRẠNG THÁI CÒN HÀNG/HẾT HÀNG (AdminPage.tsx gọi hàm toggleStock)
@router.patch("/products/{product_id}/stock")
async def toggle_product_stock(product_id: str, payload: dict = Body(...), db = Depends(get_db)):
    try:
        # Lấy giá trị is_stock mới từ Frontend gửi lên
        new_stock_status = payload.get("is_stock")
        
        # Cập nhật vào MongoDB
        result = await db["products"].update_one(
            {"_id": ObjectId(product_id)},
            {"$set": {"is_stock": new_stock_status}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm")
            
        return {"message": "Cập nhật kho hàng thành công", "is_stock": new_stock_status}
    except Exception as e:
        print(f"Lỗi cập nhật kho: {e}")
        raise HTTPException(status_code=500, detail="Lỗi hệ thống")
    
    # API lấy đánh giá của một đơn hàng cụ thể để hiện trong Modal chi tiết
@router.get("/reviews/order/{order_id}")
async def get_order_review(order_id: str, db = Depends(get_db)):
    reviews = await db["reviews"].find({"order_id": order_id}).to_list(100)
    for r in reviews:
        r["_id"] = str(r["_id"])
    return reviews

# API CẬP NHẬT TRẠNG THÁI THANH TOÁN (AdminPage.tsx gọi)
@router.patch("/orders/{order_id}/payment-status")
async def update_payment_status(order_id: str, payload: dict = Body(...), db = Depends(get_db), admin = Depends(get_current_admin)):
    try:
        new_status = payload.get("payment_status") # 'paid' hoặc 'pending'
        
        result = await db["orders"].update_one(
            {"_id": ObjectId(order_id)},
            {"$set": {"payment_status": new_status}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")
            
        return {"message": "Cập nhật trạng thái thanh toán thành công", "payment_status": new_status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))