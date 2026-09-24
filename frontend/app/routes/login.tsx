import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
} from "lucide-react";
import { loginUser, persistAuthSession } from "../store/auth";
import { useRbacStore } from "../store/rbacStore";
import AuthLayout from "../components/auth/AuthLayout";
import Button from "../components/button/Button";
import Input from "../components/input/Input";

export function meta() {
  return [
    { title: "Sign In - School Management" },
    {
      name: "description",
      content: "Access your dashboard and manage school operations.",
    },
  ];
}

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await loginUser(
        formData.email,
        formData.password,
        rememberMe,
      );
      persistAuthSession(data);
      await useRbacStore.getState().loadPermissions();
      navigate("/dashboard");
    } catch (err: any) {
      setError(
        err.message || "Connection failed. Make sure the backend is running.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-8">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-btn-primary-from to-btn-primary-to text-primary-foreground shadow-lg shadow-brand/30">
          <GraduationCap className="h-7 w-7" />
        </div>
        <h2 className="text-[1.75rem] font-extrabold tracking-tight text-text-main md:text-[2rem]">
          Welcome Back!
        </h2>
        <p className="mt-1.5 text-sm text-text-muted">
          Login to your account to continue
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
          label="Email or Username"
          required
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email or username"
          leftIcon={<Mail className="w-4.5 h-4.5" />}
          className="rounded-lg border-auth-input-border bg-auth-input-bg"
        />

        <Input
          type={showPassword ? "text" : "password"}
          name="password"
          label="Password"
          required
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter your password"
          leftIcon={<Lock className="w-4.5 h-4.5" />}
          className="rounded-lg border-auth-input-border bg-auth-input-bg"
          rightAction={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="text-icon-muted hover:text-text-main transition-colors p-1 cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-4.5 h-4.5" />
              ) : (
                <Eye className="w-4.5 h-4.5" />
              )}
            </button>
          }
        />

        <div className="flex items-center justify-between gap-3 text-sm">
          <label className="inline-flex items-center gap-2 text-text-muted cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-border-main text-brand focus:ring-brand cursor-pointer"
            />
            Remember me
          </label>
          <Link
            to="/forgot-password"
            className="text-brand hover:text-brand-hover font-medium cursor-pointer"
          >
            Forgot Password?
          </Link>
        </div>

        <Button type="submit" loading={loading} fullWidth className="mt-2">
          Login
          <ArrowRight className="w-4.5 h-4.5" />
        </Button>
      </form>
    </AuthLayout>
  );
}
