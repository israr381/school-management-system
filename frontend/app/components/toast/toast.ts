type ToastVariant = "success" | "error";

export interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
  exiting?: boolean;
}

type ToastListener = (toasts: ToastItem[]) => void;

let nextId = 1;
let toasts: ToastItem[] = [];
const listeners = new Set<ToastListener>();

const EXIT_MS = 280;
const SHOW_MS = 3500;
const exitTimers = new Map<number, number>();

function emit() {
  listeners.forEach((listener) => listener(toasts));
}

function push(message: string, variant: ToastVariant) {
  const toast: ToastItem = { id: nextId++, message, variant };
  toasts = [...toasts, toast];
  emit();

  window.setTimeout(() => {
    dismiss(toast.id);
  }, SHOW_MS);

  return toast.id;
}

export function dismiss(id: number) {
  const current = toasts.find((toast) => toast.id === id);
  if (!current || current.exiting) return;

  toasts = toasts.map((toast) =>
    toast.id === id ? { ...toast, exiting: true } : toast,
  );
  emit();

  const timer = window.setTimeout(() => {
    toasts = toasts.filter((toast) => toast.id !== id);
    exitTimers.delete(id);
    emit();
  }, EXIT_MS);

  exitTimers.set(id, timer);
}

export function subscribeToasts(listener: ToastListener) {
  listeners.add(listener);
  listener(toasts);
  return () => {
    listeners.delete(listener);
  };
}

export const toast = {
  success(message: string) {
    return push(message, "success");
  },
  error(message: string) {
    return push(message, "error");
  },
};
