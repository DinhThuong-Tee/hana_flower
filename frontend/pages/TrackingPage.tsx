import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Package,
  MapPin,
  Calendar,
  Clock,
  ChevronRight,
  XCircle,
  CheckCircle2,
  Truck,
  ListFilter,
  DollarSign,
  Star,
  MessageSquare,
} from "lucide-react";
import { Order } from "../types";
import { cn } from "../utils/cn";
import { useUI } from "../contexts/UIContext";
import { useAuth } from "../contexts/AuthContext";

export default function TrackingPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { showModal } = useUI();

  // --- States ---
  const [phone, setPhone] = useState("");
  const [orderId, setOrderId] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [currentOrderReviews, setCurrentOrderReviews] = useState<any[]>([]);
  const [activeReviewProduct, setActiveReviewProduct] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Helper lấy Header kèm Token
  const getAuthHeader = () => {
    const token = localStorage.getItem("flora_token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  useEffect(() => {
    if (profile?.uid) fetchUserOrders();
  }, [profile]);

  // Khi người dùng click mở rộng 1 đơn hàng, tải đánh giá của đơn đó
  useEffect(() => {
    if (selectedOrder?._id) {
      fetchOrderReviews(selectedOrder._id);
    }
  }, [selectedOrder]);

  const fetchUserOrders = async () => {
    if (!profile?.uid) return;
    setIsLoadingOrders(true);
    try {
      const res = await fetch(`/api/orders/user/${profile.uid}/`, { headers: getAuthHeader() });
      if (res.ok) {
        setUserOrders(await res.json());
      } else if (res.status === 401) {
        navigate("/auth");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchOrderReviews = async (id: string) => {
    try {
      const res = await fetch(`/api/reviews/order/${id}/`, { headers: getAuthHeader() });
      if (res.ok) setCurrentOrderReviews(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    try {
      const cleanOrderCode = orderId.trim().toUpperCase().replace("#", "");
      const res = await fetch(`/api/orders/track?phone=${phone.trim()}&orderCode=${cleanOrderCode}`);
      if (!res.ok) throw new Error("Không tìm thấy thông tin đơn hàng.");
      setSelectedOrder(await res.json());
    } catch (err: any) {
      showModal({ title: "Thất bại", message: err.message, type: "error" });
    } finally {
      setIsSearching(false);
    }
  };

  const cancelOrder = async (orderToCancel: Order) => {
    showModal({
      title: "Hủy đơn hàng?",
      message: "Bạn chắc chắn muốn dừng hành trình của đóa hoa này chứ?",
      type: "danger",
      showCancel: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/orders/${orderToCancel._id}/cancel/`, {
            method: "PUT",
            headers: getAuthHeader(),
          });
          if (res.ok) {
            setSelectedOrder(prev => prev?._id === orderToCancel._id ? { ...prev, order_status: "cancelled" } : prev);
            fetchUserOrders();
            showModal({ title: "Thành công", message: "Đã hủy đơn hàng.", type: "success" });
          }
        } catch (err) {
          showModal({ title: "Lỗi", message: "Không thể kết nối máy chủ.", type: "error" });
        }
      }
    });
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !activeReviewProduct) return;
    setIsSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews/", {
        method: "POST",
        headers: getAuthHeader(),
        body: JSON.stringify({
          product_id: activeReviewProduct,
          order_id: selectedOrder._id,
          rating,
          comment,
          user_name: profile?.displayName || selectedOrder.customer_info.name,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showModal({ title: "Cảm ơn bạn!", message: "Đánh giá sẽ hiện sau khi được duyệt.", type: "success" });
        setActiveReviewProduct(null);
        setComment("");
        fetchOrderReviews(selectedOrder._id);
      } else {
        showModal({ title: "Lỗi", message: data.detail || "Không thể gửi đánh giá.", type: "error" });
      }
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending": return { label: "Chờ duyệt", color: "bg-amber-100 text-amber-700", icon: Clock };
      case "shipping": return { label: "Đang giao", color: "bg-blue-100 text-blue-700", icon: Truck };
      case "completed": return { label: "Đã xong", color: "bg-green-100 text-green-700", icon: CheckCircle2 };
      case "cancelled": return { label: "Đã hủy", color: "bg-red-100 text-red-700", icon: XCircle };
      default: return { label: "Không rõ", color: "bg-gray-100 text-gray-700", icon: Package };
    }
  };

  return (
    <div className="min-h-screen bg-paper py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-serif italic text-primary mb-6">Hành Trình của Hoa</h1>
          <p className="text-[#A19B89] font-medium max-w-md mx-auto text-sm">
            Theo dõi từng bước chân của những đóa hoa nghệ thuật gửi đến người thương.
          </p>
        </div>

        {profile ? (
          <div className="mb-12 space-y-6">
            <div className="flex items-center justify-between px-4">
              <h2 className="text-xl font-serif">Đơn hàng của tôi</h2>
              <span className="text-[10px] uppercase tracking-widest font-bold opacity-30">{userOrders.length} đơn</span>
            </div>

            {isLoadingOrders ? (
              <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>
            ) : userOrders.length > 0 ? (
              <div className="space-y-4">
                {userOrders.map((o) => {
                  const isExpanded = selectedOrder?._id === o._id;
                  return (
                    <div key={o._id} className="flex flex-col">
                      <motion.button
                        onClick={() => setSelectedOrder(isExpanded ? null : o)}
                        className={cn(
                          "flex items-center justify-between p-6 bg-white rounded-3xl shadow-sm border transition-all z-10",
                          isExpanded ? "border-primary ring-4 ring-primary/5 shadow-lg" : "border-primary/5 hover:shadow-md"
                        )}
                      >
                        <div className="flex items-center gap-6">
                          <div className="p-3 bg-paper rounded-2xl"><Package className="w-6 h-6 text-primary" /></div>
                          <div className="text-left">
                            <span className="text-[9px] font-bold opacity-40">#{o.order_code}</span>
                            <h4 className="font-serif text-lg">{o.total_amount.toLocaleString()}₫</h4>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {(() => {
                            const info = getStatusInfo(o.order_status);
                            const Icon = info.icon;
                            return <div className={cn("px-4 py-1.5 rounded-full text-[9px] font-bold uppercase flex items-center", info.color)}><Icon size={12} className="mr-1.5" />{info.label}</div>;
                          })()}
                          <ChevronRight size={16} className={cn("transition-transform duration-300", isExpanded && "rotate-90")} />
                        </div>
                      </motion.button>

                      {/* CHI TIẾT XỔ XUỐNG TẠI CHỖ */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1, marginTop: -16 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-white/50 backdrop-blur-sm border-x border-b border-primary/10 rounded-b-[40px] pt-12 p-8 shadow-inner space-y-8"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8 border-b border-primary/5">
                              <div className="space-y-4">
                                <div className="flex items-start gap-3"><MapPin size={16} className="text-primary mt-1 opacity-40" /><div><p className="text-[9px] font-bold opacity-30 uppercase">Địa chỉ</p><p className="text-sm font-medium">{o.customer_info.address}</p></div></div>
                                <div className="flex items-start gap-3"><Calendar size={16} className="text-primary mt-1 opacity-40" /><div><p className="text-[9px] font-bold opacity-30 uppercase">Giao ngày</p><p className="text-sm font-medium">{o.delivery_details.date} • {o.delivery_details.time_slot}</p></div></div>
                                <div className="flex items-start gap-3"><DollarSign size={16} className="text-primary mt-1 opacity-40" /><div><p className="text-[9px] font-bold opacity-30 uppercase">Thanh toán</p><p className="text-sm font-medium uppercase">{o.payment_method}</p></div></div>
                              </div>
                              <div className="p-5 bg-paper rounded-2xl border border-primary/5 italic">
                                <p className="text-[9px] font-bold opacity-30 mb-2 not-italic uppercase">Thông điệp thiệp:</p>
                                <p className="text-sm font-serif text-primary">"{o.delivery_details.card_message || "Không có lời nhắn"}"</p>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <p className="text-[10px] uppercase font-bold opacity-30 tracking-widest">Sản phẩm thiết kế</p>
                              {o.items.map((item, idx) => {
                                const rev = currentOrderReviews.find(r => r.product_id === item.product_id);
                                return (
                                  <div key={idx} className="bg-white p-4 rounded-2xl border border-primary/5 shadow-sm">
                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center gap-3"><span className="w-8 h-8 bg-paper rounded-lg flex items-center justify-center font-bold text-xs">{item.quantity}x</span><span className="text-sm font-medium">{item.product_name || `Bó hoa #${item.product_id}`}</span></div>
                                      <div className="flex items-center gap-4">
                                        <span className="text-sm font-bold">{item.price_at_purchase.toLocaleString()}₫</span>
                                        {o.order_status === "completed" && !rev && (
                                          <button onClick={() => setActiveReviewProduct(activeReviewProduct === item.product_id ? null : item.product_id)} className="px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase bg-primary text-white">Đánh giá</button>
                                        )}
                                      </div>
                                    </div>
                                    {rev && (
                                      <div className="mt-4 pt-3 border-t border-dashed border-primary/10">
                                        <span className="text-[9px] font-bold text-green-600 uppercase bg-green-50 px-2 py-0.5 rounded mb-2 inline-block">Đã đánh giá</span>
                                        <div className="flex text-amber-400 mb-1">{[...Array(5)].map((_, i) => <Star key={i} size={12} className={cn(i < rev.rating ? "fill-current" : "text-ink/10")} />)}</div>
                                        <p className="text-xs text-ink/60 italic">"{rev.comment}"</p>
                                      </div>
                                    )}
                                    <AnimatePresence>
                                      {activeReviewProduct === item.product_id && (
                                        <motion.form initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} onSubmit={submitReview} className="mt-6 pt-6 border-t border-primary/5 space-y-4">
                                          <div className="flex gap-2">{[1, 2, 3, 4, 5].map(s => <button key={s} type="button" onClick={() => setRating(s)}><Star className={cn("w-6 h-6", s <= rating ? "fill-amber-400 text-amber-400" : "text-ink/10")} /></button>)}</div>
                                          <textarea required placeholder="Cảm nhận của bạn về bó hoa này..." className="w-full bg-paper rounded-2xl p-4 text-sm outline-none focus:ring-1 ring-primary/20 min-h-[100px]" value={comment} onChange={e => setComment(e.target.value)} />
                                          <div className="flex justify-end gap-3">
                                            <button type="button" onClick={() => setActiveReviewProduct(null)} className="text-[10px] font-bold uppercase text-ink/30">Hủy</button>
                                            <button type="submit" disabled={isSubmittingReview} className="bg-ink text-white px-6 py-2 rounded-xl text-[10px] font-bold uppercase">{isSubmittingReview ? "Đang gửi..." : "Gửi đánh giá"}</button>
                                          </div>
                                        </motion.form>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                );
                              })}
                            </div>

                            {o.order_status === "pending" && (
                              <div className="pt-4 flex justify-end"><button onClick={() => cancelOrder(o)} className="text-[10px] font-bold uppercase text-red-400 hover:text-red-600 underline underline-offset-8">Huỷ đơn hàng này</button></div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-[40px] p-20 shadow-xl text-center border border-border-beige">
                <Package className="w-12 h-12 text-ink/10 mx-auto mb-4" />
                <p className="text-sm font-medium text-ink/40">Bạn chưa có đơn hàng nào.</p>
                <Link to="/#products" className="mt-4 text-xs font-bold text-primary underline underline-offset-4 uppercase">Tiếp tục mua sắm</Link>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-[40px] p-16 shadow-2xl border border-border-beige text-center">
             <Lock size={48} className="mx-auto text-primary/20 mb-6" />
             <h2 className="text-2xl font-serif italic text-primary mb-4">Yêu Cầu Đăng Nhập</h2>
             <p className="text-sm text-ink/40 mb-10 max-w-xs mx-auto">Vui lòng đăng nhập để xem lịch sử đơn hàng và theo dõi hành trình của những đóa hoa.</p>
             <Link to="/auth" className="bg-primary text-white px-10 py-4 rounded-full font-bold uppercase text-[10px] shadow-lg inline-block">Đăng nhập ngay</Link>
          </div>
        )}
      </div>
    </div>
  );
}

function Loader2(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}