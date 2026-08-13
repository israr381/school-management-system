import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { useEffect, useState } from "react";
import { dismiss, subscribeToasts, type ToastItem } from "./toast";

export default function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => subscribeToasts(setToasts), []);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed top-20 right-4 z-20 flex w-[min(100%-2rem,22rem)] flex-col gap-2">
      {toasts.map((item) => {
        const isSuccess = item.variant === "success";

        return (
          <div
            key={item.id}
            className={`toast-item pointer-events-auto flex items-start gap-3 rounded-xl border px-3.5 py-3 shadow-lg ${
              item.exiting ? "toast-item-out" : "toast-item-in"
            } ${
              isSuccess
                ? "border-success-border bg-success-bg text-success"
                : "border-danger-border bg-danger-bg text-danger"
            }`}
          >
            {isSuccess ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            ) : (
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
            )}
            <p className="flex-1 text-sm font-medium leading-5">{item.message}</p>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              className="cursor-pointer rounded-md p-0.5 opacity-70 transition-opacity hover:opacity-100"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
