import React from 'react';
import { FolderKanban, Users, Clock, DollarSign, Edit3, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calculateStaffEarnings } from '../../utils/currency';

export default function ProjectCard({ project, onViewTasks, onEdit, onDelete }) {
  const { taskList, staffList, workSettings } = useApp();

  // Tasks in this project
  const projectTasks = taskList.filter((t) => t.projectId === project.id);
  const totalHours = projectTasks.reduce((sum, t) => sum + (Number(t.hoursSpent) || 0), 0);
  
  // Unique staff involved
  const staffIds = new Set(projectTasks.map((t) => t.appointedStaffId).filter(Boolean));
  const staffCount = staffIds.size;

  // Total project cost
  const totalCost = projectTasks.reduce((sum, t) => {
    if (t.taskEarnings != null) return sum + Number(t.taskEarnings);
    if (t.earnings != null) return sum + Number(t.earnings);
    const staff = (t.appointedStaffId ? staffList.find((s) => s.id === t.appointedStaffId) : null) || t.appointedStaff;
    return sum + calculateStaffEarnings(t.hoursSpent, staff, workSettings);
  }, 0);

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 p-5 shadow-subtle hover:shadow-card transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 group-hover:scale-105 transition-transform">
            <FolderKanban className="w-5 h-5" />
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
            ID #{project.id}
          </span>
        </div>

        <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
          {project.projectName}
        </h3>
        <p className="text-xs text-slate-500 mt-1 line-clamp-3 leading-relaxed">
          {project.description || 'No description provided for this project.'}
        </p>

        {/* Real-time Project Metrics */}
        <div className="grid grid-cols-3 gap-2 mt-5 py-3 border-y border-slate-100 text-center">
          <div className="p-2 rounded-xl bg-slate-50">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Tasks
            </span>
            <span className="text-xs font-bold text-slate-800 mt-0.5 block">
              {projectTasks.length}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-slate-50">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Staff
            </span>
            <span className="text-xs font-bold text-slate-800 mt-0.5 block">
              {staffCount}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-slate-50">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Hours
            </span>
            <span className="text-xs font-bold text-slate-800 mt-0.5 block">
              {totalHours}h
            </span>
          </div>
        </div>
      </div>

      {/* Footer Details Action & CRUD buttons */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
            Accrued Cost
          </span>
          <span className="text-xs font-bold text-emerald-700">
            ${totalCost.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onEdit && onEdit(project)}
            title="Edit Project"
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete && onDelete(project)}
            title="Delete Project"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewTasks(project)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline ml-1"
          >
            Tasks &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
