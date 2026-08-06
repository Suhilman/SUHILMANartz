/* =====================================================================
   bytesUtil — low-level byte/string/ZIP/PNG helpers shared by the
   document-converter format modules (docModel, docxFormat, pdfFormat,
   tableFormats). Pure functions only: no DOM, no globals besides the
   standard Web APIs (TextEncoder/Decoder, atob/btoa, CompressionStream)
   that are available on the main thread in every modern browser.

   Ported 1:1 from the original vanilla-JS tool at
   image-studio/convert.js — logic kept intact, only reorganized into
   an ES module.
   ===================================================================== */

export const TENC = new TextEncoder();
export const TDEC = new TextDecoder();

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
export function escapeXml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
export function crc32(bytes) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
export function concatBytes(chunks) {
  let len = 0; for (const c of chunks) len += c.length;
  const out = new Uint8Array(len); let o = 0;
  for (const c of chunks) { out.set(c, o); o += c.length; }
  return out;
}

/* ---------- ZIP (deflate-raw) ---------- */
export async function deflateRaw(bytes) {
  const cs = new CompressionStream('deflate-raw');
  const writer = cs.writable.getWriter();
  writer.write(bytes); writer.close();
  const chunks = []; const reader = cs.readable.getReader();
  while (true) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); }
  return concatBytes(chunks);
}
export async function inflateRaw(bytes) {
  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  writer.write(bytes); writer.close();
  const chunks = []; const reader = ds.readable.getReader();
  while (true) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); }
  return concatBytes(chunks);
}

export async function zipWrite(entries) { // entries: [{name, data:Uint8Array}]
  const DOS_DATE = 22561, DOS_TIME = 0; // 2024-01-01 00:00:00, fixed value — doesn't affect ZIP validity
  const localParts = [], centralParts = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const nameBytes = TENC.encode(name);
    const crc = crc32(data);
    const comp = await deflateRaw(data);
    const useStore = comp.length >= data.length;
    const method = useStore ? 0 : 8;
    const payload = useStore ? data : comp;

    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0, true);
    lh.setUint16(8, method, true); lh.setUint16(10, DOS_TIME, true); lh.setUint16(12, DOS_DATE, true);
    lh.setUint32(14, crc, true); lh.setUint32(18, payload.length, true); lh.setUint32(22, data.length, true);
    lh.setUint16(26, nameBytes.length, true); lh.setUint16(28, 0, true);
    const lhBytes = new Uint8Array(lh.buffer);
    localParts.push(lhBytes, nameBytes, payload);

    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0, true);
    ch.setUint16(10, method, true); ch.setUint16(12, DOS_TIME, true); ch.setUint16(14, DOS_DATE, true);
    ch.setUint32(16, crc, true); ch.setUint32(20, payload.length, true); ch.setUint32(24, data.length, true);
    ch.setUint16(28, nameBytes.length, true); ch.setUint16(30, 0, true); ch.setUint16(32, 0, true);
    ch.setUint16(34, 0, true); ch.setUint16(36, 0, true); ch.setUint32(38, 0, true); ch.setUint32(42, offset, true);
    centralParts.push(new Uint8Array(ch.buffer), nameBytes);

    offset += lhBytes.length + nameBytes.length + payload.length;
  }
  const centralStart = offset;
  let centralSize = 0; for (const p of centralParts) centralSize += p.length;
  const eocd = new DataView(new ArrayBuffer(22));
  eocd.setUint32(0, 0x06054b50, true); eocd.setUint16(4, 0, true); eocd.setUint16(6, 0, true);
  eocd.setUint16(8, entries.length, true); eocd.setUint16(10, entries.length, true);
  eocd.setUint32(12, centralSize, true); eocd.setUint32(16, centralStart, true); eocd.setUint16(20, 0, true);

  return concatBytes([...localParts, ...centralParts, new Uint8Array(eocd.buffer)]);
}

export async function zipRead(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocdOff = -1;
  const start = Math.max(0, bytes.length - 22 - 65557);
  for (let i = bytes.length - 22; i >= start; i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocdOff = i; break; }
  }
  if (eocdOff < 0) throw new Error('Bukan file ZIP/Office yang valid (EOCD tidak ditemukan).');
  const numEntries = dv.getUint16(eocdOff + 10, true);
  const cdOffset = dv.getUint32(eocdOff + 16, true);
  const out = new Map();
  let p = cdOffset;
  for (let i = 0; i < numEntries; i++) {
    const sig = dv.getUint32(p, true);
    if (sig !== 0x02014b50) throw new Error('Struktur ZIP rusak (central directory).');
    const method = dv.getUint16(p + 10, true);
    const compSize = dv.getUint32(p + 20, true);
    const nameLen = dv.getUint16(p + 28, true);
    const extraLen = dv.getUint16(p + 30, true);
    const commentLen = dv.getUint16(p + 32, true);
    const lhOffset = dv.getUint32(p + 42, true);
    const name = TDEC.decode(bytes.subarray(p + 46, p + 46 + nameLen));
    p += 46 + nameLen + extraLen + commentLen;

    const lhNameLen = dv.getUint16(lhOffset + 26, true);
    const lhExtraLen = dv.getUint16(lhOffset + 28, true);
    const dataStart = lhOffset + 30 + lhNameLen + lhExtraLen;
    const raw = bytes.slice(dataStart, dataStart + compSize);
    if (method === 0) out.set(name, raw);
    else if (method === 8) out.set(name, await inflateRaw(raw));
    else throw new Error('Metode kompresi ZIP tidak didukung: ' + method);
  }
  return out;
}

/* ---------- base64 / latin1 byte-string helpers ---------- */
export function bytesToBase64(bytes) {
  let bin = ''; const CH = 32768;
  for (let i = 0; i < bytes.length; i += CH) bin += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + CH, bytes.length)));
  return btoa(bin);
}
export function latin1Encode(str) {
  const out = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); out[i] = c <= 255 ? c : 63; }
  return out;
}
export function pdfLatin1Decode(bytes) {
  let s = ''; const CH = 32768;
  for (let i = 0; i < bytes.length; i += CH) s += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + CH, bytes.length)));
  return s;
}
export function strToLatin1Bytes(s) { const b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i) & 0xFF; return b; }

/* ---------- zlib (RFC1950) inflate/deflate — used by PDF streams & PNG IDAT ---------- */
export async function zlibInflate(bytes) {
  const ds = new DecompressionStream('deflate');
  const w = ds.writable.getWriter(); w.write(bytes); w.close();
  const chunks = []; const r = ds.readable.getReader();
  while (true) { const { done, value } = await r.read(); if (done) break; chunks.push(value); }
  return concatBytes(chunks);
}
export async function deflateZlib(bytes) {
  const cs = new CompressionStream('deflate'); // zlib format (RFC1950) — used by PNG IDAT
  const w = cs.writable.getWriter(); w.write(bytes); w.close();
  const chunks = []; const r = cs.readable.getReader();
  while (true) { const { done, value } = await r.read(); if (done) break; chunks.push(value); }
  return concatBytes(chunks);
}

/* ---------- minimal pure PNG encoder (no canvas) ----------
   Used to turn raw-pixel images recovered from PDFs back into a real
   image file so they can be re-embedded into HTML/DOCX/PDF output. */
export function pngChunk(type, data) {
  const body = concatBytes([TENC.encode(type), data]);
  const crc = crc32(body);
  const out = new Uint8Array(4 + body.length + 4);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length, false);
  out.set(body, 4);
  dv.setUint32(4 + body.length, crc, false);
  return out;
}
export async function rawPixelsToPngBytes(bytes, width, height, bpc, colorSpace, indexedPalette) {
  if (indexedPalette ? ![1, 2, 4, 8].includes(bpc) : (bpc !== 8 && bpc !== 1)) return null;
  const raw = new Uint8Array((width * 3 + 1) * height);
  let ri = 0;
  if (indexedPalette) {
    const { baseComp, table } = indexedPalette;
    const rowBytesSrc = Math.ceil(width * bpc / 8);
    for (let y = 0; y < height; y++) {
      raw[ri++] = 0;
      for (let x = 0; x < width; x++) {
        let idx;
        if (bpc === 8) idx = bytes[y * rowBytesSrc + x];
        else {
          const perByte = 8 / bpc, byteVal = bytes[y * rowBytesSrc + Math.floor(x / perByte)];
          const shift = 8 - bpc * ((x % perByte) + 1);
          idx = (byteVal >> shift) & ((1 << bpc) - 1);
        }
        const p = idx * baseComp;
        let r, g, b;
        if (baseComp === 1) { r = g = b = table[p] ?? 0; }
        else if (baseComp === 4) { const k = (table[p + 3] ?? 0) / 255; r = 255 * (1 - (table[p] ?? 0) / 255) * (1 - k); g = 255 * (1 - (table[p + 1] ?? 0) / 255) * (1 - k); b = 255 * (1 - (table[p + 2] ?? 0) / 255) * (1 - k); }
        else { r = table[p] ?? 0; g = table[p + 1] ?? 0; b = table[p + 2] ?? 0; }
        raw[ri++] = r; raw[ri++] = g; raw[ri++] = b;
      }
    }
  } else if (bpc === 8) {
    const nComp = colorSpace === 'DeviceGray' ? 1 : (colorSpace === 'DeviceCMYK' ? 4 : 3);
    let p = 0;
    for (let y = 0; y < height; y++) {
      raw[ri++] = 0;
      for (let x = 0; x < width; x++, p += nComp) {
        let r, g, b;
        if (nComp === 1) { r = g = b = bytes[p]; }
        else if (nComp === 4) { const k = bytes[p + 3] / 255; r = 255 * (1 - bytes[p] / 255) * (1 - k); g = 255 * (1 - bytes[p + 1] / 255) * (1 - k); b = 255 * (1 - bytes[p + 2] / 255) * (1 - k); }
        else { r = bytes[p]; g = bytes[p + 1]; b = bytes[p + 2]; }
        raw[ri++] = r; raw[ri++] = g; raw[ri++] = b;
      }
    }
  } else {
    const rowBytesSrc = Math.ceil(width / 8);
    for (let y = 0; y < height; y++) {
      raw[ri++] = 0;
      for (let x = 0; x < width; x++) {
        const byte = bytes[y * rowBytesSrc + (x >> 3)]; const bit = (byte >> (7 - (x & 7))) & 1;
        const v = bit ? 255 : 0; raw[ri++] = v; raw[ri++] = v; raw[ri++] = v;
      }
    }
  }
  const idatRaw = await deflateZlib(raw);
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, width, false); dv.setUint32(4, height, false);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0; // 8-bit, color type 2 = RGB truecolor
  const sig = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  return concatBytes([sig, pngChunk('IHDR', ihdr), pngChunk('IDAT', idatRaw), pngChunk('IEND', new Uint8Array(0))]);
}

/* ---------- data: URI decoding (image dimension sniffing) ----------
   Only data: URIs (inline base64) are ever processed — external image
   URLs are never fetched automatically, by design (privacy + keeping
   the tool 100% local). */
export function decodeDataUri(dataUri) {
  const m = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(dataUri || '');
  if (!m) return null;
  const mime = m[1];
  let bytes;
  if (m[2]) {
    const bin = atob(m[3].replace(/\s/g, ''));
    bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  } else {
    bytes = TENC.encode(decodeURIComponent(m[3]));
  }
  let width = 0, height = 0;
  if (mime === 'image/png' && bytes.length > 24 && bytes[0] === 0x89 && bytes[1] === 0x50) {
    width = (bytes[16] * 16777216 + bytes[17] * 65536 + bytes[18] * 256 + bytes[19]);
    height = (bytes[20] * 16777216 + bytes[21] * 65536 + bytes[22] * 256 + bytes[23]);
  } else if (mime === 'image/jpeg') {
    let i = 2;
    while (i < bytes.length - 8) {
      if (bytes[i] !== 0xFF) { i++; continue; }
      const marker = bytes[i + 1];
      if (marker === 0xD8 || marker === 0x01 || (marker >= 0xD0 && marker <= 0xD7)) { i += 2; continue; }
      const len = bytes[i + 2] * 256 + bytes[i + 3];
      if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
        height = bytes[i + 5] * 256 + bytes[i + 6]; width = bytes[i + 7] * 256 + bytes[i + 8]; break;
      }
      i += 2 + len;
    }
  }
  return { bytes, mime, width: width || 300, height: height || 200 };
}
