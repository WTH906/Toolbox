import React, { useRef, useEffect, useCallback } from 'react';
import 'github-markdown-css/github-markdown-light.css';

const COLOR_MAP = {
  yellow: 'var(--hl-yellow)',
  green: 'var(--hl-green)',
  blue: 'var(--hl-blue)',
  pink: 'var(--hl-pink)',
  orange: 'var(--hl-orange)',
};

/**
 * Walk text nodes in `root`, find occurrences of `text` and wrap them with
 * a <mark> element.  Handles text that spans multiple text nodes.
 */
function highlightText(root, text, annotationId, color) {
  if (!text || !root) return;

  // Collect all text nodes
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  // Build a combined string with node boundaries
  let combined = '';
  const segments = []; // { node, start, end }
  for (const node of textNodes) {
    const start = combined.length;
    combined += node.textContent;
    segments.push({ node, start, end: combined.length });
  }

  // Find the first occurrence of the annotation text
  const idx = combined.indexOf(text);
  if (idx === -1) return;

  const matchEnd = idx + text.length;

  // Find which text nodes overlap with [idx, matchEnd)
  for (const seg of segments) {
    if (seg.end <= idx || seg.start >= matchEnd) continue;

    const node = seg.node;
    const relStart = Math.max(0, idx - seg.start);
    const relEnd = Math.min(node.textContent.length, matchEnd - seg.start);

    // Skip if the node is already inside one of our marks
    if (node.parentElement?.closest?.(`[data-ann-id="${annotationId}"]`)) continue;

    const range = document.createRange();
    range.setStart(node, relStart);
    range.setEnd(node, relEnd);

    const mark = document.createElement('mark');
    mark.setAttribute('data-ann-id', annotationId);
    mark.style.background = COLOR_MAP[color] || COLOR_MAP.yellow;
    mark.style.borderRadius = '2px';
    mark.style.padding = '1px 0';
    mark.style.cursor = 'pointer';
    mark.style.transition = 'box-shadow 150ms ease';

    try {
      range.surroundContents(mark);
    } catch {
      // surroundContents fails when range crosses element boundaries;
      // fall back to extractContents + wrapper
      try {
        const fragment = range.extractContents();
        mark.appendChild(fragment);
        range.insertNode(mark);
      } catch {
        // give up gracefully
      }
    }
  }
}

export default function MarkdownViewer({ html, annotations, onTextSelect, darkMode }) {
  const contentRef = useRef(null);

  // Apply annotations as highlights whenever html or annotations change
  useEffect(() => {
    if (!contentRef.current) return;

    // Reset HTML first
    contentRef.current.innerHTML = html;

    // Apply each annotation
    for (const ann of annotations) {
      highlightText(contentRef.current, ann.text, ann.id, ann.color);
    }

    // Add click handlers for annotation marks
    contentRef.current.querySelectorAll('mark[data-ann-id]').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        el.style.boxShadow = `0 0 0 2px var(--accent)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.boxShadow = 'none';
      });
    });
  }, [html, annotations]);

  // Handle text selection
  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return;

    const range = sel.getRangeAt(0);
    // Ensure selection is inside our viewer
    if (!contentRef.current?.contains(range.commonAncestorContainer)) return;

    const text = sel.toString().trim();
    if (!text || text.length < 2) return;

    const rect = range.getBoundingClientRect();
    const x = Math.min(rect.left + rect.width / 2 - 140, window.innerWidth - 300);
    const y = rect.bottom + 8;

    onTextSelect({
      text,
      position: { x: Math.max(8, x), y: Math.min(y, window.innerHeight - 260) },
    });
  }, [onTextSelect]);

  return (
    <div
      style={styles.wrapper}
      onMouseUp={handleMouseUp}
    >
      <article
        ref={contentRef}
        className="markdown-body"
        style={{
          ...styles.content,
          colorScheme: darkMode ? 'dark' : 'light',
          '--color-canvas-default': 'transparent',
          '--color-canvas-subtle': 'var(--bg-secondary)',
        }}
      />
    </div>
  );
}

const styles = {
  wrapper: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    background: 'var(--bg-primary)',
    display: 'flex',
    justifyContent: 'center',
    padding: '32px 24px 80px',
  },
  content: {
    maxWidth: 780,
    width: '100%',
    fontFamily: 'var(--font-body)',
    fontSize: 16,
    lineHeight: 1.72,
    background: 'transparent',
    color: 'var(--text-primary)',
  },
};
