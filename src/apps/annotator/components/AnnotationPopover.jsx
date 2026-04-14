import React, { useState } from 'react';

const COLORS = [
  { name: 'yellow', var: 'var(--hl-yellow)' },
  { name: 'green', var: 'var(--hl-green)' },
  { name: 'blue', var: 'var(--hl-blue)' },
  { name: 'pink', var: 'var(--hl-pink)' },
  { name: 'orange', var: 'var(--hl-orange)' },
];

export default function AnnotationPopover({ position, onSave, onCancel }) {
  const [color, setColor] = useState('yellow');
  const [comment, setComment] = useState('');
  const [showComment, setShowComment] = useState(false);

  if (!position) return null;

  const handleSave = () => {
    onSave({ color, comment: comment.trim() });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSave();
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <>
      <div style={styles.backdrop} onClick={onCancel} />
      <div
        style={{
          ...styles.popover,
          top: position.y,
          left: position.x,
        }}
        onKeyDown={handleKeyDown}
      >
        <div style={styles.colorRow}>
          {COLORS.map((c) => (
            <button
              key={c.name}
              onClick={() => setColor(c.name)}
              style={{
                ...styles.colorDot,
                background: c.var,
                outline: color === c.name ? `2px solid var(--accent)` : '2px solid transparent',
                outlineOffset: 2,
              }}
              title={c.name}
            />
          ))}
          <div style={{ flex: 1 }} />
          {!showComment && (
            <button
              style={styles.commentToggle}
              onClick={() => setShowComment(true)}
            >
              + Note
            </button>
          )}
        </div>

        {showComment && (
          <textarea
            autoFocus
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a note…"
            style={styles.textarea}
            rows={3}
          />
        )}

        <div style={styles.actions}>
          <button style={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>
          <button style={styles.saveBtn} onClick={handleSave}>
            {showComment ? 'Save' : 'Highlight'}
          </button>
        </div>
      </div>
    </>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 999,
  },
  popover: {
    position: 'fixed',
    zIndex: 1000,
    width: 280,
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-secondary)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-popover)',
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    animation: 'popIn 150ms ease forwards',
  },
  colorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'transform var(--transition-fast)',
    border: '1px solid var(--border-primary)',
    flexShrink: 0,
  },
  commentToggle: {
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--accent)',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 'var(--radius-sm)',
    transition: 'background var(--transition-fast)',
    whiteSpace: 'nowrap',
  },
  textarea: {
    width: '100%',
    padding: '8px 10px',
    fontSize: 13,
    lineHeight: 1.5,
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    resize: 'vertical',
    outline: 'none',
    fontFamily: 'var(--font-body)',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 6,
  },
  cancelBtn: {
    padding: '6px 14px',
    fontSize: 13,
    fontWeight: 500,
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    transition: 'background var(--transition-fast)',
  },
  saveBtn: {
    padding: '6px 16px',
    fontSize: 13,
    fontWeight: 600,
    borderRadius: 'var(--radius-md)',
    background: 'var(--accent)',
    color: '#fff',
    transition: 'background var(--transition-fast)',
  },
};
