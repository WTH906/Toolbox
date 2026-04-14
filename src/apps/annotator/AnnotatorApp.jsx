import React, { useState, useCallback, useEffect, useRef } from 'react';
import Toolbar from './components/Toolbar.jsx';
import MarkdownViewer from './components/MarkdownViewer.jsx';
import AnnotationPopover from './components/AnnotationPopover.jsx';
import AnnotationSidebar from './components/AnnotationSidebar.jsx';
import NotesSidebar from './components/NotesSidebar.jsx';
import DropZone from './components/DropZone.jsx';
import SendToVaultDialog from './components/SendToVaultDialog.jsx';
import useNoteStore from './hooks/useNoteStore.js';
import useCloudSync from '../../shared/useCloudSync.js';

export default function AnnotatorApp({ sessionName: parentSession, onSyncStatusChange }) {
  const [darkMode, setDarkMode] = useState(() =>
    window.matchMedia?.('(prefers-color-scheme: dark)').matches || false
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [pendingSelection, setPendingSelection] = useState(null);
  const [vaultDialogOpen, setVaultDialogOpen] = useState(false);

  const store = useNoteStore();
  const cloud = useCloudSync('annotator');
  const initialLoadDone = useRef(false);
  const bootRan = useRef(false);

  // Sync session name from parent
  useEffect(() => {
    if (parentSession && parentSession !== cloud.sessionName) {
      cloud.setSessionName(parentSession);
    }
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
        if (data?.notes?.length) {
          store.restoreNotes(data.notes);
        } else if (data?.markdown) {
          store.restoreNotes([{
            markdown: data.markdown,
            fileName: data.fileName || 'Untitled.md',
            annotations: data.annotations || [],
            sourceVault: data.sourceVault || null,
            sourceFolder: data.sourceFolder || null,
          }]);
        }
      }
      store.loadFromHash();
      initialLoadDone.current = true;
    }
    boot();
  }, []);

  // Hash listener for Obsidian bridge
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
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Drag & drop
  useEffect(() => {
    let dragCount = 0;
    const enter = (e) => { e.preventDefault(); dragCount++; if (dragCount === 1) setDragging(true); };
    const leave = (e) => { e.preventDefault(); dragCount--; if (dragCount <= 0) { dragCount = 0; setDragging(false); } };
    const over = (e) => e.preventDefault();
    const drop = (e) => {
      e.preventDefault(); dragCount = 0; setDragging(false);
      const file = e.dataTransfer?.files?.[0];
      if (file && /\.(md|markdown|txt)$/i.test(file.name)) store.loadFile(file);
    };
    document.addEventListener('dragenter', enter);
    document.addEventListener('dragleave', leave);
    document.addEventListener('dragover', over);
    document.addEventListener('drop', drop);
    return () => {
      document.removeEventListener('dragenter', enter);
      document.removeEventListener('dragleave', leave);
      document.removeEventListener('dragover', over);
      document.removeEventListener('drop', drop);
    };
  }, [store]);

  // Annotation handlers
  const handleTextSelect = useCallback((sel) => setPendingSelection(sel), []);
  const handleSaveAnnotation = useCallback(({ color, comment }) => {
    if (!pendingSelection) return;
    store.addAnnotation({ text: pendingSelection.text, color, comment });
    setPendingSelection(null);
    window.getSelection()?.removeAllRanges();
  }, [pendingSelection, store]);
  const handleCancelPopover = useCallback(() => { setPendingSelection(null); window.getSelection()?.removeAllRanges(); }, []);
  const handleJumpToAnnotation = useCallback((id) => {
    const mark = document.querySelector(`mark[data-ann-id="${id}"]`);
    if (mark) {
      mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
      mark.style.boxShadow = '0 0 0 3px var(--accent)';
      setTimeout(() => { mark.style.boxShadow = 'none'; }, 1200);
    }
  }, []);

  const note = store.activeNote;

  return (
    <>
      <Toolbar
        fileName={note?.fileName}
        annotationCount={note?.annotations?.length || 0}
        fromObsidian={note?.fromObsidian}
        onImport={(file) => store.loadFile(file)}
        onExportMd={store.exportMarkdown}
        onExportAnnotations={store.exportAnnotations}
        onSendToVault={() => setVaultDialogOpen(true)}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode((v) => !v)}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <NotesSidebar notes={store.notes} activeId={store.activeId} onSwitch={store.switchNote} onClose={store.closeNote} />
        <MarkdownViewer html={store.activeHtml} annotations={note?.annotations || []} onTextSelect={handleTextSelect} darkMode={darkMode} />
        <AnnotationSidebar annotations={note?.annotations || []} onUpdate={store.updateAnnotation} onRemove={store.removeAnnotation} onJump={handleJumpToAnnotation} open={sidebarOpen} />
      </div>
      <AnnotationPopover position={pendingSelection?.position} onSave={handleSaveAnnotation} onCancel={handleCancelPopover} />
      <DropZone active={dragging} />
      <SendToVaultDialog open={vaultDialogOpen} onClose={() => setVaultDialogOpen(false)} markdown={note?.markdown || ''} fileName={note?.fileName} sourceVault={note?.sourceVault} sourceFolder={note?.sourceFolder} vaultFolders={note?.vaultFolders || []} />
    </>
  );
}
