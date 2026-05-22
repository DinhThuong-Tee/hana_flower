from fastapi import APIRouter, HTTPException, Depends, Body
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from bson import ObjectId # Đảm bảo có dòng này
from datetime import datetime

from app.api.endpoints.reviews import get_current_user


router = APIRouter()

@router.post("/register")
async def register(data: dict = Body(...), db = Depends(get_db)):
    try:
        # 1. Kiểm tra các trường bắt buộc
        email = data.get("email")
        password = data.get("password")
        display_name = data.get("displayName")

        if not email or not password:
            raise HTTPException(status_code=400, detail="Thiếu email hoặc mật khẩu")

        # 2. Kiểm tra email tồn tại
        existing_user = await db["users"].find_one({"email": email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email này đã được sử dụng")
        
        # 3. Hash mật khẩu kèm Pepper (Bảo mật Bcrypt)
        hashed_password = hash_password(password)
        
        new_user = {
            "email": email,
            "password": hashed_password,
            "displayName": display_name or email.split('@')[0],
            "role": "user",
            "created_at": datetime.now()
        }
        
        # 4. Lưu vào Database
        result = await db["users"].insert_one(new_user)
        user_id_str = str(result.inserted_id) # QUAN TRỌNG: Chuyển ObjectId sang chuỗi
        
        # 5. Tạo Token JWT cho phiên đăng nhập mới
        token = create_access_token({"uid": user_id_str, "role": "user"})
        
        # 6. Trả về đúng định dạng Frontend cần
        return {
            "token": token,
            "uid": user_id_str,
            "displayName": new_user["displayName"],
            "role": "user"
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"LỖI ĐĂNG KÝ: {e}") # Xem lỗi ở terminal backend
        raise HTTPException(status_code=500, detail="Lỗi hệ thống khi đăng ký")

@router.post("/login")
async def login(data: dict = Body(...), db = Depends(get_db)):
    try:
        user = await db["users"].find_one({"email": data.get("email")})
        
        if not user or not verify_password(data.get("password"), user["password"]):
            raise HTTPException(status_code=401, detail="Tài khoản hoặc mật khẩu không chính xác")
        
        user_id_str = str(user["_id"]) # QUAN TRỌNG: Chuyển ObjectId sang chuỗi
        token = create_access_token({"uid": user_id_str, "role": user.get("role", "user")})
        
        return {
            "token": token,
            "uid": user_id_str,
            "displayName": user.get("displayName"),
            "role": user.get("role", "user")
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"LỖI ĐĂNG NHẬP: {e}")
        raise HTTPException(status_code=500, detail="Lỗi hệ thống khi đăng nhập")
    
    # API lấy thông tin chi tiết tài khoản đang đăng nhập
@router.get("/me")
async def get_me(db = Depends(get_db), current_user = Depends(get_current_user)):
    user = await db["users"].find_one({"_id": ObjectId(current_user.get("uid"))})
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    
    return {
        "uid": str(user["_id"]),
        "email": user["email"],
        "displayName": user.get("displayName", "Người dùng Flora"),
        "role": user.get("role", "user"),
        "created_at": user.get("created_at")
    }

# API cập nhật thông tin (Tên hiển thị)
@router.put("/update")
async def update_profile(data: dict = Body(...), db = Depends(get_db), current_user = Depends(get_current_user)):
    new_name = data.get("displayName")
    await db["users"].update_one(
        {"_id": ObjectId(current_user.get("uid"))},
        {"$set": {"displayName": new_name}}
    )
    return {"message": "Cập nhật thành công", "displayName": new_name}


# API ĐỔI MẬT KHẨU
@router.put("/change-password")
async def change_password(data: dict = Body(...), db = Depends(get_db), current_user = Depends(get_current_user)):
    try:
        old_password = data.get("oldPassword")
        new_password = data.get("newPassword")

        if not old_password or not new_password:
            raise HTTPException(status_code=400, detail="Vui lòng nhập đầy đủ thông tin")

        # 1. Tìm người dùng trong DB
        user = await db["users"].find_one({"_id": ObjectId(current_user.get("uid"))})
        
        # 2. Kiểm tra mật khẩu cũ có đúng không (Sử dụng Bcrypt + Pepper)
        if not verify_password(old_password, user["password"]):
            raise HTTPException(status_code=400, detail="Mật khẩu hiện tại không chính xác")

        # 3. Mã hóa mật khẩu mới
        hashed_new_password = hash_password(new_password)

        # 4. Cập nhật vào Database
        await db["users"].update_one(
            {"_id": ObjectId(current_user.get("uid"))},
            {"$set": {"password": hashed_new_password}}
        )

        return {"message": "Đổi mật khẩu thành công"}
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Lỗi đổi mật khẩu: {e}")
        raise HTTPException(status_code=500, detail="Lỗi hệ thống")