import React from 'react';
import { useApp } from '../context/AppContext';
import StatCard from '../components/common/StatCard';
import { formatCurrency, formatPaymentRate, formatTotalEarnings, calculateStaffEarnings } from '../utils/currency';
import { 
  Users, 
  FolderKanban, 
  CheckSquare, 
  Clock, 
  DollarSign, 
  Server, 
  AlertCircle, 
  ExternalLink, 
  ArrowRight, 
  Plus,
  RefreshCw
} from 'lucide-react';

export default function DashboardPage({ onNewTask, onSelectTask }) {
  const { 
    staffList, 
    projectList, 
    taskList, 
    stats, 
    apiStatus, 
    refreshAll, 
    setCurrentPage, 
    apiUrl,
    workSettings,
  } = useApp();

  // Recent 5 tasks
  const recentTasks = [...taskList].slice(-5).reverse();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* API Offline Banner / Connection Helper */}
      {!apiStatus.isOnline && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 shrink-0">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-900">
                  ASP.NET Core Web API is Offline or Unreachable
                </h4>
                <p className="text-xs text-amber-700 mt-1 max-w-2xl leading-relaxed">
                  The frontend is configured to consume <code className="bg-amber-100/80 px-1.5 py-0.5 rounded font-mono text-amber-900">{apiUrl}</code>.
                  Start the backend API with <code className="bg-amber-100/80 px-1.5 py-0.5 rounded font-mono text-amber-900 font-semibold">dotnet run --project StaffManagement.API</code> to stream live database records.
                </p>
              </div>
            </div>

            <button
              onClick={refreshAll}
              disabled={apiStatus.checking}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-amber-900 bg-white hover:bg-amber-100/80 border border-amber-300 rounded-xl transition-colors shrink-0 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${apiStatus.checking ? 'animate-spin' : ''}`} />
              <span>Retry Connection</span>
            </button>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Active Staff"
          value={stats.totalStaff}
          icon={Users}
          color="indigo"
          subtitle={`${staffList.length} members loaded`}
        />
        <StatCard
          title="Projects"
          value={stats.totalProjects}
          icon={FolderKanban}
          color="blue"
          subtitle={`${projectList.length} initiatives`}
        />
        <StatCard
          title="Tasks Logged"
          value={stats.totalTasks}
          icon={CheckSquare}
          color="amber"
          subtitle="Work items assigned"
        />
        <StatCard
          title="Total Hours"
          value={`${stats.totalHours.toFixed(1)}h`}
          icon={Clock}
          color="purple"
          subtitle="Billable time logged"
        />
        <StatCard
          title="Accrued Payroll"
          value={formatTotalEarnings(taskList, workSettings)}
          icon={DollarSign}
          color="emerald"
          subtitle="Staff earnings total"
        />
      </div>

      {/* 2-Column Dashboard Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Tasks (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-subtle p-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Task Assignments</h2>
              <p className="text-xs text-slate-500">Live work items synced with ASP.NET Core API</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onNewTask}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Task</span>
              </button>
              <button
                onClick={() => setCurrentPage('tasks')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 p-1.5 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                View All &rarr;
              </button>
            </div>
          </div>

          <div className="mt-4">
            {recentTasks.length === 0 ? (
              <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <CheckSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No tasks in database yet</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto mt-1">
                  Once tasks are added via the API or UI, they will appear here in real-time.
                </p>
                <button
                  onClick={onNewTask}
                  className="mt-3 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-xs"
                >
                  Add a task now
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentTasks.map((task) => {
                  const staff = (task.appointedStaffId ? staffList.find((s) => s.id === task.appointedStaffId) : null) || task.appointedStaff;
                  const hours = Number(task.hoursSpent) || 0;
                  const earnings =
                    task.taskEarnings != null
                      ? Number(task.taskEarnings)
                      : task.earnings != null
                      ? Number(task.earnings)
                      : calculateStaffEarnings(hours, staff, workSettings);

                  return (
                    <div
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className="py-3 px-2 flex items-center justify-between hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                          {task.description}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span className="font-medium text-slate-700">
                            {task.project?.projectName || `Project #${task.projectId}`}
                          </span>
                          <span>•</span>
                          <span>
                            {staff ? `${staff.name} ${staff.surname}` : `Staff #${task.appointedStaffId}`}
                          </span>
                        </p>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-3">
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">
                            {hours} hrs
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-600">
                            {formatCurrency(earnings, staff?.currency)}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Workload & Quick Actions (1 col) */}
        <div className="space-y-6">
          {/* Staff Distribution Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Staff Overview</h2>
              <button
                onClick={() => setCurrentPage('staff')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Directory &rarr;
              </button>
            </div>

            <div className="mt-4">
              {staffList.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No staff records loaded from API.
                </p>
              ) : (
                <div className="space-y-3">
                  {staffList.slice(0, 4).map((staff) => (
                    <div key={staff.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                          {(staff.name || '')[0] || 'S'}
                        </div>
                        <div className="truncate">
                          <p className="font-semibold text-slate-800 truncate">
                            {staff.name} {staff.surname}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {staff.role?.roleName || 'Team Member'}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-slate-700 shrink-0 text-xs sm:text-sm">
                        {formatPaymentRate(staff.paymentAmount ?? staff.hourlyRate ?? staff.hourlyWage, staff.currency, staff.paymentType)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Projects Snapshot Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Active Projects</h2>
              <button
                onClick={() => setCurrentPage('projects')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                All Projects &rarr;
              </button>
            </div>

            <div className="mt-4">
              {projectList.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No project records loaded from API.
                </p>
              ) : (
                <div className="space-y-3">
                  {projectList.slice(0, 3).map((project) => {
                    const count = taskList.filter((t) => t.projectId === project.id).length;
                    return (
                      <div key={project.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-900">{project.projectName}</p>
                          <span className="text-[10px] font-semibold px-2 py-0.5 bg-white text-indigo-600 border border-slate-200 rounded-md">
                            {count} tasks
                          </span>
                        </div>
                        {project.description && (
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                            {project.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
