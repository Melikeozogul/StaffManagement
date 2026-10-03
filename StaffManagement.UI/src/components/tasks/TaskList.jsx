import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  ExternalLink, 
  Clock, 
  Edit3, 
  Trash2, 
  Eye, 
  Calendar,
  Tag,
  FolderKanban,
  AlertCircle,
  CheckSquare,
  DollarSign,
  Check,
  CheckCircle2
} from 'lucide-react';
import EmptyState from '../common/EmptyState';
import { useApp } from '../../context/AppContext';
import { formatJiraUrl, getJiraIssueKey } from '../../api/apiClient';
import { formatCurrency, formatPaymentRate, calculateStaffEarnings } from '../../utils/currency';

export default function TaskList({ 
  onNewTask, 
  onEditTask, 
  onDeleteTask, 
  onSelectTask, 
  initialProjectId = 'all' 
}) {
  const { taskList, staffList, projectList, refreshTasks, updateTaskStatus, workSettings } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId);
  const [selectedStaffId, setSelectedStaffId] = useState('all');

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Step 1: Collect unique projects based strictly on projectId / project relationship
  // Uses EF Core's relational structure. Guaranteed no duplicate project sections for the same projectId.
  const projectsMap = new Map();

  // Populate from projectList (GET /api/Project)
  (projectList || []).forEach((proj) => {
    if (proj && proj.id != null) {
      projectsMap.set(Number(proj.id), {
        id: Number(proj.id),
        projectName: proj.projectName,
        description: proj.description,
      });
    }
  });

  // Also include any project present in taskList so no task is ever orphaned
  (taskList || []).forEach((task) => {
    if (task && task.projectId != null) {
      const pid = Number(task.projectId);
      if (!projectsMap.has(pid)) {
        projectsMap.set(pid, {
          id: pid,
          projectName: task.project?.projectName || `Project #${pid}`,
          description: task.project?.description || '',
        });
      }
    }
  });

  const allProjects = Array.from(projectsMap.values());

  // Step 2: Group tasks by projectId (relational foreign key, NO manual name matching)
  const tasksByProjectId = new Map();
  allProjects.forEach((p) => {
    tasksByProjectId.set(p.id, []);
  });

  (taskList || []).forEach((task) => {
    if (task && task.projectId != null) {
      const pid = Number(task.projectId);
      if (!tasksByProjectId.has(pid)) {
        tasksByProjectId.set(pid, []);
      }
      tasksByProjectId.get(pid).push(task);
    }
  });

  // Step 3: Filter logic for tasks
  const isTaskMatchingFilters = (task, projectName = '') => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      (task.description || '').toLowerCase().includes(term) ||
      (task.jiraLink || '').toLowerCase().includes(term) ||
      (task.status || '').toLowerCase().includes(term) ||
      (task.appointedStaff?.name || '').toLowerCase().includes(term) ||
      (task.appointedStaff?.surname || '').toLowerCase().includes(term) ||
      (projectName || '').toLowerCase().includes(term) ||
      (task.project?.projectName || '').toLowerCase().includes(term);

    const matchesProject =
      selectedProjectId === 'all' || String(task.projectId) === String(selectedProjectId);

    const matchesStaff =
      selectedStaffId === 'all' || String(task.appointedStaffId) === String(selectedStaffId);

    return matchesSearch && matchesProject && matchesStaff;
  };

  // Toggle task completion between Completed and Pending
  const handleToggleTaskStatus = async (task) => {
    const isCompleted = task.status === 'Completed' || task.isCompleted === true;
    const nextStatus = isCompleted ? 'Pending' : 'Completed';
    try {
      await updateTaskStatus(task.id, nextStatus);
    } catch {
      // Toast notification is handled in context
    }
  };

  // Step 4: Determine which projects to display
  // If a specific project is selected in the dropdown, show only that project.
  // If search or staff filters are active, show projects that have matching tasks or matching project name.
  // If no filters are active, show all projects (projects without tasks display "No tasks").
  const displayedProjects = allProjects.filter((project) => {
    if (selectedProjectId !== 'all' && String(project.id) !== String(selectedProjectId)) {
      return false;
    }

    const term = searchTerm.toLowerCase().trim();
    const hasSearchOrStaffFilter = term !== '' || selectedStaffId !== 'all';

    if (!hasSearchOrStaffFilter) {
      return true;
    }

    const allProjectTasks = tasksByProjectId.get(project.id) || [];
    const hasMatchingTasks = allProjectTasks.some((t) => isTaskMatchingFilters(t, project.projectName));
    const projectMatchesSearch = term && (project.projectName || '').toLowerCase().includes(term);

    if (selectedStaffId !== 'all' && !term) {
      return hasMatchingTasks;
    }

    return hasMatchingTasks || projectMatchesSearch;
  });

  // Overall counts for summary
  const totalFilteredTasks = displayedProjects.reduce((acc, project) => {
    const tasks = (tasksByProjectId.get(project.id) || []).filter((t) => isTaskMatchingFilters(t, project.projectName));
    return acc + tasks.length;
  }, 0);

  const totalFilteredHours = displayedProjects.reduce((acc, project) => {
    const tasks = (tasksByProjectId.get(project.id) || []).filter((t) => isTaskMatchingFilters(t, project.projectName));
    return acc + tasks.reduce((sum, t) => sum + (Number(t.hoursSpent) || 0), 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks, descriptions, Jira tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Project Filter */}
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Projects</option>
            {allProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectName}
              </option>
            ))}
          </select>

          {/* Staff Filter */}
          <select
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Staff</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.surname}
              </option>
            ))}
          </select>

          {/* New Task Button */}
          <button
            onClick={onNewTask}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {allProjects.length === 0 && taskList.length === 0 ? (
        <EmptyState
          title="No tasks found in API"
          description="There are currently no tasks recorded in the ASP.NET Core database. Click below to create your first task."
          actionLabel="Create First Task"
          onAction={onNewTask}
          secondaryActionLabel="Refresh"
          onSecondaryAction={refreshTasks}
        />
      ) : displayedProjects.length === 0 ? (
        <EmptyState
          title="No matching tasks"
          description="Try adjusting your search criteria or filters to locate tasks."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchTerm('');
            setSelectedProjectId('all');
            setSelectedStaffId('all');
          }}
        />
      ) : (
        <div className="space-y-6">
          {displayedProjects.map((project) => {
            const rawTasks = tasksByProjectId.get(project.id) || [];
            const projectTasks = rawTasks.filter((t) => isTaskMatchingFilters(t, project.projectName));
            
            const totalProjectHours = projectTasks.reduce((sum, t) => sum + (Number(t.hoursSpent) || 0), 0);
            const totalProjectEarnings = projectTasks.reduce((sum, t) => {
              if (t.taskEarnings != null) return sum + Number(t.taskEarnings);
              if (t.earnings != null) return sum + Number(t.earnings);
              const st = (t.appointedStaffId ? staffList.find((s) => s.id === t.appointedStaffId) : null) || t.appointedStaff;
              return sum + calculateStaffEarnings(t.hoursSpent, st, workSettings);
            }, 0);
            const currency = projectTasks[0]?.taskCurrency || projectTasks[0]?.appointedStaff?.currency;

            return (
              <div
                key={project.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden"
              >
                {/* Project Header (Visually Distinct) */}
                <div className="px-5 py-4 bg-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                      <FolderKanban className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-md">
                          PROJECT
                        </span>
                        <span className="text-xs text-slate-400 font-mono">ID: #{project.id}</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                        PROJECT: {project.projectName}
                      </h3>
                      {project.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{project.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Project Summary Pills */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{projectTasks.length} {projectTasks.length === 1 ? 'task' : 'tasks'}</span>
                    </span>
                    {projectTasks.length > 0 && (
                      <>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-2xs border ${
                          projectTasks.filter(t => t.status === 'Completed' || t.isCompleted === true).length === projectTasks.length
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>
                            {projectTasks.filter(t => t.status === 'Completed' || t.isCompleted === true).length}/{projectTasks.length} Completed
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700 shadow-2xs">
                          <Clock className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{totalProjectHours.toFixed(1)} hrs</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-2xs">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{formatCurrency(totalProjectEarnings, currency)}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Tasks List Under Project */}
                {projectTasks.length === 0 ? (
                  <div className="relative pl-8 sm:pl-12 pr-4 sm:pr-6 py-6 bg-slate-50/30">
                    {/* Tree branch for empty state */}
                    <div className="absolute left-4 sm:left-7 top-0 h-6 w-0.5 bg-slate-200" />
                    <div className="absolute left-4 sm:left-7 top-6 w-3 sm:w-4 h-0.5 bg-slate-200" />
                    <div className="absolute left-[13px] sm:left-[25px] top-5 w-2 h-2 rounded-full bg-slate-300" />

                    <div className="flex items-center gap-2 text-slate-400 text-sm font-medium italic">
                      <AlertCircle className="w-4 h-4 text-slate-300 shrink-0" />
                      <span>No tasks</span>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {projectTasks.map((task, idx) => {
                      const isLast = idx === projectTasks.length - 1;
                      const staff = (task.appointedStaffId ? staffList.find((s) => s.id === task.appointedStaffId) : null) || task.appointedStaff;
                      const hours = Number(task.hoursSpent) || 0;
                      const earnings =
                        task.taskEarnings != null
                          ? Number(task.taskEarnings)
                          : task.earnings != null
                          ? Number(task.earnings)
                          : calculateStaffEarnings(hours, staff, workSettings);
                      const jiraKey = getJiraIssueKey(task.jiraLink);
                      const hasJira = Boolean(task.jiraLink && task.jiraLink.trim());
                      const isCompleted = task.status === 'Completed' || task.isCompleted === true;

                      return (
                        <div
                          key={task.id}
                          className={`relative pl-8 sm:pl-12 pr-4 sm:pr-6 py-4 transition-colors group cursor-pointer ${
                            isCompleted ? 'bg-slate-50/40 hover:bg-slate-50/80' : 'hover:bg-indigo-50/30'
                          }`}
                          onClick={() => onSelectTask(task)}
                        >
                          {/* Tree Guide Lines: vertical stem and horizontal branch */}
                          <div
                            className={`absolute left-4 sm:left-7 top-0 w-0.5 bg-slate-200 ${
                              isLast ? 'h-6' : 'bottom-0'
                            }`}
                          />
                          <div className="absolute left-4 sm:left-7 top-6 w-3 sm:w-4 h-0.5 bg-slate-200" />
                          <div
                            className={`absolute left-[13px] sm:left-[25px] top-5 w-2 h-2 rounded-full transition-transform border border-white ${
                              isCompleted
                                ? 'bg-emerald-500 ring-2 ring-emerald-100'
                                : 'bg-indigo-500 ring-2 ring-indigo-100 group-hover:scale-125'
                            }`}
                          />

                          {/* Task Content Box */}
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                            {/* Left: Checkbox Toggle + Task Title & Metadata */}
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              {/* Quick Completion Checkbox */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleTaskStatus(task);
                                }}
                                title={isCompleted ? 'Mark as Pending' : 'Mark as Completed'}
                                className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all shrink-0 border cursor-pointer ${
                                  isCompleted
                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs hover:bg-emerald-700 active:scale-95'
                                    : 'bg-white border-slate-300 text-transparent hover:border-emerald-500 hover:bg-emerald-50/40 active:scale-95'
                                }`}
                                aria-label={isCompleted ? 'Mark as Pending' : 'Mark as Completed'}
                              >
                                <Check className={`w-3.5 h-3.5 stroke-[2.5] transition-opacity ${isCompleted ? 'opacity-100' : 'opacity-0'}`} />
                              </button>

                              <div className="space-y-2 flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className={`text-sm sm:text-base font-semibold transition-colors ${
                                    isCompleted
                                      ? 'text-slate-600 line-through decoration-slate-400'
                                      : 'text-slate-900 group-hover:text-indigo-600'
                                  }`}>
                                    {task.description}
                                  </h4>

                                  {/* Clear Status Badge */}
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                      isCompleted
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}
                                  >
                                    {isCompleted ? (
                                      <>
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        <span>Completed</span>
                                      </>
                                    ) : (
                                      <>
                                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                        <span>Pending</span>
                                      </>
                                    )}
                                  </span>

                                  {hasJira && jiraKey ? (
                                    <a
                                      href={formatJiraUrl(task.jiraLink)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      title={`Open ${jiraKey} in Jira`}
                                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-mono font-bold text-xs tracking-tight transition-colors"
                                    >
                                      <Tag className="w-3 h-3 text-blue-500 shrink-0" />
                                      <span>{jiraKey}</span>
                                      <ExternalLink className="w-3 h-3 text-blue-400 ml-0.5" />
                                    </a>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-400">
                                      Manual
                                    </span>
                                  )}
                                </div>

                              {/* Task Details Row: Assigned Staff, Hourly Rate, Start Date */}
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
                                {/* Assigned Staff */}
                                <div className="flex items-center gap-1.5">
                                  <span className="font-medium text-slate-400">Assigned Staff:</span>
                                  {staff ? (
                                    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] inline-flex items-center justify-center shrink-0">
                                        {(staff.name || '')[0] || 'S'}
                                      </span>
                                      <span>
                                        {staff.name} {staff.surname}
                                      </span>
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
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 italic">
                                      {task.appointedStaffId ? `Staff #${task.appointedStaffId}` : 'Unassigned'}
                                    </span>
                                  )}
                                </div>

                                <span className="hidden sm:inline text-slate-300">•</span>

                                {/* Rate */}
                                <div className="flex items-center gap-1.5">
                                  <span className="font-medium text-slate-400">Rate:</span>
                                  <span className="font-semibold text-slate-800">
                                    {staff
                                      ? formatPaymentRate(
                                          staff.paymentAmount ?? staff.hourlyRate ?? staff.hourlyWage,
                                          staff.currency,
                                          staff.paymentType
                                        )
                                      : '-'}
                                  </span>
                                </div>

                                <span className="hidden sm:inline text-slate-300">•</span>

                                {/* Start Date */}
                                <div className="flex items-center gap-1.5">
                                  <span className="font-medium text-slate-400">Start Date:</span>
                                  <span className="font-semibold text-slate-800 inline-flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span>{formatDate(task.startDate)}</span>
                                  </span>
                                </div>

                                {task.endDate && (
                                  <>
                                    <span className="hidden sm:inline text-slate-300">•</span>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-medium text-slate-400">End Date:</span>
                                      <span className="text-slate-700 inline-flex items-center gap-1">
                                        <span>{formatDate(task.endDate)}</span>
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Hours, Earnings, Action Buttons */}
                            <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 pt-2 lg:pt-0 border-t border-slate-100 lg:border-t-0">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-semibold text-xs border border-slate-200/60">
                                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                  <span>{hours} hrs</span>
                                </span>

                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200/70">
                                  <span>{formatCurrency(earnings, staff?.currency)}</span>
                                </span>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => onSelectTask(task)}
                                  title="View Details"
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => onEditTask(task)}
                                  title="Edit Task"
                                  className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => onDeleteTask(task)}
                                  title="Delete Task"
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Grouped view summary footer */}
          <div className="px-5 py-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-800">{displayedProjects.length}</strong> {displayedProjects.length === 1 ? 'project' : 'projects'} with{' '}
              <strong className="text-slate-800">{totalFilteredTasks}</strong> total tasks
            </span>
            <span>
              Total Filtered Hours:{' '}
              <strong className="text-slate-800">
                {totalFilteredHours.toFixed(1)}h
              </strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

