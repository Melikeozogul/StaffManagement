import React, { useState } from 'react';
import TaskList from '../components/tasks/TaskList';
import TaskModal from '../components/tasks/TaskModal';
import TaskDetailModal from '../components/tasks/TaskDetailModal';
import DeleteConfirmModal from '../components/tasks/DeleteConfirmModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useApp } from '../context/AppContext';
import { jiraApi } from '../api/apiClient';
import { formatTotalEarnings } from '../utils/currency';
import { CheckSquare, Clock, DollarSign, RefreshCw, CheckCircle, AlertCircle, X, TrendingUp } from 'lucide-react';

export default function TasksPage({
  isNewTaskOpen,
  setIsNewTaskOpen,
  selectedTask,
  setSelectedTask,
}) {
  const { taskList, stats, loadingTasks, refreshTasks, showToast, refreshProjects, refreshStaff } = useApp();

  const [taskToEdit, setTaskToEdit] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState(null); // { type: 'success' | 'error', message: string }

  // Dynamic progress values calculated strictly from real backend tasks
  const totalTasks = taskList.length;
  const completedTasks = taskList.filter((t) => t.status === 'Completed' || t.isCompleted === true).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleSyncJira = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const result = await jiraApi.syncAll();
      const count = Array.isArray(result) ? result.length : 0;
      const successMsg = `Successfully synchronized ${count} task${count === 1 ? '' : 's'} from Jira.`;

      // Reload tasks from database so newly synchronized and updated tasks appear immediately
      await Promise.allSettled([
        refreshTasks(),
        refreshProjects ? refreshProjects() : Promise.resolve(),
        refreshStaff ? refreshStaff() : Promise.resolve(),
      ]);

      setSyncFeedback({
        type: 'success',
        message: successMsg,
      });
      showToast(successMsg, 'success');
    } catch (err) {
      const errorMsg = err.message || 'Failed to synchronize tasks from Jira. Please try again.';
      setSyncFeedback({
        type: 'error',
        message: errorMsg,
      });
      showToast(errorMsg, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOpenNewTask = () => {
    setTaskToEdit(null);
    setIsNewTaskOpen(true);
  };

  const handleOpenEditTask = (task) => {
    setTaskToEdit(task);
    setIsNewTaskOpen(true);
  };

  const handleOpenDetail = (task) => {
    setSelectedTask(task);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (task) => {
    setTaskToDelete(task);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Jira Sync Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <RefreshCw className={`w-5 h-5 text-blue-600 ${isSyncing ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Jira SCRUM Synchronization</h2>
            <p className="text-xs text-slate-500">
              Synchronize tasks and hours from Jira SCRUM project
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSyncJira}
          disabled={isSyncing}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : 'Sync from Jira'}</span>
        </button>
      </div>

      {/* Synchronization Feedback Banner */}
      {syncFeedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm transition-all ${
            syncFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {syncFeedback.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{syncFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncFeedback(null)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-black/5 transition-colors"
            aria-label="Dismiss message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Overall Progress Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded-md">
                Task Management Progress
              </span>
              <span className="text-xs text-slate-400">• Real-Time Dynamic Calculation</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">Overall Progress</h2>
          </div>

          {/* Progress Percentage Badge */}
          <div className="flex items-center gap-2 self-start sm:self-auto bg-indigo-50/70 border border-indigo-100 px-3 py-1.5 rounded-xl">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <span className="text-xl sm:text-2xl font-black text-indigo-700 font-mono">
              {completionPercentage}%
            </span>
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
              Completed
            </span>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-200/70 shadow-inner">
            <div
              className="bg-gradient-to-r from-indigo-500 via-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500 ease-out shadow-xs"
              style={{ width: `${completionPercentage}%` }}
              role="progressbar"
              aria-valuenow={completionPercentage}
              aria-valuemin="0"
              aria-valuemax="100"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>{completedTasks} of {totalTasks} tasks completed ({completionPercentage}%)</span>
            <span>{pendingTasks} {pendingTasks === 1 ? 'task' : 'tasks'} pending</span>
          </div>
        </div>

        {/* 4-Item Progress Metrics Grid as required */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          {/* Total Tasks */}
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Tasks</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{totalTasks}</p>
          </div>

          {/* Completed */}
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Completed</p>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="text-xl font-bold text-emerald-800 mt-0.5">{completedTasks}</p>
          </div>

          {/* Pending */}
          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Pending</p>
              <Clock className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <p className="text-xl font-bold text-amber-800 mt-0.5">{pendingTasks}</p>
          </div>

          {/* Progress */}
          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">Progress</p>
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <p className="text-xl font-bold text-indigo-800 mt-0.5">{completionPercentage}%</p>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hours Logged</p>
            <p className="text-xl font-bold text-slate-900">{stats.totalHours.toFixed(1)} Hours</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Calculated Earnings</p>
            <p className="text-xl font-bold text-slate-900">{formatTotalEarnings(taskList)}</p>
          </div>
        </div>
      </div>

      {/* Task List Component */}
      {loadingTasks ? (
        <LoadingSpinner message="Fetching tasks from API..." />
      ) : (
        <TaskList
          onNewTask={handleOpenNewTask}
          onEditTask={handleOpenEditTask}
          onDeleteTask={handleOpenDelete}
          onSelectTask={handleOpenDetail}
        />
      )}

      {/* Add / Edit Task Modal */}
      <TaskModal
        isOpen={isNewTaskOpen}
        onClose={() => {
          setIsNewTaskOpen(false);
          setTaskToEdit(null);
        }}
        taskToEdit={taskToEdit}
        onSaved={refreshTasks}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onEdit={(task) => {
          handleOpenEditTask(task);
        }}
        onDelete={(task) => {
          handleOpenDelete(task);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(taskToDelete)}
        onClose={() => setTaskToDelete(null)}
        task={taskToDelete}
        onDeleted={refreshTasks}
      />
    </div>
  );
}
