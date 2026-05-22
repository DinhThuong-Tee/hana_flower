from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # --- Cấu hình Database ---
    MONGO_URL: str
    DATABASE_NAME: str
    PROJECT_NAME: str = "Flora API"

    # --- Cấu hình Bảo mật (MỚI) ---
    # Khai báo các biến này để Pydantic nạp được từ .env
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    PASSWORD_PEPPER: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # --- Cấu hình Ngân hàng (Để tránh lỗi Extra inputs) ---
    # Các biến bắt đầu bằng VITE_ thường của Frontend nhưng nếu để chung .env 
    # thì Backend cũng phải khai báo hoặc cho phép bỏ qua.
    VITE_BANK_ID: Optional[str] = None
    VITE_BANK_ACCOUNT_NO: Optional[str] = None
    VITE_BANK_ACCOUNT_NAME: Optional[str] = None

    # Cấu hình để nạp từ file .env và cho phép bỏ qua các biến thừa nếu cần
    model_config = SettingsConfigDict(
        env_file=".env", 
        extra="ignore"  # Dòng này cực kỳ quan trọng: Nó sẽ lờ đi các biến lạ khác
    )

settings = Settings()