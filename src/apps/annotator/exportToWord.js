import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType,
  AlignmentType, PageBreak,
  FootnoteReferenceRun,
  BookmarkStart, BookmarkEnd, TableOfContents,
  ShadingType, BorderStyle,
  CommentRangeStart, CommentRangeEnd, CommentReference,
  InsertedTextRun, DeletedTextRun,
} from 'docx';
import { marked } from 'marked';

const HL_COLORS = {
  yellow: 'yellow', green: 'green', blue: 'cyan', pink: 'magenta', orange: 'darkYellow',
};

const TYPE_PREFIX = {
  note: '', question: '[QUESTION] ', todo: '[TODO] ',
  'key-point': '[KEY POINT] ', disagree: '[DISAGREE] ',
};

// ── Parse inline markdown to TextRun array ──
function parseInline(text, extraProps = {}) {
  if (!text) return [new TextRun({ text: ' ', ...extraProps })];
  const runs = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|~~(.+?)~~|([^*`~]+))/g;
  let m;
  while ((m = regex.exec(text)) !== null) {
    if (m[2]) runs.push(new TextRun({ text: m[2], bold: true, ...extraProps }));
    else if (m[3]) runs.push(new TextRun({ text: m[3], italics: true, ...extraProps }));
    else if (m[4]) runs.push(new TextRun({ text: m[4], font: 'Consolas', size: 20, ...extraProps }));
    else if (m[5]) runs.push(new TextRun({ text: m[5], strike: true, ...extraProps }));
    else if (m[6]) runs.push(new TextRun({ text: m[6], ...extraProps }));
  }
  return runs.length ? runs : [new TextRun({ text, ...extraProps })];
}

// ── Position-based inline assembler ──
//
// Walks `text` from left to right and emits runs/markers in document order.
// Each inline item (highlight, footnote, bookmark, suggestion) finds its
// position in the source text and gets inserted at exactly the right spot.
//
// inlineItems: { annotations, footnotes, bookmarks, suggestions } — all optional
function buildInlineRuns(text, inlineItems = {}) {
  const { annotations = [], footnotes = [], bookmarks = [], suggestions = [] } = inlineItems;

  // Collect all "events" with a position and a kind
  const events = [];

  for (const ann of annotations) {
    const idx = text.indexOf(ann.text);
    if (idx >= 0) events.push({ kind: 'annotation', start: idx, end: idx + ann.text.length, item: ann });
  }
  for (const bm of bookmarks) {
    if (!bm.text) continue;
    const idx = text.indexOf(bm.text);
    if (idx >= 0) events.push({ kind: 'bookmark', start: idx, end: idx + bm.text.length, item: bm });
  }
  for (const sg of suggestions) {
    if (!sg.originalText) continue;
    const idx = text.indexOf(sg.originalText);
    if (idx >= 0) events.push({ kind: 'suggestion', start: idx, end: idx + sg.originalText.length, item: sg });
  }
  // Footnotes are point events (insertion just AFTER the anchor text)
  for (const fn of footnotes) {
    if (!fn.anchorText) continue;
    const idx = text.indexOf(fn.anchorText);
    if (idx >= 0) events.push({ kind: 'footnote', start: idx + fn.anchorText.length, end: idx + fn.anchorText.length, item: fn });
  }

  if (events.length === 0) return parseInline(text);

  // Sort by start position; for ties, range events come before point events
  events.sort((a, b) => a.start - b.start || (a.end - a.start) - (b.end - b.start));

  const runs = [];
  let cursor = 0;

  for (const ev of events) {
    // Emit any plain text before this event
    if (ev.start > cursor) {
      runs.push(...parseInline(text.slice(cursor, ev.start)));
    }
    // If a previous event already advanced past this one (overlap), skip it
    if (ev.start < cursor) continue;

    if (ev.kind === 'footnote') {
      runs.push(new FootnoteReferenceRun(ev.item._wordIdx));
      // cursor stays the same — point event
    } else if (ev.kind === 'annotation') {
      const ann = ev.item;
      const hlColor = HL_COLORS[ann.color] || 'yellow';
      const hasComment = ann._commentId !== undefined;
      if (hasComment) runs.push(new CommentRangeStart(ann._commentId));
      runs.push(...parseInline(ann.text, { highlight: hlColor }));
      if (hasComment) {
        runs.push(new CommentRangeEnd(ann._commentId));
        runs.push(new TextRun({ children: [new CommentReference(ann._commentId)] }));
      }
      cursor = ev.end;
    } else if (ev.kind === 'bookmark') {
      const bm = ev.item;
      const bmId = bm._wordIdx;
      runs.push(new BookmarkStart({ id: `bm_${bmId}`, name: `Bookmark_${bmId + 1}` }));
      runs.push(...parseInline(bm.text));
      runs.push(new BookmarkEnd({ id: `bm_${bmId}` }));
      cursor = ev.end;
    } else if (ev.kind === 'suggestion') {
      const sg = ev.item;
      const date = new Date();
      const author = 'Annotator';
      // Real Word tracked change: delete original, insert replacement
      runs.push(new DeletedTextRun({ id: sg._wordIdx, author, date, text: sg.originalText }));
      runs.push(new InsertedTextRun({ id: sg._wordIdx + 10000, author, date, text: sg.suggestedText }));
      cursor = ev.end;
    }
  }

  if (cursor < text.length) {
    runs.push(...parseInline(text.slice(cursor)));
  }

  return runs;
}

// ── Convert markdown tokens to Word paragraphs ──
function tokensToParas(tokens, inlineItems) {
  const paras = [];

  for (const tok of tokens) {
    switch (tok.type) {
      case 'heading': {
        const levels = { 1: HeadingLevel.HEADING_1, 2: HeadingLevel.HEADING_2, 3: HeadingLevel.HEADING_3, 4: HeadingLevel.HEADING_4 };
        paras.push(new Paragraph({
          heading: levels[tok.depth] || HeadingLevel.HEADING_4,
          children: buildInlineRuns(tok.text, inlineItems),
        }));
        break;
      }

      case 'paragraph':
        paras.push(new Paragraph({ children: buildInlineRuns(tok.text, inlineItems) }));
        break;

      case 'blockquote': {
        const inner = tok.tokens ? tok.tokens.map(t => t.text || t.raw || '').join('\n') : tok.text || '';
        paras.push(new Paragraph({
          children: buildInlineRuns(inner, inlineItems).map(r => {
            // Add italic to text runs in the blockquote
            if (r instanceof TextRun) {
              return new TextRun({ ...(r.options || {}), italics: true, color: '666666' });
            }
            return r;
          }),
          indent: { left: 720 },
          border: { left: { style: BorderStyle.SINGLE, size: 6, color: 'B48C50' } },
        }));
        break;
      }

      case 'code': {
        const lines = tok.text.split('\n');
        for (const line of lines) {
          paras.push(new Paragraph({
            children: [new TextRun({ text: line || ' ', font: 'Consolas', size: 20 })],
            shading: { type: ShadingType.CLEAR, fill: 'F5F5F5' },
          }));
        }
        break;
      }

      case 'list': {
        for (let i = 0; i < tok.items.length; i++) {
          const item = tok.items[i];
          const text = item.text || item.tokens?.map(t => t.text || t.raw || '').join('') || '';
          const bullet = tok.ordered ? `${i + 1}. ` : '• ';
          const prefix = item.task !== undefined ? (item.checked ? '☑ ' : '☐ ') : bullet;
          paras.push(new Paragraph({
            children: [new TextRun({ text: prefix }), ...buildInlineRuns(text, inlineItems)],
            indent: { left: 360 },
          }));
        }
        break;
      }

      case 'table': {
        if (tok.header && tok.rows) {
          const headerRow = new TableRow({
            children: tok.header.map(h => new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: h.text || '', bold: true })] })],
              width: { size: 100 / tok.header.length, type: WidthType.PERCENTAGE },
            })),
          });
          const dataRows = tok.rows.map(row => new TableRow({
            children: row.map(cell => new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: cell.text || '' })] })],
              width: { size: 100 / tok.header.length, type: WidthType.PERCENTAGE },
            })),
          }));
          paras.push(new Table({ rows: [headerRow, ...dataRows] }));
        }
        break;
      }

      case 'hr':
        paras.push(new Paragraph({
          children: [new TextRun({ text: '' })],
          border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' } },
        }));
        break;

      case 'space':
        paras.push(new Paragraph({ children: [] }));
        break;

      default:
        if (tok.text || tok.raw) {
          paras.push(new Paragraph({ children: buildInlineRuns(tok.text || tok.raw, inlineItems) }));
        }
    }
  }

  return paras;
}

// ── Main export function ──
export async function exportToWord({ markdown, fileName, annotations = [], footnotes = [], bookmarks = [], suggestions = [], summary = '' }) {
  const tokens = marked.lexer(markdown || '');

  // Assign Word indices for everything that needs an inline reference
  footnotes.forEach((fn, i) => { fn._wordIdx = i + 1; });
  bookmarks.forEach((bm, i) => { bm._wordIdx = i; });
  suggestions.forEach((sg, i) => { sg._wordIdx = i + 1; });

  // Build comments + assign comment IDs to annotations that have comments
  const commentData = [];
  let commentCounter = 0;
  annotations.forEach((ann) => {
    const typePrefix = TYPE_PREFIX[ann.type] || '';
    const commentText = [typePrefix, ann.comment].filter(Boolean).join('');
    if (commentText) {
      const id = commentCounter++;
      ann._commentId = id;
      const parsedDate = ann.createdAt ? new Date(ann.createdAt) : new Date();
      const safeDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
      commentData.push({
        id, author: ann.type || 'note', date: safeDate,
        children: [new Paragraph({ children: [new TextRun(commentText)] })],
      });
    }
  });

  // Build footnote payloads
  const wordFootnotes = {};
  footnotes.forEach((fn, i) => {
    wordFootnotes[i + 1] = {
      children: [new Paragraph({ children: [new TextRun(fn.content || '')] })],
    };
  });

  const inlineItems = { annotations, footnotes, bookmarks, suggestions };

  // Summary block
  const summaryParas = [];
  if (summary) {
    summaryParas.push(new Paragraph({
      children: [new TextRun({ text: 'Summary', bold: true, size: 22 })],
      shading: { type: ShadingType.CLEAR, fill: 'FFF9E6' },
      spacing: { after: 80 },
    }));
    summaryParas.push(new Paragraph({
      children: [new TextRun({ text: summary, italics: true, color: '555555' })],
      shading: { type: ShadingType.CLEAR, fill: 'FFF9E6' },
      spacing: { after: 200 },
    }));
  }

  // TOC
  const tocPara = new Paragraph({
    children: [new TextRun({ text: 'Table of Contents', bold: true, size: 28 })],
    spacing: { after: 200 },
  });

  const contentParas = tokensToParas(tokens, inlineItems);

  const doc = new Document({
    creator: 'Toolbox Annotator',
    title: fileName?.replace(/\.md$/, '') || 'Document',
    description: summary || '',
    // Tracked changes are inline now — no separate "Suggested Changes" section needed.
    // Word will show the suggestions via Review → Track Changes view.
    features: suggestions.length > 0 ? { trackRevisions: true } : undefined,
    comments: commentData.length ? { children: commentData } : undefined,
    footnotes: Object.keys(wordFootnotes).length ? wordFootnotes : undefined,
    sections: [{
      properties: {},
      children: [
        ...summaryParas,
        tocPara,
        new TableOfContents('Table of Contents', { hyperlink: true, headingStyleRange: '1-3' }),
        new Paragraph({ children: [] }),
        ...contentParas,
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (fileName || 'document').replace(/\.md$/, '') + '.docx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
