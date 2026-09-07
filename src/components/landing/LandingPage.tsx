import React, { useState, useEffect } from 'react';
import { FundingWindow, UserRole } from '../../types';
import {
  LayoutDashboard,
  FileText,
  ArrowRight,
  Plus,
  Search,
  Clock,
  Layers,
  Settings2,
  Inbox,
  BarChart3,
  Shield,
  Sparkles,
} from 'lucide-react';

interface LandingPageProps {
  fundingWindows: FundingWindow[];
  currentTime: Date;
  onSelectRole: (role: UserRole) => void;
  onApplyCall: (call: FundingWindow) => void;
  onCreateCallRedirect: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  fundingWindows,
  currentTime,
  onSelectRole,
  onApplyCall,
  onCreateCallRedirect,
}) => {
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

  const openCalls = fundingWindows.filter((w) => w.status === 'open');

  return (
    <main id="home" className="relative pb-16">
      {/* Hero Section */}
      <section className="mx-auto max-w-[1280px] px-5 md:px-8 pt-14 md:pt-22 pb-16">
        <div className="mx-auto max-w-4xl text-center">
          {/* Main Title */}
          <h1 className="text-[38px] md:text-[64px] font-bold leading-[0.95] tracking-[-0.03em] text-white">
            EqualGrant Manager
            <span className="mt-3 block text-[18px] md:text-[23px] font-normal tracking-[-0.01em] text-white/60">
              AI-Powered Global Grant Management Platform
            </span>
          </h1>

          {/* Description */}
          <p className="mx-auto mt-6 max-w-[760px] text-[15px] md:text-[17px] leading-[1.65] text-white/65">
            EqualGrant Manager is an enterprise-scale, AI-powered Grant Management SaaS designed to
            help funders manage the complete grant lifecycle from creating funding opportunities and
            receiving applications to reviewing, approving, contracting, disbursing funds, monitoring
            implementation, measuring impact, and generating evidence-based reports.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
            <button
              onClick={() => onSelectRole('funder')}
              className="group inline-flex items-center gap-2.5 rounded-full bg-white px-6 py-3.5 text-[14px] font-semibold text-black hover:bg-white/90 transition shadow-lg cursor-pointer"
              id="hero-funder-cta"
            >
              <LayoutDashboard className="h-4 w-4 text-violet-600" />
              <span>Access Funder Workspace</span>
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => onSelectRole('awardee')}
              className="inline-flex items-center gap-2.5 rounded-full border border-white/[0.14] bg-white/[0.05] px-6 py-3.5 text-[14px] font-medium backdrop-blur hover:bg-white/[0.09] transition text-white cursor-pointer"
              id="hero-awardee-cta"
            >
              <FileText className="h-4 w-4 text-sky-400" />
              <span>Access Awardee Workspace</span>
            </button>
          </div>

          {/* Core Value Proposition Card */}
          <div className="mx-auto mt-14 max-w-3xl text-left">
            <div className="mb-3 text-center text-[11px] uppercase tracking-[0.18em] text-white/50">
              Core Value Proposition
            </div>
            <div className="rounded-[28px] border border-white/[0.06] bg-white/[0.03] p-8 backdrop-blur-xl md:p-10 shadow-2xl">
              <p className="text-[16px] md:text-[18px] font-semibold leading-[1.5] tracking-[-0.01em] text-white">
                EqualGrant Manager helps funders reduce the administrative cost of managing grants while
                improving transparency, speed, evidence collection and impact measurement.
              </p>
              <p className="mt-4 text-[14px] md:text-[15px] leading-[1.65] text-white/60">
                Instead of funders managing separate spreadsheets, email attachments, document
                folders, review tools, payment records and impact reports, EqualGrant Manager provides
                a single integrated platform for the entire grant lifecycle.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Open Calls Section */}
      <section id="open-calls" className="mx-auto max-w-[1280px] px-5 md:px-8 py-14">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-[22px] font-semibold tracking-tight text-white">Open Calls</h2>
            <span className="rounded-full bg-white/[0.06] px-3 py-1 text-[11px] text-white/65 border border-white/[0.06]">
              Live • {openCalls.length} active
            </span>
          </div>
          <button
            onClick={onCreateCallRedirect}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.10] bg-white/[0.04] px-3.5 py-1.5 text-[12px] font-medium text-white/80 hover:bg-white/[0.08] transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Opportunity</span>
          </button>
        </div>

        <div className="rounded-[28px] border border-white/[0.07] bg-white/[0.03] p-[1px]">
          <div className="rounded-[26px] bg-[#12121a]/80 backdrop-blur-xl">
            {openCalls.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-24 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] border border-white/[0.06]">
                  <Search className="h-5 w-5 text-white/60" />
                </div>
                <p className="text-[15px] font-medium text-white">No open calls at the moment</p>
                <p className="max-w-sm text-[13px] leading-relaxed text-white/50">
                  Funding opportunities created by funders will appear here. The system is clean and
                  ready for production testing.
                </p>
                <button
                  onClick={onCreateCallRedirect}
                  className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[12.5px] font-semibold text-black hover:bg-white/90 transition shadow-sm cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create First Call (Funder)</span>
                </button>
              </div>
            ) : (
              <div className="grid gap-px bg-white/[0.06] rounded-[26px] overflow-hidden">
                {openCalls.map((call) => (
                  <div
                    key={call.id}
                    className="bg-[#15151f] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#181824] transition"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5">
                        <div className="text-[15px] font-semibold text-white leading-tight">
                          {call.title}
                        </div>
                        <span className="rounded-full bg-violet-500/15 border border-violet-400/20 px-2 py-0.5 text-[10.5px] text-violet-200">
                          {call.category}
                        </span>
                      </div>
                      <div className="text-[12.5px] text-white/55 mt-1">
                        {call.org} • {call.eligibility}
                      </div>
                      <div className="text-[12px] text-white/70 mt-2 font-mono flex items-center gap-2">
                        <span className="font-semibold text-emerald-400">
                          {call.currency} {call.amount}
                        </span>
                        <span className="text-white/30">•</span>
                        <span className="text-white/50">{call.description}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="flex items-center gap-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 px-3 py-1.5 text-[11.5px] font-mono text-amber-200">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formatCountdown(call.deadline)}</span>
                      </div>
                      <button
                        onClick={() => onApplyCall(call)}
                        className="rounded-full bg-white px-4 py-2 text-[12.5px] font-semibold text-black hover:bg-white/90 transition shadow-sm cursor-pointer"
                      >
                        Apply Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="mx-auto max-w-[1280px] px-5 md:px-8 py-14">
        <h2 className="text-[22px] font-semibold tracking-tight text-white mb-6">How It Works</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          {[
            {
              icon: Layers,
              title: 'Create Funding Window',
              desc: 'Define opportunity, budget, currency, timeline and eligibility with AI assistance.',
              color: 'text-violet-400',
            },
            {
              icon: Settings2,
              title: 'Build Smart Forms',
              desc: 'Form builder with max words per question, live word count, and validation.',
              color: 'text-sky-400',
            },
            {
              icon: Inbox,
              title: 'Receive & Review',
              desc: 'Handle 50,000 applications per cycle, triage with AI scoring and notes.',
              color: 'text-emerald-400',
            },
            {
              icon: BarChart3,
              title: 'Disburse & Measure',
              desc: 'Contract, fund, monitor implementation and generate evidence reports.',
              color: 'text-amber-400',
            },
          ].map((step, idx) => (
            <div
              key={idx}
              className="rounded-[22px] border border-white/[0.07] bg-white/[0.03] p-6 backdrop-blur transition hover:border-white/[0.12]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.08]">
                <step.icon className={`h-5 w-5 ${step.color}`} />
              </div>
              <div className="mt-4 text-[14px] font-semibold text-white">{step.title}</div>
              <div className="mt-2 text-[12.5px] leading-relaxed text-white/55">{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-14 border-t border-white/[0.06] pt-10 pb-8">
        <div className="mx-auto max-w-[1280px] px-5 md:px-8 text-center text-[11.5px] leading-relaxed text-white/45 space-y-1">
          <p>
            Developer: JADSL ICT Unit Community Centre | Initiator: Gender Equality Club Nigeria
          </p>
          <p className="text-white/40">
            ©2026 EqualGrant Manager - Worldwide Grant Management System®
          </p>
        </div>
      </footer>
    </main>
  );
};
