import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, resolvedTheme, toggleTheme } = useTheme();

  const title =
    theme === "system"
      ? `System theme (${resolvedTheme})`
      : resolvedTheme === "light"
        ? "Switch to dark mode"
        : "Switch to light mode";

  return (
    <button
      onClick={toggleTheme}
      className="flex cursor-pointer items-center justify-center rounded-xl border border-toggle-border bg-toggle-bg p-2.5 text-toggle-text transition-all duration-300 hover:scale-[1.02] hover:bg-toggle-bg-hover active:scale-[0.98] focus:outline-none"
      aria-label="Toggle theme"
      title={title}
    >
      <div className="relative flex h-5 w-5 items-center justify-center">
        <Sun
          className={`absolute h-5 w-5 transform transition-all duration-500 ${
            resolvedTheme === "dark" ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
          }`}
        />
        <Moon
          className={`absolute h-5 w-5 transform transition-all duration-500 ${
            resolvedTheme === "light" ? "-rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
          }`}
        />
        {theme === "system" && (
          <Monitor className="absolute -bottom-1 -right-1 h-2.5 w-2.5 text-brand" />
        )}
      </div>
    </button>
  );
}
