import React, { useState, useEffect, useMemo } from 'react';

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return "yesterday";
  return `${Math.floor(diff / 86400)}d ago`;
}

function getDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return ''; }
}

export default function ReadingList({ items = [], onToggleRead, onRemove, onSaveToBookmarks, onDataChange }) {
  const [filter, setFilter] = useState('all'); // all | unread | read
  const [toast, setToast] = useState(null);
  const flash = (m) => { setToast(m); setTimeout(() => setToast(null), 2200); };

  const filtered = useMemo(() => {
    if (filter === 'unread') return items.filter(i => !i.read);
    if (filter === 'read') return items.filter(i => i.read);
    return items;
  }, [items, filter]);

  const unreadCount = items.filter(i => !i.read).length;

  return (
    <div style={S.root}>
      {/* Top bar */}
      <div style={S.topbar}>
        <div style={S.topLeft}>
          <span style={{ fontSize: 20 }}>&#x1F4D6;</span>
          <span style={S.appName}>Reading List</span>
          {unreadCount > 0 && <span style={S.badge}>{unreadCount} unread</span>}
        </div>
        <div style={S.filterRow}>
          {[{ id: 'all', label: 'All' }, { id: 'unread', label: 'Unread' }, { id: 'read', label: 'Read' }].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              style={{ ...S.filterBtn, ...(filter === f.id ? S.filterBtnActive : {}) }}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={S.content}>
        {items.length === 0 ? (
          <div style={S.empty}>
            <div style={{ fontSize: 48, opacity: 0.3 }}>&#x1F4D6;</div>
            <h3 style={S.emptyTitle}>No articles yet</h3>
            <p style={S.emptyDesc}>Go to My Feed and click "Read Later" on articles you want to save for later.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={S.empty}>
            <p style={S.emptyDesc}>No {filter} articles.</p>
          </div>
        ) : (
          filtered.map(item => (
            <div key={item.id} style={{ ...S.row, opacity: item.read ? 0.55 : 1 }}>
              {/* Checkbox */}
              <button onClick={() => { onToggleRead(item.id); flash(item.read ? 'Marked unread' : 'Marked as read'); }}
                style={S.checkbox} title={item.read ? "Mark unread" : "Mark as read"}>
                {item.read
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--accent)" stroke="var(--accent)" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="3"/><polyline points="9 11 12 14 16 9" stroke="#fff" strokeWidth="2.5" fill="none"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--border-primary)" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="3"/></svg>
                }
              </button>

              {/* Article info */}
              <div style={S.rowInfo}>
                <a href={item.link} target="_blank" rel="noopener noreferrer"
                  style={{ ...S.rowTitle, textDecoration: item.read ? 'line-through' : 'none' }}>
                  {item.title}
                </a>
                <div style={S.rowMeta}>
                  {item.source && <span style={S.source}>{item.source}</span>}
                  <span style={S.date}>{timeAgo(item.dateAdded)}</span>
                  <span style={S.domain}>{getDomain(item.link)}</span>
                </div>
              </div>

              {/* Actions */}
              <div style={S.rowActions}>
                <button onClick={() => { onSaveToBookmarks(item); flash('Saved to Bookmarks'); }}
                  style={S.actionBtn} title="Save to Bookmarks">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                </button>
                <button onClick={() => { onRemove(item.id); flash('Removed'); }}
                  style={{ ...S.actionBtn, color: '#d04040' }} title="Remove">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {toast && <div style={S.toast}>{toast}</div>}
    </div>
  );
}

const S = {
  root: {
    display: 'flex', flexDirection: 'column', height: '100%', width: '100%',
    background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
  },
  topbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 20px', background: 'var(--bg-toolbar)',
    borderBottom: '1px solid var(--border-secondary)', flexShrink: 0, gap: 12, flexWrap: 'wrap',
  },
  topLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  appName: { fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17, color: 'var(--text-primary)' },
  badge: {
    fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
    padding: '2px 8px', borderRadius: 99, background: 'var(--accent-subtle)', color: 'var(--accent)',
  },
  filterRow: { display: 'flex', gap: 4, background: 'var(--bg-secondary)', borderRadius: 8, padding: 3 },
  filterBtn: {
    padding: '5px 12px', fontSize: 12, fontWeight: 500, borderRadius: 6,
    border: 'none', background: 'none', color: 'var(--text-tertiary)',
    cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.12s',
  },
  filterBtnActive: { background: 'var(--bg-surface)', color: 'var(--text-primary)', boxShadow: 'var(--shadow-sm)' },
  content: {
    flex: '1 1 0', height: 0, overflowY: 'auto', padding: '8px 16px 40px',
  },
  row: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
    background: 'var(--bg-surface)', border: '1px solid var(--border-secondary)',
    borderRadius: 10, marginBottom: 6, transition: 'opacity 0.15s',
  },
  checkbox: {
    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
    display: 'flex', alignItems: 'center', flexShrink: 0,
  },
  rowInfo: { flex: 1, minWidth: 0 },
  rowTitle: {
    fontSize: 14, fontWeight: 550, color: 'var(--text-primary)', textDecoration: 'none',
    display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    lineHeight: 1.4,
  },
  rowMeta: { display: 'flex', gap: 8, alignItems: 'center', marginTop: 3, flexWrap: 'wrap' },
  source: {
    fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
    background: 'var(--accent-subtle)', color: 'var(--accent)',
    fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em',
  },
  date: { fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' },
  domain: { fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', opacity: 0.6 },
  rowActions: { display: 'flex', gap: 4, flexShrink: 0 },
  actionBtn: {
    background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer',
    padding: '6px', borderRadius: 6, display: 'flex', alignItems: 'center', transition: 'color 0.12s',
  },
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '64px 24px', gap: 12, textAlign: 'center',
  },
  emptyTitle: { fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', margin: 0 },
  emptyDesc: { fontSize: 14, color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.6, maxWidth: 300 },
  toast: {
    position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
    background: 'var(--accent)', color: '#fff', padding: '8px 20px', borderRadius: 20,
    fontSize: 13, fontWeight: 600, zIndex: 3000, boxShadow: 'var(--shadow-md)', whiteSpace: 'nowrap',
    animation: 'toast 2.2s ease forwards',
  },
};
