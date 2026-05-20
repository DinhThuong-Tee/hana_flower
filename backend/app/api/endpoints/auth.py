from fastapi import APIRouter, HTTPException, Depends
from app.core.database import get_db
from pydantic import BaseModel

router = APIRouter()

class AuthSchema(BaseModel):
    email: str
    password: str
    displayName: str = None

@router.post("/login")
async def login(data: AuthSchema, db = Depends(get_db)):
    user = await db["users"].find_one({"email": data.email, "password": data.password})
    if not user:
        raise HTTPException(status_code=401, detail="Sai email hoặc mật khẩu")
    return {"uid": str(user["_id"]), "email": user["email"], "displayName": user.get("displayName"), "role": user.get("role", "user")}

@router.post("/register")
async def register(data: AuthSchema, db = Depends(get_db)):
    # Kiểm tra email tồn tại chưa
    existing = await db["users"].find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email đã tồn tại")
    
    new_user = {
        "email": data.email,
        "password": data.password,
        "displayName": data.displayName,
        "role": "user"
    }
    result = await db["users"].insert_one(new_user)
    return {"uid": str(result.inserted_id), "email": data.email, "displayName": data.displayName, "role": "user"}