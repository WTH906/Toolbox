import React, { useState, useEffect, useRef, useMemo } from 'react';

const FOLDER_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const CHECK_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

function FolderPicker({ folders, value, onChange, sourceFolder }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const searchRef = useRef(null);
  const listRef = useRef(null);

  // Filter folders by search
  const filtered = useMemo(() => {
    if (!search.trim()) return folders;
    const q = search.toLowerCase();
    return folders.filter((f) => f.toLowerCase().includes(q));
  }, [folders, search]);

  // Focus search when dropdown opens
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
    } else {
      setSearch('');
    }
  }, [open]);

  const select = (f) => {
    onChange(f);
    setOpen(false);
  };

  const displayValue = value || '/ (vault root)';
  const indent = (path) => {
    const depth = (path.match(/\//g) || []).length;
    return { paddingLeft: 12 + depth * 16 };
  };

  return (
    <div style={styles.pickerWrap}>
      <button
        type="button"
        style={styles.pickerBtn}
        onClick={() => setOpen((v) => !v)}
      >
        {FOLDER_ICON}
        <span style={styles.pickerValue}>{displayValue}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto', flexShrink: 0, opacity: 0.5 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <>
          <div style={styles.pickerBackdrop} onClick={() => setOpen(false)} />
          <div style={styles.pickerDropdown}>
            {/* Search */}
            {folders.length > 6 && (
              <div style={styles.searchWrap}>
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search folders…"
                  style={styles.searchInput}
                />
              </div>
            )}

            {/* List */}
            <div style={styles.pickerList} ref={listRef}>
              {/* Root option */}
              <button
                type="button"
                style={{
                  ...styles.pickerItem,
                  fontWeight: !value ? 600 : 400,
                }}
                onClick={() => select('')}
              >
                <span style={styles.pickerItemIcon}>{!value ? CHECK_ICON : FOLDER_ICON}</span>
                <span>/ (vault root)</span>
              </button>

              {filtered.map((f) => {
                const isSelected = f === value;
                const isSource = f === sourceFolder;
                return (
                  <button
                    key={f}
                    type="button"
                    style={{
                      ...styles.pickerItem,
                      ...indent(f),
                      fontWeight: isSelected ? 600 : 400,
                      background: isSource ? 'var(--accent-surface)' : 'transparent',
                    }}
                    onClick={() => select(f)}
                  >
                    <span style={styles.pickerItemIcon}>{isSelected ? CHECK_ICON : FOLDER_ICON}</span>
                    <span style={{ flex: 1 }}>{f}</span>
                    {isSource && (
                      <span style={styles.originBadge}>origin</span>
                    )}
                  </button>
                );
              })}

              {filtered.length === 0 && search && (
                <p style={styles.noResults}>No folders match "{search}"</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function SendToVaultDialog({ open, onClose, markdown, fileName, sourceVault, sourceFolder, vaultFolders }) {
  const [vault, setVault] = useState('');
  const [folder, setFolder] = useState('');
  const [status, setStatus] = useState(null);

  const hasFolders = vaultFolders && vaultFolders.length > 0;

  useEffect(() => {
    if (open) {
      setVault(sourceVault || '');
      setFolder(sourceFolder || '');
      setStatus(null);
    }
  }, [open, sourceVault, sourceFolder]);

  if (!open) return null;

  const handleSend = () => {
    const vaultName = vault.trim();
    if (!vaultName) return;

    const filePath = folder.trim()
      ? `${folder.trim().replace(/\/+$/, '')}/${fileName || 'note.md'}`
      : fileName || 'note.md';

    // Build the URI manually to avoid URLSearchParams quirks with
    // Obsidian's custom protocol handler (overwrite flag, encoding)
    const uri =
      'obsidian://new?' +
      'vault=' + encodeURIComponent(vaultName) +
      '&file=' + encodeURIComponent(filePath) +
      '&content=' + encodeURIComponent(markdown) +
      '&overwrite';

    // window.location.href works more reliably than window.open
    // for custom protocol URIs across browsers
    window.location.href = uri;
    setStatus('sent');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && vault.trim()) handleSend();
    if (e.key === 'Escape') onClose();
  };

  return (
    <>
      <div style={styles.backdrop} onClick={onClose} />
      <div style={styles.dialog} onKeyDown={handleKeyDown}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.obsidianIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M8.3 3.4L15 2l4.2 5.5-.7 11L12 22l-7.3-4.5L4 7l4.3-3.6z"
                stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M12 22l3-6.5L8 13l-3.3 4.5"
                stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" opacity="0.5" />
            </svg>
          </div>
          <div>
            <h3 style={styles.title}>Send to Obsidian</h3>
            <p style={styles.subtitle}>{fileName || 'note.md'}</p>
          </div>
        </div>

        {status === 'sent' ? (
          <div style={styles.sentBox}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <p style={styles.sentText}>Sent! Check Obsidian — the note should be there.</p>
            <p style={styles.sentHint}>If Obsidian asked you to confirm, click "Allow" to let it create the file.</p>
            <button style={styles.doneBtn} onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            {/* Vault name */}
            <div style={styles.field}>
              <label style={styles.label}>Vault name</label>
              <input
                autoFocus
                type="text"
                value={vault}
                onChange={(e) => setVault(e.target.value)}
                placeholder="My Vault"
                style={styles.input}
              />
              <p style={styles.hint}>The exact name of your Obsidian vault (case-sensitive)</p>
            </div>

            {/* Folder — dropdown if we have the list, text input otherwise */}
            <div style={styles.field}>
              <label style={styles.label}>
                Folder <span style={styles.optional}>(optional)</span>
              </label>

              {hasFolders ? (
                <FolderPicker
                  folders={vaultFolders}
                  value={folder}
                  onChange={setFolder}
                  sourceFolder={sourceFolder}
                />
              ) : (
                <input
                  type="text"
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                  placeholder="Notes/Annotated"
                  style={styles.input}
                />
              )}

              <p style={styles.hint}>
                {hasFolders
                  ? 'Pick a folder from your vault, or leave as root'
                  : 'Leave empty to save at the vault root'}
              </p>
            </div>

            {/* Actions */}
            <div style={styles.actions}>
              <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
              <button
                style={{
                  ...styles.sendBtn,
                  opacity: vault.trim() ? 1 : 0.4,
                  pointerEvents: vault.trim() ? 'auto' : 'none',
                }}
                onClick={handleSend}
              >
                Send to Obsidian
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 2000,
    background: 'rgba(0,0,0,0.35)',
    backdropFilter: 'blur(3px)',
    animation: 'fadeIn 150ms ease',
  },
  dialog: {
    position: 'fixed',
    zIndex: 2001,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 420,
    maxWidth: 'calc(100vw - 32px)',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-secondary)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-lg)',
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
    animation: 'popIn 200ms ease forwards',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  obsidianIcon: {
    width: 42,
    height: 42,
    borderRadius: 'var(--radius-md)',
    background: 'var(--accent-subtle)',
    color: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    fontSize: 17,
    fontWeight: 600,
    fontFamily: 'var(--font-display)',
    color: 'var(--text-primary)',
    margin: 0,
    letterSpacing: '-0.01em',
  },
  subtitle: {
    fontSize: 13,
    color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-mono)',
    margin: 0,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  optional: {
    fontWeight: 400,
    color: 'var(--text-tertiary)',
  },
  input: {
    padding: '9px 12px',
    fontSize: 14,
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    outline: 'none',
    fontFamily: 'var(--font-body)',
    transition: 'border-color var(--transition-fast)',
  },
  hint: {
    fontSize: 12,
    color: 'var(--text-tertiary)',
    margin: 0,
    lineHeight: 1.4,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 4,
  },
  cancelBtn: {
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 500,
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
  },
  sendBtn: {
    padding: '8px 20px',
    fontSize: 13,
    fontWeight: 600,
    borderRadius: 'var(--radius-md)',
    background: 'var(--accent)',
    color: '#fff',
    cursor: 'pointer',
    transition: 'opacity var(--transition-fast)',
  },
  sentBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    padding: '16px 0 8px',
    textAlign: 'center',
  },
  sentText: {
    fontSize: 15,
    fontWeight: 500,
    color: 'var(--text-primary)',
    margin: 0,
  },
  sentHint: {
    fontSize: 13,
    color: 'var(--text-tertiary)',
    margin: 0,
    lineHeight: 1.5,
    maxWidth: 280,
  },
  doneBtn: {
    marginTop: 4,
    padding: '8px 24px',
    fontSize: 13,
    fontWeight: 600,
    borderRadius: 'var(--radius-md)',
    background: 'var(--accent)',
    color: '#fff',
    cursor: 'pointer',
  },

  /* ── Folder picker ── */
  pickerWrap: {
    position: 'relative',
  },
  pickerBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '9px 12px',
    fontSize: 14,
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'border-color var(--transition-fast)',
  },
  pickerValue: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
  },
  pickerBackdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 2010,
  },
  pickerDropdown: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    maxHeight: 260,
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-secondary)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-popover)',
    zIndex: 2011,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    animation: 'popIn 120ms ease forwards',
  },
  searchWrap: {
    padding: '8px 8px 4px',
    borderBottom: '1px solid var(--border-secondary)',
  },
  searchInput: {
    width: '100%',
    padding: '6px 10px',
    fontSize: 13,
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    outline: 'none',
    fontFamily: 'var(--font-body)',
  },
  pickerList: {
    flex: 1,
    overflowY: 'auto',
    padding: 4,
  },
  pickerItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '7px 12px',
    fontSize: 13,
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-primary)',
    background: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background var(--transition-fast)',
  },
  pickerItemIcon: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    color: 'var(--text-tertiary)',
  },
  originBadge: {
    fontSize: 10,
    fontWeight: 600,
    fontFamily: 'var(--font-body)',
    color: 'var(--accent)',
    background: 'var(--accent-subtle)',
    padding: '1px 6px',
    borderRadius: 99,
    letterSpacing: '0.03em',
    flexShrink: 0,
  },
  noResults: {
    padding: '16px 12px',
    fontSize: 13,
    color: 'var(--text-tertiary)',
    textAlign: 'center',
    margin: 0,
  },
};
