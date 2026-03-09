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
} from "lucide-react";
import { z } from "zod";
import authService from "@/firebase/auth";
import { registerSchema } from "@/utils/validation";

interface FieldErrors {
  email?: string;
  displayName?: string;
  password?: string;
  confirmPassword?: string;
}

export default function CreateAccountPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    displayName: "",
    organizationName: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateField = (name: string, value: string): string | undefined => {
    try {
      if (name === "email") {
        z.string().email("Invalid email address").parse(value);
      } else if (name === "displayName") {
        z.string().min(2, "Name must be at least 2 characters").parse(value);
      } else if (name === "password") {
        z.string()
          .min(8, "Password must be at least 8 characters")
          .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
          .regex(/[0-9]/, "Password must contain at least one number")
          .parse(value);
      } else if (name === "confirmPassword") {
        if (value !== formData.password) {
          return "Passwords don't match";
        }
      }
      return undefined;
    } catch (err) {
      if (err instanceof z.ZodError) {
        return err.errors[0].message;
      }
      return "Invalid input";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Validate all fields
    const newFieldErrors: FieldErrors = {};

    if (!formData.displayName.trim()) {
      newFieldErrors.displayName = "Name is required";
    } else {
      const nameError = validateField("displayName", formData.displayName);
      if (nameError) newFieldErrors.displayName = nameError;
    }

    if (!formData.email.trim()) {
      newFieldErrors.email = "Email is required";
    } else {
      const emailError = validateField("email", formData.email);
      if (emailError) newFieldErrors.email = emailError;
    }

    if (!formData.password) {
      newFieldErrors.password = "Password is required";
    } else {
      const passwordError = validateField("password", formData.password);
      if (passwordError) newFieldErrors.password = passwordError;
    }

    if (!formData.confirmPassword) {
      newFieldErrors.confirmPassword = "Please confirm your password";
    } else {
      const confirmError = validateField(
        "confirmPassword",
        formData.confirmPassword,
      );
      if (confirmError) newFieldErrors.confirmPassword = confirmError;
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return;
    }

    setLoading(true);

    try {
      // Validate full form with schema
      registerSchema.parse(formData);

      // Register user
      await authService.register(
        formData.email,
        formData.password,
        formData.displayName,
        formData.organizationName,
      );

      navigate("/");
    } catch (err) {
      if (err instanceof z.ZodError) {
        const zodErrors: FieldErrors = {};
        err.errors.forEach((error) => {
          const path = error.path[0] as string;
          zodErrors[path as keyof FieldErrors] = error.message;
        });
        setFieldErrors(zodErrors);
      } else {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create account";
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
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
                Welcome<span className="text-blue-400">.</span>
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed mb-12">
                Create an account to participate in tenders, submit bids, and
                manage procurement activities.
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

        {/* Right Panel — Registration Form */}
        <div className="w-full lg:w-[45%] flex items-center justify-center px-4 sm:px-8 py-12 bg-gray-50">
          <div className="w-full max-w-md">
            {/* Mobile branding */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-14 h-14 bg-secondary text-white rounded-2xl flex items-center justify-center font-bold text-xl mx-auto mb-4 shadow-lg shadow-secondary/25">
                BW
              </div>
              <h2 className="text-2xl font-bold text-primary">
                Create Account
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Create your account to get started
              </p>
            </div>

            {/* Desktop heading */}
            <div className="hidden lg:block mb-8">
              <h2 className="text-2xl font-bold text-primary">
                Create Account
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Enter your details to create your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-red-700 text-sm flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">⚠</span>
                  {error}
                </div>
              )}

              {/* Full Name */}
              <div>
                <label
                  htmlFor="displayName"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Full Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  placeholder="John Doe"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  required
                  className={`w-full px-4 py-3 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent transition-all shadow-sm ${
                    fieldErrors.displayName
                      ? "border-red-300 focus:ring-red-500/50"
                      : "border-gray-200 focus:ring-secondary/50"
                  }`}
                />
                {fieldErrors.displayName && (
                  <p className="text-red-600 text-xs mt-1.5">
                    {fieldErrors.displayName}
                  </p>
                )}
              </div>

              {/* Email Address */}
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
                  className={`w-full px-4 py-3 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent transition-all shadow-sm ${
                    fieldErrors.email
                      ? "border-red-300 focus:ring-red-500/50"
                      : "border-gray-200 focus:ring-secondary/50"
                  }`}
                />
                {fieldErrors.email && (
                  <p className="text-red-600 text-xs mt-1.5">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Organization Name (Optional) */}
              <div>
                <label
                  htmlFor="organizationName"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Organization Name
                </label>
                <input
                  id="organizationName"
                  type="text"
                  placeholder="Your Company Inc."
                  value={formData.organizationName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      organizationName: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all shadow-sm"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Password
                </label>
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
                {fieldErrors.password && (
                  <p className="text-red-600 text-xs mt-1.5">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all shadow-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-red-600 text-xs mt-1.5">
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-xl hover:bg-primary/90 transition-all font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/25 hover:shadow-primary/40"
              >
                {loading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                Already have an account?
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Login Link */}
            <Link
              to="/login"
              className="w-full block text-center border border-gray-200 text-gray-700 py-3 rounded-xl hover:bg-white hover:border-gray-300 hover:shadow-sm transition-all font-semibold text-sm"
            >
              Sign In
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
    </div>
  );
}
