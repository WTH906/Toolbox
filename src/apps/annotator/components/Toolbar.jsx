import React, { useRef, useState } from 'react';

const ICONS = {
  import: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  exportMd: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  annotations: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  sun: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  moon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  sidebar: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  ),
  chevron: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  vault: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M8.3 3.4L15 2l4.2 5.5-.7 11L12 22l-7.3-4.5L4 7l4.3-3.6z" />
      <path d="M12 22l3-6.5L8 13l-3.3 4.5" opacity="0.5" />
    </svg>
  ),
};

export default function Toolbar({
  fileName,
  annotationCount,
  onImport,
  onExportMd,
  onExportAnnotations,
  onSendToVault,
  fromObsidian,
  darkMode,
  onToggleTheme,
  sidebarOpen,
  onToggleSidebar,
}) {
  const fileRef = useRef(null);
  const [exportOpen, setExportOpen] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onImport(file);
    e.target.value = '';
  };

  return (
    <header style={styles.toolbar}>
      <div style={styles.left}>
        <span style={styles.logo}>MD</span>
        <span style={styles.appName}>Annotator</span>
        <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>v2</span>
        {fileName && <span style={styles.fileName}>{fileName}</span>}
        {fromObsidian && <span style={styles.obsidianBadge}>from Obsidian</span>}
      </div>

      <div style={styles.right}>
        <input
          ref={fileRef}
          type="file"
          accept=".md,.markdown,.txt"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        <button
          onClick={() => fileRef.current?.click()}
          style={styles.btn}
          title="Import .md file"
        >
          {ICONS.import}
          <span style={styles.btnLabel}>Import</span>
        </button>

        <div style={styles.exportWrap}>
          <button
            onClick={() => setExportOpen((v) => !v)}
            style={styles.btn}
            title="Export"
          >
            {ICONS.exportMd}
            <span style={styles.btnLabel}>Export</span>
            {ICONS.chevron}
          </button>
          {exportOpen && (
            <>
              <div style={styles.backdrop} onClick={() => setExportOpen(false)} />
              <div style={styles.dropdown}>
                <button style={styles.dropItem} onClick={() => { onExportMd(); setExportOpen(false); }}>
                  Export Markdown (.md)
                </button>
                <button
                  style={{
                    ...styles.dropItem,
                    opacity: annotationCount === 0 ? 0.4 : 1,
                    pointerEvents: annotationCount === 0 ? 'none' : 'auto',
                  }}
                  onClick={() => { onExportAnnotations(); setExportOpen(false); }}
                >
                  Export Annotations (.json)
                </button>
              </div>
            </>
          )}
        </div>

        <button
          onClick={onSendToVault}
          style={styles.obsidianBtn}
          title="Send back to Obsidian"
        >
          {ICONS.vault}
          <span style={styles.btnLabel}>Send to Obsidian</span>
        </button>

        <div style={styles.divider} />

        <button onClick={onToggleTheme} style={styles.iconBtn} title="Toggle theme">
          {darkMode ? ICONS.sun : ICONS.moon}
        </button>

        <button
          onClick={onToggleSidebar}
          style={{
            ...styles.iconBtn,
            background: sidebarOpen ? 'var(--accent-subtle)' : 'transparent',
            color: sidebarOpen ? 'var(--accent)' : 'var(--text-secondary)',
          }}
          title="Toggle annotation sidebar"
        >
          {ICONS.sidebar}
          {annotationCount > 0 && (
            <span style={styles.badge}>{annotationCount}</span>
          )}
        </button>
      </div>
    </header>
  );
}

const styles = {
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    padding: '0 16px',
    background: 'var(--bg-toolbar)',
    borderBottom: '1px solid var(--border-secondary)',
    flexShrink: 0,
    zIndex: 100,
    gap: 12,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  logo: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
    borderRadius: 'var(--radius-sm)',
    background: 'var(--accent)',
    color: '#fff',
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: '-0.02em',
    flexShrink: 0,
  },
  appName: {
    fontFamily: 'var(--font-display)',
    fontWeight: 500,
    fontSize: 17,
    letterSpacing: '-0.01em',
    color: 'var(--text-primary)',
  },
  fileName: {
    fontSize: 13,
    color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-mono)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: 200,
  },
  obsidianBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: 99,
    background: 'var(--accent-subtle)',
    color: 'var(--accent)',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 'var(--radius-md)',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text-secondary)',
    transition: 'all var(--transition-fast)',
    whiteSpace: 'nowrap',
  },
  btnLabel: {
    fontSize: 13,
  },
  obsidianBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    borderRadius: 'var(--radius-md)',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--accent)',
    background: 'var(--accent-subtle)',
    transition: 'all var(--transition-fast)',
    whiteSpace: 'nowrap',
  },
  iconBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    transition: 'all var(--transition-fast)',
    position: 'relative',
  },
  divider: {
    width: 1,
    height: 20,
    background: 'var(--border-secondary)',
    margin: '0 6px',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 99,
    background: 'var(--accent)',
    color: '#fff',
    fontSize: 10,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px',
  },
  exportWrap: {
    position: 'relative',
  },
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 199,
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    right: 0,
    minWidth: 210,
    padding: 4,
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-secondary)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-md)',
    zIndex: 200,
  },
  dropItem: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '8px 12px',
    borderRadius: 'var(--radius-sm)',
    fontSize: 13,
    color: 'var(--text-primary)',
    transition: 'background var(--transition-fast)',
    cursor: 'pointer',
  },
};
