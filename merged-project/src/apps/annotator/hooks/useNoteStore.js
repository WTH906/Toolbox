import { useReducer, useCallback, useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

let _c = 0;
const genId = () => `n_${Date.now()}_${++_c}`;
const genItemId = (prefix) => `${prefix}_${Date.now()}_${++_c}`;

function renderHtml(md) {
  return DOMPurify.sanitize(marked.parse(md || '', { gfm: true, breaks: true }));
}

const WELCOME_MD = `# Welcome to Markdown Annotator

Open a note from Obsidian using the plugin, or import a \`.md\` file.

You can also drag-and-drop files onto this window.

Once a note is loaded, **select any text** to:
- **Highlight** it with a color and optional type label
- **Suggest** a text replacement (tracked change)
- Add a **footnote** at the cursor
- **Bookmark** a heading or paragraph
`;

function makeNote(data) {
  return {
    id: data.id || genId(),
    markdown: data.markdown || '',
    fileName: data.fileName || 'Untitled.md',
    sourceVault: data.sourceVault || null,
    sourceFolder: data.sourceFolder || null,
    vaultFolders: data.vaultFolders || [],
    fromObsidian: data.fromObsidian || false,
    annotations: data.annotations || [],
    footnotes: data.footnotes || [],
    bookmarks: data.bookmarks || [],
    suggestions: data.suggestions || [],
    summary: data.summary || '',
    openedAt: data.openedAt || new Date().toISOString(),
  };
}

// ── Helper: update active note ──
function mapActive(state, fn) {
  return {
    ...state,
    notes: state.notes.map((n) => n.id === state.activeId ? fn(n) : n),
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_NOTE': {
      const data = action.payload;
      const fileName = data.fileName || 'Untitled.md';
      const existing = state.notes.find(
        (n) => n.fileName === fileName && fileName !== 'Welcome.md' && fileName !== 'Untitled.md'
      );
      if (existing) {
        const updated = state.notes.map((n) =>
          n.id === existing.id
            ? { ...n, markdown: data.markdown ?? n.markdown, sourceVault: data.sourceVault ?? n.sourceVault, sourceFolder: data.sourceFolder ?? n.sourceFolder, vaultFolders: data.vaultFolders?.length ? data.vaultFolders : n.vaultFolders, fromObsidian: data.fromObsidian ?? n.fromObsidian }
            : n
        );
        return { notes: updated, activeId: existing.id };
      }
      const note = makeNote(data);
      return { notes: [...state.notes, note], activeId: note.id };
    }

    case 'CLOSE_NOTE': {
      const id = action.payload;
      const filtered = state.notes.filter((n) => n.id !== id);
      if (filtered.length === 0) {
        const welcome = makeNote({ markdown: WELCOME_MD, fileName: 'Welcome.md' });
        return { notes: [welcome], activeId: welcome.id };
      }
      const newActive = state.activeId === id ? filtered[filtered.length - 1].id : state.activeId;
      return { notes: filtered, activeId: newActive };
    }

    case 'SWITCH': return { ...state, activeId: action.payload };

    case 'RESTORE': {
      const notes = action.payload.map((d) => makeNote(d));
      return { notes, activeId: notes[0]?.id || null };
    }

    // ── Annotations ──
    case 'ADD_ANNOTATION': {
      const ann = { id: genItemId('a'), color: 'yellow', type: 'note', comment: '', createdAt: new Date().toISOString(), ...action.payload };
      return mapActive(state, (n) => ({ ...n, annotations: [...n.annotations, ann] }));
    }
    case 'UPDATE_ANNOTATION': {
      const { annId, updates } = action.payload;
      return mapActive(state, (n) => ({ ...n, annotations: n.annotations.map((a) => a.id === annId ? { ...a, ...updates } : a) }));
    }
    case 'REMOVE_ANNOTATION':
      return mapActive(state, (n) => ({ ...n, annotations: n.annotations.filter((a) => a.id !== action.payload) }));

    // ── Footnotes ──
    case 'ADD_FOOTNOTE': {
      const fn = { id: genItemId('fn'), createdAt: new Date().toISOString(), ...action.payload };
      return mapActive(state, (n) => ({ ...n, footnotes: [...n.footnotes, fn] }));
    }
    case 'UPDATE_FOOTNOTE': {
      const { fnId, updates } = action.payload;
      return mapActive(state, (n) => ({ ...n, footnotes: n.footnotes.map((f) => f.id === fnId ? { ...f, ...updates } : f) }));
    }
    case 'REMOVE_FOOTNOTE':
      return mapActive(state, (n) => ({ ...n, footnotes: n.footnotes.filter((f) => f.id !== action.payload) }));

    // ── Bookmarks ──
    case 'ADD_BOOKMARK': {
      const bm = { id: genItemId('bm'), createdAt: new Date().toISOString(), ...action.payload };
      return mapActive(state, (n) => ({ ...n, bookmarks: [...n.bookmarks, bm] }));
    }
    case 'REMOVE_BOOKMARK':
      return mapActive(state, (n) => ({ ...n, bookmarks: n.bookmarks.filter((b) => b.id !== action.payload) }));

    // ── Suggestions (inline tracked changes) ──
    case 'ADD_SUGGESTION': {
      const sg = { id: genItemId('sg'), status: 'pending', createdAt: new Date().toISOString(), ...action.payload };
      return mapActive(state, (n) => ({ ...n, suggestions: [...n.suggestions, sg] }));
    }
    case 'UPDATE_SUGGESTION': {
      const { sgId, updates } = action.payload;
      return mapActive(state, (n) => ({ ...n, suggestions: n.suggestions.map((s) => s.id === sgId ? { ...s, ...updates } : s) }));
    }
    case 'ACCEPT_SUGGESTION': {
      const sg = state.notes.find(n => n.id === state.activeId)?.suggestions.find(s => s.id === action.payload);
      if (!sg) return state;
      return mapActive(state, (n) => ({
        ...n,
        markdown: n.markdown.replace(sg.originalText, sg.suggestedText),
        suggestions: n.suggestions.filter(s => s.id !== action.payload),
      }));
    }
    case 'REJECT_SUGGESTION':
      return mapActive(state, (n) => ({ ...n, suggestions: n.suggestions.filter(s => s.id !== action.payload) }));

    // ── Summary ──
    case 'SET_SUMMARY':
      return mapActive(state, (n) => ({ ...n, summary: action.payload }));

    default: return state;
  }
}

// ── Hook ──

export default function useNoteStore() {
  const welcome = makeNote({ markdown: WELCOME_MD, fileName: 'Welcome.md' });
  const [state, dispatch] = useReducer(reducer, { notes: [welcome], activeId: welcome.id });

  const activeNote = useMemo(() => state.notes.find((n) => n.id === state.activeId) || state.notes[0] || null, [state]);
  const activeHtml = useMemo(() => (activeNote ? renderHtml(activeNote.markdown) : ''), [activeNote]);

  // ── Actions ──
  const addNote = useCallback((data) => dispatch({ type: 'ADD_NOTE', payload: data }), []);
  const closeNote = useCallback((id) => dispatch({ type: 'CLOSE_NOTE', payload: id }), []);
  const switchNote = useCallback((id) => dispatch({ type: 'SWITCH', payload: id }), []);
  const restoreNotes = useCallback((arr) => dispatch({ type: 'RESTORE', payload: arr }), []);

  const addAnnotation = useCallback((ann) => dispatch({ type: 'ADD_ANNOTATION', payload: ann }), []);
  const updateAnnotation = useCallback((annId, updates) => dispatch({ type: 'UPDATE_ANNOTATION', payload: { annId, updates } }), []);
  const removeAnnotation = useCallback((annId) => dispatch({ type: 'REMOVE_ANNOTATION', payload: annId }), []);

  const addFootnote = useCallback((fn) => dispatch({ type: 'ADD_FOOTNOTE', payload: fn }), []);
  const updateFootnote = useCallback((fnId, updates) => dispatch({ type: 'UPDATE_FOOTNOTE', payload: { fnId, updates } }), []);
  const removeFootnote = useCallback((fnId) => dispatch({ type: 'REMOVE_FOOTNOTE', payload: fnId }), []);

  const addBookmark = useCallback((bm) => dispatch({ type: 'ADD_BOOKMARK', payload: bm }), []);
  const removeBookmark = useCallback((bmId) => dispatch({ type: 'REMOVE_BOOKMARK', payload: bmId }), []);

  const addSuggestion = useCallback((sg) => dispatch({ type: 'ADD_SUGGESTION', payload: sg }), []);
  const updateSuggestion = useCallback((sgId, updates) => dispatch({ type: 'UPDATE_SUGGESTION', payload: { sgId, updates } }), []);
  const acceptSuggestion = useCallback((sgId) => dispatch({ type: 'ACCEPT_SUGGESTION', payload: sgId }), []);
  const rejectSuggestion = useCallback((sgId) => dispatch({ type: 'REJECT_SUGGESTION', payload: sgId }), []);

  const setSummary = useCallback((text) => dispatch({ type: 'SET_SUMMARY', payload: text }), []);

  // ── Hash loading ──
  const loadFromHash = useCallback(async () => {
    const hash = window.location.hash.slice(1);
    if (!hash) return false;
    try {
      const params = new URLSearchParams(hash);
      const bridgeId = params.get('bridge');
      if (bridgeId) {
        const target = params.get('target');
        if (target && target !== 'annotator') return false;
        window.history.replaceState(null, '', window.location.pathname);
        const res = await fetch('/api/bridge?id=' + encodeURIComponent(bridgeId));
        if (!res.ok) return false;
        const data = await res.json();
        if (!data.name || !data.content) return false;
        dispatch({ type: 'ADD_NOTE', payload: { markdown: data.content, fileName: data.name, sourceVault: data.vault || null, sourceFolder: data.folder || null, vaultFolders: Array.isArray(data.folders) ? data.folders : [], fromObsidian: true } });
        return true;
      }
      const name = params.get('name');
      const content = params.get('content');
      if (!content || !name) return false;
      const target = params.get('target');
      if (target && target !== 'annotator') return false;
      const decoded = decodeURIComponent(escape(atob(content.replace(/ /g, '+'))));
      const folders = (params.get('folders') || '').split('|').filter(Boolean);
      dispatch({ type: 'ADD_NOTE', payload: { markdown: decoded, fileName: name, sourceVault: params.get('vault') || null, sourceFolder: params.get('folder') || null, vaultFolders: folders, fromObsidian: true } });
      window.history.replaceState(null, '', window.location.pathname);
      return true;
    } catch (err) { console.warn('Hash load failed:', err); return false; }
  }, []);

  // ── File import ──
  const loadFile = useCallback((file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => { dispatch({ type: 'ADD_NOTE', payload: { markdown: e.target.result, fileName: file.name } }); resolve(); };
    reader.onerror = reject;
    reader.readAsText(file);
  }), []);

  // ── Export ──
  const exportMarkdown = useCallback(() => {
    if (!activeNote) return;
    const blob = new Blob([activeNote.markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = activeNote.fileName || 'document.md';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }, [activeNote]);

  const exportAnnotations = useCallback(() => {
    if (!activeNote) return;
    const data = {
      source: activeNote.fileName, exportedAt: new Date().toISOString(),
      annotations: activeNote.annotations.map(({ id, text, color, type, comment, createdAt }) => ({ id, text, color, type, comment, createdAt })),
      footnotes: activeNote.footnotes,
      bookmarks: activeNote.bookmarks,
      suggestions: activeNote.suggestions,
      summary: activeNote.summary,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = (activeNote.fileName || 'document').replace(/\.md$/, '') + '.annotations.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }, [activeNote]);

  // ── Serialise for cloud ──
  const serialise = useCallback(() =>
    state.notes.map(({ id, markdown, fileName, sourceVault, sourceFolder, vaultFolders, fromObsidian, annotations, footnotes, bookmarks, suggestions, summary, openedAt }) => ({
      id, markdown, fileName, sourceVault, sourceFolder, vaultFolders, fromObsidian, annotations, footnotes, bookmarks, suggestions, summary, openedAt,
    })),
  [state.notes]);

  return {
    notes: state.notes, activeNote, activeHtml, activeId: state.activeId,
    addNote, closeNote, switchNote, restoreNotes, loadFromHash, loadFile, serialise,
    addAnnotation, updateAnnotation, removeAnnotation,
    addFootnote, updateFootnote, removeFootnote,
    addBookmark, removeBookmark,
    addSuggestion, updateSuggestion, acceptSuggestion, rejectSuggestion,
    setSummary,
    exportMarkdown, exportAnnotations,
  };
}
