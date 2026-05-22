import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Product } from "../types";
import { useAuth } from "./AuthContext";

interface CartItem extends Product {
  quantity: number;
  selected: boolean;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  toggleSelect: (productId: string) => void;
  selectAll: (selected: boolean) => void;
  removeSelected: () => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  selectedCount: number;
  selectedPrice: number;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // KHÓA BẢO VỆ: Ngăn việc ghi đè giỏ hàng rỗng lên Server khi vừa mới đăng nhập
  const isSyncing = useRef(true);

  // 1. HÀM THÊM VÀO GIỎ HÀNG (Cập nhật logic điều hướng)
  const addItem = (product: Product, quantity: number = 1) => {
    if (!user) {
      // Ghi nhớ link trang chi tiết để sau khi login AuthPage sẽ dùng để nhảy về
      localStorage.setItem("hana_login_callback", `/product/${product._id}`);

      // Chuyển sang trang đăng nhập
      navigate("/auth", { state: { from: location } });
      return;
    }

    // Nếu đã đăng nhập, thực hiện thêm vào giỏ bình thường
    setItems((prev) => {
      const existing = prev.find((item) => item._id === product._id);
      if (existing) {
        return prev.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }
      // Mặc định selected: false như bạn yêu cầu
      return [...prev, { ...product, quantity, selected: false }];
    });
  };

  // 2. LOGIC TẢI GIỎ HÀNG TỪ SERVER (Khi F5 hoặc Login thành công)
  useEffect(() => {
    const fetchCartFromServer = async () => {
      if (authLoading) return; // Đợi Auth load xong

      if (user) {
        isSyncing.current = true; // Bật khiên bảo vệ (Cấm lưu)

        try {
          const res = await fetch(`/api/cart/?userId=${user.uid}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("hana_token")}`,
            },
          });

          if (res.ok) {
            const serverItems = await res.json();
            setItems(serverItems || []);
          }
        } catch (e) {
          console.error("Lỗi lấy giỏ hàng:", e);
        } finally {
          // Đợi State cập nhật xong mới cho phép tự động lưu (delay nhẹ 100ms)
          setTimeout(() => {
            isSyncing.current = false;
          }, 100);
        }
      } else {
        // Nếu Logout: xóa sạch giỏ trên máy, tắt khiên bảo vệ
        setItems([]);
        isSyncing.current = false;
      }
    };

    fetchCartFromServer();
  }, [user, authLoading]);

  // 3. LOGIC TỰ ĐỘNG LƯU LÊN SERVER (Khi người dùng thay đổi số lượng, xóa món...)
  useEffect(() => {
    // Chỉ lưu nếu Đã đăng nhập VÀ Khiên bảo vệ đang tắt (false)
    if (isSyncing.current || !user) return;

    const saveCart = async () => {
      try {
        await fetch("/api/cart/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("hana_token")}`,
          },
          body: JSON.stringify({ userId: user.uid, items }),
        });
      } catch (err) {
        console.error("Lỗi tự động lưu giỏ hàng:", err);
      }
    };

    saveCart();
  }, [items, user]);

  // --- CÁC HÀM TIỆN ÍCH KHÁC ---
  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item._id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) return removeItem(productId);
    setItems((prev) =>
      prev.map((item) =>
        item._id === productId ? { ...item, quantity } : item,
      ),
    );
  };

  const toggleSelect = (productId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item._id === productId ? { ...item, selected: !item.selected } : item,
      ),
    );
  };

  const selectAll = (selected: boolean) => {
    setItems((prev) => prev.map((item) => ({ ...item, selected })));
  };

  const removeSelected = () => {
    setItems((prev) => prev.filter((item) => !item.selected));
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const selectedCount = items
    .filter((i) => i.selected)
    .reduce((sum, item) => sum + item.quantity, 0);
  const selectedPrice = items
    .filter((i) => i.selected)
    .reduce((sum, item) => {
      const price = item.flash_sale ? item.flash_sale.sale_price : item.price;
      return sum + price * item.quantity;
    }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        toggleSelect,
        selectAll,
        removeSelected,
        clearCart,
        totalItems,
        totalPrice,
        selectedCount,
        selectedPrice,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
