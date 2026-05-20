from fastapi import APIRouter, Depends
from app.core.database import get_db
from datetime import datetime
from bson import ObjectId

router = APIRouter()

@router.get("/active")
async def get_active_flash_sales(db = Depends(get_db)):
    now = datetime.now() # Giờ máy tính hiện tại
    print(f"--- Đang kiểm tra Flash Sale lúc: {now} ---") # Xem ở terminal backend
    
    cursor = db["flash_sales"].find()
    all_sales = await cursor.to_list(length=100)
    
    active_sales = []
    for s in all_sales:
        try:
            # Chuyển đổi chuỗi ISO từ Frontend thành đối tượng thời gian Python
            # FE gửi: "2026-05-19T03:08" -> Python cần xử lý
            start = datetime.fromisoformat(s["start_time"].replace("Z", ""))
            end = datetime.fromisoformat(s["end_time"].replace("Z", ""))
            
            print(f"Kiểm tra Sale: {s.get('product_id')} | Start: {start} | End: {end}")
            
            if start <= now <= end:
                s["_id"] = str(s["_id"])
                active_sales.append(s)
                print("=> TRẠNG THÁI: ĐANG HOẠT ĐỘNG")
            else:
                print("=> TRẠNG THÁI: HẾT HẠN HOẶC CHƯA TỚI GIỜ")
        except Exception as e:
            print(f"Lỗi định dạng ngày tháng: {e}")
            continue
            
    return active_sales

@router.get("/")
async def get_all_flash_sales(db = Depends(get_db)):
    sales = await db["flash_sales"].find().to_list(100)
    for s in sales: s["_id"] = str(s["_id"])
    return sales