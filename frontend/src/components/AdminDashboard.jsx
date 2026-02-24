import React, { useState, useEffect } from 'react';
import { getAllTickets, resolveTicketWithComment, getResolutions, getAnalytics, loadSession } from '../api.js';

const STATUS_CLASS = { open: 'pill-open', Open: 'pill-open', resolved: 'pill-resolved', Resolved: 'pill-resolved', 'in-progress': 'pill-medium' };
const PRIORITY_CLASS = { high: 'pill-high', High: 'pill-high', medium: 'pill-medium', Medium: 'pill-medium', low: 'pill-low', Low: 'pill-low' };

function pct(part, total) { return total === 0 ? 0 : Math.round((part / total) * 100); }

function Bar({ label, count, total, color }) {
  const w = pct(count, total);
  return (
    <div className="bar-row">
      <span className="bar-label">{label}</span>
      <div className="bar-track"><div className="bar-fill" style={{ width: `${w}%`, background: color }} /></div>
      <span className="bar-count">{count} <span className="bar-pct">({w}%)</span></span>
    </div>
  );
}

/* ── Analytics ── */
function AnalyticsView({ analyticsData, tickets, loading }) {
  if (loading) return <div className="loading-state"><div className="spinner" /><p className="loading-text">Loading analytics…</p></div>;

  // Use backend analytics if available, otherwise compute from tickets
  const total = analyticsData?.total_tickets ?? tickets.length;
  const resolved = analyticsData?.resolved ?? tickets.filter(t => t.status === 'Resolved' || t.status === 'resolved').length;
  const open = analyticsData?.open ?? tickets.filter(t => t.status === 'Open' || t.status === 'open').length;
  const high = tickets.filter(t => t.priority === 'High' || t.priority === 'high').length;
  const medium = tickets.filter(t => t.priority === 'Medium' || t.priority === 'medium').length;
  const low = tickets.filter(t => t.priority === 'Low' || t.priority === 'low').length;
  const resRate = pct(resolved, total);

  // Category breakdown from backend or tickets
  let cats = [];
  if (analyticsData?.categories && Array.isArray(analyticsData.categories)) {
    cats = analyticsData.categories.map(c => [c.name || c.category, c.count]);
  } else {
    const catMap = {};
    tickets.forEach(t => { const k = t.category || 'Other'; catMap[k] = (catMap[k] || 0) + 1; });
    cats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  }

  return (
    <div>
      <div className="kpi-grid">
        <div className="kpi-card" style={{ borderTopColor: '#6366f1' }}><p className="kpi-value" style={{ color: '#6366f1' }}>{total}</p><p className="kpi-label">Total</p></div>
        <div className="kpi-card" style={{ borderTopColor: '#f59e0b' }}><p className="kpi-value" style={{ color: '#f59e0b' }}>{open}</p><p className="kpi-label">Open</p><p className="kpi-sub">{pct(open, total)}% of total</p></div>
        <div className="kpi-card" style={{ borderTopColor: '#22c55e' }}><p className="kpi-value" style={{ color: '#22c55e' }}>{resolved}</p><p className="kpi-label">Resolved</p><p className="kpi-sub">{resRate}% rate</p></div>
        <div className="kpi-card" style={{ borderTopColor: '#ef4444' }}><p className="kpi-value" style={{ color: '#ef4444' }}>{high}</p><p className="kpi-label">High Priority</p></div>
      </div>
      <div className="analytics-grid">
        <div className="analytics-panel">
          <div className="analytics-panel-header"><span className="analytics-panel-icon">📊</span><span className="analytics-panel-title">Status Breakdown</span></div>
          <div className="donut-wrap">
            <svg viewBox="0 0 36 36" className="donut-svg">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--surface2)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#22c55e" strokeWidth="3"
                strokeDasharray={`${resRate} ${100 - resRate}`} strokeDashoffset="25" strokeLinecap="round" />
            </svg>
            <div className="donut-label"><span className="donut-pct">{resRate}%</span><span className="donut-sub">Resolved</span></div>
          </div>
          <div style={{ marginTop: 16 }}>
            <Bar label="Open" count={open} total={total} color="#f59e0b" />
            <Bar label="Resolved" count={resolved} total={total} color="#22c55e" />
          </div>
        </div>
        <div className="analytics-panel">
          <div className="analytics-panel-header"><span className="analytics-panel-icon">🎯</span><span className="analytics-panel-title">Priority Breakdown</span></div>
          <div style={{ marginTop: 28 }}>
            <Bar label="High" count={high} total={total} color="#ef4444" />
            <Bar label="Medium" count={medium} total={total} color="#3b82f6" />
            <Bar label="Low" count={low} total={total} color="#94a3b8" />
          </div>
        </div>
      </div>
      {cats.length > 0 && (
        <div className="analytics-panel" style={{ marginTop: 14 }}>
          <div className="analytics-panel-header"><span className="analytics-panel-icon">🗂️</span><span className="analytics-panel-title">Category Breakdown</span></div>
          <div style={{ marginTop: 12 }}>{cats.map(([cat, c]) => <Bar key={cat} label={cat} count={c} total={total} color="#6366f1" />)}</div>
        </div>
      )}
    </div>
  );
}

/* ── Resolve Modal ── */
function ResolveModal({ ticket, adminId, onClose, onSaved }) {
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!comment.trim()) { setError('Please enter a resolution comment.'); return; }
    setSaving(true);
    try {
      const res = await resolveTicketWithComment(ticket.id || ticket.ticket_id, comment.trim(), adminId);
      onSaved(ticket.id || ticket.ticket_id, res);
      onClose();
    } catch (e) {
      setError(e.message || 'Failed to save. Please try again.');
    } finally { setSaving(false); }
  };

  const tid = ticket.id || ticket.ticket_id;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Resolve Ticket <span className="ticket-id">#{tid}</span></h2>
            <p className="modal-sub">{ticket.user_name || ticket.user} — {ticket.description || ticket.issue}</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Resolution Comment <span style={{ color: '#ef4444' }}>*</span></label>
            <textarea className="form-textarea" rows={5}
              placeholder="Steps taken, root cause, or workaround applied…"
              value={comment} onChange={e => { setComment(e.target.value); setError(''); }}
              autoFocus />
            <p className="char-count">{comment.length} characters</p>
          </div>
          {error && <div className="alert-error"><span>⚠️</span> {error}</div>}
          <div className="modal-preview">
            <p className="modal-preview-label">Will be saved as:</p>
            <div className="modal-preview-row"><span>Ticket ID</span><strong>#{tid}</strong></div>
            <div className="modal-preview-row"><span>Status</span><strong style={{ color: '#4ade80' }}>Resolved ✓</strong></div>
            <div className="modal-preview-row"><span>Resolved By</span><strong>Admin (ID: {adminId})</strong></div>
            <div className="modal-preview-row"><span>AI Training</span><strong style={{ color: '#818cf8' }}>Auto-triggered ✓</strong></div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn-save-resolve" onClick={handleSave} disabled={saving || !comment.trim()}>
            {saving ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Saving…</> : '✓ Save & Train AI'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── AdminDashboard ── */
export default function AdminDashboard() {
  const [tickets, setTickets] = useState([]);
  const [analyticsData, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setTab] = useState('tickets');
  const [filter, setFilter] = useState('all');
  const [resolutions, setResolutions] = useState({});
  const [resolveTarget, setResolveTarget] = useState(null);
  const [error, setError] = useState('');

  const session = loadSession();
  const adminId = session?.id;

  useEffect(() => {
    const saved = getResolutions();
    setResolutions(saved);

    Promise.all([
      getAllTickets().catch(() => []),
      getAnalytics().catch(() => null),
    ]).then(([ticketData, analytics]) => {
      const merged = Array.isArray(ticketData)
        ? ticketData.map(t => saved[t.id || t.ticket_id]
          ? { ...t, status: 'Resolved' } : t)
        : [];
      setTickets(merged);
      setAnalytics(analytics);
    }).catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleResolutionSaved = (ticketId, resolution) => {
    setTickets(prev => prev.map(t =>
      (t.id || t.ticket_id) === ticketId ? { ...t, status: 'Resolved' } : t
    ));
    setResolutions(prev => ({ ...prev, [ticketId]: resolution }));
  };

  const isResolved = (t) => t.status === 'Resolved' || t.status === 'resolved';

  const visible = filter === 'all' ? tickets
    : filter === 'resolved' ? tickets.filter(t => isResolved(t))
      : tickets.filter(t => !isResolved(t));

  const counts = {
    all: tickets.length,
    open: tickets.filter(t => !isResolved(t)).length,
    resolved: tickets.filter(t => isResolved(t)).length,
  };

  return (
    <div>
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1 className="dash-title">Admin Dashboard</h1>
          <p className="dash-sub">
            {loading ? 'Loading…' : `${tickets.length} tickets · ${counts.open} open · ${counts.resolved} resolved`}
          </p>
        </div>
        <div className="filter-tabs">
          <button className={`filter-tab${activeTab === 'tickets' ? ' active' : ''}`} onClick={() => setTab('tickets')}>🗒️ Tickets</button>
          <button className={`filter-tab${activeTab === 'analytics' ? ' active' : ''}`} onClick={() => setTab('analytics')}>📈 Analytics</button>
        </div>
      </div>

      {error && <div className="alert-error" style={{ marginBottom: 16 }}><span>⚠️</span> {error}</div>}

      {/* Analytics tab */}
      {activeTab === 'analytics' && (
        <AnalyticsView analyticsData={analyticsData} tickets={tickets} loading={loading} />
      )}

      {/* Tickets tab */}
      {activeTab === 'tickets' && (
        <>
          <div style={{ marginBottom: 14 }}>
            <div className="filter-tabs" style={{ display: 'inline-flex' }}>
              {['all', 'open', 'resolved'].map(f => (
                <button key={f} className={`filter-tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
                  {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f] ?? 0})
                </button>
              ))}
            </div>
          </div>

          <div className="table-card">
            {loading ? (
              <div className="loading-state"><div className="spinner" /><p className="loading-text">Loading tickets…</p></div>
            ) : (
              <>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th><th>User</th><th>Issue</th><th>Category</th>
                        <th>Status</th><th>Priority</th><th>Date</th><th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.length === 0 ? (
                        <tr className="empty-row"><td colSpan={8}>No tickets match this filter.</td></tr>
                      ) : visible.map(t => {
                        const tid = t.id || t.ticket_id;
                        const res = resolutions[tid];
                        const resolved = isResolved(t);
                        return (
                          <tr key={tid}>
                            <td><span className="ticket-id">#{tid}</span></td>
                            <td className="td-user">{t.user_name || t.user || '—'}</td>
                            <td className="td-issue" title={t.description || t.issue}>{t.description || t.issue}</td>
                            <td><span className="pill pill-medium" style={{ opacity: 0.8 }}>{t.category || '—'}</span></td>
                            <td><span className={`pill ${STATUS_CLASS[t.status] || 'pill-low'}`}>{t.status}</span></td>
                            <td><span className={`pill ${PRIORITY_CLASS[t.priority] || 'pill-low'}`}>{t.priority}</span></td>
                            <td className="td-date">{t.created_at || t.date || '—'}</td>
                            <td>
                              {resolved ? (
                                <span className="resolved-tag">
                                  ✓ Resolved
                                  {res && <span className="resolved-by"> by {res.resolvedBy}</span>}
                                </span>
                              ) : (
                                <button className="btn-resolve-admin" onClick={() => setResolveTarget(t)}>
                                  Resolve
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="table-footer">
                  <p className="table-footer-text">
                    Showing <strong>{visible.length}</strong> of {tickets.length} tickets
                    {Object.keys(resolutions).length > 0 && (
                      <span style={{ marginLeft: 10, color: '#4ade80' }}>
                        · {Object.keys(resolutions).length} resolved this session
                      </span>
                    )}
                  </p>
                  <div className="pagination">
                    <button className="btn-page">← Prev</button>
                    <button className="btn-page btn-page-active">Next →</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Resolve Modal */}
      {resolveTarget && (
        <ResolveModal
          ticket={resolveTarget}
          adminId={adminId}
          onClose={() => setResolveTarget(null)}
          onSaved={handleResolutionSaved}
        />
      )}
    </div>
  );
}