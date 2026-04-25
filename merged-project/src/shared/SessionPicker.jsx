import React, { useState } from 'react';

// A few friendly suggestions so she doesn't have to invent one
const SUGGESTIONS = ['maman', 'mes-notes', 'bureau', 'maison'];

export default function SessionPicker({ onPick }) {
  const [name, setName] = useState('');

  const handlePick = (n) => {
    const val = (n || name).trim().toLowerCase();
    if (val) onPick(val);
  };

  return (
    <div style={styles.backdrop}>
      <div style={styles.card}>
        <div style={styles.iconWrap}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
        </div>

        <h2 style={styles.title}>Choose a session name</h2>
        <p style={styles.desc}>
          Your work across all tools will be saved online under this name.
          Use the same name on any device to pick up where you left off.
        </p>

        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z0-9\-_]/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && handlePick()}
          placeholder="e.g. maman"
          style={styles.input}
          maxLength={30}
        />

        <div style={styles.suggestions}>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              style={styles.chip}
              onClick={() => { setName(s); handlePick(s); }}
            >
              {s}
            </button>
          ))}
        </div>

        <button
          style={{
            ...styles.goBtn,
            opacity: name.trim() ? 1 : 0.4,
            pointerEvents: name.trim() ? 'auto' : 'none',
          }}
          onClick={() => handlePick()}
        >
          Start
        </button>

        <p style={styles.footnote}>
          No password needed — this name is just a bookmark for your session.
        </p>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 5000,
    background: 'var(--bg-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: 400,
    maxWidth: '100%',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-secondary)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-lg)',
    padding: '36px 32px 28px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    textAlign: 'center',
    animation: 'popIn 250ms ease forwards',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    background: 'var(--accent-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 22,
    fontWeight: 600,
    color: 'var(--text-primary)',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  desc: {
    fontSize: 14,
    lineHeight: 1.6,
    color: 'var(--text-secondary)',
    margin: 0,
    maxWidth: 320,
  },
  input: {
    width: '100%',
    padding: '11px 16px',
    fontSize: 16,
    fontWeight: 500,
    textAlign: 'center',
    border: '2px solid var(--border-primary)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    outline: 'none',
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.03em',
    transition: 'border-color var(--transition-fast)',
  },
  suggestions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  chip: {
    padding: '5px 14px',
    fontSize: 13,
    fontWeight: 500,
    fontFamily: 'var(--font-mono)',
    borderRadius: 99,
    border: '1px solid var(--border-primary)',
    color: 'var(--text-secondary)',
    background: 'var(--bg-primary)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  goBtn: {
    width: '100%',
    padding: '11px 24px',
    fontSize: 15,
    fontWeight: 600,
    borderRadius: 'var(--radius-md)',
    background: 'var(--accent)',
    color: '#fff',
    cursor: 'pointer',
    transition: 'opacity var(--transition-fast)',
    marginTop: 4,
  },
  footnote: {
    fontSize: 12,
    color: 'var(--text-tertiary)',
    margin: 0,
  },
};
