import { Link } from "react-router-dom";
import { ShoppingCart, Eye, Plus } from "lucide-react";
import { Product, FlashSale } from "../types";
import { cn } from "../utils/cn";
import { useCart } from "../contexts/CartContext";
import FlashSaleCountdown from "./FlashSaleCountdown";

export default function ProductCard({ product, flashSale }: { product: Product, flashSale?: FlashSale }) {
  const isFlashSale = !!flashSale;
  const { addItem } = useCart();
  
  const displayPrice = isFlashSale ? flashSale.sale_price : product.price;
  const originalPrice = isFlashSale ? product.price : null;
  
  return (
    <div className="group bg-white border border-border-beige rounded-[32px] p-4 flex flex-col transition-all duration-500 hover:shadow-xl hover:border-accent/20">
      <div className="relative aspect-square mb-4 overflow-hidden rounded-2xl bg-[#F5F2EA]">
        <Link to={`/product/${product._id}`} className="block w-full h-full">
          <img
            src={product.images?.[0] || "https://images.unsplash.com/photo-1591880911020-d34931ea5404"}
            alt={product.name}
            className={cn(
              "w-full h-full object-cover transition-transform duration-700 group-hover:scale-110",
              !product.is_stock && "grayscale opacity-60"
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
            Giảm {Math.round((1 - flashSale.sale_price/product.price) * 100)}%
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
                onClick={(e) => { 
                  e.preventDefault();
                  e.stopPropagation(); 
                  addItem({ ...product, flash_sale: flashSale ? { sale_price: flashSale.sale_price, end_time: flashSale.end_time } : undefined } as any);
                }}
                className="p-3 bg-white text-primary hover:bg-primary hover:text-white rounded-full shadow-xl transition-all"
              >
               <ShoppingCart className="w-4 h-4" />
             </button>
          )}
        </div>
      </div>
      
      <div className="flex flex-col flex-1 px-1">
        <Link to={`/product/${product._id}`}>
          <span className="text-[10px] uppercase font-bold tracking-widest text-accent mb-1">
            {product.categories?.[0] || "Hoa tươi"}
          </span>
          <h3 className="text-lg font-serif italic text-primary mb-2 line-clamp-1 group-hover:text-accent transition-colors">{product.name}</h3>
        </Link>
        <p className="text-xs text-[#A19B89] mb-4 line-clamp-2">{product.description}</p>
        
        <div className="flex justify-between items-center mt-auto">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-primary">
              {displayPrice.toLocaleString('vi-VN')}đ
            </span>
            {originalPrice && (
              <span className="text-[10px] line-through text-[#8A9682]">
                {originalPrice.toLocaleString('vi-VN')}đ
              </span>
            )}
          </div>
          <button 
            disabled={!product.is_stock}
            onClick={(e) => { 
              e.preventDefault();
              e.stopPropagation(); 
              addItem({ ...product, flash_sale: flashSale ? { sale_price: flashSale.sale_price, end_time: flashSale.end_time } : undefined } as any);
            }}
            className={cn(
              "p-2 bg-[#F5F2EA] rounded-full transition-colors",
              product.is_stock ? "hover:bg-primary hover:text-white" : "cursor-not-allowed opacity-50"
            )}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
