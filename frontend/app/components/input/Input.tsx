import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelAction?: ReactNode;
  leftIcon?: ReactNode;
  rightAction?: ReactNode;
}

export default function Input({
  label,
  labelAction,
  leftIcon,
  rightAction,
  id,
  className = "",
  ...props
}: InputProps) {
  const inputId = id || props.name;

  return (
    <div>
      {(label || labelAction) && (
        <div className={`flex items-center mb-2 ${labelAction ? "justify-between" : ""}`}>
          {label && (
            <label
              htmlFor={inputId}
              className="block text-sm font-medium text-text-main"
            >
              {label}
            </label>
          )}
          {labelAction}
        </div>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-icon-muted pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          className={`w-full py-3 rounded-xl border border-border-main bg-input-bg text-text-main placeholder-text-muted/70 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all ${leftIcon ? "pl-11" : "pl-4"} ${rightAction ? "pr-11" : "pr-4"} ${className}`}
          {...props}
        />
        {rightAction && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightAction}
          </span>
        )}
      </div>
    </div>
  );
}
