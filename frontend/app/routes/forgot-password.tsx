import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import AuthLayout from "../components/auth/AuthLayout";
import Button from "../components/button/Button";
import Input from "../components/input/Input";
import { requestPasswordReset } from "../store/auth";

export function meta() {
  return [
    { title: "Forgot Password - School Management" },
    { name: "description", content: "Enter your email to reset your password." },
  ];
}

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const data = await requestPasswordReset(trimmed);
      const params = new URLSearchParams({
        email: data.email,
        token: data.reset_token,
      });
      navigate(`/change-password?${params.toString()}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to start password reset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-brand-soft text-brand flex items-center justify-center mb-4 border border-brand-soft-border">
          <Mail className="w-7 h-7" />
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text-main">
          Forgot Password?
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          Enter your account email to continue resetting your password.
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
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          autoComplete="email"
          leftIcon={<Mail className="w-4.5 h-4.5" />}
        />

        <Button type="submit" loading={loading} fullWidth className="mt-1">
          Next
          <ArrowRight className="w-4.5 h-4.5" />
        </Button>
      </form>

      <Link
        to="/login"
        className="mt-6 inline-flex items-center justify-center gap-2 w-full text-sm font-medium text-text-muted hover:text-text-main transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to login
      </Link>
    </AuthLayout>
  );
}
