import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { useUI } from "../contexts/UIContext";
import {
  Users,
  ShoppingBag,
  DollarSign,
  Search,
  Filter,
  Eye,
  Edit,
  Trash,
  Plus,
  BarChart3,
  Activity,
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
  AlertTriangle,
  Info,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { cn } from "../utils/cn";
import { useAuth } from "../contexts/AuthContext";
import { Product, Order, FlashSale, Review } from "../types";

export default function AdminPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // --- Helper lấy Token bảo mật ---
  const getAuthHeader = () => {
    const token = localStorage.getItem("flora_token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  // --- States Dữ liệu ---
  const { showModal } = useUI();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [detailedStats, setDetailedStats] = useState<any>(null);
  const [stats, setStats] = useState({
    totalRev: 0,
    activeOrders: 0,
    totalProducts: 0,
    completionRate: 0,
  });

  // --- States UI & Phân trang ---
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderReviews, setOrderReviews] = useState<Review[]>([]);
  const [isLoadingOrderDetails, setIsLoadingOrderDetails] = useState(false);

  const [inventoryPage, setInventoryPage] = useState(1);
  const inventoryPerPage = 10;
  const [orderPage, setOrderPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(10);

  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryCategory, setInventoryCategory] = useState("Tất cả");
  const [showInventorySearch, setShowInventorySearch] = useState(false);
  const [showInventoryFilter, setShowInventoryFilter] = useState(false);

  // --- States Modals ---
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingFlashSale, setIsAddingFlashSale] = useState(false);
  const [editingFlashSaleId, setEditingFlashSaleId] = useState<string | null>(
    null,
  );

  // --- Popup xác nhận & Thông báo hệ thống ---
  const [popup, setPopup] = useState<{
    title: string;
    message: string;
    type: "success" | "danger" | "warning" | "info";
    onConfirm: () => void;
    showCancel?: boolean;
  } | null>(null);

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

  // --- Hàm Fetch Data ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const headers = getAuthHeader();
      const [pRes, oRes, fRes, rRes, sRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/admin/orders", { headers }),
        fetch("/api/flash-sales"),
        fetch("/api/admin/reviews", { headers }),
        fetch("/api/admin/stats", { headers }),
      ]);

      if (oRes.status === 401) {
        localStorage.removeItem("flora_token");
        navigate("/auth");
        return;
      }

      if (pRes.ok) setProducts(await pRes.json());
      if (oRes.ok) setOrders(await oRes.json());
      if (fRes.ok) setFlashSales(await fRes.json());
      if (rRes.ok) setReviews(await rRes.json());
      if (sRes.ok) {
        const statsData = await sRes.json();
        setStats(statsData);
        setDetailedStats(statsData); // Lưu dữ liệu chi tiết cho biểu đồ
      }
    } catch (e) {
      console.error(e);
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

  // --- Logic Phân Trang ---
  const filteredInventory = products.filter(
    (p) =>
      (inventoryCategory === "Tất cả" ||
        p.categories?.includes(inventoryCategory)) &&
      p.name.toLowerCase().includes(inventorySearch.toLowerCase()),
  );
  const totalInventoryPages = Math.ceil(
    filteredInventory.length / inventoryPerPage,
  );
  const paginatedInventory = filteredInventory.slice(
    (inventoryPage - 1) * inventoryPerPage,
    inventoryPage * inventoryPerPage,
  );

  const totalOrderPages = Math.ceil(orders.length / ordersPerPage);
  const paginatedOrders = orders.slice(
    (orderPage - 1) * ordersPerPage,
    orderPage * ordersPerPage,
  );

  // --- Handlers: Sản phẩm ---
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
        headers: getAuthHeader(),
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setIsAddingProduct(false);
        setEditingId(null);
        setNewProduct(initialProductState as any);
        fetchData();
        setPopup({
          title: "Thành công",
          message: "Kho hàng đã được cập nhật.",
          type: "success",
          onConfirm: () => setPopup(null),
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProduct = (id: string) => {
    setPopup({
      title: "Xóa tác phẩm?",
      message: "Hoa sẽ bị xóa vĩnh viễn khỏi kho hàng.",
      type: "danger",
      showCancel: true,
      onConfirm: async () => {
        await fetch(`/api/admin/products/${id}`, {
          method: "DELETE",
          headers: getAuthHeader(),
        });
        fetchData();
        setPopup(null);
      },
    });
  };

  const toggleStock = async (id: string, current: boolean) => {
    const res = await fetch(`/api/admin/products/${id}/stock`, {
      method: "PATCH",
      headers: getAuthHeader(),
      body: JSON.stringify({ is_stock: !current }),
    });
    if (res.ok)
      setProducts((prev) =>
        prev.map((p) => (p._id === id ? { ...p, is_stock: !current } : p)),
      );
  };

  // --- Handlers: Đơn hàng ---
  const handleStatusChangeRequest = (orderId: string, newStatus: string) => {
    if (newStatus === "completed" || newStatus === "cancelled") {
      setPopup({
        title: "Chốt trạng thái?",
        message: `Chuyển sang "${newStatus === "completed" ? "Đã xong" : "Hủy đơn"}"? Bạn sẽ không thể sửa lại sau khi xác nhận.`,
        type: newStatus === "completed" ? "success" : "danger",
        showCancel: true,
        onConfirm: () => executeStatusUpdate(orderId, newStatus),
      });
      return;
    }
    executeStatusUpdate(orderId, newStatus);
  };

  const executeStatusUpdate = async (id: string, status: string) => {
    const res = await fetch(`/api/admin/orders/${id}/status`, {
      method: "PATCH",
      headers: getAuthHeader(),
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setOrders((prev) =>
        prev.map((o) =>
          o._id === id ? { ...o, order_status: status as any } : o,
        ),
      );
      setPopup(null);
      fetchData();
    }
  };

  const updatePaymentStatus = async (order: Order) => {
    const newStatus = order.payment_status === "paid" ? "unpaid" : "paid";
    const res = await fetch(`/api/admin/orders/${order._id}/payment-status`, {
      method: "PATCH",
      headers: getAuthHeader(),
      body: JSON.stringify({ payment_status: newStatus }),
    });
    if (res.ok) {
      if (selectedOrder?._id === order._id)
        setSelectedOrder({ ...selectedOrder, payment_status: newStatus });
      fetchData();
    }
  };

  // --- Handlers: Flash Sale & Review ---
  const handleSaveFlashSale = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedProduct = products.find(
      (p) => p._id === newFlashSale.product_id,
    );

    if (!selectedProduct) {
      setPopup({
        title: "Lỗi",
        message: "Vui lòng chọn một tác phẩm hợp lệ.",
        type: "danger",
        onConfirm: () => setPopup(null),
      });
      return;
    }

    // 2. Logic kiểm tra giá: > 0 và < giá hiện tại (hoặc giá gốc)
    const salePrice = Number(newFlashSale.sale_price);
    const currentPrice = selectedProduct.price;

    if (salePrice <= 0) {
      setPopup({
        title: "Giá không hợp lệ",
        message: "Giá Flash Sale phải lớn hơn 0đ.",
        type: "warning",
        onConfirm: () => setPopup(null),
      });
      return;
    }

    if (salePrice >= currentPrice) {
      setPopup({
        title: "Giá quá cao",
        message: `Giá sale (${salePrice.toLocaleString()}₫) phải nhỏ hơn giá bán hiện tại (${currentPrice.toLocaleString()}₫).`,
        type: "danger",
        onConfirm: () => setPopup(null),
      });
      return;
    }
    const url = editingFlashSaleId
      ? `/api/admin/flash-sales/${editingFlashSaleId}`
      : "/api/admin/flash-sales";
    const res = await fetch(url, {
      method: editingFlashSaleId ? "PUT" : "POST",
      headers: getAuthHeader(),
      body: JSON.stringify(newFlashSale),
    });
    if (res.ok) {
      setIsAddingFlashSale(false);
      setEditingFlashSaleId(null);
      setNewFlashSale({
        product_id: "",
        sale_price: 0,
        start_time: "",
        end_time: "",
      } as any);
      fetchData();
    }
  };

  const deleteFlashSale = (id: string) => {
    setPopup({
      title: "Dừng Sale?",
      message: "Kết thúc đợt giảm giá này ngay bây giờ?",
      type: "warning",
      showCancel: true,
      onConfirm: async () => {
        await fetch(`/api/admin/flash-sales/${id}`, {
          method: "DELETE",
          headers: getAuthHeader(),
        });
        fetchData();
        setPopup(null);
      },
    });
  };

  const toggleReviewStatus = async (id: string, current: boolean) => {
    await fetch(`/api/admin/reviews/${id}/status`, {
      method: "PATCH",
      headers: getAuthHeader(),
      body: JSON.stringify({ is_approved: !current }),
    });
    setReviews((prev) =>
      prev.map((r) => (r._id === id ? { ...r, is_approved: !current } : r)),
    );
  };

  const hideReview = (id: string) => {
    setPopup({
      title: "Ẩn đánh giá?",
      message: "Đánh giá sẽ biến mất khỏi Admin và Trang chủ.",
      type: "danger",
      showCancel: true,
      onConfirm: async () => {
        await fetch(`/api/admin/reviews/${id}`, {
          method: "DELETE",
          headers: getAuthHeader(),
        });
        setReviews((prev) => prev.filter((r) => r._id !== id));
        setPopup(null);
      },
    });
  };

  const fetchOrderReviews = async (orderId: string) => {
    setIsLoadingOrderDetails(true);
    try {
      const res = await fetch(`/api/admin/reviews/order/${orderId}`, {
        headers: getAuthHeader(),
      });
      if (res.ok) setOrderReviews(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingOrderDetails(false);
    }
  };

  if (authLoading || (isAdmin && isLoading && products.length === 0)) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const categories = [
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
      {/* Header */}
      <div className="bg-white border-b border-border-beige px-10 py-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-accent mb-2 block">
              Hệ thống quản trị
            </span>
            <h1 className="text-6xl font-serif italic text-primary">Flora</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                setEditingFlashSaleId(null);
                setIsAddingFlashSale(true);
              }}
              className="bg-accent text-white px-8 py-4 rounded-full text-[10px] font-bold uppercase shadow-xl flex items-center"
            >
              <Zap className="w-3 h-3 mr-2 fill-white" /> Flash Sale
            </button>
            <button
              onClick={() => {
                setEditingId(null);
                setNewProduct(initialProductState as any);
                setIsAddingProduct(true);
              }}
              className="bg-primary text-white px-8 py-4 rounded-full text-[10px] font-bold uppercase shadow-xl flex items-center"
            >
              <Plus className="w-3 h-3 mr-2" /> Thêm tác phẩm
            </button>
            <button
              onClick={() => setShowStatsModal(true)}
              className="bg-paper border border-border-beige text-primary w-12 h-12 rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
            >
              <Activity
                className={cn("w-5 h-5", isLoading && "animate-pulse")}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
          {[
            {
              icon: DollarSign,
              label: "Doanh thu",
              val: `${stats.totalRev.toLocaleString()}₫`,
              color: "bg-green-100 text-green-700",
            },
            {
              icon: ShoppingBag,
              label: "Đang xử lý",
              val: stats.activeOrders,
              color: "bg-blue-100 text-blue-700",
            },
            {
              icon: BarChart3,
              label: "Sản phẩm",
              val: stats.totalProducts,
              color: "bg-amber-100 text-amber-700",
            },
            {
              icon: Users,
              label: "Tỉ lệ xong",
              val: `${stats.completionRate.toFixed(1)}%`,
              color: "bg-purple-100 text-purple-700",
            },
          ].map((s, i) => (
            <div
              key={i}
              className="bg-white p-8 rounded-[40px] shadow-sm border border-border-beige hover:shadow-xl transition-all"
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center mb-6",
                  s.color,
                )}
              >
                <s.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold opacity-30 block mb-2">
                {s.label}
              </span>
              <h4 className="text-3xl font-bold font-serif italic text-primary">
                {s.val}
              </h4>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* CỘT TRÁI (RỘNG) */}
          <div className="lg:col-span-2 space-y-12">
            {/* Orders Table */}
            <div className="bg-white rounded-[48px] shadow-2xl border border-primary/5 overflow-hidden">
              <div className="px-10 py-8 border-b border-primary/5 flex items-center justify-between bg-paper/20">
                <h3 className="text-2xl font-serif">Đơn Hàng Gần Đây</h3>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
                  <input
                    className="bg-white border border-primary/5 rounded-full pl-10 pr-4 py-2 text-xs outline-none w-64"
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
                      <th className="px-10 py-6 text-right">Xem</th>
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
                        <td className="px-6 py-6 font-bold text-sm text-primary">
                          {o.total_amount.toLocaleString()}₫
                        </td>
                        <td className="px-6 py-6">
                          {["completed", "cancelled"].includes(
                            o.order_status,
                          ) ? (
                            <div
                              className={cn(
                                "px-3 py-1 rounded-full text-[9px] font-bold uppercase flex items-center gap-2",
                                o.order_status === "completed"
                                  ? "bg-green-50 text-green-600"
                                  : "bg-red-50 text-red-600",
                              )}
                            >
                              <div
                                className={cn(
                                  "w-1 h-1 rounded-full",
                                  o.order_status === "completed"
                                    ? "bg-green-500"
                                    : "bg-red-500",
                                )}
                              />{" "}
                              {o.order_status === "completed" ? "Xong" : "Hủy"}
                            </div>
                          ) : (
                            <select
                              value={o.order_status}
                              onChange={(e) =>
                                handleStatusChangeRequest(o._id, e.target.value)
                              }
                              className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-bold uppercase border-none bg-paper cursor-pointer",
                                o.order_status === "pending"
                                  ? "text-amber-600"
                                  : "text-blue-600",
                              )}
                            >
                              <option value="pending">Chờ duyệt</option>
                              <option value="shipping">Đang giao</option>
                              <option value="completed">Đã xong</option>
                              <option value="cancelled">Hủy đơn</option>
                            </select>
                          )}
                        </td>
                        <td className="px-10 py-6 text-right">
                          <button
                            onClick={() => {
                              setSelectedOrder(o);
                              fetchOrderReviews(o._id);
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-all"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination Orders */}
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
                  <span className="text-[10px] font-bold uppercase text-primary">
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

            {/* Flash Sale Table */}
            <div className="bg-white rounded-[48px] shadow-2xl border border-primary/5 overflow-hidden">
              <div className="px-10 py-8 border-b border-primary/5 flex items-center justify-between bg-accent/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent text-white rounded-2xl flex items-center justify-center">
                    <Zap className="w-6 h-6 fill-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-serif">Sự Kiện Giờ Vàng</h3>
                    <p className="text-[10px] uppercase font-bold text-accent tracking-widest">
                      Giảm giá giới hạn
                    </p>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-paper text-[10px] uppercase tracking-widest text-ink/40 font-bold">
                      <th className="px-10 py-6 text-left">Sản phẩm</th>
                      <th className="px-6 py-6 text-center">Giá</th>
                      <th className="px-6 py-6 text-left">Thời gian</th>
                      <th className="px-10 py-6 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  {/* Flash Sale Table */}
                  <tbody className="divide-y divide-primary/5">
                    {flashSales.map((fs) => {
                      const p = products.find(
                        (prod) => prod._id === fs.product_id,
                      );

                      // Logic kiểm tra hết hạn
                      const now = new Date();
                      const endTime = new Date(fs.end_time);
                      const isExpired = now > endTime;

                      return (
                        <tr
                          key={fs._id}
                          className={cn(
                            "hover:bg-paper/30 transition-colors group",
                            isExpired && "bg-red-50/40", // Đổi nền dòng thành màu đỏ nhạt nếu hết hạn
                          )}
                        >
                          <td className="px-10 py-4">
                            <span
                              className={cn(
                                "font-bold text-sm",
                                isExpired ? "text-red-800" : "text-primary",
                              )}
                            >
                              {p?.name || "SP đã xóa"}
                            </span>
                            {isExpired && (
                              <span className="ml-2 text-[8px] bg-red-500 text-white px-2 py-0.5 rounded-full uppercase font-bold">
                                Hết hạn
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col">
                              <span className="text-[10px] text-ink/20 line-through">
                                {p?.price.toLocaleString()}₫
                              </span>
                              <span
                                className={cn(
                                  "text-sm font-bold",
                                  isExpired ? "text-red-400" : "text-accent",
                                )}
                              >
                                {fs.sale_price.toLocaleString()}₫
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div
                              className={cn(
                                "text-[10px] font-medium flex flex-col gap-1",
                                isExpired ? "text-red-600" : "text-ink/60", // Chữ đỏ cho phần thời gian
                              )}
                            >
                              <div className="flex items-center gap-1">
                                <span className="opacity-50">BĐ:</span>{" "}
                                {new Date(fs.start_time).toLocaleString()}
                              </div>
                              <div className="flex items-center gap-1 font-bold">
                                <span className="opacity-50">KT:</span>{" "}
                                {new Date(fs.end_time).toLocaleString()}
                              </div>
                            </div>
                          </td>
                          <td className="px-10 py-4 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <button
                                onClick={() => {
                                  setNewFlashSale(fs);
                                  setEditingFlashSaleId(fs._id);
                                  setIsAddingFlashSale(true);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteFlashSale(fs._id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-[48px] shadow-2xl border border-primary/5 p-10">
              <div className="flex items-center gap-4 mb-8">
                <MessageSquare className="w-6 h-6 text-blue-600" />
                <h3 className="text-2xl font-serif">Đánh Giá Khách Hàng</h3>
              </div>
              <div className="space-y-4">
                {reviews.map((rev) => {
                  // LOGIC: Tìm thông tin sản phẩm dựa trên product_id của đánh giá
                  const product = products.find(
                    (p) => p._id === rev.product_id,
                  );

                  return (
                    <div
                      key={rev._id}
                      className="flex items-center justify-between p-6 bg-paper/20 rounded-3xl border border-border-beige group transition-all hover:bg-paper/40"
                    >
                      <div className="flex-1 space-y-3">
                        {/* 1. Tên Account & Ngày tháng */}
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <span className="font-bold text-sm text-primary block leading-none mb-1">
                              {rev.user_name || "Người dùng Flora"}
                            </span>
                            <span className="text-[9px] text-ink/20 font-bold uppercase tracking-tighter">
                              {new Date(rev.created_at).toLocaleDateString(
                                "vi-VN",
                              )}
                            </span>
                          </div>
                        </div>

                        {/* 2. Tên Sản Phẩm được đánh giá */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">
                            Sản phẩm:
                          </span>
                          <span className="text-[11px] font-bold text-accent border-b border-accent/20 pb-0.5">
                            {product?.name || "Tác phẩm không còn tồn tại"}
                          </span>
                        </div>

                        {/* 3. Nội dung đánh giá */}
                        <div className="relative">
                          <p className="text-xs text-ink/60 italic leading-relaxed pl-4 border-l-2 border-primary/10">
                            "{rev.comment}"
                          </p>
                        </div>
                      </div>

                      {/* Cột Thao tác bên phải */}
                      <div className="flex items-center gap-4 ml-6">
                        <button
                          onClick={() =>
                            toggleReviewStatus(rev._id, rev.is_approved)
                          }
                          className={cn(
                            "px-4 py-1.5 rounded-full text-[9px] font-bold uppercase transition-all shadow-sm",
                            rev.is_approved
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-amber-100 text-amber-700 hover:bg-amber-200",
                          )}
                        >
                          {rev.is_approved ? "Đã duyệt" : "Chờ duyệt"}
                        </button>

                        <button
                          onClick={() => hideReview(rev._id)}
                          className="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                          title="Ẩn khỏi Admin"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: INVENTORY */}
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
                        "p-2 rounded-full",
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
                        "p-2 rounded-full",
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
                      {categories.map((c) => (
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
                        className="w-12 h-12 rounded-xl object-cover shadow-sm"
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
                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteProduct(p._id)}
                        className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-all"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-paper/50 border-t border-primary/5 flex items-center justify-center gap-4">
                <button
                  disabled={inventoryPage === 1}
                  onClick={() => setInventoryPage((p) => p - 1)}
                  className="p-1.5 rounded-xl bg-white disabled:opacity-30 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[9px] font-bold text-ink/40 uppercase tracking-widest">
                  {inventoryPage} / {totalInventoryPages || 1}
                </span>
                <button
                  disabled={inventoryPage >= totalInventoryPages}
                  onClick={() => setInventoryPage((p) => p + 1)}
                  className="p-1.5 rounded-xl bg-white disabled:opacity-30 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL CHI TIẾT ĐƠN HÀNG --- */}
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
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[48px] shadow-2xl relative z-10 overflow-hidden flex flex-col border border-border-beige"
            >
              <div className="p-8 border-b border-border-beige flex items-center justify-between bg-paper/30">
                <div>
                  <span className="text-[10px] uppercase font-bold text-accent mb-1 block">
                    Chi tiết đơn hàng
                  </span>
                  <h3 className="text-2xl font-serif italic text-primary">
                    #{selectedOrder.order_code}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-paper rounded-full"
                >
                  <X className="w-6 h-6 text-ink/40" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <section>
                      <h4 className="text-[10px] uppercase font-bold text-ink/20 mb-4 flex items-center">
                        <Users className="w-3 h-3 mr-2" /> Nhân sự
                      </h4>
                      <div className="bg-paper/50 p-6 rounded-3xl border border-primary/5 space-y-4">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-ink/40 block">
                            Người đặt
                          </span>
                          <p className="font-bold text-primary">
                            {selectedOrder.account_name || "Khách vãng lai"}
                          </p>
                        </div>
                        <div className="h-px bg-primary/5" />
                        <div>
                          <span className="text-[9px] uppercase font-bold text-ink/40 block">
                            Người nhận hoa
                          </span>
                          <p className="font-bold text-lg">
                            {selectedOrder.customer_info.name}
                          </p>
                          <p className="text-xs text-ink/40">
                            {selectedOrder.customer_info.phone} •{" "}
                            {selectedOrder.customer_info.address}
                          </p>
                        </div>
                      </div>
                    </section>
                    <section>
                      <h4 className="text-[10px] uppercase font-bold text-ink/20 mb-4 flex items-center">
                        <ShoppingBag className="w-3 h-3 mr-2" /> Sản phẩm
                      </h4>
                      <div className="space-y-3">
                        {selectedOrder.items.map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-4 bg-white rounded-2xl border border-primary/5 shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-paper rounded-lg flex items-center justify-center text-xs font-bold">
                                {item.quantity}x
                              </div>
                              <span className="text-sm font-medium">
                                {item.product_name || `SP #${item.product_id}`}
                              </span>
                            </div>
                            <span className="text-sm font-bold">
                              {item.price_at_purchase.toLocaleString()}₫
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-between pt-4 border-t border-primary/5">
                          <span className="font-serif italic text-lg">
                            Tổng cộng:
                          </span>
                          <span className="text-2xl font-bold text-primary">
                            {selectedOrder.total_amount.toLocaleString()}₫
                          </span>
                        </div>
                      </div>
                    </section>
                  </div>
                  <div className="space-y-8">
                    <section>
                      <h4 className="text-[10px] uppercase font-bold text-ink/20 mb-4 flex items-center">
                        <DollarSign className="w-3 h-3 mr-2" /> Thanh toán
                      </h4>
                      <div className="bg-paper/50 p-6 rounded-3xl border border-primary/5 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-ink/60 uppercase">
                            {selectedOrder.payment_method}
                          </span>
                          <button
                            onClick={() => updatePaymentStatus(selectedOrder)}
                            className={cn(
                              "px-3 py-1 rounded-full text-[9px] font-bold uppercase transition-all",
                              selectedOrder.payment_status === "paid"
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700",
                            )}
                          >
                            {selectedOrder.payment_status === "paid"
                              ? "Đã trả"
                              : "Chưa trả"}
                          </button>
                        </div>
                        {selectedOrder.payment_receipt ? (
                          <img
                            src={selectedOrder.payment_receipt}
                            className="w-full h-48 object-cover rounded-2xl shadow-lg cursor-zoom-in"
                            alt="Bill"
                            onClick={() =>
                              window.open(
                                selectedOrder.payment_receipt,
                                "_blank",
                              )
                            }
                            onError={(e) =>
                              (e.currentTarget.src =
                                "https://placehold.co/400x400?text=Anh+Bill+Loi")
                            }
                          />
                        ) : (
                          <div className="p-6 bg-white/50 border border-dashed border-ink/10 rounded-2xl text-center text-[10px] text-ink/20 italic">
                            Khách chưa gửi minh chứng
                          </div>
                        )}
                      </div>
                    </section>
                    <section>
                      <h4 className="text-[10px] uppercase font-bold text-ink/20 mb-4 flex items-center">
                        <MessageSquare className="w-3 h-3 mr-2" /> Đánh giá
                      </h4>
                      <div className="bg-white p-6 rounded-3xl border border-primary/5 min-h-[100px]">
                        {isLoadingOrderDetails ? (
                          <Loader2 className="animate-spin mx-auto text-ink/20" />
                        ) : orderReviews.length > 0 ? (
                          orderReviews.map((rev: any) => (
                            <div key={rev._id} className="mb-4">
                              <div className="flex text-amber-400 mb-1">
                                {[...Array(rev.rating)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className="w-3 h-3 fill-current"
                                  />
                                ))}
                              </div>
                              <p className="text-sm text-ink/60 italic">
                                "{rev.comment}"
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-ink/20 italic text-center">
                            Chưa có đánh giá.
                          </p>
                        )}
                      </div>
                    </section>
                  </div>
                </div>
              </div>
              <div className="p-8 border-t border-border-beige bg-paper/30 flex justify-end">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="bg-primary text-white px-10 py-3 rounded-full font-bold uppercase text-[10px] hover:bg-ink transition-all"
                >
                  Đóng cửa sổ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL ADD/EDIT PRODUCT --- */}
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
              className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl relative z-10 overflow-hidden border border-border-beige flex flex-col"
            >
              <div className="p-10 border-b border-border-beige flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-accent mb-1 block">
                    {editingId ? "Chỉnh sửa" : "Sáng tạo mới"}
                  </span>
                  <h3 className="text-3xl font-serif italic text-primary">
                    {editingId ? "Cập Nhật Tác Phẩm" : "Thêm Tác Phẩm"}
                  </h3>
                </div>
                <button
                  onClick={() => setIsAddingProduct(false)}
                  className="p-3 hover:bg-paper rounded-full"
                >
                  <X className="w-6 h-6 text-ink/40" />
                </button>
              </div>
              <form
                onSubmit={handleSaveProduct}
                className="p-10 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-ink/60 ml-4">
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
                    <label className="text-[10px] uppercase font-bold text-ink/60 ml-4">
                      Danh mục
                    </label>
                    <div className="grid grid-cols-2 gap-3 bg-paper p-4 rounded-2xl">
                      {categories.slice(1).map((cat) => {
                        const isSelected = (
                          newProduct as any
                        ).categories?.includes(cat);
                        return (
                          <div
                            key={cat}
                            onClick={() => {
                              const cur = (newProduct as any).categories || [];
                              const n = isSelected
                                ? cur.filter((c: any) => c !== cat)
                                : [...cur, cat];
                              setNewProduct({
                                ...newProduct,
                                categories: n,
                              } as any);
                            }}
                            className="flex items-center space-x-2 cursor-pointer group"
                          >
                            <div
                              className={cn(
                                "w-4 h-4 rounded border transition-all",
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
                                "text-[10px] font-bold uppercase",
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
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-ink/60 ml-4">
                      Giá bán
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      onKeyDown={(e) =>
                        ["e", "E", "+", "-", "."].includes(e.key) &&
                        e.preventDefault()
                      }
                      className="w-full bg-paper border-none rounded-2xl px-6 py-4 text-sm outline-none"
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
                    <label className="text-[10px] uppercase font-bold text-ink/60 ml-4">
                      Giá gốc
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      onKeyDown={(e) =>
                        ["e", "E", "+", "-", "."].includes(e.key) &&
                        e.preventDefault()
                      }
                      className="w-full bg-paper border-none rounded-2xl px-6 py-4 text-sm outline-none"
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
                  <label className="text-[10px] uppercase font-bold text-ink/60 ml-4">
                    Link hình ảnh
                  </label>
                  <div className="relative">
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
                    <input
                      required
                      className="w-full bg-paper border-none rounded-2xl px-6 py-4 pl-12 text-xs outline-none"
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
                  <label className="text-[10px] uppercase font-bold text-ink/60 ml-4">
                    Mô tả
                  </label>
                  <textarea
                    rows={3}
                    className="w-full bg-paper border-none rounded-2xl px-6 py-4 text-sm outline-none resize-none"
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
                  className="w-full bg-primary text-white py-5 rounded-2xl font-bold uppercase text-xs shadow-xl flex items-center justify-center gap-3 hover:bg-ink transition-all"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin w-4 h-4" />
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

      {/* --- MODAL ADD/EDIT FLASH SALE --- */}
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
              className="bg-white w-full max-w-lg rounded-[48px] shadow-2xl relative z-10 p-10 border border-border-beige flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-3xl font-serif italic text-primary">
                  {editingFlashSaleId
                    ? "Cập Nhật Giờ Vàng"
                    : "Cài Đặt Giờ Vàng"}
                </h3>
                <button
                  onClick={() => setIsAddingFlashSale(false)}
                  className="p-2 hover:bg-paper rounded-full"
                >
                  <X className="w-6 h-6 text-ink/40" />
                </button>
              </div>
              <form onSubmit={handleSaveFlashSale} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-ink/60 ml-4">
                    Chọn hoa
                  </label>
                  <select
                    required
                    disabled={!!editingFlashSaleId}
                    className="w-full bg-paper border-none rounded-2xl px-6 py-4 text-sm outline-none"
                    value={newFlashSale.product_id}
                    onChange={(e) =>
                      setNewFlashSale({
                        ...newFlashSale,
                        product_id: e.target.value,
                      })
                    }
                  >
                    <option value="">-- Chọn sản phẩm --</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.price.toLocaleString()}₫)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-ink/60 ml-4">
                    Giá Sale (₫)
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
                  className="w-full bg-accent text-white py-5 rounded-2xl font-bold uppercase text-xs shadow-xl flex items-center justify-center gap-2 transition-all"
                >
                  {editingFlashSaleId ? (
                    <>
                      <Save className="w-4 h-4" /> Lưu Thay Đổi
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-white" /> Kích Hoạt Sale
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL POPUP THÔNG BÁO / XÁC NHẬN --- */}
      <AnimatePresence>
        {popup && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !popup.showCancel && popup.onConfirm()}
              className="absolute inset-0 bg-ink/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white w-full max-w-sm rounded-[48px] shadow-2xl relative z-10 p-10 text-center border border-border-beige"
            >
              <div
                className={cn(
                  "w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6",
                  popup.type === "success"
                    ? "bg-green-50 text-green-600"
                    : popup.type === "danger"
                      ? "bg-red-50 text-red-500"
                      : "bg-amber-50 text-amber-500",
                )}
              >
                {popup.type === "danger" ? (
                  <AlertTriangle className="w-10 h-10" />
                ) : popup.type === "warning" ? (
                  <AlertCircle className="w-10 h-10" />
                ) : (
                  <CheckCircle className="w-10 h-10" />
                )}
              </div>
              <h3 className="text-3xl font-serif italic text-primary mb-4">
                {popup.title}
              </h3>
              <p className="text-sm text-ink/40 font-medium mb-10">
                {popup.message}
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={popup.onConfirm}
                  className={cn(
                    "w-full py-4 rounded-2xl font-bold uppercase text-[10px] text-white shadow-xl transition-all",
                    popup.type === "danger" ? "bg-red-500" : "bg-primary",
                  )}
                >
                  {popup.showCancel ? "Xác nhận" : "Đồng ý"}
                </button>
                {popup.showCancel && (
                  <button
                    onClick={() => setPopup(null)}
                    className="w-full py-4 text-[10px] font-bold uppercase text-ink/20"
                  >
                    Hủy bỏ
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL THỐNG KÊ TO LỚN (ANALYTICS) --- */}
      <AnimatePresence>
        {showStatsModal && detailedStats && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowStatsModal(false)}
              className="absolute inset-0 bg-ink/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.9, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 50, opacity: 0 }}
              className="bg-white w-full max-w-6xl h-[90vh] rounded-[60px] shadow-2xl relative z-10 overflow-hidden border border-white/20 flex flex-col"
            >
              {/* Header Modal */}
              <div className="p-10 border-b border-border-beige flex items-center justify-between bg-paper/30">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-primary rounded-3xl flex items-center justify-center shadow-lg shadow-primary/20">
                    <BarChart3 className="text-white w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-serif italic text-primary">
                      Trung Tâm Phân Tích
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <p className="text-[10px] uppercase tracking-[0.1em] font-bold text-accent">
                        Dữ liệu thực tế từ các đơn hàng đã hoàn thành
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowStatsModal(false)}
                  className="w-14 h-14 bg-paper rounded-full flex items-center justify-center hover:rotate-90 transition-transform duration-300 shadow-sm border border-border-beige"
                >
                  <X className="w-6 h-6 text-primary" />
                </button>
              </div>

              {/* Nội dung Modal */}
              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-10">
                {/* Hàng 1: Biểu đồ tài chính kép (Doanh thu & Lợi nhuận) */}
                <div className="bg-paper/30 p-10 rounded-[48px] border border-border-beige relative overflow-hidden">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                      <h3 className="text-2xl font-serif italic text-primary mb-2">
                        Hiệu Suất Tài Chính 7 Ngày
                      </h3>
                      <p className="text-xs text-ink/40">
                        So sánh giữa dòng tiền thu vào và lợi nhuận thực tế
                      </p>
                    </div>

                    <div className="flex gap-8">
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-primary/40 uppercase block mb-1">
                          Tổng doanh thu tuần
                        </span>
                        <p className="text-3xl font-bold text-primary">
                          {detailedStats.totalRev?.toLocaleString() || "0"}₫
                        </p>
                      </div>
                      <div className="text-right border-l border-border-beige pl-8">
                        <span className="text-[10px] font-bold text-accent/40 uppercase block mb-1">
                          Lợi nhuận ròng
                        </span>
                        <p className="text-3xl font-bold text-accent">
                          {detailedStats.totalProfit?.toLocaleString() || "0"}₫
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={detailedStats.dailyStats}>
                        <defs>
                          <linearGradient
                            id="colorRev"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#4A5D4E"
                              stopOpacity={0.2}
                            />
                            <stop
                              offset="95%"
                              stopColor="#4A5D4E"
                              stopOpacity={0}
                            />
                          </linearGradient>
                          <linearGradient
                            id="colorProfit"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#D4A373"
                              stopOpacity={0.4}
                            />
                            <stop
                              offset="95%"
                              stopColor="#D4A373"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#E5E5E5"
                        />
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fontWeight: "bold" }}
                          dy={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10 }}
                          tickFormatter={(val) => `${val / 1000}k`}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "24px",
                            border: "none",
                            boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                          }}
                          formatter={(value: any) => [
                            new Intl.NumberFormat("vi-VN").format(value) + "₫",
                          ]}
                        />
                        {/* Đường Doanh Thu */}
                        <Area
                          name="Doanh thu"
                          type="monotone"
                          dataKey="revenue"
                          stroke="#4A5D4E"
                          strokeWidth={4}
                          fillOpacity={1}
                          fill="url(#colorRev)"
                        />
                        {/* Đường Lợi Nhuận */}
                        <Area
                          name="Tiền lãi"
                          type="monotone"
                          dataKey="profit"
                          stroke="#D4A373"
                          strokeWidth={4}
                          fillOpacity={1}
                          fill="url(#colorProfit)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Hàng 2: Grid 2 biểu đồ nhỏ */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {/* Thống kê danh mục */}
                  <div className="bg-white p-8 rounded-[40px] border border-border-beige shadow-sm">
                    <h3 className="text-xl font-serif italic text-primary mb-8">
                      Phân Bổ Sản Phẩm
                    </h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={detailedStats.categoryStats}
                          layout="vertical"
                        >
                          <XAxis type="number" hide />
                          <YAxis
                            dataKey="name"
                            type="category"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fontWeight: "bold" }}
                            width={100}
                          />
                          <Tooltip
                            cursor={{ fill: "#F8F5F2" }}
                            contentStyle={{ borderRadius: "15px" }}
                          />
                          <Bar
                            dataKey="value"
                            fill="#D4A373"
                            radius={[0, 10, 10, 0]}
                            barSize={20}
                          >
                            {detailedStats.categoryStats?.map(
                              (entry: any, index: number) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={index % 2 === 0 ? "#4A5D4E" : "#D4A373"}
                                />
                              ),
                            )}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Insight & Tip */}
                  <div className="bg-accent/10 p-10 rounded-[40px] border border-accent/20 flex flex-col justify-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6">
                      <Zap className="text-accent w-8 h-8 fill-accent" />
                    </div>
                    <h3 className="text-3xl font-serif italic text-primary mb-4">
                      Gợi ý quản trị
                    </h3>
                    <p className="text-ink/60 leading-relaxed italic">
                      Dựa trên dữ liệu 7 ngày qua, danh mục{" "}
                      <span className="text-accent font-bold">"Hoa Bó"</span>{" "}
                      đang chiếm 60% lượt xem. Bạn nên tạo thêm các đợt Flash
                      Sale vào khung giờ 19:00 - 21:00 để tối ưu hóa tỷ lệ
                      chuyển đổi.
                    </p>
                    <div className="mt-8 flex gap-4">
                      <div className="bg-white px-6 py-4 rounded-2xl flex-1">
                        <span className="text-[9px] uppercase font-bold text-ink/30 block">
                          Hiệu suất kho
                        </span>
                        <p className="text-xl font-bold text-primary">
                          Tốt (8.5/10)
                        </p>
                      </div>
                      <div className="bg-white px-6 py-4 rounded-2xl flex-1">
                        <span className="text-[9px] uppercase font-bold text-ink/30 block">
                          Khách quay lại
                        </span>
                        <p className="text-xl font-bold text-accent">24%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Modal */}
              <div className="p-8 bg-paper/50 border-t border-border-beige text-center">
                <p className="text-[10px] font-bold text-ink/20 uppercase tracking-[0.3em]">
                  Flora © Dashboard Internal Use Only
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Icon helper cho popup
function AlertCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
