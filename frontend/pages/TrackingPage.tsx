import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
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
  const [phone, setPhone] = useState("");
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [error, setError] = useState("");
  const { showModal } = useUI();

  const [popup, setPopup] = useState<{
    title: string;
    message: string;
    type: "success" | "error" | "warning";
  } | null>(null);

  // Lưu danh sách đánh giá của đơn hàng đang xem
  const [currentOrderReviews, setCurrentOrderReviews] = useState<any[]>([]);

  const [activeReviewProduct, setActiveReviewProduct] = useState<string | null>(
    null,
  );
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
    if (profile?.uid) {
      fetchUserOrders();
    }
  }, [profile]);

  useEffect(() => {
    if (order?._id) {
      fetchOrderReviews(order._id);
    }
  }, [order]);

  // Lấy đánh giá của đơn hàng (Đã thêm Token)
  const fetchOrderReviews = async (id: string) => {
    try {
      const res = await fetch(`/api/reviews/order/${id}`, {
        headers: getAuthHeader(),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentOrderReviews(data);
      }
    } catch (err) {
      console.error("Lỗi lấy đánh giá đơn hàng:", err);
    }
  };

  // Lấy danh sách đơn hàng của User (Đã thêm Token)
  const fetchUserOrders = async () => {
    if (!profile?.uid) return;
    setIsLoadingOrders(true);
    try {
      const res = await fetch(`/api/orders/user/${profile.uid}`, {
        headers: getAuthHeader(),
      });
      if (res.ok) {
        const data = await res.json();
        setUserOrders(data);
      } else if (res.status === 401) {
        // Token hết hạn
        navigate("/auth");
      }
    } catch (err) {
      console.error("Error fetching user orders:", err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Tra cứu đơn hàng lẻ (Thường API này public hoặc dùng token nếu có)
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setError("");
    setOrder(null);

    try {
      const cleanOrderCode = orderId.trim().toUpperCase();
      const res = await fetch(
        `/api/orders/track?phone=${phone.trim()}&orderCode=${cleanOrderCode}`,
      );

      if (!res.ok) {
        throw new Error(
          "Không tìm thấy đơn hàng. Vui lòng kiểm tra lại thông tin.",
        );
      }

      const data = await res.json();
      setOrder(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  // Hủy đơn hàng (Đã thêm Token)
  const cancelOrder = async () => {
  if (!order) return;

  showModal({
    title: "Xác nhận hủy đơn?",
    message: "Bạn có chắc chắn muốn dừng hành trình của đóa hoa này không? Thao tác này không thể hoàn tác.",
    type: "danger",
    showCancel: true,
    confirmText: "Đúng, hãy hủy đơn",
    cancelText: "Quay lại",
    onConfirm: async () => {
      // Logic xóa thật được đưa vào trong này
      try {
        const res = await fetch(`/api/orders/${order._id}/cancel`, {
          method: "PUT",
          headers: {
             "Authorization": `Bearer ${localStorage.getItem("flora_token")}`
          }
        });

        if (res.ok) {
          // Cập nhật giao diện tại chỗ
          setOrder(prev => prev ? { ...prev, order_status: "cancelled" } : null);

          showModal({
            title: "Đã hủy đơn",
            message: "Đơn hàng của bạn đã được hủy thành công. Hy vọng được phục vụ bạn lần sau!",
            type: "success"
          });
          
          fetchUserOrders(); // Tải lại danh sách đơn hàng
        } else {
          const data = await res.json();
          showModal({
            title: "Lỗi thực hiện",
            message: data.error || "Không thể hủy đơn hàng lúc này.",
            type: "warning"
          });
        }
      } catch (err) {
        showModal({
          title: "Lỗi kết nối",
          message: "Mất kết nối với máy chủ, vui lòng thử lại sau.",
          type: "danger"
        });
      }
    }
  });
};

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !activeReviewProduct) return;

    setIsSubmittingReview(true);
    const token = localStorage.getItem("flora_token"); // Lấy chìa khóa từ máy

    try {
      const res = await fetch("/api/reviews/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // QUAN TRỌNG: Gửi kèm chìa khóa cho BE
        },
        body: JSON.stringify({
          product_id: activeReviewProduct,
          order_id: order._id,
          rating,
          comment,
          user_name: order.customer_info.name,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setPopup({
          title: "Thành công",
          message:
            "Cảm ơn bạn đã đánh giá! Nghệ nhân Flora sẽ sớm duyệt bài viết này.",
          type: "success",
        });
        setActiveReviewProduct(null);
        setComment("");
        setRating(5);
        fetchOrderReviews(order._id);
      } else {
        // Thay alert cũ bằng Popup đẹp
        setPopup({
          title: "Không thể đánh giá",
          message:
            data.detail || "Có lỗi xảy ra, vui lòng kiểm tra lại đăng nhập.",
          type: "error",
        });
      }
    } catch (err) {
      setPopup({
        title: "Lỗi hệ thống",
        message: "Đã xảy ra lỗi khi gửi đánh giá. Vui lòng thử lại sau.",
        type: "error",
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return {
          label: "Chờ duyệt",
          color: "bg-amber-100 text-amber-700",
          icon: Clock,
        };
      case "shipping":
        return {
          label: "Đang giao",
          color: "bg-blue-100 text-blue-700",
          icon: Truck,
        };
      case "completed":
        return {
          label: "Đã xong",
          color: "bg-green-100 text-green-700",
          icon: CheckCircle2,
        };
      case "cancelled":
        return {
          label: "Đã hủy",
          color: "bg-red-100 text-red-700",
          icon: XCircle,
        };
      default:
        return {
          label: "Không rõ",
          color: "bg-gray-100 text-gray-700",
          icon: Package,
        };
    }
  };

  return (
    <div className="min-h-screen bg-paper py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-serif italic text-primary mb-6">
            Hành Trình của Hoa
          </h1>
          <p className="text-[#A19B89] font-medium max-w-md mx-auto text-sm">
            {profile
              ? "Xem lại các đơn hàng bạn đã đặt và theo dõi hành trình của từng bó hoa."
              : "Vui lòng nhập thông tin đơn hàng để xem nghệ nhân của chúng tôi đang ở bước nào."}
          </p>
        </div>

        {profile && (
          <div className="mb-12 space-y-6">
            <div className="flex items-center justify-between px-4">
              <h2 className="text-xl font-serif">Đơn hàng của tôi</h2>
              <span className="text-[10px] uppercase tracking-widest font-bold opacity-30">
                {userOrders.length} đơn hàng
              </span>
            </div>

            {isLoadingOrders ? (
              <div className="bg-white rounded-[40px] p-20 shadow-xl border border-border-beige flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : userOrders.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {userOrders.map((o) => (
                  <motion.button
                    key={o._id}
                    onClick={() => {
                      setOrder(o);
                      window.scrollTo({ top: 500, behavior: "smooth" });
                    }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={cn(
                      "flex items-center justify-between p-6 bg-white rounded-3xl shadow-sm border border-primary/5 transition-all",
                      order?._id === o._id
                        ? "border-primary bg-primary/5"
                        : "hover:shadow-md",
                    )}
                  >
                    <div className="flex items-center gap-6">
                      <div className="p-3 bg-paper rounded-2xl">
                        <Package className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-left">
                        <span className="text-[9px] uppercase tracking-widest font-bold opacity-40 block mb-0.5">
                          #{o.order_code}
                        </span>
                        <div className="flex items-center gap-2">
                          <h4 className="font-serif text-lg">
                            {o.total_amount.toLocaleString("vi-VN")}₫
                          </h4>
                          <span className="text-ink/20 text-xs">•</span>
                          <span className="text-xs text-ink/40">
                            {new Date(o.created_at).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {(() => {
                        const info = getStatusInfo(o.order_status);
                        const StatusIcon = info.icon;
                        return (
                          <div
                            className={cn(
                              "px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center shadow-sm",
                              info.color,
                            )}
                          >
                            <StatusIcon className="w-3 h-3 mr-1.5" />
                            {info.label}
                          </div>
                        );
                      })()}
                      <ChevronRight className="w-4 h-4 text-ink/20" />
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-[40px] p-20 shadow-xl border border-border-beige text-center">
                <Package className="w-12 h-12 text-ink/10 mx-auto mb-4" />
                <p className="text-sm font-medium text-ink/40">
                  Bạn chưa có đơn hàng nào.
                </p>
                <Link
                  to="/"
                  className="mt-4 text-xs font-bold text-primary underline underline-offset-4 uppercase tracking-widest"
                >
                  Tiếp tục mua sắm
                </Link>
              </div>
            )}
          </div>
        )}

        {!profile && (
          <form
            onSubmit={handleSearch}
            className="bg-white rounded-[40px] p-10 shadow-xl border border-border-beige space-y-8 mb-16"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest font-bold text-ink/20 ml-4">
                  Số điện thoại
                </label>
                <input
                  required
                  placeholder="09xx..."
                  className="w-full bg-paper border border-border-beige rounded-2xl px-6 py-4 focus:outline-none focus:ring-1 focus:ring-primary transition-all font-sans font-medium"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest font-bold text-ink/20 ml-4">
                  Mã đơn hàng
                </label>
                <input
                  required
                  placeholder="VD: #123..."
                  className="w-full bg-paper border border-border-beige rounded-2xl px-6 py-4 focus:outline-none focus:ring-1 focus:ring-primary transition-all font-sans font-medium"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                />
              </div>
            </div>
            <button
              disabled={isSearching}
              className="w-full bg-primary text-white py-5 rounded-full font-bold uppercase tracking-widest text-[10px] hover:shadow-2xl transition-all shadow-lg flex items-center justify-center"
            >
              {isSearching ? "Đang tìm..." : "Kiểm tra ngay"}{" "}
              <Search className="ml-3 w-3 h-3" />
            </button>
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 bg-red-50 rounded-2xl text-red-600 text-sm text-center font-medium"
              >
                {error}
              </motion.div>
            )}
          </form>
        )}

        <AnimatePresence>
          {order && (
            <motion.div
              id="order-details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="bg-white rounded-[40px] p-10 shadow-2xl border border-primary/5 overflow-hidden relative">
                <button
                  onClick={() => setOrder(null)}
                  className="absolute top-8 right-8 p-2 hover:bg-paper rounded-full transition-colors text-ink/20 hover:text-ink"
                >
                  <XCircle className="w-5 h-5" />
                </button>
                <div className="flex items-center justify-between mb-10 pb-6 border-b border-primary/5">
                  <div className="flex items-center space-x-6">
                    <div className="p-4 bg-paper rounded-3xl">
                      <Package className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-widest font-bold opacity-30 mb-1 block">
                        Mã đơn hàng
                      </span>
                      <h3 className="text-2xl font-serif">
                        #{order.order_code}
                      </h3>
                    </div>
                  </div>
                  {(() => {
                    const status = getStatusInfo(order.order_status);
                    const Icon = status.icon;
                    return (
                      <div
                        className={cn(
                          "flex items-center px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest",
                          status.color,
                        )}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {status.label}
                      </div>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <MapPin className="w-5 h-5 text-primary shrink-0 opacity-40 mt-1" />
                      <div>
                        <span className="text-[10px] uppercase tracking-widest font-bold opacity-20 block mb-1">
                          Địa chỉ giao hàng
                        </span>
                        <p className="text-sm font-medium">
                          {order.customer_info.address}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <Calendar className="w-5 h-5 text-primary shrink-0 opacity-40 mt-1" />
                      <div>
                        <span className="text-[10px] uppercase tracking-widest font-bold opacity-20 block mb-1">
                          Ngày giao
                        </span>
                        <p className="text-sm font-medium">
                          {order.delivery_details.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <Clock className="w-5 h-5 text-primary shrink-0 opacity-40 mt-1" />
                      <div>
                        <span className="text-[10px] uppercase tracking-widest font-bold opacity-20 block mb-1">
                          Khung giờ
                        </span>
                        <p className="text-sm font-medium">
                          {order.delivery_details.time_slot}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <DollarSign className="w-5 h-5 text-primary shrink-0 opacity-40 mt-1" />
                      <div>
                        <span className="text-[10px] uppercase tracking-widest font-bold opacity-20 block mb-1">
                          Thanh toán
                        </span>
                        <p className="text-sm font-medium capitalize">
                          {order.payment_method === "cod"
                            ? "Tiền mặt (COD)"
                            : "Chuyển khoản / QR Code"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="p-6 bg-paper rounded-3xl space-y-4">
                      <span className="text-[10px] uppercase tracking-widest font-bold opacity-20 block">
                        Nội dung thiệp
                      </span>
                      <p className="text-sm font-serif italic text-ink/60 leading-relaxed">
                        "
                        {order.delivery_details.card_message ||
                          "Không để lại lời nhắn"}
                        "
                      </p>
                    </div>
                    {order.payment_receipt && (
                      <div className="p-4 bg-paper rounded-3xl border border-primary/5">
                        <span className="text-[10px] uppercase tracking-widest font-bold opacity-20 block mb-3">
                          Biên lai thanh toán
                        </span>
                        <img
                          src={order.payment_receipt}
                          alt="Payment Receipt"
                          className="w-full h-auto rounded-2xl cursor-zoom-in hover:shadow-lg transition-all"
                          onClick={() =>
                            window.open(order.payment_receipt, "_blank")
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-12">
                  <span className="text-[10px] uppercase tracking-widest font-bold opacity-20 block mb-6">
                    Chi tiết sản phẩm
                  </span>
                  <div className="space-y-4">
                    {order.items.map((item, idx) => {
                      const existingReview = currentOrderReviews.find(
                        (r) => r.product_id === item.product_id,
                      );
                      return (
                        <div
                          key={idx}
                          className="flex flex-col p-4 bg-paper rounded-2xl"
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-bold text-primary">
                                {item.quantity}x
                              </div>
                              <span className="text-sm font-medium">
                                {item.product_name ||
                                  `Sản phẩm #${item.product_id}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-6">
                              <span className="text-sm font-bold">
                                {item.price_at_purchase.toLocaleString("vi-VN")}
                                ₫
                              </span>
                              {order.order_status === "completed" &&
                                (existingReview ? (
                                  <div className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-green-50 text-green-600">
                                    Đã đánh giá
                                  </div>
                                ) : (
                                  <button
                                    onClick={() =>
                                      setActiveReviewProduct(
                                        activeReviewProduct === item.product_id
                                          ? null
                                          : item.product_id,
                                      )
                                    }
                                    className={cn(
                                      "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all",
                                      activeReviewProduct === item.product_id
                                        ? "bg-primary text-white"
                                        : "bg-white text-primary hover:bg-primary/5",
                                    )}
                                  >
                                    <MessageSquare className="w-3 h-3" />
                                    {activeReviewProduct === item.product_id
                                      ? "Đang viết"
                                      : "Đánh giá"}
                                  </button>
                                ))}
                            </div>
                          </div>
                          {existingReview && (
                            <div className="mt-4 pt-4 border-t border-dashed border-primary/10">
                              <div className="flex items-center gap-1 mb-2">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={cn(
                                      "w-3 h-3",
                                      i < existingReview.rating
                                        ? "fill-amber-400 text-amber-400"
                                        : "text-ink/10",
                                    )}
                                  />
                                ))}
                              </div>
                              <p className="text-xs text-ink/60 italic leading-relaxed">
                                "{existingReview.comment}"
                              </p>
                            </div>
                          )}
                          <AnimatePresence>
                            {!existingReview &&
                              activeReviewProduct === item.product_id && (
                                <motion.form
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  onSubmit={submitReview}
                                  className="overflow-hidden"
                                >
                                  <div className="pt-6 mt-6 border-t border-primary/5 space-y-6">
                                    <div className="flex flex-col gap-2">
                                      <label className="text-[9px] uppercase tracking-widest font-bold opacity-30">
                                        Phân loại trải nghiệm
                                      </label>
                                      <div className="flex items-center gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            className="p-1 transition-transform hover:scale-110"
                                          >
                                            <Star
                                              className={cn(
                                                "w-6 h-6",
                                                star <= rating
                                                  ? "fill-amber-400 text-amber-400"
                                                  : "text-ink/10",
                                              )}
                                            />
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-[9px] uppercase tracking-widest font-bold opacity-30">
                                        Cảm nhận của bạn
                                      </label>
                                      <textarea
                                        required
                                        placeholder="Bạn hài lòng về sản phẩm chứ? Hãy chia sẻ cho chúng tôi nhé..."
                                        className="w-full bg-white border border-border-beige rounded-2xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-h-[100px] font-sans"
                                        value={comment}
                                        onChange={(e) =>
                                          setComment(e.target.value)
                                        }
                                      />
                                    </div>
                                    <div className="flex justify-end gap-3">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setActiveReviewProduct(null)
                                        }
                                        className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-ink/40"
                                      >
                                        Hủy
                                      </button>
                                      <button
                                        type="submit"
                                        disabled={isSubmittingReview}
                                        className={cn(
                                          "px-8 py-3 bg-ink text-white rounded-xl text-[10px] font-bold uppercase hover:bg-primary transition-all flex items-center gap-2",
                                          isSubmittingReview && "opacity-50",
                                        )}
                                      >
                                        {isSubmittingReview
                                          ? "Đang gửi..."
                                          : "Gửi đánh giá"}
                                        <CheckCircle2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                </motion.form>
                              )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-8 border-t border-primary/5">
                  <div className="text-xl font-serif">
                    Giá trị:{" "}
                    <span className="text-primary font-bold">
                      {order.total_amount.toLocaleString("vi-VN")}₫
                    </span>
                  </div>
                  {order.order_status === "pending" && (
                    <button
                      onClick={cancelOrder}
                      className="text-xs font-bold uppercase tracking-widest text-red-400 hover:text-red-600 underline underline-offset-8 transition-colors"
                    >
                      Huỷ đơn hàng
                    </button>
                  )}
                </div>
              </div>

              <div className="p-8 bg-ink rounded-[40px] text-white flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                    <Truck className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-serif text-lg">
                      Bạn cần thay đổi thông tin?
                    </h4>
                    <p className="text-xs text-white/40">
                      Liên hệ hotline{" "}
                      {import.meta.env.VITE_HOTLINE_NUMBER || "0386920922"} để
                      điều chỉnh kịp thời.
                    </p>
                  </div>
                </div>
                <button className="bg-white text-ink px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-accent hover:text-white transition-all">
                  Chat ngay
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {popup && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setPopup(null)}
                className="absolute inset-0 bg-ink/40 backdrop-blur-md"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white w-full max-w-sm rounded-[48px] shadow-2xl relative z-10 p-10 text-center border border-border-beige"
              >
                <div
                  className={cn(
                    "w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner",
                    popup.type === "success"
                      ? "bg-green-50 text-green-600"
                      : "bg-red-50 text-red-600",
                  )}
                >
                  {popup.type === "success" ? (
                    <CheckCircle2 className="w-10 h-10" />
                  ) : (
                    <XCircle className="w-10 h-10" />
                  )}
                </div>
                <h3 className="text-2xl font-serif italic text-primary mb-3">
                  {popup.title}
                </h3>
                <p className="text-sm text-ink/40 font-medium leading-relaxed mb-8">
                  {popup.message}
                </p>
                <button
                  onClick={() => setPopup(null)}
                  className={cn(
                    "w-full py-4 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg transition-all",
                    popup.type === "success" ? "bg-primary" : "bg-red-500",
                  )}
                >
                  Đã hiểu
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
