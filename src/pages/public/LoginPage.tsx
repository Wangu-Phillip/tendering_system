import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Shield,
  Users,
  CheckCircle,
  Eye,
  EyeOff,
  Clock,
  ArrowRight,
  X,
} from "lucide-react";
import authService from "@/firebase/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await authService.login(formData.email, formData.password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMessage(null);
    setForgotLoading(true);

    try {
      await authService.sendPasswordReset(forgotEmail);
      setForgotMessage({
        type: "success",
        text: "Password reset email sent! Check your inbox.",
      });
      setForgotEmail("");
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotMessage(null);
      }, 3000);
    } catch (err) {
      setForgotMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to send reset email",
      });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-sans flex flex-col">
      {/* Main Content */}
      <div className="flex flex-1">
        {/* Left Panel — Branding */}
        <div className="hidden lg:flex lg:w-[50%] bg-primary relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center px-12 xl:px-20 w-full">
            <div className="max-w-md text-center">
              <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-5">
                Welcome back<span className="text-blue-400">.</span>
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed mb-12">
                Sign in to manage tenders, submit bids, and track procurement
                activities.
              </p>

              <div className="flex justify-center gap-8 text-gray-400 text-sm">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-blue-400" />
                  <span>Secure</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-emerald-400" />
                  <span>500+ orgs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-amber-400" />
                  <span>99.9% uptime</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel — Login Form */}
        <div className="w-full lg:w-[45%] flex items-center justify-center px-4 sm:px-8 py-12 bg-gray-50">
          <div className="w-full max-w-md">
            {/* Mobile branding */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-14 h-14 bg-secondary text-white rounded-2xl flex items-center justify-center font-bold text-xl mx-auto mb-4 shadow-lg shadow-secondary/25">
                BW
              </div>
              <h2 className="text-2xl font-bold text-primary">Welcome Back</h2>
              <p className="text-gray-500 text-sm mt-1">
                Sign in to your account
              </p>
            </div>

            {/* Desktop heading */}
            <div className="hidden lg:block mb-8">
              <h2 className="text-2xl font-bold text-primary">Sign In</h2>
              <p className="text-gray-500 text-sm mt-1">
                Enter your credentials to access your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-red-700 text-sm flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">⚠</span>
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all shadow-sm"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs text-secondary hover:text-blue-700 font-medium transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all shadow-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-xl hover:bg-primary/90 transition-all font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/25 hover:shadow-primary/40"
              >
                {loading ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    Sign In <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                New here?
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <Link
              to="/register"
              className="w-full block text-center border border-gray-200 text-gray-700 py-3 rounded-xl hover:bg-white hover:border-gray-300 hover:shadow-sm transition-all font-semibold text-sm"
            >
              Create an Account
            </Link>

            {/* Bottom trust badges */}
            <div className="mt-8 flex items-center justify-center gap-6 text-gray-400">
              {[
                { icon: Shield, label: "Encrypted" },
                { icon: CheckCircle, label: "Verified" },
                { icon: Clock, label: "24/7 Access" },
              ].map((badge) => (
                <div
                  key={badge.label}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <badge.icon size={14} />
                  <span>{badge.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                Reset Password
              </h3>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotMessage(null);
                  setForgotEmail("");
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-600 text-sm mb-4">
                Enter your email address and we'll send you a link to reset your
                password.
              </p>

              {forgotMessage && (
                <div
                  className={`rounded-lg p-3 text-sm mb-4 ${
                    forgotMessage.type === "success"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {forgotMessage.text}
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label
                    htmlFor="forgotEmail"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Email Address
                  </label>
                  <input
                    id="forgotEmail"
                    type="email"
                    placeholder="you@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/90 transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {forgotLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Sending...
                    </span>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotMessage(null);
                    setForgotEmail("");
                  }}
                  className="w-full border border-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-all font-semibold text-sm"
                >
                  Cancel
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
