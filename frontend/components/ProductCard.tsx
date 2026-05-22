import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Eye, Plus, Flower2 } from "lucide-react"; // Thêm Flower2
import { motion, AnimatePresence } from "motion/react"; // Thêm AnimatePresence
import { Product, FlashSale } from "../types";
import { cn } from "../utils/cn";
import { useCart } from "../contexts/CartContext";
import FlashSaleCountdown from "./FlashSaleCountdown";

export default function ProductCard({
  product,
  flashSale,
}: {
  product: Product;
  flashSale?: FlashSale;
}) {
  const isFlashSale = !!flashSale;
  const { addItem } = useCart();

  // State quản lý danh sách bông hoa đang bay
  const [flyingFlowers, setFlyingFlowers] = useState<
    { id: number; x: number; y: number }[]
  >([]);

  const displayPrice = isFlashSale ? flashSale.sale_price : product.price;
  const originalPrice = isFlashSale ? product.price : null;

  // Hàm xử lý khi thêm vào giỏ hàng
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Gọi hàm thêm vào giỏ hàng thật
    addItem({
      ...product,
      flash_sale: flashSale
        ? { sale_price: flashSale.sale_price, end_time: flashSale.end_time }
        : undefined,
    } as any);

    // 2. Tạo hiệu ứng bay
    const newFlower = {
      id: Date.now(),
      x: e.clientX,
      y: e.clientY,
    };

    setFlyingFlowers((prev) => [...prev, newFlower]);

    // Xóa bông hoa sau khi bay xong (1s)
    setTimeout(() => {
      setFlyingFlowers((prev) => prev.filter((f) => f.id !== newFlower.id));
    }, 1000);
  };

  return (
    <div className="group bg-white border border-border-beige rounded-[32px] p-4 flex flex-col transition-all duration-500 hover:shadow-xl hover:border-accent/20 relative">
      {/* HIỆU ỨNG HOA BAY */}
      <AnimatePresence>
        {flyingFlowers.map((flower) => (
          <motion.div
            key={flower.id}
            initial={{
              position: "fixed",
              left: flower.x - 10,
              top: flower.y - 10,
              opacity: 1,
              scale: 1,
              zIndex: 9999,
              color: "#4A5D4E", // Màu xanh thương hiệu
            }}
            animate={{
              left: window.innerWidth - 60, // Bay về góc phải
              top: 20, // Bay về phía trên (giỏ hàng)
              opacity: 0,
              scale: 0.2,
              rotate: 720, // Xoay 2 vòng
            }}
            transition={{ duration: 0.8, ease: [0.45, 0, 0.55, 1] }}
            className="pointer-events-none"
          >
            <Flower2 size={24} fill="currentColor" />
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="relative aspect-square mb-4 overflow-hidden rounded-2xl bg-[#F5F2EA]">
        <Link to={`/product/${product._id}`} className="block w-full h-full">
          <img
            src={
              product.images?.[0] ||
              "https://images.unsplash.com/photo-1591880911020-d34931ea5404"
            }
            alt={product.name}
            className={cn(
              "w-full h-full object-cover transition-transform duration-700 group-hover:scale-110",
              !product.is_stock && "grayscale opacity-60",
            )}
            referrerPolicy="no-referrer"
          />
        </Link>

        {!product.is_stock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] pointer-events-none">
            <span className="bg-black/50 text-white px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest">
              Tạm hết hàng
            </span>
          </div>
        )}

        {isFlashSale && product.is_stock && (
          <div className="absolute top-3 right-3 bg-accent text-white px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest shadow-lg">
            Giảm {Math.round((1 - flashSale.sale_price / product.price) * 100)}%
          </div>
        )}

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center space-x-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
          <Link
            to={`/product/${product._id}`}
            className="p-3 bg-white text-primary hover:bg-primary hover:text-white rounded-full shadow-xl transition-all"
          >
            <Eye className="w-4 h-4" />
          </Link>
          {product.is_stock && (
            <button
              onClick={handleAddToCart} // Cập nhật hiệu ứng
              className="p-3 bg-white text-primary hover:bg-primary hover:text-white rounded-full shadow-xl transition-all"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col flex-1 px-1 mt-4">
        {/* 1. TÊN SẢN PHẨM: To, rõ, lên đầu tiên */}
        <Link to={`/product/${product._id}`}>
          <h3 className="text-2xl font-serif italic text-primary mb-2 line-clamp-1 group-hover:text-accent transition-colors leading-tight">
            {product.name}
          </h3>
        </Link>

        {/* 2. MÔ TẢ: 1-2 dòng, tự động hiện dấu ... */}
        <p className="text-[13px] text-ink/60 mb-3 line-clamp-2 leading-relaxed italic font-light">
          {product.description}
        </p>

        {/* 3. DANH MỤC: Hiện trên 1 dòng, nếu nhiều quá tự hiện ... */}
        <div className="flex items-center gap-1 mb-4 overflow-hidden">
          <div className="flex flex-wrap gap-x-2 gap-y-1 line-clamp-1">
            {product.categories?.map((cat, index) => (
              <span
                key={index}
                className="text-[9px] uppercase font-bold tracking-[0.15em] text-accent/60 whitespace-nowrap"
              >
                {cat}
                {index < product.categories.length - 1 ? " •" : ""}
              </span>
            ))}
          </div>
        </div>

        {/* 4. GIÁ SẢN PHẨM: Dưới cùng */}
        <div className="flex justify-between items-end mt-auto pt-2 border-t border-primary/5">
          <div className="flex flex-col">
            <span className="text-xl font-bold text-primary tracking-tight">
              {displayPrice.toLocaleString("vi-VN")}₫
            </span>
            {originalPrice && (
              <span className="text-[10px] line-through text-ink/20 italic">
                {originalPrice.toLocaleString("vi-VN")}₫
              </span>
            )}
          </div>

          {/* Nút thêm nhanh */}
          <button
            disabled={!product.is_stock}
            onClick={handleAddToCart}
            className={cn(
              "p-2.5 bg-[#F5F2EA] rounded-full transition-all active:scale-90",
              product.is_stock
                ? "hover:bg-primary hover:text-white shadow-sm"
                : "cursor-not-allowed opacity-30",
            )}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
