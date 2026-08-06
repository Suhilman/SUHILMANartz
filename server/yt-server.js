#!/usr/bin/env node
/**
 * Server lokal kecil untuk tool YouTube Video Downloader & YouTube to MP3 —
 * menjembatani frontend (public/tools/video-download.js & youtube-to-mp3.js)
 * ke yt-dlp yang terpasang di mesin ini. Node.js bawaan saja (tanpa npm
 * install apa pun); yt-dlp & ffmpeg dipanggil sebagai proses eksternal lewat
 * PATH — port Node.js dari server/../yt-server.py (image-studio) aslinya.
 *
 * Kontrak API meniru bentuk respons Cobalt yang sudah dipahami frontend:
 *   POST /            {"url": "...", "mode": "video"|"audio"} ->
 *                        {"status":"tunnel","url":"...","filename":"..."}
 *                        atau {"status":"error","error":{"code":...}}
 *   GET  /dl/<id>     -> stream berkas hasil unduhan yt-dlp, lalu hapus
 *
 * Jalankan:  node server/yt-server.js [port]
 * Butuh:     yt-dlp (dan ffmpeg untuk merge video+audio) di PATH.
 */
'use strict';

const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn, spawnSync } = require('child_process');

const PORT = parseInt(process.argv[2], 10) || 8765;
const TMPDIR = fs.mkdtempSync(path.join(os.tmpdir(), 'imgstudio-ytdlp-'));
const JOBS = new Map(); // id -> filepath
const DOWNLOAD_TIMEOUT_MS = 600000;

function which(exe) {
  const cmd = process.platform === 'win32' ? 'where' : 'which';
  return spawnSync(cmd, [exe]).status === 0;
}

function sanitizeFilename(name) {
  const cleaned = String(name || 'video').replace(/[\\/:*?"<>|\r\n]+/g, '_').trim();
  return (cleaned || 'video').slice(0, 150);
}

/** Ambil metadata (judul) tanpa mengunduh, buat nama berkas yang rapi. */
function runYtdlpJson(url) {
  return new Promise((resolve) => {
    let out = '';
    let settled = false;
    const finish = (title) => { if (!settled) { settled = true; resolve(title); } };

    const p = spawn('yt-dlp', ['--no-playlist', '--no-warnings', '--skip-download', '-j', url]);
    const timer = setTimeout(() => { p.kill(); finish('video'); }, 60000);

    p.stdout.on('data', (d) => { out += d; });
    p.on('error', () => { clearTimeout(timer); finish('video'); });
    p.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0 && out.trim()) {
        try {
          const info = JSON.parse(out.trim().split('\n')[0]);
          return finish(info.title || 'video');
        } catch { /* fall through */ }
      }
      finish('video');
    });
  });
}

// Kombinasi player client YouTube dicoba berurutan — beberapa video menolak
// client tertentu (butuh PO token, age-gate, dsb.) tapi jalan dengan client
// lain. yt-dlp sendiri sudah auto-fallback sebagian, tapi menetapkan urutan
// eksplisit di sini terbukti menyelamatkan kasus 403 yang lebih keras kepala.
const YT_CLIENT_FALLBACKS = ['android,ios,web', 'tv', 'web_safari', 'mweb'];

/** Unduh (+ merge/convert kalau perlu) ke berkas lokal, coba beberapa player
 * client YouTube berurutan sampai salah satu berhasil. */
function runYtdlpDownload(url, outTemplate, mode) {
  const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
  const attempts = isYoutube ? YT_CLIENT_FALLBACKS : [null];

  return new Promise((resolve) => {
    let lastErr = 'yt-dlp gagal tanpa pesan error.';
    let i = 0;

    const cleanupPartial = () => {
      const base = path.basename(outTemplate).split('.%')[0];
      for (const f of fs.readdirSync(TMPDIR)) {
        if (f.startsWith(base)) { try { fs.unlinkSync(path.join(TMPDIR, f)); } catch { /* ignore */ } }
      }
    };

    const tryNext = () => {
      if (i >= attempts.length) return resolve({ ok: false, err: lastErr });
      const client = attempts[i++];

      const cmd = mode === 'audio'
        ? ['--no-playlist', '--no-warnings', '--no-progress', '--retries', '3', '--fragment-retries', '3',
           '-x', '--audio-format', 'mp3', '--audio-quality', '0']
        : ['--no-playlist', '--no-warnings', '--no-progress', '--retries', '3', '--fragment-retries', '3',
           '-f', 'b[ext=mp4]/bv*[ext=mp4]+ba[ext=m4a]/b/bv*+ba', '--merge-output-format', 'mp4'];
      if (client) cmd.push('--extractor-args', 'youtube:player_client=' + client);
      cmd.push('-o', outTemplate, url);

      const p = spawn('yt-dlp', cmd);
      let stderr = '';
      const timer = setTimeout(() => {
        p.kill();
        lastErr = 'Melebihi batas waktu (' + (DOWNLOAD_TIMEOUT_MS / 1000) + 's).';
        resolve({ ok: false, err: lastErr }); // timeout tidak akan membaik dengan ganti client, hentikan
      }, DOWNLOAD_TIMEOUT_MS);

      p.stderr.on('data', (d) => { stderr += d; });
      p.on('error', () => {
        clearTimeout(timer);
        resolve({ ok: false, err: 'yt-dlp tidak ditemukan di PATH.' });
      });
      p.on('close', (code) => {
        clearTimeout(timer);
        if (code === 0) return resolve({ ok: true, err: '' });
        lastErr = stderr.trim().split('\n').slice(-6).join('\n') || lastErr;
        cleanupPartial();
        tryNext();
      });
    };
    tryNext();
  });
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
}

function sendJson(res, obj, status = 200) {
  const body = JSON.stringify(obj);
  cors(res);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

const MIME = { mp4: 'video/mp4', webm: 'video/webm', mkv: 'video/x-matroska', m4a: 'audio/mp4', mp3: 'audio/mpeg' };

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, 'http://localhost');

  if (req.method === 'OPTIONS') {
    cors(res);
    res.writeHead(204);
    return res.end();
  }

  if (req.method === 'GET' && reqUrl.pathname.startsWith('/dl/')) {
    const jobId = reqUrl.pathname.slice('/dl/'.length);
    const filepath = JOBS.get(jobId);
    if (!filepath || !fs.existsSync(filepath)) {
      return sendJson(res, { status: 'error', error: { code: 'error.local.not_found' } }, 404);
    }
    const size = fs.statSync(filepath).size;
    const ext = path.extname(filepath).slice(1).toLowerCase() || 'mp4';
    cors(res);
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': size,
      'Content-Disposition': `attachment; filename="${path.basename(filepath)}"`,
    });
    const stream = fs.createReadStream(filepath);
    stream.pipe(res);
    const cleanup = () => {
      JOBS.delete(jobId);
      fs.unlink(filepath, () => {});
    };
    stream.on('close', cleanup);
    stream.on('error', cleanup);
    return;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/') {
    let raw = '';
    req.on('data', (c) => { raw += c; });
    req.on('end', async () => {
      let payload;
      try { payload = JSON.parse(raw || '{}'); }
      catch { return sendJson(res, { status: 'error', error: { code: 'error.local.bad_request' } }, 400); }

      const targetUrl = String(payload.url || '').trim();
      const mode = payload.mode === 'audio' ? 'audio' : 'video';
      if (!targetUrl || !/^https?:\/\//.test(targetUrl)) {
        return sendJson(res, { status: 'error', error: { code: 'error.api.link.invalid' } });
      }
      if (!which('yt-dlp')) {
        return sendJson(res, {
          status: 'error',
          error: { code: 'error.local.ytdlp_missing', context: { message: 'yt-dlp tidak ditemukan di server lokal.' } },
        });
      }

      const jobId = crypto.randomUUID();
      const title = await runYtdlpJson(targetUrl);
      const outTemplate = path.join(TMPDIR, jobId + '.%(ext)s');
      const { ok, err } = await runYtdlpDownload(targetUrl, outTemplate, mode);
      if (!ok) {
        return sendJson(res, { status: 'error', error: { code: 'error.local.ytdlp_failed', context: { message: err } } });
      }

      const matches = fs.readdirSync(TMPDIR).filter((f) => f.startsWith(jobId + '.'));
      if (!matches.length) {
        return sendJson(res, { status: 'error', error: { code: 'error.local.output_missing' } });
      }
      const filepath = path.join(TMPDIR, matches[0]);
      JOBS.set(jobId, filepath);
      const ext = path.extname(filepath).slice(1) || 'mp4';
      const filename = sanitizeFilename(title) + '.' + ext;

      const host = req.headers.host || `127.0.0.1:${PORT}`;
      sendJson(res, { status: 'tunnel', url: `http://${host}/dl/${jobId}`, filename });
    });
    return;
  }

  sendJson(res, { status: 'error', error: { code: 'error.local.unknown_endpoint' } }, 404);
});

if (!which('yt-dlp')) {
  console.warn('PERINGATAN: yt-dlp tidak ditemukan di PATH. Endpoint ekstraksi akan selalu gagal.');
}

server.listen(PORT, '127.0.0.1', () => {
  console.log(`yt-server (Node) jalan di http://127.0.0.1:${PORT}`);
  console.log('Buka halaman "YouTube Video Downloader" / "YouTube to MP3" di SUHILMANartz — frontend-nya sudah otomatis memanggil origin ini.');
});

process.on('SIGINT', () => process.exit(0));
