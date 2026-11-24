import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { user, loading, authError, signInWithGoogle, signInLocal, clearAuthError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = (location.state as { from?: string } | null)?.from || '/';

  const [email, setEmail] = useState('ayush@oakridge.home');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySent, setRecoverySent] = useState(false);

  if (!loading && user) {
    return <Navigate to={fromPath === '/login' ? '/' : fromPath} replace />;
  }

  const handleLocalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    setFormError(null);
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setFormError('Enter a valid email address.');
      return;
    }
    if (password.trim().length < 4) {
      setFormError('Password must be at least 4 characters.');
      return;
    }
    setSubmitting(true);
    const ok = await signInLocal(trimmed, rememberDevice);
    setSubmitting(false);
    if (ok) {
      navigate(fromPath === '/login' ? '/' : fromPath, { replace: true });
    }
  };

  const handleGoogleSignIn = async () => {
    clearAuthError();
    setFormError(null);
    setGoogleSubmitting(true);
    const ok = await signInWithGoogle();
    setGoogleSubmitting(false);
    if (ok) {
      navigate(fromPath === '/login' ? '/' : fromPath, { replace: true });
    }
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail.trim() || !recoveryEmail.includes('@')) return;
    setRecoverySent(true);
  };

  return (
    <div className="relative min-h-screen bg-surface text-on-surface font-gellix flex flex-col justify-between overflow-hidden px-4 py-8 sm:py-10">
      {/* Subtle architectural house linework in Amplitude Blue */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <svg
          className="absolute top-10 left-1/2 -translate-x-1/2 w-[420px] h-[240px] opacity-[0.06] text-accent-text"
          viewBox="0 0 400 240"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        >
          <path d="M40 140 L200 35 L360 140" />
          <path d="M80 115 V225 H320 V115" />
          <line x1="160" y1="225" x2="160" y2="155" />
          <line x1="240" y1="225" x2="240" y2="155" />
          <line x1="160" y1="155" x2="240" y2="155" />
          <circle cx="200" cy="95" r="18" />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-[420px] mx-auto my-auto flex flex-col items-center">
        <div className="text-eyebrow-s text-accent-text mb-4">Context-Aware Smart Home OS</div>

        <div className="w-14 h-14 rounded-xl bg-surface-container border border-outline flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-[28px] text-on-surface">
            home_iot_device
          </span>
        </div>

        <h1 className="text-title-s font-bold tracking-tight text-on-surface">Aware Home</h1>
        <p className="text-text-s font-normal text-on-surface-variant mt-1 mb-6">
          Smarter home. Lower bills.
        </p>

        {/* Login Card */}
        <div className="w-full rounded-xl bg-surface-container border border-outline p-6">
          <div className="mb-5">
            <h2 className="text-title-xs font-semibold text-on-surface">Welcome back</h2>
            <p className="text-text-xs font-normal text-on-surface-variant mt-1">
              Sign in with Google for cloud persistence or run locally in simulation mode.
            </p>
          </div>

          {(formError || authError) && (
            <div
              role="alert"
              className="mb-4 px-3.5 py-2.5 rounded-lg bg-error-container border border-error/40 text-text-xs text-on-error-container flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px] text-error shrink-0">
                error
              </span>
              <span>{formError || authError}</span>
            </div>
          )}

          <form onSubmit={handleLocalSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-text-xs font-medium text-on-surface-variant mb-1.5"
              >
                Email address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2">
                  mail
                </span>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="resident@oakridge.home"
                  className="w-full h-10 pl-10 pr-3.5 rounded-lg bg-surface border border-outline text-text-s font-normal text-on-surface placeholder-gray-50 focus:outline-none focus:border-accent-text transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="text-text-xs font-medium text-on-surface-variant"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setRecoveryEmail(email);
                    setRecoverySent(false);
                    setForgotOpen(true);
                  }}
                  className="text-text-xs font-medium text-accent-text hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2">
                  lock
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full h-10 pl-10 pr-10 rounded-lg bg-surface border border-outline text-text-s font-normal text-on-surface placeholder-gray-50 focus:outline-none focus:border-accent-text transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={rememberDevice}
                  onClick={() => setRememberDevice((v) => !v)}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    rememberDevice
                      ? 'bg-amplitude-blue border-amplitude-blue text-white'
                      : 'bg-surface border-outline'
                  }`}
                >
                  {rememberDevice && (
                    <span className="material-symbols-outlined text-[13px]">check</span>
                  )}
                </button>
                <span className="text-text-xs text-on-surface-variant">Remember device</span>
              </label>
              <span className="text-text-xs text-on-surface-variant">Local simulation</span>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={submitting}
              className="h-10 font-semibold"
            >
              <span>{submitting ? 'Signing in...' : 'Sign in'}</span>
              {!submitting && (
                <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-5 flex items-center justify-center">
            <div className="absolute inset-x-0 h-px bg-outline" />
            <span className="relative px-3 bg-surface-container text-text-xs text-on-surface-variant">
              or sign in with
            </span>
          </div>

          <Button
            variant="secondary"
            fullWidth
            isLoading={googleSubmitting}
            onClick={handleGoogleSignIn}
            className="h-10"
          >
            {!googleSubmitting && (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                />
                <path
                  fill="#34A853"
                  d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"
                />
                <path
                  fill="#EA4335"
                  d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                />
              </svg>
            )}
            <span>{googleSubmitting ? 'Connecting Google...' : 'Continue with Google'}</span>
          </Button>

          {/* Household Grid Optimization Summary */}
          <div className="mt-5 pt-4 border-t border-outline flex items-center justify-between text-text-xs">
            <span className="text-on-surface-variant">Household grid · Off-peak optimizing</span>
            <span className="font-semibold text-accent-text tabular-nums">-24% peak load</span>
          </div>
        </div>
      </div>

      <footer className="relative z-10 mt-6 text-center">
        <div className="inline-flex items-center gap-1.5 text-text-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-[15px] text-accent-text">
            verified_user
          </span>
          <span>Secured connection · TLS 1.3</span>
        </div>
      </footer>

      {/* Forgot password inline modal */}
      {forgotOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setForgotOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-surface-container border border-outline p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-text-m font-semibold text-on-surface">Account recovery</h3>
              <button
                type="button"
                onClick={() => setForgotOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            {recoverySent ? (
              <div className="space-y-4">
                <p className="text-text-s font-normal text-on-surface-variant leading-relaxed">
                  Local reset instructions have been queued for{' '}
                  <span className="text-on-surface font-medium">{recoveryEmail}</span>. For synced
                  accounts, use <span className="text-accent-text">Continue with Google</span>.
                </p>
                <Button variant="primary" fullWidth onClick={() => setForgotOpen(false)}>
                  Back to sign in
                </Button>
              </div>
            ) : (
              <form onSubmit={handleRecoverySubmit} className="space-y-4">
                <p className="text-text-xs text-on-surface-variant leading-relaxed">
                  Enter your residence email to simulate a local hub password reset link.
                </p>
                <input
                  type="email"
                  required
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  placeholder="resident@oakridge.home"
                  className="w-full h-10 px-3.5 rounded-lg bg-surface border border-outline text-text-s font-normal text-on-surface focus:outline-none focus:border-accent-text"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setForgotOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Send reset
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
