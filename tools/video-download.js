/* =====================================================================
   Unduh Video — satu kotak URL, dua jalur otomatis:
   1) Link berkas video langsung  -> fetch() bawaan browser.
   2) Link sosial media (YouTube/TikTok/Instagram/dsb.) -> dikirim ke
      layanan ekstraksi Cobalt-compatible (default: server yt-dlp lokal
      di mesin ini, lihat yt-server.py), yang membalas dengan URL
      berkas jadi (status "tunnel"/"redirect"/"picker"/"error").
   ===================================================================== */
'use strict';

const $ = s => document.querySelector(s);

const EXT_BY_MIME = {
  'video/mp4':'mp4', 'video/webm':'webm', 'video/ogg':'ogv', 'video/quicktime':'mov',
  'video/x-matroska':'mkv', 'video/3gpp':'3gp', 'video/x-msvideo':'avi',
  'audio/mpeg':'mp3', 'audio/ogg':'ogg', 'audio/wav':'wav', 'audio/opus':'opus'
};

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
  if(!on) $('#stageInfo').textContent = state.mode ? 'Video dimuat.' : 'Belum ada video dimuat.';
}
function nameFromUrl(u, mime){
  let base = 'video';
  try{
    const path = new URL(u).pathname;
    const last = path.split('/').filter(Boolean).pop();
    if(last) base = decodeURIComponent(last);
  }catch(e){ /* URL tidak valid ditangani sebelum sampai sini */ }
  const hasExt = /\.[a-z0-9]{2,4}$/i.test(base);
  if(hasExt) return base;
  const ext = EXT_BY_MIME[mime] || 'mp4';
  return base.replace(/\.$/,'') + '.' + ext;
}

/* Domain yang butuh diproses lewat layanan ekstraksi (bukan berkas video
   langsung) — dipakai untuk deteksi otomatis di kotak URL utama, dan untuk
   mencegah link semacam ini keliru ditaruh di kotak "Layanan ekstraksi". */
const KNOWN_PLATFORM_HOSTS = [
  'youtube.com','youtu.be','tiktok.com','instagram.com','twitter.com','x.com',
  'facebook.com','fb.watch','reddit.com','vimeo.com','soundcloud.com',
  'twitch.tv','pinterest.com','tumblr.com','streamable.com','vk.com'
];
function looksLikePlatformHost(hostname){
  const h = hostname.toLowerCase();
  return KNOWN_PLATFORM_HOSTS.some(d => h===d || h.endsWith('.'+d));
}

const state = { mode:null, blob:null, objUrl:null, mime:'', size:0, name:'video.mp4', directUrl:'' };

function resetOutput(){
  state.mode = null; state.blob = null; state.directUrl = '';
  if(state.objUrl){ URL.revokeObjectURL(state.objUrl); state.objUrl = null; }
  $('#btnSave').disabled = true;
  $('#btnSave').innerHTML = '<svg class="i sm" viewBox="0 0 24 24"><path d="M12 3v12M7 11l5 5 5-5"/><path d="M4 21h16"/></svg>Unduh berkas';
  $('#outInfo').textContent = '';
  $('#pickerWrap').style.display = 'none'; $('#pickerWrap').innerHTML = '';
}

/* ---------------------------------------------------------------------
   Inti pengambilan: fetch (untuk unduhan Blob asli) dengan fallback ke
   pratinjau langsung lewat <video src> kalau CORS memblokir fetch().
   originalLink dipakai untuk tombol "Buka URL asli" (berguna saat urlHref
   adalah tunnel sementara dari layanan ekstraksi).
   --------------------------------------------------------------------- */
async function loadVideoFrom(urlHref, {suggestedName, originalLink} = {}){
  resetOutput();
  $('#cardInfo').style.display = 'none';
  $('#openOrigLink').style.display = 'none';
  $('#vidContent').style.display = '';
  showBusy(true, 'Mengambil berkas…', 0);

  try{
    const res = await fetch(urlHref);
    if(!res.ok) throw new Error('Server membalas status '+res.status+' '+res.statusText);
    const mime = (res.headers.get('content-type')||'').split(';')[0].trim();
    const declaredLen = +res.headers.get('content-length');
    const total = declaredLen>0 ? declaredLen : null;

    const reader = res.body ? res.body.getReader() : null;
    const chunks = [];
    let received = 0;
    if(reader){
      while(true){
        const {done, value} = await reader.read();
        if(done) break;
        chunks.push(value);
        received += value.length;
        showBusy(true, 'Mengunduh… '+formatBytes(received)+(total?' / '+formatBytes(total):''),
          total ? received/total : undefined);
      }
    } else {
      const buf = new Uint8Array(await res.arrayBuffer());
      chunks.push(buf); received = buf.length;
    }
    const blob = new Blob(chunks, mime ? {type:mime} : undefined);

    if(mime && !mime.startsWith('video/') && !mime.startsWith('audio/')){
      err('Peringatan: tipe konten dari server adalah "'+mime+'". Berkas tetap dimuat, periksa pratinjau sebelum mengunduh.');
    }

    state.mode = 'blob'; state.blob = blob; state.mime = mime || blob.type || ''; state.size = blob.size;
    state.name = suggestedName || nameFromUrl(urlHref, state.mime);
    if(state.objUrl) URL.revokeObjectURL(state.objUrl);
    state.objUrl = URL.createObjectURL(blob);

    $('#vidContent').innerHTML = '';
    const isAudio = state.mime.startsWith('audio/');
    const media = document.createElement(isAudio ? 'audio' : 'video');
    media.src = state.objUrl; media.controls = true;
    media.onloadedmetadata = () => { $('#infoDur').textContent = formatDuration(media.duration); };
    $('#vidContent').appendChild(media);

    $('#cardInfo').style.display = '';
    $('#infoType').textContent = state.mime || 'tidak diketahui';
    $('#infoSize').textContent = formatBytes(state.size);
    $('#infoDur').textContent = '—';

    const linkFor = originalLink || urlHref;
    $('#openOrigLink').href = linkFor; $('#openOrigLink').style.display = '';
    $('#saveName').value = state.name;
    $('#btnSave').disabled = false;
    $('#outInfo').textContent = formatBytes(state.size)+' · siap diunduh';
    $('#fileInfo').textContent = state.name+' · '+formatBytes(state.size);
    $('#stageMeta').textContent = state.mime || '';
    return true;
  }catch(e){
    /* fetch() gagal — biasanya karena tidak ada header CORS untuk permintaan
       lintas-origin dari skrip. <video src> browser TIDAK tunduk pada batasan
       CORS yang sama (itu hanya berlaku untuk pembacaan byte lewat skrip),
       jadi pratinjau langsung dari URL asli sering kali tetap berhasil. */
    resetOutput();
    state.mode = 'direct'; state.directUrl = urlHref; state.name = suggestedName || nameFromUrl(urlHref, '');

    $('#vidContent').innerHTML = '';
    const video = document.createElement('video');
    video.src = urlHref; video.controls = true;
    let loadFailed = false;
    video.onloadedmetadata = () => {
      $('#cardInfo').style.display = '';
      $('#infoType').textContent = 'tidak diketahui (CORS diblokir)';
      $('#infoSize').textContent = 'tidak diketahui (CORS diblokir)';
      $('#infoDur').textContent = formatDuration(video.duration);
    };
    video.onerror = () => {
      loadFailed = true;
      $('#vidContent').innerHTML = '<div class="ph-empty">Muat video untuk melihat pratinjau di sini.</div>';
      $('#btnSave').disabled = true;
      err('Gagal mengambil video: '+e.message+'. Server kemungkinan tidak mengizinkan pengambilan lintas-origin (CORS), atau URL benar-benar tidak bisa dijangkau/bukan berkas video.');
    };
    $('#vidContent').appendChild(video);

    const linkFor = originalLink || urlHref;
    $('#openOrigLink').href = linkFor; $('#openOrigLink').style.display = '';
    $('#saveName').value = state.name;
    $('#btnSave').disabled = false;
    $('#btnSave').innerHTML = '<svg class="i sm" viewBox="0 0 24 24"><path d="M7 17L17 7M9 7h8v8"/></svg>Buka video di tab baru untuk disimpan';
    $('#fileInfo').textContent = state.name;
    err('Server memblokir pengambilan lintas-origin (CORS) — unduhan otomatis tidak bisa dijalankan lewat script. Video ditampilkan langsung dari sumbernya di kanan; klik kanan pada video → "Simpan Video Sebagai…", atau pakai tombol "Buka video di tab baru" di panel Unduh.');
    return false;
  } finally {
    showBusy(false);
  }
}

$('#btnSave').onclick = () => {
  if(state.mode==='blob' && state.blob){
    const name = $('#saveName').value.trim() || state.name;
    const a = document.createElement('a');
    a.href = state.objUrl; a.download = name; a.click();
  } else if(state.mode==='direct' && state.directUrl){
    /* Tautan lintas-origin tanpa CORS: atribut download diabaikan browser
       untuk URL beda origin, jadi cara yang bisa diandalkan hanyalah membuka
       tab baru dan membiarkan pengguna menyimpannya lewat menu klik-kanan. */
    window.open(state.directUrl, '_blank', 'noopener');
  }
};

$('#btnMin').onclick = () => {
  const p = $('#floatPanel'); p.classList.toggle('min');
  $('#btnMin').textContent = p.classList.contains('min') ? '+' : '–';
};

/* ---------------------------------------------------------------------
   Layanan ekstraksi (untuk link sosial media) — default: server yt-dlp
   lokal (yt-server.py), bisa diganti ke instance Cobalt-compatible lain.
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

try{
  const savedInstance = localStorage.getItem(LS_INSTANCE);
  const savedKey = localStorage.getItem(LS_APIKEY);
  if(savedInstance && !isValidInstanceUrl(savedInstance)){
    localStorage.removeItem(LS_INSTANCE);
    $('#cobaltInstance').value = DEFAULT_EXTRACTOR;
  } else {
    $('#cobaltInstance').value = savedInstance || DEFAULT_EXTRACTOR;
  }
  if(savedKey) $('#cobaltApiKey').value = savedKey;
}catch(e){ $('#cobaltInstance').value = DEFAULT_EXTRACTOR; }

$('#btnTestInstance').onclick = async () => {
  const resultEl = $('#testResult');
  resultEl.style.color = ''; resultEl.textContent = 'Menguji…';
  const rawInstance = $('#cobaltInstance').value.trim();
  if(!rawInstance){ resultEl.textContent = 'Masukkan URL layanan ekstraksi dulu.'; return; }
  let base;
  try{ base = normalizeInstanceBase(rawInstance); }
  catch(e){ resultEl.style.color = 'var(--danger)'; resultEl.textContent = e.message; return; }

  try{
    const res = await fetch(base+'/', {method:'GET'});
    let data = null;
    try{ data = await res.json(); }catch(e){ /* bukan JSON — server statis biasa, itu OK */ }
    if(res.ok){
      resultEl.style.color = 'var(--acc2)';
      resultEl.textContent = (data && data.cobalt)
        ? 'Terjangkau — Cobalt v'+data.cobalt.version
        : 'Terjangkau (HTTP '+res.status+').';
    } else {
      resultEl.style.color = 'var(--danger)';
      resultEl.textContent = 'Membalas tapi status HTTP '+res.status+'.';
    }
  }catch(e){
    resultEl.style.color = 'var(--danger)';
    resultEl.textContent = 'Tidak terjangkau: '+e.message+'. Kalau memakai default lokal, pastikan sudah menjalankan "node server/yt-server.js" di terminal.';
  }
};

const EXTRACTOR_ERROR_LABELS = {
  'error.api.link.invalid': 'Tautan tidak valid atau tidak dikenali.',
  'error.api.service.unsupported': 'Platform ini tidak didukung layanan ekstraksi.',
  'error.api.content.video.unavailable': 'Video tidak tersedia (privat/dihapus/dibatasi wilayah).',
  'error.api.fetch.critical': 'Gagal mengambil konten dari sumbernya.',
  'error.api.fetch.rate': 'Kena limit rate dari layanan sumber — coba lagi nanti.',
  'error.local.ytdlp_missing': 'yt-dlp tidak ditemukan di server lokal — install lewat "brew install yt-dlp".',
  'error.local.ytdlp_failed': 'yt-dlp gagal memproses link ini (lihat detail).',
  'error.local.not_found': 'Berkas hasil sudah tidak tersedia (kedaluwarsa/sudah pernah diambil).',
};

async function processViaExtractor(target){
  const rawInstance = $('#cobaltInstance').value.trim() || DEFAULT_EXTRACTOR;
  const apiKey = $('#cobaltApiKey').value.trim();

  let base;
  try{ base = normalizeInstanceBase(rawInstance); }catch(e){ return err(e.message); }

  try{
    localStorage.setItem(LS_INSTANCE, rawInstance);
    localStorage.setItem(LS_APIKEY, apiKey);
  }catch(e){ /* abaikan bila localStorage tidak tersedia */ }

  resetOutput();
  $('#cardInfo').style.display = 'none';
  $('#openOrigLink').style.display = 'none';
  showBusy(true, 'Memproses lewat layanan ekstraksi… (bisa makan waktu untuk video panjang)', undefined);

  try{
    const headers = {'Accept':'application/json', 'Content-Type':'application/json'};
    if(apiKey) headers['Authorization'] = 'Api-Key '+apiKey;
    const res = await fetch(base+'/', { method:'POST', headers, body: JSON.stringify({ url: target.href }) });
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

    if(data.status === 'tunnel' || data.status === 'redirect'){
      showBusy(false);
      await loadVideoFrom(data.url, {suggestedName: data.filename, originalLink: target.href});
      return;
    }

    if(data.status === 'picker'){
      showBusy(false);
      renderPicker(data, target.href);
      return;
    }

    if(data.status === 'local-processing'){
      showBusy(false);
      err('Layanan meminta pemrosesan lokal (gabung/mute audio-video) yang belum didukung alat ini.');
      return;
    }

    showBusy(false);
    err('Respons layanan tidak dikenali (status: "'+(data.status||'?')+'").');
  }catch(e){
    showBusy(false);
    const hint = (e instanceof TypeError)
      ? ' Kemungkinan URL layanan salah/sedang tidak jalan. Kalau memakai default lokal, pastikan sudah menjalankan "node server/yt-server.js" di terminal.'
      : '';
    err('Gagal menghubungi layanan ekstraksi: '+e.message+hint);
  }
}

function renderPicker(data, originalLink){
  $('#vidContent').style.display = 'none';
  const wrap = $('#pickerWrap');
  wrap.innerHTML = '';
  wrap.style.display = 'flex';
  $('#openOrigLink').href = originalLink; $('#openOrigLink').style.display = '';
  $('#stageInfo').textContent = 'Postingan berisi beberapa item — pilih salah satu untuk dimuat & diunduh.';

  const items = Array.isArray(data.picker) ? data.picker.slice() : [];
  if(data.audio) items.push({type:'audio', url:data.audio, thumb:null, _filename:data.audioFilename});

  items.forEach((it, i) => {
    const row = document.createElement('div'); row.className = 'pickerItem';
    if(it.thumb){
      const img = document.createElement('img'); img.src = it.thumb; row.appendChild(img);
    } else {
      const ph = document.createElement('div'); ph.className = 'ph'; ph.textContent = (it.type||'?').slice(0,4);
      row.appendChild(ph);
    }
    const label = document.createElement('span');
    label.textContent = 'Item '+(i+1)+' · '+(it.type||'berkas');
    row.appendChild(label);
    const btn = document.createElement('button');
    btn.textContent = 'Muat & unduh';
    btn.onclick = async () => {
      wrap.style.display = 'none';
      $('#vidContent').style.display = '';
      await loadVideoFrom(it.url, {suggestedName: it._filename, originalLink});
    };
    row.appendChild(btn);
    wrap.appendChild(row);
  });

  if(!items.length){
    wrap.innerHTML = '<div class="ph-empty">Layanan mengembalikan daftar item kosong.</div>';
  }
}

/* ---------------------------------------------------------------------
   Satu kotak URL, deteksi otomatis: link sosial media -> ekstraksi,
   selain itu -> anggap berkas video langsung.
   --------------------------------------------------------------------- */
$('#btnLoad').onclick = async () => {
  err('');
  const raw = $('#urlInput').value.trim();
  if(!raw) return err('Masukkan URL video terlebih dahulu.');
  let url;
  try{
    url = new URL(raw);
    if(!/^https?:$/.test(url.protocol)) throw new Error('bad-protocol');
  }catch(e){ return err('URL tidak valid. Gunakan URL lengkap berawalan http:// atau https://'); }

  $('#btnLoad').disabled = true;
  if(looksLikePlatformHost(url.hostname)){
    await processViaExtractor(url);
  } else {
    await loadVideoFrom(url.href);
  }
  $('#btnLoad').disabled = false;
};

$('#urlInput').addEventListener('keydown', e => { if(e.key==='Enter') $('#btnLoad').click(); });
