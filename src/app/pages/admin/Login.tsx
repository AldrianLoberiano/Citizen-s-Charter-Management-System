/**
 * Admin Login Page
 * Secure login form with validation
 * In production: credentials verified server-side with PHP/MySQL using password_verify()
 */

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { Shield, Eye, EyeOff, AlertCircle, Lock, User } from "lucide-react";
import { loginWithApi, isAuthenticated } from "../../store/data";

export function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Input validation (equivalent to PHP server-side validation)
    if (!username.trim()) {
      setError("Username is required.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }

    setLoading(true);

    // Simulate server response delay
    setTimeout(() => {
      loginWithApi(username.trim(), password)
        .then((success) => {
          if (success) {
            navigate("/admin/dashboard", { replace: true });
            return;
          }
          setError("Invalid username or password. Please try again.");
        })
        .finally(() => setLoading(false));
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-800 rounded-2xl mb-4 shadow-md">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-slate-900">Admin Portal</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Citizen's Charter Management System
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <div className="mb-6">
            <h2 className="text-slate-800">Sign In</h2>
            <p className="text-slate-500 text-sm mt-1">
              Enter your administrator credentials to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Error Alert */}
            {error && (
              <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Username Field */}
            <div>
              <label
                htmlFor="username"
                className="block text-slate-700 mb-1.5"
              >
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-slate-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-12 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-800 text-white rounded-lg hover:bg-blue-900 active:bg-blue-950 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-slate-500 text-xs text-center mb-2">
              Demo Credentials
            </p>
            <div className="flex justify-center gap-6 text-sm">
              <span className="text-slate-600">
                Username:{" "}
                <span className="text-slate-900 font-medium">admin</span>
              </span>
              <span className="text-slate-600">
                Password:{" "}
                <span className="text-slate-900 font-medium">admin123</span>
              </span>
            </div>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-5">
          <Link
            to="/"
            className="text-blue-700 hover:text-blue-900 text-sm transition-colors"
          >
            Return to Public Site
          </Link>
        </div>
      </div>
    </div>
  );
}
