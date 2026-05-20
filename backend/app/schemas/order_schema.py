from pydantic import BaseModel
from typing import List
from datetime import datetime

class OrderItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price_at_purchase: float

class OrderCreate(BaseModel):
    recipient_name: str
    recipient_phone: str
    shipping_address: str
    items: List[dict] # [{product_id, quantity}]

class OrderResponse(BaseModel):
    id: str
    created_at: datetime
    status: str
    total_amount: float
    items: List[OrderItem]