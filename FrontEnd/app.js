/**
 * SHORA — شورای هوشمند تصمیم‌گیری
 * Frontend Application - Real API Integration
 */

'use strict';

// ═══ Configuration ═══
const API_BASE_URL = 'http://localhost:8000/api';
const TENANT_ID = 'tenant-001'; // Should come from auth
const USER_ID = 'user-001';     // Should come from auth

// ═══ State Management ═══
const state = {
  currentView: 'dashboard',
  decisions: [],
  runs: [],
  currentDecision: null,
  currentRun: null,
  pollInterval: null,
};

// ═══ Utility Functions ═══
const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

const faNum = n => Number(n).toLocaleString('fa-IR');

const showToast = (message, type = 'info') => {
  const toast = $('#toast');
  $('#toastTxt').textContent = message;
  toast.style.display = 'block';
  toast.setAttribute('data-type', type);
  setTimeout(() => { toast.style.display = 'none'; }, 4000);
};

// ═══ Navigation ═══
const navigate = (view, params = {}) => {
  // Hide all views
  $$('.view').forEach(el => el.classList.remove('active'));
  
  // Show target view
  const target = $(`#view-${view}`);
  if (target) {
    target.classList.add('active');
    state.currentView = view;
    
    // Update header
    const titles = {
      'dashboard': 'داشبورد',
      'decisions': 'تصمیم‌ها',
      'decision-detail': 'جزئیات تصمیم',
      'run': 'اجرای شورا',
      'dossier': 'پوشه تصمیم',
      'new-decision': 'ایجاد تصمیم جدید'
    };
    $('#topicTxt').textContent = titles[view] || 'SHORA';
    
    // Load view data
    loadViewData(view, params);
  }
  
  // Close drawer on mobile
  $('#navDrawer').setAttribute('aria-hidden', 'true');
  $('#scrim').hidden = true;
};

// ═══ API Calls ═══
const api = {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: { 'Content-Type': 'application/json' },
      ...options
    };
    
    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'خطای سرور' }));
        throw new Error(error.detail || 'خطا در ارتباط با سرور');
      }
      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  },
  
  // Decisions
  getDecisions: () => api.request('/decisions/'),
  
  getDecision: (id) => api.request(`/decisions/${id}`),
  
  createDecision: (data) => api.request('/decisions/', {
    method: 'POST',
    body: JSON.stringify({
      tenant_id: TENANT_ID,
      user_id: USER_ID,
      ...data
    })
  }),
  
  recordHumanDecision: (decisionId, status, notes = '') => 
    api.request(`/decisions/${decisionId}/human-decision`, {
      method: 'POST',
      body: JSON.stringify({ status, notes })
    }),
  
  // Runs
  getRuns: (decisionId) => api.request(`/decisions/${decisionId}/runs`),
  
  getRun: (runId) => api.request(`/runs/${runId}`),
  
  createRun: (decisionId, mode = 'standard') => 
    api.request(`/decisions/${decisionId}/run`, {
      method: 'POST',
      body: JSON.stringify({
        mode,
        max_tasks: 20,
        max_model_calls: 100,
        max_tokens: 50000
      })
    }),
  
  executeRun: (runId) => api.request(`/runs/${runId}/execute`, {
    method: 'POST'
  }),
  
  getRunDossier: (runId) => api.request(`/runs/${runId}/dossier`),
  
  getTasks: (runId) => api.request(`/runs/${runId}/tasks`),
};

// ═══ View Data Loading ═══
const loadViewData = async (view, params = {}) => {
  switch(view) {
    case 'dashboard':
      await loadDashboard();
      break;
    case 'decisions':
      await loadDecisionsList();
      break;
    case 'decision-detail':
      if (params.decisionId) {
        await loadDecisionDetail(params.decisionId);
      }
      break;
    case 'run':
      if (params.runId) {
        await loadRunView(params.runId);
      }
      break;
    case 'dossier':
      if (params.runId) {
        await loadDossier(params.runId);
      }
      break;
  }
};

// ═══ Dashboard ═══
const loadDashboard = async () => {
  try {
    const decisions = await api.getDecisions();
    state.decisions = decisions;
    
    // Recent decisions
    const recentContainer = $('#recentDecisions');
    const recent = decisions.slice(0, 5);
    
    if (recent.length === 0) {
      recentContainer.innerHTML = '<div class="empty-state">هیچ تصمیمی ثبت نشده است</div>';
    } else {
      recentContainer.innerHTML = recent.map(d => `
        <div class="list-item" onclick="app.loadDecision('${d.id}')">
          <div class="item-content">
            <h4>${d.title}</h4>
            <p class="muted">${(d.question || '').substring(0, 60)}...</p>
            <span class="badge ${d.status.toLowerCase()}">${translateStatus(d.status)}</span>
          </div>
          <span class="item-date">${formatDate(d.created_at)}</span>
        </div>
      `).join('');
    }
    
    // Active runs
    const activeRuns = decisions
      .filter(d => d.runs && d.runs.some(r => r.status === 'RUNNING' || r.status === 'PENDING'))
      .flatMap(d => d.runs.filter(r => r.status === 'RUNNING' || r.status === 'PENDING').map(r => ({ ...r, decision: d })))
      .slice(0, 5);
    
    const activeContainer = $('#activeRuns');
    if (activeRuns.length === 0) {
      activeContainer.innerHTML = '<div class="empty-state">هیچ اجرای فعالی وجود ندارد</div>';
    } else {
      activeContainer.innerHTML = activeRuns.map(r => `
        <div class="list-item" onclick="app.navigateToRun('${r.id}')">
          <div class="item-content">
            <h4>${r.decision.title}</h4>
            <p class="muted">اجرای #${r.run_number} · در حال پردازش</p>
            <span class="badge running">در حال اجرا</span>
          </div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Failed to load dashboard:', error);
    showToast('خطا در بارگذاری داشبورد', 'error');
  }
};

// ═══ Decisions List ═══
const loadDecisionsList = async () => {
  try {
    const decisions = await api.getDecisions();
    state.decisions = decisions;
    
    const container = $('#decisionsList');
    if (decisions.length === 0) {
      container.innerHTML = '<div class="empty-state">هیچ تصمیمی وجود ندارد</div>';
    } else {
      container.innerHTML = decisions.map(d => `
        <div class="list-item" onclick="app.loadDecision('${d.id}')">
          <div class="item-content">
            <h4>${d.title}</h4>
            <p class="muted">${(d.question || '').substring(0, 80)}...</p>
            <div class="item-meta">
              <span class="badge ${d.status.toLowerCase()}">${translateStatus(d.status)}</span>
              <span class="muted">${formatDate(d.created_at)}</span>
            </div>
          </div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Failed to load decisions:', error);
    showToast('خطا در بارگذاری تصمیم‌ها', 'error');
  }
};

// ═══ Decision Detail ═══
const loadDecisionDetail = async (decisionId) => {
  try {
    const decision = await api.getDecision(decisionId);
    state.currentDecision = decision;
    
    $('#decisionTitle').textContent = decision.title;
    $('#decisionQuestion').textContent = decision.question || '—';
    $('#decisionContext').textContent = decision.context || '—';
    
    // Objectives
    const objectivesList = $('#decisionObjectives');
    if (decision.objectives && decision.objectives.length > 0) {
      objectivesList.innerHTML = decision.objectives.map(o => `<li>${o}</li>`).join('');
    } else {
      objectivesList.innerHTML = '<li class="muted">تعریف نشده</li>';
    }
    
    // Constraints
    const constraintsList = $('#decisionConstraints');
    if (decision.constraints && decision.constraints.length > 0) {
      constraintsList.innerHTML = decision.constraints.map(c => `<li>${c}</li>`).join('');
    } else {
      constraintsList.innerHTML = '<li class="muted">تعریف نشده</li>';
    }
    
    // Runs
    const runs = await api.getRuns(decisionId);
    const runsContainer = $('#decisionRuns');
    
    if (runs.length === 0) {
      runsContainer.innerHTML = '<div class="empty-state">هنوز اجرایی برای این تصمیم وجود ندارد</div>';
    } else {
      runsContainer.innerHTML = runs.sort((a, b) => b.run_number - a.run_number).map(r => `
        <div class="run-card ${r.status.toLowerCase()}" onclick="app.handleRunClick('${r.id}', '${r.status}')">
          <div class="run-header">
            <span class="run-number">اجرای #${r.run_number}</span>
            <span class="badge ${r.status.toLowerCase()}">${translateStatus(r.status)}</span>
          </div>
          <div class="run-meta">
            <span>وضعیت: ${translateStatus(r.status)}</span>
            ${r.completed_at ? `<span>تکمیل: ${formatDate(r.completed_at)}</span>` : ''}
          </div>
        </div>
      `).join('');
    }
    
    // Show/hide start council button
    const hasActiveRun = runs.some(r => r.status === 'RUNNING' || r.status === 'PENDING');
    $('#startCouncilBtn').disabled = hasActiveRun;
    $('#startCouncilBtn').style.opacity = hasActiveRun ? '0.5' : '1';
    $('#startCouncilBtn').title = hasActiveRun ? 'یک اجرای فعال وجود دارد' : 'شروع تحلیل شورا';
    
  } catch (error) {
    console.error('Failed to load decision detail:', error);
    showToast('خطا در بارگذاری جزئیات تصمیم', 'error');
  }
};

// ═══ Run View (Live Progress) ═══
const loadRunView = async (runId) => {
  try {
    const run = await api.getRun(runId);
    state.currentRun = run;
    
    $('#runTitle').textContent = `اجرای شورا · تصمیم: ${run.decision?.title || '#' + runId}`;
    
    // Start polling for updates
    if (state.pollInterval) clearInterval(state.pollInterval);
    state.pollInterval = setInterval(() => pollRunStatus(runId), 3000);
    
    // Initial load
    await updateRunProgress(run);
    
  } catch (error) {
    console.error('Failed to load run:', error);
    showToast('خطا در بارگذاری اجرای شورا', 'error');
  }
};

const pollRunStatus = async (runId) => {
  try {
    const run = await api.getRun(runId);
    await updateRunProgress(run);
    
    // Stop polling if terminal state
    if (['COMPLETED', 'FAILED'].includes(run.status)) {
      if (state.pollInterval) {
        clearInterval(state.pollInterval);
        state.pollInterval = null;
      }
      
      // Auto-navigate to dossier if completed
      if (run.status === 'COMPLETED') {
        setTimeout(() => {
          showToast('تحلیل شورا تکمیل شد', 'success');
        }, 1000);
      }
    }
  } catch (error) {
    console.error('Polling failed:', error);
  }
};

const updateRunProgress = async (run) => {
  const tasks = await api.getTasks(run.id);
  
  // Update status badge
  const statusEl = $('#runStatus');
  statusEl.textContent = translateStatus(run.status);
  statusEl.className = `run-status ${run.status.toLowerCase()}`;
  
  // Map task types to steps
  const stepMap = {
    'context_gathering': 'context',
    'agent_analysis_strategy': 'strategy',
    'agent_analysis_finance': 'finance',
    'agent_analysis_market': 'market',
    'cross_review': 'review',
    'synthesis': 'synthesis'
  };
  
  // Update step indicators
  $$('.step').forEach(step => {
    const stepType = step.dataset.step;
    const relatedTask = tasks.find(t => stepMap[t.task_type] === stepType);
    
    step.classList.remove('completed', 'running', 'pending');
    
    if (relatedTask) {
      if (relatedTask.status === 'COMPLETED') {
        step.classList.add('completed');
      } else if (relatedTask.status === 'RUNNING') {
        step.classList.add('running');
      } else {
        step.classList.add('pending');
      }
    } else {
      step.classList.add('pending');
    }
  });
  
  // Render agent cards
  const agentsGrid = $('#agentsGrid');
  const agentTasks = tasks.filter(t => t.task_type.startsWith('agent_analysis_'));
  
  if (agentTasks.length > 0) {
    agentsGrid.innerHTML = agentTasks.map(task => {
      const agentName = task.capability || task.task_type.replace('agent_analysis_', '');
      const agentInfo = getAgentInfo(agentName);
      const isCompleted = task.status === 'COMPLETED';
      const isRunning = task.status === 'RUNNING';
      const output = task.output_data || {};
      
      return `
        <div class="agent-card ${agentName} ${isCompleted ? 'completed' : ''} ${isRunning ? 'running' : ''}">
          <div class="agent-header">
            <span class="agent-icon">${agentInfo.icon}</span>
            <div class="agent-info">
              <h4>${agentInfo.name}</h4>
              <span class="agent-status">${translateStatus(task.status)}</span>
            </div>
          </div>
          ${isCompleted && output.summary ? `
            <div class="agent-content">
              <p class="summary">${output.summary}</p>
              ${output.confidence ? `
                <div class="confidence">
                  <span>اطمینان:</span>
                  <div class="confidence-bar">
                    <div class="fill" style="width: ${(output.confidence || 0) * 100}%"></div>
                  </div>
                  <span>${Math.round((output.confidence || 0) * 100)}٪</span>
                </div>
              ` : ''}
            </div>
          ` : isRunning ? `
            <div class="agent-content">
              <div class="loading-dots">
                <span></span><span></span><span></span>
              </div>
              <p class="muted">در حال تحلیل...</p>
            </div>
          ` : `
            <div class="agent-content">
              <p class="muted">در انتظار...</p>
            </div>
          `}
        </div>
      `;
    }).join('');
  }
  
  // Show conflicts section if cross_review completed
  const crossReviewTask = tasks.find(t => t.task_type === 'cross_review');
  const conflictsSection = $('#conflictsSection');
  if (crossReviewTask && crossReviewTask.status === 'COMPLETED') {
    conflictsSection.hidden = false;
    const conflictCount = crossReviewTask.output_data?.conflicts_detected || 0;
    $('#conflictsList').innerHTML = `
      <div class="conflict-summary">
        <span class="conflict-count">${faNum(conflictCount)}</span>
        <span>تضاد شناسایی شد</span>
      </div>
    `;
  }
  
  // Show synthesis section if completed
  const synthesisTask = tasks.find(t => t.task_type === 'synthesis');
  const synthesisSection = $('#synthesisSection');
  if (synthesisTask && synthesisTask.status === 'COMPLETED') {
    synthesisSection.hidden = false;
    const synthesis = synthesisTask.output_data || {};
    $('#synthesisContent').innerHTML = `
      <div class="synthesis-summary">
        <p>${synthesis.executive_summary || synthesis.summary || 'سنتز تحلیل‌ها تکمیل شد'}</p>
        ${synthesis.confidence ? `
          <div class="confidence">
            <span>اطمینان کلی:</span>
            <b>${Math.round((synthesis.confidence || 0) * 100)}٪</b>
          </div>
        ` : ''}
      </div>
      <button class="btn-primary" onclick="app.viewDossier('${run.id}')">
        مشاهده پوشه تصمیم
        <svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>
      </button>
    `;
  }
  
  // Update state
  state.currentRun = run;
};

// ═══ Dossier View ═══
const loadDossier = async (runId) => {
  try {
    const dossier = await api.getRunDossier(runId);
    
    // Populate dossier sections
    $('#dossierExecutiveSummary').textContent = dossier.synthesis?.executive_summary || dossier.synthesis?.summary || '—';
    $('#dossierDecisionQuestion').textContent = dossier.decision?.question || '—';
    
    // Key findings
    const findingsList = $('#dossierKeyFindings');
    const findings = dossier.synthesis?.key_findings || [];
    findingsList.innerHTML = findings.length > 0 
      ? findings.map(f => `<li>${f}</li>`).join('')
      : '<li class="muted">ثبت نشده</li>';
    
    // Agent analyses
    const agentOutputs = dossier.agent_outputs || {};
    
    $('#dossierStrategyAnalysis').innerHTML = renderAgentAnalysis(agentOutputs.strategy, 'استراتژی');
    $('#dossierFinanceAnalysis').innerHTML = renderAgentAnalysis(agentOutputs.finance, 'مالی');
    $('#dossierMarketAnalysis').innerHTML = renderAgentAnalysis(agentOutputs.market, 'بازار');
    
    // Conflicts
    const conflicts = dossier.conflicts || [];
    const conflictsSection = $('#dossierConflictsSection');
    if (conflicts.length > 0) {
      conflictsSection.hidden = false;
      $('#dossierConflicts').innerHTML = conflicts.map(c => `
        <div class="conflict-card severity-${c.severity || 'medium'}">
          <div class="conflict-header">
            <h4>${c.topic || 'تضاد'}</h4>
            <span class="badge ${c.severity || 'medium'}">${translateSeverity(c.severity)}</span>
          </div>
          <p>${c.description || ''}</p>
          <div class="conflict-agents">
            <span>بین:</span>
            ${c.agents?.map(a => `<span class="agent-tag">${getAgentInfo(a).name}</span>`).join('، ') || ''}
          </div>
        </div>
      `).join('');
    } else {
      conflictsSection.hidden = true;
    }
    
    // Risks
    const risksList = $('#dossierRisks');
    const allRisks = [];
    Object.values(agentOutputs).forEach(output => {
      if (output.risks) allRisks.push(...output.risks);
    });
    risksList.innerHTML = allRisks.length > 0
      ? allRisks.map(r => `<li>${r}</li>`).join('')
      : '<li class="muted">ریسک خاصی شناسایی نشد</li>';
    
    // Unknowns
    const unknownsList = $('#dossierUnknowns');
    const unknowns = dossier.synthesis?.unknowns || [];
    unknownsList.innerHTML = unknowns.length > 0
      ? unknowns.map(u => `<li>${u}</li>`).join('')
      : '<li class="muted">ناشناخته‌ای ثبت نشده</li>';
    
    // Next steps
    const nextStepsList = $('#dossierNextSteps');
    const nextSteps = dossier.synthesis?.recommended_next_steps || [];
    nextStepsList.innerHTML = nextSteps.length > 0
      ? nextSteps.map(s => `<li>${s}</li>`).join('')
      : '<li class="muted">گام بعدی مشخصی توصیه نشده</li>';
    
    // Store current run ID for human decision
    state.currentRunId = runId;
    state.currentDecisionId = dossier.decision?.id;
    
  } catch (error) {
    console.error('Failed to load dossier:', error);
    showToast('خطا در بارگذاری پوشه تصمیم', 'error');
  }
};

const renderAgentAnalysis = (output, agentName) => {
  if (!output || !output.summary) {
    return '<p class="muted">تحلیلی موجود نیست</p>';
  }
  
  return `
    <div class="analysis-content">
      <p class="summary">${output.summary}</p>
      ${output.claims && output.claims.length > 0 ? `
        <div class="analysis-section">
          <h5>ادعاها</h5>
          <ul>${output.claims.map(c => `<li>${c}</li>`).join('')}</ul>
        </div>
      ` : ''}
      ${output.assumptions && output.assumptions.length > 0 ? `
        <div class="analysis-section">
          <h5>فرضیات</h5>
          <ul>${output.assumptions.map(a => `<li>${a}</li>`).join('')}</ul>
        </div>
      ` : ''}
      ${output.recommendations && output.recommendations.length > 0 ? `
        <div class="analysis-section">
          <h5>توصیه‌ها</h5>
          <ul>${output.recommendations.map(r => `<li>${r}</li>`).join('')}</ul>
        </div>
      ` : ''}
      ${output.confidence ? `
        <div class="confidence">
          <span>سطح اطمینان:</span>
          <div class="confidence-bar">
            <div class="fill" style="width: ${output.confidence * 100}%"></div>
          </div>
          <b>${Math.round(output.confidence * 100)}٪</b>
        </div>
      ` : ''}
    </div>
  `;
};

// ═══ Event Handlers ═══
const handleNewDecision = async (e) => {
  e.preventDefault();
  
  const title = $('#decisionTitle').value.trim();
  const question = $('#decisionQuestion').value.trim();
  const objectivesText = $('#decisionObjectives').value.trim();
  const constraintsText = $('#decisionConstraints').value.trim();
  const context = $('#decisionContext').value.trim();
  
  if (!title || !question) {
    showToast('عنوان و سؤال تصمیم الزامی است', 'error');
    return;
  }
  
  try {
    const decision = await api.createDecision({
      title,
      question,
      objectives: objectivesText.split('\n').filter(l => l.trim()),
      constraints: constraintsText.split('\n').filter(l => l.trim()),
      context,
      criteria: []
    });
    
    showToast('تصمیم با موفقیت ایجاد شد', 'success');
    $('#newDecisionForm').reset();
    navigate('decision-detail', { decisionId: decision.id });
  } catch (error) {
    console.error('Failed to create decision:', error);
    showToast('خطا در ایجاد تصمیم: ' + error.message, 'error');
  }
};

const handleStartCouncil = async () => {
  if (!state.currentDecision) return;
  
  try {
    showToast('در حال ایجاد اجرای جدید...', 'info');
    
    // Create run
    const run = await api.createRun(state.currentDecision.id);
    
    // Start execution
    showToast('شروع تحلیل شورا...', 'info');
    await api.executeRun(run.id);
    
    // Navigate to run view
    navigate('run', { runId: run.id });
  } catch (error) {
    console.error('Failed to start council:', error);
    showToast('خطا در شروع شورا: ' + error.message, 'error');
  }
};

const handleHumanDecision = async () => {
  const selectedBtn = $('.btn-decision.selected');
  if (!selectedBtn) {
    showToast('لطفاً یک گزینه را انتخاب کنید', 'error');
    return;
  }
  
  const decision = selectedBtn.dataset.decision;
  const reason = $('#humanDecisionReason').value.trim();
  
  if (!state.currentDecisionId) {
    showToast('شناسه تصمیم یافت نشد', 'error');
    return;
  }
  
  try {
    showToast('در حال ثبت تصمیم...', 'info');
    
    await api.recordHumanDecision(state.currentDecisionId, decision, reason);
    
    showToast('تصمیم شما با موفقیت ثبت شد', 'success');
    
    // Disable buttons after submission
    $$('.btn-decision').forEach(btn => btn.disabled = true);
    $('#submitHumanDecision').disabled = true;
    $('#humanDecisionReason').disabled = true;
    
  } catch (error) {
    console.error('Failed to record human decision:', error);
    showToast('خطا در ثبت تصمیم: ' + error.message, 'error');
  }
};

// ═══ Helpers ═══
const getAgentInfo = (agentName) => {
  const agents = {
    strategy: { name: 'استراتژی', icon: '🎯' },
    finance: { name: 'مالی', icon: '💰' },
    market: { name: 'بازار', icon: '📊' },
    ops: { name: 'عملیات', icon: '⚙️' },
    hr: { name: 'منابع انسانی', icon: '👥' },
    legal: { name: 'حقوقی', icon: '⚖️' }
  };
  return agents[agentName] || { name: agentName, icon: '🔹' };
};

const translateStatus = (status) => {
  const translations = {
    'DRAFT': 'پیش‌نویس',
    'PLANNING': 'در حال برنامه‌ریزی',
    'RUNNING': 'در حال اجرا',
    'PENDING': 'در انتظار',
    'COMPLETED': 'تکمیل‌شده',
    'FAILED': 'با شکست مواجه شد',
    'APPROVED': 'تأییدشده',
    'REJECTED': 'ردشده',
    'DEFERRED': 'معوق',
    'REQUESTED_REVISION': 'درخواست بازنگری'
  };
  return translations[status] || status;
};

const translateSeverity = (severity) => {
  const translations = {
    'low': 'کم',
    'medium': 'متوسط',
    'high': 'زیاد',
    'critical': 'بحرانی'
  };
  return translations[severity] || severity;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// ═══ App Initialization ═══
const app = {
  navigate,
  loadDecision: (id) => navigate('decision-detail', { decisionId: id }),
  navigateToRun: (runId) => navigate('run', { runId }),
  viewDossier: (runId) => navigate('dossier', { runId }),
  handleRunClick: (runId, status) => {
    if (status === 'COMPLETED') {
      navigate('dossier', { runId });
    } else {
      navigate('run', { runId });
    }
  },
  
  init: () => {
    // Set up navigation
    $$('[data-view]').forEach(el => {
      el.addEventListener('click', () => {
        navigate(el.dataset.view);
      });
    });
    
    $$('[data-action="new-decision"]').forEach(el => {
      el.addEventListener('click', () => {
        navigate('new-decision');
      });
    });
    
    // Menu toggle
    $('#hmenu').addEventListener('click', () => {
      const drawer = $('#navDrawer');
      const scrim = $('#scrim');
      const isHidden = drawer.getAttribute('aria-hidden') === 'true';
      drawer.setAttribute('aria-hidden', isHidden ? 'false' : 'true');
      scrim.hidden = !isHidden;
    });
    
    $('[data-closedrawer]').addEventListener('click', () => {
      $('#navDrawer').setAttribute('aria-hidden', 'true');
      $('#scrim').hidden = true;
    });
    
    $('#scrim').addEventListener('click', () => {
      $('#navDrawer').setAttribute('aria-hidden', 'true');
      $('#scrim').hidden = true;
    });
    
    // New decision form
    $('#newDecisionForm').addEventListener('submit', handleNewDecision);
    
    // Start council button
    $('#startCouncilBtn').addEventListener('click', handleStartCouncil);
    
    // Human decision buttons
    $$('.btn-decision').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.btn-decision').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });
    
    $('#submitHumanDecision').addEventListener('click', handleHumanDecision);
    
    // Hero button
    $('#newDecisionHero').addEventListener('click', () => navigate('new-decision'));
    $('#newDecisionBtn').addEventListener('click', () => navigate('new-decision'));
    
    // Load initial view
    navigate('dashboard');
    
    console.log('SHORA WebUI initialized');
  }
};

// Make app globally available for inline handlers
window.app = app;

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', app.init);
} else {
  app.init();
}
