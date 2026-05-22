import os
import hashlib  # Dùng để xử lý lỗi 72 bytes
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
PEPPER = os.getenv("PASSWORD_PEPPER", "Flora_Default_Pepper")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))

# Cấu hình Bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def _get_password_hash_input(password: str) -> str:
    """
    Kết hợp password + pepper và băm SHA256 trước.
    SHA256 luôn ra 64 ký tự (dưới 72 bytes), giúp Bcrypt không bao giờ bị lỗi.
    """
    combined = password + PEPPER
    return hashlib.sha256(combined.encode()).hexdigest()

def hash_password(password: str) -> str:
    return pwd_context.hash(_get_password_hash_input(password))

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(_get_password_hash_input(plain_password), hashed_password)
    except Exception as e:
        print(f"Lỗi verify: {e}")
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str):
    try:
        # Giải mã JWT bằng SECRET_KEY đã cấu hình trong .env
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except:
        return None