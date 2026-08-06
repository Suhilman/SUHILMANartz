/* =====================================================================
   Image Converter — konversi format gambar (PNG/JPEG/WebP/BMP/ICO).
   Decode gambar sumber memakai <img> bawaan browser (jadi format apa pun
   yang bisa didekode browser bisa dibaca: PNG/JPEG/WebP/GIF/BMP/SVG/AVIF,
   dan HEIC/HEIF di Safari yang punya codec native-nya). Encode PNG/JPEG/
   WebP lewat <canvas> bawaan browser; BMP & ICO ditulis manual di sini
   (tanpa library). Satu-satunya bagian yang memakai library pihak
   ketiga & butuh internet adalah fallback decoder HEIC/HEIF (libheif.js
   dari CDN) — hanya dimuat kalau <img> native gagal mendekode file HEIC,
   dipisah tegas dari jalur decode biasa yang 100% lokal.
   ===================================================================== */
'use strict';

const $ = s => document.querySelector(s);

const FMT_LABELS = {
  png:'PNG', jpeg:'JPEG', webp:'WebP', gif:'GIF', bmp:'BMP', svg:'SVG',
  avif:'AVIF', ico:'ICO', tiff:'TIFF', heic:'HEIC/HEIF',
};
const EXT_MAP = {
  png:'png', jpg:'jpeg', jpeg:'jpeg', jpe:'jpeg', webp:'webp', gif:'gif',
  bmp:'bmp', svg:'svg', svgz:'svg', avif:'avif', ico:'ico',
  tif:'tiff', tiff:'tiff', heic:'heic', heif:'heic',
};
const TARGET_LABELS = {png:'PNG (.png)', jpeg:'JPEG (.jpg)', webp:'WebP (.webp)', bmp:'BMP (.bmp)', ico:'ICO (.ico)'};

function detectFormat(file){
  const ext = (file.name.split('.').pop()||'').toLowerCase();
  if(EXT_MAP[ext]) return EXT_MAP[ext];
  if(file.type && file.type.startsWith('image/')) return file.type.slice(6);
  return 'unknown';
}
function formatBytes(n){ return n<1024 ? n+' B' : n<1048576 ? (n/1024).toFixed(1)+' KB' : (n/1048576).toFixed(2)+' MB'; }
function err(m){ $('#err').textContent = m||''; }

const state = { file:null, name:'gambar', srcFormat:null, img:null, width:0, height:0, sizeBytes:0,
  target:null, convertedBlob:null, convertedExt:null };

/* ---------- BMP — encoder manual (24bpp, bottom-up, tanpa kompresi) ---------- */
function imageDataToBmp(imgData){
  const {width, height, data} = imgData;
  const rowSize = Math.ceil((width*3)/4)*4;
  const pixelArraySize = rowSize*height;
  const fileSize = 54 + pixelArraySize;
  const buf = new ArrayBuffer(fileSize);
  const dv = new DataView(buf);
  const bytes = new Uint8Array(buf);
  bytes[0]=0x42; bytes[1]=0x4D; // 'BM'
  dv.setUint32(2, fileSize, true);
  dv.setUint32(10, 54, true); // offset ke data pixel
  dv.setUint32(14, 40, true); // ukuran BITMAPINFOHEADER
  dv.setInt32(18, width, true);
  dv.setInt32(22, height, true);
  dv.setUint16(26, 1, true);  // planes
  dv.setUint16(28, 24, true); // bits per pixel
  dv.setUint32(34, pixelArraySize, true);
  dv.setInt32(38, 2835, true); // ~72dpi
  dv.setInt32(42, 2835, true);
  let offset = 54;
  for(let y=height-1; y>=0; y--){
    let rowOff = offset;
    for(let x=0; x<width; x++){
      const p = (y*width+x)*4;
      bytes[rowOff++] = data[p+2]; // B
      bytes[rowOff++] = data[p+1]; // G
      bytes[rowOff++] = data[p];   // R
    }
    offset += rowSize;
  }
  return bytes;
}

/* ---------- ICO — bungkus satu gambar PNG dalam kontainer ICO (format
   modern, didukung sejak Windows Vista: entri ICO berisi PNG langsung,
   bukan bitmap mentah — jauh lebih sederhana daripada DIB klasik). ---------- */
function pngToIco(pngBytes, width, height){
  const headerSize = 6 + 16;
  const buf = new Uint8Array(headerSize + pngBytes.length);
  const dv = new DataView(buf.buffer);
  dv.setUint16(2, 1, true); // type = icon
  dv.setUint16(4, 1, true); // jumlah gambar
  buf[6] = width>=256 ? 0 : width;   // 0 berarti 256
  buf[7] = height>=256 ? 0 : height;
  dv.setUint16(10, 1, true); // planes
  dv.setUint16(12, 32, true); // bit count
  dv.setUint32(14, pngBytes.length, true);
  dv.setUint32(18, headerSize, true);
  buf.set(pngBytes, headerSize);
  return buf;
}

function canvasToBlob(canvas, type, quality){
  return new Promise(resolve => canvas.toBlob(resolve, type, quality));
}

let busyInterval = null;
function showBusy(on, txt){
  const ov = $('#ov');
  if(on){
    ov.classList.add('on');
    if(txt) $('#ovTxt').textContent = txt;
    let pct = 8; $('#ovBar').style.width = pct+'%';
    clearInterval(busyInterval);
    busyInterval = setInterval(() => { pct = Math.min(92, pct + (92-pct)*0.08 + 1); $('#ovBar').style.width = pct+'%'; }, 200);
  } else {
    clearInterval(busyInterval); busyInterval = null;
    $('#ovBar').style.width = '100%';
    setTimeout(() => { ov.classList.remove('on'); $('#ovBar').style.width = '0%'; }, 150);
  }
}
function resetUI(){
  $('#cardDetected').style.display='none'; $('#cardTarget').style.display='none';
  $('#imgContent').innerHTML = '<div class="ph-empty">Muat gambar untuk melihat pratinjau di sini.</div>';
  $('#btnConvert').disabled = true; $('#btnSave').disabled = true;
  $('#stageInfo').textContent = 'Belum ada gambar dimuat.'; $('#stageMeta').textContent = '';
  $('#fileInfo').textContent = '';
}

function finalizeSource(file, fmt, imgEl, w, h){
  state.file = file; state.name = file.name.replace(/\.[^.]+$/,'') || 'gambar';
  state.srcFormat = fmt; state.sizeBytes = file.size;
  state.img = imgEl; state.width = w; state.height = h;
  onSourceReady();
}

/* ---------- HEIC/HEIF — fallback decoder (libheif.js dari CDN, hanya
   dimuat kalau decode <img> native gagal — lihat catatan di atas). ---------- */
let libheifLoadPromise = null;
function loadLibheif(){
  if(window.libheif) return Promise.resolve();
  if(libheifLoadPromise) return libheifLoadPromise;
  libheifLoadPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/libheif-js@1.19.8/libheif-wasm/libheif-bundle.js';
    s.onload = () => resolve();
    s.onerror = () => { libheifLoadPromise = null; reject(new Error('Gagal memuat libheif.js dari CDN — periksa koneksi internet.')); };
    document.head.appendChild(s);
  });
  return libheifLoadPromise;
}
let libheifModulePromise = null;
async function getLibheifModule(){
  await loadLibheif();
  /* window.libheif adalah factory Emscripten (bukan objek modul langsung) —
     harus dipanggil dan ditunggu dulu supaya WASM-nya siap, hasilnya baru
     punya HeifDecoder di dalamnya. */
  if(!libheifModulePromise) libheifModulePromise = window.libheif();
  return libheifModulePromise;
}
async function decodeHeicToCanvas(file){
  const mod = await getLibheifModule();
  const buf = new Uint8Array(await file.arrayBuffer());
  const decoder = new mod.HeifDecoder();
  const images = decoder.decode(buf);
  if(!images || !images.length) throw new Error('Tidak ada gambar yang bisa didekode dari file HEIC ini.');
  const image = images[0];
  const width = image.get_width(), height = image.get_height();
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const cx = canvas.getContext('2d');
  const imageData = cx.createImageData(width, height);
  await new Promise((resolve, reject) => {
    image.display(imageData, displayData => {
      if(!displayData) return reject(new Error('Gagal memproses piksel gambar HEIF (libheif).'));
      resolve();
    });
  });
  cx.putImageData(imageData, 0, 0);
  return {canvas, width, height};
}

function loadFile(file){
  err('');
  const fmt = detectFormat(file);
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => { URL.revokeObjectURL(url); finalizeSource(file, fmt, img, img.naturalWidth, img.naturalHeight); };
  img.onerror = async () => {
    URL.revokeObjectURL(url);
    if(fmt === 'heic'){
      showBusy(true, 'Browser ini tidak bisa mendekode HEIC secara native — memuat decoder HEIF dari CDN (libheif.js, ±1.4 MB, butuh internet)…');
      try{
        const {canvas, width, height} = await decodeHeicToCanvas(file);
        err('');
        finalizeSource(file, fmt, canvas, width, height);
      }catch(e){
        err('Gagal mendekode HEIC: '+e.message);
        resetUI();
      } finally { showBusy(false); }
      return;
    }
    err('Gagal memuat gambar — format tidak didukung oleh browser ini.');
    resetUI();
  };
  img.src = url;
}

function onSourceReady(){
  $('#dzTitle').textContent = state.file.name; $('#dz').classList.add('has');
  $('#cardDetected').style.display = '';
  $('#detectedFmt').textContent = FMT_LABELS[state.srcFormat] || state.srcFormat;
  $('#detectedDim').textContent = state.width+' × '+state.height+' px';
  $('#detectedSize').textContent = formatBytes(state.sizeBytes);
  $('#cardTarget').style.display = '';
  gateTargetButtons();

  const wrap = $('#imgContent'); wrap.innerHTML=''; wrap.appendChild(state.img);
  $('#stageInfo').textContent = 'Pratinjau: '+(FMT_LABELS[state.srcFormat]||state.srcFormat);
  $('#stageMeta').textContent = state.width+'×'+state.height+' px · '+formatBytes(state.sizeBytes);
  $('#fileInfo').textContent = state.file.name+' · '+(FMT_LABELS[state.srcFormat]||state.srcFormat);

  state.target = null; state.convertedBlob = null; state.convertedExt = null;
  document.querySelectorAll('.fmtgrid button').forEach(b=>b.classList.remove('on'));
  $('#qualityRow').style.display = 'none'; $('#icoSizeRow').style.display = 'none';
  $('#btnConvert').disabled = true; $('#btnSave').disabled = true; $('#outInfo').textContent = '';
  $('#targetHint').textContent = '';
}
function gateTargetButtons(){
  document.querySelectorAll('#fmtGrid button').forEach(b => {
    const same = b.dataset.t===state.srcFormat;
    b.disabled = same;
    b.title = same ? 'Sama dengan format sumber' : '';
  });
}
function targetHintFor(t){
  return {
    png:  'Lossless, ukuran file lebih besar, transparansi tetap ada.',
    jpeg: 'Ukuran file kecil, transparansi hilang (dilatarbelakangi putih).',
    webp: 'Kompresi modern — biasanya lebih kecil dari JPEG pada kualitas setara, transparansi tetap ada.',
    bmp:  'Tanpa kompresi (ukuran file besar), transparansi hilang (dilatarbelakangi putih).',
    ico:  'Ikon persegi satu ukuran, PNG dibungkus dalam kontainer ICO, transparansi tetap ada.',
  }[t] || '';
}

document.querySelectorAll('#fmtGrid button').forEach(b => b.onclick = () => {
  if(b.disabled) return;
  document.querySelectorAll('#fmtGrid button').forEach(x=>x.classList.remove('on'));
  b.classList.add('on');
  state.target = b.dataset.t;
  state.convertedBlob = null; state.convertedExt = null;
  $('#btnSave').disabled = true; $('#outInfo').textContent = '';
  $('#btnConvert').disabled = false;
  $('#targetHint').textContent = targetHintFor(state.target);
  $('#qualityRow').style.display = (state.target==='jpeg'||state.target==='webp') ? '' : 'none';
  $('#icoSizeRow').style.display = state.target==='ico' ? '' : 'none';
});
$('#quality').oninput = () => { $('#vQ').textContent = $('#quality').value; state.convertedBlob=null; $('#btnSave').disabled=true; };
$('#icoSize').onchange = () => { state.convertedBlob=null; $('#btnSave').disabled=true; };

$('#btnConvert').onclick = async () => {
  err('');
  try{
    let w = state.width, h = state.height;
    if(state.target==='ico') w = h = +$('#icoSize').value;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const cx = canvas.getContext('2d');
    if(state.target==='jpeg' || state.target==='bmp'){ cx.fillStyle = '#fff'; cx.fillRect(0,0,w,h); }
    cx.drawImage(state.img, 0, 0, w, h);

    let blob, ext;
    if(state.target==='png'){ blob = await canvasToBlob(canvas, 'image/png'); ext='png'; }
    else if(state.target==='jpeg'){ blob = await canvasToBlob(canvas, 'image/jpeg', +$('#quality').value/100); ext='jpg'; }
    else if(state.target==='webp'){
      blob = await canvasToBlob(canvas, 'image/webp', +$('#quality').value/100);
      if(!blob) throw new Error('Browser ini tidak mendukung ekspor WebP.');
      ext='webp';
    }
    else if(state.target==='bmp'){ blob = new Blob([imageDataToBmp(cx.getImageData(0,0,w,h))], {type:'image/bmp'}); ext='bmp'; }
    else if(state.target==='ico'){
      const pngBlob = await canvasToBlob(canvas, 'image/png');
      const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
      blob = new Blob([pngToIco(pngBytes, w, h)], {type:'image/x-icon'}); ext='ico';
    } else throw new Error('Pilih format tujuan terlebih dahulu.');

    state.convertedBlob = blob; state.convertedExt = ext;
    $('#btnSave').disabled = false;
    $('#outInfo').textContent = 'Siap diunduh: '+state.name+'.'+ext+' · '+formatBytes(blob.size);
  }catch(e){ err('Gagal konversi: '+e.message); }
};
$('#btnSave').onclick = () => {
  if(!state.convertedBlob) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(state.convertedBlob); a.download = state.name+'.'+state.convertedExt; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
};

function handleFile(file){
  if(!file.type.startsWith('image/') && !/\.(png|jpe?g|webp|gif|bmp|svg|avif|heic|heif|tiff?)$/i.test(file.name)){
    err('File ini sepertinya bukan gambar: '+file.name); return;
  }
  loadFile(file);
}
$('#file').onchange = e => { const f=e.target.files[0]; if(f) handleFile(f); e.target.value=''; };
const dz = $('#dz');
['dragenter','dragover'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('over'); }));
['dragleave','drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('over'); }));
dz.addEventListener('drop', e => { const f=e.dataTransfer.files[0]; if(f) handleFile(f); });

$('#btnMin').onclick = () => {
  const p = $('#floatPanel'); p.classList.toggle('min');
  $('#btnMin').textContent = p.classList.contains('min') ? '+' : '–';
};
