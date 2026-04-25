import React, { useState, useEffect } from 'react';

export default function SummaryDialog({ open, summary, onSave, onClose }) {
  const [text, setText] = useState(summary || '');

  useEffect(() => { if (open) setText(summary || ''); }, [open, summary]);

  if (!open) return null;

  return (
    <>
      <div style={S.backdrop} onClick={onClose} />
      <div style={S.dialog}>
        <div style={S.header}>
          <h3 style={S.title}>Document Summary</h3>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>
        <p style={S.desc}>A personal summary or abstract for this note. Exports into Word's document properties and as a summary block at the top.</p>
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a summary of this document…"
          style={S.textarea}
          rows={5}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { onSave(text.trim()); onClose(); } if (e.key === 'Escape') onClose(); }}
        />
        <div style={S.actions}>
          <button style={S.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={S.saveBtn} onClick={() => { onSave(text.trim()); onClose(); }}>Save Summary</button>
        </div>
      </div>
    </>
  );
}

const S = {
  backdrop: { position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(3px)', animation: 'fadeIn 150ms ease' },
  dialog: { position: 'fixed', zIndex: 2001, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 480, maxWidth: 'calc(100vw - 32px)', background: 'var(--bg-surface)', border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)', padding: 24, display: 'flex', flexDirection: 'column', gap: 14, animation: 'popIn 200ms ease forwards' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 17, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', margin: 0 },
  closeBtn: { background: 'none', border: 'none', fontSize: 16, color: 'var(--text-tertiary)', cursor: 'pointer', padding: '4px 8px', borderRadius: 'var(--radius-sm)' },
  desc: { fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 },
  textarea: { width: '100%', padding: '10px 12px', fontSize: 14, lineHeight: 1.6, border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--text-primary)', resize: 'vertical', outline: 'none', fontFamily: 'var(--font-body)' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 8 },
  cancelBtn: { padding: '8px 16px', fontSize: 13, fontWeight: 500, borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' },
  saveBtn: { padding: '8px 20px', fontSize: 13, fontWeight: 600, borderRadius: 'var(--radius-md)', background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' },
};
