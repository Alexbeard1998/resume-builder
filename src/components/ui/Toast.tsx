import { useState, useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import { ToastContext } from "./ToastContext";
import type { ToastType } from "./ToastContext";
import { createPortal } from "react-dom";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  isLeaving?: boolean; // ← Для анимации исчезновения
}

const TOAST_DURATION = 3000;
const ANIMATION_DURATION = 300;

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    // Сначала помечаем как "уходящий" (для анимации)
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isLeaving: true } : t)),
    );

    // Через ANIMATION_DURATION удаляем полностью
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, ANIMATION_DURATION);
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        removeToast(id);
      }, TOAST_DURATION);
    },
    [removeToast],
  );

  // Мемоизируем значение контекста
  const contextValue = useMemo(() => ({ showToast }), [showToast]);
  const memoizedChildren = useMemo(() => children, [children]);

  return (
    <ToastContext.Provider value={contextValue}>
      {memoizedChildren}
      {createPortal(
        <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`px-4 py-3 rounded shadow-lg text-white min-w-[250px] cursor-pointer pointer-events-auto transition-all duration-300 ${
                toast.isLeaving
                  ? "opacity-0 translate-x-full"
                  : "opacity-100 translate-x-0 animate-slide-in"
              } ${
                toast.type === "success"
                  ? "bg-green-500"
                  : toast.type === "error"
                    ? "bg-red-500"
                    : "bg-blue-500"
              }`}
              onClick={() => removeToast(toast.id)}
            >
              {toast.message}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
};
