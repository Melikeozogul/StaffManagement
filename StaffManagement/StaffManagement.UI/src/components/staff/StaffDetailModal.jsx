import React from 'react';
import Modal from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { Mail, MapPin, Clock, CheckSquare } from 'lucide-react';
import {
  formatCurrency,
  formatPaymentRate,
  calculateStaffEarnings,
  getHourlyEquivalent,
} from '../../utils/currency';

export default function StaffDetailModal({ isOpen, onClose, staff, onSelectTask }) {
  const { taskList, workSettings } = useApp();

  if (!staff) return null;

  const staffTasks = taskList.filter((t) => t.appointedStaffId === staff.id);
  const totalHours = staffTasks.reduce((sum, t) => sum + (Number(t.hoursSpent) || 0), 0);
  const totalEarnings = calculateStaffEarnings(totalHours, staff, workSettings);

  const paymentType = staff.paymentType || 'Hourly';
  const paymentAmount = staff.paymentAmount != null ? staff.paymentAmount : (staff.hourlyRate ?? staff.hourlyWage ?? 0);
  const formattedRate = formatPaymentRate(paymentAmount, staff.currency, paymentType);
  const hourlyEquivalent = getHourlyEquivalent(staff, workSettings);

  const initials = `${(staff.name || '')[0] || ''}${(staff.surname || '')[0] || ''}`.toUpperCase() || 'ST';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Staff Profile & Assignments"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-md">
            {initials}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {staff.name} {staff.surname}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-800 rounded-md">
                {staff.role?.roleName || 'Employee'}
              </span>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-md">
                {paymentType} Pay
              </span>
              {staff.jiraAccountId && (
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded-md border border-blue-200"
                  title={`Linked Jira Account ID: ${staff.jiraAccountId}`}
                >
                  <svg className="w-3.5 h-3.5 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.53 2c0 2.4 1.97 4.35 4.35 4.35h1.78v1.7c0 2.4 1.94 4.34 4.34 4.35V2.84a.84.84 0 0 0-.84-.84zM6.77 6.8a4.36 4.36 0 0 0 4.34 4.34h1.8v1.72a4.35 4.35 0 0 0 4.35 4.35V7.63a.84.84 0 0 0-.84-.83zM2 11.6a4.35 4.35 0 0 0 4.35 4.34h1.78v1.72A4.35 4.35 0 0 0 12.48 22V12.43a.84.84 0 0 0-.84-.83z"/>
                  </svg>
                  Jira Linked
                </span>
              )}
              <span className="text-xs font-mono text-slate-400">ID #{staff.id}</span>
            </div>
          </div>
        </div>

        {/* Contact Info & Rates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Email Address
            </span>
            <div className="flex items-center gap-2 text-slate-700 font-medium">
              <Mail className="w-4 h-4 text-indigo-500" />
              <span>{staff.email || 'Not provided'}</span>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Physical Address
            </span>
            <div className="flex items-center gap-2 text-slate-700 font-medium">
              <MapPin className="w-4 h-4 text-indigo-500" />
              <span>{staff.adress || 'Not listed'}</span>
            </div>
          </div>

          {staff.jiraAccountId && (
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 sm:col-span-2">
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block mb-1">
                Jira Account ID
              </span>
              <div className="flex items-center gap-2 text-blue-900 font-mono text-xs break-all">
                <span>{staff.jiraAccountId}</span>
              </div>
            </div>
          )}
        </div>

        {/* Financial & Time Metrics */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold block mb-0.5">Payment Rate</span>
            <div className="text-sm sm:text-base font-bold text-slate-900">{formattedRate}</div>
            {paymentType !== 'Hourly' && (
              <span className="text-[10px] text-slate-500 block mt-0.5">
                ≈ {formatCurrency(hourlyEquivalent, staff.currency)}/hr
              </span>
            )}
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-semibold block mb-0.5">Total Hours</span>
            <div className="text-base font-bold text-slate-900">{totalHours} hrs</div>
          </div>
          <div>
            <span className="text-[11px] text-emerald-600 font-semibold block mb-0.5">Accrued Earnings</span>
            <div className="text-base font-bold text-emerald-700">{formatCurrency(totalEarnings, staff.currency)}</div>
          </div>
        </div>

        {/* Assigned Tasks Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-indigo-600" />
              Assigned Tasks ({staffTasks.length})
            </h4>
          </div>

          {staffTasks.length === 0 ? (
            <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
              No tasks currently assigned to this staff member in the database.
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {staffTasks.map((t) => {
                const taskEarnings =
                  t.taskEarnings != null
                    ? Number(t.taskEarnings)
                    : t.earnings != null
                    ? Number(t.earnings)
                    : calculateStaffEarnings(t.hoursSpent, staff, workSettings);

                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      if (onSelectTask) {
                        onClose();
                        onSelectTask(t);
                      }
                    }}
                    className="p-3 bg-white hover:bg-indigo-50/50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {t.description}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {t.project?.projectName || `Project #${t.projectId}`} · {t.hoursSpent} hrs
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-emerald-700">
                        {formatCurrency(taskEarnings, staff.currency)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Close */}
        <div className="pt-2 flex justify-end border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
