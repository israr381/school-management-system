import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

type ButtonVariant = "primary" | "danger" | "ghost" | "outline";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "py-3.5 px-4 bg-linear-to-r from-btn-primary-from to-btn-primary-to hover:from-btn-primary-from-hover hover:to-btn-primary-to-hover text-white font-semibold rounded-md shadow-md shadow-indigo-500/20 focus:ring-2 focus:ring-role-focus-ring hover:scale-[1.01] active:scale-[0.99]",
  danger:
    "px-3.5 py-2 text-sm font-medium text-danger hover:bg-danger-hover-bg rounded-md border border-transparent hover:border-danger-border",
  ghost:
    "px-3.5 py-2 text-sm font-medium text-text-muted hover:bg-app-bg hover:text-text-main rounded-md",
  outline:
    "px-3.5 py-2.5 text-sm font-medium text-text-main bg-panel-bg hover:bg-surface-soft rounded-md border border-border-main",
};

export default function Button({
  variant = "primary",
  loading = false,
  fullWidth = false,
  disabled,
  className = "",
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
        variantClasses[variant],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin h-5 w-5" /> : children}
    </button>
  );
}
