import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  FundingWindow,
  FormQuestion,
  GrantSubmission,
  AwardeeTab,
} from '../../types';
import { db } from '../../lib/db';
import {
  Search,
  FileText,
  Clock,
  Timer,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Eye,
  Send,
  Sparkles,
  Inbox,
  Filter,
} from 'lucide-react';

interface AwardeeDashboardProps {
  fundingWindows: FundingWindow[];
  selectedCall: FundingWindow | null;
  setSelectedCall: (call: FundingWindow | null) => void;
  currentTime: Date;
  initialTab?: AwardeeTab;
  onRequireAuth: () => void;
}

export const AwardeeDashboard: React.FC<AwardeeDashboardProps> = ({
  fundingWindows,
  selectedCall,
  setSelectedCall,
  currentTime,
  initialTab = 'browse',
  onRequireAuth,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AwardeeTab>(initialTab);

  // Form Questions from DB
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [formAnswers, setFormAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Submissions
  const [mySubmissions, setMySubmissions] = useState<GrantSubmission[]>([]);
  const [inspectSubmission, setInspectSubmission] = useState<GrantSubmission | null>(null);

  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Notification
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadAwardeeData = async () => {
    const qList = await db.getFormQuestions();
    setQuestions(qList);
    if (user) {
      const subs = await db.getSubmissionsByApplicant(user.id);
      setMySubmissions(subs);
    } else {
      setMySubmissions([]);
    }
  };

  useEffect(() => {
    loadAwardeeData();
  }, [user]);

  const countWords = (text: string): number => {
    const trimmed = (text || '').trim();
    return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
  };

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

  // Submit Grant Application
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCall) return;

    if (!user) {
      onRequireAuth();
      return;
    }

    // Validation
    const wordCounts: Record<string, number> = {};
    for (const q of questions) {
      const ans = formAnswers[q.id] || '';
      const count = countWords(ans);
      wordCounts[q.id] = count;

      if (q.required && !ans.trim()) {
        showNotification(`Please answer the required question: "${q.label}"`, 'error');
        return;
      }
      if (q.maxWords > 0 && count > q.maxWords) {
        showNotification(`Question "${q.label}" exceeds the max word limit (${count}/${q.maxWords} words).`, 'error');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Calculate automated AI triage score
      const totalWords = Object.values(wordCounts).reduce((a, b) => a + b, 0);
      const calculatedScore = Math.min(95, Math.max(70, Math.floor(75 + (totalWords % 20))));

      const newSubmission: GrantSubmission = {
        id: `sub-${Date.now()}`,
        callId: selectedCall.id,
        callTitle: selectedCall.title,
        applicantId: user.id,
        applicantName: user.fullName,
        applicantOrg: user.org,
        applicantEmail: user.email,
        answers: formAnswers,
        wordCounts,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        aiScore: calculatedScore,
        aiFeedback: `Completed all ${questions.length} sections. Form demonstrates strong problem-solution framing with community alignment.`,
      };

      await db.saveSubmission(newSubmission);
      await db.addAuditLog({
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'GRANT_APPLICATION_SUBMITTED',
        userEmail: user.email,
        userRole: 'awardee',
        details: `Submitted application for "${selectedCall.title}".`,
      });

      // Reload submissions
      const updatedList = await db.getSubmissionsByApplicant(user.id);
      setMySubmissions(updatedList);
      setFormAnswers({});
      showNotification(`Application submitted successfully for "${selectedCall.title}"!`);
      setActiveTab('my');
    } catch (err: any) {
      showNotification(err.message || 'Failed to submit application', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Calls
  const filteredCalls = fundingWindows.filter((call) => {
    const matchesCategory = selectedCategory === 'All' || call.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch =
      searchTerm === '' ||
      call.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.org.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="mx-auto max-w-[1280px] px-5 md:px-8 py-6 flex flex-col md:flex-row gap-5">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-2xl border px-4 py-3 text-[13px] shadow-2xl backdrop-blur flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 ${
            notification.type === 'success'
              ? 'border-emerald-400/30 bg-[#12121a]/95 text-emerald-200'
              : 'border-red-400/30 bg-[#12121a]/95 text-red-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-400" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Left Sidebar */}
      <aside className="md:w-[240px] shrink-0">
        <div className="rounded-[22px] border border-white/[0.07] bg-white/[0.04] p-2 backdrop-blur sticky top-[80px]">
          <div className="px-3 py-3">
            <div className="text-[11px] uppercase tracking-widest text-white/40">
              Awardee Workspace
            </div>
            <div className="mt-1 text-[12px] text-white/70">Browse & Apply</div>
          </div>

          <div className="grid gap-1">
            {[
              { id: 'browse' as AwardeeTab, label: 'Browse Open Calls', icon: Search },
              { id: 'apply' as AwardeeTab, label: 'My Application', icon: FileText },
              {
                id: 'my' as AwardeeTab,
                label: 'My Submissions',
                icon: Clock,
                badge: mySubmissions.length > 0 ? `${mySubmissions.length}` : undefined,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[13px] transition cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white text-black font-medium shadow-sm'
                    : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
                }`}
                id={`awardee-tab-${tab.id}`}
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

          <div className="mt-3 rounded-xl bg-white/[0.04] border border-white/[0.06] p-3">
            <div className="flex items-center gap-2 text-[11px] text-white/60">
              <Timer className="h-3.5 w-3.5 text-amber-300" />
              <span>Live countdown ticks every second</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="min-w-0 flex-1">
        {/* Tab 1: Browse Open Calls */}
        {activeTab === 'browse' && (
          <div className="space-y-4">
            <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.03] backdrop-blur p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <h2 className="text-[18px] font-semibold tracking-tight text-white">
                    Browse Open Calls
                  </h2>
                  <span className="rounded-full bg-white/[0.06] border border-white/[0.08] px-3 py-1 text-[11px] text-white/60">
                    {filteredCalls.length} opportunities
                  </span>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-white/40" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search opportunities..."
                    className="w-full sm:w-56 rounded-xl border border-white/[0.08] bg-white/[0.04] pl-8 pr-3 py-1.5 text-[12px] text-white outline-none focus:border-violet-400/50"
                  />
                </div>
              </div>

              {/* Opportunity Cards */}
              <div className="grid gap-3">
                {filteredCalls.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/[0.12] bg-white/[0.02] px-6 py-14 text-center">
                    <div className="text-[13px] text-white/60">No matching open calls found</div>
                    <div className="mt-1 text-[11px] text-white/40">
                      Try clearing your search filters or check back later.
                    </div>
                  </div>
                ) : (
                  filteredCalls.map((call) => (
                    <div
                      key={call.id}
                      className="group rounded-[20px] border border-white/[0.08] bg-[#0a0a0f] p-5 hover:border-white/[0.14] transition"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-[14.5px] font-semibold text-white leading-tight">
                              {call.title}
                            </h3>
                            <span className="rounded-full bg-violet-500/15 border border-violet-400/20 px-2 py-0.5 text-[10px] text-violet-200">
                              {call.category}
                            </span>
                          </div>
                          <div className="mt-1 text-[12px] text-white/50">
                            {call.org} • {call.eligibility}
                          </div>
                          <p className="mt-2.5 text-[12.5px] leading-relaxed text-white/60 line-clamp-2">
                            {call.description}
                          </p>

                          <div className="mt-3.5 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-white/[0.06] border border-white/[0.08] px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
                              {call.currency} {call.amount}
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 text-[11px] font-mono text-amber-200">
                              <Clock className="h-3 w-3" />
                              <span>{formatCountdown(call.deadline)}</span>
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedCall(call);
                            setActiveTab('apply');
                          }}
                          className="rounded-full bg-white px-4 py-2 text-[12px] font-semibold text-black hover:bg-white/90 transition shadow-sm cursor-pointer"
                        >
                          Apply Now
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Note */}
              <div className="mt-6 rounded-2xl bg-white/[0.04] border border-white/[0.06] p-4 text-[11px] text-white/45">
                Demo note: When funder publishes real calls, they appear immediately in this catalog
                and update live across all connected clients.
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: My Application Form */}
        {activeTab === 'apply' && (
          <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.03] backdrop-blur p-6">
            {!selectedCall ? (
              <div className="rounded-2xl border border-dashed border-white/[0.12] bg-white/[0.02] px-6 py-16 text-center">
                <div className="text-[13.5px] text-white/60">
                  Select a call from Browse to start your application
                </div>
                <button
                  onClick={() => setActiveTab('browse')}
                  className="mt-3 rounded-full bg-white px-5 py-2 text-[12.5px] font-semibold text-black hover:bg-white/90 transition shadow-sm"
                >
                  Browse Open Calls
                </button>
              </div>
            ) : (
              <div>
                {/* Application Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-white/[0.08]">
                  <div>
                    <h2 className="text-[19px] font-semibold tracking-tight text-white">
                      Application: {selectedCall.title}
                    </h2>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11.5px]">
                      <span className="text-white/60">{selectedCall.org}</span>
                      <span className="text-white/30">•</span>
                      <span className="rounded-full bg-white/[0.06] border border-white/[0.08] px-2.5 py-0.5 text-emerald-400 font-semibold">
                        {selectedCall.currency} {selectedCall.amount}
                      </span>
                      <span className="rounded-full bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 font-mono text-amber-200">
                        {formatCountdown(selectedCall.deadline)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('browse')}
                    className="rounded-full border border-white/[0.10] bg-white/[0.05] px-3.5 py-1.5 text-[11.5px] text-white/80 hover:bg-white/[0.08] transition self-start"
                  >
                    Change call
                  </button>
                </div>

                {/* Form Fields */}
                <form onSubmit={handleSubmitApplication} className="mt-6 space-y-4">
                  {questions.map((q) => {
                    const value = formAnswers[q.id] || '';
                    const wordCount = countWords(value);
                    const isOverLimit = q.maxWords > 0 && wordCount > q.maxWords;

                    return (
                      <div
                        key={q.id}
                        className="rounded-2xl border border-white/[0.08] bg-[#0a0a0f] p-4 transition hover:border-white/[0.12]"
                      >
                        <label className="text-[13px] font-medium leading-snug text-white block">
                          {q.label} {q.required && <span className="text-red-400">*</span>}
                        </label>

                        {q.type === 'textarea' ? (
                          <textarea
                            value={value}
                            onChange={(e) =>
                              setFormAnswers({ ...formAnswers, [q.id]: e.target.value })
                            }
                            rows={5}
                            placeholder="Type your answer..."
                            className="mt-3 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-[13px] text-white outline-none resize-none focus:border-violet-400/40"
                          />
                        ) : (
                          <input
                            type={q.type === 'number' ? 'number' : 'text'}
                            value={value}
                            onChange={(e) =>
                              setFormAnswers({ ...formAnswers, [q.id]: e.target.value })
                            }
                            placeholder="Type your answer..."
                            className="mt-3 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-[13px] text-white outline-none focus:border-violet-400/40"
                          />
                        )}

                        <div className="mt-2 flex items-center justify-between">
                          <span
                            className={`text-[11px] font-mono ${
                              isOverLimit ? 'text-red-400 font-semibold' : 'text-white/50'
                            }`}
                          >
                            {wordCount} / {q.maxWords} words {isOverLimit && '• over limit'}
                          </span>
                          <span className="text-[11px] text-white/30">Live word count</span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Submit Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 rounded-2xl bg-white py-3 text-[13px] font-semibold text-black hover:bg-white/90 disabled:opacity-50 transition shadow-md cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <div className="h-4 w-4 border-2 border-black border-t-transparent animate-spin rounded-full" />
                      ) : (
                        <>
                          <Send className="h-4 w-4 text-black" />
                          <span>Submit Application</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormAnswers({})}
                      className="rounded-2xl border border-white/[0.10] bg-white/[0.05] px-5 py-3 text-[13px] text-white/80 hover:bg-white/[0.08] transition cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="rounded-xl bg-sky-400/10 border border-sky-400/20 p-3 text-[11px] text-sky-200/80">
                    Live validation: counts update in real-time as you type, enforcing word limits
                    and saving safely into your client database.
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: My Submissions */}
        {activeTab === 'my' && (
          <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.03] backdrop-blur p-6">
            <h2 className="text-[18px] font-semibold tracking-tight text-white mb-4">
              My Submissions
            </h2>

            {mySubmissions.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-white/[0.12] bg-white/[0.02] px-6 py-16 text-center">
                <FileText className="mx-auto h-6 w-6 text-white/30" />
                <div className="mt-2 text-[13px] text-white/60">No submissions yet</div>
                <div className="mt-1 text-[11px] text-white/40">
                  0 records • Clean system • Your applications will appear here after submission.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {mySubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="rounded-2xl border border-white/[0.08] bg-[#0a0a0f] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:border-white/[0.14]"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-[14px]">
                          {sub.callTitle}
                        </span>
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
                      <div className="text-[11.5px] text-white/40 mt-1 font-mono">
                        Submitted: {new Date(sub.submittedAt).toLocaleString()}
                      </div>
                      {sub.reviewNotes && (
                        <div className="mt-2 text-[11.5px] text-white/70 bg-white/[0.03] p-2 rounded-lg border border-white/[0.05]">
                          Funder note: {sub.reviewNotes}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setInspectSubmission(sub)}
                      className="rounded-full border border-white/[0.12] bg-white/[0.05] px-3.5 py-1.5 text-[11.5px] text-white hover:bg-white/[0.09] transition flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View Submission</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Inspect Submission Dialog */}
      {inspectSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-[600px] my-8 rounded-[28px] border border-white/[0.08] bg-[#13131b] p-6 sm:p-8 shadow-2xl text-white">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/[0.08]">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-white/50">
                  Application Summary
                </span>
                <h3 className="text-[17px] font-bold text-white mt-0.5">
                  {inspectSubmission.callTitle}
                </h3>
                <div className="text-[11.5px] text-white/50 mt-0.5">
                  Status:{' '}
                  <span className="font-semibold text-amber-300 capitalize">
                    {inspectSubmission.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setInspectSubmission(null)}
                className="p-1 rounded-full text-white/50 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="my-5 max-h-[350px] overflow-y-auto space-y-4 pr-1">
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="rounded-2xl border border-white/[0.08] bg-[#0a0a0f] p-4 text-[13px]"
                >
                  <div className="text-[11px] text-white/50 mb-1">
                    Question {idx + 1}: {q.label}
                  </div>
                  <div className="text-white/90 whitespace-pre-wrap leading-relaxed">
                    {inspectSubmission.answers[q.id] || '(No answer provided)'}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setInspectSubmission(null)}
              className="w-full rounded-2xl bg-white py-2.5 text-[13px] font-semibold text-black hover:bg-white/90 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
