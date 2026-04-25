import React from 'react';

export default function DropZone({ active }) {
  if (!active) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.inner}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <p style={styles.text}>Drop your <strong>.md</strong> file here</p>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    background: 'var(--bg-drop)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'fadeIn 150ms ease',
  },
  inner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    padding: '48px 64px',
    borderRadius: 'var(--radius-xl)',
    border: '2px dashed var(--accent)',
    background: 'var(--bg-surface)',
    boxShadow: 'var(--shadow-lg)',
  },
  text: {
    fontSize: 16,
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-display)',
  },
};
