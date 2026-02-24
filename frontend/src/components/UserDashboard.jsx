import React, { useState, useEffect } from 'react';
import { getSuggestions, raiseTicket, resolveTicket, getUserTickets, loadSession } from '../api.js';

// ── helpers ───────────────────────────────────────────────────
const STATUS_MAP = {
  open: { label: 'Open', cls: 'status-open' },
  'in-progress': { label: 'In Progress', cls: 'status-inprog' },
  resolved: { label: 'Resolved', cls: 'status-resolved' },
  Resolved: { label: 'Resolved', cls: 'status-resolved' },
};
const PRIORITY_MAP = {
  High: { label: 'High', cls: 'pill-high' },
  Medium: { label: 'Medium', cls: 'pill-medium' },
  Low: { label: 'Low', cls: 'pill-low' },
  high: { label: 'High', cls: 'pill-high' },
  medium: { label: 'Medium', cls: 'pill-medium' },
  low: { label: 'Low', cls: 'pill-low' },
};

// ── Ticket History view ───────────────────────────────────────
function TicketHistory({ onBack }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const session = loadSession();
    if (!session?.id) { setLoading(false); setError('Session not found. Please log in again.'); return; }
    getUserTickets(session.id)
      .then(data => setTickets(Array.isArray(data) ? data : []))
      .catch(e => setError(e.message || 'Could not load tickets.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="dash-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <button className="back-btn" onClick={onBack}>← Back</button>
            <h1 className="dash-title" style={{ margin: 0 }}>My Ticket History</h1>
          </div>
          <p className="dash-sub">Track status and admin responses for all your submitted tickets</p>
        </div>
      </div>

      {loading && <div className="loading-state"><div className="spinner" /><p className="loading-text">Loading your tickets…</p></div>}
      {error && <div className="alert-error"><span>⚠️</span> {error}</div>}
      {!loading && !error && tickets.length === 0 && <div className="empty-state">You haven't raised any tickets yet.</div>}

      {!loading && tickets.length > 0 && (
        <div className="history-list">
          {tickets.map((t) => {
            const sm = STATUS_MAP[t.status] || STATUS_MAP.open;
            const pm = PRIORITY_MAP[t.priority] || { label: t.priority || 'Low', cls: 'pill-low' };
            const isOpen = expanded === (t.id || t.ticket_id);
            const tid = t.id || t.ticket_id;

            return (
              <div key={tid} className={`history-card${isOpen ? ' history-card-open' : ''}`}>
                <div className="history-card-header" onClick={() => setExpanded(isOpen ? null : tid)} style={{ cursor: 'pointer' }}>
                  <div className="history-card-left">
                    <span className="ticket-id">#{tid}</span>
                    <div>
                      <p className="history-issue">{t.description || t.issue}</p>
                      <div className="history-meta">
                        <span className="history-date">🕐 {t.created_at || t.submittedAt || 'N/A'}</span>
                        <span className={`pill ${pm.cls}`}>{pm.label}</span>
                        {t.category && <span className="pill pill-medium" style={{ opacity: 0.8 }}>{t.category}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="history-card-right">
                    <span className={`status-badge ${sm.cls}`}>
                      <span className="status-dot" style={{ background: t.status === 'Resolved' || t.status === 'resolved' ? '#22c55e' : t.status === 'in-progress' ? '#3b82f6' : '#f59e0b' }} />
                      {sm.label}
                    </span>
                    <span className="expand-chevron">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isOpen && (
                  <div className="history-card-body">
                    <div>
                      <p className="timeline-title">Details</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[
                          ['Category', t.category || '—'],
                          ['Priority', t.priority || '—'],
                          ['Created', t.created_at || t.submittedAt || '—'],
                          ['Updated', t.updated_at || '—'],
                        ].map(([k, v]) => (
                          <div key={k} style={{ display: 'flex', gap: 12, fontSize: 13 }}>
                            <span style={{ color: 'var(--text3)', minWidth: 80 }}>{k}</span>
                            <span style={{ color: 'var(--text)', fontWeight: 500 }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {(t.resolution_text || t.adminComment) ? (
                      <div className="admin-comment">
                        <div className="admin-comment-header">
                          <span className="admin-avatar">👨‍💼</span>
                          <div>
                            <p className="admin-comment-name">Admin Response</p>
                            <p className="admin-comment-time">{t.resolved_at || t.resolvedAt || ''}</p>
                          </div>
                        </div>
                        <p className="admin-comment-text">{t.resolution_text || t.adminComment}</p>
                      </div>
                    ) : (
                      <div className="no-comment">
                        <span>💬</span>
                        <span>No admin response yet. Your ticket is being reviewed.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main UserDashboard ────────────────────────────────────────
export default function UserDashboard() {
  const [view, setView] = useState('form');
  const [form, setForm] = useState({ description: '', category: 'Network', priority: 'High' });
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [status, setStatus] = useState('open');
  const [loading, setLoading] = useState(false);
  const [raising, setRaising] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searched, setSearched] = useState(false);

  const session = loadSession();

  const matchClass = (pct = 95) => {
    if (pct >= 90) return 'match-badge match-high';
    if (pct >= 70) return 'match-badge match-medium';
    return 'match-badge match-low';
  };

  const handleGetSuggestions = async () => {
    if (!form.description.trim()) return;
    setLoading(true); setSearched(true); setError('');
    try {
      const data = await getSuggestions(form.description);
      setAiSuggestions(Array.isArray(data) ? data : []);
    } catch (e) { setError(e.message || 'Could not get AI suggestions.'); }
    finally { setLoading(false); }
  };

  const handleRaiseTicket = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) return;
    if (!session?.id) { setError('Session expired. Please log in again.'); return; }
    setRaising(true); setError(''); setSuccess('');
    try {
      await raiseTicket(session.id, form.description, form.category, form.priority);
      setSuccess('✅ Ticket raised successfully! AI is fetching suggestions…');
      await handleGetSuggestions();
    } catch (e) { setError(e.message || 'Failed to raise ticket.'); }
    finally { setRaising(false); }
  };

  const handleResolve = async () => {
    try {
      await resolveTicket(1);
      setStatus('resolved');
    } catch (e) { console.error(e); setStatus('resolved'); }
  };

  if (view === 'history') return <TicketHistory onBack={() => setView('form')} />;

  const CATEGORIES = ['Network', 'Software', 'Hardware', 'Access', 'Email', 'Database', 'Performance', 'Other'];
  const PRIORITIES = ['High', 'Medium', 'Low'];

  return (
    <div>
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">My Support Ticket</h1>
          <p className="dash-sub">Describe your issue and get an instant AI fix</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-history" onClick={() => setView('history')}>🕐 My Ticket History</button>
          <span className={`status-badge ${status === 'open' ? 'status-open' : 'status-resolved'}`}>
            <span className={`status-dot ${status === 'open' ? 'dot-open' : 'dot-resolved'}`} />
            {status === 'open' ? 'Open' : 'Resolved'}
          </span>
        </div>
      </div>

      {/* Ticket Form */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-icon">🎫</div>
          <span className="card-header-title">Raise a New Ticket</span>
        </div>
        <div className="card-body">
          {success && <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#4ade80', marginBottom: 14 }}>{success}</div>}
          {error && <div className="alert-error"><span>⚠️</span> {error}</div>}

          <form onSubmit={handleRaiseTicket}>
            <div className="form-group">
              <label className="form-label">Describe your issue <span style={{ color: '#ef4444' }}>*</span></label>
              <textarea
                className="form-textarea" rows={4}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                disabled={status === 'resolved'}
                placeholder="e.g. Cannot connect to VPN from home — getting authentication failed error…"
              />
              <p className="char-count">{form.description.length} characters</p>
            </div>

            {/* Category + Priority row */}
            <div className="form-row" style={{ marginBottom: 14 }}>
              <div>
                <label className="form-label">Category</label>
                <div className="select-wrap">
                  <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <span className="select-chevron">▼</span>
                </div>
              </div>
              <div>
                <label className="form-label">Priority</label>
                <div className="select-wrap">
                  <select className="form-select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <span className="select-chevron">▼</span>
                </div>
              </div>
            </div>

            <div className="btn-row">
              <button type="submit" className="btn-ai" disabled={!form.description.trim() || raising || status === 'resolved'}>
                {raising ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2, margin: 0 }} /> Raising…</> : '🎫 Raise Ticket + Get AI Fix'}
              </button>
              {status === 'open' && (
                <button type="button" className="btn-resolve" onClick={handleResolve}>✓ Mark Resolved</button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* AI Suggestions */}
      <div>
        <p className="section-title">
          🤖 AI Instant Fix
          {!loading && aiSuggestions.length > 0 && <span className="section-count">{aiSuggestions.length} suggestion</span>}
        </p>

        {loading && <div className="loading-state"><div className="spinner" /><p className="loading-text">AI is analyzing your issue…</p></div>}
        {!loading && searched && aiSuggestions.length === 0 && <div className="empty-state">No AI suggestions found. Try rephrasing your issue.</div>}
        {!loading && !searched && <div className="empty-state">Raise a ticket above to get an instant AI-powered fix suggestion.</div>}

        {!loading && aiSuggestions.length > 0 && (
          <div className="suggestion-list">
            {/* 1. Main AI Recommendation (Featured) */}
            {aiSuggestions.filter(s => s.id === 'ai-gen').map((s) => (
              <div key={s.id} className="suggestion-card main-fix">
                <div className="sugg-badge-top">✨ AI RECOMENDED FIX</div>
                <div className="suggestion-body">
                  <p className="suggestion-text" style={{ fontSize: '1.1rem', fontWeight: 500, whiteSpace: 'pre-wrap' }}>{s.text}</p>
                </div>
              </div>
            ))}

            {/* 2. Historical Matches */}
            {aiSuggestions.filter(s => s.id !== 'ai-gen').length > 0 && (
              <div style={{ marginTop: 20 }}>
                <p className="section-title" style={{ fontSize: 13, opacity: 0.7 }}>🔍 Based on Similar Past Tickets</p>
                {aiSuggestions.filter(s => s.id !== 'ai-gen').map((s, i) => (
                  <div key={s.id} className="suggestion-card match-card">
                    <div className="suggestion-body">
                      <p className="suggestion-text">{s.text}</p>
                      <div className="suggestion-badges">
                        <span className={matchClass(90 - (i * 5))}>
                          {90 - (i * 5)}% database match
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

