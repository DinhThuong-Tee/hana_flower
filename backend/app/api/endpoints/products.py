from fastapi import APIRouter, Depends , HTTPException
from app.core.database import get_db
from app.models.product import ProductModel
from bson import ObjectId

router = APIRouter()

@router.get("/")
async def list_products(db = Depends(get_db)):
    products = await db["products"].find().to_list(100)
    for p in products: p["_id"] = str(p["_id"])
    return products

@router.patch("/{id}/toggle")
async def toggle_product(id: str, db = Depends(get_db)):
    product = await db["products"].find_one({"_id": ObjectId(id)})
    new_status = not product["is_available"]
    await db["products"].update_one({"_id": ObjectId(id)}, {"$set": {"is_available": new_status}})
    return {"status": "updated", "is_available": new_status}

@router.get("/{id}")
async def get_product_detail(id: str, db = Depends(get_db)):
    try:
        # Tìm sản phẩm theo ID trong MongoDB
        product = await db["products"].find_one({"_id": ObjectId(id)})
        
        if not product:
            raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm này")
        
        # Chuyển ObjectId thành chuỗi để trả về cho Frontend
        product["_id"] = str(product["_id"])
        return product
    except Exception as e:
        # Nếu ID gửi lên sai định dạng ObjectId, sẽ văng lỗi ở đây
        raise HTTPException(status_code=400, detail="ID sản phẩm không hợp lệ")