import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, Trash, AlertCircle, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  ShoppingBag,
  Star,
  Share2,
  ShieldCheck,
  Heart,
  Truck,
} from "lucide-react";
import { Product, Review, FlashSale } from "../types";
import { cn } from "../utils/cn";
import { useCart } from "../contexts/CartContext";

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [flashSale, setFlashSale] = useState<FlashSale | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "reviews">(
    "description",
  );
  const [isFavorite, setIsFavorite] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [popup, setPopup] = useState<{
    title: string;
    message: string;
    type: "success" | "danger" | "warning" | "info";
    onConfirm: () => void;
    showCancel?: boolean;
  } | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const [prodRes, saleRes] = await Promise.all([
          fetch(`/api/products/${id}`),
          fetch(`/api/flash-sales/active`),
        ]);
        const prodData = await prodRes.json();
        const saleData = await saleRes.json();

        if (prodRes.ok) setProduct(prodData);
        if (saleRes.ok) {
          const sale = saleData.find((s: FlashSale) => s.product_id === id);
          setFlashSale(sale || null);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    fetchData();

    fetch(`/api/reviews/${id}`)
      .then((res) => res.json())
      .then((data) => setReviews(data));
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      const productWithSale = {
        ...product,
        flash_sale: flashSale
          ? { sale_price: flashSale.sale_price, end_time: flashSale.end_time }
          : undefined,
      };
      addItem(productWithSale as any, quantity);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        text: product?.description,
        url: window.location.href,
      });
    } else {
      setPopup({
        title: "Thành công",
        message: "Liên kết sản phẩm đã được sao chép",
        type: "success",
        showCancel: false,
        onConfirm: () => {
          setPopup(null);
        },
      });
    }
  };

  if (!product) return <div className="p-20 text-center">Loading...</div>;

  const displayPrice = flashSale ? flashSale.sale_price : product.price;
  const hasSale = !!flashSale;

  return (
    <div className="min-h-screen bg-white">
      {addedToCart && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] bg-primary text-white px-8 py-4 rounded-full shadow-2xl font-bold uppercase tracking-widest text-[10px]"
        >
          Đã thêm vào giỏ hàng thành công!
        </motion.div>
      )}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <button
          onClick={() => navigate("/")}
          className="flex items-center text-sm font-semibold uppercase tracking-widest text-ink/40 hover:text-primary mb-12 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-2" />
          Quay lại cửa hàng
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          {/* Image Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="aspect-[4/5] overflow-hidden rounded-[40px] shadow-2xl relative">
              <img
                src={
                  product.images?.[0] ||
                  "https://images.unsplash.com/photo-1591880911020-d34931ea5404"
                }
                alt={product.name}
                className={cn(
                  "w-full h-full object-cover",
                  !product.is_stock && "grayscale opacity-70",
                )}
                referrerPolicy="no-referrer"
              />
              {!product.is_stock && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                  <span className="bg-white text-ink px-10 py-4 rounded-full text-lg font-bold uppercase tracking-widest">
                    Tạm hết hàng
                  </span>
                </div>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((img, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-2xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border border-border-beige"
                  >
                    <img src={img} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col h-full"
          >
            <div className="mb-10">
              <span className="text-primary font-bold uppercase tracking-widest text-xs mb-4 block">
                {product.categories?.join(" • ") || "Hoa tươi"}
              </span>
              <h1 className="text-5xl md:text-6xl font-serif leading-tight mb-6">
                {product.name}
              </h1>
              <div className="flex items-center space-x-6 mb-8">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-accent text-accent" />
                  ))}
                  <span className="ml-3 text-sm text-ink/40 font-medium">
                    ({reviews.length} đánh giá)
                  </span>
                </div>
                <div className="h-4 w-px bg-primary/10"></div>
                <div className="flex items-center text-green-600 text-sm font-bold uppercase tracking-widest">
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Đã kiểm duyệt
                </div>
              </div>

              <div className="flex items-baseline space-x-4 mb-10">
                <span className="text-4xl font-bold text-ink">
                  {displayPrice.toLocaleString("vi-VN")}₫
                </span>
                {hasSale && (
                  <span className="text-xl text-ink/30 line-through font-light">
                    {product.price.toLocaleString("vi-VN")}₫
                  </span>
                )}
              </div>

              <p className="text-ink/60 text-lg font-light leading-relaxed mb-10">
                {product.description}
              </p>
            </div>

            {product.is_stock ? (
              <div className="space-y-8 mt-auto">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center bg-paper border border-primary/10 rounded-full px-6 py-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="text-2xl font-light hover:text-primary transition-colors"
                    >
                      -
                    </button>
                    <span className="mx-8 font-mono text-lg font-bold">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="text-2xl font-light hover:text-primary transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={cn(
                      "p-4 bg-paper hover:bg-white border border-primary/10 rounded-full shadow-sm hover:shadow-md transition-all text-ink/40",
                      isFavorite
                        ? "text-red-500 fill-red-500"
                        : "hover:text-red-500",
                    )}
                  >
                    <Heart className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-4 bg-paper hover:bg-white border border-primary/10 rounded-full shadow-sm hover:shadow-md transition-all text-ink/40 hover:text-primary"
                  >
                    <Share2 className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      const itemToPay = {
                        ...product,
                        quantity,
                        flash_sale: flashSale
                          ? {
                              sale_price: flashSale.sale_price,
                              end_time: flashSale.end_time,
                            }
                          : undefined,
                        image_url: product.images?.[0],
                      };
                      navigate("/checkout", { state: { items: [itemToPay] } });
                    }}
                    className="w-full bg-primary text-white py-5 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-ink transition-all duration-500 shadow-xl"
                  >
                    Mua Ngay
                  </button>
                  <button
                    onClick={handleAddToCart}
                    className="w-full border border-primary/20 text-primary py-5 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-primary/5 transition-all"
                  >
                    Thêm Vào Giỏ
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-auto">
                <button
                  disabled
                  className="w-full bg-ink/10 text-ink/30 py-5 rounded-full font-bold uppercase tracking-widest text-sm cursor-not-allowed"
                >
                  Hết hàng tạm thời
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-8 mt-16 p-8 bg-paper rounded-[32px] border border-primary/5">
              <div className="flex flex-col items-center text-center">
                <Truck className="w-8 h-8 text-primary mb-3 stroke-[1px]" />
                <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">
                  Giao hàng
                </span>
                <span className="text-sm font-medium mt-1">2 Giờ hỏa tốc</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <ShieldCheck className="w-8 h-8 text-primary mb-3 stroke-[1px]" />
                <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">
                  Đảm bảo
                </span>
                <span className="text-sm font-medium mt-1">
                  Tươi mới cực hạn
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs Section */}
        <div className="mt-32">
          <div className="flex items-center space-x-12 border-b border-primary/5 mb-12 overflow-x-auto">
            <button
              onClick={() => setActiveTab("description")}
              className={cn(
                "pb-6 text-sm font-bold uppercase tracking-[0.2em] transition-all relative",
                activeTab === "description" ? "text-primary" : "text-ink/30",
              )}
            >
              Chi tiết sản phẩm
              {activeTab === "description" && (
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={cn(
                "pb-6 text-sm font-bold uppercase tracking-[0.2em] transition-all relative",
                activeTab === "reviews" ? "text-primary" : "text-ink/30",
              )}
            >
              Đánh giá ({reviews.length})
              {activeTab === "reviews" && (
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary"></div>
              )}
            </button>
          </div>

          {/* --- HỆ THỐNG POPUP ĐỒNG BỘ --- */}
          <AnimatePresence>
            {popup && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => !popup.showCancel && popup.onConfirm()} // Click ngoài để đóng nếu là dạng Alert
                  className="absolute inset-0 bg-ink/40 backdrop-blur-md"
                />
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="bg-white w-full max-w-sm rounded-[48px] shadow-2xl relative z-10 p-10 text-center border border-border-beige"
                >
                  {/* Icon linh hoạt theo Type */}
                  <div
                    className={cn(
                      "w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner",
                      popup.type === "success" && "bg-green-50 text-green-600",
                      popup.type === "danger" && "bg-red-50 text-red-500",
                      popup.type === "warning" && "bg-amber-50 text-amber-500",
                      popup.type === "info" && "bg-blue-50 text-blue-500",
                    )}
                  >
                    {popup.type === "success" && (
                      <CheckCircle className="w-10 h-10" />
                    )}
                    {popup.type === "danger" && <Trash className="w-10 h-10" />}
                    {popup.type === "warning" && (
                      <AlertCircle className="w-10 h-10" />
                    )}
                    {popup.type === "info" && <Info className="w-10 h-10" />}
                  </div>

                  <h3 className="text-2xl font-serif italic text-primary mb-3">
                    {popup.title}
                  </h3>
                  <p className="text-sm text-ink/40 font-medium leading-relaxed mb-10">
                    {popup.message}
                  </p>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={popup.onConfirm}
                      className={cn(
                        "w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] text-white shadow-xl transition-all active:scale-95",
                        popup.type === "success"
                          ? "bg-primary"
                          : popup.type === "danger"
                            ? "bg-red-500"
                            : "bg-ink",
                      )}
                    >
                      {popup.showCancel ? "Xác nhận" : "Đồng ý"}
                    </button>

                    {popup.showCancel && (
                      <button
                        onClick={() => setPopup(null)}
                        className="w-full py-3 text-[10px] font-bold uppercase text-ink/20 hover:text-ink/40 transition-colors"
                      >
                        Hủy bỏ
                      </button>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <div className="max-w-3xl">
            {activeTab === "description" ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <p className="text-ink/60 text-lg leading-relaxed font-light">
                  Những đóa hoa được các thợ thủ công lành nghề nhất của FLORA
                  tuyển chọn khắt khe từng cành một. Chúng tôi cam kết sử dụng
                  hoa tươi nhập khẩu trực tiếp từ các trang trại chuẩn GlobalGAP
                  tại Đà Lạt và Hà Lan.
                </p>
                <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                  <div>
                    <h5 className="font-serif text-lg mb-2">Thành phần</h5>
                    <p className="text-ink/40 text-sm">
                      Hoa hồng Ecuador, Lá bạc nhập khẩu, Giấy gói lụa cao cấp.
                    </p>
                  </div>
                  <div>
                    <h5 className="font-serif text-lg mb-2">Độ bền</h5>
                    <p className="text-ink/40 text-sm">
                      Trung bình 5-7 ngày tùy điều kiện bảo quản.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div
                      key={review._id}
                      className="border-b border-primary/5 pb-10 last:border-0"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h6 className="font-serif text-xl">
                          {review.user_name || "Khách Hàng Ẩn Danh"}
                        </h6>
                        <div className="flex items-center text-accent">
                          {[...Array(Math.round(review.rating))].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="text-ink/60 font-light mb-6 leading-relaxed italic">
                        "{review.comment}"
                      </p>
                      {review.images && review.images.length > 0 && (
                        <div className="flex space-x-4">
                          {review.images.map((img, i) => (
                            <img
                              key={i}
                              src={img}
                              className="w-24 h-24 object-cover rounded-2xl shadow-md"
                              alt="review"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-12 bg-paper rounded-[40px] text-center border-2 border-dashed border-primary/10">
                    <Star className="w-12 h-12 text-primary/10 mx-auto mb-4" />
                    <p className="text-ink/40 font-medium uppercase tracking-widest text-xs">
                      Chưa có đánh giá nào cho sản phẩm này
                    </p>
                    <p className="text-sm mt-2 text-ink/20">
                      Hãy trở thành người đầu tiên chia sẻ cảm nhận!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
