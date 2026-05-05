import React, { useState, useCallback, useEffect, useRef } from 'react';
import BookmarkManager from './BookmarkManager.jsx';
import useCloudSync from '../../shared/useCloudSync.js';

let _mc = 0;
const genModeId = () => `mode_${Date.now().toString(36)}_${++_mc}`;

const GENERAL_MODE = { id: 'general', name: 'General', color: '#b48c50' };

const ICO = {
  plus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  edit: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  x: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  back: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
};

// ── Mode Manager Dialog ──
function ModeManagerDialog({ modes, onAdd, onUpdate, onDelete, onClose }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#448aff');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const inputRef = useRef(null);

  const handleAdd = () => {
    const n = name.trim();
    if (!n || modes.some(m => m.name.toLowerCase() === n.toLowerCase())) return;
    onAdd({ id: genModeId(), name: n, color });
    setName(''); setColor('#448aff'); inputRef.current?.focus();
  };

  return (
    <div style={S.backdrop} onClick={onClose}>
      <div style={S.dialog} onClick={e => e.stopPropagation()}>
        <div style={S.dialogHeader}>
          <h3 style={S.dialogTitle}>Manage Modes</h3>
          <button style={S.iconBtn} onClick={onClose}>{ICO.x}</button>
        </div>
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border-secondary)' }}>
          <div style={S.addRow}>
            <input ref={inputRef} style={{ ...S.input, marginBottom: 0 }} value={name} onChange={e => setName(e.target.value)}
              placeholder="Mode name..." onKeyDown={e => e.key === 'Enter' && handleAdd()} />
            <div style={S.colorWrap}>
              <input type="color" value={color} onChange={e => setColor(e.target.value)} style={S.colorPicker} />
              <input style={{ ...S.input, width: 85, fontFamily: 'var(--font-mono)', fontSize: 12, textAlign: 'center', marginBottom: 0 }}
                value={color} onChange={e => { const v = e.target.value.startsWith('#') ? e.target.value : '#' + e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setColor(v); }}
                placeholder="#hex" maxLength={7} />
            </div>
            <button style={S.accentBtn} onClick={handleAdd}>Add</button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 20px', minHeight: 0 }}>
          {modes.filter(m => m.id !== 'general').length === 0 && (
            <p style={S.emptyText}>No custom modes yet. "General" is always available.</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {modes.filter(m => m.id !== 'general').map(mode => (
              <div key={mode.id} style={S.modeRow}>
                {editId === mode.id ? (<>
                  <input style={{ ...S.input, flex: 1, marginBottom: 0 }} value={editName} onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { onUpdate(editId, { name: editName.trim(), color: editColor }); setEditId(null); } if (e.key === 'Escape') setEditId(null); }} autoFocus />
                  <div style={S.colorWrap}>
                    <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} style={S.colorPicker} />
                  </div>
                  <button style={S.smallAccent} onClick={() => { onUpdate(editId, { name: editName.trim(), color: editColor }); setEditId(null); }}>Save</button>
                  <button style={S.smallBtn} onClick={() => setEditId(null)}>x</button>
                </>) : (<>
                  <span style={{ ...S.modeDot, background: mode.color }} />
                  <span style={S.modeName}>{mode.name}</span>
                  <div style={{ flex: 1 }} />
                  <button style={S.smallBtn} onClick={() => { setEditId(mode.id); setEditName(mode.name); setEditColor(mode.color); }}>{ICO.edit}</button>
                  <button style={{ ...S.smallBtn, color: '#d04040' }} onClick={() => onDelete(mode.id)}>{ICO.trash}</button>
                </>)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main BookmarkApp with Modes ──
export default function BookmarkApp({ sessionName: parentSession, onSyncStatusChange, externalAdd }) {
  const cloud = useCloudSync('bookmarks');
  const [modes, setModes] = useState([GENERAL_MODE]);
  const [modeData, setModeData] = useState({ general: { bookmarks: [], tags: [] } });
  const [activeMode, setActiveMode] = useState('general');
  const [showModeManager, setShowModeManager] = useState(false);
  const bootRan = useRef(false);
  const loaded = useRef(false);

  // Sync session name
  useEffect(() => {
    if (parentSession && parentSession !== cloud.sessionName) cloud.setSessionName(parentSession);
  }, [parentSession]);

  // Report sync status
  useEffect(() => {
    onSyncStatusChange?.({ status: cloud.syncStatus, lastSavedAt: cloud.lastSavedAt });
  }, [cloud.syncStatus, cloud.lastSavedAt, onSyncStatusChange]);

  // Boot: load from cloud, migrate old format if needed
  useEffect(() => {
    if (bootRan.current) return;
    bootRan.current = true;
    (async () => {
      if (cloud.hasSession) {
        const data = await cloud.loadFromCloud();
        if (data) {
          if (data.modes && data.modeData) {
            // New format
            setModes(data.modes);
            setModeData(data.modeData);
          } else if (data.bookmarks || data.tags) {
            // Old format — migrate into General mode
            setModeData({ general: { bookmarks: data.bookmarks || [], tags: data.tags || [] } });
          }
        }
      }
      loaded.current = true;
    })();
  }, []);

  // Auto-save
  useEffect(() => {
    if (!loaded.current || !cloud.hasSession) return;
    cloud.saveToCloud({ modes, modeData });
  }, [modes, modeData, cloud.hasSession]);

  // Active mode data
  const activeModeData = modeData[activeMode] || { bookmarks: [], tags: [] };
  const activeModeInfo = modes.find(m => m.id === activeMode) || GENERAL_MODE;

  // Handle BookmarkManager data changes — update only the active mode's slot
  const handleDataChange = useCallback((data) => {
    setModeData(prev => ({ ...prev, [activeMode]: data }));
  }, [activeMode]);

  // Mode CRUD
  const addMode = useCallback((mode) => {
    setModes(prev => [...prev, mode]);
    setModeData(prev => ({ ...prev, [mode.id]: { bookmarks: [], tags: [] } }));
    setShowModeManager(false);
  }, []);

  const updateMode = useCallback((id, updates) => {
    setModes(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const deleteMode = useCallback((id) => {
    if (id === 'general') return;
    setModes(prev => prev.filter(m => m.id !== id));
    setModeData(prev => { const next = { ...prev }; delete next[id]; return next; });
    if (activeMode === id) setActiveMode('general');
  }, [activeMode]);

  // Move bookmark from current mode to target mode
  const handleMoveToMode = useCallback((bookmarkId, targetModeId) => {
    setModeData(prev => {
      const sourceData = prev[activeMode];
      if (!sourceData) return prev;
      const bookmark = sourceData.bookmarks.find(b => b.id === bookmarkId);
      if (!bookmark) return prev;
      const targetData = prev[targetModeId] || { bookmarks: [], tags: [] };
      return {
        ...prev,
        [activeMode]: { ...sourceData, bookmarks: sourceData.bookmarks.filter(b => b.id !== bookmarkId) },
        [targetModeId]: { ...targetData, bookmarks: [bookmark, ...targetData.bookmarks] },
      };
    });
  }, [activeMode]);

  return (
    <div style={S.root}>
      {/* Mode bar */}
      <div style={S.modeBar}>
        <div style={S.modeChips}>
          {modes.map(mode => {
            const isActive = activeMode === mode.id;
            const c = mode.color || '#b48c50';
            const count = (modeData[mode.id]?.bookmarks?.length) || 0;
            return (
              <button key={mode.id} onClick={() => setActiveMode(mode.id)}
                style={{
                  ...S.modeChip,
                  background: isActive ? c : c + '15',
                  color: isActive ? '#fff' : c,
                  borderColor: isActive ? c : c + '40',
                }}>
                {mode.name}
                {count > 0 && <span style={{ ...S.modeCount, background: isActive ? 'rgba(255,255,255,0.25)' : c + '25', color: isActive ? '#fff' : c }}>{count}</span>}
              </button>
            );
          })}
        </div>
        <button style={S.manageBtn} onClick={() => setShowModeManager(true)}>
          {ICO.edit} Modes
        </button>
      </div>

      {/* BookmarkManager for the active mode */}
      <div style={S.managerWrap}>
        <BookmarkManager
          key={activeMode}
          initialData={activeModeData}
          onDataChange={handleDataChange}
          externalAdd={externalAdd}
          modes={modes}
          currentModeId={activeMode}
          onMoveToMode={handleMoveToMode}
        />
      </div>

      {/* Mode manager dialog */}
      {showModeManager && (
        <ModeManagerDialog
          modes={modes}
          onAdd={addMode}
          onUpdate={updateMode}
          onDelete={deleteMode}
          onClose={() => setShowModeManager(false)}
        />
      )}
    </div>
  );
}

const S = {
  root: { display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' },
  modeBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    padding: '8px 20px', background: 'var(--bg-toolbar)', borderBottom: '1px solid var(--border-secondary)',
    flexShrink: 0, flexWrap: 'wrap',
  },
  modeChips: { display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  modeChip: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px',
    fontSize: 13, fontWeight: 600, borderRadius: 8, cursor: 'pointer',
    border: '1px solid', fontFamily: 'var(--font-body)', transition: 'all 120ms',
    whiteSpace: 'nowrap', background: 'none',
  },
  modeCount: {
    fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)',
    padding: '0 5px', borderRadius: 99, minWidth: 18, textAlign: 'center',
  },
  manageBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px',
    fontSize: 12, fontWeight: 500, borderRadius: 'var(--radius-md)', cursor: 'pointer',
    border: '1px solid var(--border-primary)', background: 'none',
    color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  managerWrap: { flex: '1 1 0', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' },

  // Dialog
  backdrop: {
    position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.35)',
    backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
  },
  dialog: {
    zIndex: 2001, width: 440, maxWidth: '100%', maxHeight: 'calc(100vh - 64px)', overflow: 'hidden',
    background: 'var(--bg-surface)', border: '1px solid var(--border-secondary)', borderRadius: 16,
    boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column',
  },
  dialogHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px',
    borderBottom: '1px solid var(--border-secondary)',
  },
  dialogTitle: { fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', margin: 0 },

  // Form
  addRow: { display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' },
  colorWrap: { display: 'flex', alignItems: 'center', gap: 4 },
  colorPicker: { width: 30, height: 30, border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', padding: 0, background: 'none' },
  input: {
    width: '100%', padding: '8px 12px', fontSize: 14, border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--text-primary)',
    outline: 'none', fontFamily: 'var(--font-body)', marginBottom: 4,
  },
  modeRow: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
    background: 'var(--bg-primary)', border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-md)',
  },
  modeDot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  modeName: { fontSize: 14, fontWeight: 500 },

  // Buttons
  accentBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', fontSize: 13, fontWeight: 600,
    borderRadius: 'var(--radius-md)', background: 'var(--accent)', color: '#fff', cursor: 'pointer',
    border: 'none', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
  },
  iconBtn: { background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 4, fontSize: 16 },
  smallBtn: { background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '4px 6px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center' },
  smallAccent: { padding: '4px 10px', fontSize: 12, fontWeight: 600, borderRadius: 'var(--radius-sm)', background: 'var(--accent)', color: '#fff', cursor: 'pointer', border: 'none', fontFamily: 'var(--font-body)' },
  emptyText: { fontSize: 13, color: 'var(--text-tertiary)', margin: 0 },
};
