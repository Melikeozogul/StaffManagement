import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { taskApi } from '../../api/apiClient';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function DeleteConfirmModal({ isOpen, onClose, task, onDeleted }) {
  const { refreshTasks, showToast } = useApp();
  const [deleting, setDeleting] = useState(false);

  if (!task) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await taskApi.deleteTask(task.id);
      showToast(`Task #${task.id} deleted successfully.`, 'success');
      await refreshTasks();
      if (onDeleted) onDeleted();
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to delete task from API', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Task Confirmation" maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-900">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <p className="text-xs font-medium">
            Are you sure you want to permanently delete this task from the database? This action cannot be undone.
          </p>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
          <p className="font-semibold text-slate-800">Task #{task.id}:</p>
          <p className="text-slate-600 line-clamp-2">{task.description}</p>
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
            <span>Delete Permanently</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
