import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { projectApi } from '../../api/apiClient';
import { AlertTriangle, AlertCircle, Loader2, CheckSquare } from 'lucide-react';

export default function ProjectDeleteModal({ isOpen, onClose, project, onDeleted }) {
  const { taskList, refreshProjects, showToast } = useApp();
  const [deleting, setDeleting] = useState(false);

  if (!project) return null;

  // Check whether the project has assigned tasks
  const projectTasks = taskList.filter((t) => t.projectId === project.id);
  const hasAssignedTasks = projectTasks.length > 0;

  const handleDelete = async () => {
    if (hasAssignedTasks) return;

    setDeleting(true);
    try {
      await projectApi.deleteProject(project.id);
      showToast(`Project "${project.projectName}" deleted successfully.`, 'success');
      await refreshProjects();
      if (onDeleted) onDeleted();
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to delete project.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Project"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {hasAssignedTasks ? (
          // Warning: cannot delete because tasks belong to this project
          <div className="space-y-3">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <p className="font-bold text-amber-900 mb-1">
                  Cannot Delete Project
                </p>
                <p className="text-amber-800">
                  <strong>{project.projectName}</strong> currently has{' '}
                  <span className="font-semibold underline">
                    {projectTasks.length} assigned task{projectTasks.length === 1 ? '' : 's'}
                  </span>{' '}
                  associated with it in the database. To prevent orphaned task records and maintain project integrity, you cannot delete this project until all its tasks have been deleted or reassigned.
                </p>
              </div>
            </div>

            {/* List of blocking tasks preview */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                Active Tasks in this Project:
              </p>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {projectTasks.map((t) => (
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
                Are you sure you want to permanently delete this project from the database? This action cannot be undone.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
              <p className="font-bold text-slate-900">
                {project.projectName} (ID: #{project.id})
              </p>
              {project.description && (
                <p className="text-slate-500 line-clamp-2">{project.description}</p>
              )}
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
                <span>Delete Project</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
