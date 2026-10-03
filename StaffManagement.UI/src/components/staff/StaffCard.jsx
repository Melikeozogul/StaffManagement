import React from 'react';
import { Mail, MapPin, Edit3, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatPaymentRate, calculateStaffEarnings } from '../../utils/currency';

export default function StaffCard({ staff, onViewDetails, onEdit, onDelete }) {
  const { taskList, workSettings } = useApp();

  // Associated tasks from the real task list
  const staffTasks = taskList.filter((t) => t.appointedStaffId === staff.id);
  const totalHours = staffTasks.reduce((sum, t) => sum + (Number(t.hoursSpent) || 0), 0);
  const totalEarnings = calculateStaffEarnings(totalHours, staff, workSettings);

  const paymentType = staff.paymentType || 'Hourly';
  const paymentAmount = staff.paymentAmount != null ? staff.paymentAmount : (staff.hourlyRate ?? staff.hourlyWage ?? 0);
  const formattedRate = formatPaymentRate(paymentAmount, staff.currency, paymentType);

  // Initials for avatar
  const initials = `${(staff.name || '')[0] || ''}${(staff.surname || '')[0] || ''}`.toUpperCase() || 'ST';

  // Role gradient colors
  const roleColors = [
    'from-blue-600 to-indigo-600',
    'from-indigo-600 to-purple-600',
    'from-purple-600 to-pink-600',
    'from-emerald-600 to-teal-600',
    'from-amber-600 to-orange-600',
  ];
  const colorIndex = (staff.id || 0) % roleColors.length;
  const avatarGradient = roleColors[colorIndex];

  // Badge styles based on payment type
  const paymentBadgeStyle = (() => {
    switch (paymentType.toLowerCase()) {
      case 'daily':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'monthly':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'hourly':
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  })();

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 p-5 shadow-subtle hover:shadow-card transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between">
      <div>
        {/* Header with Avatar & Badges */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${avatarGradient} text-white font-bold flex items-center justify-center text-sm shadow-md shadow-indigo-500/10 shrink-0`}
            >
              {initials}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors text-base">
                {staff.name} {staff.surname}
              </h3>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <span className="inline-block px-2 py-0.5 text-[11px] font-semibold bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
                  {staff.role?.roleName || 'Team Member'}
                </span>
                <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded-md border ${paymentBadgeStyle}`}>
                  {paymentType}
                </span>
                {staff.jiraAccountId && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-700 rounded-md border border-blue-200"
                    title={`Linked to Jira Account: ${staff.jiraAccountId}`}
                  >
                    <svg className="w-3 h-3 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.53 2c0 2.4 1.97 4.35 4.35 4.35h1.78v1.7c0 2.4 1.94 4.34 4.34 4.35V2.84a.84.84 0 0 0-.84-.84zM6.77 6.8a4.36 4.36 0 0 0 4.34 4.34h1.8v1.72a4.35 4.35 0 0 0 4.35 4.35V7.63a.84.84 0 0 0-.84-.83zM2 11.6a4.35 4.35 0 0 0 4.35 4.34h1.78v1.72A4.35 4.35 0 0 0 12.48 22V12.43a.84.84 0 0 0-.84-.83z"/>
                    </svg>
                    Jira Linked
                  </span>
                )}
              </div>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">ID #{staff.id}</span>
        </div>

        {/* Contact & Address Information */}
        <div className="space-y-2 py-3 border-y border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-2 truncate" title={staff.email}>
            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{staff.email || 'No email provided'}</span>
          </div>
          <div className="flex items-center gap-2 truncate" title={staff.adress}>
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{staff.adress || 'Address not listed'}</span>
          </div>
        </div>

        {/* Real-time Work Metrics */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Payment Rate
            </span>
            <div className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 truncate" title={formattedRate}>
              {formattedRate}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Tasks Assigned
            </span>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              {staffTasks.length} {staffTasks.length === 1 ? 'task' : 'tasks'}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Details Action & CRUD buttons */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="text-xs font-semibold text-emerald-700">
          <span className="text-[11px] font-normal text-slate-400 block">Total Earnings</span>
          {formatCurrency(totalEarnings, staff.currency)}
        </div>
        
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onEdit && onEdit(staff)}
            title="Edit Staff Member"
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete && onDelete(staff)}
            title="Delete Staff Member"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewDetails(staff)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline ml-1"
          >
            Profile &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
