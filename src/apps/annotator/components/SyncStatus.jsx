import React from 'react';

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 10) return 'just now';
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

const STATUS_CONFIG = {
  idle: { label: 'Not saved yet', color: 'var(--text-tertiary)', dot: 'var(--text-tertiary)' },
  saving: { label: 'Saving…', color: 'var(--text-secondary)', dot: 'var(--accent)' },
  saved: { label: 'Saved', color: 'var(--text-tertiary)', dot: '#5cb85c' },
  local: { label: 'Saved locally', color: 'var(--text-tertiary)', dot: '#e8a838' },
  error: { label: 'Sync error', color: '#d9534f', dot: '#d9534f' },
  loading: { label: 'Loading…', color: 'var(--text-secondary)', dot: 'var(--accent)' },
};

export default function SyncStatus({ sessionName, syncStatus, lastSavedAt, onChangeSession }) {
  if (!sessionName) return null;

  const cfg = STATUS_CONFIG[syncStatus] || STATUS_CONFIG.idle;
  const ago = lastSavedAt ? timeAgo(lastSavedAt) : '';

  return (
    <div style={styles.bar}>
      <div style={styles.left}>
        <span style={{ ...styles.dot, background: cfg.dot }} />
        <span style={{ ...styles.status, color: cfg.color }}>{cfg.label}</span>
        {syncStatus === 'saved' && ago && (
          <span style={styles.ago}>{ago}</span>
        )}
      </div>

      <div style={styles.right}>
        <span style={styles.sessionLabel}>session:</span>
        <button style={styles.sessionName} onClick={onChangeSession} title="Change session">
          {sessionName}
        </button>
      </div>
    </div>
  );
}

const styles = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 30,
    padding: '0 16px',
    background: 'var(--bg-toolbar)',
    borderTop: '1px solid var(--border-secondary)',
    flexShrink: 0,
    zIndex: 50,
    gap: 12,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    flexShrink: 0,
    transition: 'background var(--transition-base)',
  },
  status: {
    fontSize: 12,
    fontWeight: 500,
    transition: 'color var(--transition-base)',
  },
  ago: {
    fontSize: 11,
    color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-mono)',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  },
  sessionLabel: {
    fontSize: 11,
    color: 'var(--text-tertiary)',
  },
  sessionName: {
    fontSize: 12,
    fontWeight: 600,
    fontFamily: 'var(--font-mono)',
    color: 'var(--accent)',
    cursor: 'pointer',
    padding: '2px 6px',
    borderRadius: 'var(--radius-sm)',
    transition: 'background var(--transition-fast)',
    background: 'transparent',
  },
};
