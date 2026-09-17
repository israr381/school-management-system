import { useCallback, useEffect, useState } from "react";
import { Loader2, Monitor, Smartphone, Tablet } from "lucide-react";
import {
  fetchAuthSessions,
  getAccessToken,
  logoutOtherSessions,
  type AuthSession,
} from "../../store/auth";
import { toast } from "../toast/toast";
import ConfirmDeleteModal from "../modals/confirm-delete/ConfirmDeleteModal";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/Input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { Switch } from "~/components/ui/switch";

function formatRelativeTime(value: string) {
  const parsed = new Date(value.endsWith("Z") || value.includes("+") ? value : `${value}Z`);
  if (Number.isNaN(parsed.getTime())) return "Unknown";

  const diffMs = Date.now() - parsed.getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return parsed.toLocaleDateString();
}

function DeviceIcon({ label }: { label: string }) {
  const value = label.toLowerCase();
  if (value.includes("iphone") || value.includes("android")) {
    return <Smartphone className="size-4 text-icon-muted" />;
  }
  if (value.includes("ipad") || value.includes("tablet")) {
    return <Tablet className="size-4 text-icon-muted" />;
  }
  return <Monitor className="size-4 text-icon-muted" />;
}

export default function SecuritySettings() {
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [confirmLogoutOthers, setConfirmLogoutOthers] = useState(false);
  const [loggingOutOthers, setLoggingOutOthers] = useState(false);

  const loadSessions = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      toast.error("Authentication session expired. Please sign in again.");
      setSessions([]);
      setLoadingSessions(false);
      return;
    }

    const data = await fetchAuthSessions(token);
    setSessions(data);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoadingSessions(true);
      try {
        await loadSessions();
      } catch (err: unknown) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load sessions.");
        }
      } finally {
        if (!cancelled) setLoadingSessions(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [loadSessions]);

  const otherSessionCount = sessions.filter((session) => !session.is_current).length;

  const handleLogoutOthers = async () => {
    const token = getAccessToken();
    if (!token) {
      toast.error("Authentication session expired. Please sign in again.");
      return;
    }

    setLoggingOutOthers(true);
    try {
      const result = await logoutOtherSessions(token);
      await loadSessions();
      setConfirmLogoutOthers(false);
      toast.success(
        result.revoked_count
          ? `Signed out ${result.revoked_count} other ${result.revoked_count === 1 ? "device" : "devices"}.`
          : "No other devices were signed in.",
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to sign out other devices.");
    } finally {
      setLoggingOutOthers(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-panel-bg text-text-main ring-border-main">
        <CardHeader className="border-b border-border-main">
          <CardTitle className="text-text-main">Change password</CardTitle>
          <CardDescription className="text-text-muted">
            Use a strong password you do not reuse on other sites.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="current_password">Current password</Label>
            <Input
              id="current_password"
              name="current_password"
              type="password"
              placeholder="••••••••"
              className="bg-input-bg border-border-main h-10 rounded-md"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new_password">New password</Label>
            <Input
              id="new_password"
              name="new_password"
              type="password"
              placeholder="••••••••"
              className="bg-input-bg border-border-main h-10 rounded-md"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm new password</Label>
            <Input
              id="confirm_password"
              name="confirm_password"
              type="password"
              placeholder="••••••••"
              className="bg-input-bg border-border-main h-10 rounded-md"
            />
          </div>
        </CardContent>
        <CardFooter className="justify-end bg-transparent border-border-main">
          <Button type="button" className="rounded-md">Update password</Button>
        </CardFooter>
      </Card>

      <Card className="bg-panel-bg text-text-main ring-border-main">
        <CardHeader className="border-b border-border-main">
          <CardTitle className="text-text-main">Active sessions</CardTitle>
          <CardDescription className="text-text-muted">
            Devices currently signed in to your account. Signing out other devices expires their tokens immediately.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          {loadingSessions ? (
            <div className="flex items-center gap-2 py-6 text-sm text-text-muted">
              <Loader2 className="size-4 animate-spin" />
              Loading sessions...
            </div>
          ) : sessions.length === 0 ? (
            <p className="py-4 text-sm text-text-muted">
              No active sessions were found. Sign in again to start tracking this device.
            </p>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-border-main bg-surface-soft px-4 py-3"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-border-main bg-panel-bg">
                    <DeviceIcon label={session.device_label} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text-main">
                      {session.device_label || "Unknown device"}
                    </p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {session.ip_address || "Unknown IP"} · Last seen {formatRelativeTime(session.last_seen_at)}
                    </p>
                  </div>
                </div>
                {session.is_current ? (
                  <span className="inline-flex shrink-0 items-center rounded-full border border-brand/30 bg-brand-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand">
                    Current
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 items-center rounded-full border border-border-main bg-panel-bg px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                    Other
                  </span>
                )}
              </div>
            ))
          )}
        </CardContent>
        <CardFooter className="justify-end bg-transparent border-border-main">
          <Button
            variant="destructive"
            type="button"
            className="rounded-md"
            disabled={loadingSessions || loggingOutOthers || otherSessionCount === 0}
            onClick={() => setConfirmLogoutOthers(true)}
          >
            Sign out other devices
          </Button>
        </CardFooter>
      </Card>

      <Card className="bg-panel-bg text-text-main ring-border-main">
        <CardHeader className="border-b border-border-main">
          <CardTitle className="text-text-main">Session & access</CardTitle>
          <CardDescription className="text-text-muted">
            Extra protections for your administrator account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="two-factor">Two-factor authentication</Label>
              <p className="text-xs text-text-muted">
                Require a second step when signing in.
              </p>
            </div>
            <Switch id="two-factor" />
          </div>
          <Separator className="bg-border-main" />
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="login-alerts">Login alerts</Label>
              <p className="text-xs text-text-muted">
                Email me when a new device signs in.
              </p>
            </div>
            <Switch id="login-alerts" defaultChecked />
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-2 bg-transparent border-border-main">
          <Button type="button" className="rounded-md">Save security settings</Button>
        </CardFooter>
      </Card>

      <ConfirmDeleteModal
        open={confirmLogoutOthers}
        title="Sign out other devices?"
        description="All other devices will be signed out immediately and their tokens will expire. This device will stay signed in."
        confirmLabel="Sign out other devices"
        confirmVariant="danger"
        loading={loggingOutOthers}
        onOpenChange={setConfirmLogoutOthers}
        onConfirm={() => {
          void handleLogoutOthers();
        }}
      />
    </div>
  );
}
