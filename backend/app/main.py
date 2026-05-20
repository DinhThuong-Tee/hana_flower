from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api.router import api_router
from app.core.database import connect_to_mongo, close_mongo_connection

# Sử dụng lifespan để quản lý kết nối Database (thay cho on_event)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Chạy khi bắt đầu app
    await connect_to_mongo()
    yield
    # Chạy khi tắt app
    await close_mongo_connection()

app = FastAPI(
    title="HanaFlower API",
    description="Backend cho tiệm hoa HanaFlower",
    version="1.0.0",
    lifespan=lifespan
)

# 1. CẤU HÌNH CORS (BẮT BUỘC)
# Cho phép Frontend gọi API từ các domain khác nhau (ví dụ: localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Trong thực tế hãy thay ["http://localhost:5173"] để bảo mật
    allow_credentials=True,
    allow_methods=["*"],  # Cho phép tất cả các phương thức GET, POST, PUT, DELETE, PATCH
    allow_headers=["*"],  # Cho phép tất cả các headers
)

# 2. ĐƯA CÁC ROUTES VÀO APP
# Prefix /api sẽ làm cho các đường dẫn thành: /api/products, /api/orders, ...
app.include_router(api_router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Welcome to HanaFlower API",
        "docs": "/docs"  # Đường dẫn xem tài liệu API
    }