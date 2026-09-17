const API_BASE = 'http://127.0.0.1:8000/api';

async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'خطا در ارتباط با سرور' }));
      throw new Error(error.detail || `خطا ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Decision APIs
async function createDecision(data) {
  return apiCall('/decisions/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

async function getDecisions() {
  return apiCall('/decisions/');
}

async function getDecision(id) {
  return apiCall(`/decisions/${id}`);
}

async function createRun(decisionId, data = {}) {
  return apiCall(`/decisions/${decisionId}/run`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

async function getRuns(decisionId) {
  return apiCall(`/decisions/${decisionId}/runs`);
}

async function executeRun(runId) {
  return apiCall(`/runs/${runId}/execute`, {
    method: 'POST',
  });
}

async function getRun(runId) {
  return apiCall(`/runs/${runId}`);
}

async function getRunTasks(runId) {
  return apiCall(`/runs/${runId}/tasks`);
}

async function getRunDossier(runId) {
  return apiCall(`/runs/${runId}/dossier`);
}

async function recordHumanDecisionOnDecision(decisionId, status, notes = '') {
  return apiCall(`/decisions/${decisionId}/human-decision`, {
    method: 'POST',
    body: JSON.stringify({ status, notes }),
  });
}

async function getTenant(tenantId) {
  return apiCall(`/tenants/${tenantId}`);
}

async function getUser(userId) {
  return apiCall(`/users/${userId}`);
}
