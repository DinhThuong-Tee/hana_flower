import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  Eye,
  Edit,
  Trash,
  Plus,
  BarChart3,
  Activity,
  ShieldAlert,
  Home,
  X,
  Save,
  Loader2,
  Image as ImageIcon,
  Zap,
  MessageSquare,
  CheckCircle,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "../utils/cn";
import { useAuth } from "../contexts/AuthContext";
import { Product, Order, FlashSale, Review } from "../types";

export default function AdminPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // --- States Dữ liệu ---
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({
    totalRev: 0,
    activeOrders: 0,
    totalProducts: 0,
    completionRate: 0,
  });

  // --- States UI & Modals ---
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderReviews, setOrderReviews] = useState<Review[]>([]);
  const [isLoadingOrderDetails, setIsLoadingOrderDetails] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingFlashSale, setIsAddingFlashSale] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState<{
    orderId: string;
    status: string;
  } | null>(null);

  // --- States Lọc & Tìm kiếm ---
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryCategory, setInventoryCategory] = useState("Tất cả");
  const [showInventorySearch, setShowInventorySearch] = useState(false);
  const [showInventoryFilter, setShowInventoryFilter] = useState(false);

  // --- States PHÂN TRANG ---
  const [orderPage, setOrderPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(10);
  const [inventoryPage, setInventoryPage] = useState(1);
  const inventoryPerPage = 10;

  // --- States Form ---
  const initialProductState = {
    name: "",
    price: 0,
    original_price: 0,
    description: "",
    image_url: "",
    categories: ["Hoa bó"],
    is_stock: true,
  };
  const [newProduct, setNewProduct] = useState<Partial<Product>>(
    initialProductState as any,
  );
  const [newFlashSale, setNewFlashSale] = useState<Partial<FlashSale>>({
    product_id: "",
    sale_price: 0,
    start_time: new Date().toISOString().slice(0, 16),
    end_time: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
  });

  // --- Fetch Data ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [pRes, oRes, fRes, rRes, sRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/admin/orders"),
        fetch("/api/flash-sales"),
        fetch("/api/admin/reviews"),
        fetch("/api/admin/stats"),
      ]);
      if (pRes.ok) setProducts(await pRes.json());
      if (oRes.ok) setOrders(await oRes.json());
      if (fRes.ok) setFlashSales(await fRes.json());
      if (rRes.ok) setReviews(await rRes.json());
      if (sRes.ok) setStats(await sRes.json());
    } catch (error) {
      console.error("Admin Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAdmin) fetchData();
    else if (!authLoading && !isAdmin) navigate("/");
  }, [authLoading, isAdmin]);

  // Reset trang khi lọc
  useEffect(() => {
    setInventoryPage(1);
  }, [inventorySearch, inventoryCategory]);
  useEffect(() => {
    setOrderPage(1);
  }, [ordersPerPage]);

  // --- Logic Phân Trang Sản Phẩm ---
  const filteredInventory = products.filter((p) => {
    const s = p.name.toLowerCase().includes(inventorySearch.toLowerCase());
    const c =
      inventoryCategory === "Tất cả" ||
      p.categories?.includes(inventoryCategory);
    return s && c;
  });
  const totalInventoryPages = Math.ceil(
    filteredInventory.length / inventoryPerPage,
  );
  const paginatedInventory = filteredInventory.slice(
    (inventoryPage - 1) * inventoryPerPage,
    inventoryPage * inventoryPerPage,
  );

  // --- Logic Phân Trang Đơn Hàng ---
  const totalOrderPages = Math.ceil(orders.length / ordersPerPage);
  const paginatedOrders = orders.slice(
    (orderPage - 1) * ordersPerPage,
    orderPage * ordersPerPage,
  );

  // --- Handlers Sản Phẩm ---
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { image_url, ...rest } = newProduct as any;
      const data = { ...rest, images: [image_url] };
      const url = editingId
        ? `/api/admin/products/${editingId}`
        : "/api/admin/products";
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setIsAddingProduct(false);
        setEditingId(null);
        setNewProduct(initialProductState as any);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm("Xóa vĩnh viễn sản phẩm này?")) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (res.ok) fetchData();
  };

  const toggleStock = async (id: string, current: boolean) => {
    const res = await fetch(`/api/admin/products/${id}/stock`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_stock: !current }),
    });
    if (res.ok)
      setProducts((prev) =>
        prev.map((p) => (p._id === id ? { ...p, is_stock: !current } : p)),
      );
  };

  // --- Handlers Đơn Hàng ---
  const executeStatusUpdate = async (id: string, status: string) => {
    const res = await fetch(`/api/admin/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setOrders((prev) =>
        prev.map((o) =>
          o._id === id ? { ...o, order_status: status as any } : o,
        ),
      );
      setConfirmStatus(null);
      const sRes = await fetch("/api/admin/stats");
      if (sRes.ok) setStats(await sRes.json());
    }
  };

  // --- Handlers Flash Sale & Review ---
  const handleAddFlashSale = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/flash-sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newFlashSale),
    });
    if (res.ok) {
      setIsAddingFlashSale(false);
      fetchData();
    }
  };

  const deleteFlashSale = async (id: string) => {
    if (window.confirm("Dừng đợt Sale này?")) {
      await fetch(`/api/admin/flash-sales/${id}`, { method: "DELETE" });
      fetchData();
    }
  };

  const toggleReviewStatus = async (id: string, current: boolean) => {
    await fetch(`/api/admin/reviews/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_approved: !current }),
    });
    setReviews((prev) =>
      prev.map((r) => (r._id === id ? { ...r, is_approved: !current } : r)),
    );
  };

  const hideReview = async (id: string) => {
    if (window.confirm("Ẩn đánh giá này khỏi Admin?")) {
      await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      setReviews((prev) => prev.filter((r) => r._id !== id));
    }
  };

  if (authLoading || (isAdmin && isLoading && products.length === 0)) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const allInventoryCategories = [
    "Tất cả",
    "Hoa bó",
    "Hoa giỏ",
    "Lãng mạn",
    "Khai trương",
    "Sinh nhật",
    "Chia buồn",
  ];

  return (
    <div className="min-h-screen bg-paper/30 pb-32">
      {/* --- HEADER --- */}
      <div className="bg-white border-b border-border-beige px-10 py-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-accent mb-2 block">
              Quản trị HanaFlower
            </span>
            <h1 className="text-6xl font-serif italic text-primary">
              Bảng Điều Khiển
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsAddingFlashSale(true)}
              className="bg-accent text-white px-8 py-4 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl hover:-translate-y-1 transition-all flex items-center"
            >
              <Zap className="w-3 h-3 mr-2 fill-white" /> Flash Sale
            </button>
            <button
              onClick={() => {
                setEditingId(null);
                setNewProduct(initialProductState as any);
                setIsAddingProduct(true);
              }}
              className="bg-primary text-white px-8 py-4 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl hover:-translate-y-1 transition-all flex items-center"
            >
              <Plus className="w-3 h-3 mr-2" /> Thêm tác phẩm
            </button>
            <button
              onClick={fetchData}
              className="bg-paper border border-border-beige text-primary w-12 h-12 rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-colors shadow-sm"
            >
              <Activity
                className={cn("w-5 h-5", isLoading && "animate-pulse")}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
          {[
            {
              icon: DollarSign,
              label: "Doanh thu",
              val: `${stats.totalRev.toLocaleString()}₫`,
              color: "bg-green-100 text-green-700",
              sub: "Đơn đã hoàn thành",
            },
            {
              icon: ShoppingBag,
              label: "Đang xử lý",
              val: stats.activeOrders,
              color: "bg-blue-100 text-blue-700",
              sub: "Đơn chờ & đang giao",
            },
            {
              icon: BarChart3,
              label: "Sản phẩm",
              val: stats.totalProducts,
              color: "bg-amber-100 text-amber-700",
              sub: "Tổng hoa trong kho",
            },
            {
              icon: Users,
              label: "Tỉ lệ xong",
              val: `${stats.completionRate.toFixed(1)}%`,
              color: "bg-purple-100 text-purple-700",
              sub: "Hiệu suất hệ thống",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white p-8 rounded-[40px] shadow-sm border border-border-beige hover:shadow-xl transition-all duration-500"
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center mb-6",
                  item.color,
                )}
              >
                <item.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold opacity-30 block mb-2">
                {item.label}
              </span>
              <h4 className="text-3xl font-bold font-serif italic text-primary">
                {item.val}
              </h4>
              <p className="mt-4 text-ink/30 text-[9px] font-bold uppercase tracking-tighter">
                {item.sub}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            {/* --- ORDERS TABLE --- */}
            <div className="bg-white rounded-[48px] shadow-2xl border border-primary/5 overflow-hidden">
              <div className="px-10 py-8 border-b border-primary/5 flex items-center justify-between">
                <h3 className="text-2xl font-serif">Đơn Hàng Gần Đây</h3>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
                  <input
                    className="bg-paper border border-primary/5 rounded-full pl-10 pr-4 py-2 text-xs outline-none focus:ring-1 ring-primary/20"
                    placeholder="Tìm mã đơn..."
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-paper/50 text-[10px] uppercase tracking-widest text-ink/60 font-bold">
                      <th className="px-10 py-6 text-left">Mã Đơn</th>
                      <th className="px-6 py-6 text-left">Khách Hàng</th>
                      <th className="px-6 py-6 text-left">Giá Trị</th>
                      <th className="px-6 py-6 text-left">Trạng Thái</th>
                      <th className="px-10 py-6 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/5">
                    {paginatedOrders.map((o) => (
                      <tr
                        key={o._id}
                        className="hover:bg-paper/30 transition-colors"
                      >
                        <td className="px-10 py-6 font-mono text-xs text-ink/40">
                          #{o.order_code}
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm">
                              {o.customer_info.name}
                            </span>
                            <span className="text-[10px] text-ink/20">
                              {o.customer_info.phone}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-6 font-bold text-sm">
                          {o.total_amount.toLocaleString()}₫
                        </td>
                        <td className="px-6 py-6">
                          <select
                            value={o.order_status}
                            onChange={(e) =>
                              executeStatusUpdate(o._id, e.target.value)
                            }
                            className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-bold uppercase border-none bg-paper cursor-pointer",
                              o.order_status === "completed"
                                ? "text-green-600"
                                : o.order_status === "cancelled"
                                  ? "text-red-600"
                                  : "text-amber-600",
                            )}
                          >
                            <option value="pending">Chờ duyệt</option>
                            <option value="shipping">Đang giao</option>
                            <option value="completed">Đã xong</option>
                            <option value="cancelled">Hủy đơn</option>
                          </select>
                        </td>
                        <td className="px-10 py-6 text-right">
                          <button
                            onClick={() => {
                              setSelectedOrder(o);
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination Đơn hàng */}
              <div className="px-10 py-6 bg-paper/20 border-t border-primary/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-[9px] uppercase font-bold text-ink/40">
                    Hiển thị
                  </span>
                  <select
                    value={ordersPerPage}
                    onChange={(e) => setOrdersPerPage(Number(e.target.value))}
                    className="bg-white border border-border-beige rounded-lg px-2 py-1 text-[10px] font-bold text-primary"
                  >
                    {[5, 10, 20].map((v) => (
                      <option key={v} value={v}>
                        {v} đơn
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    disabled={orderPage === 1}
                    onClick={() => setOrderPage((p) => p - 1)}
                    className="p-1 hover:bg-white rounded-full disabled:opacity-20"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                    Trang {orderPage} / {totalOrderPages || 1}
                  </span>
                  <button
                    disabled={orderPage >= totalOrderPages}
                    onClick={() => setOrderPage((p) => p + 1)}
                    className="p-1 hover:bg-white rounded-full disabled:opacity-20"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* --- FLASH SALE & REVIEWS (Tương tự nhưng tăng màu icon) --- */}
            <div className="bg-white rounded-[48px] shadow-2xl border border-primary/5 p-10">
              <div className="flex items-center gap-4 mb-8">
                <Zap className="w-6 h-6 text-accent fill-accent" />
                <h3 className="text-2xl font-serif">Flash Sale Đang Chạy</h3>
              </div>
              <div className="space-y-4">
                {flashSales.map((fs) => {
                  const p = products.find((prod) => prod._id === fs.product_id);
                  return (
                    <div
                      key={fs._id}
                      className="flex items-center justify-between p-4 bg-paper/20 rounded-2xl border border-border-beige"
                    >
                      <div className="flex items-center gap-4">
                        <div className="font-bold text-sm">
                          {p?.name || "SP đã xóa"}
                        </div>
                        <div className="text-accent font-bold">
                          {fs.sale_price.toLocaleString()}₫
                        </div>
                      </div>
                      <button
                        onClick={() => deleteFlashSale(fs._id)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-full"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-[48px] shadow-2xl border border-primary/5 p-10">
              <div className="flex items-center gap-4 mb-8">
                <MessageSquare className="w-6 h-6 text-blue-600" />
                <h3 className="text-2xl font-serif">Đánh Giá Khách Hàng</h3>
              </div>
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div
                    key={rev._id}
                    className="flex items-center justify-between p-6 bg-paper/20 rounded-3xl border border-border-beige"
                  >
                    <div className="flex-1">
                      <div className="font-bold text-sm mb-1">
                        {rev.user_name}{" "}
                        <span className="text-[10px] text-ink/20 ml-2 font-normal">
                          {new Date(rev.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-ink/60 italic">
                        "{rev.comment}"
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          toggleReviewStatus(rev._id, rev.is_approved)
                        }
                        className={cn(
                          "px-4 py-1.5 rounded-full text-[9px] font-bold uppercase transition-all",
                          rev.is_approved
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700",
                        )}
                      >
                        {rev.is_approved ? "Đã duyệt" : "Chờ duyệt"}
                      </button>
                      <button
                        onClick={() => hideReview(rev._id)}
                        className="text-red-500 p-2 hover:bg-red-50 rounded-full"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* --- SIDEBAR: PRODUCT INVENTORY --- */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[48px] shadow-2xl border border-primary/5 overflow-hidden h-[850px] flex flex-col sticky top-24">
              <div className="px-8 py-8 border-b border-primary/5">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-serif italic text-primary">
                    Kho Tác Phẩm
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowInventorySearch(!showInventorySearch);
                        setShowInventoryFilter(false);
                      }}
                      className={cn(
                        "p-2 rounded-full transition-all",
                        showInventorySearch
                          ? "bg-primary text-white"
                          : "text-primary hover:bg-paper",
                      )}
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setShowInventoryFilter(!showInventoryFilter);
                        setShowInventorySearch(false);
                      }}
                      className={cn(
                        "p-2 rounded-full transition-all",
                        showInventoryFilter
                          ? "bg-primary text-white"
                          : "text-primary hover:bg-paper",
                      )}
                    >
                      <Filter className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <AnimatePresence>
                  {showInventorySearch && (
                    <motion.input
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      className="w-full bg-paper border border-primary/5 rounded-2xl px-4 py-3 text-xs outline-none mb-4"
                      placeholder="Tìm tên hoa..."
                      value={inventorySearch}
                      onChange={(e) => setInventorySearch(e.target.value)}
                    />
                  )}
                  {showInventoryFilter && (
                    <motion.select
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      className="w-full bg-paper border border-primary/5 rounded-2xl px-4 py-3 text-xs outline-none mb-4"
                      value={inventoryCategory}
                      onChange={(e) => setInventoryCategory(e.target.value)}
                    >
                      {allInventoryCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </motion.select>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                {paginatedInventory.map((p) => (
                  <div
                    key={p._id}
                    className="group bg-paper/30 p-4 rounded-3xl border border-border-beige hover:bg-paper/60 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={p.images?.[0]}
                        className="w-12 h-12 rounded-xl object-cover shadow-sm border border-white"
                      />
                      <div className="max-w-[100px]">
                        <h5 className="text-[11px] font-bold text-primary truncate">
                          {p.name}
                        </h5>
                        <p className="text-[10px] text-accent font-bold">
                          {p.price.toLocaleString()}₫
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleStock(p._id, p.is_stock)}
                        className={cn(
                          "w-8 h-4 rounded-full relative transition-all",
                          p.is_stock ? "bg-green-500" : "bg-ink/10",
                        )}
                      >
                        <div
                          className={cn(
                            "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                            p.is_stock ? "right-1" : "left-1",
                          )}
                        />
                      </button>
                      <button
                        onClick={() => {
                          setNewProduct({
                            ...p,
                            image_url: p.images?.[0],
                          } as any);
                          setEditingId(p._id);
                          setIsAddingProduct(true);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteProduct(p._id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Sản phẩm */}
              <div className="p-4 bg-paper/50 border-t border-primary/5 flex items-center justify-center gap-4">
                <button
                  disabled={inventoryPage === 1}
                  onClick={() => setInventoryPage((p) => p - 1)}
                  className="p-1.5 rounded-xl bg-white shadow-sm border border-border-beige disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4 text-primary" />
                </button>
                <span className="text-[9px] font-bold text-ink/40 uppercase">
                  Trang {inventoryPage} / {totalInventoryPages || 1}
                </span>
                <button
                  disabled={inventoryPage >= totalInventoryPages}
                  onClick={() => setInventoryPage((p) => p + 1)}
                  className="p-1.5 rounded-xl bg-white shadow-sm border border-border-beige disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4 text-primary" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Chi tiết đơn hàng */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-ink/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[48px] shadow-2xl relative z-10 overflow-hidden flex flex-col border border-border-beige"
            >
              {/* Header Modal */}
              <div className="p-8 border-b border-border-beige flex items-center justify-between bg-paper/30">
                <div>
                  <span className="text-[10px] uppercase font-bold text-accent mb-1 block">
                    Chi tiết đơn hàng
                  </span>
                  <h3 className="text-2xl font-serif italic text-primary">
                    Mã đơn: #{selectedOrder.order_code}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-paper rounded-full transition-all"
                >
                  <X className="w-6 h-6 text-ink/40" />
                </button>
              </div>

              {/* Nội dung Modal */}
              <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {/* CỘT TRÁI: THÔNG TIN CON NGƯỜI */}
                  <div className="space-y-8">
                    <section>
                      <h4 className="text-[10px] uppercase font-bold text-ink/20 mb-4 tracking-widest flex items-center">
                        <Users className="w-3 h-3 mr-2" /> Thông tin nhân sự
                      </h4>
                      <div className="space-y-4 bg-paper/50 p-6 rounded-3xl border border-primary/5">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-ink/40 block mb-1">
                            Người đặt (Tên Acc)
                          </span>
                          <p className="font-bold text-primary">
                            {selectedOrder.account_name || "Khách vãng lai"}
                          </p>
                        </div>
                        <div className="h-px bg-primary/5 w-full" />
                        <div>
                          <span className="text-[9px] uppercase font-bold text-ink/40 block mb-1">
                            Người nhận hoa
                          </span>
                          <p className="font-bold text-lg">
                            {selectedOrder.customer_info.name}
                          </p>
                          <p className="text-xs text-ink/40 mt-1">
                            {selectedOrder.customer_info.phone}
                          </p>
                          <p className="text-xs text-ink/40 italic mt-1">
                            {selectedOrder.customer_info.address}
                          </p>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h4 className="text-[10px] uppercase font-bold text-ink/20 mb-4 tracking-widest flex items-center">
                        <ShoppingBag className="w-3 h-3 mr-2" /> Sản phẩm thiết
                        kế
                      </h4>
                      <div className="space-y-3">
                        {selectedOrder.items.map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-4 bg-white rounded-2xl border border-primary/5 shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-paper rounded-lg flex items-center justify-center text-xs font-bold text-primary">
                                {item.quantity}x
                              </div>
                              <span className="text-sm font-medium">
                                {" "}
                                {item.product_name ||
                                  `Sản phẩm #${item.product_id}`}
                              </span>
                            </div>
                            <span className="text-sm font-bold">
                              {item.price_at_purchase.toLocaleString()}₫
                            </span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between pt-4 border-t border-primary/5">
                          <span className="font-serif italic">Tổng cộng:</span>
                          <span className="text-xl font-bold text-primary">
                            {selectedOrder.total_amount.toLocaleString()}₫
                          </span>
                        </div>
                      </div>
                    </section>
                  </div>

                  {/* CỘT PHẢI: THANH TOÁN & ĐÁNH GIÁ */}
                  <div className="space-y-8">
                    <section>
                      <h4 className="text-[10px] uppercase font-bold text-ink/20 mb-4 tracking-widest flex items-center">
                        <DollarSign className="w-3 h-3 mr-2" /> Thanh toán &
                        Trạng thái
                      </h4>
                      <div className="bg-paper/50 p-6 rounded-3xl border border-primary/5 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-ink/60 uppercase">
                            {selectedOrder.payment_method === "cod"
                              ? "Tiền mặt (COD)"
                              : "Chuyển khoản / VietQR"}
                          </span>
                          <span
                            className={cn(
                              "px-3 py-1 rounded-full text-[9px] font-bold uppercase",
                              selectedOrder.payment_status === "paid"
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700",
                            )}
                          >
                            {selectedOrder.payment_status === "paid"
                              ? "Đã thanh toán"
                              : "Chưa thanh toán"}
                          </span>
                        </div>

                        {/* Ảnh Bill nếu thanh toán QR */}
                        {selectedOrder.payment_receipt && (
                          <div className="mt-4">
                            <span className="text-[9px] font-bold text-ink/30 block mb-2 uppercase">
                              Biên lai đính kèm:
                            </span>
                            <img
                              src={selectedOrder.payment_receipt}
                              className="w-full h-48 object-cover rounded-2xl shadow-lg cursor-zoom-in hover:scale-[1.02] transition-all"
                              alt="Bill thanh toán"
                              onClick={() =>
                                window.open(
                                  selectedOrder.payment_receipt,
                                  "_blank",
                                )
                              }
                            />
                          </div>
                        )}
                      </div>
                    </section>

                    <section>
                      <h4 className="text-[10px] uppercase font-bold text-ink/20 mb-4 tracking-widest flex items-center">
                        <MessageSquare className="w-3 h-3 mr-2" /> Đánh giá của
                        khách
                      </h4>
                      <div className="bg-white p-6 rounded-3xl border border-primary/5 shadow-inner min-h-[100px]">
                        {isLoadingOrderDetails ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="w-5 h-5 animate-spin text-ink/20" />
                          </div>
                        ) : orderReviews && orderReviews.length > 0 ? (
                          <div className="space-y-4">
                            {orderReviews.map((rev: any) => (
                              <div key={rev._id} className="space-y-2">
                                <div className="flex text-amber-400">
                                  {[...Array(rev.rating)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className="w-3 h-3 fill-current"
                                    />
                                  ))}
                                </div>
                                <p className="text-sm text-ink/60 italic leading-relaxed">
                                  "{rev.comment}"
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-ink/20 italic text-center py-4">
                            Đơn hàng này chưa có đánh giá.
                          </p>
                        )}
                      </div>
                    </section>
                  </div>
                </div>
              </div>

              {/* Footer Modal */}
              <div className="p-8 border-t border-border-beige bg-paper/30 flex justify-end">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="bg-primary text-white px-10 py-3 rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-ink transition-all shadow-lg"
                >
                  Đóng cửa sổ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* --- MODAL: THÊM / SỬA SẢN PHẨM --- */}
      <AnimatePresence>
        {isAddingProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingProduct(false)}
              className="absolute inset-0 bg-ink/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl relative z-10 overflow-hidden border border-border-beige"
            >
              <div className="p-10 border-b border-border-beige flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-accent mb-1 block">
                    {editingId ? "Chỉnh sửa" : "Sáng tạo mới"}
                  </span>
                  <h3 className="text-3xl font-serif italic text-primary">
                    {editingId ? "Cập Nhật Tác Phẩm" : "Thêm Tác Phẩm"}
                  </h3>
                </div>
                <button
                  onClick={() => setIsAddingProduct(false)}
                  className="p-3 hover:bg-paper rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-ink/40" />
                </button>
              </div>
              <form
                onSubmit={handleSaveProduct}
                className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-ink/60 ml-4">
                      Tên tác phẩm
                    </label>
                    <input
                      required
                      className="w-full bg-paper border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 ring-primary/20 outline-none"
                      value={newProduct.name}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-ink/60 ml-4">
                      Danh mục (Chọn nhiều)
                    </label>
                    <div className="grid grid-cols-2 gap-3 bg-paper p-4 rounded-2xl">
                      {[
                        "Hoa bó",
                        "Hoa giỏ",
                        "Lãng mạn",
                        "Khai trương",
                        "Sinh nhật",
                        "Chia buồn",
                      ].map((cat) => {
                        const isSelected = (
                          newProduct as any
                        ).categories?.includes(cat);
                        return (
                          <div
                            key={cat}
                            onClick={() => {
                              const currentCats =
                                (newProduct as any).categories || [];
                              const newCats = isSelected
                                ? currentCats.filter((c: string) => c !== cat)
                                : [...currentCats, cat];
                              setNewProduct({
                                ...newProduct,
                                categories: newCats,
                              } as any);
                            }}
                            className="flex items-center space-x-2 cursor-pointer group"
                          >
                            <div
                              className={cn(
                                "w-4 h-4 rounded border flex items-center justify-center transition-all",
                                isSelected
                                  ? "bg-primary border-primary"
                                  : "bg-white border-primary/20",
                              )}
                            >
                              {isSelected && (
                                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                              )}
                            </div>
                            <span
                              className={cn(
                                "text-[10px] font-bold uppercase tracking-tight",
                                isSelected ? "text-primary" : "text-ink/30",
                              )}
                            >
                              {cat}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-ink/60 ml-4">
                      Giá bán (₫)
                    </label>
                    <input
                      required
                      type="number"
                      className="w-full bg-paper border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 ring-primary/20 outline-none"
                      value={newProduct.price === 0 ? "" : newProduct.price}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          price: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-ink/60 ml-4">
                      Giá gốc (₫)
                    </label>
                    <input
                      required
                      type="number"
                      className="w-full bg-paper border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 ring-primary/20 outline-none"
                      value={
                        newProduct.original_price === 0
                          ? ""
                          : newProduct.original_price
                      }
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          original_price: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-ink/60 ml-4">
                    Đường dẫn hình ảnh
                  </label>
                  <div className="relative">
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
                    <input
                      required
                      className="w-full bg-paper border-none rounded-2xl px-6 py-4 pl-12 text-xs focus:ring-2 ring-primary/20 outline-none"
                      placeholder="https://..."
                      value={(newProduct as any).image_url}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          image_url: e.target.value,
                        } as any)
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-ink/60 ml-4">
                    Mô tả tác phẩm
                  </label>
                  <textarea
                    required
                    rows={3}
                    className="w-full bg-paper border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 ring-primary/20 outline-none resize-none"
                    value={newProduct.description}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl flex items-center justify-center gap-3 hover:bg-ink transition-all"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Lưu Tác Phẩm
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL: FLASH SALE --- */}
      <AnimatePresence>
        {isAddingFlashSale && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingFlashSale(false)}
              className="absolute inset-0 bg-ink/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white w-full max-w-lg rounded-[48px] shadow-2xl relative z-10 p-10 border border-border-beige"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-3xl font-serif italic text-primary">
                  Cài Đặt Giờ Vàng
                </h3>
                <button
                  onClick={() => setIsAddingFlashSale(false)}
                  className="p-2 hover:bg-paper rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-ink/40" />
                </button>
              </div>
              <form onSubmit={handleAddFlashSale} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-ink/60 ml-4">
                    Chọn sản phẩm
                  </label>
                  <select
                    required
                    className="w-full bg-paper border-none rounded-2xl px-6 py-4 text-sm outline-none"
                    value={newFlashSale.product_id}
                    onChange={(e) =>
                      setNewFlashSale({
                        ...newFlashSale,
                        product_id: e.target.value,
                      })
                    }
                  >
                    <option value="">-- Chọn hoa --</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.price.toLocaleString()}₫)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-ink/60 ml-4">
                    Giá Sale Giờ Vàng (₫)
                  </label>
                  <input
                    required
                    type="number"
                    className="w-full bg-paper border-none rounded-2xl px-6 py-4 text-sm outline-none"
                    value={
                      newFlashSale.sale_price === 0
                        ? ""
                        : newFlashSale.sale_price
                    }
                    onChange={(e) =>
                      setNewFlashSale({
                        ...newFlashSale,
                        sale_price: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-ink/60 ml-4">
                      Bắt đầu
                    </label>
                    <input
                      required
                      type="datetime-local"
                      className="w-full bg-paper border-none rounded-2xl px-4 py-4 text-xs outline-none"
                      value={newFlashSale.start_time}
                      onChange={(e) =>
                        setNewFlashSale({
                          ...newFlashSale,
                          start_time: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-ink/60 ml-4">
                      Kết thúc
                    </label>
                    <input
                      required
                      type="datetime-local"
                      className="w-full bg-paper border-none rounded-2xl px-4 py-4 text-xs outline-none"
                      value={newFlashSale.end_time}
                      onChange={(e) =>
                        setNewFlashSale({
                          ...newFlashSale,
                          end_time: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-accent text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl flex items-center justify-center gap-2 hover:bg-primary transition-all"
                >
                  <Zap className="w-4 h-4 fill-white" /> Kích Hoạt Sale
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
