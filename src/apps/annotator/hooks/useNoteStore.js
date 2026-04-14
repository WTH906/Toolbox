import { useReducer, useCallback, useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

let _c = 0;
const genId = () => `n_${Date.now()}_${++_c}`;
const genAnnId = () => `a_${Date.now()}_${++_c}`;

function renderHtml(md) {
  return DOMPurify.sanitize(marked.parse(md || '', { gfm: true, breaks: true }));
}

const WELCOME_MD = `# Welcome to Markdown Annotator

Open a note from Obsidian using the plugin, or import a \`.md\` file.

You can also drag-and-drop files onto this window.

Once a note is loaded, **select any text** to highlight it or leave a comment.
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
    openedAt: data.openedAt || new Date().toISOString(),
  };
}

// ── Reducer ── one atomic update for notes + activeId

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_NOTE': {
      const data = action.payload;
      const fileName = data.fileName || 'Untitled.md';
      console.log('[Annotator v2] ADD_NOTE:', fileName, 'existing notes:', state.notes.map(n => n.fileName));

      // If same fileName exists (and isn't Welcome), update it in place
      const existing = state.notes.find(
        (n) => n.fileName === fileName && fileName !== 'Welcome.md' && fileName !== 'Untitled.md'
      );

      if (existing) {
        const updated = state.notes.map((n) =>
          n.id === existing.id
            ? {
                ...n,
                markdown: data.markdown ?? n.markdown,
                sourceVault: data.sourceVault ?? n.sourceVault,
                sourceFolder: data.sourceFolder ?? n.sourceFolder,
                vaultFolders: data.vaultFolders?.length ? data.vaultFolders : n.vaultFolders,
                fromObsidian: data.fromObsidian ?? n.fromObsidian,
              }
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

      const newActive =
        state.activeId === id
          ? filtered[filtered.length - 1].id
          : state.activeId;

      return { notes: filtered, activeId: newActive };
    }

    case 'SWITCH': {
      return { ...state, activeId: action.payload };
    }

    case 'RESTORE': {
      const notes = action.payload.map((d) => makeNote(d));
      return { notes, activeId: notes[0]?.id || null };
    }

    case 'ADD_ANNOTATION': {
      const ann = { id: genAnnId(), color: 'yellow', comment: '', createdAt: new Date().toISOString(), ...action.payload };
      return {
        ...state,
        notes: state.notes.map((n) =>
          n.id === state.activeId
            ? { ...n, annotations: [...n.annotations, ann] }
            : n
        ),
      };
    }

    case 'UPDATE_ANNOTATION': {
      const { annId, updates } = action.payload;
      return {
        ...state,
        notes: state.notes.map((n) =>
          n.id === state.activeId
            ? { ...n, annotations: n.annotations.map((a) => (a.id === annId ? { ...a, ...updates } : a)) }
            : n
        ),
      };
    }

    case 'REMOVE_ANNOTATION': {
      return {
        ...state,
        notes: state.notes.map((n) =>
          n.id === state.activeId
            ? { ...n, annotations: n.annotations.filter((a) => a.id !== action.payload) }
            : n
        ),
      };
    }

    default:
      return state;
  }
}

// ── Hook ──

export default function useNoteStore() {
  const welcome = makeNote({ markdown: WELCOME_MD, fileName: 'Welcome.md' });
  const [state, dispatch] = useReducer(reducer, {
    notes: [welcome],
    activeId: welcome.id,
  });

  const activeNote = useMemo(
    () => state.notes.find((n) => n.id === state.activeId) || state.notes[0] || null,
    [state]
  );

  const activeHtml = useMemo(
    () => (activeNote ? renderHtml(activeNote.markdown) : ''),
    [activeNote]
  );

  // ── Actions ──

  const addNote = useCallback((data) => dispatch({ type: 'ADD_NOTE', payload: data }), []);
  const closeNote = useCallback((id) => dispatch({ type: 'CLOSE_NOTE', payload: id }), []);
  const switchNote = useCallback((id) => dispatch({ type: 'SWITCH', payload: id }), []);
  const restoreNotes = useCallback((arr) => dispatch({ type: 'RESTORE', payload: arr }), []);

  const addAnnotation = useCallback((ann) => dispatch({ type: 'ADD_ANNOTATION', payload: ann }), []);
  const updateAnnotation = useCallback((annId, updates) => dispatch({ type: 'UPDATE_ANNOTATION', payload: { annId, updates } }), []);
  const removeAnnotation = useCallback((annId) => dispatch({ type: 'REMOVE_ANNOTATION', payload: annId }), []);

  // ── Hash loading (new bridge API format + legacy inline) ──

  const loadFromHash = useCallback(async () => {
    const hash = window.location.hash.slice(1);
    if (!hash) return false;

    try {
      const params = new URLSearchParams(hash);

      // New format: bridge=<id> — fetch from API
      const bridgeId = params.get('bridge');
      if (bridgeId) {
        const target = params.get('target');
        if (target && target !== 'annotator') return false;
        window.history.replaceState(null, '', window.location.pathname);
        const res = await fetch('/api/bridge?id=' + encodeURIComponent(bridgeId));
        if (!res.ok) return false;
        const data = await res.json();
        if (!data.name || !data.content) return false;
        const folders = data.folders || [];
        dispatch({
          type: 'ADD_NOTE',
          payload: {
            markdown: data.content,
            fileName: data.name,
            sourceVault: data.vault || null,
            sourceFolder: data.folder || null,
            vaultFolders: Array.isArray(folders) ? folders : [],
            fromObsidian: true,
          },
        });
        return true;
      }

      // Legacy format: content encoded in hash
      const name = params.get('name');
      const content = params.get('content');
      if (!content || !name) return false;

      const fixedContent = content.replace(/ /g, '+');
      const decoded = decodeURIComponent(escape(atob(fixedContent)));
      const folders = (params.get('folders') || '').split('|').filter(Boolean);

      dispatch({
        type: 'ADD_NOTE',
        payload: {
          markdown: decoded,
          fileName: name,
          sourceVault: params.get('vault') || null,
          sourceFolder: params.get('folder') || null,
          vaultFolders: folders,
          fromObsidian: true,
        },
      });

      window.history.replaceState(null, '', window.location.pathname);
      return true;
    } catch (err) {
      console.warn('Hash load failed:', err);
      return false;
    }
  }, []);

  // ── File import ──

  const loadFile = useCallback(
    (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          dispatch({
            type: 'ADD_NOTE',
            payload: { markdown: e.target.result, fileName: file.name },
          });
          resolve();
        };
        reader.onerror = reject;
        reader.readAsText(file);
      }),
    []
  );

  // ── Export ──

  const exportMarkdown = useCallback(() => {
    if (!activeNote) return;
    const blob = new Blob([activeNote.markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeNote.fileName || 'document.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [activeNote]);

  const exportAnnotations = useCallback(() => {
    if (!activeNote) return;
    const data = {
      source: activeNote.fileName,
      exportedAt: new Date().toISOString(),
      annotations: activeNote.annotations.map(({ id, text, color, comment, createdAt }) => ({ id, text, color, comment, createdAt })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (activeNote.fileName || 'document').replace(/\.md$/, '') + '.annotations.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [activeNote]);

  // ── Serialise for cloud ──

  const serialise = useCallback(
    () =>
      state.notes.map(({ id, markdown, fileName, sourceVault, sourceFolder, vaultFolders, fromObsidian, annotations, openedAt }) => ({
        id, markdown, fileName, sourceVault, sourceFolder, vaultFolders, fromObsidian, annotations, openedAt,
      })),
    [state.notes]
  );

  return {
    notes: state.notes,
    activeNote,
    activeHtml,
    activeId: state.activeId,
    addNote, closeNote, switchNote, restoreNotes,
    loadFromHash, loadFile, serialise,
    addAnnotation, updateAnnotation, removeAnnotation,
    exportMarkdown, exportAnnotations,
  };
}
