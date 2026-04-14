import React, { useState, useCallback, useEffect } from 'react';
import AnnotatorApp from './apps/annotator/AnnotatorApp.jsx';
import ObsidianForge from './apps/forge/ObsidianForge.jsx';
import Folderico from './apps/folderico/Folderico.jsx';
import SessionPicker from './shared/SessionPicker.jsx';
import SyncStatus from './shared/SyncStatus.jsx';
import { getSessionName, setStoredSessionName } from './shared/useCloudSync.js';

const TABS = [
  { id: 'forge',     label: 'Obsidian Forge', icon: '✍️' },
  { id: 'annotator', label: 'Annotator',      icon: '📝' },
  { id: 'folderico', label: 'Folderico',      icon: '📁' },
];

export default function App() {
  const [activeApp, setActiveApp] = useState('forge');
  const [tabBarVisible, setTabBarVisible] = useState(true);
  const [sessionName, setSessionName] = useState(() => getSessionName());
  const [showSessionPicker, setShowSessionPicker] = useState(() => !getSessionName());

  // Expose for child sync status
  const [forgeSyncStatus, setForgeSyncStatus] = useState({ status: 'idle', lastSavedAt: null });
  const [annotatorSyncStatus, setAnnotatorSyncStatus] = useState({ status: 'idle', lastSavedAt: null });

  const activeSyncStatus = activeApp === 'forge' ? forgeSyncStatus
    : activeApp === 'annotator' ? annotatorSyncStatus
    : null;

  const handleSessionPick = useCallback((name) => {
    const clean = name.trim().toLowerCase();
    setStoredSessionName(clean);
    setSessionName(clean);
    setShowSessionPicker(false);
  }, []);

  const handleChangeSession = useCallback(() => {
    setShowSessionPicker(true);
  }, []);

  // Check if Obsidian bridge hash is present — auto-route to correct app
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    try {
      const params = new URLSearchParams(hash);
      const target = params.get('target');
      if (target === 'forge') setActiveApp('forge');
      else if (target === 'annotator' || params.get('content')) setActiveApp('annotator');
    } catch { /* ignore */ }
  }, []);

  if (showSessionPicker) {
    return <SessionPicker onPick={handleSessionPick} />;
  }

  return (
    <div style={styles.shell}>
      {/* ── Tab Bar ── */}
      <div style={{ ...styles.switcher, ...(tabBarVisible ? {} : styles.switcherHidden) }}>
        <div style={styles.switcherInner}>
          {TABS.map((t) => (
            <button
              key={t.id}
              style={{ ...styles.tab, ...(activeApp === t.id ? styles.tabActive : {}) }}
              onClick={() => setActiveApp(t.id)}
            >
              <span style={styles.tabIcon}>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
        <button style={styles.hideBtn} onClick={() => setTabBarVisible(false)}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
          Hide
        </button>
      </div>

      {/* ── Float toggle ── */}
      {!tabBarVisible && (
        <button style={styles.floatToggle} onClick={() => setTabBarVisible(true)}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          {TABS.find(t => t.id === activeApp)?.icon} Switch App
        </button>
      )}

      {/* ── App Content ── */}
      <div style={styles.content}>
        <div style={{ display: activeApp === 'forge' ? 'flex' : 'none', height: '100%', overflow: 'hidden', flexDirection: 'column' }}>
          <ObsidianForge
            sessionName={sessionName}
            onSyncStatusChange={setForgeSyncStatus}
          />
        </div>
        <div style={{ display: activeApp === 'annotator' ? 'flex' : 'none', height: '100%', overflow: 'hidden', flexDirection: 'column' }}>
          <AnnotatorApp
            sessionName={sessionName}
            onSyncStatusChange={setAnnotatorSyncStatus}
          />
        </div>
        <div style={{ display: activeApp === 'folderico' ? 'block' : 'none', height: '100%', overflow: 'auto' }}>
          <Folderico />
        </div>
      </div>

      {/* ── Shared Sync Status ── */}
      {activeApp !== 'folderico' && activeSyncStatus && (
        <SyncStatus
          sessionName={sessionName}
          syncStatus={activeSyncStatus.status}
          lastSavedAt={activeSyncStatus.lastSavedAt}
          onChangeSession={handleChangeSession}
        />
      )}
    </div>
  );
}

const styles = {
  shell: { height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-primary)' },
  content: { flex: 1, overflow: 'hidden', position: 'relative' },
  switcher: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg-toolbar)', borderBottom: '1px solid var(--border-secondary)',
    position: 'relative', zIndex: 50, transition: 'max-height 0.3s cubic-bezier(.4,0,.2,1), opacity 0.25s ease',
    maxHeight: 56, opacity: 1, overflow: 'hidden',
  },
  switcherHidden: { maxHeight: 0, opacity: 0, borderBottomColor: 'transparent' },
  switcherInner: { display: 'flex', alignItems: 'stretch', gap: 0 },
  tab: {
    padding: '14px 28px', border: 'none', background: 'none', color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8,
    letterSpacing: '0.3px', position: 'relative', whiteSpace: 'nowrap',
  },
  tabActive: {
    color: 'var(--text-primary)', background: 'var(--accent-subtle)',
    boxShadow: 'inset 0 -2px 0 var(--accent)',
  },
  tabIcon: { fontSize: 16, lineHeight: 1 },
  hideBtn: {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'var(--bg-hover)', border: '1px solid var(--border-secondary)',
    color: 'var(--text-tertiary)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer',
    fontSize: 11, fontFamily: 'var(--font-body)', transition: 'all 0.15s',
    display: 'flex', alignItems: 'center', gap: 4, zIndex: 2,
  },
  floatToggle: {
    position: 'fixed', top: 8, right: 12, zIndex: 100,
    background: 'var(--bg-surface)', backdropFilter: 'blur(12px)',
    border: '1px solid var(--border-primary)', color: 'var(--text-secondary)',
    borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
    fontSize: 11, fontFamily: 'var(--font-body)', transition: 'all 0.2s',
    display: 'flex', alignItems: 'center', gap: 5,
    boxShadow: 'var(--shadow-md)',
  },
};
