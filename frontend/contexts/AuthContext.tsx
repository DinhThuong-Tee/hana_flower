import React, { createContext, useContext, useEffect, useState } from 'react';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Session persistence now strictly relies on the session state, not localStorage
    const checkAuth = async () => {
      // In a real app, we would verify the session cookie/token with the server here
      setLoading(false);
    };
    checkAuth();
  }, []);


  const loginWithEmail = async (email: string, pass: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pass })
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Đăng nhập thất bại");
    }
    
    const userData = await res.json();
    setProfile(userData);
  };

  const register = async (email: string, pass: string, name: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pass, displayName: name })
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Đăng ký thất bại");
    }
    
    const userData = await res.json();
    setProfile(userData);
  };

  const logout = async () => {
    setProfile(null);
  };

  const value = {
    user: profile, // Map profile to user for compatibility
    profile,
    loading,
    register,
    loginWithEmail,
    logout,
    isAdmin: profile?.role === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
