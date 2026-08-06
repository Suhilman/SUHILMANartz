/* =====================================================================
   pdfFormat — PDF writer (byte/object level, 5 standard fonts, no font
   embedding needed) and PDF reader (best-effort text/image extraction
   from content streams). Ported 1:1 from image-studio/convert.js.
   ===================================================================== */
import {
  TENC, concatBytes, latin1Encode, pdfLatin1Decode, strToLatin1Bytes,
  zlibInflate, decodeDataUri, bytesToBase64, rawPixelsToPngBytes,
} from './bytesUtil';
import { run, plainTextOfBlocks } from './docModel';

/* ============================== PDF — writer ==============================
   Writes a PDF directly at the byte/object level, using 5 standard fonts
   (no embedding needed): Helvetica, Bold, Oblique, BoldOblique, Courier.
   The Helvetica character widths below are the standard Adobe AFM metrics
   (public technical data) used for accurate word-wrap. */
const HELV_WIDTHS = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015,
  667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611,
  278, 278, 278, 469, 556, 333,
  556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500,
  334, 260, 334, 584];
function charW(code, style) {
  if (style.code) return 600;
  const idx = code - 32;
  const base = (idx >= 0 && idx < HELV_WIDTHS.length) ? HELV_WIDTHS[idx] : 556;
  return style.bold ? Math.round(base * 1.08) : base;
}
function measureWidth(text, size, style) {
  let w = 0; for (let i = 0; i < text.length; i++) w += charW(text.codePointAt(i), style);
  return w / 1000 * size;
}
function fontKeyFor(style) {
  if (style.code) return 'F5';
  if (style.bold && style.italic) return 'F4';
  if (style.bold) return 'F2';
  if (style.italic) return 'F3';
  return 'F1';
}
function pdfEscape(s) { return String(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)'); }

/* Page size in PDF points (1pt = 1/72in). A4 remains the default. */
export const PAPER_SIZES = {
  a4: { label: 'A4 (210 × 297 mm)', w: 595, h: 842 },
  letter: { label: 'Letter (216 × 279 mm)', w: 612, h: 792 },
  legal: { label: 'Legal (216 × 356 mm)', w: 612, h: 1008 },
  f4: { label: 'F4 / Folio (215 × 330 mm)', w: 609, h: 935 },
};
let PDF_PAGE_W = 595, PDF_PAGE_H = 842, PDF_MARGIN = 56;
let PDF_CONTENT_W = PDF_PAGE_W - PDF_MARGIN * 2;
function setPdfPageSize(size) {
  PDF_PAGE_W = size.w; PDF_PAGE_H = size.h; PDF_MARGIN = 56;
  PDF_CONTENT_W = PDF_PAGE_W - PDF_MARGIN * 2;
}

function flattenRunsToWords(runs) {
  const words = [];
  for (const r of runs) {
    for (const p of r.text.split(/\s+/)) if (p) words.push({ text: p, bold: !!r.bold, italic: !!r.italic, code: !!r.code });
  }
  return words;
}
function wrapWords(words, size, maxWidth) {
  const lines = []; let cur = []; let curW = 0;
  const spW = measureWidth(' ', size, {});
  for (const w of words) {
    const ww = measureWidth(w.text, size, w);
    const add = (cur.length ? spW : 0) + ww;
    if (cur.length && curW + add > maxWidth) { lines.push(cur); cur = [w]; curW = ww; }
    else { cur.push(w); curW += add; }
  }
  if (cur.length) lines.push(cur);
  return lines.length ? lines : [[]];
}
function makePdfLayout(blocks) {
  const pages = [[]];
  const usedImages = [];
  let y = PDF_PAGE_H - PDF_MARGIN;
  const lineGap = 1.35;
  const curPage = () => pages[pages.length - 1];
  const newPage = () => { pages.push([]); y = PDF_PAGE_H - PDF_MARGIN; };
  const ensureSpace = (h) => { if (y - h < PDF_MARGIN) newPage(); };

  function drawWrappedRuns(runs, size, indent) {
    const words = flattenRunsToWords(runs);
    const lines = wrapWords(words, size, PDF_CONTENT_W - indent);
    const spW = measureWidth(' ', size, {});
    for (const line of lines) {
      ensureSpace(size * lineGap);
      let x = PDF_MARGIN + indent;
      const parts = ['BT']; let curFont = null;
      for (const w of line) {
        const fk = fontKeyFor(w);
        if (fk !== curFont) { parts.push(`/${fk} ${size} Tf`); curFont = fk; }
        parts.push(`1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${pdfEscape(w.text)}) Tj`);
        x += measureWidth(w.text, size, w) + spW;
      }
      parts.push('ET');
      curPage().push(parts.join(' '));
      y -= size * lineGap;
    }
  }
  function drawBlocks(list, indent) { for (const b of list) drawBlock(b, indent); }
  function drawBlock(b, indent) {
    indent = indent || 0;
    switch (b.type) {
      case 'h': {
        const sizes = { 1: 22, 2: 18, 3: 15, 4: 13, 5: 12, 6: 11 };
        y -= 10;
        drawWrappedRuns(b.runs.map((r) => ({ ...r, bold: true })), sizes[b.level] || 12, indent);
        y -= 6;
        break;
      }
      case 'p': drawWrappedRuns(b.runs, 11, indent); y -= 7; break;
      case 'hr': {
        ensureSpace(12);
        curPage().push(`${PDF_MARGIN} ${(y - 4).toFixed(2)} m ${PDF_PAGE_W - PDF_MARGIN} ${(y - 4).toFixed(2)} l S`);
        y -= 14; break;
      }
      case 'quote': {
        ensureSpace(11 * lineGap);
        const startY = y + 4;
        drawBlocks(b.blocks, indent + 18);
        curPage().push(`q 0.6 0.6 0.6 RG 1.2 w ${(PDF_MARGIN + indent + 6).toFixed(2)} ${y.toFixed(2)} m ${(PDF_MARGIN + indent + 6).toFixed(2)} ${startY.toFixed(2)} l S Q`);
        y -= 4; break;
      }
      case 'code': {
        for (const line of b.text.split('\n')) {
          ensureSpace(13);
          curPage().push(`q 0.95 0.95 0.95 rg ${PDF_MARGIN + indent} ${(y - 3).toFixed(2)} ${PDF_CONTENT_W - indent} 13 re f Q`);
          curPage().push(`BT /F5 9.5 Tf 1 0 0 1 ${(PDF_MARGIN + indent + 6).toFixed(2)} ${y.toFixed(2)} Tm (${pdfEscape(line)}) Tj ET`);
          y -= 13;
        }
        y -= 6; break;
      }
      case 'list': {
        b.items.forEach((item) => {
          const marker = b.ordered ? (b.items.indexOf(item) + 1) + '.' : String.fromCharCode(0x95);
          ensureSpace(11 * lineGap);
          curPage().push(`BT /F1 11 Tf 1 0 0 1 ${(PDF_MARGIN + indent).toFixed(2)} ${y.toFixed(2)} Tm (${pdfEscape(marker)}) Tj ET`);
          const [first, ...rest] = item;
          drawWrappedRuns(first ? first.runs : [], 11, indent + 18);
          for (const sub of rest) drawBlock(sub, indent + 18);
        });
        y -= 2; break;
      }
      case 'table': drawTable(b, indent); break;
      case 'image': drawImage(b, indent); break;
      default: break;
    }
  }
  function drawTable(b, indent) {
    const cols = b.rows[0] ? b.rows[0].length : 1;
    const tableW = PDF_CONTENT_W - indent;
    const colW = tableW / cols;
    for (let ri = 0; ri < b.rows.length; ri++) {
      const row = b.rows[ri];
      const cellLines = row.map((cell) => wrapWords(flattenRunsToWords([{ text: plainTextOfBlocks(cell), bold: b.header && ri === 0, italic: false, code: false }]), 10, colW - 10));
      const rowLines = Math.max(1, ...cellLines.map((l) => l.length));
      const rowH = rowLines * 12 + 8;
      ensureSpace(rowH);
      const topY = y;
      if (b.header && ri === 0) curPage().push(`q 0.92 0.92 0.92 rg ${PDF_MARGIN + indent} ${(topY - rowH + 4).toFixed(2)} ${tableW} ${rowH} re f Q`);
      for (let ci = 0; ci < cols; ci++) {
        let cy = topY - 10;
        for (const line of (cellLines[ci] || [[]])) {
          let x = PDF_MARGIN + indent + ci * colW + 5;
          const spW = measureWidth(' ', 10, {});
          const parts = ['BT']; let curFont = null;
          for (const w of line) {
            const fk = fontKeyFor(w);
            if (fk !== curFont) { parts.push(`/${fk} 10 Tf`); curFont = fk; }
            parts.push(`1 0 0 1 ${x.toFixed(2)} ${cy.toFixed(2)} Tm (${pdfEscape(w.text)}) Tj`);
            x += measureWidth(w.text, 10, w) + spW;
          }
          parts.push('ET');
          curPage().push(parts.join(' '));
          cy -= 12;
        }
      }
      curPage().push(`${PDF_MARGIN + indent} ${(topY - rowH + 4).toFixed(2)} ${tableW} ${rowH} re S`);
      for (let ci = 1; ci < cols; ci++) {
        const x = PDF_MARGIN + indent + ci * colW;
        curPage().push(`${x.toFixed(2)} ${(topY - rowH + 4).toFixed(2)} m ${x.toFixed(2)} ${topY.toFixed(2)} l S`);
      }
      y = topY - rowH;
    }
    y -= 6;
  }
  function drawImage(b, indent) {
    const info = b.src ? decodeDataUri(b.src) : null;
    if (!info || info.mime !== 'image/jpeg') {
      drawWrappedRuns([{ text: '[' + (b.alt || 'gambar tidak tersedia untuk PDF') + ']', bold: false, italic: true, code: false }], 10, indent);
      return;
    }
    let idx = usedImages.findIndex((u) => u.src === b.src);
    if (idx < 0) { idx = usedImages.length; usedImages.push({ src: b.src, bytes: info.bytes, width: info.width, height: info.height }); }
    const maxW = PDF_CONTENT_W - indent;
    let w = info.width, h = info.height;
    if (w > maxW) { h = h * maxW / w; w = maxW; }
    ensureSpace(h + 8);
    y -= h;
    curPage().push(`q ${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${(PDF_MARGIN + indent).toFixed(2)} ${y.toFixed(2)} cm /Im${idx} Do Q`);
    y -= 8;
  }

  drawBlocks(blocks, 0);
  return { pages, usedImages };
}
export function modelToPdf(blocks, paperSize) {
  setPdfPageSize(paperSize || PAPER_SIZES.a4);
  const { pages, usedImages } = makePdfLayout(blocks);
  const objs = [];
  let n = 1;
  const alloc = () => n++;
  const catalogNum = alloc();
  const pagesNum = alloc();
  const fontKeys = ['F1', 'F2', 'F3', 'F4', 'F5'];
  const fontNums = {}; fontKeys.forEach((k) => fontNums[k] = alloc());
  const imageNums = usedImages.map(() => alloc());
  const pageNums = pages.map(() => alloc());
  const contentNums = pages.map(() => alloc());

  const pushObj = (num, str) => objs.push({ num, bytes: TENC.encode(str) });
  const pushStreamObj = (num, dictStr, bytes) => {
    objs.push({ num, bytes: concatBytes([TENC.encode(`${num} 0 obj\n${dictStr}\nstream\n`), bytes, TENC.encode(`\nendstream\nendobj\n`)]) });
  };

  pushObj(catalogNum, `${catalogNum} 0 obj\n<< /Type /Catalog /Pages ${pagesNum} 0 R >>\nendobj\n`);
  pushObj(pagesNum, `${pagesNum} 0 obj\n<< /Type /Pages /Kids [${pageNums.map((x) => x + ' 0 R').join(' ')}] /Count ${pages.length} >>\nendobj\n`);

  const FONT_BASE = { F1: 'Helvetica', F2: 'Helvetica-Bold', F3: 'Helvetica-Oblique', F4: 'Helvetica-BoldOblique', F5: 'Courier' };
  for (const k of fontKeys) {
    const num = fontNums[k];
    pushObj(num, `${num} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /${FONT_BASE[k]} /Encoding /WinAnsiEncoding >>\nendobj\n`);
  }
  usedImages.forEach((info, i) => {
    const num = imageNums[i];
    const dict = `${num} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${info.width} /Height ${info.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${info.bytes.length} >>`;
    pushStreamObj(num, dict, info.bytes);
  });

  const resourceDict = `<< /Font << ${fontKeys.map((k) => '/' + k + ' ' + fontNums[k] + ' 0 R').join(' ')} >>` +
    (usedImages.length ? ` /XObject << ${usedImages.map((_, i) => '/Im' + i + ' ' + imageNums[i] + ' 0 R').join(' ')} >>` : '') + ` >>`;

  pages.forEach((ops, i) => {
    const pageNum = pageNums[i], contentNum = contentNums[i];
    pushObj(pageNum, `${pageNum} 0 obj\n<< /Type /Page /Parent ${pagesNum} 0 R /MediaBox [0 0 ${PDF_PAGE_W} ${PDF_PAGE_H}] /Resources ${resourceDict} /Contents ${contentNum} 0 R >>\nendobj\n`);
    const streamBytes = latin1Encode(ops.join('\n'));
    pushStreamObj(contentNum, `${contentNum} 0 obj\n<< /Length ${streamBytes.length} >>`, streamBytes);
  });

  objs.sort((a, b) => a.num - b.num);
  const header = TENC.encode('%PDF-1.4\n');
  const chunks = [header];
  const offsets = new Array(n);
  let pos = header.length;
  for (const o of objs) { offsets[o.num] = pos; chunks.push(o.bytes); pos += o.bytes.length; }
  const xrefStart = pos;
  let xref = `xref\n0 ${n}\n0000000000 65535 f \n`;
  for (let i = 1; i < n; i++) xref += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  const trailer = `trailer\n<< /Size ${n} /Root ${catalogNum} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  chunks.push(TENC.encode(xref + trailer));
  return concatBytes(chunks);
}

/* ============================== PDF — text reader (best-effort) ==============================
   NOT a full PDF engine: only sweeps text-showing operators (Tj/TJ) from
   each page's content stream, ordered by page object number. Works well
   for "normal" text-based PDFs (including ones produced by this tool
   itself). Can't handle: scanned/image-only PDFs, embedded fonts with
   non-standard encodings, or complex multi-column layouts. */
function pdfUnescapeString(s) {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\\') {
      const c = s[i + 1];
      if (c === 'n') { out += '\n'; i++; } else if (c === 'r') { out += '\r'; i++; } else if (c === 't') { out += '\t'; i++; }
      else if (c === '(' || c === ')' || c === '\\') { out += c; i++; }
      else if (c >= '0' && c <= '7') { let oct = c, j = i + 2, k = 0; while (k < 2 && s[j] >= '0' && s[j] <= '7') { oct += s[j]; j++; k++; } out += String.fromCharCode(parseInt(oct, 8) & 0xFF); i = j - 1; }
      else if (c === '\n') { i++; } else { out += c; i++; }
    } else out += s[i];
  }
  return out;
}
function tokenizePdfContentStream(s) {
  const tokens = []; let i = 0; const n = s.length;
  while (i < n) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '%') { while (i < n && s[i] !== '\n') i++; continue; }
    if (c === '(') {
      let depth = 1, j = i + 1, buf = '';
      while (j < n && depth > 0) {
        if (s[j] === '\\') { buf += s[j] + (s[j + 1] || ''); j += 2; continue; }
        if (s[j] === '(') depth++;
        if (s[j] === ')') { depth--; if (depth === 0) { j++; break; } }
        buf += s[j]; j++;
      }
      tokens.push({ type: 'str', value: buf }); i = j; continue;
    }
    if (c === '[') {
      let depth = 1, j = i + 1, buf = '[';
      while (j < n && depth > 0) { if (s[j] === '[') depth++; if (s[j] === ']') depth--; buf += s[j]; j++; }
      tokens.push({ type: 'arr', value: buf }); i = j; continue;
    }
    if (c === '<' && s[i + 1] === '<') {
      let depth = 1, j = i + 2;
      while (j < n && depth > 0) { if (s[j] === '<' && s[j + 1] === '<') { depth++; j += 2; continue; } if (s[j] === '>' && s[j + 1] === '>') { depth--; j += 2; continue; } j++; }
      tokens.push({ type: 'dict' }); i = j; continue;
    }
    if (c === '<') {
      let j = i + 1; while (j < n && s[j] !== '>') j++;
      tokens.push({ type: 'hexstr', value: s.slice(i + 1, j).replace(/[^0-9A-Fa-f]/g, '') }); i = j + 1; continue;
    }
    if (c === '/') { let j = i + 1; while (j < n && !/[\s\/[\]()<>%]/.test(s[j])) j++; tokens.push({ type: 'name', value: s.slice(i + 1, j) }); i = j; continue; }
    if (/[-\d.]/.test(c)) { let j = i + 1; while (j < n && /[-\d.]/.test(s[j])) j++; tokens.push({ type: 'num', value: parseFloat(s.slice(i, j)) }); i = j; continue; }
    { let j = i + 1; while (j < n && !/[\s\/[\]()<>%]/.test(s[j])) j++; tokens.push({ type: 'op', value: s.slice(i, j) }); i = j; continue; }
  }
  return tokens;
}
/* Embedded (subset) fonts usually use Identity-H encoding: text in the
   content stream is a hex-string of glyph indices, not plain char codes.
   The reverse map to Unicode lives in that font's /ToUnicode stream
   (simple CMap format, bfchar/bfrange). Without this, "normal" (non-
   scanned) PDFs with embedded fonts — very common from Word/Chrome/
   LibreOffice — would fail to extract text entirely. */
function hexToUtf16Str(hex) {
  if (hex.length % 2 !== 0) hex = '0' + hex;
  let out = '';
  for (let i = 0; i < hex.length; i += 4) {
    const unit = hex.slice(i, i + 4);
    if (unit.length === 4) out += String.fromCharCode(parseInt(unit, 16));
    else if (unit.length === 2) out += String.fromCharCode(parseInt(unit, 16));
  }
  return out;
}
function parseToUnicodeCMap(cmapText) {
  const map = new Map();
  for (const m of cmapText.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    for (const p of m[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) map.set(parseInt(p[1], 16), hexToUtf16Str(p[2]));
  }
  for (const m of cmapText.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    const body = m[1];
    for (const p of body.matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) {
      const lo = parseInt(p[1], 16), hi = parseInt(p[2], 16), base = parseInt(p[3], 16);
      for (let c = lo; c <= hi && c - lo < 65536; c++) map.set(c, String.fromCodePoint(base + (c - lo)));
    }
    for (const p of body.matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*\[([^\]]*)\]/g)) {
      const lo = parseInt(p[1], 16);
      const dsts = Array.from(p[3].matchAll(/<([0-9A-Fa-f]+)>/g)).map((d) => d[1]);
      dsts.forEach((d, i) => map.set(lo + i, hexToUtf16Str(d)));
    }
  }
  return map;
}
function resolveFontRefs(dictStr) {
  const map = {};
  for (const m of dictStr.matchAll(/\/(\S+)\s+(\d+)\s+0\s+R/g)) map[m[1]] = +m[2];
  return map;
}
async function buildFontToUnicodeMaps(objs) {
  const result = {};
  for (const [, o] of objs) {
    for (const m of o.dict.matchAll(/\/Font\s*<<([\s\S]*?)>>/g)) {
      const refs = resolveFontRefs(m[1]);
      for (const name in refs) {
        const fontObj = objs.get(refs[name]);
        if (!fontObj) continue;
        const tuM = fontObj.dict.match(/\/ToUnicode\s+(\d+)\s+0\s+R/);
        if (!tuM) continue;
        const cmapObj = objs.get(+tuM[1]);
        if (!cmapObj || cmapObj.streamRaw == null) continue;
        let raw = strToLatin1Bytes(cmapObj.streamRaw);
        if (/\/Filter\s*\/FlateDecode/.test(cmapObj.dict) || /\/Filter\s*\[[^\]]*\/FlateDecode/.test(cmapObj.dict)) {
          try { raw = await zlibInflate(raw); } catch (e) { continue; }
        }
        result[name] = parseToUnicodeCMap(pdfLatin1Decode(raw));
      }
    }
  }
  return result;
}
function decodeShowToken(tok, curFontMap) {
  if (tok.type === 'str') return pdfUnescapeString(tok.value);
  if (tok.type === 'hexstr') {
    const hex = tok.value;
    if (curFontMap) {
      let out = ''; for (let i = 0; i < hex.length; i += 4) { const code = parseInt(hex.slice(i, i + 4) || hex.slice(i, i + 2), 16); const ch = curFontMap.get(code); if (ch != null) out += ch; } return out;
    }
    let out = ''; for (let i = 0; i + 1 < hex.length; i += 2) out += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16)); return out;
  }
  return '';
}
function extractParagraphsFromContentStream(s, fontMaps, imageRefs) {
  fontMaps = fontMaps || {}; imageRefs = imageRefs || {};
  const tokens = tokenizePdfContentStream(s);
  const items = []; let cur = '', curMaxSize = 0;
  let lastX = null, lastY = null, lastSize = 11, curFontMap = null;
  const flush = () => { if (cur.trim()) items.push({ kind: 'text', text: cur.trim(), size: curMaxSize || lastSize }); cur = ''; curMaxSize = 0; };
  const addText = (t) => { cur += t; curMaxSize = Math.max(curMaxSize, lastSize); };
  // Many PDFs (especially from design/typesetting apps) place EVERY character or
  // syllable at its own (Tm/Td) position for precise kerning — not one Tj per word.
  // Naively inserting a space on EVERY position change would over-split ("V a r i a n").
  // Never inserting one at all would glue different table cells on the same row
  // together ("Full Colorbignet..."). The fix: look at the SIZE of the jump, not
  // just whether one happened.
  const onMove = (dx, dy) => {
    if (Math.abs(dy) > lastSize * 1.4) { flush(); return; }
    if (Math.abs(dy) > lastSize * 0.4 || Math.abs(dx) > lastSize * 0.9) { if (cur && !/\s$/.test(cur)) cur += ' '; }
  };
  const stack = [];
  for (const t of tokens) {
    if (t.type !== 'op') { stack.push(t); continue; }
    const op = t.value;
    if (op === 'Do') {
      const nameTok = stack[stack.length - 1];
      if (nameTok && nameTok.type === 'name' && imageRefs[nameTok.value]) {
        flush();
        items.push({ kind: 'image', obj: imageRefs[nameTok.value] });
      }
      stack.length = 0; continue;
    }
    if (op === 'Tf') {
      const size = stack[stack.length - 1], fname = stack[stack.length - 2];
      if (size && size.type === 'num') lastSize = size.value;
      curFontMap = (fname && fname.type === 'name' && fontMaps[fname.value]) || null;
      stack.length = 0; continue;
    }
    if (op === 'Td' || op === 'TD') {
      const dyTok = stack[stack.length - 1], dxTok = stack[stack.length - 2];
      if (dyTok && dyTok.type === 'num') {
        const dx = (dxTok && dxTok.type === 'num') ? dxTok.value : 0;
        onMove(dx, dyTok.value);
        lastX = (lastX == null ? 0 : lastX) + dx;
        lastY = (lastY == null ? 0 : lastY) + dyTok.value;
      }
      stack.length = 0; continue;
    }
    if (op === 'Tm') {
      const y = stack[stack.length - 1], x = stack[stack.length - 2];
      if (y && y.type === 'num' && x && x.type === 'num') {
        onMove(lastX == null ? 0 : x.value - lastX, lastY == null ? 0 : y.value - lastY);
        lastX = x.value; lastY = y.value;
      }
      stack.length = 0; continue;
    }
    if (op === 'T*') { flush(); stack.length = 0; continue; }
    if (op === 'Tj') { const s2 = stack[stack.length - 1]; if (s2) addText(decodeShowToken(s2, curFontMap)); stack.length = 0; continue; }
    if (op === "'" || op === '"') { flush(); const s2 = stack[stack.length - 1]; if (s2) addText(decodeShowToken(s2, curFontMap)); stack.length = 0; continue; }
    if (op === 'TJ') {
      const arrTok = stack[stack.length - 1];
      if (arrTok && arrTok.type === 'arr') {
        const inner = tokenizePdfContentStream(arrTok.value.slice(1, -1));
        for (const it of inner) if (it.type === 'str' || it.type === 'hexstr') addText(decodeShowToken(it, curFontMap));
      }
      stack.length = 0; continue;
    }
    if (op === 'BT' || op === 'ET') { stack.length = 0; continue; }
    stack.length = 0;
  }
  flush();
  return items;
}
function findPdfObjects(latin1Str) {
  const objs = new Map();
  const re = /(\d+)\s+\d+\s+obj([\s\S]*?)endobj/g;
  let m;
  while ((m = re.exec(latin1Str))) {
    const num = +m[1]; const body = m[2];
    const streamIdx = body.indexOf('stream');
    if (streamIdx >= 0) {
      let dataStart = streamIdx + 6;
      if (body[dataStart] === '\r') dataStart++;
      if (body[dataStart] === '\n') dataStart++;
      const dict = body.slice(0, streamIdx);
      // Use /Length directly (numeric) when present — more precise than searching
      // for the text "endstream", which (if uncorrected) would include the preceding
      // EOL (corrupting binary streams like images; for text streams the effect is
      // invisible, which is why it slips through).
      const lenM = dict.match(/\/Length\s+(\d+)(?!\s+\d+\s+R)/);
      let streamRaw;
      if (lenM) {
        streamRaw = body.slice(dataStart, dataStart + +lenM[1]);
      } else {
        let endIdx = body.lastIndexOf('endstream');
        if (endIdx >= 0) {
          if (body[endIdx - 1] === '\n') { endIdx--; if (body[endIdx - 1] === '\r') endIdx--; }
          streamRaw = body.slice(dataStart, endIdx);
        } else streamRaw = null;
      }
      objs.set(num, { dict, streamRaw });
    } else {
      objs.set(num, { dict: body, streamRaw: null });
    }
  }
  return objs;
}
/* PDF 1.5+ often bundles many objects (including page objects) inside a
   compressed Object Stream (/Type /ObjStm) to shrink file size — those
   objects never appear as plain "N G obj...endobj" text at all, so they
   must be unpacked separately via the N-pair (objNum, offset) header at
   the start of the decompressed stream. */
async function expandObjectStreams(objs) {
  const objStmNums = [];
  for (const [num, o] of objs) if (/\/Type\s*\/ObjStm/.test(o.dict)) objStmNums.push(num);
  for (const num of objStmNums) {
    const o = objs.get(num);
    if (o.streamRaw == null) continue;
    let raw = strToLatin1Bytes(o.streamRaw);
    if (/\/Filter\s*\/FlateDecode/.test(o.dict) || /\/Filter\s*\[[^\]]*\/FlateDecode/.test(o.dict)) {
      try { raw = await zlibInflate(raw); } catch (e) { continue; }
    }
    const text = pdfLatin1Decode(raw);
    const nM = o.dict.match(/\/N\s+(\d+)/), firstM = o.dict.match(/\/First\s+(\d+)/);
    if (!nM || !firstM) continue;
    const n = +nM[1], first = +firstM[1];
    const header = text.slice(0, first).trim().split(/\s+/).map(Number);
    for (let i = 0; i < n; i++) {
      const objNum = header[i * 2], offset = header[i * 2 + 1];
      if (objNum == null || offset == null) continue;
      const end = (i + 1 < n) ? first + header[(i + 1) * 2 + 1] : text.length;
      const dict = text.slice(first + offset, end);
      if (!objs.has(objNum)) objs.set(objNum, { dict, streamRaw: null });
    }
  }
}
export async function parsePdfStructure(bytes) {
  const s = pdfLatin1Decode(bytes);
  if (!s.startsWith('%PDF')) throw new Error('Bukan file PDF yang valid.');
  const objs = findPdfObjects(s);
  await expandObjectStreams(objs);
  const pageNums = [];
  for (const [num, o] of objs) if (/\/Type\s*\/Page(?!s)/.test(o.dict)) pageNums.push(num);
  pageNums.sort((a, b) => a - b);
  if (!pageNums.length) throw new Error('Tidak ditemukan halaman di dalam PDF (mungkin terenkripsi atau strukturnya non-standar).');
  return { objs, pageNums };
}
function pdfPageContentNums(pageObj) {
  let contentNums = Array.from(pageObj.dict.matchAll(/\/Contents\s+(\d+)\s+0\s+R/g)).map((m) => +m[1]);
  if (!contentNums.length) {
    const arrM = pageObj.dict.match(/\/Contents\s*\[([^\]]*)\]/);
    if (arrM) contentNums = Array.from(arrM[1].matchAll(/(\d+)\s+0\s+R/g)).map((m) => +m[1]);
  }
  return contentNums;
}
/* Full-page images for scanned PDFs (used by the OCR path) — finds Image
   XObjects referenced by the page's /Resources. */
export function findPageImages(objs, pageObj) {
  const out = [];
  const xobjM = pageObj.dict.match(/\/XObject\s*<<([\s\S]*?)>>/);
  if (!xobjM) return out;
  const refs = resolveFontRefs(xobjM[1]);
  for (const name in refs) {
    const obj = objs.get(refs[name]);
    if (obj && /\/Subtype\s*\/Image/.test(obj.dict)) out.push(obj);
  }
  return out;
}
const UNSUPPORTED_IMAGE_FILTERS = {
  CCITTFaxDecode: 'CCITT Fax (umum untuk hasil pindai hitam-putih)',
  JBIG2Decode: 'JBIG2 (umum dipakai printer/scanner multifungsi modern)',
  JPXDecode: 'JPEG2000',
};
/* Color palette for /ColorSpace [/Indexed base hival lookup] — the lookup
   may be a literal string directly in the dict, or a separate stream
   (another object). */
function resolveIndexedPalette(csArrStr, objs) {
  const m = csArrStr.match(/\/Indexed\s*(?:\/(\w+)|\[([^\]]*)\])\s+(\d+)\s+(?:\(((?:[^()\\]|\\.)*)\)|(\d+)\s+0\s+R)/);
  if (!m) return null;
  const baseComp = /DeviceRGB/.test(csArrStr) ? 3 : (/DeviceCMYK/.test(csArrStr) ? 4 : (/DeviceGray/.test(csArrStr) ? 1 : 3));
  if (m[4] != null) return { baseComp, table: strToLatin1Bytes(pdfUnescapeString(m[4])) };
  if (m[5] != null) {
    const lookupObj = objs.get(+m[5]);
    if (lookupObj && lookupObj.streamRaw != null) return { baseComp, table: strToLatin1Bytes(lookupObj.streamRaw) };
  }
  return null;
}
function resolveColorSpace(dict, objs) {
  const csRefM = dict.match(/\/ColorSpace\s+(\d+)\s+0\s+R/);
  let csStr = dict;
  if (csRefM) { const o = objs.get(+csRefM[1]); if (o) csStr = o.dict; }
  const nameM = csStr.match(/\/ColorSpace\s*\/(\w+)/);
  if (nameM) return { kind: 'simple', name: nameM[1] };
  const arrM = csStr.match(/\/ColorSpace\s*\[([^\]]*(?:\([^)]*\)[^\]]*)*)\]/);
  if (arrM) {
    if (/\/Indexed/.test(arrM[1])) {
      const pal = resolveIndexedPalette(arrM[1], objs);
      if (pal) return { kind: 'indexed', ...pal };
    }
    if (/\/ICCBased/.test(arrM[1])) {
      const refM = arrM[1].match(/\/ICCBased\s+(\d+)\s+0\s+R/);
      const iccObj = refM && objs.get(+refM[1]);
      const nM = iccObj && iccObj.dict.match(/\/N\s+(\d+)/);
      const n = nM ? +nM[1] : 3;
      return { kind: 'simple', name: n === 1 ? 'DeviceGray' : (n === 4 ? 'DeviceCMYK' : 'DeviceRGB') };
    }
  }
  return { kind: 'simple', name: 'DeviceRGB' };
}
export function pdfImageObjToDescriptor(obj, objs) {
  if (obj.streamRaw == null) return null;
  const wM = obj.dict.match(/\/Width\s+(\d+)/), hM = obj.dict.match(/\/Height\s+(\d+)/);
  const width = wM ? +wM[1] : 0, height = hM ? +hM[1] : 0;
  if (!width || !height) return null;
  for (const filt in UNSUPPORTED_IMAGE_FILTERS) {
    if (new RegExp('/' + filt).test(obj.dict)) return { kind: 'unsupported', filter: filt, label: UNSUPPORTED_IMAGE_FILTERS[filt] };
  }
  if (/\/DCTDecode/.test(obj.dict)) return { kind: 'jpeg', bytes: strToLatin1Bytes(obj.streamRaw), width, height };
  if (/\/FlateDecode/.test(obj.dict)) {
    const bpcM = obj.dict.match(/\/BitsPerComponent\s+(\d+)/);
    const cs = resolveColorSpace(obj.dict, objs || new Map());
    return {
      kind: 'raw', bytes: strToLatin1Bytes(obj.streamRaw), width, height, bpc: bpcM ? +bpcM[1] : 8,
      colorSpace: cs.kind === 'simple' ? cs.name : 'Indexed', indexedPalette: cs.kind === 'indexed' ? cs : null, needsInflate: true,
    };
  }
  return { kind: 'unsupported', filter: 'unknown', label: 'format kompresi tidak dikenali' };
}
/* Inline images in the middle of text (not full-page images for OCR) —
   mapped by resource name ("/Im0") so they can be matched against the
   "Do" operator while sweeping the content stream, preserving their
   position between paragraphs. */
function findPageImageRefs(objs, pageObj) {
  const map = {};
  const xobjM = pageObj.dict.match(/\/XObject\s*<<([\s\S]*?)>>/);
  if (!xobjM) return map;
  const refs = resolveFontRefs(xobjM[1]);
  for (const name in refs) {
    const obj = objs.get(refs[name]);
    if (obj && /\/Subtype\s*\/Image/.test(obj.dict)) map[name] = obj;
  }
  return map;
}

export async function descriptorToImageBlock(desc, alt) {
  if (!desc) return { type: 'p', runs: [run('[' + (alt || 'gambar tidak didukung') + ']')] };
  if (desc.kind === 'unsupported') return { type: 'p', runs: [run('[gambar memakai kompresi ' + desc.label + ' — belum didukung]', { italic: true })] };
  if (desc.kind === 'jpeg') return { type: 'image', src: 'data:image/jpeg;base64,' + bytesToBase64(desc.bytes), alt: alt || '' };
  if (desc.kind === 'raw') {
    let bytes = desc.bytes;
    if (desc.needsInflate) { try { bytes = await zlibInflate(bytes); } catch (e) { return { type: 'p', runs: [run('[' + (alt || 'gambar gagal dibaca') + ']')] }; } }
    const png = await rawPixelsToPngBytes(bytes, desc.width, desc.height, desc.bpc, desc.colorSpace, desc.indexedPalette);
    if (!png) return { type: 'p', runs: [run('[' + (alt || 'gambar tidak didukung (bit depth)') + ']')] };
    return { type: 'image', src: 'data:image/png;base64,' + bytesToBase64(png), alt: alt || '' };
  }
  return { type: 'p', runs: [run('[' + (alt || 'gambar tidak didukung (format kompresi)') + ']')] };
}

export async function pdfToModel(bytes) {
  const { objs, pageNums } = await parsePdfStructure(bytes);
  const fontMaps = await buildFontToUnicodeMaps(objs);

  const allItems = [];
  for (const pnum of pageNums) {
    const pageObj = objs.get(pnum);
    const imageRefs = findPageImageRefs(objs, pageObj);
    for (const cnum of pdfPageContentNums(pageObj)) {
      const cobj = objs.get(cnum);
      if (!cobj || cobj.streamRaw == null) continue;
      let raw = strToLatin1Bytes(cobj.streamRaw);
      if (/\/Filter\s*\/FlateDecode/.test(cobj.dict) || /\/Filter\s*\[[^\]]*\/FlateDecode/.test(cobj.dict)) {
        try { raw = await zlibInflate(raw); } catch (e) { continue; }
      }
      allItems.push(...extractParagraphsFromContentStream(pdfLatin1Decode(raw), fontMaps, imageRefs));
    }
  }
  const textItems = allItems.filter((i) => i.kind === 'text');
  if (!textItems.length) {
    const err = new Error('Tidak ada teks yang bisa diekstrak dari lapisan teks PDF ini — kemungkinan hasil pindai/gambar tanpa teks asli.');
    err.noText = true;
    throw err;
  }
  const sizes = textItems.map((p) => p.size).slice().sort((a, b) => a - b);
  const bodySize = sizes[Math.floor(sizes.length / 2)] || 11;
  const blocks = [];
  for (const item of allItems) {
    if (item.kind === 'text') {
      if (item.size > bodySize * 1.8) blocks.push({ type: 'h', level: 1, runs: [run(item.text)] });
      else if (item.size > bodySize * 1.25) blocks.push({ type: 'h', level: 2, runs: [run(item.text)] });
      else blocks.push({ type: 'p', runs: [run(item.text)] });
    } else if (item.kind === 'image') {
      blocks.push(await descriptorToImageBlock(pdfImageObjToDescriptor(item.obj, objs), null));
    }
  }
  return blocks;
}
