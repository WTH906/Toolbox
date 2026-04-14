import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, rectangularSelection, placeholder as cmPlaceholder } from "@codemirror/view";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { defaultKeymap, history, historyKeymap, indentWithTab, undo, redo } from "@codemirror/commands";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { syntaxHighlighting, HighlightStyle, bracketMatching, indentOnInput } from "@codemirror/language";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { tags } from "@lezer/highlight";
import useCloudSync from '../../shared/useCloudSync.js';
import './forge.css';

// ═══════════════════════════════════════════════════════════════════
//  ICONS
// ═══════════════════════════════════════════════════════════════════
const I = {
  h1: <span style={{ fontWeight: 700, fontSize: 13, fontFamily: "inherit", lineHeight: 1 }}>H1</span>,
  h2: <span style={{ fontWeight: 700, fontSize: 12, fontFamily: "inherit", lineHeight: 1 }}>H2</span>,
  h3: <span style={{ fontWeight: 700, fontSize: 11, fontFamily: "inherit", lineHeight: 1 }}>H3</span>,
  bold: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>,
  italic: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>,
  strike: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H8"/><line x1="4" y1="12" x2="20" y2="12"/></svg>,
  code: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  link: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  embed: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  tag: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1" fill="currentColor"/></svg>,
  ul: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="5" cy="6" r="1.2" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="5" cy="18" r="1.2" fill="currentColor" stroke="none"/></svg>,
  ol: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="2" y="8" fontSize="7" fill="currentColor" stroke="none" fontWeight="700">1</text><text x="2" y="14" fontSize="7" fill="currentColor" stroke="none" fontWeight="700">2</text><text x="2" y="20" fontSize="7" fill="currentColor" stroke="none" fontWeight="700">3</text></svg>,
  check: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>,
  quote: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 5v3z"/></svg>,
  table: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>,
  callout: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  frontmatter: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="10" x2="16" y2="10"/><line x1="4" y1="14" x2="18" y2="14"/><line x1="4" y1="18" x2="12" y2="18"/></svg>,
  codeblock: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="18" rx="2"/><polyline points="8 10 5 13 8 16"/><polyline points="16 10 19 13 16 16"/></svg>,
  divider: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="2" y1="12" x2="22" y2="12"/></svg>,
  save: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  template: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>,
  newDoc: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>,
  download: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  upload: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  trash: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  eye: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  edit: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  close: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  copy: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  sidebar: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>,
  split: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg>,
  sun: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  moon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  grip: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="9" cy="5" r="2"/><circle cx="15" cy="5" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="9" cy="19" r="2"/><circle cx="15" cy="19" r="2"/></svg>,
  undo: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>,
  redo: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  variable: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1"/><path d="M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2 2 2 0 0 0-2 2v5a2 2 0 0 1-2 2h-1"/></svg>,
};

// ═══════════════════════════════════════════════════════════════════
//  THEMES
// ═══════════════════════════════════════════════════════════════════
const THEMES = {
  dark: {
    "--bg": "#1a1b1e", "--bg-sidebar": "#141517", "--surface": "#212226", "--surface-raised": "#2a2b30",
    "--surface-hover": "#32333a", "--border": "#333439", "--fg": "#e0e0e4", "--fg-muted": "#888892",
    "--fg-faint": "#555560", "--accent": "#c49a6c", "--accent-hover": "#d4aa7c",
    "--accent-subtle": "rgba(196,154,108,0.1)", "--accent-text": "#1a1b1e", "--danger": "#e05555",
    "--success": "#5cb85c", "--info": "#448aff",
  },
  light: {
    "--bg": "#faf9f7", "--bg-sidebar": "#f0eeeb", "--surface": "#ffffff", "--surface-raised": "#f5f3f0",
    "--surface-hover": "#eae7e3", "--border": "#ddd9d4", "--fg": "#2c2c2e", "--fg-muted": "#7a7a80",
    "--fg-faint": "#b0b0b6", "--accent": "#9a6b3c", "--accent-hover": "#b07d4c",
    "--accent-subtle": "rgba(154,107,60,0.08)", "--accent-text": "#ffffff", "--danger": "#d04040",
    "--success": "#3a9a3a", "--info": "#3070d0",
  },
};

// ═══════════════════════════════════════════════════════════════════
//  CODEMIRROR THEME
// ═══════════════════════════════════════════════════════════════════
function buildCMTheme(isDark) {
  const t = isDark ? THEMES.dark : THEMES.light;
  const theme = EditorView.theme({
    "&": { backgroundColor: t["--bg"], color: t["--fg"], fontSize: "13.5px", height: "100%" },
    ".cm-content": { fontFamily: "'JetBrains Mono', 'Fira Code', monospace", padding: "16px 0", caretColor: t["--accent"] },
    ".cm-gutters": { backgroundColor: t["--bg-sidebar"], color: t["--fg-faint"], border: "none", paddingRight: "4px" },
    ".cm-activeLineGutter": { backgroundColor: "transparent", color: t["--accent"] },
    ".cm-activeLine": { backgroundColor: t["--accent-subtle"] },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": { backgroundColor: (isDark ? "rgba(196,154,108,0.18)" : "rgba(154,107,60,0.15)") + " !important" },
    ".cm-cursor": { borderLeftColor: t["--accent"], borderLeftWidth: "2px" },
    ".cm-matchingBracket": { backgroundColor: t["--accent-subtle"], outline: `1px solid ${t["--accent"]}44` },
    ".cm-searchMatch": { backgroundColor: t["--accent"] + "33", outline: `1px solid ${t["--accent"]}66` },
    ".cm-searchMatch.cm-searchMatch-selected": { backgroundColor: t["--accent"] + "55" },
    ".cm-scroller": { overflow: "auto", fontFamily: "'JetBrains Mono', monospace" },
    ".cm-line": { padding: "0 16px" },
  }, { dark: isDark });

  const hl = HighlightStyle.define([
    { tag: tags.heading1, fontWeight: "800", fontSize: "1.4em", color: t["--fg"] },
    { tag: tags.heading2, fontWeight: "700", fontSize: "1.25em", color: t["--fg"] },
    { tag: tags.heading3, fontWeight: "700", fontSize: "1.1em", color: t["--fg"] },
    { tag: tags.strong, fontWeight: "700" },
    { tag: tags.emphasis, fontStyle: "italic" },
    { tag: tags.strikethrough, textDecoration: "line-through", color: t["--fg-muted"] },
    { tag: tags.link, color: t["--accent"], textDecoration: "underline" },
    { tag: tags.url, color: t["--accent"], opacity: "0.7" },
    { tag: tags.monospace, color: t["--accent"], backgroundColor: t["--surface-raised"], borderRadius: "3px" },
    { tag: tags.meta, color: t["--fg-muted"] },
    { tag: tags.comment, color: t["--fg-faint"] },
    { tag: tags.processingInstruction, color: t["--accent"], fontWeight: "600" },
    { tag: tags.quote, color: t["--fg-muted"], fontStyle: "italic" },
    { tag: tags.keyword, color: t["--info"] },
    { tag: tags.string, color: t["--success"] },
    { tag: tags.number, color: t["--accent"] },
  ]);
  return [theme, syntaxHighlighting(hl)];
}

// ═══════════════════════════════════════════════════════════════════
//  MARKDOWN PREVIEW
// ═══════════════════════════════════════════════════════════════════
function renderMarkdown(md) {
  let h = md;
  h = h.replace(/^---\n([\s\S]*?)\n---/gm, (_, c) => {
    const rows = c.split("\n").map(l => { const [k,...v] = l.split(":"); return `<tr><td class="fm-key">${k.trim()}</td><td class="fm-val">${v.join(":").trim()}</td></tr>`; }).join("");
    return `<table class="frontmatter">${rows}</table>`;
  });
  h = h.replace(/```(\w*)\n([\s\S]*?)```/gm, (_, lang, code) => `<pre class="codeblock"><code>${code.replace(/</g,"&lt;")}</code></pre>`);
  h = h.replace(/^(\|.+\|)\n(\|[-| :]+\|)\n((?:\|.+\|\n?)*)/gm, (_, hdr, sep, body) => {
    const hc = hdr.split("|").filter(c=>c.trim()).map(c=>`<th>${c.trim()}</th>`).join("");
    const rs = body.trim().split("\n").map(r => `<tr>${r.split("|").filter(c=>c.trim()).map(c=>`<td>${c.trim()}</td>`).join("")}</tr>`).join("");
    return `<table class="md-table"><thead><tr>${hc}</tr></thead><tbody>${rs}</tbody></table>`;
  });
  h = h.replace(/^> \[!(\w+)\](.*)\n((?:> .*\n?)*)/gm, (_, type, title, body) => {
    const b = body.replace(/^> /gm,"").trim();
    return `<div class="callout callout-${type.toLowerCase()}"><div class="callout-title">${type}${title?" —"+title:""}</div><div>${b}</div></div>`;
  });
  h = h.replace(/^> (.+)$/gm, `<blockquote class="md-quote">$1</blockquote>`);
  h = h.replace(/^### (.+)$/gm, `<h3>$1</h3>`);
  h = h.replace(/^## (.+)$/gm, `<h2>$1</h2>`);
  h = h.replace(/^# (.+)$/gm, `<h1>$1</h1>`);
  h = h.replace(/^- \[x\] (.+)$/gm, `<div class="checkbox checked"><span class="cb">☑</span><s>$1</s></div>`);
  h = h.replace(/^- \[ \] (.+)$/gm, `<div class="checkbox"><span class="cb">☐</span><span>$1</span></div>`);
  h = h.replace(/^- (.+)$/gm, `<div class="list-item"><span class="bullet">•</span><span>$1</span></div>`);
  h = h.replace(/^\d+\. (.+)$/gm, (_, t) => `<div class="list-item"><span class="bullet num">·</span><span>${t}</span></div>`);
  h = h.replace(/^---$/gm, `<hr/>`);
  h = h.replace(/\*\*(.+?)\*\*/g, `<strong>$1</strong>`);
  h = h.replace(/\*(.+?)\*/g, `<em>$1</em>`);
  h = h.replace(/~~(.+?)~~/g, `<s style="color:var(--fg-muted)">$1</s>`);
  h = h.replace(/`([^`]+)`/g, `<code class="inline-code">$1</code>`);
  h = h.replace(/\[(.+?)\]\((.+?)\)/g, `<a href="$2" class="md-link">$1</a>`);
  h = h.replace(/#(\w[\w/-]*)/g, `<span class="md-tag">#$1</span>`);
  h = h.replace(/!\[\[(.+?)\]\]/g, `<div class="embed-block">📎 $1</div>`);
  h = h.replace(/\[\[(.+?)\]\]/g, `<span class="wikilink">$1</span>`);
  h = h.replace(/\{\{(\w+)\}\}/g, `<span class="tpl-var">{{$1}}</span>`);
  h = h.replace(/\n\n/g, `<div style="height:10px"></div>`);
  return h;
}

// ═══════════════════════════════════════════════════════════════════
//  TEMPLATE VARIABLE HELPERS
// ═══════════════════════════════════════════════════════════════════
function extractVars(content) {
  return [...new Set([...content.matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1]))];
}
function fillVars(content, values) {
  let r = content;
  for (const [k,v] of Object.entries(values)) r = r.replaceAll(`{{${k}}}`, v);
  const now = new Date();
  r = r.replaceAll("{{date}}", now.toISOString().split("T")[0]);
  r = r.replaceAll("{{time}}", now.toLocaleTimeString());
  r = r.replaceAll("{{datetime}}", now.toISOString());
  return r;
}

// ═══════════════════════════════════════════════════════════════════
//  DIALOG WRAPPER
// ═══════════════════════════════════════════════════════════════════
function Dialog({ title, onClose, wide, children }) {
  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className={`dialog ${wide?"dialog-wide":""}`} onClick={e=>e.stopPropagation()}>
        <div className="dialog-header"><span className="dialog-title">{title}</span><button className="icon-btn" onClick={onClose}>{I.close}</button></div>
        <div className="dialog-body">{children}</div>
      </div>
    </div>
  );
}

function TableDialog({ onInsert, onClose }) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [headers, setHeaders] = useState("Col 1, Col 2, Col 3");
  return (
    <Dialog title="Insert Table" onClose={onClose}>
      <label className="label">Headers (comma-separated)</label>
      <input className="input" value={headers} onChange={e=>setHeaders(e.target.value)} />
      <div style={{display:"flex",gap:12}}>
        <div style={{flex:1}}><label className="label">Rows</label><input className="input" type="number" min={1} max={20} value={rows} onChange={e=>setRows(+e.target.value)}/></div>
        <div style={{flex:1}}><label className="label">Columns</label><input className="input" type="number" min={1} max={10} value={cols} onChange={e=>setCols(+e.target.value)}/></div>
      </div>
      <button className="primary-btn" onClick={()=>{
        const hA=headers.split(",").map(h=>h.trim()); while(hA.length<cols)hA.push(`Col ${hA.length+1}`);
        onInsert(`| ${hA.slice(0,cols).join(" | ")} |\n| ${Array(cols).fill("---").join(" | ")} |\n${Array(rows).fill("| "+Array(cols).fill("   ").join(" | ")+" |").join("\n")}`);
        onClose();
      }}>Insert Table</button>
    </Dialog>
  );
}

function FrontmatterDialog({ onInsert, onClose }) {
  const [fields, setFields] = useState([{key:"title",value:""},{key:"tags",value:""},{key:"date",value:new Date().toISOString().split("T")[0]},{key:"aliases",value:""}]);
  const up=(i,p,v)=>{const c=[...fields];c[i][p]=v;setFields(c);};
  return (
    <Dialog title="Frontmatter / Properties" onClose={onClose}>
      {fields.map((f,i)=>(
        <div key={i} className="field-row">
          <input className="input" style={{flex:"0 0 120px",marginBottom:0}} value={f.key} onChange={e=>up(i,"key",e.target.value)} placeholder="key"/>
          <input className="input" style={{flex:1,marginBottom:0}} value={f.value} onChange={e=>up(i,"value",e.target.value)} placeholder="value"/>
          <button className="icon-btn danger" onClick={()=>setFields(fields.filter((_,j)=>j!==i))}>{I.close}</button>
        </div>
      ))}
      <button className="ghost-btn" onClick={()=>setFields([...fields,{key:"",value:""}])}>+ Add field</button>
      <button className="primary-btn mt8" onClick={()=>{
        const lines=fields.filter(f=>f.key.trim()).map(f=>`${f.key}: ${f.value}`);
        onInsert(`---\n${lines.join("\n")}\n---\n`); onClose();
      }}>Insert Frontmatter</button>
    </Dialog>
  );
}

function CalloutDialog({ onInsert, onClose }) {
  const types=["note","tip","warning","danger","info","important","example"];
  const [type,setType]=useState("note"); const [title,setTitle]=useState(""); const [body,setBody]=useState("");
  return (
    <Dialog title="Insert Callout" onClose={onClose}>
      <label className="label">Type</label>
      <div className="chip-row">{types.map(t=><button key={t} className={`chip ${t===type?"chip-active":""}`} onClick={()=>setType(t)}>{t}</button>)}</div>
      <label className="label">Title (optional)</label>
      <input className="input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Callout title"/>
      <label className="label">Content</label>
      <textarea className="input textarea" value={body} onChange={e=>setBody(e.target.value)} placeholder="Callout content..."/>
      <button className="primary-btn" onClick={()=>{
        const lines=body?body.split("\n").map(l=>`> ${l}`).join("\n"):"> ";
        onInsert(`> [!${type}]${title?` ${title}`:""}\n${lines}`); onClose();
      }}>Insert Callout</button>
    </Dialog>
  );
}

function SaveTemplateDialog({ onSave, onClose }) {
  const [name,setName]=useState(""); const [desc,setDesc]=useState(""); const [cat,setCat]=useState("");
  return (
    <Dialog title="Save as Template" onClose={onClose}>
      <label className="label">Template name</label>
      <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Meeting Notes" autoFocus/>
      <label className="label">Category (optional)</label>
      <input className="input" value={cat} onChange={e=>setCat(e.target.value)} placeholder="e.g. work, personal"/>
      <label className="label">Description (optional)</label>
      <input className="input" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Brief description..."/>
      <button className="primary-btn" onClick={()=>{if(name.trim()){onSave(name.trim(),desc.trim(),cat.trim());onClose();}}}>Save Template</button>
    </Dialog>
  );
}

function VarFillDialog({ variables, onApply, onClose }) {
  const [vals,setVals]=useState(()=>{const o={};variables.forEach(v=>{o[v]=v==="date"?new Date().toISOString().split("T")[0]:v==="time"?new Date().toLocaleTimeString():""});return o;});
  return (
    <Dialog title="Fill Template Variables" onClose={onClose}>
      <p style={{fontSize:"0.85em",color:"var(--fg-muted)",marginBottom:12}}>Fill placeholders below or skip to keep the <code className="inline-code">{"{{var}}"}</code> syntax.</p>
      {variables.map(v=>(<div key={v}><label className="label">{`{{${v}}}`}</label><input className="input" value={vals[v]} onChange={e=>setVals({...vals,[v]:e.target.value})} placeholder={v}/></div>))}
      <div className="btn-row">
        <button className="ghost-btn" onClick={()=>onApply({})}>Skip</button>
        <button className="primary-btn" onClick={()=>onApply(vals)}>Apply</button>
      </div>
    </Dialog>
  );
}

function TemplatePicker({ templates, onSelect, onDelete, onClose, onExport, onImport }) {
  const [search,setSearch]=useState(""); const fileRef=useRef(null);
  const cats=useMemo(()=>{const s=new Set(templates.map(t=>t.category||"uncategorized"));return["all",...[...s].sort()];},[templates]);
  const [activeCat,setActiveCat]=useState("all");
  const filtered=templates.filter(t=>{
    const ms=!search||t.name.toLowerCase().includes(search.toLowerCase())||(t.desc||"").toLowerCase().includes(search.toLowerCase());
    const mc=activeCat==="all"||(t.category||"uncategorized")===activeCat; return ms&&mc;
  });
  return (
    <Dialog title="Templates" onClose={onClose} wide>
      <div className="tpl-toolbar">
        <div className="search-box">{I.search}<input className="search-input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search templates..."/></div>
        <div style={{display:"flex",gap:4}}>
          <button className="sm-btn" onClick={()=>fileRef.current?.click()}>{I.upload} Import</button>
          <button className="sm-btn" onClick={onExport} disabled={!templates.length}>{I.download} Export</button>
          <input ref={fileRef} type="file" accept=".json" style={{display:"none"}} onChange={e=>{
            const f=e.target.files?.[0]; if(!f)return; const r=new FileReader();
            r.onload=ev=>{try{onImport(JSON.parse(ev.target.result))}catch{alert("Invalid JSON")}}; r.readAsText(f); e.target.value="";
          }}/>
        </div>
      </div>
      {cats.length>2&&<div className="chip-row mb8">{cats.map(c=><button key={c} className={`chip ${c===activeCat?"chip-active":""}`} onClick={()=>setActiveCat(c)}>{c}</button>)}</div>}
      <div className="tpl-list">
        {!filtered.length?<div className="empty-state">{!templates.length?"No templates yet. Save one or import a JSON file.":"No match."}</div>
        :filtered.map(t=>{const ri=templates.indexOf(t);const vs=extractVars(t.content);return(
          <div key={ri} className="tpl-card" onClick={()=>onSelect(t)}>
            <div style={{flex:1}}>
              <div className="tpl-name">{t.name}</div>
              {t.category&&<span className="badge cat-badge">{t.category}</span>}
              {vs.length>0&&<span className="badge var-badge">{vs.length} var{vs.length>1?"s":""}</span>}
              {t.desc&&<div className="tpl-desc">{t.desc}</div>}
              <div className="tpl-date">{new Date(t.created).toLocaleDateString()}</div>
            </div>
            <button className="icon-btn danger" onClick={e=>{e.stopPropagation();onDelete(ri)}}>{I.trash}</button>
          </div>
        );})}
      </div>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  SIDEBAR
// ═══════════════════════════════════════════════════════════════════
function Sidebar({ docs, activeDoc, onSelect, onNew, onDelete, onRename, onReorder }) {
  const [editIdx,setEditIdx]=useState(-1); const [editName,setEditName]=useState("");
  const [search,setSearch]=useState(""); const [dragIdx,setDragIdx]=useState(-1); const [overIdx,setOverIdx]=useState(-1);
  const items=docs.map((d,i)=>({...d,idx:i})).filter(d=>!search||d.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="sidebar">
      <div className="sidebar-header"><span className="sidebar-label">Documents</span><button className="icon-btn" onClick={onNew} title="New document">{I.newDoc}</button></div>
      <div className="sidebar-search">{I.search}<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Filter..." className="search-input"/></div>
      <div className="sidebar-list">
        {items.map(doc=>(
          <div key={doc.idx} className={`sidebar-item ${doc.idx===activeDoc?"active":""} ${overIdx===doc.idx?"drag-over":""}`}
            onClick={()=>onSelect(doc.idx)} draggable
            onDragStart={()=>setDragIdx(doc.idx)} onDragOver={e=>{e.preventDefault();setOverIdx(doc.idx)}}
            onDrop={()=>{if(dragIdx!==-1&&dragIdx!==doc.idx)onReorder(dragIdx,doc.idx);setDragIdx(-1);setOverIdx(-1)}}
            onDragEnd={()=>{setDragIdx(-1);setOverIdx(-1)}}>
            <span className="grip-handle">{I.grip}</span>
            {editIdx===doc.idx?(
              <input className="input inline-rename" value={editName}
                onChange={e=>setEditName(e.target.value)}
                onBlur={()=>{onRename(doc.idx,editName);setEditIdx(-1)}}
                onKeyDown={e=>{if(e.key==="Enter"){onRename(doc.idx,editName);setEditIdx(-1)}if(e.key==="Escape")setEditIdx(-1)}}
                autoFocus onClick={e=>e.stopPropagation()}/>
            ):(
              <>
                <span className="doc-name">{doc.name}</span>
                <div className="doc-actions">
                  <button className="tiny-btn" onClick={e=>{e.stopPropagation();setEditIdx(doc.idx);setEditName(doc.name)}}>{I.edit}</button>
                  {docs.length>1&&<button className="tiny-btn" onClick={e=>{e.stopPropagation();onDelete(doc.idx)}}>{I.trash}</button>}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  CODEMIRROR WRAPPER
// ═══════════════════════════════════════════════════════════════════
function CMEditor({ value, onChange, isDark, viewRef }) {
  const containerRef = useRef(null);
  const internalViewRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current) return;
    const updateListener = EditorView.updateListener.of(u => { if (u.docChanged) onChangeRef.current(u.state.doc.toString()); });
    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(), highlightActiveLine(), highlightActiveLineGutter(), drawSelection(), rectangularSelection(),
        bracketMatching(), closeBrackets(), indentOnInput(), highlightSelectionMatches(), history(),
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        keymap.of([...defaultKeymap, ...historyKeymap, ...closeBracketsKeymap, ...searchKeymap, indentWithTab]),
        ...buildCMTheme(isDark), updateListener, EditorView.lineWrapping,
        cmPlaceholder("Start writing markdown...\n\nUse the toolbar above or keyboard shortcuts.\nTemplate variables: {{variableName}}"),
      ],
    });
    const view = new EditorView({ state, parent: containerRef.current });
    internalViewRef.current = view;
    if (viewRef) viewRef.current = view;
    return () => { view.destroy(); internalViewRef.current = null; };
  }, [isDark]);

  useEffect(() => {
    const view = internalViewRef.current;
    if (!view) return;
    const cur = view.state.doc.toString();
    if (cur !== value) view.dispatch({ changes: { from: 0, to: cur.length, insert: value } });
  }, [value]);

  return <div ref={containerRef} className="cm-wrapper" />;
}

// ═══════════════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════════════
export default function ObsidianForge({ sessionName: parentSession, onSyncStatusChange }) {
  const [docs,setDocs]=useState([{name:"Untitled",content:""}]);
  const [activeDoc,setActiveDoc]=useState(0);
  const [templates,setTemplates]=useState([]);
  const [viewMode,setViewMode]=useState("edit");
  const [dialog,setDialog]=useState(null);
  const [pending,setPending]=useState(null);
  const [toast,setToast]=useState(null);
  const [showSidebar,setShowSidebar]=useState(true);
  const [theme,setTheme]=useState(()=>{try{return localStorage.getItem("obsidian-forge-theme")||"dark"}catch{return"dark"}});
  const [vaultDialogOpen,setVaultDialogOpen]=useState(false);
  const [sourceVault,setSourceVault]=useState('');
  const [sourceFolder,setSourceFolder]=useState('');
  const [vaultFolders,setVaultFolders]=useState([]);
  const cmViewRef=useRef(null);
  const isDark=theme==="dark";
  const bootRan=useRef(false);
  const initialLoadDone=useRef(false);

  const cloud = useCloudSync('forge');

  // Sync session name from parent
  useEffect(()=>{
    if(parentSession && parentSession !== cloud.sessionName) cloud.setSessionName(parentSession);
  },[parentSession]);

  // Report sync status up
  useEffect(()=>{
    onSyncStatusChange?.({ status: cloud.syncStatus, lastSavedAt: cloud.lastSavedAt });
  },[cloud.syncStatus, cloud.lastSavedAt, onSyncStatusChange]);

  // Boot: load from cloud
  useEffect(()=>{
    if(bootRan.current) return;
    bootRan.current=true;
    async function boot(){
      if(cloud.hasSession){
        const data=await cloud.loadFromCloud();
        if(data?.docs?.length) setDocs(data.docs);
        if(data?.templates?.length) setTemplates(data.templates);
      }
      // Check hash for Obsidian bridge
      loadFromHash();
      initialLoadDone.current=true;
    }
    boot();
  },[]);

  // Hash loading for Obsidian bridge
  const loadFromHash=useCallback(()=>{
    const hash=window.location.hash.slice(1);
    if(!hash) return false;
    try{
      const params=new URLSearchParams(hash);
      const target=params.get('target');
      if(target && target!=='forge') return false;
      const name=params.get('name');
      const content=params.get('content');
      const vault=params.get('vault');
      const folder=params.get('folder');
      const foldersRaw=params.get('folders');
      if(!content||!name) return false;
      const fixedContent=content.replace(/ /g,'+');
      const decoded=decodeURIComponent(escape(atob(fixedContent)));
      const folders=foldersRaw?foldersRaw.split('|').filter(Boolean):[];
      if(vault) setSourceVault(vault);
      if(folder) setSourceFolder(folder);
      if(folders.length) setVaultFolders(folders);
      // Find existing doc with same name or add new
      const existingIdx=docs.findIndex(d=>d.name===name);
      if(existingIdx>=0){
        const u=[...docs];u[existingIdx]={...u[existingIdx],content:decoded};
        setDocs(u);setActiveDoc(existingIdx);
      } else {
        const u=[...docs,{name,content:decoded}];
        setDocs(u);setActiveDoc(u.length-1);
      }
      window.history.replaceState(null,'',window.location.pathname);
      flash(`Loaded "${name}" from Obsidian`);
      return true;
    }catch(err){console.warn('Hash load failed:',err);return false;}
  },[docs]);

  // Listen for hash changes (Obsidian bridge)
  useEffect(()=>{
    const onHash=()=>{if(window.location.hash.length>1) loadFromHash();};
    window.addEventListener('hashchange',onHash);
    window.addEventListener('focus',onHash);
    return ()=>{window.removeEventListener('hashchange',onHash);window.removeEventListener('focus',onHash);};
  },[loadFromHash]);

  // Auto-save to cloud
  useEffect(()=>{
    if(!initialLoadDone.current||!cloud.hasSession) return;
    cloud.saveToCloud({ docs, templates });
  },[docs,templates,cloud.hasSession]);

  // Theme persistence (stays local — it's a preference)
  useEffect(()=>{try{localStorage.setItem("obsidian-forge-theme",theme)}catch{}},[theme]);

  // Send to Obsidian vault
  const sendToVault=(vaultName,folderPath)=>{
    const d=docs[activeDoc];
    const filePath=folderPath?`${folderPath.replace(/\/+$/,'')}/${d.name.endsWith('.md')?d.name:d.name+'.md'}`:d.name.endsWith('.md')?d.name:d.name+'.md';
    const uri='obsidian://new?vault='+encodeURIComponent(vaultName)+'&file='+encodeURIComponent(filePath)+'&content='+encodeURIComponent(d.content)+'&overwrite';
    window.location.href=uri;
    flash('Sent to Obsidian!');
  };

  const flash=(m)=>{setToast(m);setTimeout(()=>setToast(null),2200)};

  // Editor ops
  const ins=(text)=>{const v=cmViewRef.current;if(!v)return;const{from,to}=v.state.selection.main;v.dispatch({changes:{from,to,insert:text},selection:{anchor:from+text.length}});v.focus()};
  const wrap=(b,a)=>{const v=cmViewRef.current;if(!v)return;const{from,to}=v.state.selection.main;const s=v.state.sliceDoc(from,to);v.dispatch({changes:{from,to,insert:b+s+a},selection:{anchor:s?from+b.length:from+b.length,head:s?from+b.length+s.length:from+b.length}});v.focus()};
  const lineIns=(p)=>{const v=cmViewRef.current;if(!v)return;const pos=v.state.selection.main.from;const ln=v.state.doc.lineAt(pos);v.dispatch({changes:{from:ln.from,to:ln.from,insert:p}});v.focus()};
  const doUndo=()=>{const v=cmViewRef.current;if(v)undo(v)};
  const doRedo=()=>{const v=cmViewRef.current;if(v)redo(v)};

  const updateContent=(c)=>{const u=[...docs];u[activeDoc]={...u[activeDoc],content:c};setDocs(u)};

  // Doc management
  const newDoc=()=>{const u=[...docs,{name:"Untitled",content:""}];setDocs(u);setActiveDoc(u.length-1)};
  const delDoc=(i)=>{if(docs.length<=1)return;const u=docs.filter((_,j)=>j!==i);setDocs(u);setActiveDoc(Math.min(activeDoc,u.length-1))};
  const renDoc=(i,n)=>{if(!n.trim())return;const u=[...docs];u[i]={...u[i],name:n.trim()};setDocs(u)};
  const reorder=(from,to)=>{const u=[...docs];const[it]=u.splice(from,1);u.splice(to,0,it);setDocs(u);if(activeDoc===from)setActiveDoc(to);else if(from<activeDoc&&to>=activeDoc)setActiveDoc(activeDoc-1);else if(from>activeDoc&&to<=activeDoc)setActiveDoc(activeDoc+1)};

  // Templates
  const saveTpl=(n,d,c)=>{const nt=[...templates,{name:n,desc:d,category:c,content:docs[activeDoc].content,created:Date.now()}];setTemplates(nt);flash(`Template "${n}" saved`)};
  const selectTpl=(t)=>{const vs=extractVars(t.content).filter(v=>!["date","time","datetime"].includes(v));if(vs.length>0){setPending(t);setDialog("fillVars")}else applyTpl(t,{})};
  const applyTpl=(t,vals)=>{const c=fillVars(t.content,vals||{});const u=[...docs];u[activeDoc]={...u[activeDoc],content:c};setDocs(u);flash(`Applied "${t.name}"`);setPending(null)};
  const delTpl=(i)=>{const nt=templates.filter((_,j)=>j!==i);setTemplates(nt)};
  const exportTpl=()=>{const d={version:1,exportedAt:new Date().toISOString(),templates};const b=new Blob([JSON.stringify(d,null,2)],{type:"application/json"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=`obsidian-forge-templates-${new Date().toISOString().split("T")[0]}.json`;a.click();URL.revokeObjectURL(u);flash(`Exported ${templates.length} template(s)`)};
  const importTpl=(data)=>{let inc=Array.isArray(data)?data:data.templates;if(!Array.isArray(inc)){alert("Bad format");return}const val=inc.filter(t=>t.name&&typeof t.content==="string");if(!val.length){alert("No valid templates");return}const ex=new Set(templates.map(t=>t.name));const add=val.filter(t=>!ex.has(t.name));if(!add.length){flash("All already exist");return}const m=[...templates,...add.map(t=>({name:t.name,desc:t.desc||"",category:t.category||"",content:t.content,created:t.created||Date.now()}))];setTemplates(m);flash(`Imported ${add.length} template(s)`)};

  const handleDL=()=>{const d=docs[activeDoc];const b=new Blob([d.content],{type:"text/markdown"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=d.name.endsWith(".md")?d.name:d.name+".md";a.click();URL.revokeObjectURL(u);flash("Downloaded!")};

  const groups=[
    [{icon:I.undo,action:doUndo,tip:"Undo"},{icon:I.redo,action:doRedo,tip:"Redo"}],
    [{icon:I.h1,action:()=>lineIns("# "),tip:"H1"},{icon:I.h2,action:()=>lineIns("## "),tip:"H2"},{icon:I.h3,action:()=>lineIns("### "),tip:"H3"}],
    [{icon:I.bold,action:()=>wrap("**","**"),tip:"Bold"},{icon:I.italic,action:()=>wrap("*","*"),tip:"Italic"},{icon:I.strike,action:()=>wrap("~~","~~"),tip:"Strike"},{icon:I.code,action:()=>wrap("`","`"),tip:"Code"}],
    [{icon:I.link,action:()=>wrap("[","](url)"),tip:"Link"},{icon:I.embed,action:()=>ins("![[filename]]"),tip:"Embed"},{icon:I.tag,action:()=>ins("#tag"),tip:"Tag"},{icon:I.variable,action:()=>ins("{{variableName}}"),tip:"Variable"}],
    [{icon:I.ul,action:()=>lineIns("- "),tip:"Bullets"},{icon:I.ol,action:()=>lineIns("1. "),tip:"Numbers"},{icon:I.check,action:()=>lineIns("- [ ] "),tip:"Checkbox"},{icon:I.quote,action:()=>lineIns("> "),tip:"Quote"}],
    [{icon:I.table,action:()=>setDialog("table"),tip:"Table"},{icon:I.callout,action:()=>setDialog("callout"),tip:"Callout"},{icon:I.frontmatter,action:()=>setDialog("frontmatter"),tip:"Frontmatter"},{icon:I.codeblock,action:()=>ins("```\n\n```"),tip:"Code block"},{icon:I.divider,action:()=>ins("\n---\n"),tip:"Divider"}],
  ];

  const cur=docs[activeDoc]||docs[0];
  const wc=cur.content.split(/\s+/).filter(Boolean).length;
  const vc=extractVars(cur.content).length;

  return (
    <div className="app-root" style={THEMES[theme]}>
      {showSidebar&&<Sidebar docs={docs} activeDoc={activeDoc} onSelect={setActiveDoc} onNew={newDoc} onDelete={delDoc} onRename={renDoc} onReorder={reorder}/>}
      <div className="main">
        <div className="topbar">
          <div className="topbar-left">
            <button className="icon-btn" onClick={()=>setShowSidebar(!showSidebar)}>{I.sidebar}</button>
            <span className="app-logo">Obsidian Forge</span>
          </div>
          <div className="topbar-right">
            <button className="tb-btn" onClick={()=>setDialog("templatePicker")}>{I.template}<span className="btn-label">Templates</span></button>
            <button className="tb-btn" onClick={()=>setDialog("saveTemplate")}>{I.save}<span className="btn-label">Save Template</span></button>
            <div className="divider-v"/>
            <div className="view-toggle">
              <button className={`vt-btn ${viewMode==="edit"?"vt-active":""}`} onClick={()=>setViewMode("edit")} title="Editor">{I.edit}</button>
              <button className={`vt-btn ${viewMode==="split"?"vt-active":""}`} onClick={()=>setViewMode("split")} title="Split">{I.split}</button>
              <button className={`vt-btn ${viewMode==="preview"?"vt-active":""}`} onClick={()=>setViewMode("preview")} title="Preview">{I.eye}</button>
            </div>
            <div className="divider-v"/>
            <button className="icon-btn" onClick={handleDL} title="Download .md">{I.download}</button>
            <button className="icon-btn" onClick={()=>{navigator.clipboard.writeText(cur.content);flash("Copied!")}} title="Copy">{I.copy}</button>
            <button className="tb-btn" onClick={()=>setVaultDialogOpen(true)} style={{color:'var(--accent)',background:'var(--accent-subtle)'}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M8.3 3.4L15 2l4.2 5.5-.7 11L12 22l-7.3-4.5L4 7l4.3-3.6z"/></svg>
              <span className="btn-label">Obsidian</span>
            </button>
            <button className="icon-btn" onClick={()=>setTheme(isDark?"light":"dark")} title="Toggle theme">{isDark?I.sun:I.moon}</button>
          </div>
        </div>

        {viewMode!=="preview"&&(
          <div className="toolbar">
            {groups.map((g,gi)=>(
              <div key={gi} className="toolbar-group">
                {g.map((t,ti)=><button key={ti} className="tool-btn" onClick={t.action} title={t.tip}>{t.icon}</button>)}
                {gi<groups.length-1&&<div className="divider-v small"/>}
              </div>
            ))}
          </div>
        )}

        <div className={`editor-area ${viewMode}`}>
          {(viewMode==="edit"||viewMode==="split")&&(
            <div className="editor-pane">
              <CMEditor key={`${activeDoc}-${theme}`} value={cur.content} onChange={updateContent} isDark={isDark} viewRef={cmViewRef}/>
            </div>
          )}
          {(viewMode==="preview"||viewMode==="split")&&(
            <div className="preview-pane"><div className="preview-content" dangerouslySetInnerHTML={{__html:renderMarkdown(cur.content)}}/></div>
          )}
        </div>

        <div className="statusbar">
          <span>{wc} words</span><span>{cur.content.length} chars</span><span>{cur.content.split("\n").length} lines</span>
          {vc>0&&<span className="status-accent">{vc} var{vc!==1?"s":""}</span>}
          <span className="status-right status-accent">{templates.length} template{templates.length!==1?"s":""}</span>
        </div>
      </div>

      {dialog==="table"&&<TableDialog onInsert={ins} onClose={()=>setDialog(null)}/>}
      {dialog==="frontmatter"&&<FrontmatterDialog onInsert={ins} onClose={()=>setDialog(null)}/>}
      {dialog==="callout"&&<CalloutDialog onInsert={ins} onClose={()=>setDialog(null)}/>}
      {dialog==="saveTemplate"&&<SaveTemplateDialog onSave={saveTpl} onClose={()=>setDialog(null)}/>}
      {dialog==="templatePicker"&&<TemplatePicker templates={templates} onSelect={t=>{setDialog(null);selectTpl(t)}} onDelete={delTpl} onClose={()=>setDialog(null)} onExport={exportTpl} onImport={importTpl}/>}
      {dialog==="fillVars"&&pending&&<VarFillDialog variables={extractVars(pending.content).filter(v=>!["date","time","datetime"].includes(v))} onApply={v=>{applyTpl(pending,v);setDialog(null)}} onClose={()=>{setDialog(null);setPending(null)}}/>}

      {vaultDialogOpen&&<ForgeVaultDialog
        onClose={()=>setVaultDialogOpen(false)}
        onSend={sendToVault}
        fileName={cur.name}
        defaultVault={sourceVault}
        defaultFolder={sourceFolder}
        folders={vaultFolders}
      />}

      {toast&&<div className="toast">{toast}</div>}
    </div>
  );
}

// ── Simple vault dialog for Forge ──
function ForgeVaultDialog({ onClose, onSend, fileName, defaultVault, defaultFolder, folders }) {
  const [vault, setVault] = useState(defaultVault || '');
  const [folder, setFolder] = useState(defaultFolder || '');
  const [sent, setSent] = useState(false);
  const handleSend = () => { if (vault.trim()) { onSend(vault.trim(), folder.trim()); setSent(true); } };
  return (
    <>
      <div className="dialog-overlay" onClick={onClose}>
        <div className="dialog dialog-wide" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
          <div className="dialog-header">
            <span className="dialog-title">Send to Obsidian</span>
            <button className="icon-btn" onClick={onClose}>{I.close}</button>
          </div>
          <div className="dialog-body">
            {sent ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
                <p style={{ fontSize: 14, color: 'var(--fg)', marginBottom: 4 }}>Sent! Check Obsidian.</p>
                <p style={{ fontSize: 12, color: 'var(--fg-muted)' }}>If prompted, click "Allow" to create the file.</p>
                <button className="primary-btn mt8" onClick={onClose}>Done</button>
              </div>
            ) : (
              <>
                <label className="label">Vault name</label>
                <input className="input" value={vault} onChange={e => setVault(e.target.value)} placeholder="My Vault"
                  autoFocus onKeyDown={e => { if (e.key === 'Enter') handleSend(); if (e.key === 'Escape') onClose(); }} />
                <label className="label">Folder <span style={{ fontWeight: 400, color: 'var(--fg-faint)' }}>(optional)</span></label>
                {folders.length > 0 ? (
                  <select className="input" value={folder} onChange={e => setFolder(e.target.value)} style={{ cursor: 'pointer' }}>
                    <option value="">/ (vault root)</option>
                    {folders.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                ) : (
                  <input className="input" value={folder} onChange={e => setFolder(e.target.value)} placeholder="Notes/Drafts" />
                )}
                <p style={{ fontSize: 12, color: 'var(--fg-muted)', margin: '0 0 12px' }}>File: {fileName || 'note'}.md</p>
                <button className="primary-btn" onClick={handleSend} style={{ opacity: vault.trim() ? 1 : 0.4 }}>Send to Obsidian</button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
