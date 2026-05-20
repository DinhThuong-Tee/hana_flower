/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HelmetProvider, Helmet } from "react-helmet-async";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import HomePage from "./pages/HomePage";
import ProductPage from "./pages/ProductPage";
import CheckoutPage from "./pages/CheckoutPage";
import TrackingPage from "./pages/TrackingPage";
import AdminPage from "./pages/AdminPage";
import AuthPage from "./pages/AuthPage";
import Navbar from "./components/Navbar";
import BottomNav from "./components/BottomNav";
import CartDrawer from "./components/CartDrawer";
import { MessageCircle, Phone } from "lucide-react";

export default function App() {
  return (
    <HelmetProvider>
      <Router>
        <AuthProvider>
          <CartProvider>
            <div className="min-h-screen flex flex-col pb-16 md:pb-0">
              <Helmet>
                <title>HANA | Shop Hoa Tươi Cao Cấp - Giao Hỏa Tốc 2h</title>
                <meta
                  name="description"
                  content="Hệ thống bán hoa tươi chuyên nghiệp nghệ nhân thiết kế. Flash Sale hấp dẫn mỗi ngày, thanh toán VietQR tiện lợi."
                />
              </Helmet>

              <Navbar />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/product/:id" element={<ProductPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/tracking" element={<TrackingPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/auth" element={<AuthPage />} />
                </Routes>
              </main>
              <BottomNav />
              <CartDrawer />

              {/* Floating Actions */}
              <div className="fixed bottom-32 right-6 space-y-4 z-40 hidden md:flex flex-col">
                <a
                  href={`https://zalo.me/${import.meta.env.VITE_ZALO_NUMBER || "113"}`}
                  target="_blank"
                  className="w-14 h-14 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform animate-bounce"
                >
                  <MessageCircle className="w-7 h-7" />
                </a>
                <a
                  href={`tel:${import.meta.env.VITE_HOTLINE_NUMBER || "113"}`}
                  className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
                >
                  <Phone className="w-6 h-6" />
                </a>
              </div>
            </div>
          </CartProvider>
        </AuthProvider>
      </Router>
    </HelmetProvider>
  );
}
