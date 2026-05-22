import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: "admin" | "user";
}

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  register: (email: string, pass: string, name: string) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("flora_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const userData = await res.json();
          setProfile(userData);
        } else {
          localStorage.removeItem("flora_token");
        }
      } catch (err) {
        console.error("Lỗi khôi phục phiên:", err);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Trong hàm loginWithEmail và register, hãy cập nhật:
  const loginWithEmail = async (email: string, pass: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pass }),
    });

    const data = await res.json();
    if (res.ok) {
      // LƯU TOKEN VÀO LOCALSTORAGE
      localStorage.setItem("flora_token", data.token);
      setProfile(data);
    } else {
      throw new Error(data.detail || "Đăng nhập thất bại");
    }
  };

  // Cập nhật hàm logout
  const logout = async () => {
    localStorage.removeItem("flora_token"); // Xóa token khi đăng xuất
    setProfile(null);
  };

  const register = async (email: string, pass: string, name: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pass, displayName: name }),
    });

    const data = await res.json(); // CHỈ GỌI DÒNG NÀY 1 LẦN DUY NHẤT

    if (res.ok) {
      localStorage.setItem("flora_token", data.token);
      setProfile(data);
    } else {
      // Dùng data đã parse ở trên, không gọi res.json() nữa
      throw new Error(data.detail || "Đăng ký thất bại");
    }
  };

  const value = {
    user: profile, // Map profile to user for compatibility
    profile,
    loading,
    register,
    loginWithEmail,
    logout,
    isAdmin: profile?.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
