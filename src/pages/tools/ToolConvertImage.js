import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import {
  FaFileImage, FaCloudUploadAlt, FaBolt, FaDownload, FaSpinner,
} from 'react-icons/fa';

import ToolShell from '../../components/tools/ToolShell';
import {
  Workspace, Sidebar, Stage, Panel, PanelTitle, Field, FieldLabel,
  Dropzone, DropIcon, DropTitle, DropHint, DropFormats,
  Select, Range, Toolbar,
  ViewportFrame, Badge, BusyOverlay, ProgressBar, ErrorText, Hint,
  Btn, BtnGhost, FloatPanel,
} from '../../components/tools/ToolUI';
import { imageDataToBmp, pngToIco } from './lib/bmpIco';

/* =====================================================================
   Image Converter — port of the standalone image-studio tool
   (imageconvert.html / imageconvert.js). Decoding relies on the
   browser's native <img> pipeline (PNG/JPEG/WebP/GIF/BMP/SVG/AVIF, plus
   HEIC/HEIF natively on Safari). Encoding to PNG/JPEG/WebP goes through
   <canvas>; BMP & ICO are written by hand below (see lib/bmpIco.js) —
   no third-party library involved. The ONLY piece that reaches the
   network is the HEIC/HEIF fallback decoder (libheif.js from a CDN),
   and only when the browser's native decode of a HEIC file fails.
   100% client-side otherwise.
   ===================================================================== */

const FMT_LABELS = {
  png: 'PNG', jpeg: 'JPEG', webp: 'WebP', gif: 'GIF', bmp: 'BMP', svg: 'SVG',
  avif: 'AVIF', ico: 'ICO', tiff: 'TIFF', heic: 'HEIC/HEIF',
};
const EXT_MAP = {
  png: 'png', jpg: 'jpeg', jpeg: 'jpeg', jpe: 'jpeg', webp: 'webp', gif: 'gif',
  bmp: 'bmp', svg: 'svg', svgz: 'svg', avif: 'avif', ico: 'ico',
  tif: 'tiff', tiff: 'tiff', heic: 'heic', heif: 'heic',
};
const TARGET_FORMATS = [
  { key: 'png', label: 'PNG' },
  { key: 'jpeg', label: 'JPEG' },
  { key: 'webp', label: 'WebP' },
  { key: 'bmp', label: 'BMP' },
  { key: 'ico', label: 'ICO (icon)', wide: true },
];
const ICO_SIZES = [16, 32, 48, 64, 128, 256];

function detectFormat(file) {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (EXT_MAP[ext]) return EXT_MAP[ext];
  if (file.type && file.type.startsWith('image/')) return file.type.slice(6);
  return 'unknown';
}
function formatBytes(n) {
  return n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(2)} MB`;
}
function targetHintFor(t) {
  return {
    png: 'Lossless, larger file size, transparency preserved.',
    jpeg: 'Small file size, transparency is lost (flattened onto white).',
    webp: 'Modern compression — usually smaller than JPEG at equal quality, transparency preserved.',
    bmp: 'No compression (large file size), transparency is lost (flattened onto white).',
    ico: 'Single-size square icon, PNG wrapped in an ICO container, transparency preserved.',
  }[t] || '';
}
function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}
function looksLikeImage(file) {
  return file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|svg|avif|heic|heif|tiff?)$/i.test(file.name);
}

const ToolConvertImage = () => {
  const [file, setFile] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState('image');
  const [srcFormat, setSrcFormat] = useState(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [sizeBytes, setSizeBytes] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [target, setTarget] = useState(null);
  const [quality, setQuality] = useState(92);
  const [icoSize, setIcoSize] = useState(256);
  const [convertedBlob, setConvertedBlob] = useState(null);
  const [convertedExt, setConvertedExt] = useState(null);
  const [outInfo, setOutInfo] = useState('');
  const [error, setError] = useState('');

  const [dragOver, setDragOver] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyText, setBusyText] = useState('');
  const [busyPct, setBusyPct] = useState(0);

  const fileInputRef = useRef(null);
  const sourceElRef = useRef(null);      // HTMLImageElement or HTMLCanvasElement used as drawImage() source
  const objectUrlRef = useRef(null);     // blob: URL backing the current preview (revoked on swap/unmount)
  const busyIntervalRef = useRef(null);
  const libheifLoadPromiseRef = useRef(null);
  const libheifModulePromiseRef = useRef(null);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    if (busyIntervalRef.current) clearInterval(busyIntervalRef.current);
  }, []);

  /* ---------- busy overlay (used only for the HEIC/CDN decode path) ---------- */
  const startBusy = useCallback((text) => {
    clearInterval(busyIntervalRef.current);
    setBusy(true);
    setBusyText(text);
    setBusyPct(8);
    busyIntervalRef.current = setInterval(() => {
      setBusyPct((p) => Math.min(92, p + (92 - p) * 0.08 + 1));
    }, 200);
  }, []);
  const stopBusy = useCallback(() => {
    clearInterval(busyIntervalRef.current);
    busyIntervalRef.current = null;
    setBusyPct(100);
    setTimeout(() => { setBusy(false); setBusyPct(0); }, 150);
  }, []);

  const resetUI = useCallback(() => {
    setLoaded(false);
    setFile(null);
    setSrcFormat(null);
    setWidth(0); setHeight(0); setSizeBytes(0);
    if (objectUrlRef.current) { URL.revokeObjectURL(objectUrlRef.current); objectUrlRef.current = null; }
    setPreviewUrl(null);
    sourceElRef.current = null;
    setTarget(null);
    setConvertedBlob(null); setConvertedExt(null); setOutInfo('');
  }, []);

  const finalizeSource = useCallback((f, fmt, sourceEl, w, h) => {
    setFile(f);
    setName(f.name.replace(/\.[^.]+$/, '') || 'image');
    setSrcFormat(fmt);
    setSizeBytes(f.size);
    sourceElRef.current = sourceEl;
    setWidth(w); setHeight(h);
    setLoaded(true);
    setTarget(null);
    setConvertedBlob(null); setConvertedExt(null); setOutInfo(''); setError('');
  }, []);

  /* ---------- HEIC/HEIF fallback decoder (libheif.js from a CDN) ----------
     Only ever loaded if the browser's native <img> decode of a HEIC file
     fails. Safari (which has native HEIC support) never touches this. */
  const loadLibheif = useCallback(() => {
    if (window.libheif) return Promise.resolve();
    if (libheifLoadPromiseRef.current) return libheifLoadPromiseRef.current;
    libheifLoadPromiseRef.current = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/libheif-js@1.19.8/libheif-wasm/libheif-bundle.js';
      s.onload = () => resolve();
      s.onerror = () => {
        libheifLoadPromiseRef.current = null;
        reject(new Error('Failed to load libheif.js from the CDN — check your internet connection.'));
      };
      document.head.appendChild(s);
    });
    return libheifLoadPromiseRef.current;
  }, []);

  const getLibheifModule = useCallback(async () => {
    await loadLibheif();
    /* window.libheif is an Emscripten factory (not a module object itself) —
       it must be called and awaited before HeifDecoder becomes available. */
    if (!libheifModulePromiseRef.current) libheifModulePromiseRef.current = window.libheif();
    return libheifModulePromiseRef.current;
  }, [loadLibheif]);

  const decodeHeicToCanvas = useCallback(async (f) => {
    const mod = await getLibheifModule();
    const buf = new Uint8Array(await f.arrayBuffer());
    const decoder = new mod.HeifDecoder();
    const images = decoder.decode(buf);
    if (!images || !images.length) throw new Error('No image could be decoded from this HEIC file.');
    const image = images[0];
    const w = image.get_width(), h = image.get_height();
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const cx = canvas.getContext('2d');
    const imageData = cx.createImageData(w, h);
    await new Promise((resolve, reject) => {
      image.display(imageData, (displayData) => {
        if (!displayData) return reject(new Error('Failed to process HEIF pixel data (libheif).'));
        resolve();
      });
    });
    cx.putImageData(imageData, 0, 0);
    return { canvas, width: w, height: h };
  }, [getLibheifModule]);

  const loadFile = useCallback((f) => {
    setError('');
    const fmt = detectFormat(f);
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = url;
      setPreviewUrl(url);
      finalizeSource(f, fmt, img, img.naturalWidth, img.naturalHeight);
    };
    img.onerror = async () => {
      URL.revokeObjectURL(url);
      if (fmt === 'heic') {
        startBusy('This browser can’t decode HEIC natively — loading the HEIF decoder from a CDN (libheif.js, ~1.4 MB, needs internet)…');
        try {
          const { canvas, width: w, height: h } = await decodeHeicToCanvas(f);
          setError('');
          setPreviewUrl(canvas.toDataURL('image/png'));
          finalizeSource(f, fmt, canvas, w, h);
        } catch (e) {
          setError('Failed to decode HEIC: ' + e.message);
          resetUI();
        } finally {
          stopBusy();
        }
        return;
      }
      setError('Failed to load image — this format isn’t supported by your browser.');
      resetUI();
    };
    img.src = url;
  }, [finalizeSource, resetUI, startBusy, stopBusy, decodeHeicToCanvas]);

  const handleFile = useCallback((f) => {
    if (!looksLikeImage(f)) { setError('This doesn’t look like an image file: ' + f.name); return; }
    loadFile(f);
  }, [loadFile]);

  const onInputChange = useCallback((e) => {
    const f = e.target.files && e.target.files[0];
    if (f) handleFile(f);
    e.target.value = '';
  }, [handleFile]);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const selectTarget = useCallback((t) => {
    if (t === srcFormat) return;
    setTarget(t);
    setConvertedBlob(null); setConvertedExt(null); setOutInfo('');
  }, [srcFormat]);

  const onQualityChange = useCallback((e) => {
    setQuality(+e.target.value);
    setConvertedBlob(null); setConvertedExt(null);
  }, []);
  const onIcoSizeChange = useCallback((e) => {
    setIcoSize(+e.target.value);
    setConvertedBlob(null); setConvertedExt(null);
  }, []);

  const handleConvert = useCallback(async () => {
    setError('');
    try {
      if (!target) throw new Error('Choose a target format first.');
      let w = width, h = height;
      if (target === 'ico') { w = icoSize; h = icoSize; }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const cx = canvas.getContext('2d');
      if (target === 'jpeg' || target === 'bmp') { cx.fillStyle = '#fff'; cx.fillRect(0, 0, w, h); }
      cx.drawImage(sourceElRef.current, 0, 0, w, h);

      let blob, ext;
      if (target === 'png') {
        blob = await canvasToBlob(canvas, 'image/png'); ext = 'png';
      } else if (target === 'jpeg') {
        blob = await canvasToBlob(canvas, 'image/jpeg', quality / 100); ext = 'jpg';
      } else if (target === 'webp') {
        blob = await canvasToBlob(canvas, 'image/webp', quality / 100);
        if (!blob) throw new Error('This browser doesn’t support exporting WebP.');
        ext = 'webp';
      } else if (target === 'bmp') {
        blob = new Blob([imageDataToBmp(cx.getImageData(0, 0, w, h))], { type: 'image/bmp' }); ext = 'bmp';
      } else if (target === 'ico') {
        const pngBlob = await canvasToBlob(canvas, 'image/png');
        const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
        blob = new Blob([pngToIco(pngBytes, w, h)], { type: 'image/x-icon' }); ext = 'ico';
      } else {
        throw new Error('Choose a target format first.');
      }

      setConvertedBlob(blob); setConvertedExt(ext);
      setOutInfo(`Ready to download: ${name}.${ext} · ${formatBytes(blob.size)}`);
    } catch (e) {
      setError('Conversion failed: ' + e.message);
    }
  }, [target, width, height, icoSize, quality, name]);

  const handleSave = useCallback(() => {
    if (!convertedBlob) return;
    const a = document.createElement('a');
    const url = URL.createObjectURL(convertedBlob);
    a.href = url; a.download = `${name}.${convertedExt}`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }, [convertedBlob, convertedExt, name]);

  return (
    <ToolShell
      activeKey="convertimg"
      title="Image Converter"
      icon={<FaFileImage />}
      subtitle="PNG · JPEG · WebP · BMP · ICO — decode almost anything the browser supports"
    >
      <Workspace>
        <Sidebar>
          <Panel>
            <PanelTitle>1 · Source image</PanelTitle>
            <Dropzone
              htmlFor="convertImgFile"
              over={dragOver ? 1 : 0}
              onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
              onDrop={onDrop}
            >
              <DropIcon><FaCloudUploadAlt /></DropIcon>
              <DropTitle>{file ? file.name : 'Choose or drop an image'}</DropTitle>
              <DropHint>Click to browse, or drag &amp; drop</DropHint>
              <DropFormats>PNG · JPG · WEBP · GIF · BMP · SVG · AVIF · HEIC</DropFormats>
            </Dropzone>
            <input
              ref={fileInputRef}
              id="convertImgFile"
              type="file"
              accept="image/*"
              hidden
              onChange={onInputChange}
            />
          </Panel>

          {loaded && (
            <Panel>
              <PanelTitle>2 · Detected format</PanelTitle>
              <FieldLabel>Source <b>{FMT_LABELS[srcFormat] || srcFormat}</b></FieldLabel>
              <FieldLabel>Dimensions <b>{width} × {height} px</b></FieldLabel>
              <FieldLabel>File size <b>{formatBytes(sizeBytes)}</b></FieldLabel>
            </Panel>
          )}

          {loaded && (
            <Panel>
              <PanelTitle>3 · Target format</PanelTitle>
              <FormatGrid>
                {TARGET_FORMATS.map((f) => {
                  const disabled = f.key === srcFormat;
                  return (
                    <FormatBtn
                      key={f.key}
                      type="button"
                      wide={f.wide ? 1 : 0}
                      active={target === f.key ? 1 : 0}
                      disabled={disabled}
                      title={disabled ? 'Same as source format' : ''}
                      onClick={() => selectTarget(f.key)}
                    >
                      {f.label}
                    </FormatBtn>
                  );
                })}
              </FormatGrid>

              {(target === 'jpeg' || target === 'webp') && (
                <Field style={{ marginTop: 10 }}>
                  <FieldLabel>Quality <b>{quality}</b></FieldLabel>
                  <Range type="range" min={1} max={100} step={1} value={quality} onChange={onQualityChange} />
                </Field>
              )}

              {target === 'ico' && (
                <Field style={{ marginTop: 10 }}>
                  <FieldLabel>Icon size</FieldLabel>
                  <Select value={icoSize} onChange={onIcoSizeChange}>
                    {ICO_SIZES.map((s) => <option key={s} value={s}>{s} × {s}</option>)}
                  </Select>
                </Field>
              )}

              {target && <Hint>{targetHintFor(target)}</Hint>}
            </Panel>
          )}

          <Panel>
            <PanelTitle>Supported</PanelTitle>
            <Hint>
              Read: anything the browser can decode (PNG, JPEG, WebP, GIF, BMP, SVG, AVIF), plus HEIC/HEIF
              — native on Safari, or via the libheif.js decoder from a CDN (~1.4 MB, loaded once, needs
              internet) on other browsers.
            </Hint>
            <Hint>
              Written: PNG, JPEG &amp; WebP through the browser&apos;s built-in &lt;canvas&gt;; BMP &amp;
              ICO are hand-written right in this tool (no external library).
            </Hint>
            <Hint>
              Transparency is lost when converting to JPEG/BMP (flattened onto white) — other formats keep it.
            </Hint>
          </Panel>
        </Sidebar>

        <Stage>
          <Toolbar>
            <span>{loaded ? `Preview: ${FMT_LABELS[srcFormat] || srcFormat}` : 'No image loaded yet.'}</span>
            <Spacer />
            {loaded && <span>{width}×{height} px · {formatBytes(sizeBytes)}</span>}
          </Toolbar>

          <ViewportFrame>
            {previewUrl ? (
              <PreviewImg src={previewUrl} alt={file ? file.name : 'preview'} />
            ) : (
              <Placeholder>Load an image to preview it here.</Placeholder>
            )}
            {loaded && <Badge>{FMT_LABELS[srcFormat] || srcFormat}</Badge>}

            <BusyOverlay on={busy}>
              <SpinnerIcon><FaSpinner /></SpinnerIcon>
              <div>{busyText}</div>
              <ProgressBar p={busyPct}><i /></ProgressBar>
            </BusyOverlay>

            {loaded && (
              <FloatPanel>
                <FloatHead>
                  <FaBolt />
                  <FloatTitle>Convert &amp; save</FloatTitle>
                  <MinBtn type="button" onClick={() => setMinimized((m) => !m)} title="Hide / show">
                    {minimized ? '+' : '–'}
                  </MinBtn>
                </FloatHead>
                {!minimized && (
                  <FloatBody>
                    <Btn type="button" disabled={!target} onClick={handleConvert}>
                      <FaBolt /> Convert
                    </Btn>
                    <BtnGhost type="button" disabled={!convertedBlob} onClick={handleSave} style={{ marginTop: 8 }}>
                      <FaDownload /> Download result
                    </BtnGhost>
                    {outInfo && <Hint>{outInfo}</Hint>}
                    {error && <ErrorText>{error}</ErrorText>}
                  </FloatBody>
                )}
              </FloatPanel>
            )}
          </ViewportFrame>
        </Stage>
      </Workspace>
    </ToolShell>
  );
};

export default ToolConvertImage;

/* ---------- tool-specific styled bits (kept local, same design tokens) ---------- */

const Spacer = styled.div`flex: 1;`;

const SpinnerIcon = styled.div`
  font-size: 22px;
  color: var(--accent-1);
  animation: spin-slow 1s linear infinite;
`;

const FormatGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const FormatBtn = styled.button`
  grid-column: ${({ wide }) => (wide ? '1 / 3' : 'auto')};
  border: 1px solid ${({ active }) => (active ? 'var(--accent-1)' : 'var(--glass-border-strong)')};
  background: ${({ active }) => (active ? 'var(--button-background-color)' : 'var(--card-bg-solid)')};
  color: ${({ active }) => (active ? 'var(--tittle-color)' : 'var(--text-color)')};
  border-radius: 10px;
  padding: 10px 6px;
  font: inherit;
  font-size: 12.5px;
  font-weight: ${({ active }) => (active ? 650 : 500)};
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
  &:hover:not(:disabled) { border-color: var(--accent-1); }
  &:disabled { opacity: 0.35; cursor: not-allowed; }
`;

const PreviewImg = styled.img`
  max-width: 100%;
  max-height: 100%;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  border-radius: 4px;
  display: block;
`;

const Placeholder = styled.div`
  color: var(--text-muted);
  font-style: italic;
  font-size: 13px;
`;

const FloatHead = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  color: var(--tittle-color);
  svg { font-size: 13px; flex-shrink: 0; }
`;

const FloatTitle = styled.h2`
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--text-muted);
  margin: 0;
  flex: 1;
`;

const MinBtn = styled.button`
  border: 1px solid var(--glass-border-strong);
  background: var(--card-bg-solid);
  color: var(--text-color);
  border-radius: 6px;
  width: 22px; height: 22px;
  line-height: 1;
  font: inherit;
  cursor: pointer;
  flex-shrink: 0;
  &:hover { border-color: var(--accent-1); }
`;

const FloatBody = styled.div``;
