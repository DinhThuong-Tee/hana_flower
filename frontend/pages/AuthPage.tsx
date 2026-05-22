import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Flower2,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "../utils/cn";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const { loginWithEmail, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate email format manually as requested
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error("Định dạng email không hợp lệ (ví dụ: ten@gmail.com).");
      }

      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        if (!name.trim()) throw new Error("Vui lòng nhập tên của bạn");
        await register(email, password, name);
      }

      const callbackPath = localStorage.getItem("hana_login_callback");

      if (callbackPath) {
        // Xóa dấu vết callback để không bị lặp lại lần sau
        localStorage.removeItem("hana_login_callback");
        // Nhảy thẳng tới trang chi tiết sản phẩm khách vừa nhấn
        navigate(callbackPath, { replace: true });
      } else {
        // Nếu không có, quay lại trang trước đó hoặc trang chủ
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-paper flex items-center justify-center p-6 py-20">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 bg-white rounded-[40px] shadow-2xl overflow-hidden border border-border-beige">
        {/* Left Side: Illustration & Text */}
        <div className="hidden md:flex flex-col justify-center p-12 bg-primary relative overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-[-5%] left-[-5%] w-48 h-48 bg-accent/10 rounded-full blur-2xl" />

          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8">
              <Flower2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-serif italic text-white mb-6 leading-tight">
              {isLogin
                ? "Chào mừng bạn quay trở lại với FLORA"
                : "Khởi đầu hành trình yêu thương cùng FLORA"}
            </h1>
            <p className="text-white/70 text-sm leading-loose tracking-wide">
              {isLogin
                ? "Đăng nhập để theo dõi đơn hàng và nhận những ưu đãi đặc biệt dành riêng cho thành viên."
                : "Tham gia cùng chúng tôi để lưu giữ những khoảnh khắc đẹp qua những đóa hoa tinh tế nhất."}
            </p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-2xl font-serif italic text-primary mb-2">
              {isLogin ? "Đăng Nhập" : "Đăng Ký Tài Khoản"}
            </h2>
            <p className="text-ink/40 text-xs uppercase tracking-[0.2em]">
              {isLogin
                ? "Vui lòng nhập thông tin của bạn"
                : "Tạo tài khoản mới hôm nay"}
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-semibold flex items-center gap-2 border border-red-100"
            >
              <div className="w-1 h-1 bg-red-600 rounded-full shrink-0" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-ink/40 ml-4">
                  Họ và tên
                </label>
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/20 group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#F5F2EA] border-none rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 ring-primary/20 transition-all outline-none"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-ink/40 ml-4">
                Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/20 group-focus-within:text-primary transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#F5F2EA] border-none rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 ring-primary/20 transition-all outline-none"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-ink/40">
                  Mật khẩu
                </label>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/20 group-focus-within:text-primary transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#F5F2EA] border-none rounded-2xl py-4 pl-12 pr-12 text-sm focus:ring-2 ring-primary/20 transition-all outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-ink/20 hover:text-primary transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:translate-y-0"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {isLogin ? "Đăng Nhập" : "Tạo Tài Khoản"}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-ink/40 font-medium">
              {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-bold hover:underline"
              >
                {isLogin ? "Đăng ký ngay" : "Đăng nhập tại đây"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
