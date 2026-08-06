/* =====================================================================
   YouTube to MP3 — kirim URL ke layanan ekstraksi (default: server yt-dlp
   lokal, lihat yt-server.py, mode "audio"), lalu ambil hasil MP3-nya lewat
   fetch() biasa dan tampilkan pratinjau + tombol unduh.
   ===================================================================== */
'use strict';

const $ = s => document.querySelector(s);

function formatBytes(n){
  if(n==null || isNaN(n)) return '—';
  return n<1024 ? n+' B' : n<1048576 ? (n/1024).toFixed(1)+' KB' : (n/1048576).toFixed(2)+' MB';
}
function formatDuration(s){
  if(s==null || !isFinite(s)) return '—';
  const m = Math.floor(s/60), sec = Math.floor(s%60);
  return m+':'+String(sec).padStart(2,'0');
}
function err(m){ $('#err').textContent = m || ''; }
function showBusy(on, txt, frac){
  $('#ov').classList.toggle('on', !!on);
  if(txt) $('#ovTxt').textContent = txt;
  if(frac!=null) $('#ovBar').style.width = Math.round(frac*100)+'%';
  if(!on) $('#stageInfo').textContent = state.blob ? 'Audio dimuat.' : 'Belum ada audio dimuat.';
}

const KNOWN_PLATFORM_HOSTS = [
  'youtube.com','youtu.be','tiktok.com','instagram.com','twitter.com','x.com',
  'facebook.com','fb.watch','reddit.com','vimeo.com','soundcloud.com',
  'twitch.tv','pinterest.com','tumblr.com','streamable.com','vk.com'
];
function looksLikePlatformHost(hostname){
  const h = hostname.toLowerCase();
  return KNOWN_PLATFORM_HOSTS.some(d => h===d || h.endsWith('.'+d));
}

const state = { blob:null, objUrl:null, size:0, name:'audio.mp3' };

function resetOutput(){
  state.blob = null;
  if(state.objUrl){ URL.revokeObjectURL(state.objUrl); state.objUrl = null; }
  $('#btnSave').disabled = true;
  $('#outInfo').textContent = '';
}

$('#btnSave').onclick = () => {
  if(!state.blob) return;
  const name = $('#saveName').value.trim() || state.name;
  const a = document.createElement('a');
  a.href = state.objUrl; a.download = name; a.click();
};

$('#btnMin').onclick = () => {
  const p = $('#floatPanel'); p.classList.toggle('min');
  $('#btnMin').textContent = p.classList.contains('min') ? '+' : '–';
};

/* ---------------------------------------------------------------------
   Layanan ekstraksi — default: server yt-dlp lokal (yt-server.py).
   --------------------------------------------------------------------- */
const LS_INSTANCE = 'imgstudio_extractor_instance', LS_APIKEY = 'imgstudio_extractor_apikey';
const DEFAULT_EXTRACTOR = 'http://127.0.0.1:8765';

function isValidInstanceUrl(raw){
  try{
    const u = new URL(raw);
    return /^https?:$/.test(u.protocol) && !looksLikePlatformHost(u.hostname);
  }catch(e){ return false; }
}
function normalizeInstanceBase(raw){
  let u;
  try{ u = new URL(raw); }catch(e){ throw new Error('URL layanan ekstraksi tidak valid.'); }
  if(!/^https?:$/.test(u.protocol)) throw new Error('URL harus berawalan http:// atau https://');
  if(looksLikePlatformHost(u.hostname)){
    throw new Error('URL ini kelihatannya link video/postingan ('+u.hostname+'), bukan alamat layanan ekstraksi. Tempel link itu di kotak URL utama, bukan di sini.');
  }
  return u.href.replace(/\/+$/,'');
}

/* Field ini dipakai bersama oleh halaman lain (video-download.html) lewat
   kunci localStorage yang sama, jadi konfigurasi cukup diisi sekali. */
try{
  const savedInstance = localStorage.getItem(LS_INSTANCE);
  const savedKey = localStorage.getItem(LS_APIKEY);
  if(savedInstance && !isValidInstanceUrl(savedInstance)){
    localStorage.removeItem(LS_INSTANCE);
    $('#extractorInstance').value = DEFAULT_EXTRACTOR;
  } else {
    $('#extractorInstance').value = savedInstance || DEFAULT_EXTRACTOR;
  }
  if(savedKey) $('#extractorApiKey').value = savedKey;
}catch(e){ $('#extractorInstance').value = DEFAULT_EXTRACTOR; }

$('#btnTestInstance').onclick = async () => {
  const resultEl = $('#testResult');
  resultEl.style.color = ''; resultEl.textContent = 'Menguji…';
  const rawInstance = $('#extractorInstance').value.trim();
  if(!rawInstance){ resultEl.textContent = 'Masukkan URL layanan ekstraksi dulu.'; return; }
  let base;
  try{ base = normalizeInstanceBase(rawInstance); }
  catch(e){ resultEl.style.color = 'var(--danger)'; resultEl.textContent = e.message; return; }

  try{
    const res = await fetch(base+'/', {method:'GET'});
    let data = null;
    try{ data = await res.json(); }catch(e){ /* server statis biasa, itu OK */ }
    if(res.ok){
      resultEl.style.color = 'var(--acc2)';
      resultEl.textContent = (data && data.cobalt) ? 'Terjangkau — Cobalt v'+data.cobalt.version : 'Terjangkau (HTTP '+res.status+').';
    } else {
      resultEl.style.color = 'var(--danger)';
      resultEl.textContent = 'Membalas tapi status HTTP '+res.status+'.';
    }
  }catch(e){
    resultEl.style.color = 'var(--danger)';
    resultEl.textContent = 'Tidak terjangkau: '+e.message+'. Kalau memakai default lokal, pastikan sudah menjalankan "node server/yt-server.js".';
  }
};

const EXTRACTOR_ERROR_LABELS = {
  'error.api.link.invalid': 'Tautan tidak valid atau tidak dikenali.',
  'error.api.service.unsupported': 'Platform ini tidak didukung layanan ekstraksi.',
  'error.api.content.video.unavailable': 'Video tidak tersedia (privat/dihapus/dibatasi wilayah).',
  'error.local.ytdlp_missing': 'yt-dlp tidak ditemukan di server lokal — install lewat "brew install yt-dlp".',
  'error.local.ytdlp_failed': 'yt-dlp gagal memproses link ini (lihat detail).',
  'error.local.not_found': 'Berkas hasil sudah tidak tersedia (kedaluwarsa/sudah pernah diambil).',
};

/* ---------------------------------------------------------------------
   Alur utama: POST {url, mode:'audio'} -> tunnel -> fetch blob mp3.
   --------------------------------------------------------------------- */
$('#btnLoad').onclick = async () => {
  err(''); resetOutput();
  const raw = $('#urlInput').value.trim();
  if(!raw) return err('Masukkan URL video terlebih dahulu.');
  let target;
  try{
    target = new URL(raw);
    if(!/^https?:$/.test(target.protocol)) throw new Error('bad-protocol');
  }catch(e){ return err('URL tidak valid. Gunakan URL lengkap berawalan http:// atau https://'); }

  const rawInstance = $('#extractorInstance').value.trim() || DEFAULT_EXTRACTOR;
  const apiKey = $('#extractorApiKey').value.trim();
  let base;
  try{ base = normalizeInstanceBase(rawInstance); }catch(e){ return err(e.message); }

  try{
    localStorage.setItem(LS_INSTANCE, rawInstance);
    localStorage.setItem(LS_APIKEY, apiKey);
  }catch(e){ /* abaikan bila localStorage tidak tersedia */ }

  $('#btnLoad').disabled = true;
  $('#cardInfo').style.display = 'none';
  $('#openOrigLink').style.display = 'none';
  showBusy(true, 'Mengekstrak & mengonversi ke MP3… (bisa makan waktu untuk video panjang)', undefined);

  try{
    const headers = {'Accept':'application/json', 'Content-Type':'application/json'};
    if(apiKey) headers['Authorization'] = 'Api-Key '+apiKey;
    const res = await fetch(base+'/', { method:'POST', headers, body: JSON.stringify({ url: target.href, mode: 'audio' }) });
    let data;
    try{ data = await res.json(); }
    catch(e){ throw new Error('Layanan membalas dengan data yang bukan JSON valid (status HTTP '+res.status+').'); }

    if(!res.ok && !data.status) throw new Error('Layanan membalas status HTTP '+res.status+'.');

    if(data.status === 'error'){
      const code = data.error && data.error.code || 'tidak diketahui';
      const label = EXTRACTOR_ERROR_LABELS[code] || '';
      const extra = data.error && data.error.context && data.error.context.message ? ' ('+data.error.context.message+')' : '';
      showBusy(false);
      err('Ekstraksi gagal ('+code+')'+(label?' — '+label:'.')+extra);
      return;
    }

    if(data.status !== 'tunnel' && data.status !== 'redirect'){
      showBusy(false);
      err('Respons layanan tidak dikenali/tidak didukung untuk audio (status: "'+(data.status||'?')+'").');
      return;
    }

    showBusy(true, 'Mengunduh MP3…', 0);
    const fres = await fetch(data.url);
    if(!fres.ok) throw new Error('Gagal mengambil hasil dari server (status '+fres.status+').');
    const mime = (fres.headers.get('content-type')||'audio/mpeg').split(';')[0].trim();
    const declaredLen = +fres.headers.get('content-length');
    const total = declaredLen>0 ? declaredLen : null;

    const reader = fres.body ? fres.body.getReader() : null;
    const chunks = []; let received = 0;
    if(reader){
      while(true){
        const {done, value} = await reader.read();
        if(done) break;
        chunks.push(value); received += value.length;
        showBusy(true, 'Mengunduh… '+formatBytes(received)+(total?' / '+formatBytes(total):''),
          total ? received/total : undefined);
      }
    } else {
      const buf = new Uint8Array(await fres.arrayBuffer());
      chunks.push(buf); received = buf.length;
    }
    const blob = new Blob(chunks, {type: mime});

    state.blob = blob; state.size = blob.size;
    state.name = data.filename || 'audio.mp3';
    if(state.objUrl) URL.revokeObjectURL(state.objUrl);
    state.objUrl = URL.createObjectURL(blob);

    $('#audContent').innerHTML = '';
    const cover = document.createElement('div'); cover.className = 'audCover';
    cover.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M9 8v8l7-4z" fill="currentColor" stroke="none"/></svg>';
    $('#audContent').appendChild(cover);
    const audio = document.createElement('audio');
    audio.src = state.objUrl; audio.controls = true;
    audio.onloadedmetadata = () => { $('#infoDur').textContent = formatDuration(audio.duration); };
    $('#audContent').appendChild(audio);

    $('#cardInfo').style.display = '';
    $('#infoType').textContent = mime;
    $('#infoSize').textContent = formatBytes(state.size);
    $('#infoDur').textContent = '—';

    $('#openOrigLink').href = target.href; $('#openOrigLink').style.display = '';
    $('#saveName').value = state.name;
    $('#btnSave').disabled = false;
    $('#outInfo').textContent = formatBytes(state.size)+' · siap diunduh';
    $('#fileInfo').textContent = state.name+' · '+formatBytes(state.size);
    $('#stageMeta').textContent = mime;
  }catch(e){
    resetOutput();
    $('#audContent').innerHTML = '<div class="ph-empty">Ekstrak audio untuk melihat pratinjau di sini.</div>';
    const hint = (e instanceof TypeError)
      ? ' Kemungkinan URL layanan salah/sedang tidak jalan. Kalau memakai default lokal, pastikan sudah menjalankan "node server/yt-server.js".'
      : '';
    err('Gagal mengekstrak audio: '+e.message+hint);
  } finally {
    showBusy(false); $('#btnLoad').disabled = false;
  }
};

$('#urlInput').addEventListener('keydown', e => { if(e.key==='Enter') $('#btnLoad').click(); });
