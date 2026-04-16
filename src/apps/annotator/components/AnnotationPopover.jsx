import React, { useState } from 'react';

const COLORS = [
  { name: 'yellow', var: 'var(--hl-yellow)' },
  { name: 'green', var: 'var(--hl-green)' },
  { name: 'blue', var: 'var(--hl-blue)' },
  { name: 'pink', var: 'var(--hl-pink)' },
  { name: 'orange', var: 'var(--hl-orange)' },
];

const TYPES = [
  { name: 'note', label: 'Note', emoji: '📝' },
  { name: 'question', label: 'Question', emoji: '❓' },
  { name: 'todo', label: 'To-do', emoji: '☑️' },
  { name: 'key-point', label: 'Key point', emoji: '⭐' },
  { name: 'disagree', label: 'Disagree', emoji: '⚡' },
];

export default function AnnotationPopover({ position, selectedText, onSave, onCancel, onSuggest, onFootnote, onBookmark }) {
  const [color, setColor] = useState('yellow');
  const [type, setType] = useState('note');
  const [comment, setComment] = useState('');
  const [showComment, setShowComment] = useState(false);
  const [mode, setMode] = useState('highlight'); // highlight | suggest | footnote

  if (!position) return null;

  const handleSave = () => {
    if (mode === 'suggest') {
      onSuggest?.({ originalText: selectedText, suggestedText: comment.trim(), comment: '' });
    } else if (mode === 'footnote') {
      onFootnote?.({ anchorText: selectedText, content: comment.trim() });
    } else {
      onSave({ color, type, comment: comment.trim() });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave();
    if (e.key === 'Escape') onCancel();
  };

  return (
    <>
      <div style={S.backdrop} onClick={onCancel} />
      <div style={{ ...S.popover, top: position.y, left: position.x }} onKeyDown={handleKeyDown}>
        {/* Mode tabs */}
        <div style={S.modeRow}>
          {[
            { id: 'highlight', label: '🖍 Highlight' },
            { id: 'suggest', label: '✏️ Suggest' },
            { id: 'footnote', label: '📌 Footnote' },
          ].map((m) => (
            <button key={m.id} style={{ ...S.modeBtn, ...(mode === m.id ? S.modeBtnActive : {}) }}
              onClick={() => { setMode(m.id); if (m.id !== 'highlight') setShowComment(true); }}>{m.label}</button>
          ))}
          {onBookmark && (
            <button style={S.modeBtn} onClick={() => { onBookmark({ text: selectedText, label: '' }); onCancel(); }}>⭐ Bookmark</button>
          )}
        </div>

        {mode === 'highlight' && (
          <>
            <div style={S.colorRow}>
              {COLORS.map((c) => (
                <button key={c.name} onClick={() => setColor(c.name)}
                  style={{ ...S.colorDot, background: c.var, outline: color === c.name ? '2px solid var(--accent)' : '2px solid transparent', outlineOffset: 2 }}
                  title={c.name} />
              ))}
              <div style={{ flex: 1 }} />
              {!showComment && <button style={S.commentToggle} onClick={() => setShowComment(true)}>+ Note</button>}
            </div>

            <div style={S.typeRow}>
              {TYPES.map((t) => (
                <button key={t.name} onClick={() => setType(t.name)}
                  style={{ ...S.typeChip, ...(type === t.name ? S.typeChipActive : {}) }}>
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </>
        )}

        {mode === 'suggest' && (
          <p style={S.hint}>Replace "<em>{selectedText?.slice(0, 40)}{selectedText?.length > 40 ? '…' : ''}</em>" with:</p>
        )}

        {mode === 'footnote' && (
          <p style={S.hint}>Footnote at "<em>{selectedText?.slice(0, 40)}{selectedText?.length > 40 ? '…' : ''}</em>":</p>
        )}

        {(showComment || mode !== 'highlight') && (
          <textarea autoFocus value={comment} onChange={(e) => setComment(e.target.value)}
            placeholder={mode === 'suggest' ? 'Replacement text…' : mode === 'footnote' ? 'Footnote content…' : 'Add a note…'}
            style={S.textarea} rows={3} />
        )}

        <div style={S.actions}>
          <button style={S.cancelBtn} onClick={onCancel}>Cancel</button>
          <button style={{ ...S.saveBtn, opacity: (mode !== 'highlight' && !comment.trim()) ? 0.4 : 1 }} onClick={handleSave}>
            {mode === 'suggest' ? 'Suggest' : mode === 'footnote' ? 'Add Footnote' : showComment ? 'Save' : 'Highlight'}
          </button>
        </div>
      </div>
    </>
  );
}

const S = {
  backdrop: { position: 'fixed', inset: 0, zIndex: 999 },
  popover: { position: 'fixed', zIndex: 1000, width: 320, background: 'var(--bg-surface)', border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-popover)', padding: 14, display: 'flex', flexDirection: 'column', gap: 10, animation: 'popIn 150ms ease forwards' },
  modeRow: { display: 'flex', gap: 4, flexWrap: 'wrap' },
  modeBtn: { padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', cursor: 'pointer', transition: 'all 120ms ease', border: '1px solid transparent', whiteSpace: 'nowrap' },
  modeBtnActive: { background: 'var(--accent-subtle)', color: 'var(--accent)', borderColor: 'var(--accent)' },
  colorRow: { display: 'flex', alignItems: 'center', gap: 8 },
  colorDot: { width: 24, height: 24, borderRadius: '50%', cursor: 'pointer', transition: 'transform 120ms', border: '1px solid var(--border-primary)', flexShrink: 0 },
  typeRow: { display: 'flex', gap: 4, flexWrap: 'wrap' },
  typeChip: { padding: '3px 8px', fontSize: 11, fontWeight: 500, borderRadius: 99, border: '1px solid var(--border-primary)', color: 'var(--text-secondary)', background: 'transparent', cursor: 'pointer', transition: 'all 120ms', whiteSpace: 'nowrap' },
  typeChipActive: { background: 'var(--accent-subtle)', color: 'var(--accent)', borderColor: 'var(--accent)' },
  commentToggle: { fontSize: 12, fontWeight: 500, color: 'var(--accent)', cursor: 'pointer', padding: '4px 8px', borderRadius: 'var(--radius-sm)', whiteSpace: 'nowrap' },
  hint: { fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 },
  textarea: { width: '100%', padding: '8px 10px', fontSize: 13, lineHeight: 1.5, border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--text-primary)', resize: 'vertical', outline: 'none', fontFamily: 'var(--font-body)' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 6 },
  cancelBtn: { padding: '6px 14px', fontSize: 13, fontWeight: 500, borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)' },
  saveBtn: { padding: '6px 16px', fontSize: 13, fontWeight: 600, borderRadius: 'var(--radius-md)', background: 'var(--accent)', color: '#fff' },
};
