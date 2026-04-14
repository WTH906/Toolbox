import React, { useState } from 'react';

const COLOR_MAP = {
  yellow: 'var(--hl-yellow)',
  green: 'var(--hl-green)',
  blue: 'var(--hl-blue)',
  pink: 'var(--hl-pink)',
  orange: 'var(--hl-orange)',
};

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function AnnotationCard({ annotation, onUpdate, onRemove, onJump }) {
  const [editing, setEditing] = useState(false);
  const [comment, setComment] = useState(annotation.comment);

  const save = () => {
    onUpdate(annotation.id, { comment: comment.trim() });
    setEditing(false);
  };

  const truncatedText =
    annotation.text.length > 120
      ? annotation.text.slice(0, 120) + '…'
      : annotation.text;

  return (
    <div style={styles.card} onClick={() => onJump(annotation.id)}>
      <div style={styles.cardTop}>
        <div
          style={{
            ...styles.colorTag,
            background: COLOR_MAP[annotation.color] || COLOR_MAP.yellow,
          }}
        />
        <span style={styles.time}>{timeAgo(annotation.createdAt)}</span>
        <div style={{ flex: 1 }} />
        <button
          style={styles.smallBtn}
          onClick={(e) => { e.stopPropagation(); onRemove(annotation.id); }}
          title="Delete"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <p style={styles.quote}>"{truncatedText}"</p>

      {editing ? (
        <div style={styles.editWrap} onClick={(e) => e.stopPropagation()}>
          <textarea
            autoFocus
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={styles.editArea}
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save();
              if (e.key === 'Escape') { setComment(annotation.comment); setEditing(false); }
            }}
          />
          <div style={styles.editActions}>
            <button style={styles.editCancel} onClick={() => { setComment(annotation.comment); setEditing(false); }}>Cancel</button>
            <button style={styles.editSave} onClick={save}>Save</button>
          </div>
        </div>
      ) : annotation.comment ? (
        <p
          style={styles.comment}
          onClick={(e) => { e.stopPropagation(); setEditing(true); }}
          title="Click to edit"
        >
          {annotation.comment}
        </p>
      ) : (
        <button
          style={styles.addNote}
          onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        >
          + Add note
        </button>
      )}
    </div>
  );
}

export default function AnnotationSidebar({ annotations, onUpdate, onRemove, onJump, open }) {
  if (!open) return null;

  return (
    <aside style={styles.sidebar}>
      <div style={styles.header}>
        <h3 style={styles.title}>Annotations</h3>
        <span style={styles.count}>{annotations.length}</span>
      </div>

      <div style={styles.list}>
        {annotations.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <p style={styles.emptyText}>Select text in the document to create your first annotation</p>
          </div>
        ) : (
          annotations.map((a) => (
            <AnnotationCard
              key={a.id}
              annotation={a}
              onUpdate={onUpdate}
              onRemove={onRemove}
              onJump={onJump}
            />
          ))
        )}
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: 320,
    minWidth: 320,
    height: '100%',
    background: 'var(--bg-surface)',
    borderLeft: '1px solid var(--border-secondary)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    flexShrink: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '14px 16px',
    borderBottom: '1px solid var(--border-secondary)',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 16,
    fontWeight: 500,
    color: 'var(--text-primary)',
    letterSpacing: '-0.01em',
  },
  count: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 22,
    height: 22,
    borderRadius: 99,
    background: 'var(--accent-subtle)',
    color: 'var(--accent)',
    fontSize: 12,
    fontWeight: 600,
    padding: '0 6px',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  card: {
    padding: 12,
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-secondary)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  cardTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  colorTag: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    border: '1px solid var(--border-primary)',
    flexShrink: 0,
  },
  time: {
    fontSize: 11,
    color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-mono)',
  },
  smallBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
    height: 22,
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    flexShrink: 0,
  },
  quote: {
    fontSize: 13,
    lineHeight: 1.5,
    color: 'var(--text-secondary)',
    fontStyle: 'italic',
  },
  comment: {
    fontSize: 13,
    lineHeight: 1.5,
    color: 'var(--text-primary)',
    cursor: 'text',
    padding: '6px 8px',
    background: 'var(--accent-surface)',
    borderRadius: 'var(--radius-sm)',
    borderLeft: '3px solid var(--accent)',
  },
  addNote: {
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--text-tertiary)',
    padding: '4px 0',
    cursor: 'pointer',
    textAlign: 'left',
  },
  editWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  editArea: {
    width: '100%',
    padding: '6px 8px',
    fontSize: 13,
    lineHeight: 1.5,
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    resize: 'vertical',
    outline: 'none',
    fontFamily: 'var(--font-body)',
  },
  editActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 4,
  },
  editCancel: {
    padding: '4px 10px',
    fontSize: 12,
    color: 'var(--text-secondary)',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
  },
  editSave: {
    padding: '4px 10px',
    fontSize: 12,
    fontWeight: 600,
    color: '#fff',
    background: 'var(--accent)',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    gap: 16,
    textAlign: 'center',
  },
  emptyIcon: {
    opacity: 0.4,
  },
  emptyText: {
    fontSize: 13,
    color: 'var(--text-tertiary)',
    lineHeight: 1.6,
    maxWidth: 220,
  },
};
