import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, AuthSession } from '../types';
import { db } from '../lib/db';
import { hashPassword, verifyPassword, generateSalt, generateToken } from '../lib/crypto';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string, expectedRole?: UserRole, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  signup: (params: { email: string; password: string; fullName: string; org: string; organizationRole: string; applicantType: 'organization' | 'individual'; registrationStatus: 'registered' | 'not_registered'; role: UserRole }, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: { fullName?: string; org?: string }) => Promise<{ success: boolean; error?: string }>;
  changePassword: (oldPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'eq_auth_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  // Restore session on mount
  useEffect(() => {
    async function restoreSession() {
      try {
        await db.initialize();

        const storedSession = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
        if (storedSession) {
          const session: AuthSession = JSON.parse(storedSession);
          if (session.expiresAt > Date.now()) {
            const foundUser = await db.getUserById(session.userId);
            if (foundUser) {
              setUser(foundUser);
            } else {
              localStorage.removeItem(SESSION_KEY);
              sessionStorage.removeItem(SESSION_KEY);
            }
          } else {
            // Session expired
            localStorage.removeItem(SESSION_KEY);
            sessionStorage.removeItem(SESSION_KEY);
          }
        }
      } catch (err) {
        console.error('Failed to restore session:', err);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  const saveSession = (authenticatedUser: User, rememberMe: boolean) => {
    // 7 days if rememberMe, otherwise 12 hours
    const duration = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000;
    const session: AuthSession = {
      token: generateToken(),
      userId: authenticatedUser.id,
      role: authenticatedUser.role,
      expiresAt: Date.now() + duration,
      rememberMe,
    };

    if (rememberMe) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      sessionStorage.removeItem(SESSION_KEY);
    } else {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      localStorage.removeItem(SESSION_KEY);
    }

    setUser(authenticatedUser);
  };

  const login = async (
    email: string,
    pass: string,
    expectedRole?: UserRole,
    rememberMe = false
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await db.initialize();
      const trimmedEmail = email.trim().toLowerCase();
      const existingUser = await db.getUserByEmail(trimmedEmail);

      if (!existingUser) {
        const msg = 'No account found with this email address. Please register first.';
        setAuthError(msg);
        return { success: false, error: msg };
      }

      if (expectedRole && existingUser.role !== expectedRole) {
        const msg = `This account is registered as an ${existingUser.role.toUpperCase()}. Please switch to the ${existingUser.role} tab or create a new account.`;
        setAuthError(msg);
        return { success: false, error: msg };
      }

      const isValid = await verifyPassword(pass, existingUser.salt, existingUser.passwordHash);
      if (!isValid) {
        const msg = 'Incorrect password. Please verify your credentials and try again.';
        setAuthError(msg);
        return { success: false, error: msg };
      }

      // Update last login
      const updatedUser: User = {
        ...existingUser,
        lastLoginAt: new Date().toISOString(),
      };
      await db.saveUser(updatedUser);

      // Audit log
      await db.addAuditLog({
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'USER_LOGIN_SUCCESS',
        userEmail: updatedUser.email,
        userRole: updatedUser.role,
        details: `Successful login as ${updatedUser.role} (${updatedUser.org}).`,
      });

      saveSession(updatedUser, rememberMe);
      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'Authentication failed. Please try again.';
      setAuthError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (
    params: { email: string; password: string; fullName: string; org: string; organizationRole: string; applicantType: 'organization' | 'individual'; registrationStatus: 'registered' | 'not_registered'; role: UserRole },
    rememberMe = false
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await db.initialize();
      const trimmedEmail = params.email.trim().toLowerCase();

      // Check if user already exists
      const existing = await db.getUserByEmail(trimmedEmail);
      if (existing) {
        const msg = 'An account with this email already exists. Please log in.';
        setAuthError(msg);
        return { success: false, error: msg };
      }

      if (params.password.length < 8) {
        const msg = 'Password must be at least 8 characters long.';
        setAuthError(msg);
        return { success: false, error: msg };
      }

      const salt = generateSalt();
      const passwordHash = await hashPassword(params.password, salt);

      const newUser: User = {
        id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        email: trimmedEmail,
        fullName: params.fullName.trim(),
        org: params.org.trim() || 'Independent Organization',
        organizationRole: params.organizationRole.trim(),
        applicantType: params.applicantType,
        registrationStatus: params.registrationStatus,
        role: params.role,
        passwordHash,
        salt,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      await db.saveUser(newUser);

      await db.addAuditLog({
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'USER_REGISTER_SUCCESS',
        userEmail: newUser.email,
        userRole: newUser.role,
        details: `New account registered as ${newUser.role} for organization "${newUser.org}".`,
      });

      saveSession(newUser, rememberMe);
      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'Registration failed. Please try again.';
      setAuthError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    if (user) {
      await db.addAuditLog({
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'USER_LOGOUT',
        userEmail: user.email,
        userRole: user.role,
        details: 'User logged out securely.',
      });
    }
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
    setAuthError(null);
  };

  const updateProfile = async (updates: { fullName?: string; org?: string }): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };
    try {
      const updated: User = {
        ...user,
        fullName: updates.fullName !== undefined ? updates.fullName.trim() : user.fullName,
        org: updates.org !== undefined ? updates.org.trim() : user.org,
      };
      await db.saveUser(updated);
      setUser(updated);

      await db.addAuditLog({
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'PROFILE_UPDATED',
        userEmail: updated.email,
        userRole: updated.role,
        details: `Profile updated: Name="${updated.fullName}", Org="${updated.org}".`,
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update profile' };
    }
  };

  const changePassword = async (oldPass: string, newPass: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };
    try {
      const isValid = await verifyPassword(oldPass, user.salt, user.passwordHash);
      if (!isValid) {
        return { success: false, error: 'Current password does not match.' };
      }
      if (newPass.length < 8) {
        return { success: false, error: 'New password must be at least 8 characters.' };
      }

      const newSalt = generateSalt();
      const newHash = await hashPassword(newPass, newSalt);

      const updated: User = {
        ...user,
        salt: newSalt,
        passwordHash: newHash,
      };
      await db.saveUser(updated);
      setUser(updated);

      await db.addAuditLog({
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'PASSWORD_CHANGED',
        userEmail: updated.email,
        userRole: updated.role,
        details: 'User changed password securely with renewed cryptographic salt.',
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to change password' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        updateProfile,
        changePassword,
        authError,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
