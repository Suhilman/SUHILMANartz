/**
 * Vector reproduction of the (now-removed) portfolio.html for the Download PDF
 * button. Measurements mirror that design's CSS 1:1. See kit.js for why PDF
 * generation is native vector drawing rather than an HTML screenshot, and
 * cv.js for the shared `top-of-box` layout convention used throughout.
 */
import * as kit from './kit.js';
import content from '../data/portfolioContent.js';

const { mm, COLORS, GRADIENT, GRADIENT_2 } = kit;

const PAGE_W = 210;
const PAGE_H = 297;

const lh = (px, ratio = 1.4) => mm(px * ratio);
const baseline = (topY, px) => topY + mm(px * kit.BASELINE_RATIO);

const PIN_STYLE = {
  live: { bg: '#dcfce7', text: '#16a34a', border: '#86efac' },
  internal: { bg: '#cffafe', text: '#0891b2', border: '#67e8f9' },
  shipped: { bg: '#f1f5f9', text: COLORS.muted, border: COLORS.hairline },
};

export default async function generatePortfolioPdf(opts = {}) {
  const jsPDF = await kit.loadJsPDF();
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });

  const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(content.portfolioUrl)}&size=320&dark=07070d&light=ffffff&margin=0&ecLevel=Q&format=png`;
  const [, avatarImg, qrImg] = await Promise.all([
    kit.loadFonts(doc),
    kit.loadImage(kit.resolvePublicAsset(content.avatarSrc)),
    kit.loadImage(qrUrl),
  ]);
  const qrDataUrl = kit.imageToDataUrl(qrImg);

  kit.filledRect(doc, 0, 0, PAGE_W, PAGE_H, '#ffffff');
  let y = drawHeader(doc, avatarImg);
  y = drawBody(doc, y, qrDataUrl);

  const topBar = kit.gradientRectChip({ wmm: PAGE_W, hmm: mm(4) });
  kit.addImageMm(doc, topBar, 0, 0, PAGE_W, mm(4));

  if (opts.returnDoc) return doc;
  doc.save('Portofolio Suhilman.pdf');
}

function drawHeader(doc, avatarImg) {
  const padTop = mm(22), padX = mm(26), padBottom = mm(20);
  const avatarColW = mm(96);
  const gap = mm(18);

  // CSS: `.head-meta{min-width:140px}` inside `grid-template-columns:96px 1fr auto` —
  // the `auto` column sizes to its own content, and 140px is only a FLOOR, not the
  // real width. "suhilman.github.io/SUHILMANartz" alone needs ~58mm, well past that
  // floor — hardcoding 140px here clipped every meta row. Measure the actual widest
  // line (values, the longest label pairing, and the status pill) instead.
  kit.setFont(doc, 'mono', 'regular', 9.5);
  const metaRowWidths = content.headMeta.map(({ label, value }) => {
    const valueW = kit.measureMm(doc, value, mm(0.04 * 9.5));
    kit.setFont(doc, 'mono', 'regular', 8);
    const labelW = kit.measureMm(doc, label.toUpperCase(), mm(0.16 * 8));
    kit.setFont(doc, 'mono', 'regular', 9.5);
    return valueW + mm(6) + labelW;
  });
  const statusW = kit.measureMm(doc, content.availableStatus);
  const pillW = mm(7) + mm(6) + statusW + mm(10);
  const metaColW = Math.max(mm(140), pillW, ...metaRowWidths);

  const idColW = PAGE_W - padX * 2 - avatarColW - metaColW - gap * 2;

  // Estimate header height from its tallest column (head-id, since its desc wraps),
  // then paint the dark bg to that height before drawing anything on top of it.
  const idX = padX + avatarColW + gap;
  const descLines = wrapLineCount(doc, content.desc, idColW, 'body', 'regular', 10.5);
  const idH = lh(9.5, 1) + mm(5) + lh(34, 1) + mm(6) + lh(12.5, 1) + mm(6) + descLines * lh(10.5, 1.55);
  const metaH = mm(5) * 4 + lh(9.5, 1) * 5 + mm(5) + lh(9.5, 1) + mm(6);
  const headerH = padTop + Math.max(mm(88), idH, metaH) + padBottom;

  const bg = kit.darkPanelChip({
    wmm: PAGE_W, hmm: headerH,
    spots: [
      { xPct: 0.15, yPct: 0.1, color: 'rgba(0,240,255,.14)', radiusPct: 0.55 },
      { xPct: 0.85, yPct: 0.9, color: 'rgba(177,74,255,.12)', radiusPct: 0.55 },
      { xPct: 0.6, yPct: 0.4, color: 'rgba(255,91,148,.06)', radiusPct: 0.6 },
    ],
  });
  kit.addImageMm(doc, bg, 0, 0, PAGE_W, headerH);

  const rowCenterY = padTop + Math.max(mm(88), idH, metaH) / 2;

  // Avatar (88x88, centered in its 96px grid column, vertically centered in the row).
  const avatar = kit.avatarChip(avatarImg, { wrapMm: mm(88), photoMm: mm(82) });
  const avatarX = padX + (avatarColW - mm(88)) / 2;
  const avatarY = rowCenterY - mm(88) / 2;
  kit.addImageMm(doc, avatar.dataUrl, avatarX - avatar.marginMm, avatarY - avatar.marginMm, avatar.sizeMm, avatar.sizeMm);

  // head-id
  let iy = rowCenterY - idH / 2;
  iy = kit.textTop(doc, content.eyebrow, idX, iy, { family: 'mono', weight: 'regular', px: 9.5, color: COLORS.cyan, letterSpacingEm: 0.2 }) + mm(5);
  const nameChip = kit.gradientTextChip({ str: content.name, family: 'display', weight: 'bold', px: 34, letterSpacingEm: -0.025 });
  kit.placeChipTopLeft(doc, nameChip, idX, iy);
  iy += mm(34) + mm(6);

  const roleB = baseline(iy, 12.5);
  kit.setFont(doc, 'body', 'medium', 12.5);
  let rx = idX;
  kit.text(doc, content.role, rx, roleB, { family: 'body', weight: 'medium', px: 12.5, color: COLORS.whiteT });
  rx += kit.measureMm(doc, content.role);
  kit.text(doc, ' · ', rx, roleB, { family: 'body', weight: 'medium', px: 12.5, color: COLORS.cyan });
  rx += kit.measureMm(doc, ' · ');
  kit.text(doc, content.roleSuffix, rx, roleB, { family: 'body', weight: 'medium', px: 12.5, color: COLORS.whiteT });
  iy += lh(12.5, 1) + mm(6);

  iy = kit.textBlock(doc, content.desc, idX, iy, idColW, {
    family: 'body', weight: 'regular', px: 10.5, color: COLORS.mutedDark, lineHeightPx: 10.5 * 1.55,
  });

  // head-meta (right-aligned column)
  const metaX = PAGE_W - padX;
  let my = rowCenterY - metaH / 2;
  content.headMeta.forEach(({ label, value }) => {
    const b = baseline(my, 9.5);
    kit.setFont(doc, 'mono', 'regular', 9.5);
    const valueW = kit.measureMm(doc, value, mm(0.04 * 9.5));
    kit.setFont(doc, 'mono', 'regular', 8);
    const labelW = kit.measureMm(doc, label.toUpperCase(), mm(0.16 * 8));
    kit.text(doc, label.toUpperCase(), metaX - valueW - mm(6) - labelW, b, {
      family: 'mono', weight: 'regular', px: 8, color: COLORS.cyan, letterSpacingEm: 0.16,
    });
    kit.text(doc, value, metaX, b, { family: 'mono', weight: 'regular', px: 9.5, color: COLORS.whiteT, letterSpacingEm: 0.04, align: 'right' });
    my += lh(9.5, 1) + mm(5);
  });

  // Available badge (pill, right-aligned) — pillW was already measured above (it
  // feeds metaColW's sizing), reused here for the actual draw.
  my += mm(1);
  const pillH = lh(9.5, 1) + mm(6);
  kit.filledRect(doc, metaX - pillW, my, pillW, pillH, 'rgba(34,197,94,.12)', pillH / 2);
  kit.strokedRect(doc, metaX - pillW, my, pillW, pillH, 'rgba(34,197,94,.35)', mm(0.1), pillH / 2);
  const dotR = mm(6) / 2;
  kit.filledRect(doc, metaX - pillW + mm(5), my + pillH / 2 - dotR, dotR * 2, dotR * 2, COLORS.green, dotR);
  kit.text(doc, content.availableStatus, metaX - mm(5), baseline(my + mm(3), 9.5), {
    family: 'mono', weight: 'regular', px: 9.5, color: COLORS.whiteT, align: 'right',
  });

  return headerH;
}

function drawBody(doc, headerH, qrDataUrl) {
  const padX = mm(26), padTop = mm(12), padBottom = mm(10);
  const x = padX;
  const w = PAGE_W - padX * 2;
  let y = headerH + padTop;

  // ---- Highlights: 4 cols, gap 10px ----
  const gap = mm(8);
  const colW = (w - gap * 3) / 4;
  const hPad = { x: mm(11), yTop: mm(9) };
  const highlightH = hPad.yTop + mm(20) + mm(4) + lh(8.5, 1.3) + mm(9);
  content.highlights.forEach(({ n, label }, i) => {
    const cx = x + i * (colW + gap);
    kit.filledRect(doc, cx, y, colW, highlightH, '#fbfcfe', mm(2.2));
    kit.strokedRect(doc, cx, y, colW, highlightH, COLORS.hairline, mm(0.1), mm(2.2));
    kit.addImageMm(doc, kit.gradientRectChip({ wmm: mm(3), hmm: highlightH, stops: GRADIENT_2 }), cx, y, mm(3), highlightH);
    const chip = kit.gradientTextChip({ str: n, family: 'display', weight: 'bold', px: 20 });
    kit.placeChipTopLeft(doc, chip, cx + hPad.x, y + hPad.yTop);
    kit.textTop(doc, label.toUpperCase(), cx + hPad.x, y + hPad.yTop + mm(20) + mm(4), {
      family: 'mono', weight: 'regular', px: 8.5, color: COLORS.muted, letterSpacingEm: 0.1, lineHeightRatio: 1.3,
    });
  });
  y += highlightH + mm(9);

  // ---- 01 Featured Work ----
  y = sectionTitle(doc, '// 01', 'Featured Work', x, w, y);
  const pGap = mm(8);
  const pCols = 3;
  const pColW = (w - pGap * (pCols - 1)) / pCols;
  // Closing tile signals more shipped work exists beyond what's individually listed —
  // appended after the real projects so it lands in the grid's last empty cell.
  const gridItems = [...content.projects, { more: true, ...content.moreProjects }];
  const rows = chunk(gridItems, pCols);
  const projectH = measureProjectHeight(doc, pColW);
  rows.forEach((row, ri) => {
    row.forEach((proj, ci) => {
      const px_ = x + ci * (pColW + pGap);
      if (proj.more) drawMoreCard(doc, proj, px_, y, pColW, projectH);
      else drawProjectCard(doc, proj, px_, y, pColW, projectH);
    });
    y += projectH + (ri < rows.length - 1 ? pGap : 0);
  });
  y += mm(9);

  // ---- two-col: Core Skills + Tech Stack | Get in Touch ----
  const colGap = mm(14);
  const leftW = (w - colGap) * (1.2 / 2.2);
  const rightW = w - colGap - leftW;
  const rightX = x + leftW + colGap;

  let ly = sectionTitle(doc, '// 02', 'Core Skills', x, leftW, y);
  content.coreSkills.forEach(({ name, pct }, i, arr) => {
    ly = skillBar(doc, x, leftW, ly, name, pct);
    ly += i < arr.length - 1 ? mm(5) : mm(9);
  });
  ly = sectionTitle(doc, '// 03', 'Tech Stack', x, leftW, ly);
  ly = drawChipFlowSmall(doc, content.techStack, x, ly, leftW);

  let ry = sectionTitle(doc, '// 04', 'Get in Touch', rightX, rightW, y);
  drawContactBlock(doc, rightX, ry, rightW, qrDataUrl);

  return Math.max(ly, ry);
}

function sectionTitle(doc, num, title, x, w, y) {
  const numPx = 9.5, titlePx = 17;
  const b = baseline(y, titlePx);
  kit.text(doc, num, x, b - mm(2), { family: 'mono', weight: 'regular', px: numPx, color: COLORS.violet, letterSpacingEm: 0.16 });
  kit.setFont(doc, 'mono', 'regular', numPx);
  const numW = kit.measureMm(doc, num, mm(0.16 * numPx));
  kit.text(doc, title, x + numW + mm(10), b, { family: 'display', weight: 'bold', px: titlePx, color: COLORS.text, letterSpacingEm: -0.01 });
  kit.setFont(doc, 'display', 'bold', titlePx);
  const titleW = kit.measureMm(doc, title);
  const lineX = x + numW + mm(10) + titleW + mm(10);
  if (lineX < x + w) kit.hLine(doc, lineX, y + mm(titlePx) - mm(5), x + w, COLORS.hairline, mm(0.12));
  return y + lh(titlePx, 1) + mm(9);
}

function measureProjectHeight(doc, colW) {
  const padX = mm(10), padTop = mm(9), padBottom = mm(8);
  const innerW = colW - padX * 2;
  const descLines = Math.max(...content.projects.map((p) => wrapLineCount(doc, p.desc, innerW, 'body', 'regular', 9)));
  return padTop + lh(8.5, 1) + mm(1) + lh(10, 1.25) + mm(1) + lh(8.5, 1) + mm(5) + descLines * lh(9, 1.4) + mm(5) + lh(7.5, 1) + mm(4) + padBottom;
}

function drawProjectCard(doc, proj, x, y, w, h) {
  kit.filledRect(doc, x, y, w, h, '#ffffff', mm(2.2));
  kit.strokedRect(doc, x, y, w, h, COLORS.hairline, mm(0.1), mm(2.2));
  kit.addImageMm(doc, kit.gradientRectChip({ wmm: w, hmm: mm(1.4) }), x, y, w, mm(1.4));

  const padX = mm(10);
  const innerW = w - padX * 2;
  let iy = y + mm(9);

  const glyphChip = kit.gradientTextChip({ str: proj.glyph.toUpperCase(), family: 'display', weight: 'bold', px: 8.5, letterSpacingEm: 0.04 });
  kit.placeChipTopLeft(doc, glyphChip, x + padX, iy);
  const pin = PIN_STYLE[proj.pin];
  kit.setFont(doc, 'mono', 'regular', 7.5);
  const pinTextW = kit.measureMm(doc, proj.pinLabel.toUpperCase(), mm(0.1 * 7.5));
  const pinW = pinTextW + mm(8.5);
  const pinH = lh(7.5, 1) + mm(3);
  kit.filledRect(doc, x + w - padX - pinW, iy - mm(1), pinW, pinH, pin.bg, pinH / 2);
  kit.strokedRect(doc, x + w - padX - pinW, iy - mm(1), pinW, pinH, pin.border, mm(0.08), pinH / 2);
  kit.textCenterY(doc, proj.pinLabel.toUpperCase(), x + w - padX - pinW / 2, iy - mm(1), pinH, {
    family: 'mono', weight: 'regular', px: 7.5, color: pin.text, letterSpacingEm: 0.1, align: 'center',
  });
  iy += mm(8.5) + mm(1);

  iy = kit.textTop(doc, proj.title, x + padX, iy, { family: 'display', weight: 'bold', px: 10, color: COLORS.text, lineHeightRatio: 1.25, letterSpacingEm: -0.01 }) + mm(1);
  iy = kit.textTop(doc, proj.meta, x + padX, iy, { family: 'mono', weight: 'regular', px: 8.5, color: COLORS.violet, letterSpacingEm: 0.02 }) + mm(5);
  iy = kit.textBlock(doc, proj.desc, x + padX, iy, innerW, { family: 'body', weight: 'regular', px: 9, color: COLORS.text, lineHeightPx: 9 * 1.4 }) + mm(5);

  let tx = x + padX;
  const tagH = lh(7.5, 1) + mm(4);
  proj.tags.forEach((tag) => {
    kit.setFont(doc, 'mono', 'regular', 7.5);
    const tw = kit.measureMm(doc, tag) + mm(6);
    if (tx + tw > x + w - padX) return; // tags always fit in the design content; guard only
    kit.filledRect(doc, tx, iy, tw, tagH, '#f5f3ff', tagH / 2);
    kit.strokedRect(doc, tx, iy, tw, tagH, '#ddd6fe', mm(0.08), tagH / 2);
    kit.textCenterY(doc, tag, tx + tw / 2, iy, tagH, { family: 'mono', weight: 'regular', px: 7.5, color: '#7c3aed', align: 'center' });
    tx += tw + mm(4);
  });
}

/** Closing tile in the Featured Work grid — a big gradient count + label, no project details. */
function drawMoreCard(doc, tile, x, y, w, h) {
  kit.filledRect(doc, x, y, w, h, '#fafbff', mm(2.2));
  kit.strokedRect(doc, x, y, w, h, COLORS.hairline, mm(0.1), mm(2.2));
  kit.addImageMm(doc, kit.gradientRectChip({ wmm: w, hmm: mm(1.4) }), x, y, w, mm(1.4));

  const chip = kit.gradientTextChip({ str: tile.n, family: 'display', weight: 'bold', px: 24 });
  const chipVisualH = chip.hMm - chip.padMm * 2;
  const labelLines = tile.label.split('\n');
  const labelGap = mm(5);
  const labelLineH = lh(8, 1.3);
  const blockH = chipVisualH + labelGap + labelLines.length * labelLineH;
  const blockTop = y + (h - blockH) / 2;

  kit.placeChipTopCenter(doc, chip, x + w / 2, blockTop + chip.padMm);
  let ly = blockTop + chipVisualH + labelGap;
  labelLines.forEach((line) => {
    ly = kit.textTop(doc, line.toUpperCase(), x + w / 2, ly, {
      family: 'mono', weight: 'regular', px: 8, color: COLORS.muted, letterSpacingEm: 0.08, align: 'center', lineHeightRatio: 1.3,
    });
  });
}

function skillBar(doc, x, w, y, name, pct) {
  const b = baseline(y, 9.5);
  kit.text(doc, name, x, b, { family: 'body', weight: 'medium', px: 9.5, color: COLORS.text });
  kit.text(doc, `${pct}%`, x + w, b, { family: 'mono', weight: 'regular', px: 8, color: COLORS.muted, align: 'right' });
  y += lh(9.5, 1) + mm(2);
  kit.filledRect(doc, x, y, w, mm(4), '#eef0f5', mm(2));
  const fillW = Math.max(mm(4), (w * pct) / 100);
  kit.addImageMm(doc, kit.gradientRectChip({ wmm: fillW, hmm: mm(4), radiusMm: mm(2), stops: GRADIENT_2 }), x, y, fillW, mm(4));
  return y + mm(4);
}

function drawChipFlowSmall(doc, chips, xmm, ymm, maxW) {
  const px = 7, gap = mm(5), padX = mm(4.5), h = mm(px * 1.4) + mm(6);
  let x = xmm, y = ymm;
  chips.forEach((c) => {
    kit.setFont(doc, 'body', 'medium', px);
    const w = kit.measureMm(doc, c) + padX * 2;
    if (x + w > xmm + maxW && x > xmm) { x = xmm; y += h + mm(3); }
    kit.filledRect(doc, x, y, w, h, COLORS.dark3, h / 2);
    kit.strokedRect(doc, x, y, w, h, '#26263a', mm(0.1), h / 2);
    kit.textCenterY(doc, c, x + w / 2, y, h, { family: 'body', weight: 'medium', px, color: COLORS.whiteT, align: 'center' });
    x += w + gap;
  });
  return y + h;
}

function drawContactBlock(doc, x, y, w, qrDataUrl) {
  const padX = mm(14), padY = mm(12);
  const qrSize = mm(72);
  const qrColW = qrSize + mm(8) * 2;
  const infoW = w - padX * 2 - mm(14) - qrColW;
  const infoX = x + padX;

  const cGap = mm(6);
  const cColW = (infoW - mm(12)) / 2;

  // Pre-measure each contact value's wrapped height — a narrow column plus an
  // unbreakable string like an email or URL can wrap to 2 lines here (verified
  // against the real on-screen layout), same as the CV's education section. Group
  // into rows of 2 (a spanning item is its own row) so the block height and each
  // row's advancement both come from the same real measurements.
  const contactRows = [];
  let pendingRow = [];
  content.contact.forEach((item) => {
    const itemW = item.span ? infoW : cColW;
    const valueH = kit.measureBlockHeight(doc, item.value, itemW, { family: 'body', px: 9, lineHeightPx: 9 * 1.35 });
    const itemH = lh(7.5, 1) + mm(1) + valueH;
    if (item.span) {
      if (pendingRow.length) { contactRows.push(pendingRow); pendingRow = []; }
      contactRows.push([{ item, itemH }]);
    } else {
      pendingRow.push({ item, itemH });
      if (pendingRow.length === 2) { contactRows.push(pendingRow); pendingRow = []; }
    }
  });
  if (pendingRow.length) contactRows.push(pendingRow);
  const rowHeights = contactRows.map((row) => Math.max(...row.map((e) => e.itemH)));

  const subLines = wrapLineCount(doc, content.contactSub, infoW, 'body', 'regular', 9);
  const infoH = lh(13, 1.15) + mm(3) + subLines * lh(9, 1.5) + mm(9)
    + rowHeights.reduce((a, b) => a + b, 0) + Math.max(0, rowHeights.length - 1) * cGap;
  const h = padY * 2 + Math.max(infoH, qrSize + mm(8) * 2);

  const bg = kit.darkPanelChip({
    wmm: w, hmm: h,
    spots: [
      { xPct: 1, yPct: 0, color: 'rgba(0,240,255,.18)', radiusPct: 0.6 },
      { xPct: 0, yPct: 1, color: 'rgba(255,91,148,.14)', radiusPct: 0.6 },
    ],
  });
  kit.filledRect(doc, x, y, w, h, '#07070d', mm(3));
  kit.addImageMm(doc, bg, x, y, w, h);

  let iy = y + padY;
  const headB = baseline(iy, 13);
  kit.setFont(doc, 'display', 'bold', 13);
  let hx = infoX;
  content.contactHeading.forEach((seg) => {
    if (seg.grad) {
      const chip = kit.gradientTextChip({ str: seg.text, family: 'display', weight: 'bold', px: 13 });
      kit.placeChipTopLeft(doc, chip, hx, iy);
      hx += chip.wMm - chip.padMm * 2;
    } else {
      kit.text(doc, seg.text, hx, headB, { family: 'display', weight: 'bold', px: 13, color: COLORS.whiteT });
      hx += kit.measureMm(doc, seg.text);
    }
  });
  iy += lh(13, 1.15) + mm(3);
  iy = kit.textBlock(doc, content.contactSub, infoX, iy, infoW, { family: 'body', weight: 'regular', px: 9, color: COLORS.mutedDark, lineHeightPx: 9 * 1.5 }) + mm(9);

  let cy = iy;
  contactRows.forEach((row, ri) => {
    row.forEach((entry, ci) => {
      const { item } = entry;
      const itemW = item.span ? infoW : cColW;
      const ix = item.span ? infoX : infoX + ci * (cColW + mm(12));
      const ry = kit.textTop(doc, item.label.toUpperCase(), ix, cy, { family: 'mono', weight: 'regular', px: 7.5, color: COLORS.cyan, letterSpacingEm: 0.14 }) + mm(1);
      kit.textBlock(doc, item.value, ix, ry, itemW, { family: 'body', weight: 'regular', px: 9, color: COLORS.whiteT, lineHeightPx: 9 * 1.35 });
    });
    cy += rowHeights[ri] + cGap;
  });

  const qrX = x + w - padX - qrColW + (qrColW - qrSize) / 2;
  const qrY = y + (h - (qrSize + mm(8) * 2)) / 2;
  kit.filledRect(doc, x + w - padX - qrColW, qrY, qrColW, qrSize + mm(8) * 2, '#ffffff', mm(2));
  kit.addImageMm(doc, qrDataUrl, qrX, qrY + mm(8), qrSize, qrSize);
  kit.textTop(doc, 'Scan Me', qrX + qrSize / 2, qrY + mm(8) + qrSize + mm(4), {
    family: 'mono', weight: 'bold', px: 7.5, color: COLORS.violet, letterSpacingEm: 0.16, align: 'center',
  });
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function wrapLineCount(doc, str, maxWidthMm, family, weight, px) {
  kit.setFont(doc, family, weight, px);
  const words = str.split(/\s+/).filter(Boolean);
  let line = '', lines = 0;
  words.forEach((word) => {
    const attempt = line ? `${line} ${word}` : word;
    if (kit.measureMm(doc, attempt) > maxWidthMm && line) { lines += 1; line = word; }
    else line = attempt;
  });
  if (line) lines += 1;
  return Math.max(1, lines);
}
