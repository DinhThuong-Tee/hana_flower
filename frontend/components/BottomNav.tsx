import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Search, Heart, User, ClipboardList } from "lucide-react";
import { cn } from "../utils/cn";

export default function BottomNav() {
  const location = useLocation();
  
  const handleScrollToTop = (e: React.MouseEvent) => {
    if (location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const navItems = [
    { icon: Home, label: "Trang chủ", path: "/", onClick: handleScrollToTop },
    { icon: Search, label: "Tìm kiếm", path: "/#search" },
    { icon: ClipboardList, label: "Đơn hàng", path: "/tracking" },
    { icon: User, label: "Tài khoản", path: "/admin" },
  ];

  return (
    <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white/90 backdrop-blur-xl border border-primary/10 shadow-[0_10px_30px_rgba(0,0,0,0.1)] rounded-full px-6 py-3 flex items-center justify-between z-[60]">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;
        
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={item.onClick}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-full transition-all duration-300",
              isActive ? "bg-primary text-white scale-110" : "text-ink/40 hover:text-primary"
            )}
          >
            <Icon className="w-5 h-5" />
            <span className={cn("text-[10px] font-medium mt-1 uppercase tracking-tighter", isActive ? "hidden" : "block")}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
