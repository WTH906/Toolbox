import React, { useState, useCallback, useEffect, useRef } from 'react';
import AnnotatorApp from './apps/annotator/AnnotatorApp.jsx';
import ObsidianForge from './apps/forge/ObsidianForge.jsx';
import BookmarkApp from './apps/bookmarks/BookmarkApp.jsx';
import FeedApp from './apps/feed/FeedApp.jsx';
import ReadingListApp from './apps/reading/ReadingListApp.jsx';
import Folderico from './apps/folderico/Folderico.jsx';
import SessionPicker from './shared/SessionPicker.jsx';
import SyncStatus from './shared/SyncStatus.jsx';
import { getSessionName, setStoredSessionName } from './shared/useCloudSync.js';

const TABS = [
  { id: 'forge',     label: 'Obsidian Forge', icon: '\u270D\uFE0F' },
  { id: 'annotator', label: 'Annotator',      icon: '\uD83D\uDCDD' },
  { id: 'bookmarks', label: 'Bookmarks',      icon: '\uD83D\uDD16' },
  { id: 'feed',      label: 'My Feed',        icon: '\u26A1' },
  { id: 'reading',   label: 'Reading List',   icon: '\uD83D\uDCD6' },
  { id: 'folderico', label: 'Folderico',      icon: '\uD83D\uDCC1' },
];

export default function App() {
  const [activeApp, setActiveApp] = useState('forge');
  const [tabBarVisible, setTabBarVisible] = useState(true);
  const [sessionName, setSessionName] = useState(() => getSessionName());
  const [showSessionPicker, setShowSessionPicker] = useState(() => !getSessionName());

  // ── Global theme ──
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('toolbox-theme');
      if (saved) return saved === 'dark';
    } catch {}
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
  });

  useEffect(() => {
    const theme = darkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('toolbox-theme', theme); } catch {}
  }, [darkMode]);

  // Sync status for each app
  const [forgeSyncStatus, setForgeSyncStatus] = useState({ status: 'idle', lastSavedAt: null });
  const [annotatorSyncStatus, setAnnotatorSyncStatus] = useState({ status: 'idle', lastSavedAt: null });
  const [bookmarksSyncStatus, setBookmarksSyncStatus] = useState({ status: 'idle', lastSavedAt: null });
  const [feedSyncStatus, setFeedSyncStatus] = useState({ status: 'idle', lastSavedAt: null });
  const [readingSyncStatus, setReadingSyncStatus] = useState({ status: 'idle', lastSavedAt: null });

  const activeSyncStatus = { forge: forgeSyncStatus, annotator: annotatorSyncStatus, bookmarks: bookmarksSyncStatus, feed: feedSyncStatus, reading: readingSyncStatus }[activeApp] || null;

  // ── Cross-tab communication ──
  // Feed → Reading List: article to add
  const [readLaterItem, setReadLaterItem] = useState(null);
  // Reading List → Bookmarks: article to bookmark
  const [bookmarkToAdd, setBookmarkToAdd] = useState(null);
  // Reading list links (for "already saved" in feed)
  const [readingListLinks, setReadingListLinks] = useState([]);
  const readingListRef = useRef(null);

  const handleReadLater = useCallback((article) => {
    // Trigger with a new object ref each time (even for same article)
    setReadLaterItem({ ...article, _ts: Date.now() });
  }, []);

  const handleSaveToBookmarks = useCallback((item) => {
    setBookmarkToAdd({ url: item.link, name: item.title, source: item.source, _ts: Date.now() });
  }, []);

  // ── Session ──
  const handleSessionPick = useCallback((name) => {
    const clean = name.trim().toLowerCase();
    setStoredSessionName(clean);
    setSessionName(clean);
    setShowSessionPicker(false);
  }, []);

  // Obsidian bridge auto-routing
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    try {
      const params = new URLSearchParams(hash);
      const target = params.get('target');
      if (target === 'forge') setActiveApp('forge');
      else if (target === 'annotator') setActiveApp('annotator');
    } catch {}
  }, []);

  if (showSessionPicker) return <SessionPicker onPick={handleSessionPick} />;

  return (
    <div style={styles.shell}>
      {/* Tab Bar */}
      <div style={{ ...styles.switcher, ...(tabBarVisible ? {} : styles.switcherHidden) }}>
        <div style={styles.switcherInner}>
          {TABS.map((t) => (
            <button key={t.id} style={{ ...styles.tab, ...(activeApp === t.id ? styles.tabActive : {}) }}
              onClick={() => setActiveApp(t.id)}>
              <span style={styles.tabIcon}>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 2 }}>
          <button style={styles.barBtn} onClick={() => setDarkMode(v => !v)} title="Toggle theme">
            {darkMode
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            }
          </button>
          <button style={styles.barBtn} onClick={() => setTabBarVisible(false)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
            Hide
          </button>
        </div>
      </div>

      {!tabBarVisible && (
        <button style={styles.floatToggle} onClick={() => setTabBarVisible(true)}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          {TABS.find(t => t.id === activeApp)?.icon} Switch App
        </button>
      )}

      {/* App Content */}
      <div style={styles.content}>
        <div style={{ ...styles.tabPane, display: activeApp === 'forge' ? 'flex' : 'none' }}>
          <ObsidianForge sessionName={sessionName} onSyncStatusChange={setForgeSyncStatus} />
        </div>
        <div style={{ ...styles.tabPane, display: activeApp === 'annotator' ? 'flex' : 'none' }}>
          <AnnotatorApp sessionName={sessionName} onSyncStatusChange={setAnnotatorSyncStatus} />
        </div>
        <div style={{ ...styles.tabPane, display: activeApp === 'bookmarks' ? 'flex' : 'none' }}>
          <BookmarkApp sessionName={sessionName} onSyncStatusChange={setBookmarksSyncStatus} externalAdd={bookmarkToAdd} />
        </div>
        <div style={{ ...styles.tabPane, display: activeApp === 'feed' ? 'block' : 'none', overflow: 'auto' }}>
          <FeedApp sessionName={sessionName} onSyncStatusChange={setFeedSyncStatus}
            onReadLater={handleReadLater} readingListLinks={readingListLinks} />
        </div>
        <div style={{ ...styles.tabPane, display: activeApp === 'reading' ? 'flex' : 'none' }}>
          <ReadingListApp sessionName={sessionName} onSyncStatusChange={setReadingSyncStatus}
            externalAdd={readLaterItem} onSaveToBookmarks={handleSaveToBookmarks}
            onLinksChange={setReadingListLinks} />
        </div>
        <div style={{ ...styles.tabPane, display: activeApp === 'folderico' ? 'block' : 'none', overflow: 'auto' }}>
          <Folderico />
        </div>
      </div>

      {activeApp !== 'folderico' && activeSyncStatus && (
        <SyncStatus sessionName={sessionName} syncStatus={activeSyncStatus.status}
          lastSavedAt={activeSyncStatus.lastSavedAt} onChangeSession={() => setShowSessionPicker(true)} />
      )}
    </div>
  );
}

const styles = {
  shell: { height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-primary, #161514)', color: 'var(--text-primary, #e8e4de)' },
  content: { flex: 1, overflow: 'hidden', position: 'relative', minHeight: 0, background: 'var(--bg-primary, #161514)' },
  tabPane: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'column', overflow: 'hidden' },
  switcher: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg-toolbar)', borderBottom: '1px solid var(--border-secondary)',
    position: 'relative', zIndex: 50, transition: 'max-height 0.3s cubic-bezier(.4,0,.2,1), opacity 0.25s ease',
    maxHeight: 56, opacity: 1, overflow: 'hidden',
  },
  switcherHidden: { maxHeight: 0, opacity: 0, borderBottomColor: 'transparent' },
  switcherInner: { display: 'flex', alignItems: 'stretch', gap: 0 },
  tab: {
    padding: '14px 20px', border: 'none', background: 'none', color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6,
    letterSpacing: '0.2px', position: 'relative', whiteSpace: 'nowrap',
  },
  tabActive: { color: 'var(--text-primary)', background: 'var(--accent-subtle)', boxShadow: 'inset 0 -2px 0 var(--accent)' },
  tabIcon: { fontSize: 14, lineHeight: 1 },
  barBtn: {
    background: 'var(--bg-hover, #2a2927)', border: '1px solid var(--border-secondary, #2e2d2a)',
    color: 'var(--text-tertiary, #6e6960)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer',
    fontSize: 11, fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 4,
  },
  floatToggle: {
    position: 'fixed', top: 8, right: 12, zIndex: 100,
    background: 'var(--bg-surface)', backdropFilter: 'blur(12px)',
    border: '1px solid var(--border-primary)', color: 'var(--text-secondary)',
    borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 11,
    fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 5,
    boxShadow: 'var(--shadow-md)',
  },
};
