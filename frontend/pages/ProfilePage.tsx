import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  Mail,
  ShieldCheck,
  Calendar,
  Edit3,
  Save,
  LogOut,
  CheckCircle2,
  XCircle,
  Lock,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "../utils/cn";
import { Link, useNavigate } from "react-router-dom";
import { useUI } from "../contexts/UIContext";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { showModal } = useUI();
  const { profile, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(profile?.displayName || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isChangingPass, setIsAddingPass] = useState(false);
  const [passData, setPassData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [popup, setPopup] = useState<{
    title: string;
    message: string;
    type: "success" | "error";
  } | null>(null);

  const getAuthHeader = () => ({
    Authorization: `Bearer ${localStorage.getItem("flora_token")}`,
    "Content-Type": "application/json",
  });

  const handleUpdate = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/update", {
        method: "PUT",
        headers: getAuthHeader(),
        body: JSON.stringify({ displayName: newName }),
      });
      if (res.ok) {
        setPopup({
          title: "Thành công",
          message: "Thông tin cá nhân đã được cập nhật.",
          type: "success",
        });
        setIsEditing(false);
      }
    } catch (e) {
      setPopup({
        title: "Thất bại",
        message: "Không thể kết nối máy chủ.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoutClick = () => {
    showModal({
      title: "Xác nhận đăng xuất",
      message: "Bạn có chắc chắn muốn rời khỏi tài khoản Flora không?",
      type: "danger",
      confirmText: "Đăng xuất ngay",
      cancelText: "Ở lại",
      showCancel: true,
      onConfirm: () => {
        logout();
        navigate("/");
      },
    });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.newPassword !== passData.confirmPassword) {
      setPopup({
        title: "Lỗi",
        message: "Mật khẩu mới không trùng khớp.",
        type: "error",
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: getAuthHeader(),
        body: JSON.stringify({
          oldPassword: passData.oldPassword,
          newPassword: passData.newPassword,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setPopup({
          title: "Thành công",
          message: "Mật khẩu đã được thay đổi.",
          type: "success",
        });
        setIsAddingPass(false);
        setPassData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setPopup({
          title: "Thất bại",
          message: data.detail || "Không thể đổi mật khẩu.",
          type: "error",
        });
      }
    } catch (e) {
      setPopup({
        title: "Lỗi",
        message: "Mất kết nối máy chủ.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper py-24 px-6 font-sans text-ink">
      <div className="max-w-2xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 bg-primary rounded-full mx-auto mb-6 flex items-center justify-center text-white text-4xl font-serif italic shadow-2xl"
          >
            {profile?.displayName?.charAt(0).toUpperCase() || "H"}
          </motion.div>
          <h1 className="text-4xl font-serif italic text-primary mb-2">
            Thành Viên Flora
          </h1>
          <p className="text-ink/40 text-[10px] uppercase tracking-[0.2em] font-bold">
            Flora Boutique
          </p>
        </div>

        {/* Info Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-[48px] shadow-2xl border border-border-beige p-10 space-y-8 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-primary/10"></div>

          <div className="space-y-6">
            {/* Display Name */}
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-paper rounded-2xl flex items-center justify-center text-primary">
                  <User size={20} />
                </div>
                <div>
                  <label className="text-[9px] uppercase font-bold text-ink/30 block mb-1">
                    Tên hiển thị
                  </label>
                  {isEditing ? (
                    <input
                      autoFocus
                      className="bg-paper border-b border-primary/20 outline-none font-bold text-lg"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  ) : (
                    <p className="font-bold text-lg text-primary">
                      {profile?.displayName}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() =>
                  isEditing ? handleUpdate() : setIsEditing(true)
                }
                className="p-2 text-ink/20 hover:text-primary transition-all"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : isEditing ? (
                  <Save size={18} />
                ) : (
                  <Edit3 size={18} />
                )}
              </button>
            </div>

            {/* Email (Readonly) */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-paper rounded-2xl flex items-center justify-center text-primary/40">
                <Mail size={20} />
              </div>
              <div className="flex-1">
                <label className="text-[9px] uppercase font-bold text-ink/20 block mb-1">
                  Email
                </label>
                {/* Hiển thị email từ profile, nếu chưa load xong thì hiện dấu gạch ngang */}
                <p className="font-semibold text-primary/60 text-sm">
                  {profile?.email || "---"}
                </p>
              </div>
            </div>

            {/* Role */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-paper rounded-2xl flex items-center justify-center text-primary">
                <ShieldCheck size={20} />
              </div>
              <div>
                <label className="text-[9px] uppercase font-bold text-ink/30 block mb-1">
                  Cấp độ tài khoản
                </label>
                <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-[9px] font-bold uppercase tracking-widest">
                  {profile?.role}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-border-beige flex justify-between items-center">
            <button
              onClick={() => setIsAddingPass(true)}
              className="flex items-center gap-2 text-primary hover:text-ink font-bold uppercase text-[10px] tracking-widest transition-all"
            >
              <Lock size={16} /> Đổi mật khẩu
            </button>
            <Link
              to="/tracking"
              className="text-primary/40 hover:text-primary text-[10px] font-bold uppercase tracking-widest underline underline-offset-8"
            >
              Lịch sử đặt hoa
            </Link>
          </div>

          <div className="pt-8 border-t border-border-beige flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="flex gap-4">
              <button
                onClick={handleLogoutClick}
                className="flex items-center gap-2 text-red-400 hover:text-red-600 font-bold uppercase text-[10px] tracking-widest transition-all"
              >
                <LogOut size={16} /> Đăng xuất
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isChangingPass && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingPass(false)}
              className="absolute inset-0 bg-ink/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[40px] shadow-2xl relative z-10 p-10 border border-border-beige"
            >
              <h3 className="text-2xl font-serif italic text-primary mb-6">
                Đổi Mật Khẩu
              </h3>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-ink/30 ml-2">
                    Mật khẩu hiện tại
                  </label>
                  <input
                    required
                    type="password"
                    title="Mật khẩu cũ"
                    className="w-full bg-paper rounded-2xl px-4 py-3 outline-none focus:ring-1 ring-primary/20"
                    value={passData.oldPassword}
                    onChange={(e) =>
                      setPassData({ ...passData, oldPassword: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-ink/30 ml-2">
                    Mật khẩu mới
                  </label>
                  <input
                    required
                    type="password"
                    title="Mật khẩu mới"
                    className="w-full bg-paper rounded-2xl px-4 py-3 outline-none focus:ring-1 ring-primary/20"
                    value={passData.newPassword}
                    onChange={(e) =>
                      setPassData({ ...passData, newPassword: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-ink/30 ml-2">
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    required
                    type="password"
                    title="Xác nhận"
                    className="w-full bg-paper rounded-2xl px-4 py-3 outline-none focus:ring-1 ring-primary/20"
                    value={passData.confirmPassword}
                    onChange={(e) =>
                      setPassData({
                        ...passData,
                        confirmPassword: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="pt-4 flex flex-col gap-2">
                  <button
                    disabled={isLoading}
                    type="submit"
                    className="w-full bg-primary text-white py-4 rounded-2xl font-bold uppercase text-[10px] shadow-lg hover:bg-ink transition-all"
                  >
                    {isLoading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingPass(false)}
                    className="w-full py-2 text-ink/20 font-bold uppercase text-[9px]"
                  >
                    Hủy bỏ
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Popup thông báo */}
      <AnimatePresence>
        {popup && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPopup(null)}
              className="absolute inset-0 bg-ink/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white w-full max-w-sm rounded-[40px] shadow-2xl relative z-10 p-10 text-center"
            >
              <div
                className={cn(
                  "w-16 h-16 rounded-3xl mx-auto mb-6 flex items-center justify-center",
                  popup.type === "success"
                    ? "bg-green-50 text-green-600"
                    : "bg-red-50 text-red-600",
                )}
              >
                {popup.type === "success" ? (
                  <CheckCircle2 size={32} />
                ) : (
                  <XCircle size={32} />
                )}
              </div>
              <h3 className="text-2xl font-serif italic mb-2">{popup.title}</h3>
              <p className="text-sm text-ink/40 mb-8">{popup.message}</p>
              <button
                onClick={() => setPopup(null)}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold uppercase text-[10px]"
              >
                Đóng
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Loader2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-spin"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
