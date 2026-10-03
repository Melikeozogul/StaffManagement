/**
 * API client configured for ASP.NET Core Web API
 * Default Target: http://localhost:5164
 */

// Use relative /api in development to leverage Vite proxy, with fallback to direct URL
export const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '/api';
export const DIRECT_API_URL = 'http://localhost:5164';

async function handleResponse(response) {
  if (!response.ok) {
    let errorDetail = '';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.message || errorJson.title || JSON.stringify(errorJson);
    } catch {
      errorDetail = await response.text();
    }
    const error = new Error(errorDetail || `API request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  return await response.text();
}

/**
 * Health check to verify connection with ASP.NET Core Web API
 */
export async function checkApiHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${API_BASE_URL}/Staff`, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(timeoutId);
    return { isOnline: res.ok, status: res.status };
  } catch (err) {
    return { isOnline: false, error: err.name === 'AbortError' ? 'Connection timed out' : err.message };
  }
}

/**
 * Staff Endpoints
 */
export const staffApi = {
  getStaff: async () => {
    const res = await fetch(`${API_BASE_URL}/Staff`, {
      headers: { 'Accept': 'application/json' },
    });
    return handleResponse(res);
  },

  getStaffById: async (id) => {
    const res = await fetch(`${API_BASE_URL}/Staff/${id}`, {
      headers: { 'Accept': 'application/json' },
    });
    return handleResponse(res);
  },

  createStaff: async (staffData) => {
    const res = await fetch(`${API_BASE_URL}/Staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(staffData),
    });
    return handleResponse(res);
  },

  updateStaff: async (id, staffData) => {
    const res = await fetch(`${API_BASE_URL}/Staff/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(staffData),
    });
    return handleResponse(res);
  },

  deleteStaff: async (id) => {
    const res = await fetch(`${API_BASE_URL}/Staff/${id}`, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json' },
    });
    return handleResponse(res);
  },

  // Aliases for compatibility
  getAll: function () { return this.getStaff(); },
  getById: function (id) { return this.getStaffById(id); },
  create: function (data) { return this.createStaff(data); },
  update: function (id, data) { return this.updateStaff(id, data); },
  delete: function (id) { return this.deleteStaff(id); },
};

/**
 * Project Endpoints
 */
export const projectApi = {
  getProjects: async () => {
    const res = await fetch(`${API_BASE_URL}/Project`, {
      headers: { 'Accept': 'application/json' },
    });
    return handleResponse(res);
  },

  getProjectById: async (id) => {
    const res = await fetch(`${API_BASE_URL}/Project/${id}`, {
      headers: { 'Accept': 'application/json' },
    });
    return handleResponse(res);
  },

  createProject: async (projectData) => {
    const res = await fetch(`${API_BASE_URL}/Project`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(projectData),
    });
    return handleResponse(res);
  },

  updateProject: async (id, projectData) => {
    const res = await fetch(`${API_BASE_URL}/Project/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(projectData),
    });
    return handleResponse(res);
  },

  deleteProject: async (id) => {
    const res = await fetch(`${API_BASE_URL}/Project/${id}`, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json' },
    });
    return handleResponse(res);
  },

  // Aliases for compatibility
  getAll: function () { return this.getProjects(); },
  getById: function (id) { return this.getProjectById(id); },
  create: function (data) { return this.createProject(data); },
  update: function (id, data) { return this.updateProject(id, data); },
  delete: function (id) { return this.deleteProject(id); },
};

/**
 * Task Endpoints
 */
export const taskApi = {
  getTasks: async () => {
    const res = await fetch(`${API_BASE_URL}/Task`, {
      headers: { 'Accept': 'application/json' },
    });
    return handleResponse(res);
  },

  getTaskById: async (id) => {
    const res = await fetch(`${API_BASE_URL}/Task/${id}`, {
      headers: { 'Accept': 'application/json' },
    });
    return handleResponse(res);
  },

  createTask: async (taskData) => {
    const res = await fetch(`${API_BASE_URL}/Task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(taskData),
    });
    return handleResponse(res);
  },

  updateTask: async (id, taskData) => {
    const res = await fetch(`${API_BASE_URL}/Task/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(taskData),
    });
    return handleResponse(res);
  },

  deleteTask: async (id) => {
    const res = await fetch(`${API_BASE_URL}/Task/${id}`, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json' },
    });
    return handleResponse(res);
  },

  updateStatus: async (id, statusOrIsCompleted) => {
    const isCompleted = typeof statusOrIsCompleted === 'boolean'
      ? statusOrIsCompleted
      : statusOrIsCompleted === 'Completed';
    const status = typeof statusOrIsCompleted === 'string'
      ? statusOrIsCompleted
      : (statusOrIsCompleted ? 'Completed' : 'Pending');

    const res = await fetch(`${API_BASE_URL}/Task/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ status, isCompleted }),
    });
    return handleResponse(res);
  },

  // Aliases for compatibility
  getAll: function () { return this.getTasks(); },
  getById: function (id) { return this.getTaskById(id); },
  create: function (data) { return this.createTask(data); },
  update: function (id, data) { return this.updateTask(id, data); },
  delete: function (id) { return this.deleteTask(id); },
};

/**
 * Role Endpoints
 */
export const roleApi = {
  getRoles: async () => {
    const res = await fetch(`${API_BASE_URL}/Role`, {
      headers: { 'Accept': 'application/json' },
    });
    return handleResponse(res);
  },

  getRoleById: async (id) => {
    const res = await fetch(`${API_BASE_URL}/Role/${id}`, {
      headers: { 'Accept': 'application/json' },
    });
    return handleResponse(res);
  },
};

/**
 * Jira Endpoints
 */
export const jiraApi = {
  syncAll: async () => {
    const res = await fetch(`${API_BASE_URL}/Jira/sync-all`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
    });
    return handleResponse(res);
  },

  syncTask: async (issueKey) => {
    const res = await fetch(`${API_BASE_URL}/Jira/sync/${encodeURIComponent(issueKey)}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
    });
    return handleResponse(res);
  },

  getTask: async (issueKey) => {
    const res = await fetch(`${API_BASE_URL}/Jira/tasks/${encodeURIComponent(issueKey)}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    return handleResponse(res);
  },
};

/**
 * Daily End-of-Day Report Endpoints
 */
export const reportApi = {
  getDailyReport: async (date) => {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    const res = await fetch(`${API_BASE_URL}/reports/daily${query}`, {
      headers: { 'Accept': 'application/json' },
    });
    return handleResponse(res);
  },
};

/**
 * Work Configuration Settings Endpoints
 */
export const settingsApi = {
  getWorkSettings: async () => {
    const res = await fetch(`${API_BASE_URL}/Settings/work`, {
      headers: { 'Accept': 'application/json' },
    });
    return handleResponse(res);
  },

  updateWorkSettings: async (settings) => {
    const res = await fetch(`${API_BASE_URL}/Settings/work`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(settings),
    });
    return handleResponse(res);
  },
};

/**
 * Format a Jira issue key or link to a valid URL
 */
export function formatJiraUrl(jiraLink) {
  if (!jiraLink) return '';
  const trimmed = jiraLink.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (!trimmed.includes('.')) {
    return `https://melikeozogul10.atlassian.net/browse/${trimmed}`;
  }
  return `https://${trimmed}`;
}

/**
 * Extract the Jira issue key (e.g. SCRUM-1, STAFF-101) from a Jira key or URL
 */
export function getJiraIssueKey(jiraLink) {
  if (!jiraLink) return '';
  const trimmed = jiraLink.trim();
  if (!trimmed) return '';

  if (trimmed.includes('/browse/')) {
    const parts = trimmed.split('/browse/');
    const key = parts[parts.length - 1].split('?')[0].split('#')[0].replace(/\/+$/, '');
    if (key) return key;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const segments = trimmed.split('?')[0].split('#')[0].split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    if (last) return last;
  }

  return trimmed;
}
