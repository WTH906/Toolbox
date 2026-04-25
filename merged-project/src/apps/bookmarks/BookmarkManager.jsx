import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';

// ===================================================================
//  DATA HELPERS
// ===================================================================

let _c = 0;
const genId = (prefix) => `${prefix}_${Date.now().toString(36)}_${++_c}`;

const DEFAULT_TAGS = [
  { id: 'tag_dev', name: 'Dev', color: '#448aff' },
  { id: 'tag_design', name: 'Design', color: '#ab47bc' },
  { id: 'tag_reading', name: 'Reading', color: '#00c853' },
];

// ===================================================================
//  ICONS
// ===================================================================

const ICO = {
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  link: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  folder: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  folderOpen: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 19a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4l2 3h9a2 2 0 0 1 2 2v1"/><path d="M3.5 12H21l-2.5 7H6L3.5 12z"/></svg>,
  search: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  tag: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1" fill="currentColor"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  x: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  ext: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  chevDown: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>,
  chevRight: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>,
  globe: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  sun: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  moon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  upload: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
};

function getFavicon(url) {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`;
  } catch { return null; }
}

function getDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return url; }
}

// Generate a stable color from a string (for letter avatar fallback)
function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 55%, 55%)`;
}

function LetterAvatar({ name, url }) {
  const letter = (name || getDomain(url) || '?')[0].toUpperCase();
  const bg = stringToColor(url || name || '');
  return (
    <div style={{ width: 18, height: 18, borderRadius: 4, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', lineHeight: 1, fontFamily: 'var(--font-body)' }}>
      {letter}
    </div>
  );
}

// ===================================================================
//  CHROME BOOKMARK HTML PARSER
// ===================================================================

// Chrome exports bookmarks as nested <DL>/<DT>/<H3>/<A> HTML.
// Folders become tags using their full path (e.g. "Dev/Frontend").
// The top-level Chrome folders ("Bookmarks bar", "Other bookmarks")
// are skipped as tag names since they're structural, not meaningful.

const SKIP_FOLDERS = new Set([
  'bookmarks bar', 'barre de favoris', 'barre des favoris',
  'other bookmarks', 'autres favoris',
  'mobile bookmarks', 'favoris mobiles',
  'bookmarks menu', 'menu des marque-pages',
]);

function parseChromeBookmarks(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const results = []; // { url, name, folderPath }

  function walk(dlNode, pathParts) {
    if (!dlNode) return;
    const children = dlNode.children;
    for (let i = 0; i < children.length; i++) {
      const dt = children[i];
      if (dt.tagName !== 'DT') continue;

      // Check for a folder (H3 followed by DL)
      const h3 = dt.querySelector(':scope > H3');
      if (h3) {
        const folderName = h3.textContent.trim();
        const subDl = dt.querySelector(':scope > DL');
        // Skip top-level Chrome structural folders
        const isSkip = pathParts.length === 0 && SKIP_FOLDERS.has(folderName.toLowerCase());
        const nextPath = isSkip ? pathParts : [...pathParts, folderName];
        walk(subDl, nextPath);
        continue;
      }

      // Check for a link
      const a = dt.querySelector(':scope > A');
      if (a && a.href) {
        results.push({
          url: a.getAttribute('href'),
          name: a.textContent.trim() || 'Untitled',
          folderPath: pathParts.join('/'),
        });
      }
    }
  }

  // Start from all top-level DL elements
  const topDl = doc.querySelector('DL');
  walk(topDl, []);

  return results;
}

// Generate a stable color from a folder path
function folderToColor(path) {
  let hash = 0;
  for (let i = 0; i < path.length; i++) hash = path.charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 60%, 50%)`;
}

function hslToHex(hslStr) {
  const el = document.createElement('div');
  el.style.color = hslStr;
  document.body.appendChild(el);
  const rgb = getComputedStyle(el).color;
  document.body.removeChild(el);
  const m = rgb.match(/\d+/g);
  if (!m) return '#448aff';
  return '#' + m.slice(0, 3).map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
}

// ===================================================================
//  TAG MANAGER DIALOG
// ===================================================================

function TagManagerDialog({ tags, onAdd, onUpdate, onDelete, onClose }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#448aff');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const inputRef = useRef(null);

  const handleAdd = () => {
    const n = name.trim();
    if (!n) return;
    if (tags.some(t => t.name.toLowerCase() === n.toLowerCase())) return;
    onAdd({ name: n, color });
    setName('');
    setColor('#448aff');
    inputRef.current?.focus();
  };

  const startEdit = (tag) => {
    setEditId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  };

  const saveEdit = () => {
    if (!editName.trim()) return;
    onUpdate(editId, { name: editName.trim(), color: editColor });
    setEditId(null);
  };

  return (
    <div style={S.backdrop} onClick={onClose}>
      <div style={S.dialog} onClick={e => e.stopPropagation()}>
        <div style={S.dialogHeader}>
          <h3 style={S.dialogTitle}>{ICO.tag} Manage Tags</h3>
          <button style={S.iconBtn} onClick={onClose}>{ICO.x}</button>
        </div>
        {/* Add form — pinned */}
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border-secondary)' }}>
          <div style={S.addTagRow}>
            <input ref={inputRef} style={{ ...S.input, marginBottom: 0 }} value={name} onChange={e => setName(e.target.value)}
              placeholder="Tag name…" onKeyDown={e => e.key === 'Enter' && handleAdd()} />
            <div style={S.colorInputWrap}>
              <input type="color" value={color} onChange={e => setColor(e.target.value)} style={S.colorPicker} />
              <input style={{ ...S.input, width: 90, fontFamily: 'var(--font-mono)', fontSize: 12, textAlign: 'center', marginBottom: 0 }}
                value={color} onChange={e => { if (/^#?[0-9a-fA-F]{0,6}$/.test(e.target.value.replace('#', ''))) setColor(e.target.value.startsWith('#') ? e.target.value : '#' + e.target.value); }}
                placeholder="#hex" maxLength={7} />
            </div>
            <button style={S.accentBtn} onClick={handleAdd}>Add</button>
          </div>
        </div>
        {/* Tag list — scrolls */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 20px', minHeight: 0 }}>
          {tags.length === 0 && <p style={S.emptyText}>No tags yet. Create one above.</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {tags.map(tag => (
              <div key={tag.id} style={S.tagRow}>
                {editId === tag.id ? (
                  <>
                    <input style={{ ...S.input, flex: 1, marginBottom: 0 }} value={editName} onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditId(null); }} autoFocus />
                    <div style={S.colorInputWrap}>
                      <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} style={S.colorPicker} />
                      <input style={{ ...S.input, width: 80, fontFamily: 'var(--font-mono)', fontSize: 11, marginBottom: 0 }}
                        value={editColor} onChange={e => setEditColor(e.target.value.startsWith('#') ? e.target.value : '#' + e.target.value)} maxLength={7} />
                    </div>
                    <button style={S.smallAccentBtn} onClick={saveEdit}>Save</button>
                    <button style={S.smallBtn} onClick={() => setEditId(null)}>✕</button>
                  </>
                ) : (
                  <>
                    <span style={{ ...S.tagDot, background: tag.color }} />
                    <span style={S.tagName}>{tag.name}</span>
                    <span style={S.tagHex}>{tag.color}</span>
                    <div style={{ flex: 1 }} />
                    <button style={S.smallBtn} onClick={() => startEdit(tag)} title="Edit">{ICO.edit}</button>
                    <button style={{ ...S.smallBtn, color: '#d04040' }} onClick={() => onDelete(tag.id)} title="Delete">{ICO.trash}</button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================================================================
//  ADD / EDIT BOOKMARK DIALOG
// ===================================================================

function BookmarkDialog({ bookmark, tags, recentTagIds = [], onSave, onClose }) {
  const isEdit = bookmark?.id != null; // paste-and-go has no id
  const [url, setUrl] = useState(bookmark?.url || '');
  const [name, setName] = useState(bookmark?.name || '');
  const [notes, setNotes] = useState(bookmark?.notes || '');
  const [selectedTags, setSelectedTags] = useState(bookmark?.tagIds || []);

  // Sort tags: recent first, then the rest
  const sortedTags = useMemo(() => {
    if (!recentTagIds.length) return tags;
    const recent = [];
    const rest = [];
    for (const tag of tags) {
      if (recentTagIds.includes(tag.id)) recent.push(tag);
      else rest.push(tag);
    }
    // Keep recent in the order they appear in recentTagIds
    recent.sort((a, b) => recentTagIds.indexOf(a.id) - recentTagIds.indexOf(b.id));
    return [...recent, ...rest];
  }, [tags, recentTagIds]);

  const hasRecent = recentTagIds.length > 0 && tags.length > recentTagIds.length;

  const toggleTag = (id) => {
    if (selectedTags.includes(id)) setSelectedTags(selectedTags.filter(t => t !== id));
    else if (selectedTags.length < 5) setSelectedTags([...selectedTags, id]);
  };

  const handleSave = () => {
    const u = url.trim();
    const n = name.trim() || getDomain(u);
    if (!u) return;
    // Auto-add protocol
    const finalUrl = /^https?:\/\//i.test(u) ? u : 'https://' + u;
    onSave({ url: finalUrl, name: n, notes: notes.trim(), tagIds: selectedTags });
  };

  // Auto-fill name from URL domain
  useEffect(() => {
    if (!isEdit && url && !name) {
      try { setName(getDomain(url)); } catch { /* ignore */ }
    }
  }, [url]);

  return (
    <div style={S.backdrop} onClick={onClose}>
      <div style={S.dialog} onClick={e => e.stopPropagation()}>
        <div style={S.dialogHeader}>
          <h3 style={S.dialogTitle}>{ICO.link} {isEdit ? 'Edit Bookmark' : 'Add Bookmark'}</h3>
          <button style={S.iconBtn} onClick={onClose}>{ICO.x}</button>
        </div>
        <div style={S.dialogBody}>
          <label style={S.label}>URL</label>
          <input style={S.input} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com" autoFocus
            onKeyDown={e => e.key === 'Enter' && handleSave()} />

          <label style={S.label}>Name</label>
          <input style={S.input} value={name} onChange={e => setName(e.target.value)} placeholder="My bookmark"
            onKeyDown={e => e.key === 'Enter' && handleSave()} />

          <label style={S.label}>Tags <span style={S.optional}>({selectedTags.length}/5)</span></label>
          <div style={S.tagChipRow}>
            {tags.length === 0 && <span style={S.emptyText}>No tags yet — create some in Manage Tags</span>}
            {sortedTags.map((tag, i) => {
              const active = selectedTags.includes(tag.id);
              const isFirstNonRecent = hasRecent && i === recentTagIds.length;
              return (
                <React.Fragment key={tag.id}>
                  {isFirstNonRecent && <div style={S.tagDivider} />}
                  <button
                    style={{
                      ...S.tagChip,
                      background: active ? tag.color + '22' : 'transparent',
                      borderColor: active ? tag.color : 'var(--border-primary)',
                      color: active ? tag.color : 'var(--text-secondary)',
                    }}
                    onClick={() => toggleTag(tag.id)}>
                    <span style={{ ...S.tagDot, background: tag.color, width: 8, height: 8 }} />
                    {tag.name}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          <label style={S.label}>Notes <span style={S.optional}>(optional)</span></label>
          <textarea style={{ ...S.input, minHeight: 60, resize: 'vertical', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}
            value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Add a note about this bookmark…" rows={3} />

          <div style={S.dialogActions}>
            <button style={S.ghostBtn} onClick={onClose}>Cancel</button>
            <button style={{ ...S.accentBtn, opacity: url.trim() ? 1 : 0.4 }} onClick={handleSave}>
              {isEdit ? 'Save Changes' : 'Add Bookmark'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================================================================
//  BOOKMARK CARD
// ===================================================================

function BookmarkCard({ bookmark, tags, onEdit, onDelete }) {
  const favicon = getFavicon(bookmark.url);
  const domain = getDomain(bookmark.url);
  const bookmarkTags = tags.filter(t => bookmark.tagIds.includes(t.id));
  const [faviconOk, setFaviconOk] = useState(true);

  return (
    <div style={S.card}>
      <div style={S.cardMain}>
        <div style={S.cardIcon}>
          {favicon && faviconOk
            ? <img src={favicon} width="18" height="18" style={{ borderRadius: 3 }} alt="" onError={() => setFaviconOk(false)} />
            : <LetterAvatar name={bookmark.name} url={bookmark.url} />
          }
        </div>
        <div style={S.cardInfo}>
          <a href={bookmark.url} target="_blank" rel="noopener noreferrer" style={S.cardName}>
            {bookmark.name}
            <span style={S.cardExt}>{ICO.ext}</span>
          </a>
          <span style={S.cardDomain}>{domain}</span>
        </div>
        <div style={S.cardActions}>
          <button style={S.smallBtn} onClick={() => onEdit(bookmark)} title="Edit">{ICO.edit}</button>
          <button style={{ ...S.smallBtn, color: '#d04040' }} onClick={() => onDelete(bookmark.id)} title="Delete">{ICO.trash}</button>
        </div>
      </div>
      {bookmark.notes && (
        <p style={S.cardNotes}>{bookmark.notes}</p>
      )}
      {bookmarkTags.length > 0 && (
        <div style={S.cardTags}>
          {bookmarkTags.map(t => (
            <span key={t.id} style={{ ...S.miniTag, background: t.color + '18', color: t.color, borderColor: t.color + '30' }}>
              {t.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ===================================================================
//  TAG FOLDER
// ===================================================================

function TagFolder({ tag, bookmarks, allTags, onEdit, onDelete, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const count = bookmarks.length;

  return (
    <div style={S.folder}>
      <button style={S.folderHeader} onClick={() => setOpen(v => !v)}>
        <span style={S.folderChev}>{open ? ICO.chevDown : ICO.chevRight}</span>
        <span style={{ ...S.folderIcon, color: tag.color }}>{open ? ICO.folderOpen : ICO.folder}</span>
        <span style={S.folderName}>{tag.name}</span>
        <span style={{ ...S.folderCount, background: tag.color + '20', color: tag.color }}>{count}</span>
      </button>
      {open && (
        <div style={S.folderBody}>
          {bookmarks.length === 0 ? (
            <p style={S.folderEmpty}>No bookmarks with this tag</p>
          ) : (
            bookmarks.map(bm => (
              <BookmarkCard key={bm.id} bookmark={bm} tags={allTags} onEdit={onEdit} onDelete={onDelete} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ===================================================================
//  MAIN COMPONENT
// ===================================================================

export default function BookmarkManager({ initialData, onDataChange }) {
  const [tags, setTags] = useState(initialData?.tags || DEFAULT_TAGS);
  const [bookmarks, setBookmarks] = useState(initialData?.bookmarks || []);
  const [search, setSearch] = useState('');
  const [filterTags, setFilterTags] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [dialog, setDialog] = useState(null); // null | 'add' | 'tags' | { edit: bookmark } | { add: url }
  const [toast, setToast] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const importRef = useRef(null);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // ── Paste-and-go: detect URL paste anywhere, auto-open Add dialog ──
  useEffect(() => {
    const onPaste = (e) => {
      // Don't intercept if user is typing in an input/textarea or a dialog is open
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      if (dialog) return;

      const text = (e.clipboardData || window.clipboardData)?.getData('text')?.trim();
      if (!text) return;
      // Check if it looks like a URL
      if (/^https?:\/\//i.test(text) || /^[a-z0-9][\w.-]*\.[a-z]{2,}/i.test(text)) {
        e.preventDefault();
        const url = /^https?:\/\//i.test(text) ? text : 'https://' + text;
        setDialog({ add: url });
      }
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [dialog]);

  // Notify parent of changes for cloud sync
  const dataRef = useRef({ tags, bookmarks });
  useEffect(() => {
    dataRef.current = { tags, bookmarks };
    onDataChange?.({ tags, bookmarks });
  }, [tags, bookmarks, onDataChange]);

  // Restore from initial data when it changes (cloud load)
  useEffect(() => {
    if (initialData?.tags) setTags(initialData.tags);
    if (initialData?.bookmarks) setBookmarks(initialData.bookmarks);
  }, [initialData]);

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  // ── Tag CRUD ──
  const addTag = useCallback((t) => {
    const tag = { id: genId('tag'), ...t };
    setTags(prev => [...prev, tag]);
    flash(`Tag "${t.name}" created`);
  }, []);

  const updateTag = useCallback((id, updates) => {
    setTags(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const deleteTag = useCallback((id) => {
    setTags(prev => prev.filter(t => t.id !== id));
    // Remove from bookmarks
    setBookmarks(prev => prev.map(bm => ({ ...bm, tagIds: bm.tagIds.filter(t => t !== id) })));
  }, []);

  // ── Bookmark CRUD ──
  const addBookmark = useCallback((data) => {
    const bm = { id: genId('bm'), createdAt: new Date().toISOString(), ...data };
    setBookmarks(prev => [bm, ...prev]);
    setDialog(null);
    flash('Bookmark added');
  }, []);

  const updateBookmark = useCallback((data) => {
    setBookmarks(prev => prev.map(bm => bm.id === dialog?.edit?.id ? { ...bm, ...data } : bm));
    setDialog(null);
    flash('Bookmark updated');
  }, [dialog]);

  const deleteBookmark = useCallback((id) => {
    setBookmarks(prev => prev.filter(bm => bm.id !== id));
    flash('Bookmark deleted');
  }, []);

  // ── Chrome import ──
  const handleChromeImport = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = parseChromeBookmarks(ev.target.result);
        if (!parsed.length) { flash('No bookmarks found in file'); return; }

        // Collect unique folder paths and create tags for them
        const folderPaths = [...new Set(parsed.map(b => b.folderPath).filter(Boolean))];
        const existingTagNames = new Map(tags.map(t => [t.name.toLowerCase(), t]));
        const newTags = [];

        for (const path of folderPaths) {
          if (!existingTagNames.has(path.toLowerCase())) {
            const tag = { id: genId('tag'), name: path, color: hslToHex(folderToColor(path)) };
            newTags.push(tag);
            existingTagNames.set(path.toLowerCase(), tag);
          }
        }

        const allTags = [...tags, ...newTags];

        // Build a name→id lookup
        const tagByName = new Map(allTags.map(t => [t.name.toLowerCase(), t.id]));

        // Dedupe against existing bookmarks by URL
        const existingUrls = new Set(bookmarks.map(b => b.url.toLowerCase()));

        const newBookmarks = [];
        for (const b of parsed) {
          if (existingUrls.has(b.url.toLowerCase())) continue;
          existingUrls.add(b.url.toLowerCase());

          const tagIds = [];
          if (b.folderPath) {
            const tid = tagByName.get(b.folderPath.toLowerCase());
            if (tid) tagIds.push(tid);
          }

          newBookmarks.push({
            id: genId('bm'),
            url: b.url,
            name: b.name,
            notes: '',
            tagIds,
            createdAt: new Date().toISOString(),
          });
        }

        if (newTags.length) setTags(allTags);
        if (newBookmarks.length) setBookmarks(prev => [...newBookmarks, ...prev]);

        flash(`Imported ${newBookmarks.length} bookmark${newBookmarks.length !== 1 ? 's' : ''}${newTags.length ? ` + ${newTags.length} tag${newTags.length !== 1 ? 's' : ''}` : ''}`);
      } catch (err) {
        console.error('Import failed:', err);
        flash('Import failed — is this a Chrome bookmarks HTML file?');
      }
    };
    reader.readAsText(file);
  }, [tags, bookmarks]);

  // ── Filtering ──
  const toggleFilterTag = (id) => {
    setFilterTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const filtered = useMemo(() => {
    let bms = bookmarks;
    if (search.trim()) {
      const q = search.toLowerCase();
      const tagsById = new Map(tags.map(t => [t.id, t.name.toLowerCase()]));
      bms = bms.filter(bm =>
        bm.name.toLowerCase().includes(q)
        || bm.url.toLowerCase().includes(q)
        || (bm.notes || '').toLowerCase().includes(q)
        || bm.tagIds.some(id => (tagsById.get(id) || '').includes(q))
      );
    }
    if (filterTags.length > 0) {
      bms = bms.filter(bm => filterTags.some(ft => bm.tagIds.includes(ft)));
    }
    return bms.slice().sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }, [bookmarks, tags, search, filterTags]);

  // Untagged bookmarks
  const untagged = filtered.filter(bm => bm.tagIds.length === 0);

  // Recent tags: 3 most recently used tag IDs (from newest bookmarks)
  const recentTagIds = useMemo(() => {
    const seen = new Set();
    const recent = [];
    const sorted = [...bookmarks].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    for (const bm of sorted) {
      for (const tid of bm.tagIds) {
        if (!seen.has(tid)) { seen.add(tid); recent.push(tid); }
        if (recent.length >= 3) return recent;
      }
    }
    return recent;
  }, [bookmarks]);

  // Determine which tags to show folders for
  const visibleTags = filterTags.length > 0
    ? tags.filter(t => filterTags.includes(t.id))
    : tags;

  return (
    <div style={S.root}>
      {/* ── Top bar ── */}
      <div style={S.topbar}>
        <div style={S.topLeft}>
          <span style={S.logo}>🔖</span>
          <span style={S.appName}>Bookmarks</span>
          <span style={S.count}>{bookmarks.length}</span>
        </div>
        <div style={S.topRight}>
          <button style={S.accentBtn} onClick={() => setDialog('add')}>
            {ICO.plus} Add Bookmark
          </button>
          <button style={S.outlineBtn} onClick={() => importRef.current?.click()}>
            {ICO.upload} Import
          </button>
          <input ref={importRef} type="file" accept=".html,.htm" onChange={handleChromeImport} style={{ display: 'none' }} />
          <button style={S.outlineBtn} onClick={() => setDialog('tags')}>
            {ICO.tag} Manage Tags
          </button>
          <button style={S.themeBtn} onClick={() => setDarkMode(v => !v)} title="Toggle theme">
            {darkMode ? ICO.sun : ICO.moon}
          </button>
        </div>
      </div>

      {/* ── Search + filter bar ── */}
      <div style={S.filterBar}>
        <div style={S.searchBox}>
          <span style={S.searchIcon}>{ICO.search}</span>
          <input style={S.searchInput} value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search bookmarks…" />
          {search && <button style={S.clearSearch} onClick={() => setSearch('')}>{ICO.x}</button>}
        </div>
        <button
          style={{
            ...S.filterToggle,
            background: showFilters ? 'var(--bg-primary)' : 'transparent',
            color: filterTags.length > 0 ? 'var(--accent)' : 'var(--text-secondary)',
            borderColor: filterTags.length > 0 ? 'var(--accent)' : 'var(--border-primary)',
          }}
          onClick={() => setShowFilters(v => !v)}
          title={showFilters ? 'Hide tag filters' : 'Show tag filters'}>
          {ICO.tag}
          <span>Tags</span>
          {filterTags.length > 0 && (
            <span style={S.filterToggleBadge}>{filterTags.length}</span>
          )}
          <span style={S.folderChev}>{showFilters ? ICO.chevDown : ICO.chevRight}</span>
        </button>
        {showFilters && (
          <div style={S.filterTags}>
            {tags.map(tag => {
              const active = filterTags.includes(tag.id);
              return (
                <button key={tag.id}
                  style={{
                    ...S.filterChip,
                    background: active ? tag.color + '22' : 'transparent',
                    borderColor: active ? tag.color : 'var(--border-primary)',
                    color: active ? tag.color : 'var(--text-tertiary)',
                  }}
                  onClick={() => toggleFilterTag(tag.id)}>
                  <span style={{ ...S.tagDot, background: tag.color, width: 7, height: 7 }} />
                  {tag.name}
                </button>
              );
            })}
            {filterTags.length > 0 && (
              <button style={S.clearFilter} onClick={() => setFilterTags([])}>Clear</button>
            )}
          </div>
        )}
      </div>

      {/* ── Main content: tag folders ── */}
      <div style={S.content}>
        {bookmarks.length === 0 ? (
          <div style={S.emptyState}>
            <div style={S.emptyIcon}>🔖</div>
            <h3 style={S.emptyTitle}>No bookmarks yet</h3>
            <p style={S.emptyDesc}>Click "Add Bookmark" to save your first link.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={S.emptyState}>
            <p style={S.emptyDesc}>No bookmarks match your search or filters.</p>
          </div>
        ) : (
          <>
            {visibleTags.map(tag => {
              const tagBookmarks = filtered.filter(bm => bm.tagIds.includes(tag.id));
              if (tagBookmarks.length === 0 && (filterTags.length > 0 || search.trim())) return null;
              return (
                <TagFolder
                  key={tag.id}
                  tag={tag}
                  bookmarks={tagBookmarks}
                  allTags={tags}
                  onEdit={(bm) => setDialog({ edit: bm })}
                  onDelete={deleteBookmark}
                  defaultOpen={tagBookmarks.length > 0}
                />
              );
            })}
            {untagged.length > 0 && (
              <TagFolder
                tag={{ id: '_untagged', name: 'Untagged', color: 'var(--text-tertiary)' }}
                bookmarks={untagged}
                allTags={tags}
                onEdit={(bm) => setDialog({ edit: bm })}
                onDelete={deleteBookmark}
                defaultOpen={true}
              />
            )}
          </>
        )}
      </div>

      {/* ── Dialogs ── */}
      {dialog === 'tags' && (
        <TagManagerDialog tags={tags} onAdd={addTag} onUpdate={updateTag} onDelete={deleteTag} onClose={() => setDialog(null)} />
      )}
      {(dialog === 'add' || dialog?.edit || dialog?.add) && (
        <BookmarkDialog
          bookmark={dialog?.edit || (dialog?.add ? { url: dialog.add, name: '', notes: '', tagIds: [] } : null)}
          tags={tags}
          recentTagIds={recentTagIds}
          onSave={dialog?.edit ? updateBookmark : addBookmark}
          onClose={() => setDialog(null)}
        />
      )}

      {/* ── Toast ── */}
      {toast && <div style={S.toast}>{toast}</div>}
    </div>
  );
}

// ===================================================================
//  STYLES — uses CSS vars from the toolbox global.css
// ===================================================================

const S = {
  root: {
    flex: 1, display: 'flex', flexDirection: 'column',
    minHeight: 0, overflow: 'hidden',
    background: 'var(--bg-primary)', color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
  },

  // ── Top bar ──
  topbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    height: 52, padding: '0 20px', background: 'var(--bg-toolbar)',
    borderBottom: '1px solid var(--border-secondary)', flexShrink: 0, gap: 12,
  },
  topLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  topRight: { display: 'flex', alignItems: 'center', gap: 8 },
  themeBtn: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 36, height: 36, borderRadius: 'var(--radius-md)', cursor: 'pointer',
    color: 'var(--text-secondary)', background: 'none', border: '1px solid var(--border-primary)',
    transition: 'all 120ms',
  },
  logo: { fontSize: 20, lineHeight: 1 },
  appName: {
    fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17,
    color: 'var(--text-primary)', letterSpacing: '-0.01em',
  },
  count: {
    fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)',
    color: 'var(--text-tertiary)',
  },

  // ── Filter bar ──
  filterBar: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px',
    borderBottom: '1px solid var(--border-secondary)', background: 'var(--bg-toolbar)',
    flexShrink: 0, flexWrap: 'wrap',
  },
  searchBox: {
    display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 240px', minWidth: 200,
    padding: '6px 12px', background: 'var(--bg-primary)',
    border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)',
  },
  searchIcon: { color: 'var(--text-tertiary)', display: 'flex', flexShrink: 0 },
  searchInput: {
    flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: 13,
    color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
  },
  clearSearch: {
    background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer',
    display: 'flex', padding: 2, borderRadius: 4,
  },
  filterTags: {
    display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center',
    maxHeight: 96, overflowY: 'auto', flex: '1 1 100%', minWidth: 0,
  },
  filterToggle: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px',
    fontSize: 13, fontWeight: 500, borderRadius: 'var(--radius-md)',
    cursor: 'pointer', border: '1px solid var(--border-primary)',
    fontFamily: 'var(--font-body)', flexShrink: 0,
    transition: 'all 120ms',
  },
  filterToggleBadge: {
    fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)',
    padding: '1px 6px', borderRadius: 99, background: 'var(--accent)',
    color: 'var(--bg-primary)', minWidth: 16, textAlign: 'center',
  },
  filterChip: {
    display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px',
    fontSize: 12, fontWeight: 500, borderRadius: 99, cursor: 'pointer',
    border: '1px solid var(--border-primary)', transition: 'all 120ms',
    background: 'none', fontFamily: 'var(--font-body)',
  },
  clearFilter: {
    fontSize: 11, color: 'var(--text-tertiary)', cursor: 'pointer',
    padding: '3px 8px', borderRadius: 99, background: 'none', border: 'none',
    fontFamily: 'var(--font-body)', textDecoration: 'underline',
  },

  // ── Content ──
  content: {
    flex: '1 1 0', minHeight: 0, height: 0,
    overflowY: 'auto', padding: '16px 20px 40px',
    display: 'block',
  },

  // ── Folder ──
  folder: {
    background: 'var(--bg-surface)', border: '1px solid var(--border-secondary)',
    borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 8,
  },
  folderHeader: {
    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
    padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 14,
    fontWeight: 600, transition: 'background 120ms', textAlign: 'left',
  },
  folderChev: { display: 'flex', color: 'var(--text-tertiary)', flexShrink: 0 },
  folderIcon: { display: 'flex', flexShrink: 0 },
  folderName: { flex: 1, letterSpacing: '-0.01em' },
  folderCount: {
    fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)',
    padding: '1px 7px', borderRadius: 99, flexShrink: 0,
  },
  folderBody: {
    padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 6,
    borderTop: '1px solid var(--border-secondary)',
  },
  folderEmpty: { fontSize: 13, color: 'var(--text-tertiary)', padding: '12px 4px', margin: 0 },

  // ── Card ──
  card: {
    display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 12px',
    background: 'var(--bg-primary)', border: '1px solid var(--border-secondary)',
    borderRadius: 'var(--radius-md)', transition: 'border-color 120ms',
  },
  cardMain: { display: 'flex', alignItems: 'center', gap: 10 },
  cardIcon: {
    width: 28, height: 28, borderRadius: 'var(--radius-sm)',
    background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', flexShrink: 0, color: 'var(--text-tertiary)',
  },
  cardInfo: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 },
  cardName: {
    fontSize: 14, fontWeight: 500, color: 'var(--text-primary)',
    textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  cardExt: { opacity: 0.35, display: 'inline-flex', transition: 'opacity 120ms' },
  cardDomain: {
    fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  cardActions: { display: 'flex', gap: 2, opacity: 0.4, transition: 'opacity 120ms' },
  cardNotes: {
    fontSize: 12, lineHeight: 1.5, color: 'var(--text-secondary)',
    padding: '4px 8px', margin: '0 0 0 38px', background: 'var(--accent-surface)',
    borderRadius: 'var(--radius-sm)', borderLeft: '2px solid var(--accent)',
    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
  },
  cardTags: { display: 'flex', gap: 4, flexWrap: 'wrap', paddingLeft: 38 },
  miniTag: {
    fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 99,
    border: '1px solid', whiteSpace: 'nowrap',
  },

  // ── Buttons ──
  accentBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px',
    fontSize: 13, fontWeight: 600, borderRadius: 'var(--radius-md)',
    background: 'var(--accent)', color: '#fff', cursor: 'pointer',
    border: 'none', fontFamily: 'var(--font-body)', transition: 'filter 120ms',
    whiteSpace: 'nowrap',
  },
  outlineBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px',
    fontSize: 13, fontWeight: 500, borderRadius: 'var(--radius-md)',
    background: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
    border: '1px solid var(--border-primary)', fontFamily: 'var(--font-body)',
    transition: 'all 120ms', whiteSpace: 'nowrap',
  },
  ghostBtn: {
    padding: '7px 16px', fontSize: 13, fontWeight: 500, borderRadius: 'var(--radius-md)',
    background: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
    border: 'none', fontFamily: 'var(--font-body)',
  },
  iconBtn: {
    background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer',
    padding: 4, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center',
  },
  smallBtn: {
    background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer',
    padding: '4px 6px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center',
    transition: 'color 120ms',
  },
  smallAccentBtn: {
    padding: '4px 10px', fontSize: 12, fontWeight: 600, borderRadius: 'var(--radius-sm)',
    background: 'var(--accent)', color: '#fff', cursor: 'pointer', border: 'none',
    fontFamily: 'var(--font-body)',
  },

  // ── Dialog ──
  backdrop: {
    position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.35)',
    backdropFilter: 'blur(3px)', animation: 'fadeIn 150ms ease',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
  },
  dialog: {
    zIndex: 2001, width: 480, maxWidth: '100%',
    background: 'var(--bg-surface)', border: '1px solid var(--border-secondary)',
    borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)',
    display: 'flex', flexDirection: 'column', animation: 'popIn 200ms ease forwards',
    maxHeight: 'calc(100vh - 64px)', overflow: 'hidden',
  },
  dialogHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px', borderBottom: '1px solid var(--border-secondary)',
  },
  dialogTitle: {
    fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-display)',
    color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8,
  },
  dialogBody: { padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 },
  dialogActions: { display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8 },

  // ── Form ──
  label: {
    fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 4,
  },
  optional: { fontWeight: 400, color: 'var(--text-tertiary)' },
  input: {
    width: '100%', padding: '8px 12px', fontSize: 14,
    border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)',
    background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none',
    fontFamily: 'var(--font-body)', marginBottom: 4, transition: 'border-color 150ms',
  },
  tagChipRow: { display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  tagDivider: { width: 1, height: 20, background: 'var(--border-primary)', margin: '0 2px', flexShrink: 0 },
  tagChip: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px',
    fontSize: 13, fontWeight: 500, borderRadius: 99, cursor: 'pointer',
    border: '1px solid var(--border-primary)', transition: 'all 120ms',
    background: 'none', fontFamily: 'var(--font-body)',
  },

  // ── Tag manager ──
  addTagRow: { display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' },
  colorInputWrap: { display: 'flex', alignItems: 'center', gap: 4 },
  colorPicker: {
    width: 30, height: 30, border: 'none', borderRadius: 'var(--radius-sm)',
    cursor: 'pointer', padding: 0, background: 'none',
  },
  tagList: {
    display: 'flex', flexDirection: 'column', gap: 6,
    maxHeight: 300, overflowY: 'auto', paddingTop: 8,
  },
  tagRow: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
    background: 'var(--bg-primary)', border: '1px solid var(--border-secondary)',
    borderRadius: 'var(--radius-md)',
  },
  tagDot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  tagName: { fontSize: 14, fontWeight: 500, flex: 1 },
  tagHex: { fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' },

  // ── Empty ──
  emptyState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '64px 24px', gap: 12, textAlign: 'center',
  },
  emptyIcon: { fontSize: 48, opacity: 0.3 },
  emptyTitle: {
    fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-display)',
    color: 'var(--text-primary)', margin: 0,
  },
  emptyDesc: { fontSize: 14, color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.6, maxWidth: 300 },
  emptyText: { fontSize: 13, color: 'var(--text-tertiary)', margin: 0 },

  // ── Toast ──
  toast: {
    position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
    background: 'var(--accent)', color: '#fff', padding: '8px 20px',
    borderRadius: 20, fontSize: 13, fontWeight: 600, zIndex: 3000,
    boxShadow: 'var(--shadow-md)', whiteSpace: 'nowrap',
    animation: 'toast 2.2s ease forwards',
  },
};
