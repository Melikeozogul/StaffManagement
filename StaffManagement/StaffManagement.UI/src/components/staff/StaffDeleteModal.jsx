import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { staffApi } from '../../api/apiClient';
import { formatPaymentRate } from '../../utils/currency';
import { AlertTriangle, AlertCircle, Loader2, CheckSquare } from 'lucide-react';

export default function StaffDeleteModal({ isOpen, onClose, staff, onDeleted }) {
  const { taskList, refreshStaff, showToast, setCurrentPage } = useApp();
  const [deleting, setDeleting] = useState(false);

  if (!staff) return null;

  // Check if staff has assigned tasks
  const assignedTasks = taskList.filter((t) => t.appointedStaffId === staff.id);
  const hasAssignedTasks = assignedTasks.length > 0;

  const handleDelete = async () => {
    if (hasAssignedTasks) return;

    setDeleting(true);
    try {
      await staffApi.deleteStaff(staff.id);
      showToast(`Staff member ${staff.name} ${staff.surname} deleted successfully.`, 'success');
      await refreshStaff();
      if (onDeleted) onDeleted();
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to delete staff member.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Staff Member"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {hasAssignedTasks ? (
          // Warning state: Deletion blocked due to assigned tasks
          <div className="space-y-3">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <p className="font-bold text-amber-900 mb-1">
                  Cannot Delete Staff Member
                </p>
                <p className="text-amber-800">
                  <strong>{staff.name} {staff.surname}</strong> currently has{' '}
                  <span className="font-semibold underline">
                    {assignedTasks.length} assigned task{assignedTasks.length === 1 ? '' : 's'}
                  </span>{' '}
                  in the database. To prevent orphaned task records and maintain data integrity, you cannot delete this staff member until all assigned tasks have been reassigned or deleted.
                </p>
              </div>
            </div>

            {/* List of blocking tasks preview */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                Assigned Tasks Blocking Deletion:
              </p>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {assignedTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-2 bg-white rounded-lg border border-slate-100 text-xs flex items-center justify-between"
                  >
                    <span className="truncate font-medium text-slate-800">
                      {t.description}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                      #{t.id}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Close Warning
              </button>
            </div>
          </div>
        ) : (
          // Safe to delete confirmation
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-900">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-xs font-medium leading-relaxed">
                Are you sure you want to permanently delete this staff member from the database? This action cannot be undone.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
              <p className="font-bold text-slate-900">
                {staff.name} {staff.surname}
              </p>
              <p className="text-slate-500">
                {staff.role?.roleName || 'Staff Member'} · {formatPaymentRate(staff.paymentAmount ?? staff.hourlyRate ?? staff.hourlyWage, staff.currency, staff.paymentType)}
              </p>
              <p className="text-slate-500">{staff.email}</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={deleting}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete Staff Member</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
