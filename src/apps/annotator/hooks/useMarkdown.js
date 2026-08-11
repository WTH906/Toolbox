import { useState, useCallback, useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const DEFAULT_MD = `# Welcome to Markdown Annotator

Import a \`.md\` file using the toolbar above, or drag-and-drop one onto this window.

Once loaded you can **select any text** to highlight it or leave a comment — just like [Hypothes.is](https://web.hypothes.is/).

## Quick feature tour

### Import & Export
- **Import** any \`.md\` file from disk
- **Export** your markdown back out, or export annotations as a separate JSON sidecar

### Annotations
Select rendered text to:
- **Highlight** it in one of five colours
- **Comment** on it with a note

All annotations appear in the right-hand sidebar where you can jump to them, edit, or delete.

---

> "The art of reading is the art of adopting the pace the author has set." — *Adapted from various*

Happy reading!
`;

export default function useMarkdown() {
  const [markdown, setMarkdown] = useState(DEFAULT_MD);
  const [fileName, setFileName] = useState(null);
  // Source info from Obsidian (when opened via plugin)
  const [sourceVault, setSourceVault] = useState(null);
  const [sourceFolder, setSourceFolder] = useState(null);
  const [vaultFolders, setVaultFolders] = useState([]);
  const [fromObsidian, setFromObsidian] = useState(false);

  const html = useMemo(() => {
    const raw = marked.parse(markdown, { gfm: true, breaks: true });
    return DOMPurify.sanitize(raw);
  }, [markdown]);

  // Try to load note from URL hash on mount
  const loadFromHash = useCallback(() => {
    const hash = window.location.hash.slice(1); // remove #
    if (!hash) return false;

    try {
      const params = new URLSearchParams(hash);
      const name = params.get('name');
      const content = params.get('content');
      const vault = params.get('vault');
      const folder = params.get('folder');
      const foldersRaw = params.get('folders');

      if (!content || !name) return false;

      // Decode base64 → UTF-8
      const decoded = decodeURIComponent(escape(atob(content)));

      setMarkdown(decoded);
      setFileName(name);
      setSourceVault(vault || null);
      setSourceFolder(folder || null);
      setFromObsidian(true);

      // Parse pipe-separated folder list from plugin
      if (foldersRaw) {
        setVaultFolders(foldersRaw.split('|').filter(Boolean));
      }

      // Clean the URL so refreshing doesn't re-import
      window.history.replaceState(null, '', window.location.pathname);

      return true;
    } catch (err) {
      console.warn('Failed to load note from URL hash:', err);
      return false;
    }
  }, []);

  const loadFile = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMarkdown(e.target.result);
        setFileName(file.name);
        setFromObsidian(false);
        setSourceVault(null);
        setSourceFolder(null);
        resolve(e.target.result);
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }, []);

  const loadText = useCallback((text, name) => {
    setMarkdown(text);
    setFileName(name || null);
  }, []);

  const exportMarkdown = useCallback(() => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'document.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [markdown, fileName]);

  const exportAnnotations = useCallback((annotations) => {
    const data = {
      source: fileName || 'document.md',
      exportedAt: new Date().toISOString(),
      annotations: annotations.map(({ id, text, color, comment, createdAt }) => ({
        id, text, color, comment, createdAt,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (fileName || 'document').replace(/\.md$/, '') + '.annotations.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [fileName]);

  return {
    markdown,
    html,
    fileName,
    sourceVault,
    sourceFolder,
    vaultFolders,
    fromObsidian,
    loadFromHash,
    loadFile,
    loadText,
    exportMarkdown,
    exportAnnotations,
  };
}
