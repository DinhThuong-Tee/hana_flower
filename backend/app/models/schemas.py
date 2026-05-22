from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v): raise ValueError("Invalid objectid")
        return str(v)

# --- PRODUCT ---
class ProductModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str
    price: float
    original_price: float
    description: str
    images: List[str]  # Frontend dùng mảng images
    categories: List[str]
    is_stock: bool = True # Frontend dùng is_stock thay vì is_available

# --- ORDER ---
class CustomerInfo(BaseModel):
    name: str
    phone: str
    address: str

class DeliveryDetails(BaseModel):
    date: str
    time_slot: str
    card_message: Optional[str] = ""

class OrderItem(BaseModel):
    product_id: str
    quantity: int
    price_at_purchase: float

class OrderModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    order_code: str # Mã đơn hàng hiển thị cho khách (VD: #FLORA123)
    user_id: Optional[str] = None
    customer_info: CustomerInfo
    delivery_details: DeliveryDetails
    items: List[OrderItem]
    total_amount: float
    total_profit: float = 0
    payment_method: str # 'vietqr' hoặc 'cod'
    payment_status: str = "pending"
    order_status: str = "pending" # pending, shipping, completed, cancelled
    payment_receipt: Optional[str] = None # URL ảnh bill
    created_at: datetime = Field(default_factory=datetime.now)

# --- FLASH SALE ---
class FlashSaleModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    product_id: str
    sale_price: float
    start_time: datetime
    end_time: datetime