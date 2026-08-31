import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, Eye, EyeOff, KeyRound, Lock, Mail } from "lucide-react";
import AuthLayout from "../components/auth/AuthLayout";
import Button from "../components/button/Button";
import Input from "../components/input/Input";
import { toast } from "../components/toast/toast";
import { resetPassword } from "../store/auth";

export function meta() {
  return [
    { title: "Change Password - School Management" },
    { name: "description", content: "Set a new password for your account." },
  ];
}

function PasswordToggle({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="text-icon-muted hover:text-text-main transition-colors p-1 cursor-pointer"
      aria-label={visible ? "Hide password" : "Show password"}
    >
      {visible ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
    </button>
  );
}

export default function ChangePassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email")?.trim() ?? "";
  const resetToken = searchParams.get("token")?.trim() ?? "";

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email || !resetToken) {
      navigate("/forgot-password", { replace: true });
    }
  }, [email, resetToken, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!currentPassword) {
      setError("Please enter your current password.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword({
        email,
        reset_token: resetToken,
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      toast.success("Password updated successfully.");
      navigate("/login");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  if (!email || !resetToken) return null;

  return (
    <AuthLayout>
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-brand-soft text-brand flex items-center justify-center mb-4 border border-brand-soft-border">
          <KeyRound className="w-7 h-7" />
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text-main">
          Change Password
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          Enter your current password and choose a new one.
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-danger-bg border border-danger-border text-danger text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          type="email"
          name="email"
          label="Email"
          value={email}
          readOnly
          leftIcon={<Mail className="w-4.5 h-4.5" />}
        />

        <Input
          type={showCurrent ? "text" : "password"}
          name="current_password"
          label="Current Password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Enter your current password"
          autoComplete="current-password"
          leftIcon={<Lock className="w-4.5 h-4.5" />}
          rightAction={
            <PasswordToggle visible={showCurrent} onToggle={() => setShowCurrent((prev) => !prev)} />
          }
        />

        <Input
          type={showNew ? "text" : "password"}
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
            <PasswordToggle visible={showNew} onToggle={() => setShowNew((prev) => !prev)} />
          }
        />

        <Input
          type={showConfirm ? "text" : "password"}
          name="confirm_password"
          label="Confirm Password"
          required
          minLength={6}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter your new password"
          autoComplete="new-password"
          leftIcon={<Lock className="w-4.5 h-4.5" />}
          rightAction={
            <PasswordToggle
              visible={showConfirm}
              onToggle={() => setShowConfirm((prev) => !prev)}
            />
          }
        />

        <Button type="submit" loading={loading} fullWidth className="mt-1">
          Update Password
        </Button>
      </form>

      <Link
        to="/forgot-password"
        className="mt-6 inline-flex items-center justify-center gap-2 w-full text-sm font-medium text-text-muted hover:text-text-main transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>
    </AuthLayout>
  );
}
