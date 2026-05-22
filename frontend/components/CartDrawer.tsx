import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, ShoppingBag, Plus, Minus, ArrowRight, Check } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { cn } from '../utils/cn';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../contexts/UIContext';

export default function CartDrawer() {
  const { items, removeItem, updateQuantity, totalPrice, isOpen, setIsOpen, toggleSelect, selectAll, selectedPrice, selectedCount, removeSelected } = useCart();
  const navigate = useNavigate();
  const { showModal } = useUI();

  const allSelected = items.length > 0 && items.every(i => i.selected);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-ink/60 backdrop-blur-md pointer-events-auto"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute right-0 top-0 h-full w-full max-w-md bg-paper shadow-[-20px_0_50px_rgba(0,0,0,0.1)] flex flex-col pointer-events-auto border-l border-border-beige"
          >
            <div className="p-6 border-b border-border-beige flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-serif italic text-primary">Giỏ hàng của bạn</h2>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-primary/5 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-ink/40" />
              </button>
            </div>

            {items.length > 0 && (
              <div className="px-6 py-3 border-b border-border-beige flex items-center justify-between bg-white/50">
                <button 
                  onClick={() => selectAll(!allSelected)}
                  className="flex items-center gap-2 group"
                >
                  <div className={cn(
                    "w-4 h-4 rounded border transition-colors flex items-center justify-center",
                    allSelected ? "bg-primary border-primary" : "border-ink/20 group-hover:border-primary"
                  )}>
                    {allSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-ink/40">Chọn tất cả</span>
                </button>
                <button 
  onClick={() => showModal({
    title: "Làm sạch giỏ hàng?",
    message: "Bạn có chắc muốn xóa các sản phẩm đã chọn khỏi giỏ hàng của bạn?",
    type: "danger",
    showCancel: true,
    confirmText: "Đúng, hãy xóa chúng",
    onConfirm: () => removeSelected() // Hàm xóa thật của bạn
  })}
>
  Xóa mục đã chọn
</button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <ShoppingBag className="w-16 h-16 mb-4" />
                  <p className="text-sm font-medium uppercase tracking-widest">Giỏ hàng trống</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item._id} className="flex gap-4 group items-center">
                    <button 
                      onClick={() => toggleSelect(item._id)}
                      className={cn(
                        "w-5 h-5 rounded-full border transition-all flex items-center justify-center flex-shrink-0",
                        item.selected ? "bg-primary border-primary shadow-lg shadow-primary/20 scale-110" : "border-ink/10 hover:border-primary/40"
                      )}
                    >
                      {item.selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </button>

                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white border border-border-beige flex-shrink-0">
                      <img 
                        src={item.image_url || item.images?.[0]} 
                        alt={item.name} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 flex flex-col py-1">
                      <h3 className={cn(
                        "text-sm font-serif italic mb-1 transition-colors",
                        item.selected ? "text-primary" : "text-ink/60"
                      )}>{item.name}</h3>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-ink/40">
                          {(item.flash_sale ? item.flash_sale.sale_price : item.price).toLocaleString('vi-VN')}₫
                        </span>
                        {item.flash_sale && (
                          <span className="text-[10px] line-through text-ink/20 italic">
                            {item.price.toLocaleString('vi-VN')}₫
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center border border-border-beige rounded-full px-2 py-1 gap-3">
                          <button 
                            onClick={() => updateQuantity(item._id, item.quantity - 1)}
                            className="p-1 hover:text-primary transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-[10px] font-bold w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item._id, item.quantity + 1)}
                            className="p-1 hover:text-primary transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button 
                          onClick={() => removeItem(item._id)}
                          className="text-ink/20 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 bg-white border-t border-border-beige space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-ink/20">
                    <span>Tổng giỏ hàng</span>
                    <span>{totalPrice.toLocaleString('vi-VN')}₫</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest text-ink/40">
                    <span>Thanh toán ({selectedCount} mục)</span>
                    <span className="text-primary text-xl font-serif italic lowercase first-letter:uppercase">
                      {selectedPrice.toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (selectedCount === 0) {
                      showModal({
            title: "Lỗi thực hiện",
            message: data.error || "Vui lòng chọn ít nhất một sản phẩm để thanh toán.",
            type: "warning"
          });
                      return;
                    }
                    setIsOpen(false);
                    const selectedItems = items.filter(i => i.selected);
                    navigate('/checkout', { state: { items: selectedItems } });
                  }}
                  disabled={selectedCount === 0}
                  className="w-full bg-primary text-white py-4 rounded-full font-bold uppercase tracking-widest text-[10px] shadow-xl hover:translate-y-[-2px] disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-2 group"
                >
                  <span>Thanh toán ngay</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

