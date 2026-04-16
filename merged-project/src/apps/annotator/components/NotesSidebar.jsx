import React from 'react';

const FILE_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const OBSIDIAN_DOT = (
  <span style={{
    width: 6, height: 6, borderRadius: '50%',
    background: 'var(--accent)', display: 'inline-block', flexShrink: 0,
  }} />
);

export default function NotesSidebar({ notes, activeId, onSwitch, onClose }) {
  return (
    <nav style={styles.sidebar}>
      <div style={styles.header}>
        <h4 style={styles.title}>Notes</h4>
        <span style={styles.count}>{notes.length}</span>
      </div>

      <div style={styles.list}>
        {notes.map((note) => {
          const isActive = note.id === activeId;
          const annCount = note.annotations?.length || 0;
          const name = note.fileName?.replace(/\.md$/, '') || 'Untitled';

          return (
            <div
              key={note.id}
              style={{
                ...styles.item,
                background: isActive ? 'var(--accent-subtle)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
              }}
              onClick={() => onSwitch(note.id)}
            >
              <div style={styles.itemTop}>
                <span style={styles.icon}>{FILE_ICON}</span>
                <span style={{
                  ...styles.name,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}>
                  {name}
                </span>
                {note.fromObsidian && OBSIDIAN_DOT}
                <button
                  style={styles.closeBtn}
                  onClick={(e) => { e.stopPropagation(); onClose(note.id); }}
                  title="Close note"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {annCount > 0 && (
                <span style={styles.badge}>
                  {annCount} annotation{annCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}

const styles = {
  sidebar: {
    width: 220,
    minWidth: 220,
    height: '100%',
    background: 'var(--bg-surface)',
    borderRight: '1px solid var(--border-secondary)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    flexShrink: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '14px 14px 10px',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-primary)',
    letterSpacing: '-0.01em',
    margin: 0,
  },
  count: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-mono)',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 6px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  item: {
    padding: '8px 10px',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    transition: 'background var(--transition-fast)',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  itemTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    minWidth: 0,
  },
  icon: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    color: 'var(--text-tertiary)',
  },
  name: {
    flex: 1,
    fontSize: 13,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    lineHeight: 1.3,
  },
  closeBtn: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-tertiary)',
    opacity: 0.5,
    cursor: 'pointer',
    transition: 'opacity var(--transition-fast)',
  },
  badge: {
    fontSize: 10,
    fontWeight: 500,
    color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-mono)',
    paddingLeft: 21,
  },
};
