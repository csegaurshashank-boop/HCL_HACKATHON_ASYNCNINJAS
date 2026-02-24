// ──────────────────────────────────────────────────────────────
// API — Connected to Live Backend at http://127.0.0.1:8000
// ──────────────────────────────────────────────────────────────

const BASE_URL = 'http://127.0.0.1:8000';

// ── Session (localStorage) ────────────────────────────────────
const SESSION_KEY = 'aegis_user';
const TOKEN_KEY = 'aegis_token';
const RESOLUTION_KEY = 'aegis_resolutions';

export const saveSession = (user, token) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  if (token) localStorage.setItem(TOKEN_KEY, token);
};

export const loadSession = () => {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
  catch { return null; }
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(TOKEN_KEY);
};

// ── Resolutions (local cache) ─────────────────────────────────
export const getResolutions = () => {
  try { return JSON.parse(localStorage.getItem(RESOLUTION_KEY)) || {}; }
  catch { return {}; }
};

export const getResolutionForTicket = (ticketId) =>
  getResolutions()[ticketId] || null;

const saveResolution = (ticketId, data) => {
  const all = getResolutions();
  all[ticketId] = data;
  localStorage.setItem(RESOLUTION_KEY, JSON.stringify(all));
};

// ── HTTP helper ───────────────────────────────────────────────
const request = async (path, method = 'GET', body = null) => {
  const token = getToken();
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.detail || err.message || `Error ${res.status}`);
  }
  return res.json();
};

// ── Auth ──────────────────────────────────────────────────────

export const loginUser = async (email, password) => {
  const data = await request('/api/auth/login', 'POST', { email, password });
  // data is { access_token: "...", token_type: "bearer", user: { id, name, email, role } }
  const user = {
    id: data.user.id,
    name: data.user.name,
    email: data.user.email,
    role: data.user.role === 'admin' ? 'admin' : 'user', // Map 'employee' to 'user' for UI
  };
  saveSession(user, data.access_token);
  return { user };
};

export const registerUser = async (name, email, password, role, department) => {
  const backendRole = role === 'admin' ? 'admin' : 'employee';
  const data = await request('/api/auth/signup', 'POST', {
    name,
    email,
    password,
    department: department || 'General',
    role: backendRole,
  });
  // Signup returns schemas.UserResponse which has id, name, email, role
  const user = {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role === 'admin' ? 'admin' : 'user',
  };
  // Since signup doesn't return a token, we don't call saveSession here
  // The UI will normally redirect to login or we can tell user to login.
  // The current UI App.jsx handles setScreen('dashboard') on success, 
  // so we might need to handle this discrepancy.
  return { user };
};

// ── User Tickets ──────────────────────────────────────────────

export const raiseTicket = (userId, description, category, priority) =>
  request('/api/tickets/raise', 'POST', {
    user_id: userId,
    description,
    category,
    priority,
  });

export const getSuggestions = async (description) => {
  const data = await request('/api/tickets/suggest', 'POST', { description });
  // Backend returns { suggested_fix: "...", top_matches: [...] }
  const mainSugg = { id: 'ai-gen', text: data.suggested_fix, similarity: 100, status: 'resolved' };
  const matches = (data.top_matches || []).map((text, idx) => ({
    id: `match-${idx}`,
    text: `Past Resolution: ${text}`,
    similarity: 90 - (idx * 5),
    status: 'resolved'
  }));
  return [mainSugg, ...matches];
};

export const getUserTickets = (userId) =>
  request(`/api/users/${userId}/tickets`);

// ── Admin Tickets ─────────────────────────────────────────────

export const getAllTickets = () =>
  request('/api/admin/tickets');

export const resolveTicketWithComment = async (ticketId, comment, adminId) => {
  // 1. Resolve ticket on backend
  await request(`/api/tickets/${ticketId}/resolve`, 'PUT', {
    status: 'Resolved',
    resolution_text: comment,
    admin_id: adminId,
  });

  // 2. Train AI with resolution (silently)
  try {
    const ticket = null; // ticket data passed from caller if needed
    await request('/api/admin/knowledge-base', 'POST', {
      ticket_id: ticketId,
      resolution: comment,
    });
  } catch (e) {
    console.warn('Knowledge base training failed (non-critical):', e.message);
  }

  // 3. Save to localStorage as cache
  const resolution = {
    ticketId,
    comment,
    resolvedAt: new Date().toLocaleString('en-IN', { hour12: false }),
    resolvedBy: 'Admin',
  };
  saveResolution(ticketId, resolution);
  return resolution;
};

// ── Analytics ─────────────────────────────────────────────────


export const getAnalytics = () =>
  request('/api/admin/analytics');

// ── Old compat (kept for resolveTicket button in UserDashboard) ──
export const resolveTicket = (ticketId) =>
  request(`/api/tickets/${ticketId}/resolve`, 'PUT', {
    status: 'Resolved',
    resolution_text: 'Marked resolved by user',
    admin_id: null,
  });
