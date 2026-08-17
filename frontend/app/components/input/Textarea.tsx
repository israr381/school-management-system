import type { TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export default function Textarea({
  label,
  id,
  className = "",
  ...props
}: TextareaProps) {
  const textareaId = id || props.name;

  return (
    <div>
      {label && (
        <label htmlFor={textareaId} className="mb-2 block text-sm font-medium text-text-main">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          "w-full resize-none rounded-xl border border-border-main bg-input-bg px-4 py-3 text-text-main placeholder-text-muted/70 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand transition-all",
          className,
        )}
        {...props}
      />
    </div>
  );
}
