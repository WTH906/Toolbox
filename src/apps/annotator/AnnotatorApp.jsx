import React, { useState, useCallback, useEffect, useRef } from 'react';
import Toolbar from './components/Toolbar.jsx';
import MarkdownViewer from './components/MarkdownViewer.jsx';
import AnnotationPopover from './components/AnnotationPopover.jsx';
import AnnotationSidebar from './components/AnnotationSidebar.jsx';
import NotesSidebar from './components/NotesSidebar.jsx';
import DropZone from './components/DropZone.jsx';
import SendToVaultDialog from './components/SendToVaultDialog.jsx';
import SummaryDialog from './components/SummaryDialog.jsx';
import useNoteStore from './hooks/useNoteStore.js';
import useCloudSync from '../../shared/useCloudSync.js';
import { exportToWord } from './exportToWord.js';

export default function AnnotatorApp({ sessionName: parentSession, onSyncStatusChange }) {
  const [darkMode, setDarkMode] = useState(() => window.matchMedia?.('(prefers-color-scheme: dark)').matches || false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [pendingSelection, setPendingSelection] = useState(null);
  const [vaultDialogOpen, setVaultDialogOpen] = useState(false);
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);

  const store = useNoteStore();
  const cloud = useCloudSync('annotator');
  const initialLoadDone = useRef(false);
  const bootRan = useRef(false);

  // Sync session name from parent
  useEffect(() => {
    if (parentSession && parentSession !== cloud.sessionName) cloud.setSessionName(parentSession);
  }, [parentSession]);

  // Report sync status up
  useEffect(() => {
    onSyncStatusChange?.({ status: cloud.syncStatus, lastSavedAt: cloud.lastSavedAt });
  }, [cloud.syncStatus, cloud.lastSavedAt, onSyncStatusChange]);

  // Boot
  useEffect(() => {
    if (bootRan.current) return;
    bootRan.current = true;
    async function boot() {
      if (cloud.hasSession) {
        const data = await cloud.loadFromCloud();
        if (data?.notes?.length) store.restoreNotes(data.notes);
        else if (data?.markdown) {
          store.restoreNotes([{ markdown: data.markdown, fileName: data.fileName || 'Untitled.md', annotations: data.annotations || [], sourceVault: data.sourceVault || null, sourceFolder: data.sourceFolder || null }]);
        }
      }
      await store.loadFromHash();
      initialLoadDone.current = true;
    }
    boot();
  }, []);

  // Hash listener
  useEffect(() => {
    const onHash = () => { if (window.location.hash.length > 1) store.loadFromHash(); };
    window.addEventListener('hashchange', onHash);
    window.addEventListener('focus', onHash);
    return () => { window.removeEventListener('hashchange', onHash); window.removeEventListener('focus', onHash); };
  }, [store.loadFromHash]);

  // Auto-save
  useEffect(() => {
    if (!initialLoadDone.current || !cloud.hasSession) return;
    cloud.saveToCloud({ notes: store.serialise() });
  }, [store.notes, cloud.hasSession]);

  // Theme
  useEffect(() => { document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light'); }, [darkMode]);

  // Drag & drop
  useEffect(() => {
    let dragCount = 0;
    const enter = (e) => { e.preventDefault(); dragCount++; if (dragCount === 1) setDragging(true); };
    const leave = (e) => { e.preventDefault(); dragCount--; if (dragCount <= 0) { dragCount = 0; setDragging(false); } };
    const over = (e) => e.preventDefault();
    const drop = (e) => { e.preventDefault(); dragCount = 0; setDragging(false); const file = e.dataTransfer?.files?.[0]; if (file && /\.(md|markdown|txt)$/i.test(file.name)) store.loadFile(file); };
    document.addEventListener('dragenter', enter);
    document.addEventListener('dragleave', leave);
    document.addEventListener('dragover', over);
    document.addEventListener('drop', drop);
    return () => { document.removeEventListener('dragenter', enter); document.removeEventListener('dragleave', leave); document.removeEventListener('dragover', over); document.removeEventListener('drop', drop); };
  }, [store]);

  // ── Handlers ──
  const handleTextSelect = useCallback((sel) => setPendingSelection(sel), []);

  const handleSaveAnnotation = useCallback(({ color, type, comment }) => {
    if (!pendingSelection) return;
    store.addAnnotation({ text: pendingSelection.text, color, type, comment });
    setPendingSelection(null);
    window.getSelection()?.removeAllRanges();
  }, [pendingSelection, store]);

  const handleSuggest = useCallback(({ originalText, suggestedText }) => {
    store.addSuggestion({ originalText, suggestedText });
    setPendingSelection(null);
    window.getSelection()?.removeAllRanges();
  }, [store]);

  const handleFootnote = useCallback(({ anchorText, content }) => {
    store.addFootnote({ anchorText, content });
    setPendingSelection(null);
    window.getSelection()?.removeAllRanges();
  }, [store]);

  const handleBookmark = useCallback(({ text }) => {
    store.addBookmark({ text });
    setPendingSelection(null);
    window.getSelection()?.removeAllRanges();
  }, [store]);

  const handleCancelPopover = useCallback(() => { setPendingSelection(null); window.getSelection()?.removeAllRanges(); }, []);

  const handleJumpToAnnotation = useCallback((id) => {
    const mark = document.querySelector(`mark[data-ann-id="${id}"]`);
    if (mark) { mark.scrollIntoView({ behavior: 'smooth', block: 'center' }); mark.style.boxShadow = '0 0 0 3px var(--accent)'; setTimeout(() => { mark.style.boxShadow = 'none'; }, 1200); }
  }, []);

  const handleExportWord = useCallback(() => {
    const note = store.activeNote;
    if (!note) return;
    exportToWord({
      markdown: note.markdown,
      fileName: note.fileName,
      annotations: note.annotations,
      footnotes: note.footnotes,
      bookmarks: note.bookmarks,
      suggestions: note.suggestions,
      summary: note.summary,
    });
  }, [store.activeNote]);

  const note = store.activeNote;

  return (
    <>
      <Toolbar
        fileName={note?.fileName}
        annotationCount={(note?.annotations?.length || 0) + (note?.suggestions?.length || 0) + (note?.footnotes?.length || 0) + (note?.bookmarks?.length || 0)}
        fromObsidian={note?.fromObsidian}
        onImport={(file) => store.loadFile(file)}
        onExportMd={store.exportMarkdown}
        onExportAnnotations={store.exportAnnotations}
        onExportWord={handleExportWord}
        onSendToVault={() => setVaultDialogOpen(true)}
        onSummary={() => setSummaryDialogOpen(true)}
        hasSummary={!!note?.summary}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode((v) => !v)}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <NotesSidebar notes={store.notes} activeId={store.activeId} onSwitch={store.switchNote} onClose={store.closeNote} />
        <MarkdownViewer
          html={store.activeHtml}
          annotations={note?.annotations || []}
          suggestions={note?.suggestions || []}
          footnotes={note?.footnotes || []}
          onTextSelect={handleTextSelect}
          darkMode={darkMode}
        />
        <AnnotationSidebar
          annotations={note?.annotations || []}
          footnotes={note?.footnotes || []}
          bookmarks={note?.bookmarks || []}
          suggestions={note?.suggestions || []}
          onUpdate={store.updateAnnotation}
          onRemove={store.removeAnnotation}
          onJump={handleJumpToAnnotation}
          open={sidebarOpen}
          onUpdateFootnote={store.updateFootnote}
          onRemoveFootnote={store.removeFootnote}
          onRemoveBookmark={store.removeBookmark}
          onAcceptSuggestion={store.acceptSuggestion}
          onRejectSuggestion={store.rejectSuggestion}
        />
      </div>
      <AnnotationPopover
        position={pendingSelection?.position}
        selectedText={pendingSelection?.text}
        onSave={handleSaveAnnotation}
        onSuggest={handleSuggest}
        onFootnote={handleFootnote}
        onBookmark={handleBookmark}
        onCancel={handleCancelPopover}
      />
      <DropZone active={dragging} />
      <SendToVaultDialog open={vaultDialogOpen} onClose={() => setVaultDialogOpen(false)} markdown={note?.markdown || ''} fileName={note?.fileName} sourceVault={note?.sourceVault} sourceFolder={note?.sourceFolder} vaultFolders={note?.vaultFolders || []} />
      <SummaryDialog open={summaryDialogOpen} summary={note?.summary || ''} onSave={store.setSummary} onClose={() => setSummaryDialogOpen(false)} />
    </>
  );
}
