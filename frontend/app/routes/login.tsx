import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  ShieldCheck,
  User,
} from "lucide-react";
import { loginUser, persistAuthSession } from "../store/auth";
import ThemeToggle from "../components/ThemeToggle";
import Button from "../components/button/Button";
import Input from "../components/input/Input";
import loginIllustration from "../assets/login-illustration.png";

export function meta() {
  return [
    { title: "Sign In - Opelae School" },
    { name: "description", content: "Access your dashboard and manage school operations." },
  ];
}

const features = [
  { title: "Student Management", icon: GraduationCap },
  { title: "Attendance Tracking", icon: ClipboardList },
  { title: "Reports & Analytics", icon: BarChart3 },
];

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
      const data = await loginUser(formData.email, formData.password, rememberMe);
      persistAuthSession(data);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Connection failed. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full text-text-main relative transition-colors duration-300 grid grid-cols-1 lg:grid-cols-2">
      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle />
      </div>

      <section className="relative hidden lg:flex flex-col justify-between min-h-screen p-8 md:p-12 xl:p-16 bg-surface-soft">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-text-main">Opelae School</p>
            <p className="text-xs leading-tight text-text-muted">Management System</p>
          </div>
        </div>

        <div className="mt-10 lg:mt-0 space-y-5 max-w-lg">
          <h1 className="text-3xl md:text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.15]">
            Smart School.{" "}
            <span className="bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Better Future.
            </span>
          </h1>
          <p className="text-text-muted text-sm md:text-base leading-relaxed">
            Manage students, staff, classes, attendance, exams and much more in one place.
          </p>
        </div>

        <div className="mt-8 lg:mt-0 flex-1 flex items-center justify-center py-8">
          <img
            src={loginIllustration}
            alt="Students at school"
            className="w-full max-w-xl object-contain"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {features.map(({ title, icon: Icon }) => (
            <div
              key={title}
              className="flex items-center gap-2.5 rounded-xl bg-panel-bg border border-border-main px-3 py-3"
            >
              <span className="w-8 h-8 rounded-lg bg-brand-soft text-brand flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" />
              </span>
              <span className="text-xs font-semibold text-text-main leading-snug">{title}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center min-h-screen p-6 md:p-10 xl:p-16 bg-app-bg lg:border-l border-border-main">
        <div className="w-full max-w-md bg-panel-bg rounded-3xl border border-border-main shadow-xl shadow-text-main/5 p-6 md:p-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-brand-soft text-brand flex items-center justify-center mb-4 border border-brand-soft-border">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text-main">
              Welcome Back!
            </h2>
            <p className="mt-2 text-sm text-text-muted">
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
              leftIcon={<User className="w-4.5 h-4.5" />}
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
              rightAction={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-icon-muted hover:text-text-main transition-colors p-1 cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
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
              <button
                type="button"
                className="text-brand hover:text-brand-hover font-medium cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            <Button type="submit" loading={loading} fullWidth className="mt-1">
              Login
              <ArrowRight className="w-4.5 h-4.5" />
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
