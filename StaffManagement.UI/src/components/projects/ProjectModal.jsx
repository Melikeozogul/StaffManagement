import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { projectApi } from '../../api/apiClient';
import { Loader2 } from 'lucide-react';

export default function ProjectModal({ isOpen, onClose, projectToEdit = null, onSaved }) {
  const { refreshProjects, showToast } = useApp();

  const [formData, setFormData] = useState({
    projectName: '',
    description: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (projectToEdit) {
      setFormData({
        projectName: projectToEdit.projectName || '',
        description: projectToEdit.description || '',
      });
    } else {
      setFormData({
        projectName: '',
        description: '',
      });
    }
    setFormError('');
  }, [projectToEdit, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.projectName.trim()) {
      setFormError('Project name is required.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        projectName: formData.projectName.trim(),
        description: formData.description.trim(),
      };

      if (projectToEdit && projectToEdit.id) {
        payload.id = projectToEdit.id;
        await projectApi.updateProject(projectToEdit.id, payload);
        showToast('Project updated successfully.', 'success');
      } else {
        await projectApi.createProject(payload);
        showToast('New project created successfully.', 'success');
      }

      await refreshProjects();
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setFormError(err.message || 'Failed to save project to API.');
      showToast(err.message || 'API request failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={projectToEdit ? `Edit Project: ${projectToEdit.projectName}` : 'Create New Project'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
            {formError}
          </div>
        )}

        {/* Project Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Project Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={formData.projectName}
            onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
            placeholder="e.g. Cloud Infrastructure Migration"
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            required
          />
        </div>

        {/* Project Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Project Description
          </label>
          <textarea
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the scope, objectives, and deliverables for this project initiative..."
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
          />
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
            <span>{projectToEdit ? 'Save Changes' : 'Create Project'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
