import React from 'react';
import Modal from '../common/Modal';
import { 
  Calendar, 
  Clock, 
  ExternalLink, 
  FolderKanban, 
  User, 
  Mail, 
  Tag,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatJiraUrl, getJiraIssueKey } from '../../api/apiClient';
import { formatCurrency, formatPaymentRate, calculateStaffEarnings } from '../../utils/currency';

export default function TaskDetailModal({ isOpen, onClose, task, onEdit, onDelete }) {
  const { staffList, updateTaskStatus, workSettings } = useApp();
  if (!task) return null;

  const staff = (task.appointedStaffId ? staffList.find((s) => s.id === task.appointedStaffId) : null) || task.appointedStaff;
  const project = task.project;
  const hours = task.hoursSpent != null ? Number(task.hoursSpent) : 0;
  const earnings =
    task.taskEarnings != null
      ? Number(task.taskEarnings)
      : task.earnings != null
      ? Number(task.earnings)
      : calculateStaffEarnings(hours, staff, workSettings);
  const isCompleted = task.status === 'Completed' || task.isCompleted === true;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not set';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Task Details #${task.id}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Status Banner */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between ${
          isCompleted ? 'bg-emerald-50/80 border-emerald-200' : 'bg-amber-50/80 border-amber-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Completion Status
              </span>
              <span className={`text-base font-bold ${isCompleted ? 'text-emerald-800' : 'text-amber-800'}`}>
                {isCompleted ? 'Completed' : 'Pending'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              const nextStatus = isCompleted ? 'Pending' : 'Completed';
              await updateTaskStatus(task.id, nextStatus);
            }}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              isCompleted
                ? 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300 shadow-2xs'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600 shadow-2xs'
            }`}
          >
            {isCompleted ? 'Mark as Pending' : 'Mark as Completed'}
          </button>
        </div>

        {/* Description */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Description
          </span>
          <p className="text-slate-900 text-sm leading-relaxed whitespace-pre-wrap font-medium">
            {task.description || 'No description provided.'}
          </p>
        </div>

        {/* Jira Link */}
        {task.jiraLink && task.jiraLink.trim() ? (
          <div className="flex items-center justify-between p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl">
            <div className="flex items-center gap-2 text-blue-900 text-xs font-semibold">
              <Tag className="w-4 h-4 text-blue-600" />
              <span>Jira Issue:</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 font-mono font-bold text-xs tracking-tight border border-blue-200">
                {getJiraIssueKey(task.jiraLink)}
              </span>
            </div>
            <a
              href={formatJiraUrl(task.jiraLink)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors shadow-2xs"
            >
              <span>View in Jira</span>
              <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
            </a>
          </div>
        ) : null}

        {/* 2-Column Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Project Box */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
              <FolderKanban className="w-3.5 h-3.5 text-indigo-600" />
              Associated Project
            </span>
            <p className="text-sm font-semibold text-slate-900">
              {project?.projectName || `Project ID: ${task.projectId}`}
            </p>
            {project?.description && (
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                {project.description}
              </p>
            )}
          </div>

          {/* Appointed Staff Box */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              Appointed Staff
            </span>
            {staff ? (
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {staff.name} {staff.surname}
                  </p>
                  {staff.jiraAccountId && (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200"
                      title={`Jira Account: ${staff.jiraAccountId}`}
                    >
                      <svg className="w-2.5 h-2.5 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.53 2c0 2.4 1.97 4.35 4.35 4.35h1.78v1.7c0 2.4 1.94 4.34 4.34 4.35V2.84a.84.84 0 0 0-.84-.84zM6.77 6.8a4.36 4.36 0 0 0 4.34 4.34h1.8v1.72a4.35 4.35 0 0 0 4.35 4.35V7.63a.84.84 0 0 0-.84-.83zM2 11.6a4.35 4.35 0 0 0 4.35 4.34h1.78v1.72A4.35 4.35 0 0 0 12.48 22V12.43a.84.84 0 0 0-.84-.83z"/>
                      </svg>
                      Jira
                    </span>
                  )}
                </div>
                <p className="text-xs text-indigo-600 font-medium">
                  {staff.role?.roleName || 'Staff Member'} · {formatPaymentRate(staff.paymentAmount ?? staff.hourlyRate ?? staff.hourlyWage, staff.currency, staff.paymentType)}
                </p>
                {staff.email && (
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {staff.email}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-600">Staff ID: {task.appointedStaffId}</p>
            )}
          </div>
        </div>

        {/* Timeline & Earnings Metrics */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">
              Start Date
            </span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{formatDate(task.startDate)}</span>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">
              End Date
            </span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{formatDate(task.endDate)}</span>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">
              Hours Logged
            </span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>{hours} hrs</span>
            </div>
          </div>
        </div>

        {/* Calculated Earnings Section */}
        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Calculated Task Earnings
            </span>
            <p className="text-xs text-emerald-600 mt-0.5">
              Based on {hours} hours · Rate: {formatPaymentRate(staff?.paymentAmount ?? staff?.hourlyRate ?? staff?.hourlyWage, staff?.currency, staff?.paymentType)}
            </p>
          </div>
          <div className="text-2xl font-bold text-emerald-900 flex items-center">
            <span>{formatCurrency(earnings, staff?.currency)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <button
            onClick={() => {
              onClose();
              if (onDelete) onDelete(task);
            }}
            className="px-4 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
          >
            Delete Task
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                if (onEdit) onEdit(task);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
            >
              Edit Task
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
