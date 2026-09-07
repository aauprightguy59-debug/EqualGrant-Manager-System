export type UserRole = 'funder' | 'awardee' | 'admin';

export interface User {
  id: string;
  email: string;
  fullName: string;
  org: string;
  role: UserRole;
  passwordHash: string;
  salt: string;
  createdAt: string;
  lastLoginAt?: string;
  avatarUrl?: string;
}

export interface AuthSession {
  token: string;
  userId: string;
  role: UserRole;
  expiresAt: number;
  rememberMe: boolean;
}

export interface FundingWindow {
  id: string;
  title: string;
  org: string;
  description: string;
  amount: string;
  currency: string;
  deadline: string; // ISO string
  category: string;
  eligibility: string;
  createdBy: string;
  createdAt: string;
  status: 'open' | 'closed' | 'draft';
}

export interface FormQuestion {
  id: string;
  label: string;
  type: 'textarea' | 'input' | 'number' | 'select';
  maxWords: number;
  required: boolean;
  options?: string[];
}

export interface GrantSubmission {
  id: string;
  callId: string;
  callTitle: string;
  applicantId: string;
  applicantName: string;
  applicantOrg: string;
  applicantEmail: string;
  answers: Record<string, string>;
  wordCounts: Record<string, number>;
  status: 'pending' | 'under_review' | 'shortlisted' | 'approved' | 'rejected';
  submittedAt: string;
  aiScore?: number;
  aiFeedback?: string;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  userEmail: string;
  userRole: UserRole | 'system';
  details: string;
}

export type FunderTab = 'overview' | 'create' | 'builder' | 'calls' | 'inbox' | 'reports';
export type AwardeeTab = 'browse' | 'apply' | 'my';
export type AppView = 'landing' | 'funder' | 'awardee' | 'login' | 'register';
export type ViewMode = 'landing' | 'funder' | 'awardee';
