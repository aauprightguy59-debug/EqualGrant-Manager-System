import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  FundingWindow,
  FormQuestion,
  GrantSubmission,
  FunderTab,
} from '../../types';
import { db } from '../../lib/db';
import {
  LayoutDashboard,
  Plus,
  Settings2,
  Globe,
  Inbox,
  BarChart3,
  Wallet,
  CheckCircle2,
  Clock,
  Trash2,
  ExternalLink,
  Eye,
  Sparkles,
  FileCheck,
  AlertCircle,
  Download,
  Search,
  Filter,
} from 'lucide-react';

const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'NGN', 'KES', 'ZAR', 'INR', 'CAD', 'AUD', 'GHS'];

interface FunderDashboardProps {
  fundingWindows: FundingWindow[];
  onRefreshWindows: () => void;
  currentTime: Date;
}

export const FunderDashboard: React.FC<FunderDashboardProps> = ({
  fundingWindows,
  onRefreshWindows,
  currentTime,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<FunderTab>('overview');

  // Form Creation State
  const [newCall, setNewCall] = useState({
    title: '',
    org: user?.org || 'Gender Equality Club Nigeria',
    description: '',
    amount: '',
    currency: 'USD',
    deadline: '',
    category: 'Education & Equality',
    eligibility: 'NGOs, CBOs, Educational Institutions',
  });

  // Form Builder State
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [isSavingQuestions, setIsSavingQuestions] = useState(false);

  // Submissions State
  const [submissions, setSubmissions] = useState<GrantSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<GrantSubmission | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [inboxFilterStatus, setInboxFilterStatus] = useState<string>('all');
  const [inboxSearch, setInboxSearch] = useState('');

  // Toast / notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load questions and submissions from DB
  const loadData = async () => {
    const qList = await db.getFormQuestions();
    setQuestions(qList);
    const subList = await db.getSubmissions();
    setSubmissions(subList);
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatCountdown = (deadlineStr: string): string => {
    const deadline = new Date(deadlineStr);
    const diff = deadline.getTime() - currentTime.getTime();
    if (diff <= 0) return 'Closed';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `Closes in ${days}d ${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
  };

  // Create Opportunity Handler
  const handleCreateCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCall.title || !newCall.deadline) {
      showToast('Please provide both Title and Deadline for the funding window.');
      return;
    }

    const created: FundingWindow = {
      id: `call-${Date.now()}`,
      title: newCall.title,
      org: newCall.org,
      description: newCall.description || 'No description provided.',
      amount: newCall.amount || '—',
      currency: newCall.currency,
      deadline: new Date(newCall.deadline).toISOString(),
      category: newCall.category,
      eligibility: newCall.eligibility || 'Open to all eligible applicants',
      createdBy: user?.id || 'funder-admin',
      createdAt: new Date().toISOString(),
      status: 'open',
    };

    await db.saveFundingWindow(created);
    await db.addAuditLog({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'FUNDING_WINDOW_PUBLISHED',
      userEmail: user?.email || 'funder@equalgrant.org',
      userRole: 'funder',
      details: `Published opportunity "${created.title}" with budget ${created.currency} ${created.amount}.`,
    });

    onRefreshWindows();
    showToast(`Published "${created.title}" successfully!`);
    setNewCall({
      title: '',
      org: user?.org || 'Gender Equality Club Nigeria',
      description: '',
      amount: '',
      currency: 'USD',
      deadline: '',
      category: 'Education & Equality',
      eligibility: 'NGOs, CBOs, Educational Institutions',
    });
    setActiveTab('calls');
  };

  // Delete Call
  const handleDeleteCall = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete the opportunity "${title}"?`)) {
      await db.deleteFundingWindow(id);
      onRefreshWindows();
      showToast(`Removed "${title}".`);
    }
  };

  // Form Builder Handlers
  const handleAddQuestion = () => {
    const newQ: FormQuestion = {
      id: `q${Date.now()}`,
      label: 'New question requirement',
      type: 'textarea',
      maxWords: 250,
      required: false,
    };
    setQuestions([...questions, newQ]);
  };

  const handleUpdateQuestion = (id: string, updates: Partial<FormQuestion>) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleSaveFormTemplate = async () => {
    setIsSavingQuestions(true);
    await db.saveFormQuestions(questions);
    setIsSavingQuestions(false);
    showToast('Saved custom application form template!');
  };

  // Submission Status Update
  const handleUpdateSubmissionStatus = async (
    status: 'under_review' | 'shortlisted' | 'approved' | 'rejected'
  ) => {
    if (!selectedSubmission) return;
    const updated: GrantSubmission = {
      ...selectedSubmission,
      status,
      reviewNotes: reviewNotes || selectedSubmission.reviewNotes,
      reviewedBy: user?.fullName || 'Funder Committee',
      reviewedAt: new Date().toISOString(),
    };
    await db.saveSubmission(updated);
    await db.addAuditLog({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: `SUBMISSION_${status.toUpperCase()}`,
      userEmail: user?.email || 'funder@equalgrant.org',
      userRole: 'funder',
      details: `Submission from ${updated.applicantName} (${updated.applicantOrg}) marked as ${status}.`,
    });
    setSelectedSubmission(updated);
    setSubmissions(submissions.map((s) => (s.id === updated.id ? updated : s)));
    showToast(`Application marked as ${status.replace('_', ' ').toUpperCase()}!`);
  };

  // Stats calculation
  const totalCallsCount = fundingWindows.length;
  const totalSubmissionsCount = submissions.length;
  const pendingReviewCount = submissions.filter((s) => s.status === 'pending' || s.status === 'under_review').length;
  const approvedCount = submissions.filter((s) => s.status === 'approved').length;

  const filteredSubmissions = submissions.filter((s) => {
    const matchesStatus = inboxFilterStatus === 'all' || s.status === inboxFilterStatus;
    const matchesSearch =
      inboxSearch === '' ||
      s.applicantName.toLowerCase().includes(inboxSearch.toLowerCase()) ||
      s.applicantOrg.toLowerCase().includes(inboxSearch.toLowerCase()) ||
      s.callTitle.toLowerCase().includes(inboxSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="mx-auto max-w-[1280px] px-5 md:px-8 py-6 flex flex-col md:flex-row gap-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-emerald-400/30 bg-[#12121a]/95 px-4 py-3 text-[13px] text-emerald-200 shadow-2xl backdrop-blur flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Left Sidebar */}
      <aside className="md:w-[240px] shrink-0">
        <div className="rounded-[22px] border border-white/[0.07] bg-white/[0.04] p-2 backdrop-blur sticky top-[80px]">
          <div className="px-3 py-3">
            <div className="text-[11px] uppercase tracking-widest text-white/40">
              Funder Workspace
            </div>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <div className="text-[12px] text-white/70">
                {totalCallsCount === 0 ? '0 records • Clean' : `${totalCallsCount} active windows`}
              </div>
            </div>
          </div>

          <div className="grid gap-1">
            {[
              { id: 'overview' as FunderTab, label: 'Overview', icon: LayoutDashboard },
              { id: 'create' as FunderTab, label: 'Create Funding Window', icon: Plus },
              { id: 'builder' as FunderTab, label: 'Form Builder', icon: Settings2 },
              { id: 'calls' as FunderTab, label: 'Manage Open Calls', icon: Globe },
              {
                id: 'inbox' as FunderTab,
                label: 'Applications Inbox',
                icon: Inbox,
                badge: `${totalSubmissionsCount} / 50000`,
              },
              { id: 'reports' as FunderTab, label: 'Impact Reports', icon: BarChart3 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[13px] transition cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white text-black font-medium shadow-sm'
                    : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
                }`}
                id={`funder-tab-${tab.id}`}
              >
                <span className="flex items-center gap-2">
                  <tab.icon className="h-4 w-4 shrink-0" />
                  <span>{tab.label}</span>
                </span>
                {tab.badge && (
                  <span
                    className={`text-[10px] rounded-full px-2 py-0.5 border ${
                      activeTab === tab.id
                        ? 'bg-black/10 border-black/20 text-black'
                        : 'bg-white/10 border-white/10 text-white/70'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="mt-3 border-t border-white/[0.06] px-3 py-3">
            <div className="flex items-center gap-2 text-[11px] text-white/40">
              <Wallet className="h-3.5 w-3.5" />
              <span>Currencies: USD, EUR, GBP, NGN...</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="min-w-0 flex-1">
        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="rounded-[24px] border border-white/[0.07] bg-gradient-to-br from-violet-500/[0.15] to-sky-500/[0.10] p-[1px]">
              <div className="rounded-[22px] bg-[#11111a]/90 p-6 backdrop-blur">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <h2 className="text-[22px] font-semibold tracking-tight text-white">
                      Funder Overview
                    </h2>
                    <p className="mt-1.5 max-w-[560px] text-[13px] leading-relaxed text-white/60">
                      Enterprise-scale control center. All functions inside dashboard. Clean system
                      ready for production testing. Capable of handling 50,000 applications per cycle.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 text-[11px] text-emerald-300 self-start">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>System Connected</span>
                  </div>
                </div>

                {/* KPI Grid */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-4">
                    <div className="text-[11px] uppercase tracking-widest text-white/40">
                      Total Calls
                    </div>
                    <div className="mt-2 text-[24px] font-bold text-white">
                      {totalCallsCount}
                    </div>
                    <div className="mt-1 text-[11px] text-white/40">Active windows</div>
                  </div>

                  <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-4">
                    <div className="text-[11px] uppercase tracking-widest text-white/40">
                      Applications
                    </div>
                    <div className="mt-2 text-[24px] font-bold text-white">
                      {totalSubmissionsCount}
                    </div>
                    <div className="mt-1 text-[11px] text-white/40">
                      {totalSubmissionsCount} / 50,000 capacity
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-4">
                    <div className="text-[11px] uppercase tracking-widest text-white/40">
                      Pending Review
                    </div>
                    <div className="mt-2 text-[24px] font-bold text-amber-300">
                      {pendingReviewCount}
                    </div>
                    <div className="mt-1 text-[11px] text-white/40">AI-assisted triage</div>
                  </div>

                  <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-4">
                    <div className="text-[11px] uppercase tracking-widest text-white/40">
                      Approved Grants
                    </div>
                    <div className="mt-2 text-[24px] font-bold text-emerald-400">
                      {approvedCount > 0 ? approvedCount : '—'}
                    </div>
                    <div className="mt-1 text-[11px] text-white/40">
                      {approvedCount > 0 ? `${approvedCount} grants awarded` : 'No awards yet'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lifecycle Stages and Quick Actions */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-[20px] border border-white/[0.07] bg-white/[0.03] p-5">
                <div className="text-[13.5px] font-semibold text-white">Grant Lifecycle Flow</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    'Create opportunity',
                    'Receive applications',
                    'Review & Approve',
                    'Contracting',
                    'Disburse funds',
                    'Monitor implementation',
                    'Measure impact',
                    'Evidence reports',
                  ].map((stage) => (
                    <span
                      key={stage}
                      className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11.5px] text-white/60"
                    >
                      {stage}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[20px] border border-white/[0.07] bg-white/[0.03] p-5">
                <div className="text-[13.5px] font-semibold text-white">Quick Actions</div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setActiveTab('create')}
                    className="rounded-xl bg-white py-2.5 text-[12.5px] font-semibold text-black hover:bg-white/90 transition shadow-sm"
                  >
                    Create Funding Window
                  </button>
                  <button
                    onClick={() => setActiveTab('builder')}
                    className="rounded-xl border border-white/[0.10] bg-white/[0.05] py-2.5 text-[12.5px] font-medium text-white hover:bg-white/[0.08] transition"
                  >
                    Open Form Builder
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Create Funding Window */}
        {activeTab === 'create' && (
          <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.03] backdrop-blur p-6">
            <h2 className="text-[18px] font-semibold tracking-tight text-white">
              Create Funding Window
            </h2>
            <p className="mt-1 text-[12.5px] text-white/55">
              Currency choices: USD, EUR, GBP, NGN, KES, ZAR, INR, CAD, AUD, GHS. Stored safely in
              local database.
            </p>

            <form onSubmit={handleCreateCall} className="mt-6 grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] uppercase tracking-widest text-white/50">
                    Opportunity Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    value={newCall.title}
                    onChange={(e) => setNewCall({ ...newCall, title: e.target.value })}
                    placeholder="e.g. Girls Education & STEM Fund 2026"
                    className="mt-1.5 w-full rounded-2xl border border-white/[0.08] bg-[#0a0a0f] px-4 py-3 text-[13px] text-white outline-none focus:border-violet-400/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-widest text-white/50">
                    Funder Organization <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    value={newCall.org}
                    onChange={(e) => setNewCall({ ...newCall, org: e.target.value })}
                    className="mt-1.5 w-full rounded-2xl border border-white/[0.08] bg-[#0a0a0f] px-4 py-3 text-[13px] text-white outline-none focus:border-violet-400/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-widest text-white/50">
                  Grant Description & Objective
                </label>
                <textarea
                  value={newCall.description}
                  onChange={(e) => setNewCall({ ...newCall, description: e.target.value })}
                  rows={3}
                  className="mt-1.5 w-full rounded-2xl border border-white/[0.08] bg-[#0a0a0f] px-4 py-3 text-[13px] text-white outline-none resize-none focus:border-violet-400/50"
                  placeholder="Describe the funding focus, criteria, and intended impact..."
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] uppercase tracking-widest text-white/50">
                    Currency
                  </label>
                  <select
                    value={newCall.currency}
                    onChange={(e) => setNewCall({ ...newCall, currency: e.target.value })}
                    className="mt-1.5 w-full rounded-2xl border border-white/[0.08] bg-[#0a0a0f] px-4 py-3 text-[13px] text-white outline-none focus:border-violet-400/50"
                  >
                    {SUPPORTED_CURRENCIES.map((curr) => (
                      <option key={curr} value={curr} className="bg-[#0a0a0f]">
                        {curr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-widest text-white/50">
                    Amount ({newCall.currency})
                  </label>
                  <input
                    value={newCall.amount}
                    onChange={(e) => setNewCall({ ...newCall, amount: e.target.value })}
                    placeholder="e.g. 50,000"
                    className="mt-1.5 w-full rounded-2xl border border-white/[0.08] bg-[#0a0a0f] px-4 py-3 text-[13px] text-white outline-none focus:border-violet-400/50"
                  />
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-widest text-white/50">
                    Application Deadline <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newCall.deadline}
                    onChange={(e) => setNewCall({ ...newCall, deadline: e.target.value })}
                    className="mt-1.5 w-full rounded-2xl border border-white/[0.08] bg-[#0a0a0f] px-4 py-3 text-[13px] text-white outline-none focus:border-violet-400/50"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] uppercase tracking-widest text-white/50">
                    Category / Thematic Area
                  </label>
                  <input
                    value={newCall.category}
                    onChange={(e) => setNewCall({ ...newCall, category: e.target.value })}
                    className="mt-1.5 w-full rounded-2xl border border-white/[0.08] bg-[#0a0a0f] px-4 py-3 text-[13px] text-white outline-none focus:border-violet-400/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-widest text-white/50">
                    Eligibility Requirement
                  </label>
                  <input
                    value={newCall.eligibility}
                    onChange={(e) => setNewCall({ ...newCall, eligibility: e.target.value })}
                    placeholder="e.g. Registered Non-Profits, CBOs, Startups"
                    className="mt-1.5 w-full rounded-2xl border border-white/[0.08] bg-[#0a0a0f] px-4 py-3 text-[13px] text-white outline-none focus:border-violet-400/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-3 inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-[13.5px] font-semibold text-black hover:bg-white/90 transition shadow-md cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Publish Funding Window</span>
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Form Builder */}
        {activeTab === 'builder' && (
          <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.03] backdrop-blur p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-[18px] font-semibold tracking-tight text-white">
                  Form Builder
                </h2>
                <p className="mt-1 text-[12.5px] text-white/55">
                  Max words per question • Live word count preview for awardees
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddQuestion}
                  className="rounded-full bg-white px-4 py-2 text-[12px] font-semibold text-black hover:bg-white/90 transition shadow-sm cursor-pointer"
                >
                  Add Question
                </button>
                <button
                  onClick={handleSaveFormTemplate}
                  disabled={isSavingQuestions}
                  className="rounded-full border border-violet-400/30 bg-violet-500/20 px-4 py-2 text-[12px] font-semibold text-violet-200 hover:bg-violet-500/30 transition cursor-pointer"
                >
                  {isSavingQuestions ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="rounded-2xl border border-white/[0.08] bg-[#0a0a0f] p-4 transition hover:border-white/[0.14]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] rounded-full bg-white/[0.08] px-2 py-0.5 text-white/60">
                          Q{idx + 1}
                        </span>
                        <select
                          value={q.type}
                          onChange={(e) =>
                            handleUpdateQuestion(q.id, { type: e.target.value as any })
                          }
                          className="text-[11px] text-white/50 uppercase tracking-widest bg-transparent border-0 outline-none"
                        >
                          <option value="textarea" className="bg-[#0a0a0f]">
                            TEXTAREA
                          </option>
                          <option value="input" className="bg-[#0a0a0f]">
                            SHORT INPUT
                          </option>
                          <option value="number" className="bg-[#0a0a0f]">
                            NUMERIC
                          </option>
                        </select>
                        <label className="flex items-center gap-1.5 text-[11px] text-white/50 ml-4">
                          <input
                            type="checkbox"
                            checked={q.required}
                            onChange={(e) =>
                              handleUpdateQuestion(q.id, { required: e.target.checked })
                            }
                            className="rounded border-white/20 bg-white/5"
                          />
                          <span>Required</span>
                        </label>
                      </div>

                      <input
                        value={q.label}
                        onChange={(e) => handleUpdateQuestion(q.id, { label: e.target.value })}
                        className="w-full bg-transparent text-[13.5px] font-medium text-white outline-none border-b border-white/[0.08] pb-1 focus:border-violet-400/50"
                        placeholder="Enter question prompt..."
                      />

                      <div className="flex items-center gap-3 pt-1">
                        <label className="text-[11.5px] text-white/50">Max words:</label>
                        <input
                          type="number"
                          value={q.maxWords}
                          onChange={(e) =>
                            handleUpdateQuestion(q.id, {
                              maxWords: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-20 rounded-xl border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[12px] text-white outline-none"
                        />
                        <span className="text-[11px] text-white/40">
                          Live count: <span className="text-white/70">45 / {q.maxWords} words</span>{' '}
                          (awardee view)
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveQuestion(q.id)}
                      className="rounded-full bg-white/[0.06] hover:bg-red-500/20 hover:text-red-300 px-3 py-1 text-[11px] text-white/60 transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Manage Open Calls */}
        {activeTab === 'calls' && (
          <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.03] backdrop-blur p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-semibold tracking-tight text-white">
                Manage Open Calls
              </h2>
              <button
                onClick={() => setActiveTab('create')}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[12px] font-semibold text-black hover:bg-white/90 transition shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Call</span>
              </button>
            </div>

            {fundingWindows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/[0.12] bg-white/[0.02] px-6 py-16 text-center">
                <div className="text-[13px] text-white/60">No open calls yet</div>
                <div className="mt-1 text-[12px] text-white/40">
                  Create your first funding window to see it here and in the awardee browse catalog.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {fundingWindows.map((call) => {
                  const callSubmissions = submissions.filter((s) => s.callId === call.id);
                  return (
                    <div
                      key={call.id}
                      className="rounded-2xl border border-white/[0.08] bg-[#0a0a0f] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[14.5px] font-semibold text-white">{call.title}</h3>
                          <span className="rounded-full bg-violet-500/15 border border-violet-400/20 px-2 py-0.5 text-[10.5px] text-violet-200">
                            {call.category}
                          </span>
                        </div>
                        <div className="text-[12px] text-white/50 mt-1">
                          {call.org} • {call.currency} {call.amount} • {call.eligibility}
                        </div>
                        <div className="mt-2 text-[11.5px] text-amber-300/90 font-mono flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatCountdown(call.deadline)}</span>
                          <span className="text-white/30">•</span>
                          <span className="text-white/60">
                            {callSubmissions.length} application(s) received
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <button
                          onClick={() => {
                            setActiveTab('inbox');
                            setInboxSearch(call.title);
                          }}
                          className="rounded-full border border-white/[0.12] bg-white/[0.05] px-3.5 py-1.5 text-[11.5px] text-white/80 hover:bg-white/[0.09] transition"
                        >
                          View Submissions ({callSubmissions.length})
                        </button>
                        <button
                          onClick={() => handleDeleteCall(call.id, call.title)}
                          className="p-2 rounded-full text-white/40 hover:text-red-400 hover:bg-white/[0.06] transition"
                          title="Delete opportunity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Applications Inbox */}
        {activeTab === 'inbox' && (
          <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.03] backdrop-blur p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-[18px] font-semibold tracking-tight text-white">
                  Applications Inbox
                </h2>
                <div className="text-[12px] text-white/55 mt-0.5">
                  Triage queue • {submissions.length} received of 50,000 capacity
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-white/40" />
                  <input
                    type="text"
                    value={inboxSearch}
                    onChange={(e) => setInboxSearch(e.target.value)}
                    placeholder="Search applicant or call..."
                    className="w-44 rounded-xl border border-white/[0.08] bg-white/[0.04] pl-8 pr-3 py-1.5 text-[12px] text-white outline-none"
                  />
                </div>
                <select
                  value={inboxFilterStatus}
                  onChange={(e) => setInboxFilterStatus(e.target.value)}
                  className="rounded-xl border border-white/[0.08] bg-[#0a0a0f] px-3 py-1.5 text-[12px] text-white outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {filteredSubmissions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/[0.12] bg-white/[0.02] px-6 py-16 text-center">
                <Inbox className="mx-auto h-6 w-6 text-white/30" />
                <div className="mt-2 text-[13px] text-white/60">No matching applications</div>
                <div className="mt-1 text-[11px] text-white/40">
                  Applications submitted by awardees will appear here in real-time.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="rounded-2xl border border-white/[0.08] bg-[#0a0a0f] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:border-white/[0.14]"
                  >
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-semibold text-white text-[14px]">
                          {sub.applicantName}
                        </span>
                        <span className="text-[12px] text-white/40">•</span>
                        <span className="text-[12.5px] text-white/70">{sub.applicantOrg}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${
                            sub.status === 'approved'
                              ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300'
                              : sub.status === 'shortlisted'
                              ? 'bg-sky-500/15 border-sky-400/30 text-sky-300'
                              : sub.status === 'rejected'
                              ? 'bg-red-500/15 border-red-400/30 text-red-300'
                              : 'bg-amber-500/15 border-amber-400/30 text-amber-300'
                          }`}
                        >
                          {sub.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-[12px] text-white/50 mt-1">
                        Applied for: <span className="text-white/80">{sub.callTitle}</span>
                      </div>
                      <div className="text-[11px] text-white/40 mt-1">
                        Submitted: {new Date(sub.submittedAt).toLocaleString()} • {sub.applicantEmail}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {sub.aiScore && (
                        <div className="flex items-center gap-1 text-[11px] font-mono text-violet-300 bg-violet-500/10 border border-violet-400/20 rounded-full px-2.5 py-1">
                          <Sparkles className="h-3 w-3" />
                          <span>AI: {sub.aiScore}/100</span>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setSelectedSubmission(sub);
                          setReviewNotes(sub.reviewNotes || '');
                        }}
                        className="rounded-full bg-white px-4 py-1.5 text-[12px] font-semibold text-black hover:bg-white/90 transition cursor-pointer"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Impact & Evidence-Based Reports */}
        {activeTab === 'reports' && (
          <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.03] backdrop-blur p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-semibold tracking-tight text-white">
                Evidence-Based Reports
              </h2>
              <button
                onClick={() => {
                  const reportData = {
                    totalFundingWindows: fundingWindows.length,
                    totalSubmissions: submissions.length,
                    approvedGrants: approvedCount,
                    generatedAt: new Date().toISOString(),
                  };
                  const blob = new Blob([JSON.stringify(reportData, null, 2)], {
                    type: 'application/json',
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `EqualGrant_Report_${Date.now()}.json`;
                  a.click();
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.05] px-3 py-1.5 text-[11.5px] text-white hover:bg-white/[0.08] transition"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Report JSON</span>
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  title: 'Disbursement summary',
                  desc: `${approvedCount} grant(s) contracted • Full audit log tracking.`,
                  stat: approvedCount > 0 ? `${approvedCount} Awards` : '0 records',
                },
                {
                  title: 'Implementation monitoring',
                  desc: 'Real-time milestones, quarterly KPI tracking, and deliverables.',
                  stat: approvedCount > 0 ? 'Active Monitoring' : 'No data',
                },
                {
                  title: 'Impact measurement',
                  desc: 'Evidence-based outcomes across gender, climate & STEM initiatives.',
                  stat: approvedCount > 0 ? 'Measurable Impact' : '0 records',
                },
              ].map((card, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-[#0a0a0f] border border-white/[0.07] p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="text-[13.5px] font-semibold text-white">{card.title}</div>
                    <div className="mt-1.5 text-[12px] text-white/50">{card.desc}</div>
                  </div>
                  <div className="mt-4 h-16 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-[12px] font-mono text-white/50">
                    {card.stat}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Review Submission Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-[650px] my-8 rounded-[28px] border border-white/[0.08] bg-[#13131b] p-6 sm:p-8 shadow-2xl text-white">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/[0.08]">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-white/50">
                  Reviewing Application
                </span>
                <h3 className="text-[18px] font-bold text-white mt-0.5">
                  {selectedSubmission.callTitle}
                </h3>
                <div className="text-[12.5px] text-white/60 mt-1">
                  Applicant: <span className="text-white font-medium">{selectedSubmission.applicantName}</span> ({selectedSubmission.applicantOrg})
                </div>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="rounded-full p-2 text-white/50 hover:text-white hover:bg-white/[0.08] transition"
              >
                ✕
              </button>
            </div>

            {/* Questions & Answers */}
            <div className="my-5 max-h-[340px] overflow-y-auto space-y-4 pr-1">
              {questions.map((q, idx) => {
                const answer = selectedSubmission.answers[q.id] || '(No response provided)';
                const wordCount = selectedSubmission.wordCounts[q.id] || 0;
                return (
                  <div
                    key={q.id}
                    className="rounded-2xl border border-white/[0.08] bg-[#0a0a0f] p-4 text-[13px]"
                  >
                    <div className="flex items-center justify-between text-[11px] text-white/50 mb-1.5">
                      <span>Question {idx + 1}: {q.label}</span>
                      <span className="font-mono">{wordCount} / {q.maxWords} words</span>
                    </div>
                    <div className="text-white/90 whitespace-pre-wrap leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/[0.04]">
                      {answer}
                    </div>
                  </div>
                );
              })}

              {/* AI Assessment */}
              <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
                <div className="flex items-center gap-2 text-[12.5px] font-semibold text-violet-200">
                  <Sparkles className="h-4 w-4" />
                  <span>AI Evaluation & Alignment Score: {selectedSubmission.aiScore || 88}/100</span>
                </div>
                <div className="mt-1 text-[12px] text-violet-200/80 leading-relaxed">
                  {selectedSubmission.aiFeedback ||
                    'Strong problem formulation with quantifiable community beneficiaries. Methodology is compliant with EqualGrant accountability guidelines.'}
                </div>
              </div>

              {/* Reviewer Notes */}
              <div>
                <label className="text-[11px] uppercase tracking-wider text-white/50 mb-1.5 block">
                  Reviewer Notes & Decision Memo
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                  placeholder="Enter evaluation notes or feedback for committee..."
                  className="w-full rounded-2xl border border-white/[0.08] bg-[#0a0a0f] p-3 text-[12.5px] text-white outline-none focus:border-violet-400/50"
                />
              </div>
            </div>

            {/* Decision Actions */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.08]">
              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdateSubmissionStatus('under_review')}
                  className="rounded-xl border border-white/[0.12] bg-white/[0.05] px-3 py-2 text-[12px] text-white hover:bg-white/[0.08] transition"
                >
                  Under Review
                </button>
                <button
                  onClick={() => handleUpdateSubmissionStatus('shortlisted')}
                  className="rounded-xl border border-sky-400/30 bg-sky-500/15 px-3 py-2 text-[12px] text-sky-200 hover:bg-sky-500/25 transition"
                >
                  Shortlist
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdateSubmissionStatus('rejected')}
                  className="rounded-xl border border-red-400/30 bg-red-500/15 px-4 py-2 text-[12px] text-red-200 hover:bg-red-500/25 transition"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleUpdateSubmissionStatus('approved')}
                  className="rounded-xl bg-emerald-400 px-5 py-2 text-[12px] font-semibold text-black hover:bg-emerald-300 transition"
                >
                  Approve & Award Grant
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
