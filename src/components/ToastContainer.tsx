import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useToast, ToastType } from "@/context/ToastContext";

const icons: Record<ToastType, React.ElementType> = {
  error: AlertCircle,
  success: CheckCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles: Record<ToastType, string> = {
  error: "bg-red-600 text-white",
  success: "bg-green-600 text-white",
  warning: "bg-amber-500 text-white",
  info: "bg-blue-600 text-white",
};

export default function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        const Icon = icons[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-lg shadow-xl pointer-events-auto ${styles[toast.type]}`}
            style={{ animation: "slideInRight 0.25s ease-out" }}
          >
            <Icon size={20} className="shrink-0 mt-0.5" />
            <p className="text-sm font-medium flex-1 leading-snug">
              {toast.message}
            </p>
            <button
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 opacity-80 hover:opacity-100 transition-opacity ml-1"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
