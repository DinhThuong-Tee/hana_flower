from fastapi import APIRouter, Depends , Body , HTTPException , Header
from app.core.security import decode_access_token
from typing import Optional
from app.core.database import get_db
from datetime import datetime
from bson import ObjectId

router = APIRouter()

async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        print("LỖI BE: Không tìm thấy Header Authorization")
        raise HTTPException(status_code=401, detail="Yêu cầu đăng nhập")
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != 'bearer':
            raise ValueError("Invalid scheme")
            
        payload = decode_access_token(token)
        if not payload:
            print("LỖI BE: Token không thể giải mã (Sai Key hoặc hết hạn)")
            raise HTTPException(status_code=401, detail="Phiên đăng nhập hết hạn")
            
        return payload
    except Exception as e:
        print(f"LỖI BE: {e}")
        raise HTTPException(status_code=401, detail="Token không hợp lệ")

@router.get("/homepage")
async def get_homepage_reviews(db = Depends(get_db)):
    # Lấy review đã được duyệt để hiện trang chủ
    reviews = await db["reviews"].find({"show_on_homepage": True}).to_list(10)
    for r in reviews: r["_id"] = str(r["_id"])
    return reviews

@router.get("/latest")
async def get_latest_reviews(db = Depends(get_db)):
    # Trả về mảng rỗng nếu chưa có review nào để tránh crash Frontend
    reviews = await db["reviews"].find({"is_approved": True}).sort("created_at", -1).to_list(10)
    for r in reviews:
        r["_id"] = str(r["_id"])
    return reviews

@router.get("/{product_id}")
async def get_product_reviews(product_id: str, db = Depends(get_db)):
    # Frontend dùng cho ProductPage
    reviews = await db["reviews"].find({"product_id": product_id, "is_approved": True}).to_list(50)
    for r in reviews: r["_id"] = str(r["_id"])
    return reviews

@router.post("/")
async def create_review(payload: dict = Body(...), db = Depends(get_db), current_user = Depends(get_current_user)):
    try:
        # 1. Tìm thông tin người dùng từ bảng 'users' bằng ID trong Token
        user = await db["users"].find_one({"_id": ObjectId(current_user.get("uid"))})
        
        # Lấy tên hiển thị của tài khoản, nếu không có mới lấy email, cuối cùng mới dùng mặc định
        real_account_name = user.get("displayName") or user.get("email") or "Người dùng Hana"

        # 2. Kiểm tra đánh giá trùng (giữ nguyên logic cũ)
        existing = await db["reviews"].find_one({
            "order_id": payload.get("order_id"),
            "product_id": payload.get("product_id")
        })
        if existing:
            raise HTTPException(status_code=400, detail="Bạn đã đánh giá rồi")

        # 3. Lưu đánh giá với TÊN TÀI KHOẢN THẬT
        new_review = {
            "product_id": payload.get("product_id"),
            "order_id": payload.get("order_id"),
            "user_id": current_user.get("uid"),
            "user_name": real_account_name, # <-- LƯU TÊN TÀI KHOẢN Ở ĐÂY
            "rating": payload.get("rating"),
            "comment": payload.get("comment"),
            "is_approved": False,
            "created_at": datetime.now()
        }
        
        await db["reviews"].insert_one(new_review)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 3. BỔ SUNG: API lấy đánh giá theo đơn hàng (Để hiện ra ở chi tiết đơn hàng)
@router.get("/order/{order_id}")
async def get_reviews_by_order(order_id: str, db = Depends(get_db)):
    reviews = await db["reviews"].find({"order_id": order_id}).to_list(100)
    for r in reviews:
        r["_id"] = str(r["_id"])
    return reviews