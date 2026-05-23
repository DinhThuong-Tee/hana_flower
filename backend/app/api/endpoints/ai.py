import os
import google.generativeai as genai
from fastapi import APIRouter, Body, HTTPException
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

# --- ĐOẠN CODE KIỂM TRA MODEL ---
try:
    print("--- Danh sách Model bạn có thể dùng: ---")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"ID: {m.name}")
except Exception as e:
    print(f"Không thể lấy danh sách model: {e}")
# -------------------------------

@router.post("/generate-description")
async def generate_description(payload: dict = Body(...)):
    flower_name = payload.get("name")
    if not flower_name:
        raise HTTPException(status_code=400, detail="Vui lòng nhập tên hoa")

    # SỬA TẠI ĐÂY: Dùng tên 'gemini-1.5-flash' hoặc 'gemini-1.5-pro'
    # Lưu ý: Không thêm chữ 'models/' vào trước nếu dùng thư viện mới
    try:
        model = genai.GenerativeModel('gemini-2.5-flash') 
        
        prompt = f"Viết mô tả ngắn (3 câu) nghệ thuật, sang trọng cho hoa '{flower_name}'. Chỉ trả về nội dung mô tả."
        
        response = model.generate_content(prompt)
        return {"description": response.text.strip()}
    
    except Exception as e:
        print(f"❌ LỖI GEMINI: {str(e)}")
        # Nếu vẫn lỗi 404, hãy thử đổi tên model thành 'gemini-pro' (bản 1.0 ổn định)
        raise HTTPException(status_code=500, detail=f"AI đang bận: {str(e)}")

@router.post("/generate-card-message")
async def generate_card_message(payload: dict = Body(...)):
    recipient = payload.get("recipient", "người thân")
    occasion = payload.get("occasion", "dịp đặc biệt")
    tone = payload.get("tone", "ngọt ngào")
    
    prompt = f"Viết lời chúc tặng hoa ngắn gọn cho {recipient} dịp {occasion}, phong cách {tone}. Chỉ trả về nội dung lời chúc."
    
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        return {"message": response.text.strip()}
    except Exception as e:
        print(f"❌ LỖI GEMINI (Thiệp): {str(e)}")
        raise HTTPException(status_code=500, detail="AI đang bận")