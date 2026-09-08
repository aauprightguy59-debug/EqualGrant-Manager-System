import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import {
  X,
  Shield,
  Globe,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Building2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  initialRole?: UserRole;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  initialRole = 'funder',
  onSuccess,
}) => {
  const { login, signup, authError, clearAuthError, quickDemoLogin } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<UserRole>(initialRole);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [org, setOrg] = useState(
    initialRole === 'funder' ? 'Gender Equality Club Nigeria' : 'Grassroots Youth Initiative'
  );

  // Reset form when changing mode
  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    clearAuthError();
    setLocalError(null);
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    clearAuthError();
    setLocalError(null);
    if (!org || org === 'Gender Equality Club Nigeria' || org === 'Grassroots Youth Initiative') {
      setOrg(newRole === 'funder' ? 'Gender Equality Club Nigeria' : 'Grassroots Youth Initiative');
    }
  };

  // Password strength check
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const strengthScore = [hasLength, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();

    if (!email || !password) {
      setLocalError('Please fill in all required fields.');
      return;
    }

    if (mode === 'register') {
      if (!fullName) {
        setLocalError('Please enter your full name.');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match.');
        return;
      }
      if (password.length < 8) {
        setLocalError('Password must be at least 8 characters long.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        const res = await login(email, password, role, rememberMe);
        if (res.success) {
          onClose();
          if (onSuccess) onSuccess();
        }
      } else {
        const res = await signup(
          {
            email,
            password,
            fullName,
            org,
            role,
          },
          rememberMe
        );
        if (res.success) {
          onClose();
          if (onSuccess) onSuccess();
        }
      }
    } catch (err: any) {
      setLocalError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick fill helper for testing
  const handleQuickFill = (targetRole: UserRole) => {
    setRole(targetRole);
    if (targetRole === 'funder') {
      setEmail('funder@equalgrant.org');
      setPassword('Funder123!');
      setFullName('Dr. Amina Bello');
      setOrg('Gender Equality Club Nigeria');
    } else {
      setEmail('applicant@grassroots.org');
      setPassword('Awardee123!');
      setFullName('Chidi Okafor');
      setOrg('West Africa Youth & STEM Network');
    }
    setLocalError(null);
    clearAuthError();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      id="auth-modal-overlay"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-[480px] my-8 rounded-[28px] border border-white/[0.08] bg-[#12121a] p-6 sm:p-8 shadow-2xl text-white"
        id="auth-modal-card"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-full text-white/50 hover:text-white hover:bg-white/[0.08] transition"
          aria-label="Close dialog"
          id="auth-modal-close-btn"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white p-0.5 shadow-md shadow-blue-950/40 ring-2 ring-white/40">
            <img
              src={`${import.meta.env.BASE_URL}assets/equalgrant_logo.png`}
              alt="EqualGrant Manager"
              className="h-full w-full object-contain rounded-full"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="text-[15px] font-semibold tracking-tight">
              EqualGrant Manager
            </div>
            <div className="text-[11px] text-white/50">
              Secure Cryptographic Authentication • Client DB Storage
            </div>
          </div>
        </div>

        {/* Role Selector Tabs (Funder vs Awardee) */}
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-white/[0.06] p-1 border border-white/[0.06]">
          <button
            type="button"
            onClick={() => handleRoleChange('funder')}
            className={`flex items-center justify-center gap-2 rounded-full py-2 text-[12.5px] font-medium transition ${
              role === 'funder'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
            id="auth-role-funder-tab"
          >
            <Shield className="h-3.5 w-3.5 text-violet-500" />
            <span>Funder Workspace</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('awardee')}
            className={`flex items-center justify-center gap-2 rounded-full py-2 text-[12.5px] font-medium transition ${
              role === 'awardee'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
            id="auth-role-awardee-tab"
          >
            <Globe className="h-3.5 w-3.5 text-sky-500" />
            <span>Awardee Workspace</span>
          </button>
        </div>

        {/* Mode Switch (Sign In vs Register) */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-5">
          <div className="flex gap-4 text-[13px] font-medium">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`pb-1 relative cursor-pointer ${
                mode === 'login' ? 'text-white font-semibold' : 'text-white/50 hover:text-white'
              }`}
              id="auth-tab-login"
            >
              Sign In
              {mode === 'login' && (
                <span className="absolute bottom-[-13px] left-0 right-0 h-[2px] bg-white rounded-full" />
              )}
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`pb-1 relative cursor-pointer ${
                mode === 'register' ? 'text-white font-semibold' : 'text-white/50 hover:text-white'
              }`}
              id="auth-tab-register"
            >
              Create Account
              {mode === 'register' && (
                <span className="absolute bottom-[-13px] left-0 right-0 h-[2px] bg-white rounded-full" />
              )}
            </button>
          </div>

          {/* Quick Demo Pre-fill */}
          <button
            type="button"
            onClick={() => handleQuickFill(role)}
            className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/20 bg-violet-500/10 hover:bg-violet-500/20 px-2.5 py-1 text-[11px] font-medium text-violet-200 transition"
            id="auth-quick-fill-btn"
            title="Auto-fill verified demo credentials"
          >
            <Sparkles className="h-3 w-3 text-violet-300" />
            <span>Fill Demo Creds</span>
          </button>
        </div>

        {/* Error Notification */}
        <AnimatePresence>
          {(localError || authError) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-[12px] text-red-200 flex items-start gap-2.5"
              id="auth-error-banner"
            >
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">{localError || authError}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <>
              {/* Full Name */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-white/50 mb-1.5">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-white/40" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Amina Bello"
                    className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 py-2.5 text-[13px] text-white outline-none placeholder:text-white/30 focus:border-violet-400/50 focus:bg-white/[0.06] transition"
                    id="register-fullname-input"
                  />
                </div>
              </div>

              {/* Organization */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-white/50 mb-1.5">
                  Organization / Network <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-3.5 h-4 w-4 text-white/40" />
                  <input
                    type="text"
                    required
                    value={org}
                    onChange={(e) => setOrg(e.target.value)}
                    placeholder="e.g. Gender Equality Club Nigeria"
                    className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 py-2.5 text-[13px] text-white outline-none placeholder:text-white/30 focus:border-violet-400/50 focus:bg-white/[0.06] transition"
                    id="register-org-input"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-white/50 mb-1.5">
              Work Email Address <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-white/40" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.org"
                className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 py-2.5 text-[13px] text-white outline-none placeholder:text-white/30 focus:border-violet-400/50 focus:bg-white/[0.06] transition"
                id="auth-email-input"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] uppercase tracking-wider text-white/50">
                Password <span className="text-red-400">*</span>
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => alert('Demo Mode: If you forgot your password, you can use "Fill Demo Creds" above or register a new local account.')}
                  className="text-[11px] text-white/40 hover:text-white/70 transition"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-white/40" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] pl-10 pr-10 py-2.5 text-[13px] text-white outline-none placeholder:text-white/30 focus:border-violet-400/50 focus:bg-white/[0.06] transition"
                id="auth-password-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-white/40 hover:text-white/80 transition"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Password Strength Meter (Register Mode) */}
            {mode === 'register' && password && (
              <div className="mt-2 space-y-1.5">
                <div className="flex gap-1 h-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`flex-1 rounded-full transition-colors ${
                        step <= strengthScore
                          ? strengthScore === 4
                            ? 'bg-emerald-400'
                            : strengthScore >= 2
                            ? 'bg-amber-400'
                            : 'bg-red-400'
                          : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between text-[10px] text-white/50">
                  <span>
                    {strengthScore < 2
                      ? 'Weak password'
                      : strengthScore < 4
                      ? 'Good password'
                      : 'Strong password'}
                  </span>
                  <span>Min 8 chars, uppercase, number & symbol</span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password (Register Mode) */}
          {mode === 'register' && (
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-white/50 mb-1.5">
                Confirm Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-white/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 py-2.5 text-[13px] text-white outline-none placeholder:text-white/30 focus:border-violet-400/50 focus:bg-white/[0.06] transition"
                  id="register-confirm-password-input"
                />
              </div>
            </div>
          )}

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-[12px] text-white/60 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-white/20 bg-white/5 text-violet-500 focus:ring-0"
              />
              <span>Keep me signed in on this browser</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-[13.5px] font-semibold text-[#0a0a0f] hover:bg-white/90 disabled:opacity-50 transition shadow-md cursor-pointer"
            id="auth-submit-btn"
          >
            {isSubmitting ? (
              <div className="h-4 w-4 border-2 border-black border-t-transparent animate-spin rounded-full" />
            ) : (
              <>
                <span>
                  {mode === 'login'
                    ? `Sign In as ${role === 'funder' ? 'Funder' : 'Awardee'}`
                    : `Create ${role === 'funder' ? 'Funder' : 'Awardee'} Account`}
                </span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Security & GitHub Pages Notice */}
        <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-[11px] text-white/45 flex items-start gap-2">
          <Shield className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-white/70 font-medium">Zero-Leak Cryptographic Security</span>:
            Passwords are encrypted using client-side PBKDF2 SHA-256 with distinct cryptographic salt.
            100% compatible with static GitHub Pages hosting & offline databases.
          </div>
        </div>
      </motion.div>
    </div>
  );
};
