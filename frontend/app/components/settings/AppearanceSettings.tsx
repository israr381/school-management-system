import { useTheme } from "../../context/ThemeContext";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { Switch } from "~/components/ui/switch";
import { cn } from "~/lib/utils";

const themes = [
  { id: "light", label: "Light", description: "Clean daylight surface" },
  { id: "dark", label: "Dark", description: "Low-glare evening mode" },
] as const;

export default function AppearanceSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <Card className="bg-panel-bg text-text-main ring-border-main">
        <CardHeader className="border-b border-border-main">
          <CardTitle className="text-text-main">Theme</CardTitle>
          <CardDescription className="text-text-muted">
            Choose how EduManage looks across the console.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {themes.map((option) => {
              const isActive = theme === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTheme(option.id)}
                  className={cn(
                    "cursor-pointer rounded-xl border p-4 text-left transition-colors",
                    isActive
                      ? "border-brand bg-brand-soft"
                      : "border-border-main bg-surface-soft hover:border-brand/40"
                  )}
                >
                  <p className="text-sm font-semibold text-text-main">{option.label}</p>
                  <p className="mt-1 text-xs text-text-muted">{option.description}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-panel-bg text-text-main ring-border-main">
        <CardHeader className="border-b border-border-main">
          <CardTitle className="text-text-main">Display</CardTitle>
          <CardDescription className="text-text-muted">
            Adjust density and sidebar defaults for your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="compact-mode">Compact mode</Label>
              <p className="text-xs text-text-muted">
                Reduce spacing in tables and lists.
              </p>
            </div>
            <Switch id="compact-mode" />
          </div>
          <Separator className="bg-border-main" />
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="collapse-sidebar">Collapse sidebar by default</Label>
              <p className="text-xs text-text-muted">
                Start sessions with a narrower navigation rail.
              </p>
            </div>
            <Switch id="collapse-sidebar" />
          </div>
        </CardContent>
        <CardFooter className="justify-end bg-transparent border-border-main">
          <Button type="button">Save preferences</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
