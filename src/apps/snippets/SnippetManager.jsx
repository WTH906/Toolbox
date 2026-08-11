import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';

let _c = 0;
const genId = (p) => `${p}_${Date.now().toString(36)}_${++_c}`;

const DEFAULT_TAGS = [
  { id: 'stag_code', name: 'Code', color: '#448aff' },
  { id: 'stag_email', name: 'Email', color: '#ab47bc' },
  { id: 'stag_info', name: 'Info', color: '#00c853' },
];

const ICO = {
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  copy: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  search: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  tag: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1" fill="currentColor"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  x: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  folder: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  folderOpen: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 19a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4l2 3h9a2 2 0 0 1 2 2v1"/><path d="M3.5 12H21l-2.5 7H6L3.5 12z"/></svg>,
  chevDown: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>,
  chevRight: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>,
  snippet: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
};

// ══════════════════════════════════════════
//  TAG MANAGER DIALOG
// ══════════════════════════════════════════

function TagManagerDialog({ tags, onAdd, onUpdate, onDelete, onClose }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#448aff');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const inputRef = useRef(null);

  const handleAdd = () => {
    const n = name.trim();
    if (!n || tags.some(t => t.name.toLowerCase() === n.toLowerCase())) return;
    onAdd({ name: n, color });
    setName(''); setColor('#448aff'); inputRef.current?.focus();
  };
  const startEdit = (t) => { setEditId(t.id); setEditName(t.name); setEditColor(t.color); };
  const saveEdit = () => { if (editName.trim()) { onUpdate(editId, { name: editName.trim(), color: editColor }); setEditId(null); } };

  return (
    <div style={S.backdrop} onClick={onClose}>
      <div style={S.dialog} onClick={e => e.stopPropagation()}>
        <div style={S.dialogHeader}>
          <h3 style={S.dialogTitle}>{ICO.tag} Manage Tags</h3>
          <button style={S.iconBtn} onClick={onClose}>{ICO.x}</button>
        </div>
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border-secondary)' }}>
          <div style={S.addRow}>
            <input ref={inputRef} style={{ ...S.input, marginBottom: 0 }} value={name} onChange={e => setName(e.target.value)}
              placeholder="Tag name..." onKeyDown={e => e.key === 'Enter' && handleAdd()} />
            <div style={S.colorWrap}>
              <input type="color" value={color} onChange={e => setColor(e.target.value)} style={S.colorPicker} />
              <input style={{ ...S.input, width: 90, fontFamily: 'var(--font-mono)', fontSize: 12, textAlign: 'center', marginBottom: 0 }}
                value={color} onChange={e => { const v = e.target.value.startsWith('#') ? e.target.value : '#' + e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setColor(v); }}
                placeholder="#hex" maxLength={7} />
            </div>
            <button style={S.accentBtn} onClick={handleAdd}>Add</button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 20px', minHeight: 0 }}>
          {tags.length === 0 && <p style={S.emptyText}>No tags yet.</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {tags.map(tag => (
              <div key={tag.id} style={S.tagRow}>
                {editId === tag.id ? (<>
                  <input style={{ ...S.input, flex: 1, marginBottom: 0 }} value={editName} onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditId(null); }} autoFocus />
                  <div style={S.colorWrap}>
                    <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} style={S.colorPicker} />
                    <input style={{ ...S.input, width: 80, fontFamily: 'var(--font-mono)', fontSize: 11, marginBottom: 0 }}
                      value={editColor} onChange={e => setEditColor(e.target.value.startsWith('#') ? e.target.value : '#' + e.target.value)} maxLength={7} />
                  </div>
                  <button style={S.smallAccent} onClick={saveEdit}>Save</button>
                  <button style={S.smallBtn} onClick={() => setEditId(null)}>x</button>
                </>) : (<>
                  <span style={{ ...S.tagDot, background: tag.color }} />
                  <span style={S.tagName}>{tag.name}</span>
                  <span style={S.tagHex}>{tag.color}</span>
                  <div style={{ flex: 1 }} />
                  <button style={S.smallBtn} onClick={() => startEdit(tag)}>{ICO.edit}</button>
                  <button style={{ ...S.smallBtn, color: '#d04040' }} onClick={() => onDelete(tag.id)}>{ICO.trash}</button>
                </>)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
//  SNIPPET DIALOG
// ══════════════════════════════════════════

function SnippetDialog({ snippet, tags, onSave, onClose }) {
  const isEdit = snippet?.id != null;
  const [name, setName] = useState(snippet?.name || '');
  const [content, setContent] = useState(snippet?.content || '');
  const [selectedTags, setSelectedTags] = useState(snippet?.tagIds || []);
  const toggleTag = (id) => {
    if (selectedTags.includes(id)) setSelectedTags(selectedTags.filter(t => t !== id));
    else if (selectedTags.length < 5) setSelectedTags([...selectedTags, id]);
  };
  const handleSave = () => {
    if (!content.trim()) return;
    onSave({ name: name.trim() || content.trim().slice(0, 40), content: content.trim(), tagIds: selectedTags });
  };

  return (
    <div style={S.backdrop} onClick={onClose}>
      <div style={S.dialog} onClick={e => e.stopPropagation()}>
        <div style={S.dialogHeader}>
          <h3 style={S.dialogTitle}>{ICO.snippet} {isEdit ? 'Edit Snippet' : 'New Snippet'}</h3>
          <button style={S.iconBtn} onClick={onClose}>{ICO.x}</button>
        </div>
        <div style={S.dialogBody}>
          <label style={S.label}>Name <span style={S.optional}>(auto-filled from content)</span></label>
          <input style={S.input} value={name} onChange={e => setName(e.target.value)} placeholder="My snippet..." autoFocus />

          <label style={S.label}>Content</label>
          <textarea style={{ ...S.input, minHeight: 120, resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.6 }}
            value={content} onChange={e => setContent(e.target.value)} placeholder="Paste or type your snippet..." />

          <label style={S.label}>Tags <span style={S.optional}>({selectedTags.length}/5)</span></label>
          <div style={S.chipRow}>
            {tags.length === 0 && <span style={S.emptyText}>No tags yet</span>}
            {tags.map(tag => {
              const active = selectedTags.includes(tag.id);
              return (
                <button key={tag.id} onClick={() => toggleTag(tag.id)}
                  style={{ ...S.chip, background: active ? tag.color + '22' : 'transparent', borderColor: active ? tag.color : 'var(--border-primary)', color: active ? tag.color : 'var(--text-secondary)' }}>
                  <span style={{ ...S.tagDot, background: tag.color, width: 8, height: 8 }} /> {tag.name}
                </button>
              );
            })}
          </div>

          <div style={S.dialogActions}>
            <button style={S.ghostBtn} onClick={onClose}>Cancel</button>
            <button style={{ ...S.accentBtn, opacity: content.trim() ? 1 : 0.4 }} onClick={handleSave}>{isEdit ? 'Save' : 'Add Snippet'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
//  SNIPPET CARD
// ══════════════════════════════════════════

function SnippetCard({ snippet, tags, onEdit, onDelete }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const snippetTags = tags.filter(t => snippet.tagIds.includes(t.id));
  const isLong = snippet.content.length > 200;
  const displayContent = expanded ? snippet.content : snippet.content.slice(0, 200);

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={S.card}>
      <div style={S.cardTop}>
        <span style={S.cardName}>{snippet.name}</span>
        <div style={{ flex: 1 }} />
        <button style={{ ...S.smallBtn, color: copied ? 'var(--accent)' : 'var(--text-tertiary)' }} onClick={handleCopy} title="Copy">
          {copied ? 'Copied!' : ICO.copy}
        </button>
        <button style={S.smallBtn} onClick={() => onEdit(snippet)} title="Edit">{ICO.edit}</button>
        <button style={{ ...S.smallBtn, color: '#d04040' }} onClick={() => onDelete(snippet.id)} title="Delete">{ICO.trash}</button>
      </div>
      <pre style={S.cardContent}>{displayContent}{isLong && !expanded ? '...' : ''}</pre>
      {isLong && (
        <button style={S.expandBtn} onClick={() => setExpanded(v => !v)}>{expanded ? 'Show less' : 'Show more'}</button>
      )}
      {snippetTags.length > 0 && (
        <div style={S.cardTags}>
          {snippetTags.map(t => (
            <span key={t.id} style={{ ...S.miniTag, background: t.color + '18', color: t.color, borderColor: t.color + '30' }}>{t.name}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════
//  TAG FOLDER
// ══════════════════════════════════════════

function TagFolder({ tag, snippets, allTags, onEdit, onDelete, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => { if (defaultOpen) setOpen(true); }, [defaultOpen]);

  return (
    <div style={S.folder}>
      <button style={S.folderHeader} onClick={() => setOpen(v => !v)}>
        <span style={{ color: 'var(--text-tertiary)', display: 'flex' }}>{open ? ICO.chevDown : ICO.chevRight}</span>
        <span style={{ color: tag.color, display: 'flex' }}>{open ? ICO.folderOpen : ICO.folder}</span>
        <span style={S.folderName}>{tag.name}</span>
        <span style={{ ...S.folderCount, background: tag.color + '20', color: tag.color }}>{snippets.length}</span>
      </button>
      {open && (
        <div style={S.folderBody}>
          {snippets.length === 0 ? <p style={S.emptyText}>No snippets</p>
            : snippets.map(s => <SnippetCard key={s.id} snippet={s} tags={allTags} onEdit={onEdit} onDelete={onDelete} />)}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════

export default function SnippetManager({ initialData, onDataChange }) {
  const [tags, setTags] = useState(initialData?.tags || DEFAULT_TAGS);
  const [snippets, setSnippets] = useState(initialData?.snippets || []);
  const [search, setSearch] = useState('');
  const [filterTags, setFilterTags] = useState([]);
  const [showTags, setShowTags] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [toast, setToast] = useState(null);

  const flash = (m) => { setToast(m); setTimeout(() => setToast(null), 2200); };

  useEffect(() => { onDataChange?.({ tags, snippets }); }, [tags, snippets]);
  useEffect(() => {
    if (initialData?.tags) setTags(initialData.tags);
    if (initialData?.snippets) setSnippets(initialData.snippets);
  }, [initialData]);

  // Paste-and-go
  useEffect(() => {
    const onPaste = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      if (dialog) return;
      const text = (e.clipboardData || window.clipboardData)?.getData('text')?.trim();
      if (!text || text.length < 3) return;
      // Don't intercept URLs (let bookmarks handle those)
      if (/^https?:\/\//i.test(text)) return;
      e.preventDefault();
      setDialog({ add: text });
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [dialog]);

  // Tag CRUD
  const addTag = useCallback((t) => { setTags(prev => [...prev, { id: genId('stag'), ...t }]); flash(`Tag "${t.name}" created`); }, []);
  const updateTag = useCallback((id, u) => { setTags(prev => prev.map(t => t.id === id ? { ...t, ...u } : t)); }, []);
  const deleteTag = useCallback((id) => {
    setTags(prev => prev.filter(t => t.id !== id));
    setSnippets(prev => prev.map(s => ({ ...s, tagIds: s.tagIds.filter(t => t !== id) })));
  }, []);

  // Snippet CRUD
  const addSnippet = useCallback((data) => {
    setSnippets(prev => [{ id: genId('sn'), createdAt: new Date().toISOString(), ...data }, ...prev]);
    setDialog(null); flash('Snippet added');
  }, []);
  const updateSnippet = useCallback((data) => {
    setSnippets(prev => prev.map(s => s.id === dialog?.edit?.id ? { ...s, ...data } : s));
    setDialog(null); flash('Snippet updated');
  }, [dialog]);
  const deleteSnippet = useCallback((id) => {
    setSnippets(prev => prev.filter(s => s.id !== id));
    flash('Snippet deleted');
  }, []);

  const toggleFilterTag = (id) => setFilterTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);

  const filtered = useMemo(() => {
    let items = snippets;
    if (search.trim()) {
      const q = search.toLowerCase();
      const tagNameMap = new Map(tags.map(t => [t.id, t.name.toLowerCase()]));
      items = items.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.content.toLowerCase().includes(q) ||
        s.tagIds.some(tid => (tagNameMap.get(tid) || '').includes(q))
      );
    }
    if (filterTags.length > 0) {
      items = items.filter(s => filterTags.some(ft => s.tagIds.includes(ft)));
    }
    return items.slice().sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }, [snippets, tags, search, filterTags]);

  const untagged = filtered.filter(s => s.tagIds.length === 0);
  const visibleTags = filterTags.length > 0 ? tags.filter(t => filterTags.includes(t.id)) : tags;

  return (
    <div style={S.root}>
      {/* Topbar */}
      <div style={S.topbar}>
        <div style={S.topLeft}>
          <span style={{ fontSize: 20 }}>{ICO.snippet}</span>
          <span style={S.appName}>Snippets</span>
          <span style={S.count}>{snippets.length}</span>
        </div>
        <div style={S.topRight}>
          <button style={S.accentBtn} onClick={() => setDialog('add')}>{ICO.plus} New Snippet</button>
          <button style={S.outlineBtn} onClick={() => setDialog('tags')}>{ICO.tag} Manage Tags</button>
        </div>
      </div>

      {/* Search + filter */}
      <div style={S.filterBar}>
        <div style={S.searchBox}>
          <span style={{ color: 'var(--text-tertiary)', display: 'flex' }}>{ICO.search}</span>
          <input style={S.searchInput} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search snippets..." />
          {search && <button style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', padding: 2 }} onClick={() => setSearch('')}>{ICO.x}</button>}
        </div>
        <button style={{ ...S.tagToggle, ...(showTags ? S.tagToggleActive : {}) }} onClick={() => setShowTags(v => !v)}>
          {ICO.tag} Tags ({tags.length}) {showTags ? ICO.chevDown : ICO.chevRight}
        </button>
        {filterTags.length > 0 && <button style={S.clearFilter} onClick={() => setFilterTags([])}>Clear filters</button>}
      </div>
      {showTags && (
        <div style={S.tagPanel}>
          {tags.map(tag => {
            const active = filterTags.includes(tag.id);
            return (
              <button key={tag.id} onClick={() => toggleFilterTag(tag.id)}
                style={{ ...S.filterChip, background: active ? tag.color + '22' : 'transparent', borderColor: active ? tag.color : 'var(--border-primary)', color: active ? tag.color : 'var(--text-tertiary)' }}>
                <span style={{ ...S.tagDot, background: tag.color, width: 7, height: 7 }} /> {tag.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      <div style={S.content}>
        {snippets.length === 0 ? (
          <div style={S.empty}>
            <div style={{ fontSize: 48, opacity: 0.3 }}>{ICO.snippet}</div>
            <h3 style={S.emptyTitle}>No snippets yet</h3>
            <p style={S.emptyDesc}>Click "New Snippet" or paste any text here to save it.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={S.empty}><p style={S.emptyDesc}>No snippets match your search.</p></div>
        ) : (<>
          {visibleTags.map(tag => {
            const tagSnippets = filtered.filter(s => s.tagIds.includes(tag.id));
            if (tagSnippets.length === 0 && (filterTags.length > 0 || search.trim())) return null;
            return <TagFolder key={tag.id} tag={tag} snippets={tagSnippets} allTags={tags}
              onEdit={s => setDialog({ edit: s })} onDelete={deleteSnippet}
              defaultOpen={search.trim() ? tagSnippets.length > 0 : false} />;
          })}
          {untagged.length > 0 && (
            <TagFolder tag={{ id: '_untagged', name: 'Untagged', color: 'var(--text-tertiary)' }}
              snippets={untagged} allTags={tags} onEdit={s => setDialog({ edit: s })} onDelete={deleteSnippet}
              defaultOpen={search.trim() ? true : false} />
          )}
        </>)}
      </div>

      {/* Dialogs */}
      {dialog === 'tags' && <TagManagerDialog tags={tags} onAdd={addTag} onUpdate={updateTag} onDelete={deleteTag} onClose={() => setDialog(null)} />}
      {(dialog === 'add' || dialog?.edit || dialog?.add) && (
        <SnippetDialog
          snippet={dialog?.edit || (dialog?.add ? { content: dialog.add, name: '', tagIds: [] } : null)}
          tags={tags} onSave={dialog?.edit ? updateSnippet : addSnippet} onClose={() => setDialog(null)} />
      )}
      {toast && <div style={S.toast}>{toast}</div>}
    </div>
  );
}

// ══════════════════════════════════════════
//  STYLES
// ══════════════════════════════════════════

const S = {
  root: { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)' },
  topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52, padding: '0 20px', background: 'var(--bg-toolbar)', borderBottom: '1px solid var(--border-secondary)', flexShrink: 0, gap: 12 },
  topLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  topRight: { display: 'flex', alignItems: 'center', gap: 8 },
  appName: { fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17, color: 'var(--text-primary)' },
  count: { fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' },

  filterBar: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderBottom: '1px solid var(--border-secondary)', background: 'var(--bg-toolbar)', flexShrink: 0, flexWrap: 'wrap' },
  searchBox: { display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 240px', minWidth: 200, padding: '6px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)' },
  searchInput: { flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-body)' },
  tagToggle: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', fontSize: 12, fontWeight: 500, borderRadius: 'var(--radius-md)', cursor: 'pointer', border: '1px solid var(--border-primary)', background: 'none', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', flexShrink: 0 },
  tagToggleActive: { background: 'var(--accent-subtle)', color: 'var(--accent)', borderColor: 'var(--accent)' },
  tagPanel: { display: 'flex', gap: 5, flexWrap: 'wrap', padding: '8px 20px 12px', background: 'var(--bg-toolbar)', borderBottom: '1px solid var(--border-secondary)', flexShrink: 0, maxHeight: 200, overflowY: 'auto' },
  filterChip: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', fontSize: 12, fontWeight: 500, borderRadius: 99, cursor: 'pointer', border: '1px solid', background: 'none', fontFamily: 'var(--font-body)' },
  clearFilter: { fontSize: 11, color: 'var(--text-tertiary)', cursor: 'pointer', padding: '3px 8px', borderRadius: 99, background: 'none', border: 'none', fontFamily: 'var(--font-body)', textDecoration: 'underline' },

  content: { flex: '1 1 0', height: 0, overflowY: 'auto', padding: '16px 20px 40px', display: 'block' },

  folder: { background: 'var(--bg-surface)', border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 8 },
  folderHeader: { display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, textAlign: 'left' },
  folderName: { flex: 1 },
  folderCount: { fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', padding: '1px 7px', borderRadius: 99 },
  folderBody: { padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid var(--border-secondary)' },

  card: { padding: 12, background: 'var(--bg-primary)', border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 8 },
  cardTop: { display: 'flex', alignItems: 'center', gap: 8 },
  cardName: { fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  cardContent: { fontSize: 12, lineHeight: 1.6, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', background: 'var(--bg-secondary, var(--accent-surface))', padding: '8px 12px', borderRadius: 'var(--radius-sm)', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflow: 'hidden', borderLeft: '3px solid var(--accent)' },
  expandBtn: { fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 500, textAlign: 'left', padding: 0 },
  cardTags: { display: 'flex', gap: 4, flexWrap: 'wrap' },
  miniTag: { fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 99, border: '1px solid', whiteSpace: 'nowrap' },

  // Dialogs
  backdrop: { position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  dialog: { zIndex: 2001, width: 480, maxWidth: '100%', maxHeight: 'calc(100vh - 64px)', overflow: 'hidden', background: 'var(--bg-surface)', border: '1px solid var(--border-secondary)', borderRadius: 16, boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column' },
  dialogHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-secondary)' },
  dialogTitle: { fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 },
  dialogBody: { padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 },
  dialogActions: { display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8 },

  // Form
  label: { fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 4 },
  optional: { fontWeight: 400, color: 'var(--text-tertiary)' },
  input: { width: '100%', padding: '8px 12px', fontSize: 14, border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-body)', marginBottom: 4 },
  chipRow: { display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  chip: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', fontSize: 13, fontWeight: 500, borderRadius: 99, cursor: 'pointer', border: '1px solid', background: 'none', fontFamily: 'var(--font-body)' },
  addRow: { display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' },
  colorWrap: { display: 'flex', alignItems: 'center', gap: 4 },
  colorPicker: { width: 30, height: 30, border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', padding: 0, background: 'none' },
  tagRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-md)' },
  tagDot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  tagName: { fontSize: 14, fontWeight: 500, flex: 1 },
  tagHex: { fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' },

  // Buttons
  accentBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', fontSize: 13, fontWeight: 600, borderRadius: 'var(--radius-md)', background: 'var(--accent)', color: '#fff', cursor: 'pointer', border: 'none', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' },
  outlineBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', fontSize: 13, fontWeight: 500, borderRadius: 'var(--radius-md)', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer', border: '1px solid var(--border-primary)', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' },
  ghostBtn: { padding: '7px 16px', fontSize: 13, fontWeight: 500, borderRadius: 'var(--radius-md)', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer', border: 'none', fontFamily: 'var(--font-body)' },
  iconBtn: { background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 4, fontSize: 16 },
  smallBtn: { background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '4px 6px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center' },
  smallAccent: { padding: '4px 10px', fontSize: 12, fontWeight: 600, borderRadius: 'var(--radius-sm)', background: 'var(--accent)', color: '#fff', cursor: 'pointer', border: 'none', fontFamily: 'var(--font-body)' },

  // Empty / toast
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', gap: 12, textAlign: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', margin: 0 },
  emptyDesc: { fontSize: 14, color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.6, maxWidth: 300 },
  emptyText: { fontSize: 13, color: 'var(--text-tertiary)', margin: 0 },
  toast: { position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: '#fff', padding: '8px 20px', borderRadius: 20, fontSize: 13, fontWeight: 600, zIndex: 3000, boxShadow: 'var(--shadow-md)', whiteSpace: 'nowrap', animation: 'toast 2.2s ease forwards' },
};
