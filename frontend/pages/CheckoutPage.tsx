import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";

import {
  ChevronLeft,
  Info,
  CheckCircle2,
  QrCode,
  CreditCard,
  Banknote,
  Calendar,
  Clock,
  MessageSquare,
  Send,
  ArrowRight,
  ShieldCheck,
  Lock,
  Upload,
  X,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { cn } from "../utils/cn";

import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const { removeSelected } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { items: any[] } | null;
  const [items] = useState<any[]>(state?.items || []);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    date: "",
    time: "",
    message: "",
  });

  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<"vietqr" | "cod">(
    "vietqr",
  );
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);
  const [qrUrl, setQrUrl] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [hasAutoFilled, setHasAutoFilled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // States cho Popup thông báo mới
  const [isReceiptSubmitted, setIsReceiptSubmitted] = useState(false);
  const [notification, setNotification] = useState<{
    title: string;
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    if (!state?.items || state.items.length === 0) {
      navigate("/");
    }
  }, [state, navigate]);

  useEffect(() => {
    if (orderSuccess && paymentMethod === "vietqr") {
      fetch(`/api/orders/payments/vietqr/${orderSuccess.order_code}`)
        .then((res) => res.json())
        .then((data) => setQrUrl(data.qrUrl))
        .catch(() => console.error("Lỗi lấy mã QR"));
    }
  }, [orderSuccess, paymentMethod]);

  useEffect(() => {
    if (user?.uid) {
      fetch(`/api/orders/latest-info/${user.uid}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("flora_token")}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            setFormData((prev) => ({
              ...prev,
              name: data.name || prev.name,
              phone: data.phone || prev.phone,
              address: data.address || prev.address,
            }));
          }
        });
    }
  }, [user, hasAutoFilled]);

  const total = items.reduce((sum, item) => {
    const price = item.flash_sale ? item.flash_sale.sale_price : item.price;
    return sum + price * item.quantity;
  }, 0);

  // Lấy ngày hiện tại định dạng YYYY-MM-DD

  const TIME_SLOTS = [
    { label: "08:00 - 09:00", endHour: 9 },
    { label: "09:00 - 10:00", endHour: 10 },
    { label: "10:00 - 11:00", endHour: 11 },
    { label: "11:00 - 12:00", endHour: 12 },
    { label: "12:00 - 13:00", endHour: 13 },
    { label: "13:00 - 14:00", endHour: 14 },
    { label: "14:00 - 15:00", endHour: 15 },
    { label: "15:00 - 16:00", endHour: 16 },
    { label: "16:00 - 17:00", endHour: 17 },
    { label: "17:00 - 18:00", endHour: 18 },
    { label: "18:00 - 21:00", endHour: 21 },
  ];

  const getAvailableTimeSlots = () => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const currentHour = now.getHours();

    // Nếu khách chưa chọn ngày, chưa hiện giờ
    if (!formData.date) return [];

    // Nếu chọn ngày tương lai: Hiện tất cả khung giờ
    if (formData.date > todayStr) {
      return TIME_SLOTS;
    }

    // Nếu chọn ngày hôm nay: Chỉ hiện các khung giờ có giờ kết thúc > giờ hiện tại + 1 (để shop kịp chuẩn bị)
    if (formData.date === todayStr) {
      return TIME_SLOTS.filter((slot) => slot.endHour > currentHour + 1);
    }

    return [];
  };

  const validatePhoneNumber = (phone: string) => {
    if (phone.length > 0) {
      if (phone.length < 9 || phone.length > 10) {
        setNotification({
          title: "Số điện thoại chưa đúng",
          message: `Bạn đang nhập ${phone.length} số. Số điện thoại hợp lệ phải có 9 hoặc 10 chữ số. Vui lòng sửa lại.`,
          type: "error",
        });
        return false;
      }
    }
    return true;
  };

  const handleAIGenerateMessage = async () => {
    // Lấy tên người nhận từ form, nếu chưa nhập thì dùng mặc định
    const recipientName = formData.name || "người ấy";

    setIsLoading(true); // Tận dụng state loading có sẵn
    try {
      const res = await fetch("/api/ai/generate-card-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: recipientName,
          occasion: "kỷ niệm", // Có thể làm thêm dropdown chọn dịp nếu muốn
          tone: "lãng mạn",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setFormData((prev) => ({ ...prev, message: data.message }));
      }
    } catch (error) {
      console.error("Lỗi AI:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, date: e.target.value, time: "" }); // Reset khung giờ mỗi khi đổi ngày
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    // 1. Cho phép xóa trắng ô (Quan trọng nhất)
    if (val === "") {
      setFormData((prev) => ({ ...prev, phone: "" }));
      return;
    }

    // 2. Lọc chỉ lấy số
    const numericValue = val.replace(/\D/g, "");

    // 3. Giới hạn độ dài tối đa 10 số

    setFormData((prev) => ({ ...prev, phone: numericValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isPhoneValid = validatePhoneNumber(formData.phone);

    if (!isPhoneValid || formData.phone === "") {
      if (formData.phone === "") {
        setNotification({
          title: "Thiếu thông tin",
          message: "Vui lòng nhập số điện thoại để shop liên hệ giao hoa.",
          type: "error",
        });
      }
      return;
    }

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    if (getAvailableTimeSlots().length === 0 && formData.date === todayStr) {
      setNotification({
        title: "Hết khung giờ",
        message:
          "Ngày hôm nay đã hết khung giờ giao khả dụng. Vui lòng chọn ngày mai.",
        type: "error",
      });
      return;
    }

    if (step === 1) {
      setStep(2);
      return;
    }

    setIsOrdering(true);
    const orderData = {
      customer_info: {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
      },
      user_id: user?.uid,
      delivery_details: {
        date: formData.date,
        time_slot: formData.time,
        card_message: formData.message,
      },
      items: items.map((item) => ({
        product_id: item._id,
        quantity: item.quantity,
      })),
      payment_method: paymentMethod,
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      if (res.ok) {
        const data = await res.json();
        setOrderSuccess(data);
        removeSelected();
      } else {
        const errData = await res.json();
        setNotification({
          title: "Đặt hàng thất bại",
          message: errData.error || "Có lỗi xảy ra, vui lòng thử lại.",
          type: "error",
        });
      }
    } catch (err) {
      setNotification({
        title: "Lỗi kết nối",
        message: "Không thể kết nối tới máy chủ lúc này.",
        type: "error",
      });
    } finally {
      setIsOrdering(false);
    }
  };

  const handleReceiptSubmit = async () => {
    if (!receiptFile || isReceiptSubmitted) return;

    setIsUploading(true);

    // Tạo FormData chính xác
    const formDataToSend = new FormData();
    formDataToSend.append("receipt", receiptFile);

    try {
      // Thêm Timeout để tránh xoay vòng vô tận nếu mạng lag
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 15000); // 15 giây không xong thì hủy

      const res = await fetch(`/api/orders/${orderSuccess._id}/receipt`, {
        method: "PATCH",
        body: formDataToSend, // Sử dụng đúng tên biến đã khai báo
        signal: controller.signal,
      });

      clearTimeout(id);

      if (res.ok) {
        // Cập nhật state NGAY LẬP TỨC để đổi màu nút
        setIsReceiptSubmitted(true);
        setIsUploading(false); // Tắt loading sớm

        setNotification({
          title: "Gửi minh chứng thành công",
          message:
            "Nghệ nhân Flora sẽ kiểm tra và chuẩn bị hoa cho bạn ngay lập tức.",
          type: "success",
        });
      } else {
        setIsUploading(false);
        setNotification({
          title: "Tải ảnh thất bại",
          message: "Máy chủ đang bận hoặc ảnh không hợp lệ.",
          type: "error",
        });
      }
    } catch (err: any) {
      setIsUploading(false);
      const msg =
        err.name === "AbortError"
          ? "Mạng quá chậm, vui lòng thử lại."
          : "Lỗi hệ thống khi tải ảnh.";
      setNotification({
        title: "Lỗi",
        message: msg,
        type: "error",
      });
    }
  };

  if (authLoading)
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  if (!user) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[48px] shadow-2xl p-12 text-center border border-border-beige">
          <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-8">
            <Lock className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl font-serif italic text-primary mb-4">
            Mời Bạn Đăng Nhập
          </h2>
          <p className="text-[#727D6B] mb-10 font-medium leading-relaxed text-sm">
            Để bảo mật thông tin đơn hàng, vui lòng đăng nhập trước khi thanh
            toán.
          </p>
          <Link
            to="/auth"
            state={{ from: location }}
            className="w-full bg-primary text-white py-5 rounded-full font-bold uppercase text-[10px] shadow-lg flex items-center justify-center gap-3"
          >
            <Send className="w-4 h-4" />
            Đăng nhập ngay
          </Link>
          <button
            onClick={() => navigate("/")}
            className="mt-6 text-[10px] font-bold uppercase text-ink/30 hover:text-primary"
          >
            Quay lại cửa hàng
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="min-h-screen bg-paper py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {!orderSuccess ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col lg:flex-row gap-16"
            >
              {/* --- PHẦN FORM ĐẶT HÀNG --- */}
              <div className="flex-grow">
                <button
                  onClick={() => setStep(step === 1 ? 0 : 1)}
                  className="flex items-center text-xs font-bold uppercase text-ink/30 hover:text-primary mb-12"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />{" "}
                  {step === 1
                    ? "Quay lại sản phẩm"
                    : "Xem lại thông tin giao hàng"}
                </button>

                <div className="flex items-center space-x-12 mb-16">
                  <div
                    className={cn(
                      "flex items-center space-x-3",
                      step === 1 ? "opacity-100" : "opacity-30",
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                        step === 1 ? "bg-primary text-white" : "bg-ink/10",
                      )}
                    >
                      1
                    </div>
                    <span className="uppercase tracking-widest text-xs font-bold">
                      Giao hàng
                    </span>
                  </div>
                  <div className="w-12 h-px bg-primary/10"></div>
                  <div
                    className={cn(
                      "flex items-center space-x-3",
                      step === 2 ? "opacity-100" : "opacity-30",
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                        step === 2 ? "bg-primary text-white" : "bg-ink/10",
                      )}
                    >
                      2
                    </div>
                    <span className="uppercase tracking-widest text-xs font-bold">
                      Thanh toán
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-10">
                  {step === 1 ? (
                    <div className="space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className="text-[10px] uppercase font-bold text-ink/40 ml-4 tracking-widest">
                            Họ và tên người nhận
                          </label>
                          <input
                            required
                            className="w-full bg-white border border-primary/10 rounded-2xl px-6 py-4 focus:ring-2 ring-primary/20 outline-none"
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] uppercase font-bold text-ink/40 ml-4 tracking-widest">
                            Số điện thoại
                          </label>
                          <input
                            required
                            type="text"
                            inputMode="numeric" // Hiện bàn phím số trên điện thoại
                            placeholder="Nhập 9-10 chữ số..."
                            className={cn(
                              "w-full bg-white border rounded-2xl px-6 py-4 outline-none transition-all h-[58px]",
                              // Hiệu ứng viền đỏ nếu sai độ dài
                              formData.phone.length > 0 &&
                                (formData.phone.length < 9 ||
                                  formData.phone.length > 10)
                                ? "border-red-500 focus:ring-red-200"
                                : "border-primary/10 focus:ring-primary/20",
                            )}
                            value={formData.phone}
                            onChange={handlePhoneChange}
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] uppercase font-bold text-ink/40 ml-4 tracking-widest">
                          Địa chỉ giao hoa
                        </label>
                        <textarea
                          required
                          rows={3}
                          className="w-full bg-white border border-primary/10 rounded-2xl px-6 py-4 outline-none focus:ring-2 ring-primary/20 resize-none"
                          value={formData.address}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              address: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className="text-[10px] uppercase font-bold text-ink/40 ml-4 flex items-center">
                            <Calendar className="w-3 h-3 mr-2" /> Ngày giao
                          </label>
                          <input
                            required
                            type="date"
                            min={new Date().toISOString().split("T")[0]} // Chặn ngày quá khứ
                            className="w-full bg-white border border-primary/10 rounded-2xl px-6 py-4 focus:ring-2 ring-primary/20 outline-none transition-all font-medium h-[58px]"
                            value={formData.date}
                            onChange={handleDateChange}
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] uppercase font-bold text-ink/40 ml-4 flex items-center">
                            <Clock className="w-3 h-3 mr-2" /> Khung giờ
                          </label>
                          <select
                            required
                            className="w-full bg-white border border-primary/10 rounded-2xl px-6 py-4 focus:ring-2 ring-primary/20 outline-none transition-all font-medium h-[58px]"
                            value={formData.time}
                            onChange={(e) =>
                              setFormData({ ...formData, time: e.target.value })
                            }
                            disabled={!formData.date} // Chỉ cho chọn giờ khi đã chọn ngày
                          >
                            <option value="">
                              {formData.date
                                ? "Chọn khung giờ..."
                                : "Vui lòng chọn ngày trước"}
                            </option>
                            {getAvailableTimeSlots().map((slot, index) => (
                              <option key={index} value={slot.label}>
                                {slot.label}
                              </option>
                            ))}
                          </select>
                          {formData.date ===
                            new Date().toISOString().split("T")[0] &&
                            getAvailableTimeSlots().length === 0 && (
                              <p className="text-[10px] text-red-500 italic mt-1">
                                Đã quá muộn để đặt giao trong hôm nay. Vui lòng
                                chọn ngày mai.
                              </p>
                            )}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center px-4">
                          <label className="text-[10px] uppercase font-bold text-ink/40 ml-4 flex items-center">
                            <MessageSquare className="w-3 h-3 mr-2" /> Lời nhắn
                            trên thiệp
                          </label>
                          <button
                            type="button"
                            onClick={handleAIGenerateMessage}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase bg-accent/10 text-accent hover:bg-accent hover:text-white transition-all shadow-sm"
                          >
                            <Sparkles size={10} className="fill-current" />
                            AI viết hộ lời chúc
                          </button>
                        </div>
                        <textarea
                          rows={3}
                          className="w-full bg-white border border-primary/10 rounded-2xl px-6 py-4 outline-none focus:ring-2 ring-primary/20 italic resize-none"
                          placeholder="Nhập lời nhắn yêu thương..."
                          value={formData.message}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              message: e.target.value,
                            })
                          }
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-ink text-white py-6 rounded-full font-bold uppercase text-xs hover:bg-primary shadow-xl flex items-center justify-center group"
                      >
                        Tiếp tục: Thanh toán{" "}
                        <ArrowRight className="ml-3 w-4 h-4 group-hover:translate-x-2 transition-transform" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-10">
                      <div className="grid grid-cols-2 gap-6">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("vietqr")}
                          className={cn(
                            "p-8 rounded-[32px] border-2 transition-all flex flex-col items-center",
                            paymentMethod === "vietqr"
                              ? "border-primary bg-white shadow-xl"
                              : "border-primary/5 opacity-50",
                          )}
                        >
                          <QrCode className="w-10 h-10 text-primary mb-3" />
                          <span className="font-serif text-lg">VietQR</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("cod")}
                          className={cn(
                            "p-8 rounded-[32px] border-2 transition-all flex flex-col items-center",
                            paymentMethod === "cod"
                              ? "border-primary bg-white shadow-xl"
                              : "border-primary/5 opacity-50",
                          )}
                        >
                          <Banknote className="w-10 h-10 text-primary mb-3" />
                          <span className="font-serif text-lg">Tiền mặt</span>
                        </button>
                      </div>
                      <button
                        disabled={isOrdering}
                        type="submit"
                        className="w-full bg-primary text-white py-6 rounded-full font-bold uppercase text-xs shadow-xl flex items-center justify-center disabled:opacity-50"
                      >
                        {isOrdering ? "Đang xử lý..." : "Hoàn tất đơn hàng"}{" "}
                        <Send className="ml-3 w-4 h-4" />
                      </button>
                    </div>
                  )}
                </form>
              </div>

              {/* --- TÓM TẮT ĐƠN HÀNG (CỘT PHẢI) --- */}
              <div className="w-full lg:w-[400px]">
                <div className="sticky top-32 space-y-8">
                  <div className="bg-white rounded-[40px] p-8 border border-primary/5 shadow-2xl">
                    <h3 className="text-2xl font-serif mb-8 border-b border-primary/5 pb-4">
                      Tóm tắt
                    </h3>
                    <div className="space-y-6 mb-8 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {items.map((item) => (
                        <div
                          key={item._id}
                          className="flex space-x-4 border-b border-primary/5 pb-4 last:border-0"
                        >
                          <img
                            src={item.image_url || item.images?.[0]}
                            className="w-16 h-16 rounded-xl object-cover"
                            alt={item.name}
                          />
                          <div>
                            <h4 className="font-serif text-sm">{item.name}</h4>
                            <p className="text-xs text-primary font-bold">
                              {(item.flash_sale
                                ? item.flash_sale.sale_price
                                : item.price
                              ).toLocaleString()}
                              ₫ x {item.quantity}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-6 border-t border-primary/5 flex justify-between items-center">
                      <span className="font-serif text-lg">Tổng cộng</span>
                      <span className="text-xl font-bold text-primary">
                        {total.toLocaleString()}₫
                      </span>
                    </div>
                  </div>
                  <div className="p-8 bg-ink rounded-[40px] text-white flex items-center space-x-4">
                    <ShieldCheck className="w-10 h-10 text-accent" />
                    <p className="text-xs text-white/50 leading-relaxed">
                      FLORA cam kết hoa tươi 100% đúng mẫu. Đổi trả ngay lập tức
                      nếu khách hàng không hài lòng.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* --- MÀN HÌNH ĐẶT HÀNG THÀNH CÔNG --- */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[48px] shadow-2xl p-12 border border-border-beige flex flex-col md:flex-row gap-12 max-w-4xl mx-auto"
            >
              <div className="flex-1 text-center md:text-left">
                <div className="w-20 h-20 bg-[#E9EED9] rounded-full flex items-center justify-center mb-8 mx-auto md:mx-0">
                  <CheckCircle2 className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-4xl font-serif italic text-primary mb-4">
                  Đặt hàng thành công!
                </h2>
                <p className="text-[#727D6B] mb-8 text-sm leading-relaxed">
                  Đơn hàng{" "}
                  <span className="font-bold text-primary">
                    #{orderSuccess.order_code}
                  </span>{" "}
                  đã được ghi nhận.{" "}
                  {paymentMethod === "vietqr"
                    ? "Vui lòng quét mã QR để xác nhận."
                    : "Nhân viên sẽ liên hệ với bạn ngay."}
                </p>
                <div className="bg-paper p-6 rounded-3xl mb-8 space-y-3">
                  <div className="flex justify-between text-[10px] font-bold text-ink/20 uppercase">
                    <span>Mã đơn</span>
                    <span className="text-primary">
                      {orderSuccess.order_code}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-ink/20 uppercase">
                    <span>Thanh toán</span>
                    <span className="text-accent text-lg">
                      {orderSuccess.total_amount.toLocaleString()}₫
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => navigate("/tracking")}
                    className="w-full bg-primary text-white py-5 rounded-full font-bold uppercase text-[10px] shadow-lg"
                  >
                    Theo dõi hành trình hoa
                  </button>
                  <button
                    onClick={() => navigate("/")}
                    className="w-full border border-primary/10 text-primary py-5 rounded-full font-bold uppercase text-[10px]"
                  >
                    Quay lại cửa hàng
                  </button>
                </div>
              </div>

              {paymentMethod === "vietqr" && (
                <div className="flex-1 bg-paper rounded-[40px] p-8 flex flex-col items-center justify-center text-center">
                  <div className="bg-white p-4 rounded-3xl shadow-inner mb-6">
                    {qrUrl ? (
                      <img src={qrUrl} className="max-w-[240px]" alt="QR" />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center">
                        <QrCode className="animate-pulse text-ink/10 w-12 h-12" />
                      </div>
                    )}
                  </div>
                  <div className="w-full space-y-4">
                    <label className="cursor-pointer block w-full bg-white border-2 border-dashed border-primary/20 rounded-3xl p-6 text-center hover:border-primary/40 transition-all">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            setReceiptFile(f);
                            setPreviewUrl(URL.createObjectURL(f));
                            setIsReceiptSubmitted(false);
                          }
                        }}
                      />
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          className="max-h-32 mx-auto rounded-lg shadow-md"
                        />
                      ) : (
                        <div className="py-2">
                          <Upload className="w-8 h-8 text-primary mx-auto mb-2" />
                          <span className="text-[10px] font-bold text-ink/40 uppercase">
                            Tải ảnh bill xác nhận
                          </span>
                        </div>
                      )}
                    </label>

                    <button
                      onClick={handleReceiptSubmit}
                      disabled={
                        isUploading || !receiptFile || isReceiptSubmitted
                      }
                      className={cn(
                        "w-full py-4 rounded-full font-bold uppercase text-[10px] flex items-center justify-center gap-2 transition-all shadow-lg",
                        isReceiptSubmitted
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-ink text-white hover:bg-primary",
                      )}
                    >
                      {isUploading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : isReceiptSubmitted ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Đã gửi minh chứng
                        </>
                      ) : (
                        <>
                          <Send className="w-3 h-3" /> Gửi minh chứng
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* --- POPUP THÔNG BÁO TÙY CHỈNH --- */}
      <AnimatePresence>
        {notification && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNotification(null)}
              className="absolute inset-0 bg-ink/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[40px] shadow-2xl relative z-10 p-10 text-center border border-border-beige"
            >
              <div
                className={cn(
                  "w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner",
                  notification.type === "success"
                    ? "bg-green-50 text-green-600"
                    : "bg-red-50 text-red-600",
                )}
              >
                {notification.type === "success" ? (
                  <CheckCircle2 className="w-10 h-10" />
                ) : (
                  <AlertCircle className="w-10 h-10" />
                )}
              </div>
              <h3 className="text-2xl font-serif italic text-primary mb-3">
                {notification.title}
              </h3>
              <p className="text-sm text-ink/40 font-medium leading-relaxed mb-8">
                {notification.message}
              </p>
              <button
                onClick={() => setNotification(null)}
                className={cn(
                  "w-full py-4 text-white rounded-2xl font-bold uppercase text-[10px] shadow-lg transition-all",
                  notification.type === "success" ? "bg-primary" : "bg-red-500",
                )}
              >
                Tôi đã hiểu
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
