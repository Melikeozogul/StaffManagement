import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import ProjectCard from '../components/projects/ProjectCard';
import ProjectModal from '../components/projects/ProjectModal';
import ProjectDeleteModal from '../components/projects/ProjectDeleteModal';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Search, FolderKanban, RefreshCw, Layers, Clock, Plus } from 'lucide-react';

export default function ProjectsPage({ onViewProjectTasks }) {
  const { projectList, taskList, loadingProjects, fetchProjects, refreshProjects, setCurrentPage } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  // CRUD states
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);

  const filteredProjects = projectList.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      !searchTerm ||
      (p.projectName || '').toLowerCase().includes(term) ||
      (p.description || '').toLowerCase().includes(term)
    );
  });

  const totalProjectTasks = taskList.length;
  const totalProjectHours = taskList.reduce((sum, t) => sum + (Number(t.hoursSpent) || 0), 0);

  const handleOpenAddProject = () => {
    setProjectToEdit(null);
    setIsProjectModalOpen(true);
  };

  const handleOpenEditProject = (project) => {
    setProjectToEdit(project);
    setIsProjectModalOpen(true);
  };

  const handleOpenDeleteProject = (project) => {
    setProjectToDelete(project);
  };

  const handleViewTasks = (project) => {
    if (onViewProjectTasks) {
      onViewProjectTasks(project);
    } else {
      setCurrentPage('tasks');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Projects</p>
            <p className="text-xl font-bold text-slate-900">{projectList.length} Initiatives</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Associated Tasks</p>
            <p className="text-xl font-bold text-slate-900">{totalProjectTasks} Items</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Time Invested</p>
            <p className="text-xl font-bold text-slate-900">{totalProjectHours.toFixed(1)} Hours</p>
          </div>
        </div>
      </div>

      {/* Search, Refresh, and Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchProjects}
            title="Refresh projects from API"
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleOpenAddProject}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Project</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {loadingProjects ? (
        <LoadingSpinner message="Fetching projects portfolio from API..." />
      ) : projectList.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects recorded in API"
          description="There are currently no projects returned from the backend (/api/Project). Click below to create your first project initiative."
          actionLabel="Add Project"
          onAction={handleOpenAddProject}
          secondaryActionLabel="Refresh Projects"
          onSecondaryAction={fetchProjects}
        />
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          title="No matching projects"
          description="No projects match your current search terms."
          actionLabel="Clear Search"
          onAction={() => setSearchTerm('')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onViewTasks={() => handleViewTasks(project)}
              onEdit={handleOpenEditProject}
              onDelete={handleOpenDeleteProject}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Project Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setProjectToEdit(null);
        }}
        projectToEdit={projectToEdit}
        onSaved={refreshProjects}
      />

      {/* Project Delete Modal with Task Validation */}
      <ProjectDeleteModal
        isOpen={Boolean(projectToDelete)}
        onClose={() => setProjectToDelete(null)}
        project={projectToDelete}
        onDeleted={refreshProjects}
      />
    </div>
  );
}
