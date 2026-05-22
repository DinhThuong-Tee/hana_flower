import React, { useState, useEffect } from "react";
import {
  Link,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import { ShoppingCart, Search, User as UserIcon, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { cn } from "../utils/cn";
import { useUI } from "../contexts/UIContext";

export default function Navbar() {
  const { user, profile, logout, isAdmin } = useAuth();
  const { totalItems, setIsOpen } = useCart();
  const { showModal } = useUI();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // State theo dõi vị trí cuộn
  const [isAtProducts, setIsAtProducts] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const productsSection = document.getElementById("products");
      if (productsSection && location.pathname === "/") {
        const rect = productsSection.getBoundingClientRect();
        setIsAtProducts(rect.top <= 120);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  const query = searchParams.get("q") || "";

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

  const handleScrollToCollection = (e: React.MouseEvent) => {
    if (location.pathname === "/") {
      e.preventDefault(); // Ngăn việc tải lại trang
      const element = document.getElementById("products");
      if (element) {
        // Cuộn mượt xuống vị trí id="products"
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
    // Nếu đang ở trang khác (như /tracking), Link to="/#products" sẽ
    // tự động đưa bạn về trang chủ và nhảy đến vị trí ID đó.
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) navigate(`/?q=${value}`);
    else navigate(`/`);
  };

  const handleScrollToTop = () => {
    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-border-beige transition-all duration-500",
        isAtProducts ? "py-2 shadow-lg" : "py-5",
      )}
    >
      <div className="max-w-7xl mx-auto px-8 flex items-center justify-between gap-4">
        {/* 1. LOGO */}
        <Link
          to="/"
          onClick={handleScrollToTop}
          className="flex items-center gap-2 group shrink-0 mr-4"
        >
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-serif text-xl">
            F
          </div>
          <span className="hidden lg:block text-xl font-serif italic font-bold text-primary">
            Flora
          </span>
        </Link>

        {/* 2. NHÓM ĐIỀU HƯỚNG & TÌM KIẾM */}
        <div className="flex-1 flex items-center gap-16">
          {/* Nút Cửa Hàng: LUÔN HIỆN */}
          <Link
            to="/"
            onClick={handleScrollToTop}
            className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary whitespace-nowrap hover:opacity-70 transition-opacity"
          >
            Trang chủ
          </Link>

          <Link
            to="/#products"
            onClick={handleScrollToCollection}
            className={cn(
              "text-[10px] font-bold uppercase tracking-[0.2em] text-ink/60 whitespace-nowrap hover:text-primary transition-all duration-500 overflow-hidden",
              isAtProducts
                ? "max-w-0 opacity-0 pointer-events-none"
                : "max-w-[150px] opacity-100",
            )}
          >
            Sản phẩm
          </Link>

          {/* Nút Tra Cứu: Ẩn khi search to */}
          <Link
            to={user ? "/tracking" : "/auth"}
            state={!user ? { from: { pathname: "/tracking" } } : undefined}
            className={cn(
              "text-[10px] font-bold uppercase tracking-[0.2em] text-ink/60 whitespace-nowrap hover:text-primary transition-all duration-500 overflow-hidden",
              isAtProducts
                ? "max-w-0 opacity-0 pointer-events-none"
                : "max-w-[150px] opacity-100",
            )}
          >
            Đơn hàng
          </Link>

          {/* NÚT ADMIN: Chỉ hiện nếu là Admin và ẩn khi search to */}
          {isAdmin && (
            <Link
              to="/admin"
              className={cn(
                "text-[10px] font-bold uppercase tracking-[0.2em] text-accent whitespace-nowrap hover:text-primary transition-all duration-500 overflow-hidden",
                isAtProducts
                  ? "max-w-0 opacity-0 pointer-events-none"
                  : "max-w-[150px] opacity-100",
              )}
            >
              ADMIN
            </Link>
          )}
        </div>

        {/* THANH TÌM KIẾM: Giãn to chiếm chỗ 3 nút trên */}
        <div className="flex-1 flex items-center justify-end gap-3 ml-4">
          <div
            className={cn(
              "relative transition-all duration-700 ease-in-out flex items-center",
              isAtProducts ? "flex-1" : "w-90",
            )}
          >
            <Search className="absolute left-4 w-3.5 h-3.5 text-primary/30" />
            <input
              type="text"
              placeholder="Tìm kiếm tác phẩm..."
              value={query}
              onChange={handleSearch}
              className={cn(
                "w-full bg-[#F5F2EA] border-none rounded-full py-2 px-10 text-[10px] font-medium focus:ring-1 ring-primary/20 transition-all",
                isAtProducts ? "py-3 text-xs" : "py-2",
              )}
            />
          </div>

          {/* 3. NHÓM USER & CART */}
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/profile"
                  className="flex flex-col items-end hidden sm:flex hover:opacity-70 transition-opacity"
                >
                  <span className="text-[10px] font-bold text-primary truncate max-w-[80px]">
                    {profile?.displayName}
                  </span>
                  <span className="text-[8px] uppercase tracking-widest text-ink/40">
                    {profile?.role}
                  </span>
                </Link>
                <button
                  onClick={handleLogoutClick}
                  className="p-2 text-red-400 hover:bg-red-50 rounded-full transition-colors"
                  title="Đăng xuất"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="p-2 text-primary hover:bg-primary/5 rounded-full"
              >
                <UserIcon size={20} />
              </Link>
            )}

            <button
              onClick={() => setIsOpen(true)}
              className="relative p-2 hover:bg-primary/5 rounded-full transition-colors"
            >
              <ShoppingCart size={20} className="text-primary" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 text-[9px] bg-accent text-white w-4 h-4 flex items-center justify-center rounded-full font-bold">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
