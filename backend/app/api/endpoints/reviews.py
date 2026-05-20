from fastapi import APIRouter, Depends , Body , HTTPException
from app.core.database import get_db
from datetime import datetime

router = APIRouter()

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
async def create_review(payload: dict = Body(...), db = Depends(get_db)):
    try:
        order_id = payload.get("order_id")
        product_id = payload.get("product_id")

        # 1. KIỂM TRA: Nếu đã có đánh giá cho sản phẩm này trong đơn hàng này rồi
        existing_review = await db["reviews"].find_one({
            "order_id": order_id,
            "product_id": product_id
        })
        
        if existing_review:
            raise HTTPException(status_code=400, detail="Bạn đã đánh giá sản phẩm này cho đơn hàng này rồi.")

        # 2. Lưu đánh giá mới
        new_review = {
            "product_id": product_id,
            "order_id": order_id,
            "user_name": payload.get("user_name"),
            "rating": payload.get("rating"),
            "comment": payload.get("comment"),
            "is_approved": False,
            "created_at": datetime.now()
        }
        
        result = await db["reviews"].insert_one(new_review)
        return {"status": "success", "id": str(result.inserted_id)}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 3. BỔ SUNG: API lấy đánh giá theo đơn hàng (Để hiện ra ở chi tiết đơn hàng)
@router.get("/order/{order_id}")
async def get_reviews_by_order(order_id: str, db = Depends(get_db)):
    reviews = await db["reviews"].find({"order_id": order_id}).to_list(100)
    for r in reviews:
        r["_id"] = str(r["_id"])
    return reviews