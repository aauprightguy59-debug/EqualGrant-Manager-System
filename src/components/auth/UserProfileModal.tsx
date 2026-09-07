import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AuditLogEntry } from '../../types';
import { db } from '../../lib/db';
import {
  X,
  User,
  Shield,
  KeyRound,
  History,
  CheckCircle2,
  AlertCircle,
  Building2,
  Mail,
  Calendar,
  Lock,
} from 'lucide-react';
import { motion } from 'motion/react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile, changePassword, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'audit'>('profile');
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [org, setOrg] = useState(user?.org || '');

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Status feedback
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setOrg(user.org);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'audit') {
      db.getAuditLogs().then((allLogs) => {
        setLogs(allLogs.filter((l) => !user || l.userEmail === user.email || l.userRole === 'system').slice(0, 15));
      });
    }
  }, [activeTab, user]);

  if (!isOpen || !user) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const res = await updateProfile({ fullName, org });
    setIsSubmitting(false);

    if (res.success) {
      setMessage({ text: 'Profile updated successfully.', type: 'success' });
    } else {
      setMessage({ text: res.error || 'Failed to update profile.', type: 'error' });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmNewPassword) {
      setMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ text: 'New password must be at least 8 characters.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    const res = await changePassword(oldPassword, newPassword);
    setIsSubmitting(false);

    if (res.success) {
      setMessage({ text: 'Password successfully changed and re-hashed.', type: 'success' });
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } else {
      setMessage({ text: res.error || 'Failed to change password.', type: 'error' });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      id="profile-modal-overlay"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-[560px] rounded-[28px] border border-white/[0.08] bg-[#12121a] p-6 sm:p-8 shadow-2xl text-white"
        id="profile-modal-card"
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-full text-white/50 hover:text-white hover:bg-white/[0.08] transition"
          aria-label="Close profile"
        >
          <X className="h-4 w-4" />
        </button>

        {/* User Card Header */}
        <div className="flex items-center gap-4 mb-6 pb-5 border-b border-white/[0.08]">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl text-[20px] font-bold shadow-lg ${
              user.role === 'funder'
                ? 'bg-gradient-to-br from-violet-600 to-indigo-700 text-white'
                : 'bg-gradient-to-br from-sky-600 to-cyan-700 text-white'
            }`}
          >
            {user.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-[17px] font-semibold truncate leading-tight">{user.fullName}</h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider border ${
                  user.role === 'funder'
                    ? 'bg-violet-500/15 border-violet-400/30 text-violet-300'
                    : 'bg-sky-500/15 border-sky-400/30 text-sky-300'
                }`}
              >
                {user.role}
              </span>
            </div>
            <div className="text-[12.5px] text-white/60 truncate mt-0.5">{user.org}</div>
            <div className="text-[11.5px] text-white/40 font-mono truncate">{user.email}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/[0.08] pb-2">
          <button
            onClick={() => {
              setActiveTab('profile');
              setMessage(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] transition ${
              activeTab === 'profile'
                ? 'bg-white/10 text-white font-medium'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>Profile Details</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('security');
              setMessage(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] transition ${
              activeTab === 'security'
                ? 'bg-white/10 text-white font-medium'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Security & Password</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('audit');
              setMessage(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] transition ${
              activeTab === 'audit'
                ? 'bg-white/10 text-white font-medium'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Audit Trail</span>
          </button>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`mb-4 rounded-xl p-3 text-[12.5px] flex items-center gap-2 border ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                : 'bg-red-500/10 border-red-500/30 text-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Tab 1: Profile Details */}
        {activeTab === 'profile' && (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-white/50 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-white/40" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 py-2.5 text-[13px] text-white outline-none focus:border-violet-400/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-white/50 mb-1.5">
                Organization / Entity
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-3.5 h-4 w-4 text-white/40" />
                <input
                  type="text"
                  required
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                  className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 py-2.5 text-[13px] text-white outline-none focus:border-violet-400/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-[11.5px] text-white/50">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="text-white/40 uppercase text-[10px] tracking-wider mb-1">Account Role</div>
                <div className="font-semibold text-white capitalize">{user.role}</div>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="text-white/40 uppercase text-[10px] tracking-wider mb-1">Member Since</div>
                <div className="text-white">{new Date(user.createdAt).toLocaleDateString()}</div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-2xl bg-white py-2.5 text-[13px] font-semibold text-black hover:bg-white/90 transition"
            >
              {isSubmitting ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </form>
        )}

        {/* Tab 2: Security & Password */}
        {activeTab === 'security' && (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="rounded-xl bg-violet-500/10 border border-violet-400/20 p-3 text-[11.5px] text-violet-200/90 leading-relaxed">
              <Shield className="h-4 w-4 inline mr-1 text-violet-300" />
              Password updates are salted with a 128-bit cryptographic key and hashed with PBKDF2 SHA-256 before persisting to storage.
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-white/50 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-[13px] text-white outline-none focus:border-violet-400/50"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-white/50 mb-1.5">
                New Password (Min 8 Chars)
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new strong password"
                className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-[13px] text-white outline-none focus:border-violet-400/50"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-white/50 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-[13px] text-white outline-none focus:border-violet-400/50"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-2xl bg-white py-2.5 text-[13px] font-semibold text-black hover:bg-white/90 transition"
            >
              {isSubmitting ? 'Updating...' : 'Update & Rehash Password'}
            </button>
          </form>
        )}

        {/* Tab 3: Audit Trail */}
        {activeTab === 'audit' && (
          <div className="space-y-3">
            <div className="text-[12px] text-white/60 mb-2">
              Recent security and access events recorded in client database:
            </div>
            <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-[12px] text-white/40">
                  No security logs recorded yet.
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-[11.5px]"
                  >
                    <div className="flex items-center justify-between text-white/50">
                      <span className="font-mono text-[10.5px] text-violet-300">
                        {log.action}
                      </span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-white/80 mt-1 text-[12px]">{log.details}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
