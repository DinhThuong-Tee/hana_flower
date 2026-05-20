-----BACKEND
# 1. Di chuyển vào thư mục backend
cd backend

# 2. Kích hoạt môi trường ảo (nếu bạn có tạo venv)
# .\venv\Scripts\activate

# 3. Cài đặt thư viện (nếu là lần đầu chạy)
pip install -r requirements.txt

# 4. Câu lệnh chạy Backend
python -m uvicorn app.main:app --reload
Địa chỉ truy cập: http://localhost:8000
Tài liệu API: http://localhost:8000/docs


-----FRONTEND
# 1. Di chuyển vào thư mục frontend
cd frontend

# 2. Cài đặt các gói thư viện (nếu là lần đầu chạy)
npm install

# 3. Câu lệnh chạy Frontend
npm run dev
Địa chỉ truy cập: http://localhost:5173