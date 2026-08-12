/**
 * Shared vector-PDF toolkit for cv.js / portfolio.js.
 *
 * Why this exists: html2canvas (used by the old html2pdf.js pipeline) cannot
 * render `background-clip:text` gradient headings — it paints the gradient as
 * a solid box with opaque text on top instead of clipping it, and switching
 * html2canvas to `foreignObjectRendering` (which WOULD render gradient text
 * correctly) breaks the CSS Grid layout both documents rely on everywhere.
 * So instead of rasterizing the HTML at all, we draw the PDF natively:
 *  - plain text, rules, borders -> real vector jsPDF primitives (crisp, tiny)
 *  - gradients (text, bars, rings, glows) -> pre-rendered on an offscreen
 *    canvas (real Canvas2D gradients, pixel-accurate) and placed as images
 * Both documents' on-screen HTML/CSS is untouched; this only feeds the
 * Download PDF button, so this file is the single design source for PDFs.
 */

const JSPDF_SRC = new URL('../vendor/jspdf.umd.min.js', import.meta.url).href;
const FONTS_BASE = new URL('../fonts/', import.meta.url).href;
const PAGE_ASSET_BASE = new URL('../', import.meta.url).href; // public/ root, for suhilman.jpg

export const PX_MM = 25.4 / 96; // 1 css px (96dpi) in mm
export const mm = (px) => px * PX_MM;
export const pt = (px) => px * 0.75; // 1 css px (96dpi) in pt

// Raster chips are rendered at ~300dpi so they stay crisp at full A4 size / print.
const CHIP_PX_PER_MM = 300 / 25.4;

export const COLORS = {
  dark: '#07070d', dark2: '#11111c', dark3: '#13131f',
  cyan: '#00f0ff', violet: '#b14aff', pink: '#ff5b94',
  text: '#0f172a', muted: '#475569', hairline: '#e2e8f0',
  whiteT: '#e8e9f3', mutedDark: '#8b8da3',
  green: '#22c55e',
};

// Both --gradient and --gradient-2 in the CSS are 135deg.
export const GRADIENT_ANGLE = 135;
export const GRADIENT = [
  { stop: 0, color: '#00f0ff' },
  { stop: 0.5, color: '#b14aff' },
  { stop: 1, color: '#ff5b94' },
];
export const GRADIENT_2 = [
  { stop: 0, color: '#00f0ff' },
  { stop: 1, color: '#b14aff' },
];
export const CONIC_RING = ['#00f0ff', '#b14aff', '#ff5b94', '#00f0ff'];

const FONT_FILES = {
  'body:regular': 'Inter-Regular.ttf',
  'body:medium': 'Inter-Medium.ttf',
  'body:semibold': 'Inter-SemiBold.ttf',
  'body:bold': 'Inter-Bold.ttf',
  'display:bold': 'SpaceGrotesk-Bold.ttf',
  'mono:regular': 'JetBrainsMono-Regular.ttf',
  'mono:medium': 'JetBrainsMono-Medium.ttf',
  'mono:bold': 'JetBrainsMono-Bold.ttf',
};
const CANVAS_FAMILY = { body: 'PdfKitInter', display: 'PdfKitSpaceGrotesk', mono: 'PdfKitJetBrainsMono' };
const CANVAS_WEIGHT = { regular: '400', medium: '500', semibold: '600', bold: '700' };

const jsPdfNameOf = (family, weight) => `${family}-${weight}`;

// ---- module-level caches so CV + Portfolio in one session share work ----
let jsPdfCtorPromise = null;
const ttfBase64Cache = new Map(); // key -> base64 string
const fontFaceReady = new Map(); // key -> Promise
const imageCache = new Map(); // url -> Promise<HTMLImageElement>

export async function loadJsPDF() {
  if (!jsPdfCtorPromise) {
    jsPdfCtorPromise = new Promise((resolve, reject) => {
      if (window.jspdf && window.jspdf.jsPDF) { resolve(window.jspdf.jsPDF); return; }
      const s = document.createElement('script');
      s.src = JSPDF_SRC;
      s.onload = () => resolve(window.jspdf.jsPDF);
      s.onerror = () => reject(new Error('Gagal memuat jsPDF'));
      document.head.appendChild(s);
    });
  }
  return jsPdfCtorPromise;
}

function bufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

async function ttfBase64(key) {
  if (!ttfBase64Cache.has(key)) {
    const file = FONT_FILES[key];
    const promise = fetch(`${FONTS_BASE}${file}`)
      .then((r) => r.arrayBuffer())
      .then(bufferToBase64);
    ttfBase64Cache.set(key, promise);
  }
  return ttfBase64Cache.get(key);
}

/** Registers every weight this kit knows about into a fresh jsPDF document instance
 *  (VFS/fonts are per-instance) and, in parallel, as browser FontFaces so canvas
 *  gradient-text chips render with the identical glyphs. */
export async function loadFonts(doc) {
  const keys = Object.keys(FONT_FILES);
  await Promise.all(
    keys.map(async (key) => {
      const [family, weight] = key.split(':');
      const b64 = await ttfBase64(key);
      const file = FONT_FILES[key];
      doc.addFileToVFS(file, b64);
      doc.addFont(file, jsPdfNameOf(family, weight), 'normal');

      if (!fontFaceReady.has(key)) {
        const ff = new FontFace(CANVAS_FAMILY[family], `url(${FONTS_BASE}${file})`, {
          weight: CANVAS_WEIGHT[weight],
        });
        fontFaceReady.set(
          key,
          ff.load().then((loaded) => { document.fonts.add(loaded); })
        );
      }
      await fontFaceReady.get(key);
    })
  );
}

export function setFont(doc, family, weight, px) {
  doc.setFont(jsPdfNameOf(family, weight), 'normal');
  doc.setFontSize(pt(px));
}

export function setCharSpacingEm(doc, em, px) {
  doc.setCharSpace(em ? mm(em * px) : 0);
}

function charWidthsMm(doc, str) {
  // doc.getTextWidth() already returns a value in the document's unit (mm here).
  return str.split('').map((ch) => doc.getTextWidth(ch));
}

/** Width of `str` in mm at the doc's *currently set* font/size, including manual letter-spacing. */
export function measureMm(doc, str, letterSpacingMm = 0) {
  const widths = charWidthsMm(doc, str);
  const base = widths.reduce((a, b) => a + b, 0);
  return base + letterSpacingMm * Math.max(0, str.length - 1);
}

// Approximate ascent-to-font-size ratio (Inter/Space Grotesk/JetBrains Mono are all
// close to this at normal weights) — used everywhere we convert a CSS box's *top*
// edge into the baseline jsPDF actually draws text on.
export const BASELINE_RATIO = 0.8;

/**
 * Draw a single line of text with manual letter-spacing & alignment (we avoid jsPDF's
 * built-in `align` option combined with setCharSpace — the two don't reliably compose).
 * `ymm` is the text BASELINE. Prefer `textTop` when authoring layout top-down.
 */
export function text(doc, str, xmm, ymm, opts = {}) {
  const {
    family = 'body', weight = 'regular', px = 12, color = COLORS.text,
    letterSpacingEm = 0, align = 'left',
  } = opts;
  setFont(doc, family, weight, px);
  const spacingMm = mm(letterSpacingEm * px);
  doc.setCharSpace(spacingMm);
  doc.setTextColor(color);

  const w = measureMm(doc, str, spacingMm);
  let x = xmm;
  if (align === 'center') x = xmm - w / 2;
  else if (align === 'right') x = xmm - w;

  doc.text(str, x, ymm);
  doc.setCharSpace(0);
  return w;
}

/**
 * Single line of text positioned by the TOP of its CSS box (like everything else in
 * cv.js/portfolio.js's layout cursor) instead of its baseline. Returns the box's
 * bottom y — `topYmm + mm(px * lineHeightRatio)` — so callers can chain `y = textTop(...)`.
 */
export function textTop(doc, str, xmm, topYmm, opts = {}) {
  const { px = 12, lineHeightRatio = 1 } = opts;
  text(doc, str, xmm, topYmm + mm(px * BASELINE_RATIO), opts);
  return topYmm + mm(px * lineHeightRatio);
}

// A glyph's visual weight isn't centered on its own baseline — most of a lowercase
// letter's ink sits above it, with only descenders (g, y, p) below — so centering a
// pill/chip/badge on the *box* requires nudging the baseline this far below the box's
// literal vertical center. Used by every fixed-height pill (tech chips, pin badges,
// project tags) instead of each one guessing its own offset.
const CENTER_BELOW_RATIO = 0.28;

/** Single line of text vertically centered in a box of height `boxHmm` starting at `boxTopYmm`. */
export function textCenterY(doc, str, xmm, boxTopYmm, boxHmm, opts = {}) {
  const { px = 12 } = opts;
  const baselineY = boxTopYmm + boxHmm / 2 + mm(px * CENTER_BELOW_RATIO);
  return text(doc, str, xmm, baselineY, opts);
}

/**
 * Word-wrap loop shared by textBlock (draw=true) and measureBlockHeight (draw=false)
 * so the two can never disagree about how many lines a string wraps to — they used to
 * be separate implementations and drifted apart (measureBlockHeight didn't know about
 * the long-word char-split fallback below, so it under-counted wrapped emails/URLs and
 * badges/rows sized from it overlapped the next element).
 *
 * Matches CSS `word-break:break-word`: a single "word" (e.g. an email address or URL
 * with no spaces) that alone exceeds maxWidthMm gets split mid-word instead of
 * overflowing — this matters for the contact-list columns, narrower than
 * "Suhilman.sch@gmail.com" at normal weight.
 */
function wrapAndFlow(doc, str, xmm, topYmm, maxWidthMm, opts, draw) {
  const { lineHeightPx, px = 12 } = opts;
  setFont(doc, opts.family || 'body', opts.weight || 'regular', px);
  const lh = mm(lineHeightPx || px * 1.4);
  const words = str.split(/\s+/).filter(Boolean);
  let line = '';
  let top = topYmm;
  const flush = () => {
    if (line) {
      if (draw) text(doc, line, xmm, top + mm(px * BASELINE_RATIO), opts);
      top += lh;
      line = '';
    }
  };
  const breakLongWord = (word) => {
    let chunk = '';
    for (const ch of word) {
      const attempt = chunk + ch;
      if (measureMm(doc, attempt) > maxWidthMm && chunk) {
        line = chunk;
        flush();
        chunk = ch;
      } else {
        chunk = attempt;
      }
    }
    return chunk; // leftover remainder, becomes the start of `line` for what follows
  };
  for (const word of words) {
    const attempt = line ? `${line} ${word}` : word;
    if (measureMm(doc, attempt) <= maxWidthMm) {
      line = attempt;
      continue;
    }
    if (line) flush();
    line = measureMm(doc, word) > maxWidthMm ? breakLongWord(word) : word;
  }
  flush();
  return top;
}

/** Word-wrap plain text (single style) into lines <= maxWidthMm; `topYmm` is the block's top edge. Returns the bottom y. */
export function textBlock(doc, str, xmm, topYmm, maxWidthMm, opts = {}) {
  return wrapAndFlow(doc, str, xmm, topYmm, maxWidthMm, opts, true);
}

/**
 * Dry-run of textBlock's exact wrap loop, without drawing — for when the caller needs
 * the wrapped height BEFORE it can draw something behind the text (e.g. a badge
 * background, or a multi-column row sized to its tallest cell). Ignores weight
 * (assumes it won't change the line count), so it's fine for mixed-weight strings too
 * as long as the weights are close in width (e.g. a short bold lead-in + regular body).
 */
export function measureBlockHeight(doc, str, maxWidthMm, opts = {}) {
  return wrapAndFlow(doc, str, 0, 0, maxWidthMm, opts, false);
}

/**
 * Rich text flow: segments = [{ str, weight, color }] rendered as one continuous
 * word-wrapped paragraph (mixed bold/regular runs), matching e.g. the CV's Profile
 * paragraph or a job bullet ("**Lead-in:** rest of the sentence"). `topYmm` is the
 * paragraph's top edge; returns the top of the next box.
 */
export function richTextBlock(doc, segments, xmm, topYmm, maxWidthMm, opts = {}) {
  const { family = 'body', px = 12, lineHeightPx, baseColor = COLORS.text } = opts;
  const lh = mm(lineHeightPx || px * 1.4);
  const baselineOffset = mm(px * BASELINE_RATIO);
  const tokens = [];
  segments.forEach((seg) => {
    seg.str.split(/(\s+)/).forEach((chunk) => {
      if (chunk === '') return;
      tokens.push({ text: chunk, weight: seg.weight || 'regular', color: seg.color || baseColor });
    });
  });

  let x = xmm;
  let top = topYmm;
  let lineTokens = [];

  const flushLine = () => {
    // Trim a single trailing whitespace token so lines don't overshoot on the wrap point.
    while (lineTokens.length && /^\s+$/.test(lineTokens[lineTokens.length - 1].text)) lineTokens.pop();
    let cx = xmm;
    const baseline = top + baselineOffset;
    lineTokens.forEach((tk) => {
      setFont(doc, family, tk.weight, px);
      doc.setTextColor(tk.color);
      doc.text(tk.text, cx, baseline);
      cx += measureMm(doc, tk.text);
    });
    lineTokens = [];
    x = xmm;
    top += lh;
  };

  tokens.forEach((tk) => {
    setFont(doc, family, tk.weight, px);
    const w = measureMm(doc, tk.text);
    if (x + w > xmm + maxWidthMm && !/^\s+$/.test(tk.text) && lineTokens.length) {
      flushLine();
    }
    lineTokens.push(tk);
    x += w;
  });
  if (lineTokens.length) flushLine();
  return top;
}

// ---------------------------------------------------------------------------
// Raster chips (gradients, rings, glows) — real Canvas2D, pasted as PDF images
// ---------------------------------------------------------------------------

function makeCanvas(wPx, hPx) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(wPx));
  c.height = Math.max(1, Math.round(hPx));
  return c;
}

/** Endpoints for a CSS `linear-gradient(angleDeg, ...)` over a w x h box. */
function cssAngleGradient(ctx, angleDeg, w, h) {
  const rad = (angleDeg * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);
  const len = Math.abs(w * dx) + Math.abs(h * dy);
  const cx = w / 2;
  const cy = h / 2;
  const x0 = cx - (dx * len) / 2;
  const y0 = cy - (dy * len) / 2;
  const x1 = cx + (dx * len) / 2;
  const y1 = cy + (dy * len) / 2;
  const grad = ctx.createLinearGradient(x0, y0, x1, y1);
  return grad;
}

function pathRoundedRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** A wmm x hmm rectangle (optionally rounded) filled with an angled linear gradient, as a PNG data URL. */
export function gradientRectChip({ wmm, hmm, radiusMm = 0, angle = GRADIENT_ANGLE, stops = GRADIENT }) {
  const wPx = wmm * CHIP_PX_PER_MM;
  const hPx = hmm * CHIP_PX_PER_MM;
  const c = makeCanvas(wPx, hPx);
  const ctx = c.getContext('2d');
  const grad = cssAngleGradient(ctx, angle, c.width, c.height);
  stops.forEach((s) => grad.addColorStop(s.stop, s.color));
  ctx.fillStyle = grad;
  if (radiusMm > 0) pathRoundedRect(ctx, 0, 0, c.width, c.height, radiusMm * CHIP_PX_PER_MM);
  else ctx.rect(0, 0, c.width, c.height);
  ctx.fill();
  return c.toDataURL('image/png');
}

/** A solid circle filled with a conic gradient (the avatar ring), as a PNG data URL. */
export function conicCircleChip({ diameterMm, colors = CONIC_RING, startDeg = 0 }) {
  const d = diameterMm * CHIP_PX_PER_MM;
  const c = makeCanvas(d, d);
  const ctx = c.getContext('2d');
  const r = d / 2;
  const grad = ctx.createConicGradient((startDeg * Math.PI) / 180, r, r);
  colors.forEach((color, i) => grad.addColorStop(i / (colors.length - 1), color));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(r, r, r, 0, Math.PI * 2);
  ctx.fill();
  return c.toDataURL('image/png');
}

/** Manual per-character advance so we don't depend on ctx.letterSpacing browser support. */
function drawTrackedText(ctx, str, x, y, letterSpacingPx) {
  let cx = x;
  for (const ch of str) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + letterSpacingPx;
  }
  return cx - x - letterSpacingPx;
}

function measureTrackedText(ctx, str, letterSpacingPx) {
  let w = 0;
  for (const ch of str) w += ctx.measureText(ch).width + letterSpacingPx;
  return Math.max(0, w - letterSpacingPx);
}

/**
 * Render `str` as gradient-filled text on an offscreen canvas (real Canvas2D gradient —
 * this is the one thing html2canvas cannot do for `background-clip:text`). Returns a
 * data URL plus its natural size in mm so the caller can addImage it in place of the
 * vector text.
 */
export function gradientTextChip({
  str, family = 'display', weight = 'bold', px, letterSpacingEm = 0,
  angle = GRADIENT_ANGLE, stops = GRADIENT, padPx = 4,
}) {
  const dpr = CHIP_PX_PER_MM / (1 / PX_MM); // chip px per css-px, so glyph metrics line up with `px`
  const fontPx = px * dpr;
  const letterSpacingChipPx = letterSpacingEm * fontPx;
  const probe = document.createElement('canvas').getContext('2d');
  probe.font = `${CANVAS_WEIGHT[weight]} ${fontPx}px ${CANVAS_FAMILY[family]}`;
  const textW = measureTrackedText(probe, str, letterSpacingChipPx);
  const textH = fontPx * 1.25;
  const pad = padPx * dpr;

  const c = makeCanvas(textW + pad * 2, textH + pad * 2);
  const ctx = c.getContext('2d');
  ctx.font = `${CANVAS_WEIGHT[weight]} ${fontPx}px ${CANVAS_FAMILY[family]}`;
  ctx.textBaseline = 'alphabetic';
  const grad = cssAngleGradient(ctx, angle, c.width, c.height);
  stops.forEach((s) => grad.addColorStop(s.stop, s.color));
  ctx.fillStyle = grad;
  const baselineY = pad + fontPx * 0.82;
  drawTrackedText(ctx, str, pad, baselineY, letterSpacingChipPx);

  return {
    dataUrl: c.toDataURL('image/png'),
    wMm: c.width / CHIP_PX_PER_MM,
    hMm: c.height / CHIP_PX_PER_MM,
    padMm: pad / CHIP_PX_PER_MM,
    baselineMm: baselineY / CHIP_PX_PER_MM,
  };
}

/** Loads+caches an <img> (same-origin or CORS-open), resolved once it's decoded. */
export function loadImage(url) {
  if (!imageCache.has(url)) {
    imageCache.set(
      url,
      new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Gagal memuat gambar ${url}`));
        img.src = url;
      })
    );
  }
  return imageCache.get(url);
}

export function resolvePublicAsset(path) {
  return new URL(path, PAGE_ASSET_BASE).href;
}

/** Re-encodes a loaded <img> as a plain PNG data URL, so it can flow through addImageMm like every other chip. */
export function imageToDataUrl(img) {
  const c = makeCanvas(img.naturalWidth, img.naturalHeight);
  c.getContext('2d').drawImage(img, 0, 0);
  return c.toDataURL('image/png');
}

/** object-fit:cover crop of `img` into a `size`x`size` circle (transparent outside), as a PNG data URL. */
export function circularCoverChip(img, sizeMm, objectPositionY = 0.2) {
  const size = sizeMm * CHIP_PX_PER_MM;
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d');
  const scale = Math.max(size / img.naturalWidth, size / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = (size - dw) / 2;
  const dy = (size - dh) * objectPositionY;

  ctx.save();
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
  return c.toDataURL('image/png');
}

// The corner brackets sit at top:-5px/left:-5px (and the mirrored bottom-right pair),
// which is the widest thing that escapes the `.avatar-wrap` box (the ring's inset:-3px
// is smaller) — so the chip canvas needs a 5px margin on every side or those brackets
// and the ring edge would be silently clipped at the canvas boundary.
export const AVATAR_MARGIN_PX = 5;

/**
 * Full avatar badge (ring + photo + corner brackets + optional status dot) composited
 * on one canvas so every piece stays pixel-locked to the others, then placed as a
 * single PDF image — mirrors the CV/Portfolio `.avatar-wrap` stack. Returns the data
 * URL plus the chip's full mm size (wrapMm + margin on each side) — place it at
 * (wrapXmm - marginMm, wrapYmm - marginMm) so the wrap box itself lands exactly on
 * the coordinates the caller expects.
 */
export function avatarChip(img, { wrapMm, photoMm, statusDot = false }) {
  const scale = PX_MM * CHIP_PX_PER_MM; // css px (96dpi) -> chip px (300dpi)
  const marginMm = AVATAR_MARGIN_PX * PX_MM;
  const marginPx = AVATAR_MARGIN_PX * scale;
  const wrapPx = wrapMm * CHIP_PX_PER_MM;
  const size = wrapPx + marginPx * 2;

  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;

  // Ring (conic) — matches `.avatar-ring{inset:-3px}` on the wrap box.
  const ringR = wrapPx / 2 + 3 * scale;
  const ringGrad = ctx.createConicGradient(0, cx, cy);
  CONIC_RING.forEach((color, i) => ringGrad.addColorStop(i / (CONIC_RING.length - 1), color));
  ctx.fillStyle = ringGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
  ctx.fill();

  // Photo circle on top (object-fit:cover, object-position:center 20%). CSS formula:
  // offset = (containerSize - scaledImageSize) * positionFraction, applied from the
  // container's own top/left — NOT from the circle's center. dh always exceeds the
  // container here (a portrait photo cover-fit into a square), so this pulls the crop
  // window up toward the top 20% of the source (favoring the face over the chest).
  const photoR = (photoMm * CHIP_PX_PER_MM) / 2;
  const photoSize = photoR * 2;
  const fit = Math.max(photoSize / img.naturalWidth, photoSize / img.naturalHeight);
  const dw = img.naturalWidth * fit;
  const dh = img.naturalHeight * fit;
  const dx = cx - photoR + (photoSize - dw) * 0.5;
  const dy = cy - photoR + (photoSize - dh) * 0.2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, photoR, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();

  // Corner brackets: cyan top-left, pink bottom-right (2px @96dpi lines, 12px legs,
  // inset 5px beyond the wrap — i.e. flush with this canvas's own edges).
  const lw = 2 * scale;
  const leg = 12 * scale;
  ctx.lineWidth = lw;
  ctx.lineCap = 'square';
  ctx.strokeStyle = COLORS.cyan;
  ctx.beginPath();
  ctx.moveTo(0, leg);
  ctx.lineTo(0, 0);
  ctx.lineTo(leg, 0);
  ctx.stroke();
  ctx.strokeStyle = COLORS.pink;
  ctx.beginPath();
  ctx.moveTo(size - leg, size);
  ctx.lineTo(size, size);
  ctx.lineTo(size, size - leg);
  ctx.stroke();

  if (statusDot) {
    // CSS: bottom:4px;right:4px;width:13px;height:13px, relative to the wrap box.
    const dotR = (13 * scale) / 2;
    const dotCx = marginPx + wrapPx - 4 * scale - dotR;
    const dotCy = marginPx + wrapPx - 4 * scale - dotR;
    ctx.beginPath();
    ctx.arc(dotCx, dotCy, dotR, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.green;
    ctx.fill();
    ctx.lineWidth = 2 * scale;
    ctx.strokeStyle = COLORS.dark;
    ctx.stroke();
  }

  return { dataUrl: c.toDataURL('image/png'), sizeMm: wrapMm + marginMm * 2, marginMm };
}

/** Dark panel background with the CSS's soft radial-gradient corner glows, as a data URL. */
export function darkPanelChip({ wmm, hmm, spots }) {
  const wPx = wmm * CHIP_PX_PER_MM;
  const hPx = hmm * CHIP_PX_PER_MM;
  const c = makeCanvas(wPx, hPx);
  const ctx = c.getContext('2d');
  ctx.fillStyle = COLORS.dark;
  ctx.fillRect(0, 0, c.width, c.height);
  spots.forEach(({ xPct, yPct, color, radiusPct }) => {
    const cx = c.width * xPct;
    const cy = c.height * yPct;
    const r = Math.max(c.width, c.height) * radiusPct;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, c.width, c.height);
  });
  return c.toDataURL('image/png');
}

/** Place a gradientTextChip so its glyphs' top-left lands at (xmm, ymm) — compensates the chip's internal padding. */
export function placeChipTopLeft(doc, chip, xmm, ymm) {
  addImageMm(doc, chip.dataUrl, xmm - chip.padMm, ymm - chip.padMm, chip.wMm, chip.hMm);
}

/** Place a gradientTextChip horizontally centered on cxmm, glyph-top at ymm. */
export function placeChipTopCenter(doc, chip, cxmm, ymm) {
  addImageMm(doc, chip.dataUrl, cxmm - chip.wMm / 2, ymm - chip.padMm, chip.wMm, chip.hMm);
}

export function addImageMm(doc, dataUrl, xmm, ymm, wmm, hmm) {
  const fmt = dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
  doc.addImage(dataUrl, fmt, xmm, ymm, wmm, hmm, undefined, 'FAST');
}

// jsPDF's vector setFillColor/setDrawColor only accept hex/named colors, not CSS
// rgba() strings (Canvas2D accepts those fine, which is why chip code can use them
// freely) — so any translucent vector fill needs its alpha pulled out and applied
// as a real PDF transparency group via GState instead.
function parseColor(color) {
  const m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\)$/.exec(color || '');
  if (!m) return { hex: color, alpha: 1 };
  const [, r, g, b, a] = m;
  const hex = `#${[r, g, b].map((v) => Number(v).toString(16).padStart(2, '0')).join('')}`;
  return { hex, alpha: a === undefined ? 1 : parseFloat(a) };
}

function withOpacity(doc, alpha, fn) {
  if (alpha >= 1) { fn(); return; }
  doc.saveGraphicsState();
  doc.setGState(new doc.GState({ opacity: alpha }));
  fn();
  doc.restoreGraphicsState();
}

export function hLine(doc, x1, y, x2, color, weightMm = 0.12) {
  const { hex, alpha } = parseColor(color);
  withOpacity(doc, alpha, () => {
    doc.setDrawColor(hex);
    doc.setLineWidth(weightMm);
    doc.line(x1, y, x2, y);
  });
}

export function dashedHLine(doc, x1, y, x2, color, weightMm = 0.1) {
  const { hex, alpha } = parseColor(color);
  withOpacity(doc, alpha, () => {
    doc.setDrawColor(hex);
    doc.setLineWidth(weightMm);
    doc.setLineDashPattern([mm(2), mm(1.5)], 0);
    doc.line(x1, y, x2, y);
    doc.setLineDashPattern([], 0);
  });
}

export function filledRect(doc, x, y, w, h, color, radiusMm = 0) {
  const { hex, alpha } = parseColor(color);
  withOpacity(doc, alpha, () => {
    doc.setFillColor(hex);
    if (radiusMm > 0) doc.roundedRect(x, y, w, h, radiusMm, radiusMm, 'F');
    else doc.rect(x, y, w, h, 'F');
  });
}

export function strokedRect(doc, x, y, w, h, strokeColor, weightMm = 0.12, radiusMm = 0, fillColor = null) {
  const stroke = parseColor(strokeColor);
  const fill = fillColor ? parseColor(fillColor) : null;
  const alpha = Math.min(stroke.alpha, fill ? fill.alpha : 1);
  withOpacity(doc, alpha, () => {
    doc.setDrawColor(stroke.hex);
    doc.setLineWidth(weightMm);
    if (fill) doc.setFillColor(fill.hex);
    const style = fill ? 'FD' : 'D';
    if (radiusMm > 0) doc.roundedRect(x, y, w, h, radiusMm, radiusMm, style);
    else doc.rect(x, y, w, h, style);
  });
}

