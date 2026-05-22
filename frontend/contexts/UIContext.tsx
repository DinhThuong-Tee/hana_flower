import React, { createContext, useContext, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "../utils/cn";

type ModalType = "success" | "danger" | "warning" | "info" | "detail";

interface ModalOptions {
  title: string;
  message: string;
  type?: ModalType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  showCancel?: boolean;
  content?: React.ReactNode; // Dùng để hiện thông tin chi tiết phức tạp
}

interface UIContextType {
  showModal: (options: ModalOptions) => void;
  hideModal: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [modal, setModal] = useState<ModalOptions | null>(null);

  const showModal = (options: ModalOptions) => setModal(options);
  const hideModal = () => setModal(null);

  return (
    <UIContext.Provider value={{ showModal, hideModal }}>
      {children}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6">
            {/* Backdrop mờ ảo */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={hideModal}
              className="absolute inset-0 bg-ink/60 backdrop-blur-md"
            />

            {/* Thẻ Modal chính */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[48px] shadow-2xl relative z-10 overflow-hidden border border-border-beige flex flex-col"
            >
              {/* Nút đóng nhanh */}
              <button
                onClick={hideModal}
                className="absolute top-6 right-6 p-2 hover:bg-paper rounded-full transition-colors text-ink/20 hover:text-ink"
              >
                <X size={20} />
              </button>

              <div className="p-10 text-center">
                {/* Icon động theo loại thông báo */}
                {!modal.content && (
                  <div
                    className={cn(
                      "w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner",
                      modal.type === "success" && "bg-green-50 text-green-600",
                      modal.type === "danger" && "bg-red-50 text-red-500",
                      modal.type === "warning" && "bg-amber-50 text-amber-500",
                      (modal.type === "info" || modal.type === "detail") &&
                        "bg-primary/10 text-primary",
                    )}
                  >
                    {modal.type === "success" && <CheckCircle2 size={40} />}
                    {modal.type === "danger" && <XCircle size={40} />}
                    {modal.type === "warning" && <AlertTriangle size={40} />}
                    {(modal.type === "info" || modal.type === "detail") && (
                      <Info size={40} />
                    )}
                  </div>
                )}

                <h3 className="text-3xl font-serif italic text-primary mb-4 leading-tight">
                  {modal.title}
                </h3>

                <p className="text-sm text-ink/40 font-medium leading-relaxed mb-8 px-4">
                  {modal.message}
                </p>

                {/* Nếu có nội dung chi tiết (như thông tin sản phẩm) thì hiện ở đây */}
                {modal.content && (
                  <div className="mb-8 text-left">{modal.content}</div>
                )}

                {/* Nhóm nút bấm */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      modal.onConfirm?.();
                      hideModal();
                    }}
                    className={cn(
                      "w-full py-5 rounded-2xl font-bold uppercase tracking-widest text-[10px] text-white shadow-xl transition-all active:scale-95",
                      modal.type === "danger"
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-primary hover:bg-ink",
                    )}
                  >
                    {modal.confirmText || "Xác nhận ngay"}
                  </button>

                  {modal.showCancel && (
                    <button
                      onClick={hideModal}
                      className="w-full py-4 text-[10px] font-bold uppercase tracking-widest text-ink/20 hover:text-ink/40"
                    >
                      {modal.cancelText || "Quay lại"}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error("useUI must be used within UIProvider");
  return context;
};
