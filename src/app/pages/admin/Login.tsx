/**
 * Admin Login Page
 * Secure login form with validation
 */

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { Eye, EyeOff, AlertCircle, Lock, User } from "lucide-react";
import { loginWithApi, isAuthenticated } from "../../store/data";
import { syncLocalCacheFromApi } from "../../store/apiSync";

const adminLogoSrc = new URL(
  "../../../public/images/header/logo.png",
  import.meta.url
).href;

export function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Username is required.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      loginWithApi(username.trim(), password)
        .then(async (success) => {
          if (success) {
            await syncLocalCacheFromApi();
            navigate("/admin/dashboard", { replace: true });
            return;
          }
          setError("Invalid username or password. Please try again.");
        })
        .finally(() => setLoading(false));
    }, 600);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 dark:bg-slate-950 p-4">
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl">
          <img
            src={adminLogoSrc}
            alt="Calauan City Seal"
            className="h-20 w-20 object-contain"
            loading="lazy"
            decoding="async"
          />
        </div>
        <h1 className="text-slate-900 dark:text-white">Admin Portal</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Citizen's Charter Management System
        </p>
      </div>

      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-slate-800 dark:text-white">Sign In</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Enter your administrator credentials to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 p-3 text-sm text-red-700 dark:text-red-400">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="username"
                className="mb-1.5 block text-slate-700 dark:text-slate-300"
              >
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 py-2.5 pl-10 pr-4 text-slate-900 dark:text-white shadow-sm placeholder-slate-400 dark:placeholder-slate-500 transition-shadow focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-slate-700 dark:text-slate-300"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 py-2.5 pl-10 pr-12 text-slate-900 dark:text-white shadow-sm placeholder-slate-400 dark:placeholder-slate-500 transition-shadow focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-900 py-2.5 text-white transition-colors hover:bg-violet-950 active:bg-violet-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
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

        </div>

        <div className="text-center mt-5">
          <Link
            to="/"
            className="text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 text-sm transition-colors"
          >
            Return to Public Site
          </Link>
        </div>
      </div>
    </div>
  );
}