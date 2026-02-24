// ──────────────────────────────────────────────────────────────
// API — Connected to Live Backend at http://127.0.0.1:8000
// ──────────────────────────────────────────────────────────────

const BASE_URL = 'http://127.0.0.1:8000';

// ── Session (localStorage) ────────────────────────────────────
const SESSION_KEY = 'aegis_user';
const RESOLUTION_KEY = 'aegis_resolutions';

export const saveSession = (user) =>
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));

export const loadSession = () => {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
  catch { return null; }
};

export const clearSession = () =>
  localStorage.removeItem(SESSION_KEY);

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
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
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
  // Normalize role: backend sends 'employee', we treat it as 'user'
  const user = {
    id: data.user.id,
    name: data.user.name,
    email: data.user.email,
    role: data.user.role === 'admin' ? 'admin' : 'user',
  };
  saveSession(user);
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
  const user = {
    id: data.user?.id,
    name: data.user?.name || name,
    email: data.user?.email || email,
    role: role,
  };
  saveSession(user);
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
  // Backend returns { suggested_fix: "..." } — wrap as array for UI
  return [{ id: 1, text: data.suggested_fix, similarity: 95, status: 'resolved' }];
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
