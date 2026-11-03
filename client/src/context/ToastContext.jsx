import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cx } from "../utils/cx";

const ToastContext = createContext(null);

const TONE_STYLES = {
  success: {
    wrapper: "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
    icon: CheckCircle2,
    iconClass: "text-emerald-600 dark:text-emerald-400",
  },
  error: {
    wrapper: "border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 text-rose-900 dark:text-rose-100",
    icon: AlertCircle,
    iconClass: "text-rose-600 dark:text-rose-400",
  },
  info: {
    wrapper: "border-brand-200 dark:border-brand-500/30 bg-brand-50 dark:bg-brand-500/10 text-brand-900 dark:text-brand-100",
    icon: Info,
    iconClass: "text-brand-600 dark:text-brand-400",
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (message, tone = "success") => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((current) => [...current.slice(-3), { id, message, tone }]);
      window.setTimeout(() => dismiss(id), 3800);
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      addToast,
      success: (message) => addToast(message, "success"),
      error: (message) => addToast(message, "error"),
      info: (message) => addToast(message, "info"),
    }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] right-4 z-[70] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 lg:bottom-4">
        {toasts.map((toast) => {
          const style = TONE_STYLES[toast.tone] || TONE_STYLES.info;
          const Icon = style.icon;
          return (
            <div
              key={toast.id}
              className={cx(
                "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg",
                style.wrapper
              )}
              role="status"
            >
              <Icon size={18} className={cx("mt-0.5 shrink-0", style.iconClass)} />
              <p className="flex-1 leading-5">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg opacity-60 transition hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
                aria-label="Dismiss notification"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider.");
  return context;
}
