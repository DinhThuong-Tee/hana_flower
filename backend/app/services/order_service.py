from bson import ObjectId
from fastapi import HTTPException

async def process_order(db, order_data):
    total_price = 0
    order_items = []
    
    for item in order_data.items:
        product = await db["products"].find_one({"_id": ObjectId(item["product_id"])})
        if not product or not product.get("is_available"):
            raise HTTPException(status_code=400, detail=f"Sản phẩm {item['product_id']} không sẵn sàng")
        
        # Tính toán snapshot giá
        price = product["price"]
        total_price += price * item["quantity"]
        
        order_items.append({
            "product_id": item["product_id"],
            "product_name": product["name"],
            "quantity": item["quantity"],
            "price_at_purchase": price
        })
    
    return order_items, total_price