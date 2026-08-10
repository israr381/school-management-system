import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-xl bg-toggle-bg hover:bg-toggle-bg-hover text-toggle-text transition-all duration-300 flex items-center justify-center border border-toggle-border hover:scale-[1.02] active:scale-[0.98] focus:outline-none cursor-pointer"
      aria-label="Toggle Theme"
      title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        <Sun
          className={`w-5 h-5 absolute transition-all duration-500 transform ${theme === "dark" ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
            }`}
        />
        <Moon
          className={`w-5 h-5 absolute transition-all duration-500 transform ${theme === "light" ? "-rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
            }`}
        />
      </div>
    </button>
  );
}
