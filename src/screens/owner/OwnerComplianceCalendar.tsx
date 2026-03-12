// src/screens/owner/OwnerComplianceCalendar.tsx
import React, { useEffect, useState } from 'react';
import { OwnerLayout } from '../../layouts/OwnerLayout';
import { authFetch } from '../../lib/api';
import { API_BASE_URL } from '../../config/environment';
import { Card, CardContent } from '../../components/ui/card';
import { ShieldCheckIcon, AlertTriangleIcon, CalendarIcon, ClockIcon, CheckCircleIcon } from 'lucide-react';
import { LoadingSpinner } from '../../components/ui/loading-spinner';

interface ComplianceEvent {
  id: string;
  type: 'post-offering-due' | 'reconfirmation-deadline' | 'aml-review' | 'quarterly-report';
  title: string;
  description: string;
  dueDate: Date;
  severity: 'critical' | 'warning' | 'info';
  projectId?: number;
  projectTitle?: string;
  completed?: boolean;
}

const QUARTER_END_DATES: { month: number; day: number; label: string }[] = [
  { month: 3, day: 31, label: 'Q1 ends Mar 31' },
  { month: 6, day: 30, label: 'Q2 ends Jun 30' },
  { month: 9, day: 30, label: 'Q3 ends Sep 30' },
  { month: 12, day: 31, label: 'Q4 ends Dec 31' },
];

const getDaysUntil = (date: Date) => {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const formatDate = (date: Date) =>
  date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

export const OwnerComplianceCalendar: React.FC = () => {
  const [events, setEvents] = useState<ComplianceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  useEffect(() => {
    buildCalendar();
  }, []);

  const buildCalendar = async () => {
    setLoading(true);
    try {
      // Fetch all active projects to derive deadlines
      const projectsData = await authFetch(`${API_BASE_URL}/owner/projects`);
      const projects: any[] = projectsData.projects || projectsData || [];

      const derived: ComplianceEvent[] = [];
      const now = new Date();
      const year = now.getFullYear();

      // 1. Quarterly post-offering report due dates (30 days after each quarter end)
      QUARTER_END_DATES.forEach(({ month, day, label }) => {
        // Check current year and next year
        [year, year + 1].forEach((y) => {
          const quarterEnd = new Date(y, month - 1, day);
          const dueDate = new Date(quarterEnd);
          dueDate.setDate(dueDate.getDate() + 30);

          if (dueDate >= now) {
            projects
              .filter((p) => p.status === 'active' || p.approvalStatus === 'approved')
              .forEach((p) => {
                const reports = p.project_data?.postOfferingReports || [];
                const reportedQuarters = reports.map((r: any) => `${r.quarter}-${r.year}`);
                const quarterLabel = `Q${[3, 6, 9, 12].indexOf(month) + 1}`;
                const quarterKey = `${quarterLabel}-${y}`;
                const alreadySubmitted = reportedQuarters.includes(quarterKey);

                if (!alreadySubmitted) {
                  derived.push({
                    id: `por-${p.id}-${quarterKey}`,
                    type: 'post-offering-due',
                    title: `Post-Offering Report Due — ${label} ${y}`,
                    description: `Issuer "${p.title || `Project #${p.id}`}" must submit ${quarterLabel} ${y} fund utilization report.`,
                    dueDate,
                    severity: getDaysUntil(dueDate) <= 7 ? 'critical' : getDaysUntil(dueDate) <= 30 ? 'warning' : 'info',
                    projectId: p.id,
                    projectTitle: p.title,
                    completed: false,
                  });
                }
              });
          }
        });
      });

      // 2. Pending reconfirmation deadlines from material change
      projects.forEach((p) => {
        if (p.project_data?.pendingReconfirmation && p.project_data?.reconfirmationDeadline) {
          const deadline = new Date(p.project_data.reconfirmationDeadline);
          if (deadline >= now) {
            derived.push({
              id: `reconf-${p.id}`,
              type: 'reconfirmation-deadline',
              title: `Reconfirmation Deadline — ${p.title || `Project #${p.id}`}`,
              description: `Investors must reconfirm or cancel their investment due to a material change.`,
              dueDate: deadline,
              severity: getDaysUntil(deadline) <= 2 ? 'critical' : 'warning',
              projectId: p.id,
              projectTitle: p.title,
              completed: false,
            });
          }
        }
      });

      // 3. Standing SEC annual compliance reminders
      const secAnnualDeadlines = [
        { month: 3, day: 31, title: 'Annual SEC Crowdfunding Report (Q4 prior year)', desc: 'Submit annual offering summary to SEC — due March 31.' },
        { month: 1, day: 31, title: 'Q4 Prior-Year Fund Utilization Deadline', desc: 'Q4 post-offering reports from all active issuers due.' },
        { month: 4, day: 30, title: 'Q1 Fund Utilization Deadline', desc: 'Q1 post-offering reports from all active issuers due.' },
        { month: 7, day: 31, title: 'Q2 Fund Utilization Deadline', desc: 'Q2 post-offering reports from all active issuers due.' },
        { month: 10, day: 31, title: 'Q3 Fund Utilization Deadline', desc: 'Q3 post-offering reports from all active issuers due.' },
      ];

      secAnnualDeadlines.forEach(({ month, day, title, desc }) => {
        [year, year + 1].forEach((y) => {
          const dueDate = new Date(y, month - 1, day);
          if (dueDate >= now) {
            derived.push({
              id: `sec-${y}-${month}-${day}`,
              type: 'quarterly-report',
              title,
              description: desc,
              dueDate,
              severity: getDaysUntil(dueDate) <= 7 ? 'critical' : getDaysUntil(dueDate) <= 30 ? 'warning' : 'info',
              completed: false,
            });
          }
        });
      });

      // Sort chronologically
      derived.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

      setEvents(derived);
    } catch (err) {
      console.error('Error building compliance calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = events.filter((e) => filterSeverity === 'all' || e.severity === filterSeverity);

  const criticalCount = events.filter((e) => e.severity === 'critical').length;
  const warningCount = events.filter((e) => e.severity === 'warning').length;

  const severityConfig = {
    critical: { color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500', icon: <AlertTriangleIcon className="w-4 h-4 text-red-500" /> },
    warning: { color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500', icon: <ClockIcon className="w-4 h-4 text-amber-500" /> },
    info: { color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-400', icon: <CalendarIcon className="w-4 h-4 text-blue-400" /> },
  };

  const typeLabels: Record<ComplianceEvent['type'], string> = {
    'post-offering-due': 'Post-Offering Report',
    'reconfirmation-deadline': 'Reconfirmation Deadline',
    'aml-review': 'AML Review',
    'quarterly-report': 'SEC Quarterly Deadline',
  };

  if (loading) {
    return (
      <OwnerLayout activePage="compliance">
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout activePage="compliance">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheckIcon className="w-6 h-6 text-[#0C4B20]" />
              Compliance Calendar
            </h1>
            <p className="text-gray-500 mt-1">SEC-required deadlines and regulatory obligations for all active campaigns</p>
          </div>
          <button
            onClick={buildCalendar}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:border-[#0C4B20] hover:text-[#0C4B20] transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-red-50 border border-red-200 shadow-none">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangleIcon className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-700">{criticalCount}</p>
                <p className="text-sm text-red-600">Critical (≤7 days)</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-amber-50 border border-amber-200 shadow-none">
            <CardContent className="p-4 flex items-center gap-3">
              <ClockIcon className="w-8 h-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold text-amber-700">{warningCount}</p>
                <p className="text-sm text-amber-600">Warning (≤30 days)</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border border-green-200 shadow-none">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircleIcon className="w-8 h-8 text-[#0C4B20]" />
              <div>
                <p className="text-2xl font-bold text-[#0C4B20]">{events.length}</p>
                <p className="text-sm text-green-700">Total Upcoming</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'critical', 'warning', 'info'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterSeverity(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                filterSeverity === s
                  ? 'bg-[#0C4B20] text-white border-[#0C4B20]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
              {s !== 'all' && <span className="ml-1 text-xs">({events.filter((e) => e.severity === s).length})</span>}
            </button>
          ))}
        </div>

        {/* Events list */}
        {filtered.length === 0 ? (
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="py-16 text-center text-gray-400">
              <CheckCircleIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No upcoming deadlines in this category</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((event) => {
              const cfg = severityConfig[event.severity];
              const daysUntil = getDaysUntil(event.dueDate);
              return (
                <Card key={event.id} className={`bg-white shadow-sm border ${daysUntil <= 0 ? 'border-red-400' : 'border-gray-100'}`}>
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className="flex-shrink-0 mt-0.5">{cfg.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{event.title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>
                          {typeLabels[event.type]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{event.description}</p>
                      {event.projectTitle && (
                        <p className="text-xs text-gray-400 mt-1">Project: {event.projectTitle}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-semibold text-gray-800">{formatDate(event.dueDate)}</p>
                      <p className={`text-xs font-bold mt-0.5 ${daysUntil <= 0 ? 'text-red-600' : daysUntil <= 7 ? 'text-red-500' : daysUntil <= 30 ? 'text-amber-600' : 'text-gray-500'}`}>
                        {daysUntil <= 0 ? 'OVERDUE' : `${daysUntil}d remaining`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </OwnerLayout>
  );
};
