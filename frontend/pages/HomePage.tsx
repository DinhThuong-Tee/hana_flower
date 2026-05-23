import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useSearchParams } from "react-router-dom";
import { ArrowRight, Sparkles, Truck, Clock, ShieldCheck } from "lucide-react";
import ProductCard from "../components/ProductCard";
import FlashSaleCountdown from "../components/FlashSaleCountdown";
import { Product, FlashSale } from "../types";
import { cn } from "../utils/cn";
import { useUI } from "../contexts/UIContext";
import chieclaImg from "../assets/images/chiecla.png";
import bonghoaImg from "../assets/images/bonghoa.png";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [sortBy, setSortBy] = useState("default");
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("q")?.toLowerCase() || "";
  const { showModal } = useUI();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, saleRes, revRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/flash-sales/active"),
          fetch("/api/reviews/latest"),
        ]);
        const prodData = await prodRes.json();
        const saleData = await saleRes.json();
        const revData = await revRes.json();
        setProducts(prodData);
        setFlashSales(saleData);
        setReviews(revData);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const element = document.getElementById("products");
      if (element) element.scrollIntoView({ behavior: "smooth" });
    }
  }, [searchQuery]);

  const randomHeroProducts = [...products]
    .sort(() => 0.5 - Math.random()) // Trộn ngẫu nhiên danh sách
    .slice(0, 2);

  const filteredProducts = products.filter((p) => {
    // 1. Lọc theo danh mục
    const matchesCategory =
      selectedCategory === "Tất cả" || p.categories?.includes(selectedCategory);

    // 2. Lọc theo tên sản phẩm (Tìm kiếm)
    const matchesSearch = p.name.toLowerCase().includes(searchQuery);

    return matchesCategory && matchesSearch;
  });

  const displayProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price-asc") return a.price - b.price;
    if (sortBy === "price-desc") return b.price - a.price;
    if (sortBy === "name-asc") return a.name.localeCompare(b.name);
    if (sortBy === "name-desc") return b.name.localeCompare(a.name);
    return 0;
  });

  const activeFlashSales = flashSales.filter((s) =>
    products.find((p) => p._id === s.product_id && p.is_stock),
  );
  const soonestEndSale = [...activeFlashSales].sort(
    (a, b) => new Date(a.end_time).getTime() - new Date(b.end_time).getTime(),
  )[0];

  // Extract all unique categories and reorder them
  const rawCategories = Array.from(
    new Set(products.flatMap((p) => p.categories || [])),
  ) as string[];
  const orderedBase: string[] = ["Hoa bó", "Hoa giỏ"];
  const otherCategories = rawCategories
    .filter((c) => !orderedBase.includes(c))
    .sort();
  const allCategories = ["Tất cả", ...orderedBase, ...otherCategories];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center px-12 overflow-hidden bg-[#F2F2EB] border-b border-border-beige mx-6 mt-6 rounded-[40px]">
        {/* --- HIỆU ỨNG LÁ RƠI TOÀN NỀN --- */}
        {/* --- HIỆU ỨNG RƠI ĐA DẠNG (LÁ & HOA) --- */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {[...Array(15)].map((_, i) => {
            // 1. Tạo danh sách các hình ảnh để rơi
            const fallingAssets = [chieclaImg, bonghoaImg];
            // 2. Chọn ngẫu nhiên 1 hình cho mỗi lượt
            const randomImg = fallingAssets[i % fallingAssets.length];

            return (
              <motion.img
                key={i}
                src={randomImg}
                initial={{
                  y: -150,
                  x: Math.random() * 1500,
                  rotate: 0,
                  opacity: 0,
                  scale: 0.5,
                }}
                animate={{
                  y: 900,
                  x: Math.random() * 1500 + (Math.random() > 0.5 ? 300 : -300),
                  rotate: Math.random() * 720, // Xoay vòng tự nhiên hơn
                  opacity: [0, 0.2, 0.2, 0], // Mờ ảo kiểu nghệ thuật
                  scale: [0.5, 1, 0.8, 0.5], // To dần rồi nhỏ lại
                }}
                transition={{
                  duration: 12 + Math.random() * 15, // Tốc độ rơi khác nhau
                  repeat: Infinity,
                  delay: i * 2, // Xuất hiện so le
                  ease: "easeInOut",
                }}
                style={{
                  width: 30 + Math.random() * 60 + "px",
                  filter: "blur(0.5px)",
                  // Nếu là ảnh JPG có nền trắng thì dùng multiply,
                  // nếu là ảnh PNG trong suốt thì bỏ dòng mixBlendMode này đi:
                  mixBlendMode: "multiply",
                }}
                className="absolute"
              />
            );
          })}
        </div>
        <div className="relative z-10 max-w-lg">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] uppercase tracking-[0.2em] text-accent font-bold"
          >
            Mùa Hạ 2026
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-6xl md:text-7xl font-serif italic text-primary mt-2 leading-tight tracking-tight"
          >
            Khoảnh khắc <br /> rạng ngời
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xs md:text-sm mt-6 leading-relaxed text-[#727D6B] max-w-sm font-medium"
          >
            Khám phá những mẫu hoa thiết kế độc bản mang hơi thở thiên nhiên vào
            không gian sống của bạn. Những tác phẩm nghệ thuật tinh túy từ bàn
            tay nghệ nhân.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-10 flex items-center gap-6"
          >
            <a
              href="#products"
              className="bg-primary text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest text-[10px] hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              Khám Phá Ngay
            </a>
            <a
              href="/tracking"
              className="text-primary/60 hover:text-primary font-bold uppercase tracking-widest text-[10px] transition-colors flex items-center group"
            >
              Tra cứu{" "}
              <ArrowRight className="ml-2 w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </div>

        <div className="absolute -right-20 -bottom-20 w-[400px] h-[400px] bg-sale-bg rounded-full blur-[100px] opacity-40"></div>
        <div className="absolute right-12 top-1/2 -translate-y-1/2 hidden md:flex gap-6">
          {/* HÌNH 1 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="w-48 h-72 bg-accent rounded-full overflow-hidden shadow-2xl border-4 border-white"
          >
            <img
              src={
                randomHeroProducts[0]?.images?.[0] ||
                "https://images.unsplash.com/photo-1562690868-60bbe7293e94"
              }
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              alt="Art flower"
            />
          </motion.div>

          {/* HÌNH 2 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 1 }}
            className="w-48 h-72 bg-primary rounded-full mt-12 overflow-hidden shadow-2xl border-4 border-white"
          >
            <img
              src={
                randomHeroProducts[1]?.images?.[0] ||
                "https://images.unsplash.com/photo-1591880911020-d34931ea5404"
              }
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              alt="Art flower"
            />
          </motion.div>
        </div>
      </section>

      {/* Info Strip */}
      <section className="bg-paper py-10 px-12 border-b border-border-beige">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between gap-8">
          {[
            { icon: Truck, label: "Giao Hỏa Tốc", sub: "Trong 60 phút" },
            { icon: Clock, label: "Phục Vụ 24/7", sub: "Hỗ trợ tận tâm" },
            {
              icon: Sparkles,
              label: "Thiết Kế Riêng",
              sub: "Nghệ nhân tay nghề",
            },
            { icon: ShieldCheck, label: "Cam Kết", sub: "Đổi trả dễ dàng" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white border border-border-beige rounded-full flex items-center justify-center text-primary shadow-sm">
                <item.icon className="w-5 h-5 stroke-[1.5px]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-widest text-primary">
                  {item.label}
                </span>
                <span className="text-[10px] text-ink/40 font-medium">
                  {item.sub}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Flash Sale Section */}
      {activeFlashSales.length > 0 && (
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto bg-sale-bg rounded-[48px] p-12 border border-[#D9E2C6] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>

            <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-8 relative z-10">
              <div className="text-center md:text-left">
                <div className="flex items-center gap-3 mb-2 justify-center md:justify-start">
                  <h2 className="text-3xl md:text-4xl font-serif italic text-primary">
                    Flash Sale
                  </h2>
                  <span className="bg-white text-accent px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm">
                    Đang diễn ra
                  </span>
                </div>
                <p className="text-sm font-medium text-primary/60">
                  Ưu đãi độc quyền trong thời gian giới hạn.
                </p>
              </div>

              <div className="bg-white/50 backdrop-blur-sm p-4 rounded-3xl border border-white/50">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary/40">
                    Kết thúc sau
                  </span>
                  <FlashSaleCountdown endTime={soonestEndSale.end_time} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {activeFlashSales.map((sale) => {
                const product = products.find((p) => p._id === sale.product_id);
                if (!product) return null;
                return (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                  >
                    <ProductCard product={product} flashSale={sale} />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Product List */}
      <section id="products" className="py-24 px-6 bg-paper">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16">
          {/* Aside Column (Design Detail) */}
          <aside className="w-full lg:w-64 flex flex-col gap-10">
            <div className="bg-white p-8 rounded-[32px] border border-border-beige shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-tighter text-[#A19B89] mb-6">
                Phân loại hoa
              </h3>
              <div className="space-y-4">
                {allCategories.map((cat, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "w-full text-left text-sm font-medium transition-all hover:text-primary py-1 relative flex items-center",
                      selectedCategory === cat
                        ? "text-primary font-bold"
                        : "text-ink/40",
                    )}
                  >
                    {selectedCategory === cat && (
                      <motion.div
                        layoutId="active-cat"
                        className="absolute left-[-32px] w-1 h-4 bg-primary rounded-full"
                      />
                    )}
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-[32px] border border-border-beige shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-accent"></div>
              <h3 className="text-xs font-bold uppercase tracking-tighter text-[#A19B89] mb-6">
                Đánh giá thực tế
              </h3>
              <div className="space-y-8">
                {reviews.length > 0 ? (
                  reviews.map((rev, i) => (
                    <div key={rev._id} className="space-y-3">
                      <div className="flex gap-1 text-[8px]">
                        {Array.from({ length: Math.round(rev.rating) }).map(
                          (_, star) => (
                            <span key={star}>⭐</span>
                          ),
                        )}
                      </div>
                      <p className="text-[11px] italic leading-relaxed text-[#727D6B]">
                        "{rev.comment}"
                      </p>
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full",
                            i % 2 === 0 ? "bg-accent" : "bg-primary",
                          )}
                        ></div>
                        <span className="text-[9px] font-bold">
                          {rev.user_name}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-ink/40 italic">
                    Chưa có đánh giá nào được duyệt.
                  </p>
                )}
              </div>
            </div>
          </aside>

          <div id="products" className="flex-1">
            {/* --- ĐƯA PHẦN TIÊU ĐỀ VÀ BỘ LỌC LÊN TRÊN CÙNG --- */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div className="flex flex-col">
                <h2 className="text-4xl md:text-5xl font-serif italic text-primary leading-tight">
                  Bộ Sưu Tập Artisan
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/30 italic mt-2 ml-1">
                  {filteredProducts.length} tác phẩm thiết kế
                </span>
              </div>

              {/* Sửa lại CSS cho ô Sắp xếp rộng rãi hơn */}
              <div className="flex items-center gap-3 bg-white border border-border-beige px-4 py-2 rounded-2xl shadow-sm">
                <span className="text-[9px] font-bold text-ink/30 uppercase tracking-widest whitespace-nowrap">
                  Sắp xếp:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent border-none text-[10px] font-bold uppercase text-primary outline-none cursor-pointer min-w-[140px]"
                >
                  <option value="default">Mặc định</option>
                  <option value="price-asc">Giá: Thấp đến Cao</option>
                  <option value="price-desc">Giá: Cao đến Thấp</option>
                  <option value="name-asc">Tên: A đến Z</option>
                  <option value="name-desc">Tên: Z đến A</option>
                </select>
              </div>
            </div>

            {/* --- SAU ĐÓ MỚI ĐẾN DANH SÁCH SẢN PHẨM --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              <AnimatePresence mode="popLayout">
                {displayProducts.map((p) => (
                  <motion.div
                    key={p._id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ProductCard
                      product={p}
                      flashSale={flashSales.find((s) => s.product_id === p._id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-white px-12 mx-6 mb-6 rounded-[56px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 max-w-2xl">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold mb-4 block">
            Hỗ trợ 24/7
          </span>
          <h2 className="text-4xl md:text-5xl font-serif italic mb-6 leading-tight">
            Mang hơi thở thiên nhiên <br /> vào không gian của bạn
          </h2>
          <p className="text-white/60 mb-10 text-sm font-light max-w-md leading-relaxed">
            Đội ngũ nghệ nhân của chúng tôi luôn sẵn sàng lắng nghe và thực hiện
            ý tưởng quà tặng của bạn một cách nghệ thuật nhất.
          </p>
          <div className="flex flex-col sm:space-y-0 sm:flex-row items-center space-y-4 sm:space-x-4">
            {/* NÚT CHAT ZALO */}
            <a
              href={`https://zalo.me/${import.meta.env.VITE_ZALO_NUMBER || "0386920922"}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-sale-bg text-primary px-10 py-4 rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-white transition-all shadow-xl flex items-center justify-center gap-2"
            >
              CHAT VỚI CHÚNG TÔI <span className="text-sm">💬</span>
            </a>

            {/* NÚT GỌI HOTLINE */}
            <a
              href={`tel:${import.meta.env.VITE_HOTLINE_NUMBER || "0386920922"}`}
              className="w-full sm:w-auto border border-white/20 px-10 py-4 rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all flex items-center justify-center"
            >
              HOTLINE: 0386920922
            </a>
          </div>
        </div>
      </section>

      <footer className="footer-flora px-12 py-10 bg-primary text-white/80 mx-6 mb-6 rounded-[32px]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-[9px] uppercase tracking-[0.2em] font-bold">
          <span>© 2026 Flora Boutique</span>
          <div className="flex flex-wrap justify-center gap-6 md:gap-12">
            <span className="hover:text-white cursor-pointer transition-colors">
              Thanh toán VietQR
            </span>
            <span className="hover:text-white cursor-pointer transition-colors">
              Giao hàng 60 phút
            </span>
            <span className="hover:text-white cursor-pointer transition-colors">
              Chính sách bảo hành
            </span>
            <span className="hover:text-white cursor-pointer transition-colors">
              Kể câu chuyện của bạn
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
