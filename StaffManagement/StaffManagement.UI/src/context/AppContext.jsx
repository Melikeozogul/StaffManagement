import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { staffApi, projectApi, taskApi, roleApi, jiraApi, settingsApi, checkApiHealth, DIRECT_API_URL } from '../api/apiClient';
import { calculateStaffEarnings, DEFAULT_WORK_SETTINGS } from '../utils/currency';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  // Real API data states - initially empty arrays, NOT invented data
  const [staffList, setStaffList] = useState([]);
  const [projectList, setProjectList] = useState([]);
  const [taskList, setTaskList] = useState([]);
  const [roleList, setRoleList] = useState([]);

  // Work settings (configurable monthly days & hours)
  const [workSettings, setWorkSettings] = useState(DEFAULT_WORK_SETTINGS);
  const [loadingWorkSettings, setLoadingWorkSettings] = useState(false);

  // Loading states
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);

  // Error states
  const [staffError, setStaffError] = useState(null);
  const [projectError, setProjectError] = useState(null);
  const [taskError, setTaskError] = useState(null);
  const [roleError, setRoleError] = useState(null);

  // API connection health
  const [apiStatus, setApiStatus] = useState({
    isOnline: false,
    checkedAt: null,
    checking: false,
    error: null,
  });

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Check API health
  const verifyApiHealth = useCallback(async () => {
    setApiStatus((prev) => ({ ...prev, checking: true }));
    const result = await checkApiHealth();
    setApiStatus({
      isOnline: result.isOnline,
      checkedAt: new Date(),
      checking: false,
      error: result.error || null,
    });
    return result.isOnline;
  }, []);

  // Fetch Roles from GET /api/Role
  const fetchRoles = useCallback(async () => {
    setLoadingRoles(true);
    setRoleError(null);
    try {
      const data = await roleApi.getRoles();
      const list = Array.isArray(data) ? data : [];
      setRoleList(list);
      return list;
    } catch (err) {
      setRoleError(err.message || 'Failed to fetch roles from API');
      return [];
    } finally {
      setLoadingRoles(false);
    }
  }, []);

  // Fetch / Refresh Staff from GET /api/Staff
  const fetchStaff = useCallback(async () => {
    setLoadingStaff(true);
    setStaffError(null);
    try {
      const data = await staffApi.getStaff();
      const list = Array.isArray(data) ? data : [];
      setStaffList(list);
      return list;
    } catch (err) {
      setStaffError(err.message || 'Failed to fetch staff data from API');
      return [];
    } finally {
      setLoadingStaff(false);
    }
  }, []);

  // Fetch / Refresh Projects from GET /api/Project
  const fetchProjects = useCallback(async () => {
    setLoadingProjects(true);
    setProjectError(null);
    try {
      const data = await projectApi.getProjects();
      const list = Array.isArray(data) ? data : [];
      setProjectList(list);
      return list;
    } catch (err) {
      setProjectError(err.message || 'Failed to fetch projects from API');
      return [];
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  // Fetch / Refresh Tasks from GET /api/Task
  const fetchTasks = useCallback(async () => {
    setLoadingTasks(true);
    setTaskError(null);
    try {
      const data = await taskApi.getTasks();
      const list = Array.isArray(data) ? data : [];
      setTaskList(list);
      return list;
    } catch (err) {
      setTaskError(err.message || 'Failed to fetch tasks from API');
      return [];
    } finally {
      setLoadingTasks(false);
    }
  }, []);

  // Explicit aliases to support both fetchX and refreshX consistently
  const refreshStaff = fetchStaff;
  const refreshProjects = fetchProjects;
  const refreshTasks = fetchTasks;
  const refreshRoles = fetchRoles;

  // Fetch Work Settings from GET /api/Settings/work
  const fetchWorkSettings = useCallback(async () => {
    setLoadingWorkSettings(true);
    try {
      const data = await settingsApi.getWorkSettings();
      if (data && data.standardWorkingDaysPerMonth) {
        setWorkSettings(data);
      }
      return data;
    } catch {
      return DEFAULT_WORK_SETTINGS;
    } finally {
      setLoadingWorkSettings(false);
    }
  }, []);

  // Update Work Settings via PUT /api/Settings/work
  const updateWorkSettings = useCallback(async (newSettings) => {
    try {
      const updated = await settingsApi.updateWorkSettings(newSettings);
      if (updated && updated.standardWorkingDaysPerMonth) {
        setWorkSettings({
          standardWorkingDaysPerMonth: updated.standardWorkingDaysPerMonth,
          standardWorkingHoursPerDay: updated.standardWorkingHoursPerDay,
        });
      }
      showToast('Work settings updated successfully.', 'success');
      return updated;
    } catch (err) {
      showToast(`Failed to update settings: ${err.message}`, 'error');
      throw err;
    }
  }, [showToast]);

  const refreshWorkSettings = fetchWorkSettings;

  // Jira Synchronization State & Function
  const [syncingJira, setSyncingJira] = useState(false);
  const syncJiraAll = useCallback(async () => {
    setSyncingJira(true);
    try {
      const data = await jiraApi.syncAll();
      // Reload tasks, projects, and staff so all associations and newly synced items are updated
      await Promise.allSettled([fetchTasks(), fetchProjects(), fetchStaff()]);
      return data;
    } finally {
      setSyncingJira(false);
    }
  }, [fetchTasks, fetchProjects, fetchStaff]);

  // Load all data
  const refreshAll = useCallback(async () => {
    await verifyApiHealth();
    await Promise.allSettled([fetchRoles(), fetchStaff(), fetchProjects(), fetchTasks(), fetchWorkSettings()]);
  }, [verifyApiHealth, fetchRoles, fetchStaff, fetchProjects, fetchTasks, fetchWorkSettings]);

  // Update task completion status with optimistic UI update
  const updateTaskStatus = useCallback(async (taskId, newStatusOrIsCompleted) => {
    const isCompleted = typeof newStatusOrIsCompleted === 'boolean'
      ? newStatusOrIsCompleted
      : newStatusOrIsCompleted === 'Completed';
    const status = typeof newStatusOrIsCompleted === 'string'
      ? newStatusOrIsCompleted
      : (newStatusOrIsCompleted ? 'Completed' : 'Pending');

    // Optimistically update local task state immediately for instant progress updates
    setTaskList((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status, isCompleted }
          : t
      )
    );

    try {
      const updated = await taskApi.updateStatus(taskId, status);
      if (updated && updated.id) {
        setTaskList((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, ...updated, status: updated.status || status, isCompleted: updated.isCompleted ?? isCompleted } : t))
        );
      }
      return updated;
    } catch (err) {
      showToast(`Failed to update task status: ${err.message}`, 'error');
      await fetchTasks();
      throw err;
    }
  }, [fetchTasks, showToast]);

  // Initial load
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Computed metrics from real data
  const completedTasks = taskList.filter((t) => t.status === 'Completed' || t.isCompleted === true).length;
  const pendingTasks = taskList.length - completedTasks;
  const completionPercentage = taskList.length > 0 ? Math.round((completedTasks / taskList.length) * 100) : 0;

  const stats = {
    totalStaff: staffList.length,
    totalProjects: projectList.length,
    totalTasks: taskList.length,
    completedTasks,
    pendingTasks,
    completionPercentage,
    totalHours: taskList.reduce((acc, t) => acc + (Number(t.hoursSpent) || 0), 0),
    totalEarnings: taskList.reduce((acc, t) => {
      if (t.taskEarnings != null) return acc + Number(t.taskEarnings);
      if (t.earnings != null) return acc + Number(t.earnings);
      const staff = (t.appointedStaffId ? staffList.find((s) => s.id === t.appointedStaffId) : null) || t.appointedStaff;
      return acc + calculateStaffEarnings(t.hoursSpent, staff, workSettings);
    }, 0),
  };

  const value = {
    currentPage,
    setCurrentPage,
    staffList,
    projectList,
    taskList,
    roleList,
    loadingStaff,
    loadingProjects,
    loadingTasks,
    loadingRoles,
    staffError,
    projectError,
    taskError,
    roleError,
    apiStatus,
    verifyApiHealth,
    // Work settings
    workSettings,
    setWorkSettings,
    fetchWorkSettings,
    updateWorkSettings,
    refreshWorkSettings,
    loadingWorkSettings,
    // Role functions
    fetchRoles,
    refreshRoles,
    // Staff functions
    fetchStaff,
    refreshStaff,
    // Project functions
    fetchProjects,
    refreshProjects,
    // Task functions
    fetchTasks,
    refreshTasks,
    updateTaskStatus,
    // Jira synchronization
    syncJiraAll,
    syncingJira,
    // Global refresh
    refreshAll,
    stats,
    toasts,
    showToast,
    removeToast,
    apiUrl: DIRECT_API_URL,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
