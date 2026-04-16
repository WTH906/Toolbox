import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType,
  AlignmentType, PageBreak,
  FootnoteReferenceRun,
  BookmarkStart, BookmarkEnd, TableOfContents,
  ShadingType, BorderStyle,
} from 'docx';
import { marked } from 'marked';

const HL_COLORS = {
  yellow: 'yellow',
  green: 'green',
  blue: 'cyan',
  pink: 'magenta',
  orange: 'darkYellow',
};

const TYPE_PREFIX = {
  note: '',
  question: '[QUESTION] ',
  todo: '[TODO] ',
  'key-point': '[KEY POINT] ',
  disagree: '[DISAGREE] ',
};

// ── Parse inline markdown to TextRun array ──
function parseInline(text, extraProps = {}) {
  if (!text) return [new TextRun({ text: ' ', ...extraProps })];
  const runs = [];
  // Simple inline markdown: **bold**, *italic*, `code`, ~~strike~~
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

// ── Build runs with highlights applied ──
function buildRunsWithHighlights(text, annotations) {
  if (!annotations.length) return parseInline(text);

  // Sort annotations by their position in text (first occurrence)
  const matches = [];
  for (const ann of annotations) {
    const idx = text.indexOf(ann.text);
    if (idx >= 0) matches.push({ ...ann, start: idx, end: idx + ann.text.length });
  }
  matches.sort((a, b) => a.start - b.start);

  if (!matches.length) return parseInline(text);

  const runs = [];
  let cursor = 0;

  for (const m of matches) {
    if (m.start > cursor) {
      runs.push(...parseInline(text.slice(cursor, m.start)));
    }
    const hlColor = HL_COLORS[m.color] || 'yellow';
    runs.push(...parseInline(m.text, { highlight: hlColor }));
    cursor = m.end;
  }

  if (cursor < text.length) {
    runs.push(...parseInline(text.slice(cursor)));
  }

  return runs;
}

// ── Convert markdown tokens to Word paragraphs ──
function tokensToParas(tokens, annotations, footnotes) {
  const paras = [];

  for (const tok of tokens) {
    switch (tok.type) {
      case 'heading': {
        const levels = { 1: HeadingLevel.HEADING_1, 2: HeadingLevel.HEADING_2, 3: HeadingLevel.HEADING_3, 4: HeadingLevel.HEADING_4 };
        paras.push(new Paragraph({
          heading: levels[tok.depth] || HeadingLevel.HEADING_4,
          children: buildRunsWithHighlights(tok.text, annotations),
        }));
        break;
      }

      case 'paragraph': {
        const runs = buildRunsWithHighlights(tok.text, annotations);
        // Check for footnotes anchored in this paragraph
        const fnRuns = [];
        for (const fn of footnotes) {
          if (tok.text.includes(fn.anchorText)) {
            fnRuns.push(new FootnoteReferenceRun(parseInt(fn._wordIdx) || 1));
          }
        }
        paras.push(new Paragraph({ children: [...runs, ...fnRuns] }));
        break;
      }

      case 'blockquote': {
        const inner = tok.tokens ? tok.tokens.map(t => t.text || t.raw || '').join('\n') : tok.text || '';
        paras.push(new Paragraph({
          children: parseInline(inner, { italics: true, color: '666666' }),
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
            children: [new TextRun({ text: prefix }), ...buildRunsWithHighlights(text, annotations)],
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
          paras.push(new Paragraph({ children: buildRunsWithHighlights(tok.text || tok.raw, annotations) }));
        }
    }
  }

  return paras;
}

// ── Main export function ──
export async function exportToWord({ markdown, fileName, annotations = [], footnotes = [], bookmarks = [], suggestions = [], summary = '' }) {
  const tokens = marked.lexer(markdown || '');

  // Assign Word footnote indices
  footnotes.forEach((fn, i) => { fn._wordIdx = i + 1; });

  // Build comments from annotations — pass plain option objects, docx will wrap them
  const commentData = [];
  annotations.forEach((ann, i) => {
    const typePrefix = TYPE_PREFIX[ann.type] || '';
    const commentText = [typePrefix, ann.comment].filter(Boolean).join('');
    if (commentText) {
      const parsedDate = ann.createdAt ? new Date(ann.createdAt) : new Date();
      const safeDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
      commentData.push({
        id: i,
        author: ann.type || 'note',
        date: safeDate,
        children: [new Paragraph({ children: [new TextRun(commentText)] })],
      });
    }
  });

  // Build footnotes for Word
  const wordFootnotes = {};
  footnotes.forEach((fn, i) => {
    wordFootnotes[i + 1] = {
      children: [new Paragraph({ children: [new TextRun(fn.content || '')] })],
    };
  });

  // Build suggestion paragraphs (tracked changes info block at end)
  const suggestionParas = [];
  if (suggestions.length > 0) {
    suggestionParas.push(new Paragraph({ children: [] }));
    suggestionParas.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: 'Suggested Changes' })],
    }));
    for (const sg of suggestions) {
      suggestionParas.push(new Paragraph({
        children: [
          new TextRun({ text: '• ', bold: true }),
          new TextRun({ text: sg.originalText, strike: true, color: 'CC0000' }),
          new TextRun({ text: '  →  ' }),
          new TextRun({ text: sg.suggestedText, color: '008800', bold: true }),
        ],
        indent: { left: 360 },
        spacing: { after: 120 },
      }));
    }
  }

  // Build bookmark paragraphs (at end)
  const bookmarkParas = [];
  if (bookmarks.length > 0) {
    bookmarkParas.push(new Paragraph({ children: [] }));
    bookmarkParas.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: 'Bookmarks' })],
    }));
    bookmarks.forEach((bm, i) => {
      bookmarkParas.push(new Paragraph({
        children: [
          new BookmarkStart({ id: `bm_${i}`, name: `Bookmark_${i + 1}` }),
          new TextRun({ text: `⭐ ${bm.text}` }),
          new BookmarkEnd({ id: `bm_${i}` }),
          ...(bm.label ? [new TextRun({ text: ` — ${bm.label}`, italics: true, color: '888888' })] : []),
        ],
        indent: { left: 360 },
      }));
    });
  }

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

  // Build the main content
  const contentParas = tokensToParas(tokens, annotations, footnotes);

  const doc = new Document({
    creator: 'Toolbox Annotator',
    title: fileName?.replace(/\.md$/, '') || 'Document',
    description: summary || '',
    comments: commentData.length ? { children: commentData } : undefined,
    footnotes: Object.keys(wordFootnotes).length ? wordFootnotes : undefined,
    sections: [{
      properties: {},
      children: [
        ...summaryParas,
        tocPara,
        new TableOfContents('Table of Contents', {
          hyperlink: true,
          headingStyleRange: '1-3',
        }),
        new Paragraph({ children: [] }),
        ...contentParas,
        ...suggestionParas,
        ...bookmarkParas,
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
