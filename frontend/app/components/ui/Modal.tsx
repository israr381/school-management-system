import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "md" | "lg";
}

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClass = size === "lg" ? "max-w-2xl" : "max-w-lg";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal backdrop"
        className="absolute inset-0 bg-text-main/40 backdrop-blur-[2px] cursor-pointer"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative w-full ${sizeClass} max-h-[90vh] overflow-y-auto rounded-2xl border border-border-main bg-panel-bg shadow-2xl`}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border-main bg-panel-bg px-6 py-5">
          <div className="min-w-0">
            <h2 id="modal-title" className="text-xl font-bold tracking-tight text-text-main">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-text-muted">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-text-muted hover:bg-surface-soft hover:text-text-main transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
