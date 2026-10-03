import React, { useState, useEffect, useCallback } from 'react';
import { reportApi } from '../api/apiClient';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/currency';
import StatCard from '../components/common/StatCard';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Users, 
  FolderKanban, 
  CheckSquare, 
  DollarSign, 
  ExternalLink, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  Layers,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

export default function DailyReportPage() {
  const { showToast } = useApp();

  // Selected date in YYYY-MM-DD format (default to today: 2026-10-01)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch daily report for selected date
  const fetchReport = useCallback(async (dateToFetch) => {
    setLoading(true);
    setError(null);
    try {
      const data = await reportApi.getDailyReport(dateToFetch);
      setReport(data);
    } catch (err) {
      console.error('Failed to load daily report:', err);
      setError(err.message || 'Gün sonu raporu yüklenemedi');
      showToast(err.message || 'Gün sonu raporu yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchReport(selectedDate);
  }, [selectedDate, fetchReport]);

  // Date manipulation helpers
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handlePrevDay = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() - 1);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + 1);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today.toISOString().split('T')[0]);
  };

  // Human-friendly date display (e.g. "01 October 2026")
  const formatDisplayDate = (dateString) => {
    if (!dateString) return '';
    try {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
      }
      return dateString;
    } catch {
      return dateString;
    }
  };

  const hasWorklogs = report && report.detailedWorklogs && report.detailedWorklogs.length > 0;
  const summary = report?.summary || { totalStaff: 0, totalProjects: 0, totalIssues: 0, totalHours: 0, totalEarnings: 0 };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              Jira Worklog Truth
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Real-Time Daily Calculation</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Daily End-of-Day Report
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            At the end of the day, which staff member worked on which project, for how many hours, and how much money did they earn?
          </p>
        </div>

        {/* Date Selector Widget */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevDay}
              title="Previous Day"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl transition-all shadow-2xs border border-transparent hover:border-slate-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleToday}
              className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-xl transition-colors"
            >
              Today
            </button>

            <button
              onClick={handleNextDay}
              title="Next Day"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl transition-all shadow-2xs border border-transparent hover:border-slate-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="h-6 w-[1px] bg-slate-200 hidden sm:block" />

          {/* Date Picker Input & Display */}
          <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="text-xs font-bold text-slate-800 tracking-wide font-mono">
              [ {formatDisplayDate(selectedDate)} ]
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="sr-only"
              id="report-date-picker"
            />
            <label
              htmlFor="report-date-picker"
              className="cursor-pointer text-slate-400 hover:text-indigo-600 p-0.5 rounded-md hover:bg-slate-100 transition-colors"
              title="Pick a custom date"
            >
              <Calendar className="w-3.5 h-3.5" />
            </label>
          </div>

          <button
            onClick={() => fetchReport(selectedDate)}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-2xs border border-transparent hover:border-slate-200"
            title="Refresh Report Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Warnings & Unmatched Alerts Banner */}
      {report?.warnings && report.warnings.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4.5 text-amber-900 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <span className="font-bold text-sm block text-amber-950">
                Notice & Data Warnings ({report.warnings.length})
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-amber-800">
                {report.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SUMMARY CARDS (Total Staff, Total Projects, Total Issues, Total Hours, Total Earnings) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Staff"
          value={summary.totalStaff}
          icon={Users}
          color="indigo"
          subtitle={`${summary.totalStaff} staff with worklogs`}
          loading={loading}
        />
        <StatCard
          title="Total Projects"
          value={summary.totalProjects}
          icon={FolderKanban}
          color="blue"
          subtitle={`${summary.totalProjects} active projects`}
          loading={loading}
        />
        <StatCard
          title="Total Issues"
          value={summary.totalIssues}
          icon={CheckSquare}
          color="amber"
          subtitle="Jira issues worked on"
          loading={loading}
        />
        <StatCard
          title="Total Hours"
          value={`${Number(summary.totalHours).toFixed(1)} h`}
          icon={Clock}
          color="purple"
          subtitle="Actual daily work logged"
          loading={loading}
        />
        <StatCard
          title="Total Earnings"
          value={summary.formattedTotalEarnings || formatCurrency(summary.totalEarnings, report?.detailedWorklogs?.[0]?.currency || '')}
          icon={DollarSign}
          color="emerald"
          subtitle="Calculated employee payroll"
          loading={loading}
        />
      </div>

      {/* STAFF REPORT & PROJECT REPORT SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* STAFF REPORT */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Staff Report</h3>
                <p className="text-xs text-slate-500">Total daily hours and earnings per employee</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
              {report?.staffSummary?.length || 0} Staff
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Staff</th>
                  <th className="px-5 py-3 text-right">Total Hours</th>
                  <th className="px-5 py-3 text-right">Total Earnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="3" className="px-5 py-8 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                        <span>Loading staff summary...</span>
                      </div>
                    </td>
                  </tr>
                ) : !report?.staffSummary || report.staffSummary.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-5 py-8 text-center text-slate-400 text-xs">
                      No staff worklogs recorded for {formatDisplayDate(selectedDate)}.
                    </td>
                  </tr>
                ) : (
                  report.staffSummary.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                            {item.staff.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block">{item.staff}</span>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                              <span>ID: #{item.staffId}</span>
                              {item.formattedPaymentRate && (
                                <>
                                  <span>•</span>
                                  <span className="text-indigo-600 font-semibold">{item.formattedPaymentRate}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-semibold text-slate-800">
                        {Number(item.totalHours).toFixed(1)} h
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-600">
                        {formatCurrency(item.totalEarnings, item.currency)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PROJECT REPORT */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <FolderKanban className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Project Report</h3>
                <p className="text-xs text-slate-500">Working time and cost allocation by project</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
              {report?.projectSummary?.length || 0} Projects
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Project</th>
                  <th className="px-5 py-3 text-right">Total Hours</th>
                  <th className="px-5 py-3 text-right">Total Earnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="3" className="px-5 py-8 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                        <span>Loading project summary...</span>
                      </div>
                    </td>
                  </tr>
                ) : !report?.projectSummary || report.projectSummary.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-5 py-8 text-center text-slate-400 text-xs">
                      No project hours logged for {formatDisplayDate(selectedDate)}.
                    </td>
                  </tr>
                ) : (
                  report.projectSummary.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                          <div>
                            <span className="font-semibold text-slate-900 block">{item.project}</span>
                            <span className="text-xs text-slate-400">Project ID: #{item.projectId}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-semibold text-slate-800">
                        {Number(item.totalHours).toFixed(1)} h
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(item.totalEarnings, item.currency)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* DETAILED DAILY WORKLOG SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Detailed Daily Worklog</h3>
              <p className="text-xs text-slate-500">
                Itemized Jira worklogs grouped by Staff, Project and Issue for {formatDisplayDate(selectedDate)}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded-full shrink-0">
            {report?.detailedWorklogs?.length || 0} Worklog Entries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5">Staff</th>
                <th className="px-5 py-3.5">Project</th>
                <th className="px-5 py-3.5">Issue</th>
                <th className="px-5 py-3.5">Description</th>
                <th className="px-5 py-3.5">Work Date</th>
                <th className="px-5 py-3.5 text-right">Hours</th>
                <th className="px-5 py-3.5 text-right">Rate</th>
                <th className="px-5 py-3.5 text-center">Currency</th>
                <th className="px-5 py-3.5 text-right">Earnings</th>
                <th className="px-5 py-3.5 text-center">Jira</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="10" className="px-5 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                      <span className="text-sm">Fetching Jira worklog entries...</span>
                    </div>
                  </td>
                </tr>
              ) : !hasWorklogs ? (
                <tr>
                  <td colSpan="10" className="px-5 py-12 text-center">
                    <div className="max-w-md mx-auto flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                        <Clock className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-bold text-slate-900">No Worklogs on this Day</h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
                        No team member logged work in Jira for <span className="font-semibold text-slate-700">{formatDisplayDate(selectedDate)}</span>. Only actual daily worklogs are counted.
                      </p>
                      <div className="mt-4 flex items-center gap-2">
                        <button
                          onClick={handleToday}
                          className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-xl transition-colors"
                        >
                          Check Today (01.10.2026)
                        </button>
                        <button
                          onClick={() => setSelectedDate('2026-09-29')}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                        >
                          View 29.09.2026 (77.5h)
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                report.detailedWorklogs.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    {/* Staff */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {row.staffFullName?.charAt(0) || 'U'}
                        </div>
                        <span className="font-semibold text-slate-900">{row.staffFullName}</span>
                      </div>
                    </td>

                    {/* Project */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-700 font-medium">
                      {row.projectName}
                    </td>

                    {/* Issue */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {row.issueKey}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="px-5 py-3.5 max-w-xs truncate text-slate-800" title={row.issueSummary}>
                      {row.issueSummary || '—'}
                    </td>

                    {/* Work Date */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs font-mono text-slate-600">
                      {row.formattedWorkDate || row.workDate}
                    </td>

                    {/* Hours */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-right font-mono font-semibold text-indigo-700">
                      {Number(row.totalHours).toFixed(1)} h
                    </td>

                    {/* Rate */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-right font-mono text-slate-700 text-xs font-semibold">
                      {row.formattedPaymentRate || `${formatCurrency(row.hourlyWage, row.currency)}/h`}
                    </td>

                    {/* Currency */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-center">
                      <span className="px-2 py-0.5 text-[11px] font-bold bg-slate-100 text-slate-600 rounded-md">
                        {row.currency}
                      </span>
                    </td>

                    {/* Earnings */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-right font-mono font-bold text-emerald-600">
                      {formatCurrency(row.totalEarnings, row.currency)}
                    </td>

                    {/* Jira link: View in Jira */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-center">
                      <a
                        href={row.jiraBrowseUrl || `https://melikeozogul10.atlassian.net/browse/${row.issueKey}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/70 hover:bg-indigo-100/80 rounded-lg transition-colors border border-indigo-100/80"
                        title={`Open ${row.issueKey} in Jira`}
                      >
                        <span>View in Jira</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
