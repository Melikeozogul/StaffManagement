import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { taskApi } from '../../api/apiClient';
import { formatCurrency, formatPaymentRate, calculateStaffEarnings } from '../../utils/currency';
import { Loader2, DollarSign, Clock, CheckCircle2 } from 'lucide-react';

export default function TaskModal({ isOpen, onClose, taskToEdit = null, onSaved }) {
  const { staffList, projectList, showToast, refreshTasks, fetchProjects, fetchStaff, workSettings } = useApp();

  const [formData, setFormData] = useState({
    description: '',
    jiraLink: '',
    projectId: '',
    appointedStaffId: '',
    hoursSpent: 0,
    startDate: '',
    endDate: '',
    status: 'Pending',
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch projects and staff if not loaded
  useEffect(() => {
    if (isOpen) {
      if (projectList.length === 0) fetchProjects();
      if (staffList.length === 0) fetchStaff();
    }
  }, [isOpen, projectList.length, staffList.length, fetchProjects, fetchStaff]);

  // Format date helper for input type="date"
  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  useEffect(() => {
    if (taskToEdit) {
      setFormData({
        description: taskToEdit.description || '',
        jiraLink: taskToEdit.jiraLink || '',
        projectId: taskToEdit.projectId ? String(taskToEdit.projectId) : '',
        appointedStaffId: taskToEdit.appointedStaffId ? String(taskToEdit.appointedStaffId) : '',
        hoursSpent: taskToEdit.hoursSpent != null ? Number(taskToEdit.hoursSpent) : 0,
        startDate: formatDateForInput(taskToEdit.startDate),
        endDate: formatDateForInput(taskToEdit.endDate),
        status: taskToEdit.status || (taskToEdit.isCompleted ? 'Completed' : 'Pending') || 'Pending',
      });
    } else {
      setFormData({
        description: '',
        jiraLink: '',
        projectId: projectList.length > 0 ? String(projectList[0].id) : '',
        appointedStaffId: staffList.length > 0 ? String(staffList[0].id) : '',
        hoursSpent: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        status: 'Pending',
      });
    }
    setFormError('');
  }, [taskToEdit, isOpen, projectList, staffList]);

  // Selected staff payment & calculated earnings preview
  const selectedStaff = staffList.find((s) => String(s.id) === String(formData.appointedStaffId));
  const estimatedEarnings = calculateStaffEarnings(formData.hoursSpent, selectedStaff, workSettings);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.description.trim()) {
      setFormError('Task description is required.');
      return;
    }
    if (!formData.projectId) {
      setFormError('Please select a registered project from the dropdown.');
      return;
    }
    if (!formData.appointedStaffId) {
      setFormError('Please select an assigned staff member from the dropdown.');
      return;
    }

    setSubmitting(true);

    try {
      // Send foreign key IDs only, never complete nested entities
      const payload = {
        description: formData.description.trim(),
        jiraLink: formData.jiraLink.trim(),
        projectId: parseInt(formData.projectId, 10),
        appointedStaffId: parseInt(formData.appointedStaffId, 10),
        hoursSpent: parseFloat(formData.hoursSpent) || 0,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : new Date().toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : new Date().toISOString(),
        status: formData.status || 'Pending',
      };

      if (taskToEdit && taskToEdit.id) {
        payload.id = taskToEdit.id;
        await taskApi.updateTask(taskToEdit.id, payload);
        showToast('Task updated successfully.', 'success');
      } else {
        await taskApi.createTask(payload);
        showToast('New task added successfully.', 'success');
      }

      await refreshTasks();
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setFormError(err.message || 'Failed to save task to API.');
      showToast(err.message || 'API request failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? `Edit Task #${taskToEdit.id}` : 'Create New Task'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
            {formError}
          </div>
        )}

        {/* Task Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="e.g. Implement authentication middleware and role validation..."
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            required
          />
        </div>

        {/* Jira Link */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Jira Ticket / Issue Link
          </label>
          <input
            type="text"
            value={formData.jiraLink}
            onChange={(e) => setFormData({ ...formData, jiraLink: e.target.value })}
            placeholder="e.g. https://jira.company.com/browse/PROJ-102"
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Project & Appointed Staff Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Project <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              required
            >
              <option value="" disabled>
                {projectList.length === 0 ? 'No registered projects found' : 'Select Project'}
              </option>
              {projectList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectName}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">Select from registered projects</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Assigned Staff <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.appointedStaffId}
              onChange={(e) => setFormData({ ...formData, appointedStaffId: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              required
            >
              <option value="" disabled>
                {staffList.length === 0 ? 'No registered staff found' : 'Select Staff Member'}
              </option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.surname} {s.role?.roleName ? `(${s.role.roleName})` : ''} - {formatPaymentRate(s.paymentAmount ?? s.hourlyRate ?? s.hourlyWage, s.currency, s.paymentType)}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">Select from registered staff</p>
          </div>
        </div>

        {/* Hours Spent & Estimated Earnings Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Hours Spent
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={formData.hoursSpent}
              onChange={(e) => setFormData({ ...formData, hoursSpent: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Calculated Earnings (Hours × Wage)
            </label>
            <div className="flex items-center px-3.5 py-2.5 text-sm font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl">
              <DollarSign className="w-4 h-4 mr-1 text-emerald-600" />
              <span>{formatCurrency(estimatedEarnings, selectedStaff?.currency)}</span>
              {selectedStaff && (
                <span className="text-xs font-normal text-emerald-600 ml-2">
                  ({formatPaymentRate(selectedStaff.paymentAmount ?? selectedStaff.hourlyRate ?? selectedStaff.hourlyWage, selectedStaff?.currency, selectedStaff?.paymentType)})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Start Date & End Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              End Date
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Task Status */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Task Status
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, status: 'Pending' })}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                formData.status === 'Pending'
                  ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Pending</span>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, status: 'Completed' })}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                formData.status === 'Completed'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Completed</span>
            </button>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{taskToEdit ? 'Save Changes' : 'Create Task'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
