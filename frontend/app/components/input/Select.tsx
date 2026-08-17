import type { ReactNode, SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  leftIcon?: ReactNode;
}

export default function Select({
  label,
  options,
  placeholder,
  leftIcon,
  id,
  className = "",
  ...props
}: SelectProps) {
  const selectId = id || props.name;

  return (
    <div>
      {label && (
        <label htmlFor={selectId} className="mb-2 block text-sm font-medium text-text-main">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-icon-muted">
            {leftIcon}
          </span>
        )}
        <select
          id={selectId}
          className={cn(
            "w-full appearance-none rounded-xl border border-border-main bg-input-bg py-3 pr-11 text-text-main focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand transition-all",
            leftIcon ? "pl-11" : "pl-4",
            !props.value && "text-text-muted/70",
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-icon-muted" />
      </div>
    </div>
  );
}
