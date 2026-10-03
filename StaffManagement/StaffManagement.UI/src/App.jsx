import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/common/Sidebar';
import Navbar from './components/common/Navbar';
import ToastContainer from './components/common/ToastContainer';
import DashboardPage from './pages/DashboardPage';
import DailyReportPage from './pages/DailyReportPage';
import StaffPage from './pages/StaffPage';
import ProjectsPage from './pages/ProjectsPage';
import TasksPage from './pages/TasksPage';
import TaskModal from './components/tasks/TaskModal';
import TaskDetailModal from './components/tasks/TaskDetailModal';

function MainLayout() {
  const { currentPage, setCurrentPage } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isGlobalDetailOpen, setIsGlobalDetailOpen] = useState(false);

  // Global handler for inspecting a task from anywhere (e.g. Dashboard or Staff page)
  const handleSelectTask = (task) => {
    setSelectedTask(task);
    setIsGlobalDetailOpen(true);
  };

  const handleViewProjectTasks = (project) => {
    setCurrentPage('tasks');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <Navbar
          onOpenMobile={() => setMobileOpen(true)}
          onOpenNewTask={() => setIsNewTaskOpen(true)}
        />

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentPage === 'dashboard' && (
            <DashboardPage
              onNewTask={() => setIsNewTaskOpen(true)}
              onSelectTask={handleSelectTask}
            />
          )}

          {currentPage === 'daily-report' && (
            <DailyReportPage />
          )}

          {currentPage === 'staff' && (
            <StaffPage onSelectTask={handleSelectTask} />
          )}

          {currentPage === 'projects' && (
            <ProjectsPage onViewProjectTasks={handleViewProjectTasks} />
          )}

          {currentPage === 'tasks' && (
            <TasksPage
              isNewTaskOpen={isNewTaskOpen}
              setIsNewTaskOpen={setIsNewTaskOpen}
              selectedTask={selectedTask}
              setSelectedTask={setSelectedTask}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="py-4 px-6 border-t border-slate-200/80 bg-white/50 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>StaffPulse UI</span>
            <span>•</span>
            <span>ASP.NET Core Web API: <code className="text-slate-600 font-mono">http://localhost:5164</code></span>
          </div>
          <div>
            <span>Connected to EF Core MySQL Backend</span>
          </div>
        </footer>
      </div>

      {/* Global Task Creation Modal */}
      <TaskModal
        isOpen={isNewTaskOpen && currentPage !== 'tasks'}
        onClose={() => setIsNewTaskOpen(false)}
      />

      {/* Global Task Detail Modal (when opened from Dashboard or Staff) */}
      {currentPage !== 'tasks' && (
        <TaskDetailModal
          isOpen={isGlobalDetailOpen}
          onClose={() => {
            setIsGlobalDetailOpen(false);
            setSelectedTask(null);
          }}
          task={selectedTask}
          onEdit={() => {
            setIsGlobalDetailOpen(false);
            setCurrentPage('tasks');
          }}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
