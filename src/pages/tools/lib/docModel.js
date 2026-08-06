/* =====================================================================
   docModel — the internal document model (blocks/runs) plus the
   parsers/encoders for the "richtext" formats that don't need a ZIP
   container: plain TXT, Markdown and HTML.

   Model shape (unchanged from the original tool):
     Block: {type:'h',level,runs} {type:'p',runs} {type:'list',ordered,items:[[blok..]]}
            {type:'table',header,rows:[[ [blok..], ... ]]} {type:'hr'}
            {type:'code',text,lang} {type:'quote',blocks:[blok..]} {type:'image',src,alt}
     Run:   {text,bold,italic,code,link}

   Pure functions — the only "browser API" used is DOMParser for HTML
   parsing, which (like in the source tool) is treated as logic, not
   DOM manipulation: it never touches `document`, only parses a string.
   ===================================================================== */
import { escapeHtml } from './bytesUtil';

/* ---------- run / block helpers ---------- */
export const run = (text, o = {}) => ({ text, bold: !!o.bold, italic: !!o.italic, code: !!o.code, link: o.link || null });

export function plainTextOfRuns(runs) { return runs.map((r) => r.text).join(''); }
export function plainTextOfBlocks(blocks) {
  return blocks.map((b) => plainTextOfBlock(b)).join('\n');
}
export function plainTextOfBlock(b) {
  switch (b.type) {
    case 'h': case 'p': return plainTextOfRuns(b.runs);
    case 'list': return b.items.map((it, i) => (b.ordered ? (i + 1) + '. ' : '- ') + plainTextOfBlocks(it)).join('\n');
    case 'table': return b.rows.map((row) => row.map((cell) => plainTextOfBlocks(cell)).join(' | ')).join('\n');
    case 'quote': return plainTextOfBlocks(b.blocks);
    case 'code': return b.text;
    case 'hr': return '';
    case 'image': return '[' + (b.alt || 'gambar') + ']';
    default: return '';
  }
}

/* ============================== Markdown -> Model ============================== */
export function parseInline(text) {
  const runs = [];
  let i = 0;
  const n = text.length;
  let buf = '';
  const flush = () => { if (buf) { runs.push(run(buf)); buf = ''; } };
  while (i < n) {
    if (text.startsWith('**', i)) {
      const end = text.indexOf('**', i + 2);
      if (end >= 0) { flush(); runs.push(run(text.slice(i + 2, end), { bold: true })); i = end + 2; continue; }
    }
    if ((text[i] === '*' || text[i] === '_') && text[i + 1] !== ' ') {
      const ch = text[i]; const end = text.indexOf(ch, i + 1);
      if (end > i + 1) { flush(); runs.push(run(text.slice(i + 1, end), { italic: true })); i = end + 1; continue; }
    }
    if (text[i] === '`') {
      const end = text.indexOf('`', i + 1);
      if (end >= 0) { flush(); runs.push(run(text.slice(i + 1, end), { code: true })); i = end + 1; continue; }
    }
    if (text[i] === '!' && text[i + 1] === '[') {
      const close = text.indexOf(']', i + 2);
      if (close >= 0 && text[close + 1] === '(') {
        const end = text.indexOf(')', close + 2);
        if (end >= 0) {
          flush(); /* inline image: downgrade to alt-text-in-brackets — full handling is at block level */
          runs.push(run('[' + text.slice(i + 2, close) + ']')); i = end + 1; continue;
        }
      }
    }
    if (text[i] === '[') {
      const close = text.indexOf(']', i + 1);
      if (close >= 0 && text[close + 1] === '(') {
        const end = text.indexOf(')', close + 2);
        if (end >= 0) { flush(); runs.push(run(text.slice(i + 1, close), { link: text.slice(close + 2, end) })); i = end + 1; continue; }
      }
    }
    buf += text[i]; i++;
  }
  flush();
  return runs.length ? runs : [run('')];
}

export function parseMarkdown(md) {
  const lines = md.replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  let i = 0;
  const isHr = (l) => /^ {0,3}([-*_])( *\1){2,} *$/.test(l);
  const listRe = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;

  function parseListBlock(baseIndent) {
    const ordered = /\d/.test(lines[i].match(listRe)[2]);
    const items = [];
    while (i < lines.length) {
      const m = lines[i].match(listRe);
      if (!m || m[1].length < baseIndent) break;
      if (m[1].length > baseIndent) { break; } // deeper nesting handled recursively below
      const itemLines = [m[3]];
      i++;
      while (i < lines.length && lines[i].trim() && !listRe.test(lines[i]) && !isHr(lines[i]) && !/^#{1,6}\s/.test(lines[i])) {
        itemLines.push(lines[i].trim()); i++;
      }
      const itemBlocks = [{ type: 'p', runs: parseInline(itemLines.join(' ')) }];
      // nested list: next line is indented deeper
      if (i < lines.length) {
        const nm = lines[i].match(listRe);
        if (nm && nm[1].length > baseIndent) {
          itemBlocks.push(parseListBlock(nm[1].length));
        }
      }
      items.push(itemBlocks);
    }
    return { type: 'list', ordered, items };
  }

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    if (/^```/.test(line)) {
      const lang = line.replace(/^```/, '').trim();
      const codeLines = []; i++;
      while (i < lines.length && !/^```/.test(lines[i])) { codeLines.push(lines[i]); i++; }
      i++; // skip closing ```
      blocks.push({ type: 'code', text: codeLines.join('\n'), lang });
      continue;
    }
    const hm = line.match(/^(#{1,6})\s+(.*)$/);
    if (hm) { blocks.push({ type: 'h', level: hm[1].length, runs: parseInline(hm[2].trim()) }); i++; continue; }

    if (isHr(line)) { blocks.push({ type: 'hr' }); i++; continue; }

    if (/^>\s?/.test(line)) {
      const qLines = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { qLines.push(lines[i].replace(/^>\s?/, '')); i++; }
      blocks.push({ type: 'quote', blocks: parseMarkdown(qLines.join('\n')) });
      continue;
    }

    if (/^!\[[^\]]*\]\([^)]+\)\s*$/.test(line.trim())) {
      const im = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      blocks.push({ type: 'image', alt: im[1], src: im[2] }); i++; continue;
    }

    if (listRe.test(line)) { blocks.push(parseListBlock(line.match(listRe)[1].length)); continue; }

    if (line.includes('|') && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?[\s:-]*$/.test(lines[i + 1]) && lines[i + 1].includes('-')) {
      const splitRow = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
      const header = splitRow(line); i += 2;
      const rows = [header];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) { rows.push(splitRow(lines[i])); i++; }
      blocks.push({ type: 'table', header: true, rows: rows.map((r) => r.map((c) => [{ type: 'p', runs: parseInline(c) }])) });
      continue;
    }

    const paraLines = [line.trim()]; i++;
    while (i < lines.length && lines[i].trim() && !/^#{1,6}\s/.test(lines[i]) && !isHr(lines[i]) &&
      !listRe.test(lines[i]) && !/^```/.test(lines[i]) && !/^>\s?/.test(lines[i]) && !lines[i].includes('|')) {
      paraLines.push(lines[i].trim()); i++;
    }
    blocks.push({ type: 'p', runs: parseInline(paraLines.join(' ')) });
  }
  return blocks;
}

/* ============================== Model -> Markdown ============================== */
export function runsToMarkdown(runs) {
  return runs.map((r) => {
    let t = r.text;
    if (r.code) return '`' + t + '`';
    if (r.bold) t = '**' + t + '**';
    if (r.italic) t = '*' + t + '*';
    if (r.link) t = '[' + t + '](' + r.link + ')';
    return t;
  }).join('');
}
export function blocksToMarkdown(blocks, indent = '') {
  const out = [];
  for (const b of blocks) {
    switch (b.type) {
      case 'h': out.push(indent + '#'.repeat(b.level) + ' ' + runsToMarkdown(b.runs)); break;
      case 'p': out.push(indent + runsToMarkdown(b.runs)); break;
      case 'hr': out.push(indent + '---'); break;
      case 'quote': out.push(blocksToMarkdown(b.blocks).map((l) => '> ' + l).join('\n')); break;
      case 'code': out.push('```' + (b.lang || '') + '\n' + b.text + '\n```'); break;
      case 'image': out.push('![' + (b.alt || '') + '](' + b.src + ')'); break;
      case 'list': {
        b.items.forEach((it, idx) => {
          const marker = b.ordered ? (idx + 1) + '. ' : '- ';
          const [first, ...rest] = it;
          out.push(indent + marker + (first ? runsToMarkdown(first.runs || []) : ''));
          for (const sub of rest) out.push(blocksToMarkdown([sub], indent + '  ').join('\n'));
        });
        break;
      }
      case 'table': {
        const rowsMd = b.rows.map((row) => '| ' + row.map((cell) => plainTextOfBlocks(cell)).join(' | ') + ' |');
        if (rowsMd.length) {
          const cols = b.rows[0].length;
          rowsMd.splice(1, 0, '| ' + Array(cols).fill('---').join(' | ') + ' |');
        }
        out.push(rowsMd.join('\n'));
        break;
      }
      default: break;
    }
    out.push('');
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').replace(/^\n+|\n+$/g, '').split('\n');
}
export function modelToMarkdown(blocks) { return blocksToMarkdown(blocks).join('\n') + '\n'; }

/* ============================== TXT <-> Model ============================== */
export function parseTxt(text) {
  const paras = text.replace(/\r\n?/g, '\n').split(/\n{2,}/);
  return paras.filter((p) => p.trim()).map((p) => ({ type: 'p', runs: [run(p.replace(/\n/g, ' ').trim())] }));
}
export function modelToTxt(blocks) {
  const lines = [];
  for (const b of blocks) {
    switch (b.type) {
      case 'h': lines.push(plainTextOfRuns(b.runs).toUpperCase()); break;
      case 'p': lines.push(plainTextOfRuns(b.runs)); break;
      case 'hr': lines.push('----------------------------------------'); break;
      case 'quote': lines.push(modelToTxt(b.blocks).split('\n').map((l) => '  ' + l).join('\n')); break;
      case 'code': lines.push(b.text); break;
      case 'image': lines.push('[' + (b.alt || 'gambar') + ']'); break;
      case 'list': b.items.forEach((it, idx) => {
        const marker = b.ordered ? (idx + 1) + '. ' : '- ';
        const [first, ...rest] = it;
        lines.push(marker + (first ? plainTextOfRuns(first.runs || []) : ''));
        for (const sub of rest) {
          const subTxt = modelToTxt([sub]).replace(/\n+$/, '');
          lines.push(subTxt.split('\n').map((l) => '    ' + l).join('\n'));
        }
      }); break;
      case 'table': b.rows.forEach((row) => lines.push(row.map((c) => plainTextOfBlocks(c)).join('   |   '))); break;
      default: break;
    }
    lines.push('');
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

/* ============================== Model -> HTML ============================== */
export function runsToHtml(runs) {
  return runs.map((r) => {
    let t = escapeHtml(r.text);
    if (r.code) t = '<code>' + t + '</code>';
    if (r.bold) t = '<strong>' + t + '</strong>';
    if (r.italic) t = '<em>' + t + '</em>';
    if (r.link) t = '<a href="' + escapeHtml(r.link) + '">' + t + '</a>';
    return t;
  }).join('');
}
export function blocksToHtml(blocks) {
  return blocks.map((b) => {
    switch (b.type) {
      case 'h': return '<h' + b.level + '>' + runsToHtml(b.runs) + '</h' + b.level + '>';
      case 'p': return '<p>' + runsToHtml(b.runs) + '</p>';
      case 'hr': return '<hr>';
      case 'quote': return '<blockquote>' + blocksToHtml(b.blocks) + '</blockquote>';
      case 'code': return '<pre><code>' + escapeHtml(b.text) + '</code></pre>';
      case 'image': return '<p><img src="' + escapeHtml(b.src) + '" alt="' + escapeHtml(b.alt || '') + '"></p>';
      case 'list': {
        const tag = b.ordered ? 'ol' : 'ul';
        const items = b.items.map((it) => '<li>' + blocksToHtml(it).replace(/^<p>|<\/p>$/g, '') + '</li>').join('');
        return '<' + tag + '>' + items + '</' + tag + '>';
      }
      case 'table': {
        const rows = b.rows.map((row, ri) => {
          const cellTag = (b.header && ri === 0) ? 'th' : 'td';
          return '<tr>' + row.map((cell) => '<' + cellTag + '>' + blocksToHtml(cell).replace(/^<p>|<\/p>$/g, '') + '</' + cellTag + '>').join('') + '</tr>';
        });
        return '<table>' + rows.join('') + '</table>';
      }
      default: return '';
    }
  }).join('\n');
}
export function modelToHtmlDoc(blocks, title) {
  const body = blocksToHtml(blocks);
  return '<!DOCTYPE html>\n<html lang="id">\n<head>\n<meta charset="utf-8">\n<title>' + escapeHtml(title || 'Dokumen') + '</title>\n' +
    '<style>body{font:16px/1.6 -apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:760px;margin:40px auto;padding:0 20px;color:#1a1a1a}' +
    'h1,h2,h3,h4,h5,h6{line-height:1.3;margin:1.4em 0 .5em} table{border-collapse:collapse;width:100%;margin:1em 0}' +
    'th,td{border:1px solid #ccc;padding:6px 10px;text-align:left} blockquote{border-left:3px solid #ccc;margin:1em 0;padding:.2em 1em;color:#555}' +
    'pre{background:#f4f4f4;padding:12px;border-radius:6px;overflow-x:auto} code{background:#f0f0f0;padding:.15em .35em;border-radius:4px}' +
    'img{max-width:100%} hr{border:0;border-top:1px solid #ccc;margin:2em 0}</style>\n</head>\n<body>\n' + body + '\n</body>\n</html>\n';
}

/* ============================== HTML -> Model (DOMParser) ============================== */
export function htmlToModel(htmlString) {
  const doc = new DOMParser().parseFromString(htmlString, 'text/html');
  return walkHtmlChildren(doc.body);
}
function inlineRunsFromNode(node, ctx = {}) {
  let runs = [];
  node.childNodes.forEach((ch) => {
    if (ch.nodeType === 3) { if (ch.textContent.trim() !== '' || ch.textContent.includes(' ')) runs.push(run(ch.textContent.replace(/\s+/g, ' '), ctx)); return; }
    if (ch.nodeType !== 1) return;
    const tag = ch.tagName.toLowerCase();
    if (tag === 'br') { runs.push(run('\n', ctx)); return; }
    if (tag === 'strong' || tag === 'b') { runs = runs.concat(inlineRunsFromNode(ch, { ...ctx, bold: true })); return; }
    if (tag === 'em' || tag === 'i') { runs = runs.concat(inlineRunsFromNode(ch, { ...ctx, italic: true })); return; }
    if (tag === 'code') { runs = runs.concat(inlineRunsFromNode(ch, { ...ctx, code: true })); return; }
    if (tag === 'a') { runs = runs.concat(inlineRunsFromNode(ch, { ...ctx, link: ch.getAttribute('href') || '' })); return; }
    runs = runs.concat(inlineRunsFromNode(ch, ctx));
  });
  return runs.length ? runs : [run('', ctx)];
}
function cellBlocksFromNode(node) {
  const inline = inlineRunsFromNode(node);
  return [{ type: 'p', runs: inline }];
}
function walkHtmlChildren(container) {
  const blocks = [];
  container.childNodes.forEach((node) => {
    if (node.nodeType === 3) { const t = node.textContent.trim(); if (t) blocks.push({ type: 'p', runs: [run(t)] }); return; }
    if (node.nodeType !== 1) return;
    const tag = node.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) { blocks.push({ type: 'h', level: +tag[1], runs: inlineRunsFromNode(node) }); return; }
    if (tag === 'p') { blocks.push({ type: 'p', runs: inlineRunsFromNode(node) }); return; }
    if (tag === 'hr') { blocks.push({ type: 'hr' }); return; }
    if (tag === 'blockquote') { blocks.push({ type: 'quote', blocks: walkHtmlChildren(node) }); return; }
    if (tag === 'pre') { blocks.push({ type: 'code', text: node.textContent.replace(/\n$/, ''), lang: '' }); return; }
    if (tag === 'img') { blocks.push({ type: 'image', src: node.getAttribute('src') || '', alt: node.getAttribute('alt') || '' }); return; }
    if (tag === 'ul' || tag === 'ol') {
      const items = [];
      node.querySelectorAll(':scope > li').forEach((li) => {
        const nested = li.querySelector(':scope > ul, :scope > ol');
        const itemBlocks = [{ type: 'p', runs: inlineRunsFromNode(li) }];
        if (nested) { const sub = walkHtmlChildren({ childNodes: [nested] }); itemBlocks.push(...sub); }
        items.push(itemBlocks);
      });
      blocks.push({ type: 'list', ordered: tag === 'ol', items });
      return;
    }
    if (tag === 'table') {
      const rows = [];
      let header = false;
      node.querySelectorAll('tr').forEach((tr) => {
        const cells = [];
        tr.querySelectorAll('th,td').forEach((td) => { if (td.tagName.toLowerCase() === 'th') header = true; cells.push(cellBlocksFromNode(td)); });
        if (cells.length) rows.push(cells);
      });
      blocks.push({ type: 'table', header, rows });
      return;
    }
    if (tag === 'div' || tag === 'section' || tag === 'article' || tag === 'body' || tag === 'span') {
      blocks.push(...walkHtmlChildren(node)); return;
    }
    const txt = node.textContent.trim();
    if (txt) blocks.push({ type: 'p', runs: inlineRunsFromNode(node) });
  });
  return blocks;
}
