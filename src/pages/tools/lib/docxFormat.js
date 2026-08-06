/* =====================================================================
   docxFormat — DOCX (OOXML) writer & reader. Hand-rolled XML generation
   plus a ZIP container (via bytesUtil.zipWrite/zipRead) — no external
   docx library. Ported 1:1 from image-studio/convert.js.
   ===================================================================== */
import { TENC, TDEC, escapeXml, zipWrite, zipRead, decodeDataUri } from './bytesUtil';
import { run } from './docModel';

/* ---------- writer ---------- */
const RELTYPE = {
  hyperlink: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink',
  image: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image',
};
function makeDocxContext() {
  return {
    rels: [], media: [], nextRid: 1,
    addRel(kind, target, external) { const id = 'rId' + (this.nextRid++); this.rels.push({ id, kind, target, external: !!external }); return id; },
  };
}
function runsToDocxRuns(runs, ctx) {
  const xml = runs.map((r) => {
    const rPr = [];
    if (r.bold) rPr.push('<w:b/>');
    if (r.italic) rPr.push('<w:i/>');
    if (r.code) rPr.push('<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:shd w:val="clear" w:fill="F0F0F0"/>');
    if (r.link) rPr.push('<w:color w:val="0563C1"/><w:u w:val="single"/>');
    const rPrXml = rPr.length ? '<w:rPr>' + rPr.join('') + '</w:rPr>' : '';
    const runXml = '<w:r>' + rPrXml + '<w:t xml:space="preserve">' + escapeXml(r.text) + '</w:t></w:r>';
    if (r.link) { const rid = ctx.addRel('hyperlink', r.link, true); return '<w:hyperlink r:id="' + rid + '">' + runXml + '</w:hyperlink>'; }
    return runXml;
  }).join('');
  return xml || '<w:r><w:t></w:t></w:r>';
}
function imageBlockToDocxXml(b, ctx) {
  const info = b.src ? decodeDataUri(b.src) : null;
  if (!info) return '<w:p><w:r><w:i><w:t xml:space="preserve">[' + escapeXml(b.alt || 'gambar tidak tersedia (bukan data-URI)') + ']</w:t></w:i></w:r></w:p>';
  const ext = info.mime === 'image/jpeg' ? 'jpg' : (info.mime === 'image/gif' ? 'gif' : (info.mime === 'image/webp' ? 'png' : 'png'));
  const idx = ctx.media.length + 1;
  const name = 'image' + idx + '.' + ext;
  ctx.media.push({ name, bytes: info.bytes });
  const rid = ctx.addRel('image', 'media/' + name, false);
  const maxW = 560;
  let w = info.width, h = info.height;
  if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
  const cx = w * 9525, cy = h * 9525;
  return '<w:p><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">' +
    '<wp:extent cx="' + cx + '" cy="' + cy + '"/><wp:docPr id="' + idx + '" name="' + escapeXml(name) + '"/>' +
    '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">' +
    '<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
    '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
    '<pic:nvPicPr><pic:cNvPr id="0" name="' + escapeXml(name) + '"/><pic:cNvPicPr/></pic:nvPicPr>' +
    '<pic:blipFill><a:blip r:embed="' + rid + '"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>' +
    '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>' +
    '</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>';
}
function listToDocxXml(b, ctx, depth) {
  depth = depth || 0;
  const numId = b.ordered ? 2 : 1;
  const parts = [];
  for (const item of b.items) {
    const [first, ...rest] = item;
    parts.push('<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="' + Math.min(depth, 3) + '"/><w:numId w:val="' + numId + '"/></w:numPr></w:pPr>' +
      runsToDocxRuns(first ? first.runs : [], ctx) + '</w:p>');
    for (const sub of rest) {
      if (sub.type === 'list') parts.push(listToDocxXml(sub, ctx, depth + 1));
      else parts.push(blockToDocxXml(sub, ctx));
    }
  }
  return parts.join('');
}
function tableToDocxXml(b, ctx) {
  const cols = b.rows[0] ? b.rows[0].length : 1;
  const gridCols = Array(cols).fill('<w:gridCol/>').join('');
  const rowsXml = b.rows.map((row, ri) => {
    const cellsXml = row.map((cell) => {
      const shd = (b.header && ri === 0) ? '<w:shd w:val="clear" w:fill="EFEFEF"/>' : '';
      const content = blocksToDocxXml(cell, ctx) || '<w:p/>';
      return '<w:tc><w:tcPr>' + shd + '</w:tcPr>' + content + '</w:tc>';
    });
    return '<w:tr>' + cellsXml.join('') + '</w:tr>';
  });
  return '<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders>' +
    '<w:top w:val="single" w:sz="4" w:color="999999"/><w:left w:val="single" w:sz="4" w:color="999999"/>' +
    '<w:bottom w:val="single" w:sz="4" w:color="999999"/><w:right w:val="single" w:sz="4" w:color="999999"/>' +
    '<w:insideH w:val="single" w:sz="4" w:color="999999"/><w:insideV w:val="single" w:sz="4" w:color="999999"/></w:tblBorders></w:tblPr>' +
    '<w:tblGrid>' + gridCols + '</w:tblGrid>' + rowsXml.join('') + '</w:tbl>';
}
function blockToDocxXml(b, ctx) {
  switch (b.type) {
    case 'h': return '<w:p><w:pPr><w:pStyle w:val="Heading' + b.level + '"/></w:pPr>' + runsToDocxRuns(b.runs, ctx) + '</w:p>';
    case 'p': return '<w:p>' + runsToDocxRuns(b.runs, ctx) + '</w:p>';
    case 'hr': return '<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="999999"/></w:pBdr></w:pPr></w:p>';
    case 'quote': return '<w:p><w:pPr><w:pStyle w:val="Quote"/><w:ind w:left="720"/></w:pPr></w:p>' + blocksToDocxXml(b.blocks, ctx);
    case 'code': return b.text.split('\n').map((line) =>
      '<w:p><w:pPr><w:shd w:val="clear" w:fill="F5F5F5"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/></w:rPr>' +
      '<w:t xml:space="preserve">' + escapeXml(line) + '</w:t></w:r></w:p>').join('');
    case 'image': return imageBlockToDocxXml(b, ctx);
    case 'list': return listToDocxXml(b, ctx, 0);
    case 'table': return tableToDocxXml(b, ctx);
    default: return '';
  }
}
function blocksToDocxXml(blocks, ctx) { return blocks.map((b) => blockToDocxXml(b, ctx)).join(''); }

const DOCX_STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr></w:rPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="360" w:after="120"/></w:pPr><w:rPr><w:b/><w:sz w:val="32"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="320" w:after="100"/></w:pPr><w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="280" w:after="100"/></w:pPr><w:rPr><w:b/><w:sz w:val="26"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading4"><w:name w:val="heading 4"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="240" w:after="80"/></w:pPr><w:rPr><w:b/><w:i/><w:sz w:val="24"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading5"><w:name w:val="heading 5"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="220" w:after="80"/></w:pPr><w:rPr><w:b/><w:sz w:val="22"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading6"><w:name w:val="heading 6"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="200" w:after="80"/></w:pPr><w:rPr><w:b/><w:i/><w:sz w:val="21"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/></w:style>
<w:style w:type="paragraph" w:styleId="Quote"><w:name w:val="Quote"/><w:basedOn w:val="Normal"/><w:pPr><w:pBdr><w:left w:val="single" w:sz="12" w:space="8" w:color="AAAAAA"/></w:pBdr></w:pPr><w:rPr><w:i/><w:color w:val="555555"/></w:rPr></w:style>
</w:styles>`;

const DOCX_NUMBERING_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:abstractNum w:abstractNumId="0">
${['•', 'o', '▪', '•'].map((ch, i) => `<w:lvl w:ilvl="${i}"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="${ch}"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="${720 + i * 360}" w:hanging="360"/></w:pPr><w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/></w:rPr></w:lvl>`).join('\n')}
</w:abstractNum>
<w:abstractNum w:abstractNumId="1">
${['decimal', 'lowerLetter', 'lowerRoman', 'decimal'].map((fmt, i) => `<w:lvl w:ilvl="${i}"><w:start w:val="1"/><w:numFmt w:val="${fmt}"/><w:lvlText w:val="%${i + 1}."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="${720 + i * 360}" w:hanging="360"/></w:pPr></w:lvl>`).join('\n')}
</w:abstractNum>
<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
<w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num>
</w:numbering>`;

const DOCX_CONTENT_TYPES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Default Extension="png" ContentType="image/png"/>
<Default Extension="jpg" ContentType="image/jpeg"/>
<Default Extension="gif" ContentType="image/gif"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;

const DOCX_ROOT_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

const DOCX_APP_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Image Studio Document Converter</Application></Properties>`;

function docxCoreXml(title) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:title>${escapeXml(title || 'Dokumen')}</dc:title>
</cp:coreProperties>`;
}

export async function modelToDocx(blocks, title) {
  const ctx = makeDocxContext();
  const bodyXml = blocksToDocxXml(blocks, ctx);
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
<w:body>${bodyXml}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1417" w:right="1417" w:bottom="1417" w:left="1417"/></w:sectPr></w:body>
</w:document>`;
  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${
    ctx.rels.map((r) => `<Relationship Id="${r.id}" Type="${RELTYPE[r.kind]}" Target="${escapeXml(r.target)}"${r.external ? ' TargetMode="External"' : ''}/>`).join('')
  }</Relationships>`;

  const entries = [
    { name: '[Content_Types].xml', data: TENC.encode(DOCX_CONTENT_TYPES_XML) },
    { name: '_rels/.rels', data: TENC.encode(DOCX_ROOT_RELS_XML) },
    { name: 'docProps/core.xml', data: TENC.encode(docxCoreXml(title)) },
    { name: 'docProps/app.xml', data: TENC.encode(DOCX_APP_XML) },
    { name: 'word/document.xml', data: TENC.encode(documentXml) },
    { name: 'word/styles.xml', data: TENC.encode(DOCX_STYLES_XML) },
    { name: 'word/numbering.xml', data: TENC.encode(DOCX_NUMBERING_XML) },
    { name: 'word/_rels/document.xml.rels', data: TENC.encode(relsXml) },
  ];
  for (const m of ctx.media) entries.push({ name: 'word/media/' + m.name, data: m.bytes });
  return zipWrite(entries);
}

/* ---------- reader ---------- */
function descendantsByLocalName(node, name) {
  const out = [];
  (function walk(n) {
    for (const c of Array.from(n.childNodes)) {
      if (c.nodeType === 1) { if (c.localName === name) out.push(c); walk(c); }
    }
  })(node);
  return out;
}
function docxRunsFromNode(pNode) {
  const runs = [];
  const list = descendantsByLocalName(pNode, 'r');
  for (const r of list) {
    const rPr = Array.from(r.childNodes).find((n) => n.localName === 'rPr');
    const bold = !!(rPr && Array.from(rPr.childNodes).find((n) => n.localName === 'b'));
    const italic = !!(rPr && Array.from(rPr.childNodes).find((n) => n.localName === 'i'));
    let text = '';
    for (const t of Array.from(r.childNodes)) {
      if (t.localName === 't') text += t.textContent;
      else if (t.localName === 'tab') text += '\t';
      else if (t.localName === 'br') text += '\n';
    }
    if (text) runs.push(run(text, { bold, italic }));
  }
  return runs.length ? runs : [run('')];
}
function docxParagraphToBlock(p) {
  const pPr = Array.from(p.childNodes).find((n) => n.localName === 'pPr');
  const pStyle = pPr && Array.from(pPr.childNodes).find((n) => n.localName === 'pStyle');
  const styleVal = pStyle ? pStyle.getAttribute('w:val') : '';
  const numPr = pPr && Array.from(pPr.childNodes).find((n) => n.localName === 'numPr');
  const runs = docxRunsFromNode(p);
  const hm = /^Heading([1-6])$/.exec(styleVal || '');
  if (hm) return { type: 'h', level: +hm[1], runs };
  if (numPr) {
    const numId = Array.from(numPr.childNodes).find((n) => n.localName === 'numId');
    return { type: 'list', ordered: false, __numId: numId ? numId.getAttribute('w:val') : null, items: [[{ type: 'p', runs }]] };
  }
  return { type: 'p', runs };
}
function docxTableToBlock(tbl) {
  const rows = Array.from(tbl.childNodes).filter((n) => n.localName === 'tr').map((tr) => {
    return Array.from(tr.childNodes).filter((n) => n.localName === 'tc').map((tc) => {
      const ps = Array.from(tc.childNodes).filter((n) => n.localName === 'p');
      return ps.map(docxParagraphToBlock);
    });
  });
  return { type: 'table', header: true, rows };
}
function mergeConsecutiveListBlocks(blocks) {
  const out = [];
  for (const b of blocks) {
    const last = out[out.length - 1];
    if (b.type === 'list' && last && last.type === 'list' && last.ordered === b.ordered) {
      last.items.push(...b.items);
    } else out.push(b);
  }
  return out;
}
export function docxDocumentXmlToModel(xmlText) {
  const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
  const body = doc.getElementsByTagName('w:body')[0] || doc.documentElement;
  const blocks = [];
  Array.from(body.childNodes).forEach((node) => {
    if (node.localName === 'p') blocks.push(docxParagraphToBlock(node));
    else if (node.localName === 'tbl') blocks.push(docxTableToBlock(node));
  });
  return mergeConsecutiveListBlocks(blocks);
}
export async function docxToModel(bytes) {
  const files = await zipRead(bytes);
  const docXml = files.get('word/document.xml');
  if (!docXml) throw new Error('Bukan file .docx yang valid (word/document.xml tidak ditemukan).');
  return docxDocumentXmlToModel(TDEC.decode(docXml));
}
