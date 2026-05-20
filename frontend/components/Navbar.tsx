import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, Search, Menu, Phone, User as UserIcon, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";

export default function Navbar() {
  const { user, profile, logout, isAdmin } = useAuth();
  const { totalItems, setIsOpen } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const handleScrollToTop = (e: React.MouseEvent) => {
    if (location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleScrollToCollection = (e: React.MouseEvent) => {
    if (location.pathname === "/") {
      e.preventDefault();
      const element = document.getElementById("products");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border-beige px-8 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" onClick={handleScrollToTop} className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-serif text-xl transition-transform group-hover:rotate-12">F</div>
          <span className="text-2xl font-serif italic font-bold tracking-tight text-primary">
            L'Art de Fleur
          </span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium uppercase tracking-[0.2em] text-ink/60">
          <Link to="/" onClick={handleScrollToTop} className="hover:text-primary transition-colors">Cửa Hàng</Link>
          <Link to="/#products" onClick={handleScrollToCollection} className="hover:text-primary transition-colors">Bộ Sưu Tập</Link>
          <Link to="/tracking" className="hover:text-primary transition-colors">Tra cứu</Link>
          {isAdmin && <Link to="/admin" className="hover:text-primary transition-colors">Admin</Link>}
        </nav>
        
        <div className="flex items-center gap-4">
          <div className="relative hidden w-40 lg:block">
            <input 
              type="text" 
              placeholder="Tìm hoa..." 
              className="w-full bg-[#F5F2EA] border-none rounded-full py-2 px-4 text-[10px] focus:ring-1 ring-primary focus:outline-none"
            />
          </div>

          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-[10px] font-bold text-primary truncate max-w-[100px]">{profile?.displayName}</span>
                <span className="text-[8px] uppercase tracking-widest text-ink/40">{profile?.role}</span>
              </div>
              <button 
                onClick={logout}
                className="p-2 hover:bg-red-50 text-red-500 rounded-full transition-colors group"
                title="Đăng xuất"
              >
                <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          ) : (
            <Link 
              to="/auth"
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg hover:translate-y-[-2px] transition-all"
            >
              <UserIcon className="w-4 h-4" />
              <span>Đăng nhập</span>
            </Link>
          )}

          <button 
            onClick={() => setIsOpen(true)}
            className="relative flex items-center gap-1 cursor-pointer p-2 hover:bg-primary/5 rounded-full transition-colors"
          >
            <ShoppingCart className="w-5 h-5 text-primary" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 text-[10px] bg-accent text-white px-1.5 py-0.5 rounded-full font-bold animate-in zoom-in duration-300">
                {totalItems}
              </span>
            )}
          </button>
          <button className="md:hidden p-2 hover:bg-primary/5 rounded-full transition-colors">
            <Menu className="w-6 h-6 text-primary" />
          </button>
        </div>
      </div>
    </header>
  );
}
