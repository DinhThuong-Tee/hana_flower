from fastapi import APIRouter, Depends, Body
from app.core.database import get_db
from typing import List, Any

router = APIRouter()

# Lấy giỏ hàng của người dùng (Frontend gọi khi load trang)
@router.get("/")
async def get_cart(userId: str, db = Depends(get_db)):
    cart = await db["carts"].find_one({"userId": userId})
    if cart:
        return cart.get("items", [])
    return []

# Lưu giỏ hàng (Frontend gọi mỗi khi thêm/sửa/xóa sản phẩm)
@router.post("/")
async def save_cart(payload: dict = Body(...), db = Depends(get_db)):
    user_id = payload.get("userId")
    items = payload.get("items", [])
    
    # Cập nhật nếu đã có giỏ hàng, nếu chưa có thì tạo mới (upsert)
    await db["carts"].update_one(
        {"userId": user_id},
        {"$set": {"items": items}},
        upsert=True
    )
    return {"status": "success"}