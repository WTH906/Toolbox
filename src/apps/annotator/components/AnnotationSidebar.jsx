import React, { useState } from 'react';

const COLOR_MAP = { yellow: 'var(--hl-yellow)', green: 'var(--hl-green)', blue: 'var(--hl-blue)', pink: 'var(--hl-pink)', orange: 'var(--hl-orange)' };
const TYPE_EMOJI = { note: '📝', question: '❓', todo: '☑️', 'key-point': '⭐', disagree: '⚡' };

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function AnnotationCard({ annotation, onUpdate, onRemove, onJump }) {
  const [editing, setEditing] = useState(false);
  const [comment, setComment] = useState(annotation.comment);
  const save = () => { onUpdate(annotation.id, { comment: comment.trim() }); setEditing(false); };
  const trunc = annotation.text.length > 100 ? annotation.text.slice(0, 100) + '…' : annotation.text;

  return (
    <div style={S.card} onClick={() => onJump(annotation.id)}>
      <div style={S.cardTop}>
        <div style={{ ...S.colorTag, background: COLOR_MAP[annotation.color] || COLOR_MAP.yellow }} />
        <span style={S.typeBadge}>{TYPE_EMOJI[annotation.type] || '📝'} {annotation.type || 'note'}</span>
        <span style={S.time}>{timeAgo(annotation.createdAt)}</span>
        <div style={{ flex: 1 }} />
        <button style={S.xBtn} onClick={(e) => { e.stopPropagation(); onRemove(annotation.id); }} title="Delete">✕</button>
      </div>
      <p style={S.quote}>"{trunc}"</p>
      {editing ? (
        <div style={S.editWrap} onClick={(e) => e.stopPropagation()}>
          <textarea autoFocus value={comment} onChange={(e) => setComment(e.target.value)} style={S.editArea} rows={2}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save(); if (e.key === 'Escape') { setComment(annotation.comment); setEditing(false); } }} />
          <div style={S.editActions}>
            <button style={S.editCancel} onClick={() => { setComment(annotation.comment); setEditing(false); }}>Cancel</button>
            <button style={S.editSave} onClick={save}>Save</button>
          </div>
        </div>
      ) : annotation.comment ? (
        <p style={S.comment} onClick={(e) => { e.stopPropagation(); setEditing(true); }} title="Click to edit">{annotation.comment}</p>
      ) : (
        <button style={S.addNote} onClick={(e) => { e.stopPropagation(); setEditing(true); }}>+ Add note</button>
      )}
    </div>
  );
}

function FootnoteCard({ footnote, onUpdate, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(footnote.content);
  const save = () => { onUpdate(footnote.id, { content: content.trim() }); setEditing(false); };
  return (
    <div style={S.card}>
      <div style={S.cardTop}>
        <span style={S.fnMarker}>fn</span>
        <span style={S.quote} >at: "{footnote.anchorText?.slice(0, 50)}"</span>
        <div style={{ flex: 1 }} />
        <button style={S.xBtn} onClick={() => onRemove(footnote.id)}>✕</button>
      </div>
      {editing ? (
        <div style={S.editWrap}>
          <textarea autoFocus value={content} onChange={(e) => setContent(e.target.value)} style={S.editArea} rows={2}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save(); if (e.key === 'Escape') { setContent(footnote.content); setEditing(false); } }} />
          <div style={S.editActions}>
            <button style={S.editCancel} onClick={() => { setContent(footnote.content); setEditing(false); }}>Cancel</button>
            <button style={S.editSave} onClick={save}>Save</button>
          </div>
        </div>
      ) : (
        <p style={S.comment} onClick={() => setEditing(true)}>{footnote.content}</p>
      )}
    </div>
  );
}

function SuggestionCard({ suggestion, onAccept, onReject }) {
  return (
    <div style={S.card}>
      <div style={S.cardTop}>
        <span style={{ ...S.typeBadge, background: 'rgba(68,138,255,0.12)', color: '#448aff' }}>✏️ suggestion</span>
        <span style={S.time}>{timeAgo(suggestion.createdAt)}</span>
        <div style={{ flex: 1 }} />
      </div>
      <div style={S.diffBlock}>
        <span style={S.diffDel}>{suggestion.originalText}</span>
        <span style={S.diffIns}>{suggestion.suggestedText}</span>
      </div>
      <div style={S.editActions}>
        <button style={S.editCancel} onClick={() => onReject(suggestion.id)}>Reject</button>
        <button style={S.editSave} onClick={() => onAccept(suggestion.id)}>Accept</button>
      </div>
    </div>
  );
}

function BookmarkCard({ bookmark, onRemove }) {
  return (
    <div style={S.card}>
      <div style={S.cardTop}>
        <span style={{ fontSize: 14 }}>⭐</span>
        <span style={{ ...S.quote, fontStyle: 'normal', fontWeight: 500 }}>{bookmark.text?.slice(0, 80)}</span>
        <div style={{ flex: 1 }} />
        <button style={S.xBtn} onClick={() => onRemove(bookmark.id)}>✕</button>
      </div>
      {bookmark.label && <p style={S.comment}>{bookmark.label}</p>}
    </div>
  );
}

const TABS = [
  { id: 'annotations', label: 'Highlights', icon: '🖍' },
  { id: 'suggestions', label: 'Suggests', icon: '✏️' },
  { id: 'footnotes', label: 'Footnotes', icon: '📌' },
  { id: 'bookmarks', label: 'Bookmarks', icon: '⭐' },
];

export default function AnnotationSidebar({
  annotations, footnotes = [], bookmarks = [], suggestions = [],
  onUpdate, onRemove, onJump, open,
  onUpdateFootnote, onRemoveFootnote,
  onRemoveBookmark,
  onAcceptSuggestion, onRejectSuggestion,
}) {
  const [tab, setTab] = useState('annotations');

  if (!open) return null;

  const counts = {
    annotations: annotations.length,
    suggestions: suggestions.length,
    footnotes: footnotes.length,
    bookmarks: bookmarks.length,
  };

  const total = counts.annotations + counts.suggestions + counts.footnotes + counts.bookmarks;

  return (
    <aside style={S.sidebar}>
      <div style={S.header}>
        <h3 style={S.title}>Sidebar</h3>
        <span style={S.count}>{total}</span>
      </div>

      <div style={S.tabBar}>
        {TABS.map((t) => (
          <button key={t.id}
            style={{ ...S.tabBtn, ...(tab === t.id ? S.tabBtnActive : {}) }}
            onClick={() => setTab(t.id)}
            title={t.label}>
            {t.icon}
            {counts[t.id] > 0 && <span style={S.tabCount}>{counts[t.id]}</span>}
          </button>
        ))}
      </div>

      <div style={S.list}>
        {tab === 'annotations' && (
          annotations.length === 0
            ? <EmptyState text="Select text to create a highlight" />
            : annotations.map((a) => <AnnotationCard key={a.id} annotation={a} onUpdate={onUpdate} onRemove={onRemove} onJump={onJump} />)
        )}
        {tab === 'suggestions' && (
          suggestions.length === 0
            ? <EmptyState text='Select text and choose "Suggest" to propose a change' />
            : suggestions.map((s) => <SuggestionCard key={s.id} suggestion={s} onAccept={onAcceptSuggestion} onReject={onRejectSuggestion} />)
        )}
        {tab === 'footnotes' && (
          footnotes.length === 0
            ? <EmptyState text='Select text and choose "Footnote" to add one' />
            : footnotes.map((f) => <FootnoteCard key={f.id} footnote={f} onUpdate={onUpdateFootnote} onRemove={onRemoveFootnote} />)
        )}
        {tab === 'bookmarks' && (
          bookmarks.length === 0
            ? <EmptyState text='Select text and choose "Bookmark" to save a passage' />
            : bookmarks.map((b) => <BookmarkCard key={b.id} bookmark={b} onRemove={onRemoveBookmark} />)
        )}
      </div>
    </aside>
  );
}

function EmptyState({ text }) {
  return (
    <div style={S.empty}>
      <p style={S.emptyText}>{text}</p>
    </div>
  );
}

const S = {
  sidebar: { width: 320, minWidth: 320, height: '100%', background: 'var(--bg-surface)', borderLeft: '1px solid var(--border-secondary)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 },
  header: { display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px 8px', },
  title: { fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.01em', margin: 0 },
  count: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 22, height: 22, borderRadius: 99, background: 'var(--accent-subtle)', color: 'var(--accent)', fontSize: 12, fontWeight: 600, padding: '0 6px' },
  tabBar: { display: 'flex', gap: 2, padding: '0 12px 8px', borderBottom: '1px solid var(--border-secondary)' },
  tabBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '6px 4px', fontSize: 13, borderRadius: 'var(--radius-sm)', color: 'var(--text-tertiary)', cursor: 'pointer', transition: 'all 120ms', background: 'transparent' },
  tabBtnActive: { background: 'var(--accent-subtle)', color: 'var(--accent)' },
  tabCount: { fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', minWidth: 16, textAlign: 'center' },
  list: { flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 },
  card: { padding: 12, background: 'var(--bg-primary)', border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'border-color 120ms', display: 'flex', flexDirection: 'column', gap: 8 },
  cardTop: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  colorTag: { width: 10, height: 10, borderRadius: '50%', border: '1px solid var(--border-primary)', flexShrink: 0 },
  typeBadge: { fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 99, background: 'var(--accent-subtle)', color: 'var(--accent)', whiteSpace: 'nowrap' },
  fnMarker: { fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99, background: 'var(--accent-subtle)', color: 'var(--accent)', fontFamily: 'var(--font-mono)' },
  time: { fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' },
  xBtn: { fontSize: 12, color: 'var(--text-tertiary)', cursor: 'pointer', padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: 'transparent', border: 'none', lineHeight: 1 },
  quote: { fontSize: 13, lineHeight: 1.5, color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 },
  comment: { fontSize: 13, lineHeight: 1.5, color: 'var(--text-primary)', cursor: 'text', padding: '6px 8px', background: 'var(--accent-surface)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent)', margin: 0 },
  addNote: { fontSize: 12, fontWeight: 500, color: 'var(--text-tertiary)', padding: '4px 0', cursor: 'pointer', textAlign: 'left', background: 'none', border: 'none' },
  editWrap: { display: 'flex', flexDirection: 'column', gap: 6 },
  editArea: { width: '100%', padding: '6px 8px', fontSize: 13, lineHeight: 1.5, border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)', color: 'var(--text-primary)', resize: 'vertical', outline: 'none', fontFamily: 'var(--font-body)' },
  editActions: { display: 'flex', justifyContent: 'flex-end', gap: 4 },
  editCancel: { padding: '4px 10px', fontSize: 12, color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: 'none', border: 'none' },
  editSave: { padding: '4px 10px', fontSize: 12, fontWeight: 600, color: '#fff', background: 'var(--accent)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: 'none' },
  diffBlock: { display: 'flex', flexDirection: 'column', gap: 4, padding: '6px 8px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: 13, lineHeight: 1.5 },
  diffDel: { textDecoration: 'line-through', color: '#d04040', opacity: 0.8 },
  diffIns: { color: '#3a9a3a', fontWeight: 500 },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', gap: 16, textAlign: 'center' },
  emptyText: { fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.6, maxWidth: 220, margin: 0 },
};
