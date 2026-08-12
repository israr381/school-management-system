import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemePreference } from "../../../context/ThemeContext";

const themeOptions: {
  id: ThemePreference;
  label: string;
  icon: typeof Sun;
}[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="grid grid-cols-3 gap-2">
      {themeOptions.map(({ id, label, icon: Icon }) => {
        const isActive = theme === id;

        return (
          <button
            key={id}
            type="button"
            onClick={() => setTheme(id)}
            className={`group flex cursor-pointer flex-col items-center gap-2 rounded-xl border px-2 py-3 transition-all duration-200 ${
              isActive
                ? "border-brand bg-brand-soft shadow-sm shadow-brand/10"
                : "border-border-main/60 bg-surface-soft hover:border-brand/30 hover:bg-brand-soft/40"
            }`}
            aria-pressed={isActive}
            aria-label={`${label} theme`}
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                isActive
                  ? "bg-linear-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25"
                  : "bg-panel-bg text-icon-muted group-hover:text-brand"
              }`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span
              className={`text-xs font-semibold ${
                isActive ? "text-brand" : "text-text-muted group-hover:text-text-main"
              }`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
