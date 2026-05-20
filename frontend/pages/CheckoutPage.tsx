import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Info, CheckCircle2, QrCode, CreditCard, Banknote, Calendar, Clock, MessageSquare, Send, ArrowRight, ShieldCheck, Lock, Upload, Image as ImageIcon } from "lucide-react";
import { Product } from "../types";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "../utils/cn";

import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";

export default function CheckoutPage() {
  const { user, login, loading: authLoading } = useAuth();
  const { removeSelected } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { items: any[] } | null;
  const [items, setItems] = useState<any[]>(state?.items || []);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    date: "",
    time: "",
    message: ""
  });
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<"vietqr" | "cod">("vietqr");
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);
  const [qrUrl, setQrUrl] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!state?.items || state.items.length === 0) {
      navigate("/");
    }
  }, [state, navigate]);

  useEffect(() => {
    if (orderSuccess && paymentMethod === "vietqr") {
      fetch(`/api/orders/payments/vietqr/${orderSuccess.order_code}`)
        .then(res => res.json())
        .then(data => setQrUrl(data.qrUrl));
    }
  }, [orderSuccess, paymentMethod]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[48px] shadow-2xl p-12 text-center border border-border-beige">
          <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-8">
            <Lock className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl font-serif italic text-primary mb-4">Mời Bạn Đăng Nhập</h2>
          <p className="text-[#727D6B] mb-10 font-medium leading-relaxed text-sm">
            Để bảo mật thông tin đơn hàng và tích lũy điểm thưởng, vui lòng đăng nhập trước khi tiếp tục thanh toán.
          </p>
          <Link 
            to="/auth"
            state={{ from: location }}
            className="w-full bg-primary text-white py-5 rounded-full font-bold uppercase tracking-widest text-[10px] hover:shadow-xl transition-all shadow-lg flex items-center justify-center gap-3"
          >
            <Send className="w-4 h-4" />
            Đăng nhập ngay
          </Link>
          <button 
            onClick={() => navigate("/")}
            className="mt-6 text-[10px] font-bold uppercase tracking-widest text-ink/30 hover:text-primary transition-colors"
          >
            Quay lại cửa hàng
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  const total = items.reduce((sum, item) => {
    const price = item.flash_sale ? item.flash_sale.sale_price : item.price;
    return sum + (price * item.quantity);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }
    
    setIsOrdering(true);
    const orderData = {
      customer_info: {
        name: formData.name,
        phone: formData.phone,
        address: formData.address
      },
      user_id: user?.uid,
      delivery_details: {
        date: formData.date,
        time_slot: formData.time,
        card_message: formData.message
      },
      items: items.map(item => ({ product_id: item._id, quantity: item.quantity })),
      payment_method: paymentMethod
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
      });
      if (res.ok) {
        const data = await res.json();
        setOrderSuccess(data);
        // Clean up cart after successful order
        removeSelected();
      } else {
        const errData = await res.json();
        throw new Error(errData.error || "Lỗi đặt hàng");
      }
    } catch (err: any) {
      console.error("Order error:", err);
      alert(err.message || "Đã có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setIsOrdering(false);
    }
  };

  const handleReceiptSubmit = async () => {
    if (!receiptFile) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("receipt", receiptFile);

    try {
      const res = await fetch(`/api/orders/${orderSuccess._id}/receipt`, {
        method: "PATCH",
        body: formData,
      });
      if (res.ok) {
        alert("Đã gửi minh chứng thanh toán thành công!");
      } else {
        alert("Gửi minh chứng thất bại, vui lòng thử lại.");
      }
    } catch (err) {
      console.error(err);
      alert("Đã xảy ra lỗi khi tải ảnh lên.");
    } finally {
      setIsUploading(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-paper py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[48px] shadow-2xl p-12 overflow-hidden border border-border-beige flex flex-col md:flex-row gap-12"
          >
            <div className="flex-1 text-center md:text-left">
              <div className="w-20 h-20 bg-[#E9EED9] rounded-full flex items-center justify-center mb-8 mx-auto md:mx-0">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-4xl font-serif italic text-primary mb-4">Đặt hàng thành công!</h2>
              <p className="text-[#727D6B] mb-8 font-medium leading-relaxed text-sm">
                Đơn hàng <span className="font-bold text-primary">#{orderSuccess.order_code}</span> đã được ghi nhận. 
                {paymentMethod === "vietqr" ? " Vui lòng thanh toán qua mã QR để chúng tôi sớm chuẩn bị hoa cho bạn." : " Chúng tôi sẽ sớm liên hệ xác nhận đơn hàng."}
              </p>
              
              <div className="bg-paper p-8 rounded-3xl mb-8 space-y-4 border border-border-beige">
                <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold text-ink/20">
                  <span>Mã đơn hàng</span>
                  <span className="text-primary">{orderSuccess.order_code}</span>
                </div>
                <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold text-ink/20">
                  <span>Tổng thanh toán</span>
                  <span className="text-accent text-lg">{orderSuccess.total_amount.toLocaleString('vi-VN')}₫</span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => navigate("/tracking")}
                  className="w-full bg-primary text-white py-5 rounded-full font-bold uppercase tracking-widest text-[10px] hover:shadow-xl transition-all shadow-lg"
                >
                  Theo dõi hành trình hoa
                </button>
                <button 
                  onClick={() => navigate("/")}
                  className="w-full bg-white border border-primary/10 text-primary py-5 rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-paper transition-all"
                >
                  Quay lại trang chủ
                </button>
              </div>
            </div>

            {paymentMethod === "vietqr" && (
              <div className="flex-1 bg-paper rounded-[40px] p-8 border border-border-beige flex flex-col items-center justify-center text-center">
                <div className="bg-white p-4 rounded-3xl shadow-inner mb-6">
                  {qrUrl ? (
                    <img src={qrUrl} className="max-w-[240px] h-auto" alt="VietQR" />
                  ) : (
                    <div className="w-[200px] h-[200px] flex items-center justify-center text-ink/20">
                      <QrCode className="w-12 h-12 animate-pulse" />
                    </div>
                  )}
                </div>
                <div className="mb-8">
                  <h4 className="text-lg font-serif mb-2">Thanh toán qua QR</h4>
                  <p className="text-[10px] text-ink/40 uppercase tracking-[0.2em]">Vui lòng chụp màn hình bill sau khi chuyển</p>
                </div>

                <div className="w-full space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-ink/40">Gửi ảnh Bill xác nhận</label>
                    <div className="relative group">
                      <input 
                        type="file"
                        accept="image/*"
                        id="receipt-upload"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setReceiptFile(file);
                            setPreviewUrl(URL.createObjectURL(file));
                          }
                        }}
                      />
                      <label 
                        htmlFor="receipt-upload"
                        className="cursor-pointer block w-full bg-white border-2 border-dashed border-primary/20 rounded-3xl p-6 text-center hover:border-primary/40 transition-all"
                      >
                        {previewUrl ? (
                          <div className="space-y-4">
                            <img src={previewUrl} className="max-h-40 mx-auto rounded-xl shadow-md" alt="Preview" />
                            <p className="text-[9px] font-bold text-primary uppercase">Bấm để chọn lại ảnh khác</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center py-4">
                            <div className="w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center mb-3">
                              <Upload className="w-6 h-6 text-primary" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Bấm để tải ảnh bill</span>
                            <span className="text-[8px] text-ink/20 mt-1 uppercase">Hỗ trợ JPG, PNG</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                  <button 
                    onClick={handleReceiptSubmit}
                    disabled={isUploading || !receiptFile}
                    className="w-full bg-ink text-white py-4 rounded-full font-bold uppercase tracking-widest text-[10px] disabled:opacity-50 flex items-center justify-center gap-2 transition-all hover:bg-primary shadow-lg"
                  >
                    {isUploading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang gửi...</span>
                      </div>
                    ) : (
                      <>
                        <span>Gửi minh chứng</span>
                        <Send className="w-3 h-3" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* Form Left */}
          <div className="flex-grow">
             <button 
                onClick={() => setStep(step === 1 ? 0 : 1)}
                className="flex items-center text-xs font-bold uppercase tracking-widest text-ink/30 hover:text-primary mb-12"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                {step === 1 ? "Quay lại sản phẩm" : "Xem lại thông tin giao hàng"}
              </button>

              <div className="flex items-center space-x-12 mb-16">
                <div className={cn("flex items-center space-x-3 transition-all", step === 1 ? "opacity-100" : "opacity-30")}>
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm", step === 1 ? "bg-primary text-white" : "bg-ink/10 text-ink/40")}>1</div>
                  <span className="uppercase tracking-widest text-xs font-bold">Giao hàng</span>
                </div>
                <div className="w-12 h-px bg-primary/10"></div>
                <div className={cn("flex items-center space-x-3 transition-all", step === 2 ? "opacity-100" : "opacity-30")}>
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm", step === 2 ? "bg-primary text-white" : "bg-ink/10 text-ink/40")}>2</div>
                  <span className="uppercase tracking-widest text-xs font-bold">Thanh toán</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-12">
                <AnimatePresence mode="wait">
                  {step === 1 ? (
                    <motion.div 
                      key="step1"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-10"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-3">
                           <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-ink/40 ml-4">Họ và tên người nhận</label>
                           <input 
                            required
                                                        placeholder="Vui lòng nhập tên..."
                            className="w-full bg-white border border-primary/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                           />
                         </div>
                         <div className="space-y-3">
                           <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-ink/40 ml-4">Số điện thoại</label>
                           <input 
                            required
                            placeholder="Nhập SĐT để tra cứu..."
                            className="w-full bg-white border border-primary/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" 
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                           />
                         </div>
                      </div>
                      
                      <div className="space-y-3">
                        <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-ink/40 ml-4">Địa chỉ giao hoa</label>
                        <textarea 
                          required
                          rows={3}
                          placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                          className="w-full bg-white border border-primary/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium resize-none" 
                          value={formData.address}
                          onChange={(e) => setFormData({...formData, address: e.target.value})}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-3">
                            <label className="flex items-center text-[10px] uppercase tracking-[0.2em] font-bold text-ink/40 ml-4">
                              <Calendar className="w-3 h-3 mr-2" /> Ngày giao
                            </label>
                            <input 
                              required
                              type="date"
                              className="w-full bg-white border border-primary/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" 
                              value={formData.date}
                              onChange={(e) => setFormData({...formData, date: e.target.value})}
                            />
                         </div>
                         <div className="space-y-3">
                            <label className="flex items-center text-[10px] uppercase tracking-[0.2em] font-bold text-ink/40 ml-4">
                              <Clock className="w-3 h-3 mr-2" /> Khung giờ
                            </label>
                            <select 
                              required
                              className="w-full bg-white border border-primary/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium appearance-none" 
                              value={formData.time}
                              onChange={(e) => setFormData({...formData, time: e.target.value})}
                            >
                              <option value="">Chọn khung giờ...</option>
                              <option value="08:00 - 10:00">08:00 - 10:00</option>
                              <option value="10:00 - 12:00">10:00 - 12:00</option>
                              <option value="13:00 - 15:00">13:00 - 15:00</option>
                              <option value="15:00 - 18:00">15:00 - 18:00</option>
                              <option value="18:00 - 21:00">18:00 - 21:00</option>
                            </select>
                         </div>
                      </div>

                      <div className="space-y-3">
                        <label className="flex items-center text-[10px] uppercase tracking-[0.2em] font-bold text-ink/40 ml-4">
                          <MessageSquare className="w-3 h-3 mr-2" /> Lời nhắn trên thiệp
                        </label>
                        <textarea 
                          rows={4}
                          placeholder="Nhập lời nhắn yêu thương muốn gửi gắm..."
                          className="w-full bg-white border border-primary/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium italic resize-none" 
                          value={formData.message}
                          onChange={(e) => setFormData({...formData, message: e.target.value})}
                        />
                      </div>

                      <button 
                        type="submit"
                        className="w-full bg-ink text-white py-6 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-primary transition-all duration-500 shadow-xl flex items-center justify-center group"
                      >
                        Tiếp tục: Thanh toán <ArrowRight className="ml-3 w-4 h-4 group-hover:translate-x-2 transition-transform" />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="step2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-10"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <button 
                          type="button"
                          onClick={() => setPaymentMethod("vietqr")}
                          className={cn(
                            "p-8 rounded-[32px] border-2 transition-all flex flex-col items-center justify-center text-center",
                            paymentMethod === "vietqr" ? "border-primary bg-white shadow-xl" : "border-primary/5 bg-paper opacity-50 grayscale"
                          )}
                         >
                           <QrCode className="w-12 h-12 text-primary mb-4" />
                           <span className="font-serif text-xl mb-1">VietQR Động</span>
                           <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">Khuyên dùng</span>
                         </button>
                         <button 
                          type="button"
                          onClick={() => setPaymentMethod("cod")}
                          className={cn(
                            "p-8 rounded-[32px] border-2 transition-all flex flex-col items-center justify-center text-center",
                            paymentMethod === "cod" ? "border-primary bg-white shadow-xl" : "border-primary/5 bg-paper opacity-50 grayscale"
                          )}
                         >
                           <Banknote className="w-12 h-12 text-primary mb-4" />
                           <span className="font-serif text-xl mb-1">Tiền mặt (COD)</span>
                           <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">Thanh toán khi nhận</span>
                         </button>
                      </div>

                      {paymentMethod === "vietqr" && qrUrl && (
                        <div className="bg-white rounded-[40px] p-10 border border-primary/5 shadow-inner text-center space-y-6">
                           <div className="bg-paper p-4 rounded-3xl inline-block">
                              <img src={qrUrl} className="max-w-[300px] h-auto mx-auto" alt="VietQR" />
                           </div>
                           <div className="space-y-2">
                             <h4 className="text-xl font-serif">Quét mã để thanh toán</h4>
                             <p className="text-sm text-ink/40 font-light px-12">Thông tin số tiền và mã đơn sẽ được tự động điền trong app ngân hàng</p>
                           </div>
                           <div className="p-4 bg-green-50 rounded-2xl flex items-center justify-center text-xs font-bold text-green-700 uppercase tracking-widest">
                             <Info className="w-4 h-4 mr-2" /> Mã QR an toàn & ẩn danh
                           </div>
                        </div>
                      )}

                      <button 
                        disabled={isOrdering}
                        type="submit"
                        className="w-full bg-primary text-white py-6 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-ink transition-all duration-500 shadow-xl flex items-center justify-center disabled:opacity-50"
                      >
                        {isOrdering ? "Đang xử lý..." : "Hoàn tất đơn hàng"} <Send className="ml-3 w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
          </div>

          {/* Right Summary */}
          <div className="w-full lg:w-[400px]">
             <div className="sticky top-32 space-y-8">
               <div className="bg-white rounded-[40px] p-8 border border-primary/5 shadow-2xl">
                  <h3 className="text-2xl font-serif mb-8 border-b border-primary/5 pb-4">Tóm tắt đơn hàng</h3>
                  
                  <div className="space-y-6 mb-8 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {items.map((item) => (
                      <div key={item._id} className="flex space-x-4 border-b border-primary/5 pb-6 last:border-0 last:pb-0">
                        <div className="w-16 h-20 rounded-xl overflow-hidden shrink-0 border border-border-beige">
                          <img 
                            src={item.image_url || item.images?.[0]} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex flex-col justify-center">
                          <span className="text-[9px] uppercase tracking-widest font-bold opacity-40 mb-1">{item.category}</span>
                          <h4 className="font-serif text-sm mb-1 leading-tight">{item.name}</h4>
                          <div className="flex items-center text-xs font-medium">
                            <span className="text-primary font-bold">
                              {(item.flash_sale ? item.flash_sale.sale_price : item.price).toLocaleString('vi-VN')}₫
                            </span>
                            {item.flash_sale && (
                              <span className="mx-2 text-[8px] line-through text-ink/20 italic">
                                {item.price.toLocaleString('vi-VN')}₫
                              </span>
                            )}
                            <span className="mx-2 text-ink/20">x</span>
                            <span className="text-ink/40">{item.quantity}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-4 border-t border-primary/5 pt-6 mb-8">
                    <div className="flex justify-between text-sm">
                      <span className="text-ink/40">Tạm tính ({items.length} sp)</span>
                      <span className="font-semibold">{total.toLocaleString('vi-VN')}₫</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-ink/40">Phí giao hàng</span>
                      <span className="text-green-600 font-bold uppercase text-[10px] tracking-widest">Miễn phí</span>
                    </div>
                    <div className="flex justify-between text-xl font-serif pt-4 border-t border-primary/5">
                      <span>Tổng cộng</span>
                      <span className="text-primary">{total.toLocaleString('vi-VN')}₫</span>
                    </div>
                  </div>
               </div>

               <div className="p-8 bg-ink rounded-[40px] text-white">
                 <div className="flex items-center space-x-4 mb-4">
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-accent" />
                    </div>
                    <h4 className="font-serif text-lg">Bảo Hành 48 Giờ</h4>
                 </div>
                 <p className="text-xs text-white/40 leading-relaxed">Nếu hoa không tươi hoặc không đúng mẫu, FLORA cam kết đổi trả hoặc hoàn tiền 100% không cần lý do.</p>
               </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}



