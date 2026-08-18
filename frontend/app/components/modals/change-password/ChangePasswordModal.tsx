import { useEffect, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { changePassword, getAccessToken } from "../../../store/auth";
import Button from "../../button/Button";
import Input from "../../input/Input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

const DEFAULT_ADMIN_PASSWORD = "passpass";

interface ChangePasswordModalProps {
  open: boolean;
  onSuccess?: () => Promise<void> | void;
}

export default function ChangePasswordModal({
  open,
  onSuccess,
}: ChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setError("");
    setLoading(false);
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword === DEFAULT_ADMIN_PASSWORD) {
      setError("Please choose a password other than the default password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setError("Authentication session expired. Please sign in again.");
      return;
    }

    setLoading(true);
    try {
      await changePassword(token, {
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      await onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => undefined} disablePointerDismissal>
      <DialogContent
        className="bg-panel-bg text-text-main sm:max-w-md p-0 gap-0"
        showCloseButton={false}
      >
        <DialogHeader className="border-b border-border-main px-6 py-5">
          <DialogTitle className="text-xl font-bold tracking-tight text-text-main">
            Change Password
          </DialogTitle>
          <DialogDescription className="text-sm text-text-muted">
            You signed in with the default password. Please set a new password
            before continuing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-danger-bg border border-danger-border text-danger text-sm">
              {error}
            </div>
          )}

          <Input
            type={showNewPassword ? "text" : "password"}
            name="new_password"
            label="New Password"
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter a new password"
            autoComplete="new-password"
            leftIcon={<Lock className="w-4.5 h-4.5" />}
            rightAction={
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="text-icon-muted hover:text-text-main transition-colors p-1 cursor-pointer"
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? (
                  <EyeOff className="w-4.5 h-4.5" />
                ) : (
                  <Eye className="w-4.5 h-4.5" />
                )}
              </button>
            }
          />

          <Input
            type={showConfirmPassword ? "text" : "password"}
            name="confirm_password"
            label="Confirm New Password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your new password"
            autoComplete="new-password"
            leftIcon={<Lock className="w-4.5 h-4.5" />}
            rightAction={
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="text-icon-muted hover:text-text-main transition-colors p-1 cursor-pointer"
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4.5 h-4.5" />
                ) : (
                  <Eye className="w-4.5 h-4.5" />
                )}
              </button>
            }
          />

          <DialogFooter className="mx-0 mb-0 rounded-none border-border-main bg-transparent px-0 pb-0 pt-2">
            <Button type="submit" loading={loading} className="py-2.5 px-5 w-full sm:w-auto">
              Set New Password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
