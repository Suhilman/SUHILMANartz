/* =====================================================================
   Document Converter — konversi dokumen teks-berformat (TXT/Markdown/
   HTML/DOCX) dan data tabel (CSV/TSV/JSON/XLSX), 100% lokal di browser.
   Tidak ada library eksternal — parser Markdown, pembaca/penulis ZIP,
   generator DOCX (OOXML) dan PDF semua ditulis manual di file ini.

   Bagian LOGIKA (tanpa akses DOM) berada di atas agar bisa diuji lewat
   Node.js secara langsung. Bagian UI (akses DOM) ada di paling bawah.
   ===================================================================== */
'use strict';

/* ============================== Util dasar ============================== */
const TENC = new TextEncoder();
const TDEC = new TextDecoder();

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function escapeXml(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for(let n=0;n<256;n++){
    let c=n;
    for(let k=0;k<8;k++) c = (c&1) ? (0xEDB88320 ^ (c>>>1)) : (c>>>1);
    t[n]=c>>>0;
  }
  return t;
})();
function crc32(bytes){
  let c = 0xFFFFFFFF;
  for(let i=0;i<bytes.length;i++) c = CRC_TABLE[(c^bytes[i])&0xFF] ^ (c>>>8);
  return (c^0xFFFFFFFF)>>>0;
}
function concatBytes(chunks){
  let len=0; for(const c of chunks) len+=c.length;
  const out = new Uint8Array(len); let o=0;
  for(const c of chunks){ out.set(c,o); o+=c.length; }
  return out;
}

/* ============================== ZIP (deflate-raw) ============================== */
async function deflateRaw(bytes){
  const cs = new CompressionStream('deflate-raw');
  const writer = cs.writable.getWriter();
  writer.write(bytes); writer.close();
  const chunks = []; const reader = cs.readable.getReader();
  while(true){ const {done,value} = await reader.read(); if(done) break; chunks.push(value); }
  return concatBytes(chunks);
}
async function inflateRaw(bytes){
  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  writer.write(bytes); writer.close();
  const chunks = []; const reader = ds.readable.getReader();
  while(true){ const {done,value} = await reader.read(); if(done) break; chunks.push(value); }
  return concatBytes(chunks);
}

async function zipWrite(entries){ // entries: [{name, data:Uint8Array}]
  const DOS_DATE=22561, DOS_TIME=0; // 2024-01-01 00:00:00, nilai tetap — tidak memengaruhi validitas ZIP
  const localParts = [], centralParts = [];
  let offset = 0;
  for(const {name,data} of entries){
    const nameBytes = TENC.encode(name);
    const crc = crc32(data);
    const comp = await deflateRaw(data);
    const useStore = comp.length >= data.length;
    const method = useStore ? 0 : 8;
    const payload = useStore ? data : comp;

    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0,0x04034b50,true); lh.setUint16(4,20,true); lh.setUint16(6,0,true);
    lh.setUint16(8,method,true); lh.setUint16(10,DOS_TIME,true); lh.setUint16(12,DOS_DATE,true);
    lh.setUint32(14,crc,true); lh.setUint32(18,payload.length,true); lh.setUint32(22,data.length,true);
    lh.setUint16(26,nameBytes.length,true); lh.setUint16(28,0,true);
    const lhBytes = new Uint8Array(lh.buffer);
    localParts.push(lhBytes, nameBytes, payload);

    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0,0x02014b50,true); ch.setUint16(4,20,true); ch.setUint16(6,20,true); ch.setUint16(8,0,true);
    ch.setUint16(10,method,true); ch.setUint16(12,DOS_TIME,true); ch.setUint16(14,DOS_DATE,true);
    ch.setUint32(16,crc,true); ch.setUint32(20,payload.length,true); ch.setUint32(24,data.length,true);
    ch.setUint16(28,nameBytes.length,true); ch.setUint16(30,0,true); ch.setUint16(32,0,true);
    ch.setUint16(34,0,true); ch.setUint16(36,0,true); ch.setUint32(38,0,true); ch.setUint32(42,offset,true);
    centralParts.push(new Uint8Array(ch.buffer), nameBytes);

    offset += lhBytes.length + nameBytes.length + payload.length;
  }
  const centralStart = offset;
  let centralSize = 0; for(const p of centralParts) centralSize += p.length;
  const eocd = new DataView(new ArrayBuffer(22));
  eocd.setUint32(0,0x06054b50,true); eocd.setUint16(4,0,true); eocd.setUint16(6,0,true);
  eocd.setUint16(8,entries.length,true); eocd.setUint16(10,entries.length,true);
  eocd.setUint32(12,centralSize,true); eocd.setUint32(16,centralStart,true); eocd.setUint16(20,0,true);

  return concatBytes([...localParts, ...centralParts, new Uint8Array(eocd.buffer)]);
}

async function zipRead(bytes){
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocdOff = -1;
  const start = Math.max(0, bytes.length-22-65557);
  for(let i=bytes.length-22; i>=start; i--){
    if(dv.getUint32(i,true)===0x06054b50){ eocdOff=i; break; }
  }
  if(eocdOff<0) throw new Error('Bukan file ZIP/Office yang valid (EOCD tidak ditemukan).');
  const numEntries = dv.getUint16(eocdOff+10,true);
  const cdOffset = dv.getUint32(eocdOff+16,true);
  const out = new Map();
  let p = cdOffset;
  for(let i=0;i<numEntries;i++){
    const sig = dv.getUint32(p,true);
    if(sig!==0x02014b50) throw new Error('Struktur ZIP rusak (central directory).');
    const method = dv.getUint16(p+10,true);
    const compSize = dv.getUint32(p+20,true);
    const nameLen = dv.getUint16(p+28,true);
    const extraLen = dv.getUint16(p+30,true);
    const commentLen = dv.getUint16(p+32,true);
    const lhOffset = dv.getUint32(p+42,true);
    const name = TDEC.decode(bytes.subarray(p+46, p+46+nameLen));
    p += 46 + nameLen + extraLen + commentLen;

    const lhNameLen = dv.getUint16(lhOffset+26,true);
    const lhExtraLen = dv.getUint16(lhOffset+28,true);
    const dataStart = lhOffset + 30 + lhNameLen + lhExtraLen;
    const raw = bytes.slice(dataStart, dataStart+compSize);
    if(method===0) out.set(name, raw);
    else if(method===8) out.set(name, await inflateRaw(raw));
    else throw new Error('Metode kompresi ZIP tidak didukung: '+method);
  }
  return out;
}

/* ============================== Model dokumen ==============================
   Blok: {type:'h',level,runs} {type:'p',runs} {type:'list',ordered,items:[[blok..]]}
         {type:'table',header,rows:[[ [blok..], ... ]]} {type:'hr'}
         {type:'code',text,lang} {type:'quote',blocks:[blok..]} {type:'image',src,alt}
   Run:  {text,bold,italic,code,link}
   ============================================================================ */
const run = (text, o={}) => ({text, bold:!!o.bold, italic:!!o.italic, code:!!o.code, link:o.link||null});
function plainTextOfRuns(runs){ return runs.map(r=>r.text).join(''); }
function plainTextOfBlocks(blocks){
  return blocks.map(b => plainTextOfBlock(b)).join('\n');
}
function plainTextOfBlock(b){
  switch(b.type){
    case 'h': case 'p': return plainTextOfRuns(b.runs);
    case 'list': return b.items.map((it,i)=> (b.ordered?(i+1)+'. ':'- ')+plainTextOfBlocks(it)).join('\n');
    case 'table': return b.rows.map(row=>row.map(cell=>plainTextOfBlocks(cell)).join(' | ')).join('\n');
    case 'quote': return plainTextOfBlocks(b.blocks);
    case 'code': return b.text;
    case 'hr': return '';
    case 'image': return '['+(b.alt||'gambar')+']';
    default: return '';
  }
}

/* ============================== Markdown → Model ============================== */
function parseInline(text){
  const runs = [];
  let i = 0;
  const n = text.length;
  let buf = '';
  const flush = () => { if(buf){ runs.push(run(buf)); buf=''; } };
  while(i<n){
    if(text.startsWith('**',i)){
      const end = text.indexOf('**', i+2);
      if(end>=0){ flush(); runs.push(run(text.slice(i+2,end), {bold:true})); i=end+2; continue; }
    }
    if((text[i]==='*'||text[i]==='_') && text[i+1]!==' '){
      const ch = text[i]; const end = text.indexOf(ch, i+1);
      if(end>i+1){ flush(); runs.push(run(text.slice(i+1,end), {italic:true})); i=end+1; continue; }
    }
    if(text[i]==='`'){
      const end = text.indexOf('`', i+1);
      if(end>=0){ flush(); runs.push(run(text.slice(i+1,end), {code:true})); i=end+1; continue; }
    }
    if(text[i]==='!' && text[i+1]==='['){
      const close = text.indexOf(']', i+2);
      if(close>=0 && text[close+1]==='('){
        const end = text.indexOf(')', close+2);
        if(end>=0){ flush(); /* gambar inline: turunkan jadi teks alt bertautan, penanganan penuh ada di level blok */
          runs.push(run('['+text.slice(i+2,close)+']')); i=end+1; continue; }
      }
    }
    if(text[i]==='['){
      const close = text.indexOf(']', i+1);
      if(close>=0 && text[close+1]==='('){
        const end = text.indexOf(')', close+2);
        if(end>=0){ flush(); runs.push(run(text.slice(i+1,close), {link:text.slice(close+2,end)})); i=end+1; continue; }
      }
    }
    buf += text[i]; i++;
  }
  flush();
  return runs.length ? runs : [run('')];
}

function parseMarkdown(md){
  const lines = md.replace(/\r\n?/g,'\n').split('\n');
  const blocks = [];
  let i = 0;
  const isHr = l => /^ {0,3}([-*_])( *\1){2,} *$/.test(l);
  const listRe = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;

  function parseListBlock(baseIndent){
    const ordered = /\d/.test(lines[i].match(listRe)[2]);
    const items = [];
    while(i<lines.length){
      const m = lines[i].match(listRe);
      if(!m || m[1].length < baseIndent) break;
      if(m[1].length > baseIndent){ break; } // level lebih dalam ditangani rekursif di bawah
      const itemLines = [m[3]];
      i++;
      while(i<lines.length && lines[i].trim() && !listRe.test(lines[i]) && !isHr(lines[i]) && !/^#{1,6}\s/.test(lines[i])){
        itemLines.push(lines[i].trim()); i++;
      }
      const itemBlocks = [{type:'p', runs: parseInline(itemLines.join(' '))}];
      // list bersarang: baris berikutnya berindentasi lebih dalam
      if(i<lines.length){
        const nm = lines[i].match(listRe);
        if(nm && nm[1].length > baseIndent){
          itemBlocks.push(parseListBlock(nm[1].length));
        }
      }
      items.push(itemBlocks);
    }
    return {type:'list', ordered, items};
  }

  while(i<lines.length){
    const line = lines[i];
    if(!line.trim()){ i++; continue; }

    if(/^```/.test(line)){
      const lang = line.replace(/^```/,'').trim();
      const codeLines = []; i++;
      while(i<lines.length && !/^```/.test(lines[i])){ codeLines.push(lines[i]); i++; }
      i++; // lewati penutup ```
      blocks.push({type:'code', text: codeLines.join('\n'), lang});
      continue;
    }
    const hm = line.match(/^(#{1,6})\s+(.*)$/);
    if(hm){ blocks.push({type:'h', level:hm[1].length, runs:parseInline(hm[2].trim())}); i++; continue; }

    if(isHr(line)){ blocks.push({type:'hr'}); i++; continue; }

    if(/^>\s?/.test(line)){
      const qLines = [];
      while(i<lines.length && /^>\s?/.test(lines[i])){ qLines.push(lines[i].replace(/^>\s?/,'')); i++; }
      blocks.push({type:'quote', blocks: parseMarkdown(qLines.join('\n'))});
      continue;
    }

    if(/^!\[[^\]]*\]\([^)]+\)\s*$/.test(line.trim())){
      const im = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      blocks.push({type:'image', alt:im[1], src:im[2]}); i++; continue;
    }

    if(listRe.test(line)){ blocks.push(parseListBlock(line.match(listRe)[1].length)); continue; }

    if(line.includes('|') && i+1<lines.length && /^\s*\|?[\s:|-]+\|?[\s:-]*$/.test(lines[i+1]) && lines[i+1].includes('-')){
      const splitRow = l => l.trim().replace(/^\|/,'').replace(/\|$/,'').split('|').map(c=>c.trim());
      const header = splitRow(line); i+=2;
      const rows = [header];
      while(i<lines.length && lines[i].includes('|') && lines[i].trim()){ rows.push(splitRow(lines[i])); i++; }
      blocks.push({type:'table', header:true, rows: rows.map(r=>r.map(c=>[{type:'p',runs:parseInline(c)}]))});
      continue;
    }

    const paraLines = [line.trim()]; i++;
    while(i<lines.length && lines[i].trim() && !/^#{1,6}\s/.test(lines[i]) && !isHr(lines[i]) &&
          !listRe.test(lines[i]) && !/^```/.test(lines[i]) && !/^>\s?/.test(lines[i]) && !lines[i].includes('|')){
      paraLines.push(lines[i].trim()); i++;
    }
    blocks.push({type:'p', runs: parseInline(paraLines.join(' '))});
  }
  return blocks;
}

/* ============================== Model → Markdown ============================== */
function runsToMarkdown(runs){
  return runs.map(r => {
    let t = r.text;
    if(r.code) return '`'+t+'`';
    if(r.bold) t = '**'+t+'**';
    if(r.italic) t = '*'+t+'*';
    if(r.link) t = '['+t+']('+r.link+')';
    return t;
  }).join('');
}
function blocksToMarkdown(blocks, indent=''){
  const out = [];
  for(const b of blocks){
    switch(b.type){
      case 'h': out.push(indent+'#'.repeat(b.level)+' '+runsToMarkdown(b.runs)); break;
      case 'p': out.push(indent+runsToMarkdown(b.runs)); break;
      case 'hr': out.push(indent+'---'); break;
      case 'quote': out.push(blocksToMarkdown(b.blocks).map(l=>'> '+l).join('\n')); break;
      case 'code': out.push('```'+(b.lang||'')+'\n'+b.text+'\n```'); break;
      case 'image': out.push('!['+(b.alt||'')+']('+b.src+')'); break;
      case 'list': {
        b.items.forEach((it,idx) => {
          const marker = b.ordered ? (idx+1)+'. ' : '- ';
          const [first, ...rest] = it;
          out.push(indent+marker+(first? runsToMarkdown(first.runs||[]) : ''));
          for(const sub of rest) out.push(blocksToMarkdown([sub], indent+'  ').join('\n'));
        });
        break;
      }
      case 'table': {
        const rowsMd = b.rows.map(row => '| '+row.map(cell=>plainTextOfBlocks(cell)).join(' | ')+' |');
        if(rowsMd.length){
          const cols = b.rows[0].length;
          rowsMd.splice(1,0,'| '+Array(cols).fill('---').join(' | ')+' |');
        }
        out.push(rowsMd.join('\n'));
        break;
      }
    }
    out.push('');
  }
  return out.join('\n').replace(/\n{3,}/g,'\n\n').replace(/^\n+|\n+$/g,'').split('\n');
}
function modelToMarkdown(blocks){ return blocksToMarkdown(blocks).join('\n')+'\n'; }

/* ============================== TXT ⇄ Model ============================== */
function parseTxt(text){
  const paras = text.replace(/\r\n?/g,'\n').split(/\n{2,}/);
  return paras.filter(p=>p.trim()).map(p => ({type:'p', runs:[run(p.replace(/\n/g,' ').trim())]}));
}
function modelToTxt(blocks){
  const lines = [];
  for(const b of blocks){
    switch(b.type){
      case 'h': lines.push(plainTextOfRuns(b.runs).toUpperCase()); break;
      case 'p': lines.push(plainTextOfRuns(b.runs)); break;
      case 'hr': lines.push('----------------------------------------'); break;
      case 'quote': lines.push(modelToTxt(b.blocks).split('\n').map(l=>'  '+l).join('\n')); break;
      case 'code': lines.push(b.text); break;
      case 'image': lines.push('['+(b.alt||'gambar')+']'); break;
      case 'list': b.items.forEach((it,idx) => {
        const marker = b.ordered ? (idx+1)+'. ' : '- ';
        const [first, ...rest] = it;
        lines.push(marker+(first ? plainTextOfRuns(first.runs||[]) : ''));
        for(const sub of rest){
          const subTxt = modelToTxt([sub]).replace(/\n+$/,'');
          lines.push(subTxt.split('\n').map(l=>'    '+l).join('\n'));
        }
      }); break;
      case 'table': b.rows.forEach(row => lines.push(row.map(c=>plainTextOfBlocks(c)).join('   |   '))); break;
    }
    lines.push('');
  }
  return lines.join('\n').replace(/\n{3,}/g,'\n\n').trim()+'\n';
}

/* ============================== Model → HTML ============================== */
function runsToHtml(runs){
  return runs.map(r => {
    let t = escapeHtml(r.text);
    if(r.code) t = '<code>'+t+'</code>';
    if(r.bold) t = '<strong>'+t+'</strong>';
    if(r.italic) t = '<em>'+t+'</em>';
    if(r.link) t = '<a href="'+escapeHtml(r.link)+'">'+t+'</a>';
    return t;
  }).join('');
}
function blocksToHtml(blocks){
  return blocks.map(b => {
    switch(b.type){
      case 'h': return '<h'+b.level+'>'+runsToHtml(b.runs)+'</h'+b.level+'>';
      case 'p': return '<p>'+runsToHtml(b.runs)+'</p>';
      case 'hr': return '<hr>';
      case 'quote': return '<blockquote>'+blocksToHtml(b.blocks)+'</blockquote>';
      case 'code': return '<pre><code>'+escapeHtml(b.text)+'</code></pre>';
      case 'image': return '<p><img src="'+escapeHtml(b.src)+'" alt="'+escapeHtml(b.alt||'')+'"></p>';
      case 'list': {
        const tag = b.ordered ? 'ol' : 'ul';
        const items = b.items.map(it => '<li>'+blocksToHtml(it).replace(/^<p>|<\/p>$/g,'')+'</li>').join('');
        return '<'+tag+'>'+items+'</'+tag+'>';
      }
      case 'table': {
        const rows = b.rows.map((row,ri) => {
          const cellTag = (b.header && ri===0) ? 'th' : 'td';
          return '<tr>'+row.map(cell=>'<'+cellTag+'>'+blocksToHtml(cell).replace(/^<p>|<\/p>$/g,'')+'</'+cellTag+'>').join('')+'</tr>';
        });
        return '<table>'+rows.join('')+'</table>';
      }
      default: return '';
    }
  }).join('\n');
}
function modelToHtmlDoc(blocks, title){
  const body = blocksToHtml(blocks);
  return '<!DOCTYPE html>\n<html lang="id">\n<head>\n<meta charset="utf-8">\n<title>'+escapeHtml(title||'Dokumen')+'</title>\n'+
  '<style>body{font:16px/1.6 -apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:760px;margin:40px auto;padding:0 20px;color:#1a1a1a}'+
  'h1,h2,h3,h4,h5,h6{line-height:1.3;margin:1.4em 0 .5em} table{border-collapse:collapse;width:100%;margin:1em 0}'+
  'th,td{border:1px solid #ccc;padding:6px 10px;text-align:left} blockquote{border-left:3px solid #ccc;margin:1em 0;padding:.2em 1em;color:#555}'+
  'pre{background:#f4f4f4;padding:12px;border-radius:6px;overflow-x:auto} code{background:#f0f0f0;padding:.15em .35em;border-radius:4px}'+
  'img{max-width:100%} hr{border:0;border-top:1px solid #ccc;margin:2em 0}</style>\n</head>\n<body>\n'+body+'\n</body>\n</html>\n';
}

/* ============================== HTML → Model (browser: DOMParser) ============================== */
function htmlToModel(htmlString){
  const doc = new DOMParser().parseFromString(htmlString, 'text/html');
  return walkHtmlChildren(doc.body);
}
function inlineRunsFromNode(node, ctx={}){
  let runs = [];
  node.childNodes.forEach(ch => {
    if(ch.nodeType===3){ if(ch.textContent.trim()!=='' || ch.textContent.includes(' ')) runs.push(run(ch.textContent.replace(/\s+/g,' '), ctx)); return; }
    if(ch.nodeType!==1) return;
    const tag = ch.tagName.toLowerCase();
    if(tag==='br'){ runs.push(run('\n', ctx)); return; }
    if(tag==='strong'||tag==='b'){ runs=runs.concat(inlineRunsFromNode(ch, {...ctx, bold:true})); return; }
    if(tag==='em'||tag==='i'){ runs=runs.concat(inlineRunsFromNode(ch, {...ctx, italic:true})); return; }
    if(tag==='code'){ runs=runs.concat(inlineRunsFromNode(ch, {...ctx, code:true})); return; }
    if(tag==='a'){ runs=runs.concat(inlineRunsFromNode(ch, {...ctx, link:ch.getAttribute('href')||''})); return; }
    runs = runs.concat(inlineRunsFromNode(ch, ctx));
  });
  return runs.length ? runs : [run('', ctx)];
}
function cellBlocksFromNode(node){
  const inline = inlineRunsFromNode(node);
  return [{type:'p', runs: inline}];
}
function walkHtmlChildren(container){
  const blocks = [];
  container.childNodes.forEach(node => {
    if(node.nodeType===3){ const t=node.textContent.trim(); if(t) blocks.push({type:'p', runs:[run(t)]}); return; }
    if(node.nodeType!==1) return;
    const tag = node.tagName.toLowerCase();
    if(/^h[1-6]$/.test(tag)){ blocks.push({type:'h', level:+tag[1], runs: inlineRunsFromNode(node)}); return; }
    if(tag==='p'){ blocks.push({type:'p', runs: inlineRunsFromNode(node)}); return; }
    if(tag==='hr'){ blocks.push({type:'hr'}); return; }
    if(tag==='blockquote'){ blocks.push({type:'quote', blocks: walkHtmlChildren(node)}); return; }
    if(tag==='pre'){ blocks.push({type:'code', text: node.textContent.replace(/\n$/,''), lang:''}); return; }
    if(tag==='img'){ blocks.push({type:'image', src: node.getAttribute('src')||'', alt: node.getAttribute('alt')||''}); return; }
    if(tag==='ul'||tag==='ol'){
      const items = [];
      node.querySelectorAll(':scope > li').forEach(li => {
        const nested = li.querySelector(':scope > ul, :scope > ol');
        const itemBlocks = [{type:'p', runs: inlineRunsFromNode(li)}];
        if(nested){ const sub = walkHtmlChildren({childNodes:[nested]}); itemBlocks.push(...sub); }
        items.push(itemBlocks);
      });
      blocks.push({type:'list', ordered: tag==='ol', items});
      return;
    }
    if(tag==='table'){
      const rows = [];
      let header = false;
      node.querySelectorAll('tr').forEach((tr,ri) => {
        const cells = [];
        tr.querySelectorAll('th,td').forEach(td => { if(td.tagName.toLowerCase()==='th') header=true; cells.push(cellBlocksFromNode(td)); });
        if(cells.length) rows.push(cells);
      });
      blocks.push({type:'table', header, rows});
      return;
    }
    if(tag==='div'||tag==='section'||tag==='article'||tag==='body'||tag==='span'){
      blocks.push(...walkHtmlChildren(node)); return;
    }
    const txt = node.textContent.trim();
    if(txt) blocks.push({type:'p', runs: inlineRunsFromNode(node)});
  });
  return blocks;
}

/* ============================== Data tabel: CSV / TSV / JSON ============================== */
function parseDelimited(text, delim){
  const rows = []; let row = []; let field = ''; let inQuotes = false;
  const s = text.replace(/\r\n?/g,'\n');
  for(let i=0;i<s.length;i++){
    const c = s[i];
    if(inQuotes){
      if(c==='"'){ if(s[i+1]==='"'){ field+='"'; i++; } else inQuotes=false; }
      else field += c;
    } else {
      if(c==='"') inQuotes = true;
      else if(c===delim){ row.push(field); field=''; }
      else if(c==='\n'){ row.push(field); rows.push(row); row=[]; field=''; }
      else field += c;
    }
  }
  if(field!=='' || row.length){ row.push(field); rows.push(row); }
  return rows.filter(r => !(r.length===1 && r[0]===''));
}
function toDelimited(rows, delim){
  const esc = v => {
    const s = v==null ? '' : String(v);
    return /["\n]/.test(s) || s.includes(delim) ? '"'+s.replace(/"/g,'""')+'"' : s;
  };
  return rows.map(r => r.map(esc).join(delim)).join('\r\n')+'\r\n';
}
function tableToJson(rows, firstRowHeader){
  if(!rows.length) return [];
  if(firstRowHeader){
    const headers = rows[0];
    return rows.slice(1).map(r => { const o={}; headers.forEach((h,i)=>o[h||('col'+(i+1))]=r[i]??''); return o; });
  }
  return rows;
}
function jsonToTable(data){
  if(!Array.isArray(data)) throw new Error('JSON harus berupa array data (array of object / array of array).');
  if(!data.length) return {headers:[], rows:[]};
  if(Array.isArray(data[0])) return {headers:null, rows:data};
  const headers = [];
  data.forEach(o => Object.keys(o).forEach(k => { if(!headers.includes(k)) headers.push(k); }));
  const rows = data.map(o => headers.map(h => o[h]??''));
  return {headers, rows};
}

/* =====================================================================
   UI — bagian ini satu-satunya yang mengakses DOM. Semua fungsi di
   atas murni logika dan sudah diuji lewat Node sebelum sampai di sini.
   ===================================================================== */
if(typeof document !== 'undefined'){
(function(){
const $ = s => document.querySelector(s);

const FMT_LABELS = {txt:'Teks polos (.txt)', md:'Markdown (.md)', html:'HTML (.html)', docx:'Word (.docx)',
  csv:'CSV (.csv)', tsv:'TSV (.tsv)', json:'JSON (.json)', xlsx:'Excel (.xlsx)', pdf:'PDF (.pdf)'};
const RICHTEXT_IN = ['txt','md','html','docx','pdf'];
const TABULAR_IN = ['csv','tsv','json','xlsx'];

function detectFormat(filename){
  const ext = (filename.split('.').pop()||'').toLowerCase();
  const map = {txt:'txt', md:'md', markdown:'md', html:'html', htm:'html', docx:'docx',
    csv:'csv', tsv:'tsv', json:'json', xlsx:'xlsx', pdf:'pdf'};
  return map[ext] || null;
}
function textOf(x){ return (x instanceof File || x instanceof Blob) ? x.text() : Promise.resolve(x); }
function bytesOf(x){ return (x instanceof File || x instanceof Blob) ? x.arrayBuffer().then(b=>new Uint8Array(b)) : Promise.resolve(x); }
function formatBytes(n){ return n<1024 ? n+' B' : n<1048576 ? (n/1024).toFixed(1)+' KB' : (n/1048576).toFixed(2)+' MB'; }
function err(m){ $('#err').textContent = m||''; }
function stageInfoIdleText(){
  return (state.format==='pdf' && state.pdfBytes)
    ? 'Pratinjau tampilan asli PDF (mesin PDF bawaan browser).'
    : 'Pratinjau: '+FMT_LABELS[state.format];
}
function showBusy(on, txt){
  if(on) $('#stageInfo').textContent = txt||'Memproses…';
  else if(state.format) $('#stageInfo').textContent = stageInfoIdleText();
}

function reencodeAsJpeg(dataUri){
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width=img.naturalWidth||1; c.height=img.naturalHeight||1;
      const cx = c.getContext('2d');
      cx.fillStyle = '#fff'; cx.fillRect(0,0,c.width,c.height);
      cx.drawImage(img,0,0);
      resolve(c.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = () => resolve(dataUri);
    img.src = dataUri;
  });
}
async function prepareImagesForPdf(model){
  const clone = JSON.parse(JSON.stringify(model));
  async function walkBlocks(blocks){
    for(const b of blocks){
      if(b.type==='image' && b.src && b.src.startsWith('data:') && !b.src.startsWith('data:image/jpeg')){
        b.src = await reencodeAsJpeg(b.src);
      } else if(b.type==='list'){ for(const it of b.items) await walkBlocks(it); }
      else if(b.type==='quote'){ await walkBlocks(b.blocks); }
      else if(b.type==='table'){ for(const row of b.rows) for(const cell of row) await walkBlocks(cell); }
    }
  }
  await walkBlocks(clone);
  return clone;
}

/* ---------- OCR (Tesseract.js dari CDN, hanya dimuat kalau benar-benar dipakai) ----------
   Ini satu-satunya bagian di app ini yang memakai library pihak ketiga & butuh internet —
   dipisah tegas dari jalur baca-teks-PDF biasa yang 100% lokal, dan hanya aktif bila
   pengguna eksplisit menekan tombol "Coba OCR". */
let tesseractLoadPromise = null;
function loadTesseract(){
  if(window.Tesseract) return Promise.resolve();
  if(tesseractLoadPromise) return tesseractLoadPromise;
  tesseractLoadPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
    s.onload = () => resolve();
    s.onerror = () => { tesseractLoadPromise = null; reject(new Error('Gagal memuat Tesseract.js dari CDN — periksa koneksi internet.')); };
    document.head.appendChild(s);
  });
  return tesseractLoadPromise;
}
/* Dipakai juga oleh jalur OCR — bagi implementasi dengan encoder PNG murni yang
   sama (bukan lewat canvas) supaya dukungan format (indexed palette dll) selalu
   konsisten antara jalur impor biasa dan jalur OCR, tidak ada logika ganda yang
   bisa berbeda sendiri-sendiri. */
async function descriptorToDataUri(desc){
  if(!desc || desc.kind==='unsupported') return null;
  if(desc.kind==='jpeg') return 'data:image/jpeg;base64,'+bytesToBase64(desc.bytes);
  if(desc.kind==='raw'){
    let bytes = desc.bytes;
    if(desc.needsInflate){ try{ bytes = await zlibInflate(bytes); }catch(e){ return null; } }
    const png = await rawPixelsToPngBytes(bytes, desc.width, desc.height, desc.bpc, desc.colorSpace, desc.indexedPalette);
    return png ? 'data:image/png;base64,'+bytesToBase64(png) : null;
  }
  return null;
}
async function ocrPdfToModel(bytes, lang, onProgress){
  await loadTesseract();
  const {objs, pageNums} = await parsePdfStructure(bytes);
  const blocks = [];
  const unsupportedSeen = new Set();
  let attempted = 0;
  for(let pi=0; pi<pageNums.length; pi++){
    onProgress && onProgress(pi, pageNums.length);
    const pageObj = objs.get(pageNums[pi]);
    const images = findPageImages(objs, pageObj);
    for(const imgObj of images){
      const desc = pdfImageObjToDescriptor(imgObj, objs);
      if(desc && desc.kind==='unsupported'){ unsupportedSeen.add(desc.label); continue; }
      const dataUri = await descriptorToDataUri(desc);
      if(!dataUri) continue;
      attempted++;
      const { data } = await Tesseract.recognize(dataUri, lang, {
        logger: p => { if(p.status==='recognizing text') onProgress && onProgress(pi, pageNums.length, p.progress); }
      });
      if(data && data.text && data.text.trim()) blocks.push(...parseTxt(data.text));
    }
  }
  if(!attempted && unsupportedSeen.size){
    throw new Error('Gambar di PDF ini memakai kompresi yang belum didukung: '+Array.from(unsupportedSeen).join(', ')+'. OCR tidak bisa dijalankan pada gambar ini.');
  }
  if(!blocks.length) throw new Error('OCR selesai tapi tidak menemukan teks yang terbaca pada halaman-halaman PDF ini.');
  return blocks;
}

const state = { format:null, kind:null, doc:null, rawRows:null, name:'dokumen', target:null, convertedBlob:null, convertedExt:null, paperSize:'a4' };

function applyHeaderToggle(){
  const withHeader = $('#firstRowHeader').checked;
  const rows = state.rawRows||[];
  state.doc = withHeader ? {headers: rows[0]||[], rows: rows.slice(1)} : {headers:null, rows};
}

async function loadSource(format, blobOrText, name){
  err(''); showBusy(true,'Membaca dokumen…'); $('#ocrRow').style.display='none';
  state.pdfBytes = null; state.pendingOcrBytes = null;
  let pdfBytesLocal = null;
  try{
    state.name = name || 'dokumen';
    if(format==='pdf') pdfBytesLocal = await bytesOf(blobOrText);
    if(RICHTEXT_IN.includes(format)){
      let model;
      if(format==='txt') model = parseTxt(await textOf(blobOrText));
      else if(format==='md') model = parseMarkdown(await textOf(blobOrText));
      else if(format==='html') model = htmlToModel(await textOf(blobOrText));
      else if(format==='docx') model = await docxToModel(await bytesOf(blobOrText));
      else if(format==='pdf'){
        try{ model = await pdfToModel(pdfBytesLocal); }
        catch(e){ if(e.noText) state.pendingOcrBytes = pdfBytesLocal; throw e; }
      }
      state.kind = 'richtext'; state.doc = {model}; state.rawRows = null;
    } else if(TABULAR_IN.includes(format)){
      let rows;
      if(format==='csv') rows = parseDelimited(await textOf(blobOrText), ',');
      else if(format==='tsv') rows = parseDelimited(await textOf(blobOrText), '\t');
      else if(format==='xlsx') rows = await xlsxToTable(await bytesOf(blobOrText));
      else if(format==='json'){
        const data = JSON.parse(await textOf(blobOrText));
        const t = jsonToTable(data);
        rows = t.headers ? [t.headers, ...t.rows] : t.rows;
      }
      state.kind = 'tabular'; state.rawRows = rows; applyHeaderToggle();
    } else throw new Error('Format tidak dikenali: '+format);
    state.format = format;
    state.pdfBytes = pdfBytesLocal;
    onSourceReady();
  }catch(e){
    if(format==='pdf' && pdfBytesLocal){
      /* Ekstraksi teks gagal (atau tidak ada lapisan teks) — tetap tampilkan
         pratinjau tampilan asli PDF lewat mesin bawaan browser, seperti membuka
         file PDF langsung. Konversi ke format lain baru tersedia bila ada model
         yang berhasil diekstrak (atau setelah OCR). */
      state.format = 'pdf'; state.kind = 'richtext'; state.doc = null; state.rawRows = null;
      state.pdfBytes = pdfBytesLocal;
      err(e.noText
        ? 'PDF ini tidak punya lapisan teks (kemungkinan hasil pindai) — pratinjau tampilan asli tetap tersedia di kanan. Jalankan OCR di bawah untuk mengonversinya ke teks.'
        : 'Gagal mengekstrak konten dari PDF ini ('+e.message+') — pratinjau tampilan asli tetap ditampilkan di kanan, tapi konversi ke format lain tidak tersedia.');
      onSourceReady();
      $('#ocrRow').style.display = e.noText ? '' : 'none';
    } else {
      err('Gagal membaca dokumen: '+e.message);
      resetTargetUI();
      $('#ocrRow').style.display = e.noText ? '' : 'none';
    }
  } finally { showBusy(false); }
}

$('#btnOcr').onclick = async () => {
  if(!state.pendingOcrBytes) return;
  err(''); showBusy(true,'Memuat Tesseract.js…');
  $('#btnOcr').disabled = true;
  try{
    const lang = $('#ocrLang').value;
    const model = await ocrPdfToModel(state.pendingOcrBytes, lang, (pi,total,frac) => {
      showBusy(true, 'OCR halaman '+(pi+1)+'/'+total+(frac!=null?' · '+Math.round(frac*100)+'%':''));
    });
    state.kind = 'richtext'; state.doc = {model}; state.rawRows = null; state.format = 'pdf';
    $('#ocrRow').style.display = 'none';
    onSourceReady();
  }catch(e){
    err('OCR gagal: '+e.message);
  } finally { showBusy(false); $('#btnOcr').disabled = false; }
};

function applyPaperCanvas(){
  const paper = $('#paper');
  if(state.kind==='richtext' && state.format!=='pdf'){
    const size = PAPER_SIZES[state.paperSize] || PAPER_SIZES.a4;
    const ptToPx = pt => (pt*4/3).toFixed(1)+'px'; // 1pt = 1/72in, pratinjau dirender pada 96dpi CSS
    paper.style.width = ptToPx(size.w);
    paper.style.minHeight = ptToPx(size.h);
    paper.style.maxWidth = 'none';
  } else {
    paper.style.width = ''; paper.style.minHeight = ''; paper.style.maxWidth = '';
  }
}
let pdfPreviewUrl = null;
function releasePdfPreviewUrl(){ if(pdfPreviewUrl){ URL.revokeObjectURL(pdfPreviewUrl); pdfPreviewUrl = null; } }
function resetTargetUI(){
  $('#cardDetected').style.display='none'; $('#cardTarget').style.display='none';
  $('#paperSizeLabel').style.display='none'; $('#paperSizeSel').style.display='none';
  releasePdfPreviewUrl();
  $('#pdfOpenLink').style.display = 'none';
  $('#paperWrap').classList.remove('pdfnative'); $('#paper').classList.remove('pdfnative');
  $('#paper').innerHTML = '<div class="ph-empty">Muat dokumen untuk melihat pratinjau di sini.</div>';
  $('#paper').style.width=''; $('#paper').style.minHeight=''; $('#paper').style.maxWidth='';
  $('#btnConvert').disabled = true; $('#btnSave').disabled = true;
}
function onSourceReady(){
  $('#ocrRow').style.display = 'none';
  $('#cardDetected').style.display = '';
  $('#detectedFmt').textContent = FMT_LABELS[state.format] || state.format;
  $('#detectedKind').textContent = state.kind==='richtext' ? 'Dokumen teks berformat' : 'Data tabel';
  $('#headerRowRow').style.display = state.kind==='tabular' ? '' : 'none';
  const hasModel = state.kind==='tabular' ? true : !!(state.doc && state.doc.model);
  $('#cardTarget').style.display = hasModel ? '' : 'none';
  $('#fmtRichtext').style.display = state.kind==='richtext' ? '' : 'none';
  $('#fmtTabular').style.display = state.kind==='tabular' ? '' : 'none';
  $('#paperSizeLabel').style.display = (state.kind==='richtext' && state.format!=='pdf') ? '' : 'none';
  $('#paperSizeSel').style.display = (state.kind==='richtext' && state.format!=='pdf') ? '' : 'none';
  $('#paperSizeSel').value = state.paperSize;
  if(hasModel) gateTargetButtons();
  renderPreview();
  state.target = null; state.convertedBlob = null; state.convertedExt = null;
  document.querySelectorAll('.fmtgrid button').forEach(b=>b.classList.remove('on'));
  $('#btnConvert').disabled = true; $('#btnSave').disabled = true; $('#outInfo').textContent = '';
  $('#targetHint').textContent = '';
  $('#fileInfo').textContent = state.name+' · '+FMT_LABELS[state.format];
}
function gateTargetButtons(){
  const gridSel = state.kind==='richtext' ? '#fmtRichtext' : '#fmtTabular';
  document.querySelectorAll(gridSel+' button').forEach(b => {
    const same = b.dataset.t===state.format;
    b.disabled = same;
    b.title = same ? 'Sama dengan format sumber' : '';
  });
}
function targetHintFor(t){
  return {
    docx: 'Gambar (data-URI) & tabel ikut disalin; heading jadi Heading 1–6; list bisa bersarang.',
    pdf:  'Tata letak dipaginasi otomatis multi-halaman ukuran '+(PAPER_SIZES[state.paperSize]||PAPER_SIZES.a4).label+', memakai font standar tanpa perlu embed font.',
    html: 'File HTML mandiri dengan sedikit CSS bawaan agar tetap rapi saat dibuka langsung.',
    xlsx: 'Nilai angka & teks dikenali otomatis, satu sheet.',
    json: state.kind==='tabular' && !state.doc.headers ? 'Diekspor sebagai array-of-array (tanpa header).' : 'Diekspor sebagai array objek.',
  }[t] || '';
}
const PREVIEW_CHUNK = 40; // blok (richtext) atau baris (tabular) per "halaman" pratinjau
function previewTotalUnits(){
  return state.kind==='richtext' ? state.doc.model.length : (state.doc.rows||[]).length;
}
function previewPageCount(){
  return Math.max(1, Math.ceil(previewTotalUnits() / PREVIEW_CHUNK));
}
function renderPreview(){
  const paper = $('#paper');
  const wrap = $('#paperWrap');

  if(state.format==='pdf' && state.pdfBytes){
    /* Sumber PDF: tampilkan file aslinya lewat mesin PDF bawaan browser
       (iframe), bukan hasil ekstraksi blok kami — selalu akurat secara visual
       apa pun jenis kompresi gambar/fontnya, tanpa perlu OCR. Model hasil
       ekstraksi (bila ada) tetap dipakai untuk konversi ke format lain. */
    wrap.classList.add('pdfnative'); paper.classList.add('pdfnative');
    paper.style.width = ''; paper.style.minHeight = ''; paper.style.maxWidth = '';
    releasePdfPreviewUrl();
    pdfPreviewUrl = URL.createObjectURL(new Blob([state.pdfBytes], {type:'application/pdf'}));
    paper.innerHTML = '<iframe class="pdfFrame" src="'+pdfPreviewUrl+'" title="Pratinjau PDF asli"></iframe>';
    $('#btnPrevPage').style.display = 'none'; $('#btnNextPage').style.display = 'none'; $('#pagerLabel').style.display = 'none';
    $('#pdfOpenLink').href = pdfPreviewUrl; $('#pdfOpenLink').style.display = '';
    $('#stageInfo').textContent = stageInfoIdleText();
    $('#stageMeta').textContent = (state.doc && state.doc.model) ? state.doc.model.length+' blok konten terekstrak untuk konversi' : 'Belum ada teks terekstrak — konversi belum tersedia';
    return;
  }
  releasePdfPreviewUrl();
  $('#pdfOpenLink').style.display = 'none';
  wrap.classList.remove('pdfnative'); paper.classList.remove('pdfnative');
  applyPaperCanvas();
  const totalPages = previewPageCount();
  state.previewPage = Math.min(state.previewPage||0, totalPages-1);
  const start = state.previewPage * PREVIEW_CHUNK, end = start + PREVIEW_CHUNK;

  if(state.kind==='richtext'){
    const model = state.doc.model;
    const html = blocksToHtml(model.slice(start, end));
    paper.innerHTML = html || '<div class="ph-empty">Dokumen kosong.</div>';
  } else {
    const rows = state.doc.rows||[]; const headers = state.doc.headers;
    const showRows = rows.slice(start, end);
    const headCells = headers ? headers : (rows[0]||[]).map((_,i)=>'col'+(i+1));
    paper.innerHTML = '<table><thead><tr>'+headCells.map(h=>'<th>'+escapeHtml(h)+'</th>').join('')+'</tr></thead><tbody>'+
      showRows.map(r=>'<tr>'+r.map(c=>'<td>'+escapeHtml(c??'')+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
  }

  const showPager = totalPages>1;
  $('#btnPrevPage').style.display = showPager ? '' : 'none';
  $('#btnNextPage').style.display = showPager ? '' : 'none';
  $('#pagerLabel').style.display = showPager ? '' : 'none';
  if(showPager){
    $('#pagerLabel').textContent = 'Bagian '+(state.previewPage+1)+' / '+totalPages;
    $('#btnPrevPage').disabled = state.previewPage<=0;
    $('#btnNextPage').disabled = state.previewPage>=totalPages-1;
  }
  const note = document.createElement('div'); note.className='tabular-note';
  note.textContent = showPager
    ? 'Pratinjau ditampilkan per bagian agar ringan — seluruh isi (semua bagian) tetap diproses lengkap saat konversi, tidak ada yang terpotong.'
    : '';
  if(showPager) paper.appendChild(note);

  $('#stageInfo').textContent = stageInfoIdleText();
  $('#stageMeta').textContent = state.kind==='richtext' ? state.doc.model.length+' blok konten' : (state.doc.rows||[]).length+' baris data';
}
$('#btnPrevPage').onclick = () => { if(state.previewPage>0){ state.previewPage--; renderPreview(); } };
$('#btnNextPage').onclick = () => { if(state.previewPage < previewPageCount()-1){ state.previewPage++; renderPreview(); } };

document.querySelectorAll('.fmtgrid button').forEach(b => b.onclick = () => {
  if(b.disabled) return;
  document.querySelectorAll('.fmtgrid button').forEach(x=>x.classList.remove('on'));
  b.classList.add('on');
  state.target = b.dataset.t;
  state.convertedBlob = null; state.convertedExt = null;
  $('#btnSave').disabled = true; $('#outInfo').textContent = '';
  $('#btnConvert').disabled = false;
  $('#targetHint').textContent = targetHintFor(state.target);
});

$('#btnConvert').onclick = async () => {
  err(''); showBusy(true, 'Mengonversi…');
  try{
    let blob, ext;
    if(state.kind==='richtext'){
      const model = state.doc.model;
      if(state.target==='txt'){ blob = new Blob([modelToTxt(model)],{type:'text/plain'}); ext='txt'; }
      else if(state.target==='md'){ blob = new Blob([modelToMarkdown(model)],{type:'text/markdown'}); ext='md'; }
      else if(state.target==='html'){ blob = new Blob([modelToHtmlDoc(model, state.name)],{type:'text/html'}); ext='html'; }
      else if(state.target==='pdf'){ const prepped = await prepareImagesForPdf(model); blob = new Blob([modelToPdf(prepped, PAPER_SIZES[state.paperSize])],{type:'application/pdf'}); ext='pdf'; }
      else if(state.target==='docx'){ const bytes = await modelToDocx(model, state.name); blob = new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}); ext='docx'; }
    } else {
      const {headers, rows} = state.doc;
      const full = headers ? [headers, ...rows] : rows;
      if(state.target==='csv'){ blob = new Blob([toDelimited(full,',')],{type:'text/csv'}); ext='csv'; }
      else if(state.target==='tsv'){ blob = new Blob([toDelimited(full,'\t')],{type:'text/tab-separated-values'}); ext='tsv'; }
      else if(state.target==='json'){
        const data = headers ? rows.map(r=>{ const o={}; headers.forEach((h,i)=>o[h||('col'+(i+1))]=r[i]??''); return o; }) : rows;
        blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); ext='json';
      }
      else if(state.target==='xlsx'){ const bytes = await tableToXlsx(headers, rows, state.name); blob = new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}); ext='xlsx'; }
    }
    state.convertedBlob = blob; state.convertedExt = ext;
    $('#btnSave').disabled = false;
    $('#outInfo').textContent = 'Siap diunduh: '+state.name+'.'+ext+' · '+formatBytes(blob.size);
  }catch(e){ err('Gagal konversi: '+e.message); }
  finally{ showBusy(false); }
};
$('#btnSave').onclick = () => {
  if(!state.convertedBlob) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(state.convertedBlob); a.download = state.name+'.'+state.convertedExt; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
};

function handleFile(file){
  const fmt = detectFormat(file.name);
  if(!fmt){ err('Ekstensi file tidak dikenali: '+file.name); return; }
  $('#dzTitle').textContent = file.name; $('#dz').classList.add('has');
  loadSource(fmt, file, file.name.replace(/\.[^.]+$/,''));
}
$('#file').onchange = e => { const f=e.target.files[0]; if(f) handleFile(f); e.target.value=''; };
const dz = $('#dz');
['dragenter','dragover'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('over'); }));
['dragleave','drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('over'); }));
dz.addEventListener('drop', e => { const f=e.dataTransfer.files[0]; if(f) handleFile(f); });

document.querySelectorAll('#srcTabs button').forEach(b => b.onclick = () => {
  document.querySelectorAll('#srcTabs button').forEach(x=>x.classList.remove('on'));
  b.classList.add('on');
  $('#srcFile').style.display = b.dataset.src==='file' ? '' : 'none';
  $('#srcPaste').style.display = b.dataset.src==='paste' ? '' : 'none';
});
$('#btnUsePaste').onclick = () => {
  const text = $('#pasteArea').value;
  if(!text.trim()){ err('Teks masih kosong — tempel dulu isi dokumennya.'); return; }
  loadSource($('#pasteType').value, text, 'dokumen-tempel');
};
$('#firstRowHeader').onchange = () => { if(state.kind==='tabular'){ applyHeaderToggle(); renderPreview(); } };
$('#paperSizeSel').onchange = () => {
  state.paperSize = $('#paperSizeSel').value;
  state.convertedBlob = null; state.convertedExt = null;
  $('#btnSave').disabled = true; $('#outInfo').textContent = '';
  if(state.target) $('#targetHint').textContent = targetHintFor(state.target);
  renderPreview();
};
$('#btnMin').onclick = () => {
  const p = $('#floatPanel'); p.classList.toggle('min');
  $('#btnMin').textContent = p.classList.contains('min') ? '+' : '–';
};
})();
}

/* ============================== Gambar: deteksi dimensi dari data-URI ==============================
   Hanya gambar data: URI (base64 inline) yang diproses — tidak pernah mengambil URL
   eksternal secara otomatis (privasi & konsistensi dengan sifat "100% lokal" aplikasi ini). */
function decodeDataUri(dataUri){
  const m = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(dataUri||'');
  if(!m) return null;
  const mime = m[1];
  let bytes;
  if(m[2]){
    const bin = atob(m[3].replace(/\s/g,''));
    bytes = new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
  } else {
    bytes = TENC.encode(decodeURIComponent(m[3]));
  }
  let width=0, height=0;
  if(mime==='image/png' && bytes.length>24 && bytes[0]===0x89 && bytes[1]===0x50){
    width = (bytes[16]*16777216 + bytes[17]*65536 + bytes[18]*256 + bytes[19]);
    height = (bytes[20]*16777216 + bytes[21]*65536 + bytes[22]*256 + bytes[23]);
  } else if(mime==='image/jpeg'){
    let i=2;
    while(i<bytes.length-8){
      if(bytes[i]!==0xFF){ i++; continue; }
      const marker = bytes[i+1];
      if(marker===0xD8||marker===0x01||(marker>=0xD0&&marker<=0xD7)){ i+=2; continue; }
      const len = bytes[i+2]*256+bytes[i+3];
      if(marker>=0xC0 && marker<=0xCF && marker!==0xC4 && marker!==0xC8 && marker!==0xCC){
        height = bytes[i+5]*256+bytes[i+6]; width = bytes[i+7]*256+bytes[i+8]; break;
      }
      i += 2+len;
    }
  }
  return {bytes, mime, width: width||300, height: height||200};
}

/* ============================== PDF — writer ==============================
   Menulis PDF langsung di level byte/objek, memakai 5 font standar (tidak
   perlu embed font): Helvetica, Bold, Oblique, BoldOblique, Courier.
   Lebar karakter Helvetica di bawah adalah metrik AFM standar Adobe
   (data teknis publik) untuk word-wrap yang akurat. */
const HELV_WIDTHS = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,
  556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,
  667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,
  278,278,278,469,556,333,
  556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,
  334,260,334,584];
function charW(code, style){
  if(style.code) return 600;
  const idx = code-32;
  const base = (idx>=0 && idx<HELV_WIDTHS.length) ? HELV_WIDTHS[idx] : 556;
  return style.bold ? Math.round(base*1.08) : base;
}
function measureWidth(text, size, style){
  let w=0; for(let i=0;i<text.length;i++) w += charW(text.codePointAt(i), style);
  return w/1000*size;
}
function fontKeyFor(style){
  if(style.code) return 'F5';
  if(style.bold && style.italic) return 'F4';
  if(style.bold) return 'F2';
  if(style.italic) return 'F3';
  return 'F1';
}
function pdfEscape(s){ return String(s).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)'); }
function latin1Encode(str){
  const out = new Uint8Array(str.length);
  for(let i=0;i<str.length;i++){ const c=str.charCodeAt(i); out[i]= c<=255?c:63; }
  return out;
}
/* Ukuran halaman dalam poin PDF (1pt = 1/72in). A4 tetap default (nilai lama). */
const PAPER_SIZES = {
  a4:     {label:'A4 (210 × 297 mm)',        w:595, h:842},
  letter: {label:'Letter (216 × 279 mm)',    w:612, h:792},
  legal:  {label:'Legal (216 × 356 mm)',     w:612, h:1008},
  f4:     {label:'F4 / Folio (215 × 330 mm)',w:609, h:935},
};
let PDF_PAGE_W = 595, PDF_PAGE_H = 842, PDF_MARGIN = 56;
let PDF_CONTENT_W = PDF_PAGE_W - PDF_MARGIN*2;
function setPdfPageSize(size){
  PDF_PAGE_W = size.w; PDF_PAGE_H = size.h; PDF_MARGIN = 56;
  PDF_CONTENT_W = PDF_PAGE_W - PDF_MARGIN*2;
}

function flattenRunsToWords(runs){
  const words = [];
  for(const r of runs){
    for(const p of r.text.split(/\s+/)) if(p) words.push({text:p, bold:!!r.bold, italic:!!r.italic, code:!!r.code});
  }
  return words;
}
function wrapWords(words, size, maxWidth){
  const lines = []; let cur=[]; let curW=0;
  const spW = measureWidth(' ', size, {});
  for(const w of words){
    const ww = measureWidth(w.text, size, w);
    const add = (cur.length?spW:0)+ww;
    if(cur.length && curW+add>maxWidth){ lines.push(cur); cur=[w]; curW=ww; }
    else { cur.push(w); curW += add; }
  }
  if(cur.length) lines.push(cur);
  return lines.length ? lines : [[]];
}
function makePdfLayout(blocks){
  const pages = [[]];
  const usedImages = [];
  let y = PDF_PAGE_H - PDF_MARGIN;
  const lineGap = 1.35;
  const curPage = () => pages[pages.length-1];
  const newPage = () => { pages.push([]); y = PDF_PAGE_H - PDF_MARGIN; };
  const ensureSpace = h => { if(y-h < PDF_MARGIN) newPage(); };

  function drawWrappedRuns(runs, size, indent){
    const words = flattenRunsToWords(runs);
    const lines = wrapWords(words, size, PDF_CONTENT_W - indent);
    const spW = measureWidth(' ', size, {});
    for(const line of lines){
      ensureSpace(size*lineGap);
      let x = PDF_MARGIN + indent;
      const parts = ['BT']; let curFont = null;
      for(const w of line){
        const fk = fontKeyFor(w);
        if(fk!==curFont){ parts.push(`/${fk} ${size} Tf`); curFont = fk; }
        parts.push(`1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${pdfEscape(w.text)}) Tj`);
        x += measureWidth(w.text,size,w) + spW;
      }
      parts.push('ET');
      curPage().push(parts.join(' '));
      y -= size*lineGap;
    }
  }
  function drawBlocks(list, indent){ for(const b of list) drawBlock(b, indent); }
  function drawBlock(b, indent){
    indent = indent||0;
    switch(b.type){
      case 'h': {
        const sizes = {1:22,2:18,3:15,4:13,5:12,6:11};
        y -= 10;
        drawWrappedRuns(b.runs.map(r=>({...r,bold:true})), sizes[b.level]||12, indent);
        y -= 6;
        break;
      }
      case 'p': drawWrappedRuns(b.runs, 11, indent); y -= 7; break;
      case 'hr': {
        ensureSpace(12);
        curPage().push(`${PDF_MARGIN} ${(y-4).toFixed(2)} m ${PDF_PAGE_W-PDF_MARGIN} ${(y-4).toFixed(2)} l S`);
        y -= 14; break;
      }
      case 'quote': {
        ensureSpace(11*lineGap);
        const startY = y+4;
        drawBlocks(b.blocks, indent+18);
        curPage().push(`q 0.6 0.6 0.6 RG 1.2 w ${(PDF_MARGIN+indent+6).toFixed(2)} ${y.toFixed(2)} m ${(PDF_MARGIN+indent+6).toFixed(2)} ${startY.toFixed(2)} l S Q`);
        y -= 4; break;
      }
      case 'code': {
        for(const line of b.text.split('\n')){
          ensureSpace(13);
          curPage().push(`q 0.95 0.95 0.95 rg ${PDF_MARGIN+indent} ${(y-3).toFixed(2)} ${PDF_CONTENT_W-indent} 13 re f Q`);
          curPage().push(`BT /F5 9.5 Tf 1 0 0 1 ${(PDF_MARGIN+indent+6).toFixed(2)} ${y.toFixed(2)} Tm (${pdfEscape(line)}) Tj ET`);
          y -= 13;
        }
        y -= 6; break;
      }
      case 'list': {
        b.items.forEach((item) => {
          const marker = b.ordered ? (b.items.indexOf(item)+1)+'.' : String.fromCharCode(0x95);
          ensureSpace(11*lineGap);
          curPage().push(`BT /F1 11 Tf 1 0 0 1 ${(PDF_MARGIN+indent).toFixed(2)} ${y.toFixed(2)} Tm (${pdfEscape(marker)}) Tj ET`);
          const [first, ...rest] = item;
          drawWrappedRuns(first?first.runs:[], 11, indent+18);
          for(const sub of rest) drawBlock(sub, indent+18);
        });
        y -= 2; break;
      }
      case 'table': drawTable(b, indent); break;
      case 'image': drawImage(b, indent); break;
      default: break;
    }
  }
  function drawTable(b, indent){
    const cols = b.rows[0] ? b.rows[0].length : 1;
    const tableW = PDF_CONTENT_W-indent;
    const colW = tableW/cols;
    for(let ri=0; ri<b.rows.length; ri++){
      const row = b.rows[ri];
      const cellLines = row.map(cell => wrapWords(flattenRunsToWords([{text:plainTextOfBlocks(cell), bold:b.header&&ri===0, italic:false, code:false}]), 10, colW-10));
      const rowLines = Math.max(1, ...cellLines.map(l=>l.length));
      const rowH = rowLines*12+8;
      ensureSpace(rowH);
      const topY = y;
      if(b.header && ri===0) curPage().push(`q 0.92 0.92 0.92 rg ${PDF_MARGIN+indent} ${(topY-rowH+4).toFixed(2)} ${tableW} ${rowH} re f Q`);
      for(let ci=0; ci<cols; ci++){
        let cy = topY-10;
        for(const line of (cellLines[ci]||[[]])){
          let x = PDF_MARGIN+indent+ci*colW+5;
          const spW = measureWidth(' ',10,{});
          const parts = ['BT']; let curFont = null;
          for(const w of line){
            const fk = fontKeyFor(w);
            if(fk!==curFont){ parts.push(`/${fk} 10 Tf`); curFont = fk; }
            parts.push(`1 0 0 1 ${x.toFixed(2)} ${cy.toFixed(2)} Tm (${pdfEscape(w.text)}) Tj`);
            x += measureWidth(w.text,10,w)+spW;
          }
          parts.push('ET');
          curPage().push(parts.join(' '));
          cy -= 12;
        }
      }
      curPage().push(`${PDF_MARGIN+indent} ${(topY-rowH+4).toFixed(2)} ${tableW} ${rowH} re S`);
      for(let ci=1; ci<cols; ci++){
        const x = PDF_MARGIN+indent+ci*colW;
        curPage().push(`${x.toFixed(2)} ${(topY-rowH+4).toFixed(2)} m ${x.toFixed(2)} ${topY.toFixed(2)} l S`);
      }
      y = topY-rowH;
    }
    y -= 6;
  }
  function drawImage(b, indent){
    const info = b.src ? decodeDataUri(b.src) : null;
    if(!info || info.mime!=='image/jpeg'){
      drawWrappedRuns([{text:'['+(b.alt||'gambar tidak tersedia untuk PDF')+']', bold:false, italic:true, code:false}], 10, indent);
      return;
    }
    let idx = usedImages.findIndex(u=>u.src===b.src);
    if(idx<0){ idx = usedImages.length; usedImages.push({src:b.src, bytes:info.bytes, width:info.width, height:info.height}); }
    const maxW = PDF_CONTENT_W-indent;
    let w = info.width, h = info.height;
    if(w>maxW){ h = h*maxW/w; w = maxW; }
    ensureSpace(h+8);
    y -= h;
    curPage().push(`q ${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${(PDF_MARGIN+indent).toFixed(2)} ${y.toFixed(2)} cm /Im${idx} Do Q`);
    y -= 8;
  }

  drawBlocks(blocks, 0);
  return {pages, usedImages};
}
function modelToPdf(blocks, paperSize){
  setPdfPageSize(paperSize || PAPER_SIZES.a4);
  const {pages, usedImages} = makePdfLayout(blocks);
  const objs = [];
  let n = 1;
  const alloc = () => n++;
  const catalogNum = alloc();
  const pagesNum = alloc();
  const fontKeys = ['F1','F2','F3','F4','F5'];
  const fontNums = {}; fontKeys.forEach(k=>fontNums[k]=alloc());
  const imageNums = usedImages.map(()=>alloc());
  const pageNums = pages.map(()=>alloc());
  const contentNums = pages.map(()=>alloc());

  const pushObj = (num, str) => objs.push({num, bytes: TENC.encode(str)});
  const pushStreamObj = (num, dictStr, bytes) => {
    objs.push({num, bytes: concatBytes([TENC.encode(`${num} 0 obj\n${dictStr}\nstream\n`), bytes, TENC.encode(`\nendstream\nendobj\n`)])});
  };

  pushObj(catalogNum, `${catalogNum} 0 obj\n<< /Type /Catalog /Pages ${pagesNum} 0 R >>\nendobj\n`);
  pushObj(pagesNum, `${pagesNum} 0 obj\n<< /Type /Pages /Kids [${pageNums.map(x=>x+' 0 R').join(' ')}] /Count ${pages.length} >>\nendobj\n`);

  const FONT_BASE = {F1:'Helvetica', F2:'Helvetica-Bold', F3:'Helvetica-Oblique', F4:'Helvetica-BoldOblique', F5:'Courier'};
  for(const k of fontKeys){
    const num = fontNums[k];
    pushObj(num, `${num} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /${FONT_BASE[k]} /Encoding /WinAnsiEncoding >>\nendobj\n`);
  }
  usedImages.forEach((info, i) => {
    const num = imageNums[i];
    const dict = `${num} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${info.width} /Height ${info.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${info.bytes.length} >>`;
    pushStreamObj(num, dict, info.bytes);
  });

  const resourceDict = `<< /Font << ${fontKeys.map(k=>'/'+k+' '+fontNums[k]+' 0 R').join(' ')} >>`+
    (usedImages.length ? ` /XObject << ${usedImages.map((_,i)=>'/Im'+i+' '+imageNums[i]+' 0 R').join(' ')} >>` : '')+` >>`;

  pages.forEach((ops, i) => {
    const pageNum = pageNums[i], contentNum = contentNums[i];
    pushObj(pageNum, `${pageNum} 0 obj\n<< /Type /Page /Parent ${pagesNum} 0 R /MediaBox [0 0 ${PDF_PAGE_W} ${PDF_PAGE_H}] /Resources ${resourceDict} /Contents ${contentNum} 0 R >>\nendobj\n`);
    const streamBytes = latin1Encode(ops.join('\n'));
    pushStreamObj(contentNum, `${contentNum} 0 obj\n<< /Length ${streamBytes.length} >>`, streamBytes);
  });

  objs.sort((a,b)=>a.num-b.num);
  const header = TENC.encode('%PDF-1.4\n');
  const chunks = [header];
  const offsets = new Array(n);
  let pos = header.length;
  for(const o of objs){ offsets[o.num]=pos; chunks.push(o.bytes); pos += o.bytes.length; }
  const xrefStart = pos;
  let xref = `xref\n0 ${n}\n0000000000 65535 f \n`;
  for(let i=1;i<n;i++) xref += String(offsets[i]).padStart(10,'0')+' 00000 n \n';
  const trailer = `trailer\n<< /Size ${n} /Root ${catalogNum} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  chunks.push(TENC.encode(xref+trailer));
  return concatBytes(chunks);
}

/* ============================== PDF — pembaca teks (best-effort) ==============================
   Ini BUKAN mesin PDF lengkap: hanya menyapu operator penunjuk teks (Tj/TJ) di
   content stream tiap halaman, mengurutkan berdasarkan nomor objek halaman.
   Bekerja baik untuk PDF "berbasis teks" biasa (termasuk yang dihasilkan aplikasi
   ini sendiri). TIDAK bisa: PDF hasil pindai/gambar (tanpa teks asli), font custom
   ter-embed dengan encoding non-standar, atau tata letak multi-kolom kompleks. */
async function zlibInflate(bytes){
  const ds = new DecompressionStream('deflate');
  const w = ds.writable.getWriter(); w.write(bytes); w.close();
  const chunks = []; const r = ds.readable.getReader();
  while(true){ const {done,value} = await r.read(); if(done) break; chunks.push(value); }
  return concatBytes(chunks);
}
function pdfLatin1Decode(bytes){
  let s=''; const CH=32768;
  for(let i=0;i<bytes.length;i+=CH) s += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i+CH,bytes.length)));
  return s;
}
function strToLatin1Bytes(s){ const b=new Uint8Array(s.length); for(let i=0;i<s.length;i++) b[i]=s.charCodeAt(i)&0xFF; return b; }
function pdfUnescapeString(s){
  let out='';
  for(let i=0;i<s.length;i++){
    if(s[i]==='\\'){
      const c = s[i+1];
      if(c==='n'){ out+='\n'; i++; } else if(c==='r'){ out+='\r'; i++; } else if(c==='t'){ out+='\t'; i++; }
      else if(c==='('||c===')'||c==='\\'){ out+=c; i++; }
      else if(c>='0'&&c<='7'){ let oct=c, j=i+2, k=0; while(k<2 && s[j]>='0'&&s[j]<='7'){ oct+=s[j]; j++; k++; } out+=String.fromCharCode(parseInt(oct,8)&0xFF); i=j-1; }
      else if(c==='\n'){ i++; } else { out+=c; i++; }
    } else out+=s[i];
  }
  return out;
}
function tokenizePdfContentStream(s){
  const tokens = []; let i=0; const n=s.length;
  while(i<n){
    const c = s[i];
    if(/\s/.test(c)){ i++; continue; }
    if(c==='%'){ while(i<n && s[i]!=='\n') i++; continue; }
    if(c==='('){
      let depth=1, j=i+1, buf='';
      while(j<n && depth>0){
        if(s[j]==='\\'){ buf+=s[j]+(s[j+1]||''); j+=2; continue; }
        if(s[j]==='(') depth++;
        if(s[j]===')'){ depth--; if(depth===0){ j++; break; } }
        buf+=s[j]; j++;
      }
      tokens.push({type:'str', value:buf}); i=j; continue;
    }
    if(c==='['){
      let depth=1, j=i+1, buf='[';
      while(j<n && depth>0){ if(s[j]==='[') depth++; if(s[j]===']') depth--; buf+=s[j]; j++; }
      tokens.push({type:'arr', value:buf}); i=j; continue;
    }
    if(c==='<' && s[i+1]==='<'){
      let depth=1, j=i+2;
      while(j<n && depth>0){ if(s[j]==='<'&&s[j+1]==='<'){depth++;j+=2;continue;} if(s[j]==='>'&&s[j+1]==='>'){depth--;j+=2;continue;} j++; }
      tokens.push({type:'dict'}); i=j; continue;
    }
    if(c==='<'){
      let j=i+1; while(j<n && s[j]!=='>') j++;
      tokens.push({type:'hexstr', value:s.slice(i+1,j).replace(/[^0-9A-Fa-f]/g,'')}); i=j+1; continue;
    }
    if(c==='/'){ let j=i+1; while(j<n && !/[\s\/\[\]()<>%]/.test(s[j])) j++; tokens.push({type:'name', value:s.slice(i+1,j)}); i=j; continue; }
    if(/[-\d.]/.test(c)){ let j=i+1; while(j<n && /[-\d.]/.test(s[j])) j++; tokens.push({type:'num', value:parseFloat(s.slice(i,j))}); i=j; continue; }
    { let j=i+1; while(j<n && !/[\s\/\[\]()<>%]/.test(s[j])) j++; tokens.push({type:'op', value:s.slice(i,j)}); i=j; continue; }
  }
  return tokens;
}
/* Font ter-embed (subset) umumnya memakai encoding Identity-H: teks di content
   stream berupa hex-string berisi indeks glyph, bukan kode karakter biasa.
   Peta baliknya ke Unicode ada di stream /ToUnicode milik font tsb (format CMap
   sederhana bfchar/bfrange). Tanpa ini, PDF "normal" (bukan hasil scan) yang
   memakai font ter-embed — sangat umum dari Word/Chrome/LibreOffice — akan
   gagal total diekstrak teksnya. */
function hexToUtf16Str(hex){
  if(hex.length%2!==0) hex='0'+hex;
  let out='';
  for(let i=0;i<hex.length;i+=4){
    const unit = hex.slice(i,i+4);
    if(unit.length===4) out += String.fromCharCode(parseInt(unit,16));
    else if(unit.length===2) out += String.fromCharCode(parseInt(unit,16));
  }
  return out;
}
function parseToUnicodeCMap(cmapText){
  const map = new Map();
  for(const m of cmapText.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)){
    for(const p of m[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) map.set(parseInt(p[1],16), hexToUtf16Str(p[2]));
  }
  for(const m of cmapText.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)){
    const body = m[1];
    for(const p of body.matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)){
      const lo=parseInt(p[1],16), hi=parseInt(p[2],16), base=parseInt(p[3],16);
      for(let c=lo;c<=hi && c-lo<65536;c++) map.set(c, String.fromCodePoint(base+(c-lo)));
    }
    for(const p of body.matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*\[([^\]]*)\]/g)){
      const lo=parseInt(p[1],16);
      const dsts = Array.from(p[3].matchAll(/<([0-9A-Fa-f]+)>/g)).map(d=>d[1]);
      dsts.forEach((d,i) => map.set(lo+i, hexToUtf16Str(d)));
    }
  }
  return map;
}
function resolveFontRefs(dictStr){
  const map = {};
  for(const m of dictStr.matchAll(/\/(\S+)\s+(\d+)\s+0\s+R/g)) map[m[1]] = +m[2];
  return map;
}
async function buildFontToUnicodeMaps(objs){
  const result = {};
  for(const [,o] of objs){
    for(const m of o.dict.matchAll(/\/Font\s*<<([\s\S]*?)>>/g)){
      const refs = resolveFontRefs(m[1]);
      for(const name in refs){
        const fontObj = objs.get(refs[name]);
        if(!fontObj) continue;
        const tuM = fontObj.dict.match(/\/ToUnicode\s+(\d+)\s+0\s+R/);
        if(!tuM) continue;
        const cmapObj = objs.get(+tuM[1]);
        if(!cmapObj || cmapObj.streamRaw==null) continue;
        let raw = strToLatin1Bytes(cmapObj.streamRaw);
        if(/\/Filter\s*\/FlateDecode/.test(cmapObj.dict) || /\/Filter\s*\[[^\]]*\/FlateDecode/.test(cmapObj.dict)){
          try{ raw = await zlibInflate(raw); }catch(e){ continue; }
        }
        result[name] = parseToUnicodeCMap(pdfLatin1Decode(raw));
      }
    }
  }
  return result;
}
function decodeShowToken(tok, curFontMap){
  if(tok.type==='str') return pdfUnescapeString(tok.value);
  if(tok.type==='hexstr'){
    const hex = tok.value;
    if(curFontMap){
      let out=''; for(let i=0;i<hex.length;i+=4){ const code=parseInt(hex.slice(i,i+4)||hex.slice(i,i+2),16); const ch=curFontMap.get(code); if(ch!=null) out+=ch; } return out;
    }
    let out=''; for(let i=0;i+1<hex.length;i+=2) out += String.fromCharCode(parseInt(hex.slice(i,i+2),16)); return out;
  }
  return '';
}
function extractParagraphsFromContentStream(s, fontMaps, imageRefs){
  fontMaps = fontMaps || {}; imageRefs = imageRefs || {};
  const tokens = tokenizePdfContentStream(s);
  const items = []; let cur='', curMaxSize=0;
  let lastX=null, lastY=null, lastSize=11, curFontMap=null;
  const flush = () => { if(cur.trim()) items.push({kind:'text', text:cur.trim(), size:curMaxSize||lastSize}); cur=''; curMaxSize=0; };
  const addText = t => { cur += t; curMaxSize = Math.max(curMaxSize, lastSize); };
  // Banyak PDF (terutama dari aplikasi desain/typesetting) menaruh SETIAP karakter atau
  // suku kata di posisi (Tm/Td) sendiri-sendiri untuk kerning presisi — bukan satu Tj per
  // kata. Kalau kita naif menyisipkan spasi di SETIAP perpindahan posisi, hasilnya jadi
  // "V a r i a n" (terlalu terpecah). Sebaliknya kalau tidak pernah menyisipkan spasi sama
  // sekali, sel-sel tabel dalam satu baris (X beda jauh, Y sama) malah nempel jadi satu
  // ("Full Colorbignet..."). Solusinya: lihat BESAR perpindahannya, bukan sekadar ada/tidak.
  const onMove = (dx, dy) => {
    if(Math.abs(dy) > lastSize*1.4){ flush(); return; }
    if(Math.abs(dy) > lastSize*0.4 || Math.abs(dx) > lastSize*0.9){ if(cur && !/\s$/.test(cur)) cur+=' '; }
  };
  const stack = [];
  for(const t of tokens){
    if(t.type!=='op'){ stack.push(t); continue; }
    const op = t.value;
    if(op==='Do'){
      const nameTok = stack[stack.length-1];
      if(nameTok && nameTok.type==='name' && imageRefs[nameTok.value]){
        flush();
        items.push({kind:'image', obj: imageRefs[nameTok.value]});
      }
      stack.length=0; continue;
    }
    if(op==='Tf'){
      const size=stack[stack.length-1], fname=stack[stack.length-2];
      if(size&&size.type==='num') lastSize=size.value;
      curFontMap = (fname && fname.type==='name' && fontMaps[fname.value]) || null;
      stack.length=0; continue;
    }
    if(op==='Td' || op==='TD'){
      const dyTok = stack[stack.length-1], dxTok = stack[stack.length-2];
      if(dyTok && dyTok.type==='num'){
        const dx = (dxTok&&dxTok.type==='num') ? dxTok.value : 0;
        onMove(dx, dyTok.value);
        lastX = (lastX==null?0:lastX) + dx;
        lastY = (lastY==null?0:lastY) + dyTok.value;
      }
      stack.length=0; continue;
    }
    if(op==='Tm'){
      const y = stack[stack.length-1], x = stack[stack.length-2];
      if(y && y.type==='num' && x && x.type==='num'){
        onMove(lastX==null?0:x.value-lastX, lastY==null?0:y.value-lastY);
        lastX = x.value; lastY = y.value;
      }
      stack.length=0; continue;
    }
    if(op==='T*'){ flush(); stack.length=0; continue; }
    if(op==='Tj'){ const s2=stack[stack.length-1]; if(s2) addText(decodeShowToken(s2,curFontMap)); stack.length=0; continue; }
    if(op==="'" || op==='"'){ flush(); const s2=stack[stack.length-1]; if(s2) addText(decodeShowToken(s2,curFontMap)); stack.length=0; continue; }
    if(op==='TJ'){
      const arrTok = stack[stack.length-1];
      if(arrTok && arrTok.type==='arr'){
        const inner = tokenizePdfContentStream(arrTok.value.slice(1,-1));
        for(const it of inner) if(it.type==='str'||it.type==='hexstr') addText(decodeShowToken(it,curFontMap));
      }
      stack.length=0; continue;
    }
    if(op==='BT' || op==='ET'){ stack.length=0; continue; }
    stack.length = 0;
  }
  flush();
  return items;
}
function findPdfObjects(latin1Str){
  const objs = new Map();
  const re = /(\d+)\s+\d+\s+obj([\s\S]*?)endobj/g;
  let m;
  while((m = re.exec(latin1Str))){
    const num = +m[1]; const body = m[2];
    const streamIdx = body.indexOf('stream');
    if(streamIdx>=0){
      let dataStart = streamIdx+6;
      if(body[dataStart]==='\r') dataStart++;
      if(body[dataStart]==='\n') dataStart++;
      const dict = body.slice(0,streamIdx);
      // pakai /Length langsung (angka) kalau ada — lebih presisi daripada mencari teks
      // "endstream", yang kalau tak dikoreksi ikut menyertakan EOL sebelumnya (merusak
      // stream biner seperti gambar; untuk stream teks efeknya tak kelihatan makanya lolos).
      const lenM = dict.match(/\/Length\s+(\d+)(?!\s+\d+\s+R)/);
      let streamRaw;
      if(lenM){
        streamRaw = body.slice(dataStart, dataStart+ +lenM[1]);
      } else {
        let endIdx = body.lastIndexOf('endstream');
        if(endIdx>=0){
          if(body[endIdx-1]==='\n'){ endIdx--; if(body[endIdx-1]==='\r') endIdx--; }
          streamRaw = body.slice(dataStart, endIdx);
        } else streamRaw = null;
      }
      objs.set(num, {dict, streamRaw});
    } else {
      objs.set(num, {dict: body, streamRaw: null});
    }
  }
  return objs;
}
/* PDF 1.5+ sering membungkus banyak objek (termasuk objek halaman) di dalam
   Object Stream terkompresi (/Type /ObjStm) untuk memperkecil ukuran file —
   objek-objek itu tidak muncul sebagai teks "N G obj...endobj" biasa sama
   sekali, jadi harus dibongkar terpisah lewat header N-pasang (objNum,offset)
   yang ada di awal stream setelah didekompresi. */
async function expandObjectStreams(objs){
  const objStmNums = [];
  for(const [num, o] of objs) if(/\/Type\s*\/ObjStm/.test(o.dict)) objStmNums.push(num);
  for(const num of objStmNums){
    const o = objs.get(num);
    if(o.streamRaw==null) continue;
    let raw = strToLatin1Bytes(o.streamRaw);
    if(/\/Filter\s*\/FlateDecode/.test(o.dict) || /\/Filter\s*\[[^\]]*\/FlateDecode/.test(o.dict)){
      try{ raw = await zlibInflate(raw); }catch(e){ continue; }
    }
    const text = pdfLatin1Decode(raw);
    const nM = o.dict.match(/\/N\s+(\d+)/), firstM = o.dict.match(/\/First\s+(\d+)/);
    if(!nM || !firstM) continue;
    const n = +nM[1], first = +firstM[1];
    const header = text.slice(0, first).trim().split(/\s+/).map(Number);
    for(let i=0;i<n;i++){
      const objNum = header[i*2], offset = header[i*2+1];
      if(objNum==null || offset==null) continue;
      const end = (i+1<n) ? first+header[(i+1)*2+1] : text.length;
      const dict = text.slice(first+offset, end);
      if(!objs.has(objNum)) objs.set(objNum, {dict, streamRaw:null});
    }
  }
}
async function parsePdfStructure(bytes){
  const s = pdfLatin1Decode(bytes);
  if(!s.startsWith('%PDF')) throw new Error('Bukan file PDF yang valid.');
  const objs = findPdfObjects(s);
  await expandObjectStreams(objs);
  const pageNums = [];
  for(const [num, o] of objs) if(/\/Type\s*\/Page(?!s)/.test(o.dict)) pageNums.push(num);
  pageNums.sort((a,b)=>a-b);
  if(!pageNums.length) throw new Error('Tidak ditemukan halaman di dalam PDF (mungkin terenkripsi atau strukturnya non-standar).');
  return {objs, pageNums};
}
function pdfPageContentNums(pageObj){
  let contentNums = Array.from(pageObj.dict.matchAll(/\/Contents\s+(\d+)\s+0\s+R/g)).map(m=>+m[1]);
  if(!contentNums.length){
    const arrM = pageObj.dict.match(/\/Contents\s*\[([^\]]*)\]/);
    if(arrM) contentNums = Array.from(arrM[1].matchAll(/(\d+)\s+0\s+R/g)).map(m=>+m[1]);
  }
  return contentNums;
}
/* Gambar halaman penuh untuk PDF hasil pindai (dipakai jalur OCR) — mencari
   Image XObject yang dirujuk oleh /Resources milik halaman. */
function findPageImages(objs, pageObj){
  const out = [];
  const xobjM = pageObj.dict.match(/\/XObject\s*<<([\s\S]*?)>>/);
  if(!xobjM) return out;
  const refs = resolveFontRefs(xobjM[1]);
  for(const name in refs){
    const obj = objs.get(refs[name]);
    if(obj && /\/Subtype\s*\/Image/.test(obj.dict)) out.push(obj);
  }
  return out;
}
const UNSUPPORTED_IMAGE_FILTERS = {
  CCITTFaxDecode: 'CCITT Fax (umum untuk hasil pindai hitam-putih)',
  JBIG2Decode: 'JBIG2 (umum dipakai printer/scanner multifungsi modern)',
  JPXDecode: 'JPEG2000',
};
/* Palet warna untuk /ColorSpace [/Indexed base hival lookup] — lookup bisa berupa
   string literal langsung di dict, atau stream terpisah (objek lain). */
function resolveIndexedPalette(csArrStr, objs){
  const m = csArrStr.match(/\/Indexed\s*(?:\/(\w+)|\[([^\]]*)\])\s+(\d+)\s+(?:\(((?:[^()\\]|\\.)*)\)|(\d+)\s+0\s+R)/);
  if(!m) return null;
  const baseComp = /DeviceRGB/.test(csArrStr) ? 3 : (/DeviceCMYK/.test(csArrStr) ? 4 : (/DeviceGray/.test(csArrStr)?1:3));
  if(m[4]!=null) return {baseComp, table: strToLatin1Bytes(pdfUnescapeString(m[4]))};
  if(m[5]!=null){
    const lookupObj = objs.get(+m[5]);
    if(lookupObj && lookupObj.streamRaw!=null) return {baseComp, table: strToLatin1Bytes(lookupObj.streamRaw)};
  }
  return null;
}
function resolveColorSpace(dict, objs){
  const csRefM = dict.match(/\/ColorSpace\s+(\d+)\s+0\s+R/);
  let csStr = dict;
  if(csRefM){ const o = objs.get(+csRefM[1]); if(o) csStr = o.dict; }
  const nameM = csStr.match(/\/ColorSpace\s*\/(\w+)/);
  if(nameM) return {kind:'simple', name:nameM[1]};
  const arrM = csStr.match(/\/ColorSpace\s*\[([^\]]*(?:\([^)]*\)[^\]]*)*)\]/);
  if(arrM){
    if(/\/Indexed/.test(arrM[1])){
      const pal = resolveIndexedPalette(arrM[1], objs);
      if(pal) return {kind:'indexed', ...pal};
    }
    if(/\/ICCBased/.test(arrM[1])){
      const refM = arrM[1].match(/\/ICCBased\s+(\d+)\s+0\s+R/);
      const iccObj = refM && objs.get(+refM[1]);
      const nM = iccObj && iccObj.dict.match(/\/N\s+(\d+)/);
      const n = nM ? +nM[1] : 3;
      return {kind:'simple', name: n===1?'DeviceGray':(n===4?'DeviceCMYK':'DeviceRGB')};
    }
  }
  return {kind:'simple', name:'DeviceRGB'};
}
function pdfImageObjToDescriptor(obj, objs){
  if(obj.streamRaw==null) return null;
  const wM = obj.dict.match(/\/Width\s+(\d+)/), hM = obj.dict.match(/\/Height\s+(\d+)/);
  const width = wM?+wM[1]:0, height = hM?+hM[1]:0;
  if(!width || !height) return null;
  for(const filt in UNSUPPORTED_IMAGE_FILTERS){
    if(new RegExp('/'+filt).test(obj.dict)) return {kind:'unsupported', filter: filt, label: UNSUPPORTED_IMAGE_FILTERS[filt]};
  }
  if(/\/DCTDecode/.test(obj.dict)) return {kind:'jpeg', bytes: strToLatin1Bytes(obj.streamRaw), width, height};
  if(/\/FlateDecode/.test(obj.dict)){
    const bpcM = obj.dict.match(/\/BitsPerComponent\s+(\d+)/);
    const cs = resolveColorSpace(obj.dict, objs||new Map());
    return {kind:'raw', bytes: strToLatin1Bytes(obj.streamRaw), width, height, bpc: bpcM?+bpcM[1]:8,
      colorSpace: cs.kind==='simple' ? cs.name : 'Indexed', indexedPalette: cs.kind==='indexed'?cs:null, needsInflate:true};
  }
  return {kind:'unsupported', filter:'unknown', label:'format kompresi tidak dikenali'};
}
/* Gambar INLINE di tengah teks (bukan gambar penuh-halaman untuk OCR) — dipetakan
   per nama resource ("/Im0") supaya bisa dicocokkan dengan operator "Do" saat
   menyapu content stream, sehingga posisinya di antara paragraf tetap terjaga. */
function findPageImageRefs(objs, pageObj){
  const map = {};
  const xobjM = pageObj.dict.match(/\/XObject\s*<<([\s\S]*?)>>/);
  if(!xobjM) return map;
  const refs = resolveFontRefs(xobjM[1]);
  for(const name in refs){
    const obj = objs.get(refs[name]);
    if(obj && /\/Subtype\s*\/Image/.test(obj.dict)) map[name] = obj;
  }
  return map;
}

/* ---------- Encoder PNG minimal (murni, tanpa canvas) ----------
   Dipakai untuk gambar PDF berformat piksel-mentah (/FlateDecode) yang harus
   dikonversi jadi file gambar utuh agar bisa ditempel ke HTML/DOCX/PDF. */
async function deflateZlib(bytes){
  const cs = new CompressionStream('deflate'); // format zlib (RFC1950) — yang dipakai IDAT PNG
  const w = cs.writable.getWriter(); w.write(bytes); w.close();
  const chunks = []; const r = cs.readable.getReader();
  while(true){ const {done,value} = await r.read(); if(done) break; chunks.push(value); }
  return concatBytes(chunks);
}
function pngChunk(type, data){
  const body = concatBytes([TENC.encode(type), data]);
  const crc = crc32(body);
  const out = new Uint8Array(4+body.length+4);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length, false);
  out.set(body, 4);
  dv.setUint32(4+body.length, crc, false);
  return out;
}
async function rawPixelsToPngBytes(bytes, width, height, bpc, colorSpace, indexedPalette){
  if(indexedPalette ? ![1,2,4,8].includes(bpc) : (bpc!==8 && bpc!==1)) return null;
  const raw = new Uint8Array((width*3+1)*height);
  let ri=0;
  if(indexedPalette){
    const {baseComp, table} = indexedPalette;
    const rowBytesSrc = Math.ceil(width*bpc/8);
    for(let y=0;y<height;y++){
      raw[ri++]=0;
      for(let x=0;x<width;x++){
        let idx;
        if(bpc===8) idx = bytes[y*rowBytesSrc+x];
        else {
          const perByte = 8/bpc, byteVal = bytes[y*rowBytesSrc + Math.floor(x/perByte)];
          const shift = 8 - bpc*((x%perByte)+1);
          idx = (byteVal >> shift) & ((1<<bpc)-1);
        }
        const p = idx*baseComp;
        let r,g,b;
        if(baseComp===1){ r=g=b=table[p]??0; }
        else if(baseComp===4){ const k=(table[p+3]??0)/255; r=255*(1-(table[p]??0)/255)*(1-k); g=255*(1-(table[p+1]??0)/255)*(1-k); b=255*(1-(table[p+2]??0)/255)*(1-k); }
        else { r=table[p]??0; g=table[p+1]??0; b=table[p+2]??0; }
        raw[ri++]=r; raw[ri++]=g; raw[ri++]=b;
      }
    }
  } else if(bpc===8){
    const nComp = colorSpace==='DeviceGray' ? 1 : (colorSpace==='DeviceCMYK' ? 4 : 3);
    let p=0;
    for(let y=0;y<height;y++){
      raw[ri++]=0;
      for(let x=0;x<width;x++,p+=nComp){
        let r,g,b;
        if(nComp===1){ r=g=b=bytes[p]; }
        else if(nComp===4){ const k=bytes[p+3]/255; r=255*(1-bytes[p]/255)*(1-k); g=255*(1-bytes[p+1]/255)*(1-k); b=255*(1-bytes[p+2]/255)*(1-k); }
        else { r=bytes[p]; g=bytes[p+1]; b=bytes[p+2]; }
        raw[ri++]=r; raw[ri++]=g; raw[ri++]=b;
      }
    }
  } else {
    const rowBytesSrc = Math.ceil(width/8);
    for(let y=0;y<height;y++){
      raw[ri++]=0;
      for(let x=0;x<width;x++){
        const byte = bytes[y*rowBytesSrc+(x>>3)]; const bit=(byte>>(7-(x&7)))&1;
        const v = bit?255:0; raw[ri++]=v; raw[ri++]=v; raw[ri++]=v;
      }
    }
  }
  const idatRaw = await deflateZlib(raw);
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0,width,false); dv.setUint32(4,height,false);
  ihdr[8]=8; ihdr[9]=2; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0; // 8-bit, color type 2 = RGB truecolor
  const sig = new Uint8Array([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]);
  return concatBytes([sig, pngChunk('IHDR',ihdr), pngChunk('IDAT',idatRaw), pngChunk('IEND',new Uint8Array(0))]);
}
function bytesToBase64(bytes){
  let bin=''; const CH=32768;
  for(let i=0;i<bytes.length;i+=CH) bin += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i+CH,bytes.length)));
  return btoa(bin);
}
async function descriptorToImageBlock(desc, alt){
  if(!desc) return {type:'p', runs:[run('['+(alt||'gambar tidak didukung')+']')]};
  if(desc.kind==='unsupported') return {type:'p', runs:[run('[gambar memakai kompresi '+desc.label+' — belum didukung]', {italic:true})]};
  if(desc.kind==='jpeg') return {type:'image', src:'data:image/jpeg;base64,'+bytesToBase64(desc.bytes), alt: alt||''};
  if(desc.kind==='raw'){
    let bytes = desc.bytes;
    if(desc.needsInflate){ try{ bytes = await zlibInflate(bytes); }catch(e){ return {type:'p', runs:[run('['+(alt||'gambar gagal dibaca')+']')]}; } }
    const png = await rawPixelsToPngBytes(bytes, desc.width, desc.height, desc.bpc, desc.colorSpace, desc.indexedPalette);
    if(!png) return {type:'p', runs:[run('['+(alt||'gambar tidak didukung (bit depth)')+']')]};
    return {type:'image', src:'data:image/png;base64,'+bytesToBase64(png), alt: alt||''};
  }
  return {type:'p', runs:[run('['+(alt||'gambar tidak didukung (format kompresi)')+']')]};
}

async function pdfToModel(bytes){
  const {objs, pageNums} = await parsePdfStructure(bytes);
  const fontMaps = await buildFontToUnicodeMaps(objs);

  const allItems = [];
  for(const pnum of pageNums){
    const pageObj = objs.get(pnum);
    const imageRefs = findPageImageRefs(objs, pageObj);
    for(const cnum of pdfPageContentNums(pageObj)){
      const cobj = objs.get(cnum);
      if(!cobj || cobj.streamRaw==null) continue;
      let raw = strToLatin1Bytes(cobj.streamRaw);
      if(/\/Filter\s*\/FlateDecode/.test(cobj.dict) || /\/Filter\s*\[[^\]]*\/FlateDecode/.test(cobj.dict)){
        try{ raw = await zlibInflate(raw); }catch(e){ continue; }
      }
      allItems.push(...extractParagraphsFromContentStream(pdfLatin1Decode(raw), fontMaps, imageRefs));
    }
  }
  const textItems = allItems.filter(i => i.kind==='text');
  if(!textItems.length){
    const err = new Error('Tidak ada teks yang bisa diekstrak dari lapisan teks PDF ini — kemungkinan hasil pindai/gambar tanpa teks asli.');
    err.noText = true;
    throw err;
  }
  const sizes = textItems.map(p=>p.size).slice().sort((a,b)=>a-b);
  const bodySize = sizes[Math.floor(sizes.length/2)] || 11;
  const blocks = [];
  for(const item of allItems){
    if(item.kind==='text'){
      if(item.size > bodySize*1.8) blocks.push({type:'h', level:1, runs:[run(item.text)]});
      else if(item.size > bodySize*1.25) blocks.push({type:'h', level:2, runs:[run(item.text)]});
      else blocks.push({type:'p', runs:[run(item.text)]});
    } else if(item.kind==='image'){
      blocks.push(await descriptorToImageBlock(pdfImageObjToDescriptor(item.obj, objs)));
    }
  }
  return blocks;
}

/* ============================== DOCX (OOXML) — writer ============================== */
const RELTYPE = {
  hyperlink: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink',
  image: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image',
};
function makeDocxContext(){
  return { rels:[], media:[], nextRid:1,
    addRel(kind, target, external){ const id='rId'+(this.nextRid++); this.rels.push({id,kind,target,external:!!external}); return id; } };
}
function runsToDocxRuns(runs, ctx){
  const xml = runs.map(r => {
    const rPr = [];
    if(r.bold) rPr.push('<w:b/>');
    if(r.italic) rPr.push('<w:i/>');
    if(r.code) rPr.push('<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:shd w:val="clear" w:fill="F0F0F0"/>');
    if(r.link) rPr.push('<w:color w:val="0563C1"/><w:u w:val="single"/>');
    const rPrXml = rPr.length ? '<w:rPr>'+rPr.join('')+'</w:rPr>' : '';
    const runXml = '<w:r>'+rPrXml+'<w:t xml:space="preserve">'+escapeXml(r.text)+'</w:t></w:r>';
    if(r.link){ const rid = ctx.addRel('hyperlink', r.link, true); return '<w:hyperlink r:id="'+rid+'">'+runXml+'</w:hyperlink>'; }
    return runXml;
  }).join('');
  return xml || '<w:r><w:t></w:t></w:r>';
}
function imageBlockToDocxXml(b, ctx){
  const info = b.src ? decodeDataUri(b.src) : null;
  if(!info) return '<w:p><w:r><w:i><w:t xml:space="preserve">['+escapeXml(b.alt||'gambar tidak tersedia (bukan data-URI)')+']</w:t></w:i></w:r></w:p>';
  const ext = info.mime==='image/jpeg'?'jpg':(info.mime==='image/gif'?'gif':(info.mime==='image/webp'?'png':'png'));
  const idx = ctx.media.length+1;
  const name = 'image'+idx+'.'+ext;
  ctx.media.push({name, bytes: info.bytes});
  const rid = ctx.addRel('image', 'media/'+name, false);
  const maxW = 560;
  let w = info.width, h = info.height;
  if(w>maxW){ h = Math.round(h*maxW/w); w = maxW; }
  const cx = w*9525, cy = h*9525;
  return '<w:p><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">'+
    '<wp:extent cx="'+cx+'" cy="'+cy+'"/><wp:docPr id="'+idx+'" name="'+escapeXml(name)+'"/>'+
    '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">'+
    '<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">'+
    '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">'+
    '<pic:nvPicPr><pic:cNvPr id="0" name="'+escapeXml(name)+'"/><pic:cNvPicPr/></pic:nvPicPr>'+
    '<pic:blipFill><a:blip r:embed="'+rid+'"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>'+
    '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="'+cx+'" cy="'+cy+'"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>'+
    '</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>';
}
function listToDocxXml(b, ctx, depth){
  depth = depth||0;
  const numId = b.ordered ? 2 : 1;
  const parts = [];
  for(const item of b.items){
    const [first, ...rest] = item;
    parts.push('<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="'+Math.min(depth,3)+'"/><w:numId w:val="'+numId+'"/></w:numPr></w:pPr>'+
      runsToDocxRuns(first?first.runs:[], ctx)+'</w:p>');
    for(const sub of rest){
      if(sub.type==='list') parts.push(listToDocxXml(sub, ctx, depth+1));
      else parts.push(blockToDocxXml(sub, ctx));
    }
  }
  return parts.join('');
}
function tableToDocxXml(b, ctx){
  const cols = b.rows[0] ? b.rows[0].length : 1;
  const gridCols = Array(cols).fill('<w:gridCol/>').join('');
  const rowsXml = b.rows.map((row,ri) => {
    const cellsXml = row.map(cell => {
      const shd = (b.header && ri===0) ? '<w:shd w:val="clear" w:fill="EFEFEF"/>' : '';
      const content = blocksToDocxXml(cell, ctx) || '<w:p/>';
      return '<w:tc><w:tcPr>'+shd+'</w:tcPr>'+content+'</w:tc>';
    });
    return '<w:tr>'+cellsXml.join('')+'</w:tr>';
  });
  return '<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders>'+
    '<w:top w:val="single" w:sz="4" w:color="999999"/><w:left w:val="single" w:sz="4" w:color="999999"/>'+
    '<w:bottom w:val="single" w:sz="4" w:color="999999"/><w:right w:val="single" w:sz="4" w:color="999999"/>'+
    '<w:insideH w:val="single" w:sz="4" w:color="999999"/><w:insideV w:val="single" w:sz="4" w:color="999999"/></w:tblBorders></w:tblPr>'+
    '<w:tblGrid>'+gridCols+'</w:tblGrid>'+rowsXml.join('')+'</w:tbl>';
}
function blockToDocxXml(b, ctx){
  switch(b.type){
    case 'h': return '<w:p><w:pPr><w:pStyle w:val="Heading'+b.level+'"/></w:pPr>'+runsToDocxRuns(b.runs,ctx)+'</w:p>';
    case 'p': return '<w:p>'+runsToDocxRuns(b.runs,ctx)+'</w:p>';
    case 'hr': return '<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="999999"/></w:pBdr></w:pPr></w:p>';
    case 'quote': return '<w:p><w:pPr><w:pStyle w:val="Quote"/><w:ind w:left="720"/></w:pPr></w:p>'+blocksToDocxXml(b.blocks, ctx);
    case 'code': return b.text.split('\n').map(line =>
      '<w:p><w:pPr><w:shd w:val="clear" w:fill="F5F5F5"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/></w:rPr>'+
      '<w:t xml:space="preserve">'+escapeXml(line)+'</w:t></w:r></w:p>').join('');
    case 'image': return imageBlockToDocxXml(b, ctx);
    case 'list': return listToDocxXml(b, ctx, 0);
    case 'table': return tableToDocxXml(b, ctx);
    default: return '';
  }
}
function blocksToDocxXml(blocks, ctx){ return blocks.map(b => blockToDocxXml(b, ctx)).join(''); }

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
${['•','o','▪','•'].map((ch,i)=>`<w:lvl w:ilvl="${i}"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="${ch}"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="${720+i*360}" w:hanging="360"/></w:pPr><w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/></w:rPr></w:lvl>`).join('\n')}
</w:abstractNum>
<w:abstractNum w:abstractNumId="1">
${['decimal','lowerLetter','lowerRoman','decimal'].map((fmt,i)=>`<w:lvl w:ilvl="${i}"><w:start w:val="1"/><w:numFmt w:val="${fmt}"/><w:lvlText w:val="%${i+1}."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="${720+i*360}" w:hanging="360"/></w:pPr></w:lvl>`).join('\n')}
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

function docxCoreXml(title){
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:title>${escapeXml(title||'Dokumen')}</dc:title>
</cp:coreProperties>`;
}

async function modelToDocx(blocks, title){
  const ctx = makeDocxContext();
  const bodyXml = blocksToDocxXml(blocks, ctx);
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
<w:body>${bodyXml}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1417" w:right="1417" w:bottom="1417" w:left="1417"/></w:sectPr></w:body>
</w:document>`;
  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${
  ctx.rels.map(r => `<Relationship Id="${r.id}" Type="${RELTYPE[r.kind]}" Target="${escapeXml(r.target)}"${r.external?' TargetMode="External"':''}/>`).join('')
}</Relationships>`;

  const entries = [
    {name:'[Content_Types].xml', data: TENC.encode(DOCX_CONTENT_TYPES_XML)},
    {name:'_rels/.rels', data: TENC.encode(DOCX_ROOT_RELS_XML)},
    {name:'docProps/core.xml', data: TENC.encode(docxCoreXml(title))},
    {name:'docProps/app.xml', data: TENC.encode(DOCX_APP_XML)},
    {name:'word/document.xml', data: TENC.encode(documentXml)},
    {name:'word/styles.xml', data: TENC.encode(DOCX_STYLES_XML)},
    {name:'word/numbering.xml', data: TENC.encode(DOCX_NUMBERING_XML)},
    {name:'word/_rels/document.xml.rels', data: TENC.encode(relsXml)},
  ];
  for(const m of ctx.media) entries.push({name:'word/media/'+m.name, data:m.bytes});
  return zipWrite(entries);
}

/* ============================== DOCX — reader ============================== */
function descendantsByLocalName(node, name){
  const out = [];
  (function walk(n){
    for(const c of Array.from(n.childNodes)){
      if(c.nodeType===1){ if(c.localName===name) out.push(c); walk(c); }
    }
  })(node);
  return out;
}
function docxRunsFromNode(pNode){
  const runs = [];
  const list = descendantsByLocalName(pNode, 'r');
  for(const r of list){
    const rPr = Array.from(r.childNodes).find(n=>n.localName==='rPr');
    const bold = !!(rPr && Array.from(rPr.childNodes).find(n=>n.localName==='b'));
    const italic = !!(rPr && Array.from(rPr.childNodes).find(n=>n.localName==='i'));
    let text = '';
    for(const t of Array.from(r.childNodes)){
      if(t.localName==='t') text += t.textContent;
      else if(t.localName==='tab') text += '\t';
      else if(t.localName==='br') text += '\n';
    }
    if(text) runs.push(run(text, {bold, italic}));
  }
  return runs.length ? runs : [run('')];
}
function docxParagraphToBlock(p){
  const pPr = Array.from(p.childNodes).find(n=>n.localName==='pPr');
  const pStyle = pPr && Array.from(pPr.childNodes).find(n=>n.localName==='pStyle');
  const styleVal = pStyle ? pStyle.getAttribute('w:val') : '';
  const numPr = pPr && Array.from(pPr.childNodes).find(n=>n.localName==='numPr');
  const runs = docxRunsFromNode(p);
  const hm = /^Heading([1-6])$/.exec(styleVal||'');
  if(hm) return {type:'h', level:+hm[1], runs};
  if(numPr){
    const numId = Array.from(numPr.childNodes).find(n=>n.localName==='numId');
    return {type:'list', ordered: false, __numId: numId?numId.getAttribute('w:val'):null, items:[[{type:'p',runs}]]};
  }
  return {type:'p', runs};
}
function docxTableToBlock(tbl){
  const rows = Array.from(tbl.childNodes).filter(n=>n.localName==='tr').map(tr => {
    return Array.from(tr.childNodes).filter(n=>n.localName==='tc').map(tc => {
      const ps = Array.from(tc.childNodes).filter(n=>n.localName==='p');
      return ps.map(docxParagraphToBlock);
    });
  });
  return {type:'table', header:true, rows};
}
function mergeConsecutiveListBlocks(blocks){
  const out = [];
  for(const b of blocks){
    const last = out[out.length-1];
    if(b.type==='list' && last && last.type==='list' && last.ordered===b.ordered){
      last.items.push(...b.items);
    } else out.push(b);
  }
  return out;
}
function docxDocumentXmlToModel(xmlText){
  const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
  const body = doc.getElementsByTagName('w:body')[0] || doc.documentElement;
  const blocks = [];
  Array.from(body.childNodes).forEach(node => {
    if(node.localName==='p') blocks.push(docxParagraphToBlock(node));
    else if(node.localName==='tbl') blocks.push(docxTableToBlock(node));
  });
  return mergeConsecutiveListBlocks(blocks);
}
async function docxToModel(bytes){
  const files = await zipRead(bytes);
  const docXml = files.get('word/document.xml');
  if(!docXml) throw new Error('Bukan file .docx yang valid (word/document.xml tidak ditemukan).');
  return docxDocumentXmlToModel(TDEC.decode(docXml));
}

/* ============================== XLSX — writer ============================== */
function colLetter(n){ // n: 0-based index kolom
  let s = '', k = n+1;
  while(k>0){ const r=(k-1)%26; s=String.fromCharCode(65+r)+s; k=Math.floor((k-1)/26); }
  return s;
}
function colLetterToIndex(letters){
  let n=0; for(const ch of letters) n = n*26 + (ch.charCodeAt(0)-64);
  return n-1;
}
function xlsxCellXml(value, colIdx, rowIdx){
  const ref = colLetter(colIdx)+(rowIdx+1);
  if(value==null || value==='') return `<c r="${ref}"/>`;
  const s = String(value).trim();
  if(/^-?\d+(\.\d+)?$/.test(s) && s!=='' && s!=='-'){
    return `<c r="${ref}"><v>${Number(s)}</v></c>`;
  }
  return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(String(value))}</t></is></c>`;
}
const XLSX_CONTENT_TYPES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;
const XLSX_ROOT_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;
const XLSX_WORKBOOK_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;
const XLSX_WORKBOOK_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`;
const XLSX_APP_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Image Studio Document Converter</Application></Properties>`;
function xlsxCoreXml(title){
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:title>${escapeXml(title||'Data')}</dc:title>
</cp:coreProperties>`;
}
async function tableToXlsx(headers, rows, title){
  const allRows = headers ? [headers, ...rows] : rows;
  const sheetRows = allRows.map((r,ri) => `<row r="${ri+1}">${r.map((v,ci)=>xlsxCellXml(v,ci,ri)).join('')}</row>`).join('');
  const maxCols = Math.max(1, ...allRows.map(r=>r.length));
  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<dimension ref="A1:${colLetter(maxCols-1)}${Math.max(1,allRows.length)}"/>
<sheetData>${sheetRows}</sheetData>
</worksheet>`;
  const entries = [
    {name:'[Content_Types].xml', data: TENC.encode(XLSX_CONTENT_TYPES_XML)},
    {name:'_rels/.rels', data: TENC.encode(XLSX_ROOT_RELS_XML)},
    {name:'docProps/core.xml', data: TENC.encode(xlsxCoreXml(title))},
    {name:'docProps/app.xml', data: TENC.encode(XLSX_APP_XML)},
    {name:'xl/workbook.xml', data: TENC.encode(XLSX_WORKBOOK_XML)},
    {name:'xl/_rels/workbook.xml.rels', data: TENC.encode(XLSX_WORKBOOK_RELS_XML)},
    {name:'xl/worksheets/sheet1.xml', data: TENC.encode(sheetXml)},
  ];
  return zipWrite(entries);
}

/* ============================== XLSX — reader ============================== */
async function xlsxToTable(bytes){
  const files = await zipRead(bytes);
  if(!files.has('xl/workbook.xml')) throw new Error('Bukan file .xlsx yang valid.');
  let sheetPath = 'xl/worksheets/sheet1.xml';
  const relsBytes = files.get('xl/_rels/workbook.xml.rels');
  if(relsBytes){
    const doc = new DOMParser().parseFromString(TDEC.decode(relsBytes), 'application/xml');
    const rel = Array.from(doc.getElementsByTagName('Relationship')).find(r => /worksheet/.test(r.getAttribute('Type')||''));
    if(rel) sheetPath = 'xl/'+rel.getAttribute('Target').replace(/^\.?\/?/,'');
  }
  const sheetBytes = files.get(sheetPath);
  if(!sheetBytes) throw new Error('Sheet pertama tidak ditemukan di dalam file .xlsx.');
  let shared = [];
  const sharedBytes = files.get('xl/sharedStrings.xml');
  if(sharedBytes){
    const sdoc = new DOMParser().parseFromString(TDEC.decode(sharedBytes), 'application/xml');
    shared = Array.from(sdoc.getElementsByTagName('si')).map(si => Array.from(si.getElementsByTagName('t')).map(t=>t.textContent).join(''));
  }
  const doc = new DOMParser().parseFromString(TDEC.decode(sheetBytes), 'application/xml');
  const rows = [];
  for(const rowEl of Array.from(doc.getElementsByTagName('row'))){
    const rowArr = [];
    for(const c of Array.from(rowEl.getElementsByTagName('c'))){
      const ref = c.getAttribute('r')||'';
      const colIdx = colLetterToIndex((ref.match(/^[A-Z]+/)||[''])[0]);
      const t = c.getAttribute('t');
      const vEl = c.getElementsByTagName('v')[0];
      const isEl = c.getElementsByTagName('is')[0];
      let v = '';
      if(t==='s' && vEl) v = shared[+vEl.textContent] ?? '';
      else if(t==='inlineStr' && isEl) v = Array.from(isEl.getElementsByTagName('t')).map(t=>t.textContent).join('');
      else if(vEl) v = vEl.textContent;
      if(colIdx>=0){ while(rowArr.length<colIdx) rowArr.push(''); rowArr[colIdx]=v; }
    }
    rows.push(rowArr);
  }
  return rows;
}
