/**
 * Vector reproduction of public/cv-suhilman.html for the Download PDF button.
 * Every measurement below mirrors that file's CSS 1:1 — this is the design
 * source for the PDF; the HTML/CSS remains the design source for the
 * on-screen preview. See kit.js for why the two are generated separately.
 *
 * Layout convention: `y`/`top` cursors always mean the TOP of a CSS box.
 * kit.textTop/textBlock/richTextBlock take a top-y and return the next one.
 * For a row of two differently-sized texts that CSS aligns on a shared
 * baseline (flex `align-items:baseline`), we compute one baseline manually
 * from the larger element's font size and call the lower-level kit.text()
 * (baseline-based) for both — that's the `xBaseline` pattern seen below.
 */
import * as kit from './kit.js';
import content from '../data/cvContent.js';

const { mm, COLORS, GRADIENT_2 } = kit;

const PAGE_W = 210;
const PAGE_H = 297;
const SIDEBAR_W = 74;
const MAIN_X = SIDEBAR_W;
const MAIN_W = PAGE_W - SIDEBAR_W;

// CSS line-height is a multiplier on font-size; box height = px * ratio.
const lh = (px, ratio = 1.4) => mm(px * ratio);
const baseline = (topY, px) => topY + mm(px * kit.BASELINE_RATIO);

export default async function generateCvPdf(opts = {}) {
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
  drawSidebar(doc, avatarImg);
  drawMain(doc, qrDataUrl);

  // `.page::before` — 4px top accent bar, full width, drawn last so it sits above both columns.
  const topBar = kit.gradientRectChip({ wmm: PAGE_W, hmm: mm(4) });
  kit.addImageMm(doc, topBar, 0, 0, PAGE_W, mm(4));

  if (opts.returnDoc) return doc;
  doc.save('CV Suhilman.pdf');
}

function drawSidebar(doc, avatarImg) {
  const padTop = mm(24), padX = mm(20);
  const contentX = padX;
  const contentW = SIDEBAR_W - padX * 2;
  const centerX = SIDEBAR_W / 2;

  const bg = kit.darkPanelChip({
    wmm: SIDEBAR_W, hmm: PAGE_H,
    spots: [
      { xPct: 0.2, yPct: 0.08, color: 'rgba(0,240,255,.12)', radiusPct: 0.55 },
      { xPct: 0.8, yPct: 0.9, color: 'rgba(177,74,255,.10)', radiusPct: 0.55 },
    ],
  });
  kit.addImageMm(doc, bg, 0, 0, SIDEBAR_W, PAGE_H);

  let y = padTop;

  // .avatar-wrap { width/height:108px; margin:20px auto 14px }
  y += mm(20);
  const avatar = kit.avatarChip(avatarImg, { wrapMm: mm(108), photoMm: mm(102), statusDot: true });
  kit.addImageMm(doc, avatar.dataUrl, centerX - avatar.sizeMm / 2, y - avatar.marginMm, avatar.sizeMm, avatar.sizeMm);
  y += mm(108) + mm(14);

  // .name { font-size:30px; line-height:1; margin-bottom:6px } (gradient)
  const nameChip = kit.gradientTextChip({ str: content.name, family: 'display', weight: 'bold', px: 30, letterSpacingEm: -0.02 });
  kit.placeChipTopCenter(doc, nameChip, centerX, y);
  y += mm(30) + mm(6);

  // .role { font-size:11px; margin-bottom:16px; mono; letter-spacing:.04em }
  y = kit.textTop(doc, content.role, centerX, y, {
    family: 'mono', weight: 'regular', px: 11, color: COLORS.mutedDark, letterSpacingEm: 0.04, align: 'center',
  }) + mm(16);

  // .accent-bar { width:55%; height:2.5px; margin:0 auto 18px }
  const accentW = contentW * 0.55;
  const accentBar = kit.gradientRectChip({ wmm: accentW, hmm: mm(2.5), radiusMm: mm(1) });
  kit.addImageMm(doc, accentBar, centerX - accentW / 2, y, accentW, mm(2.5));
  y += mm(2.5) + mm(18);

  // ---- Contact ----
  y = sectionTitle(doc, 'Contact', contentX, contentW, y);
  content.contact.forEach(({ label, value }, i) => {
    y = kit.textTop(doc, label.toUpperCase(), contentX, y, {
      family: 'mono', weight: 'regular', px: 9, color: COLORS.cyan, letterSpacingEm: 0.16,
    }) + mm(2.5);
    y = kit.textBlock(doc, value, contentX, y, contentW, {
      family: 'body', weight: 'regular', px: 12, color: COLORS.whiteT, lineHeightPx: 12 * 1.4,
    });
    y += i < content.contact.length - 1 ? mm(11) : mm(16);
  });

  // ---- Professional ----
  y = sectionTitle(doc, 'Professional', contentX, contentW, y);
  content.professionalSkills.forEach(({ name, pct }, i, arr) => {
    y = skillBar(doc, contentX, contentW, y, name, pct, COLORS.whiteT, 'rgba(255,255,255,.06)');
    y += i < arr.length - 1 ? mm(13) : mm(18);
  });

  // ---- Soft Skills ----
  y = sectionTitle(doc, 'Soft Skills', contentX, contentW, y);
  content.softSkills.forEach(({ name, pct }, i, arr) => {
    y = skillBar(doc, contentX, contentW, y, name, pct, COLORS.whiteT, 'rgba(255,255,255,.06)');
    y += i < arr.length - 1 ? mm(13) : mm(18);
  });

  // ---- Languages ----
  y = sectionTitle(doc, 'Languages', contentX, contentW, y);
  content.languages.forEach(({ name, level }) => {
    y += mm(5);
    const b = baseline(y, 12);
    kit.text(doc, name, contentX, b, { family: 'body', weight: 'semibold', px: 12, color: COLORS.whiteT });
    kit.text(doc, level, contentX + contentW, b, { family: 'mono', weight: 'regular', px: 11, color: COLORS.mutedDark, align: 'right' });
    y += lh(12, 1) + mm(5);
  });
}

/** `.s-title` — small uppercase display heading + a fading hairline filling the rest of the row. */
function sectionTitle(doc, label, x, w, y) {
  const px = 10.5;
  const upper = label.toUpperCase();
  kit.setFont(doc, 'display', 'bold', px);
  const labelW = kit.measureMm(doc, upper, mm(0.16 * px));
  kit.textTop(doc, upper, x, y, { family: 'display', weight: 'bold', px, color: COLORS.cyan, letterSpacingEm: 0.16 });

  const lineX = x + labelW + mm(6);
  if (lineX < x + w) {
    const fade = kit.gradientRectChip({
      wmm: x + w - lineX, hmm: mm(1), angle: 90,
      stops: [{ stop: 0, color: 'rgba(0,240,255,.5)' }, { stop: 1, color: 'rgba(0,240,255,0)' }],
    });
    kit.addImageMm(doc, fade, lineX, y + mm(px * 0.42), x + w - lineX, mm(0.35));
  }
  return y + lh(px, 1) + mm(10);
}

function skillBar(doc, x, w, y, name, pct, nameColor, trackColor) {
  const b = baseline(y, 12);
  kit.text(doc, name, x, b, { family: 'body', weight: 'medium', px: 12, color: nameColor });
  kit.text(doc, `${pct}%`, x + w, b, { family: 'mono', weight: 'regular', px: 10, color: COLORS.mutedDark, align: 'right' });
  y += lh(12, 1) + mm(3.5);
  kit.filledRect(doc, x, y, w, mm(4.5), trackColor, mm(2.25));
  const fillW = Math.max(mm(4.5), (w * pct) / 100);
  const fillChip = kit.gradientRectChip({ wmm: fillW, hmm: mm(4.5), radiusMm: mm(2.25), stops: GRADIENT_2 });
  kit.addImageMm(doc, fillChip, x, y, fillW, mm(4.5));
  return y + mm(4.5);
}

function drawMain(doc, qrDataUrl) {
  const padTop = mm(20), padX = mm(24);
  const x = MAIN_X + padX;
  const w = MAIN_W - padX * 2;
  let y = padTop;

  // .main-head — CSS align-items:flex-end; approximated as a shared baseline off the larger (15px) title.
  y = kit.textTop(doc, content.eyebrow, x, y, {
    family: 'mono', weight: 'regular', px: 10, color: COLORS.violet, letterSpacingEm: 0.2,
  }) + mm(4);
  const headB = baseline(y, 15);
  kit.text(doc, content.title.toUpperCase(), x, headB, { family: 'display', weight: 'bold', px: 15, color: COLORS.text, letterSpacingEm: 0.03 });
  kit.text(doc, content.tag, x + w, headB, {
    family: 'mono', weight: 'regular', px: 9.5, color: COLORS.muted, letterSpacingEm: 0.05, align: 'right',
  });
  y += lh(15, 1) + mm(9);
  kit.hLine(doc, x, y, x + w, COLORS.hairline, mm(0.12));
  y += mm(12);

  // ---- KPI grid: 4 cols, gap 8px ----
  const gap = mm(8);
  const colW = (w - gap * 3) / 4;
  const kpiPad = { x: mm(10), yTop: mm(7), yBottom: mm(7) };
  const kpiH = kpiPad.yTop + mm(17) + mm(2) + lh(7.5, 1.3) * 2 + kpiPad.yBottom - mm(3);
  content.kpis.forEach(({ n, label }, i) => {
    const [l1, l2] = label.split('\n');
    const cx = x + i * (colW + gap);
    kit.filledRect(doc, cx, y, colW, kpiH, '#fbfcfe', mm(2));
    kit.strokedRect(doc, cx, y, colW, kpiH, COLORS.hairline, mm(0.1), mm(2));
    const bar = kit.gradientRectChip({ wmm: mm(3), hmm: kpiH, stops: GRADIENT_2 });
    kit.addImageMm(doc, bar, cx, y, mm(3), kpiH);

    const chip = kit.gradientTextChip({ str: n, family: 'display', weight: 'bold', px: 17 });
    kit.placeChipTopLeft(doc, chip, cx + kpiPad.x, y + kpiPad.yTop);
    let lblY = y + kpiPad.yTop + mm(17) + mm(2);
    lblY = kit.textTop(doc, l1.toUpperCase(), cx + kpiPad.x, lblY, { family: 'mono', weight: 'regular', px: 7.5, color: COLORS.muted, letterSpacingEm: 0.1, lineHeightRatio: 1.3 });
    kit.textTop(doc, l2.toUpperCase(), cx + kpiPad.x, lblY, { family: 'mono', weight: 'regular', px: 7.5, color: COLORS.muted, letterSpacingEm: 0.1, lineHeightRatio: 1.3 });
  });
  y += kpiH + mm(10);

  // ---- 01 Profile ----
  y = mainSectionTitle(doc, '// 01', 'Profile', x, w, y);
  y = kit.richTextBlock(
    doc,
    content.profile.map((seg) => ({ str: seg.text, weight: seg.strong ? 'semibold' : 'regular' })),
    x, y, w, { px: 10.5, lineHeightPx: 10.5 * 1.55, baseColor: COLORS.muted }
  );
  y += mm(10);

  // ---- 02 Experience ----
  y = mainSectionTitle(doc, '// 02', 'Experience', x, w, y);
  content.jobs.forEach((job, i) => {
    y = drawJob(doc, x, w, y, job);
    if (i < content.jobs.length - 1) {
      kit.dashedHLine(doc, x, y, x + w, COLORS.hairline, mm(0.1));
      y += mm(7);
    }
  });
  y += mm(3);

  // ---- 03 Education ----
  y = mainSectionTitle(doc, '// 03', 'Education', x, w, y);
  const colGap = mm(18);
  const eduColW = (w - colGap) / 2;
  const half = Math.ceil(content.education.length / 2);
  const eduCols = [content.education.slice(0, half), content.education.slice(half)];
  // CSS: `.edu-item{display:flex;align-items:center;gap:10px}` around [dot, info, year] —
  // that's a 10px gap on BOTH sides of edu-info, and edu-info wraps (min-width:0) when a
  // long school name would otherwise collide with the year — e.g. "SMP Negeri 2
  // Megamendung" wraps to 2 lines in the real browser, growing that row. Walking this
  // row-by-row (rather than column-by-column with two independent y-cursors) keeps the
  // two columns' dots/years aligned even when one row's school name wraps and the
  // other's doesn't — matching real CSS grid row-sizing instead of two stacked lists
  // that happen to sit side by side.
  const eduInfoW = (item) => {
    kit.setFont(doc, 'mono', 'medium', 9);
    const yearW = kit.measureMm(doc, item.year);
    return eduColW - mm(8) - mm(10) - mm(10) - yearW;
  };
  const eduItemH = (item) => {
    const infoW = eduInfoW(item);
    const schoolH = kit.measureBlockHeight(doc, item.school, infoW, { family: 'body', px: 11, lineHeightPx: 11 * 1.25 });
    const majorH = kit.measureBlockHeight(doc, item.major, infoW, { family: 'body', px: 9.5, lineHeightPx: 9.5 * 1.55 });
    return Math.max(schoolH + mm(1) + majorH, mm(8));
  };

  const eduRowCount = Math.max(eduCols[0].length, eduCols[1].length);
  let cy = y;
  for (let ri = 0; ri < eduRowCount; ri++) {
    const rowH = Math.max(...eduCols.map((items) => (items[ri] ? eduItemH(items[ri]) : 0)));
    cy += mm(5);
    eduCols.forEach((items, ci) => {
      const item = items[ri];
      if (!item) return;
      const cx = x + ci * (eduColW + colGap);
      const textX = cx + mm(8) + mm(10);
      const infoW = eduInfoW(item);

      const infoY = kit.textBlock(doc, item.school, textX, cy, infoW, { family: 'body', weight: 'bold', px: 11, color: COLORS.text, lineHeightPx: 11 * 1.25 });
      kit.textBlock(doc, item.major, textX, infoY + mm(1), infoW, { family: 'body', weight: 'regular', px: 9.5, color: COLORS.muted, lineHeightPx: 9.5 * 1.55 });

      const dotY = cy + (rowH - mm(8)) / 2;
      kit.addImageMm(doc, kit.gradientRectChip({ wmm: mm(8), hmm: mm(8), radiusMm: mm(4) }), cx, dotY, mm(8), mm(8));
      const yearTopY = cy + (rowH - mm(9)) / 2;
      kit.text(doc, item.year, cx + eduColW, yearTopY + mm(9 * kit.BASELINE_RATIO), { family: 'mono', weight: 'medium', px: 9, color: COLORS.violet, align: 'right' });

      if (ri < eduRowCount - 1) kit.dashedHLine(doc, cx, cy + rowH + mm(2.5), cx + eduColW, COLORS.hairline, mm(0.1));
    });
    cy += rowH + mm(5);
  }
  y = cy + mm(2);

  // ---- 04 Tech Stack & Portfolio ----
  y = mainSectionTitle(doc, '// 04', 'Tech Stack & Portfolio', x, w, y);
  const chips = content.techStack;
  const cardPad = mm(9);
  const qrColW = mm(96);

  // QR box's own required height (top pad + image + gap + 3 label lines + bottom pad) —
  // this used to reuse `mm(96)` (the box's *width*) as a stand-in for its height, which
  // is ~1.5mm short of the actual label text and let "SUHILMANartz" spill past the
  // box's bottom border. Measure it for real instead of assuming width == height.
  const qrImgSize = mm(72);
  const qrPad = mm(5);
  const qrGap = mm(3);
  const qrLabelH = lh(7.5, 1) + lh(7, 1) + lh(7, 1);
  const qrBoxH = qrPad + qrImgSize + qrGap + qrLabelH + qrPad;

  const chipsColW = w - qrColW - mm(12) - cardPad * 2;
  const chipsFlowH = measureChipFlow(doc, chips, chipsColW, 8.5);
  const cardH = Math.max(chipsFlowH, qrBoxH) + cardPad * 2;
  kit.filledRect(doc, x, y, w, cardH, '#fdfdfe', mm(3));
  kit.strokedRect(doc, x, y, w, cardH, COLORS.hairline, mm(0.1), mm(3));
  drawChipFlow(doc, chips, x + cardPad, y + (cardH - chipsFlowH) / 2, chipsColW, 8.5);

  const qrX = x + w - cardPad - qrColW;
  const qrY = y + (cardH - qrBoxH) / 2;
  kit.filledRect(doc, qrX, qrY, qrColW, qrBoxH, '#ffffff', mm(1.5));
  kit.strokedRect(doc, qrX, qrY, qrColW, qrBoxH, COLORS.hairline, mm(0.1), mm(1.5));
  const qrCx = qrX + qrColW / 2;
  kit.addImageMm(doc, qrDataUrl, qrCx - qrImgSize / 2, qrY + qrPad, qrImgSize, qrImgSize);
  let qrLabelY = qrY + qrPad + qrImgSize + qrGap;
  qrLabelY = kit.textTop(doc, 'SCAN ME', qrCx, qrLabelY, { family: 'mono', weight: 'bold', px: 7.5, color: COLORS.violet, letterSpacingEm: 0.18, align: 'center' });
  qrLabelY = kit.textTop(doc, 'suhilman.github.io/', qrCx, qrLabelY, { family: 'mono', weight: 'regular', px: 7, color: COLORS.muted, align: 'center' });
  kit.textTop(doc, 'SUHILMANartz', qrCx, qrLabelY, { family: 'mono', weight: 'regular', px: 7, color: COLORS.muted, align: 'center' });
}

function mainSectionTitle(doc, num, title, x, w, y) {
  const numPx = 10, titlePx = 17;
  const b = baseline(y, titlePx);
  kit.text(doc, num, x, b - mm(2), { family: 'mono', weight: 'regular', px: numPx, color: COLORS.violet, letterSpacingEm: 0.18 });
  kit.setFont(doc, 'mono', 'regular', numPx);
  const numW = kit.measureMm(doc, num, mm(0.18 * numPx));
  kit.text(doc, title, x + numW + mm(10), b, { family: 'display', weight: 'bold', px: titlePx, color: COLORS.text, letterSpacingEm: -0.01 });
  kit.setFont(doc, 'display', 'bold', titlePx);
  const titleW = kit.measureMm(doc, title);
  const lineX = x + numW + mm(10) + titleW + mm(10);
  if (lineX < x + w) kit.hLine(doc, lineX, y + mm(titlePx) - mm(5), x + w, COLORS.hairline, mm(0.12));
  return y + lh(titlePx, 1) + mm(7);
}

function drawJob(doc, x, w, y, job) {
  const headB = baseline(y, 12);
  kit.text(doc, job.company, x, headB, { family: 'display', weight: 'bold', px: 12, color: COLORS.text });
  kit.text(doc, job.period, x + w, headB, { family: 'mono', weight: 'medium', px: 9, color: COLORS.violet, align: 'right' });
  y += lh(12, 1) + mm(1);

  const subB = baseline(y, 10);
  kit.text(doc, job.role, x, subB, { family: 'body', weight: 'semibold', px: 10, color: '#0891b2' });
  kit.text(doc, job.location, x + w, subB, { family: 'mono', weight: 'regular', px: 8.5, color: COLORS.muted, align: 'right' });
  y += lh(10, 1) + mm(4);

  job.bullets.forEach((runs) => {
    kit.text(doc, '▸', x, baseline(y, 9.5), { family: 'body', weight: 'bold', px: 9.5, color: COLORS.cyan });
    y = kit.richTextBlock(
      doc,
      runs.map((seg) => ({ str: seg.text, weight: seg.strong ? 'semibold' : 'regular', color: COLORS.text })),
      x + mm(11), y, w - mm(11),
      { px: 9.5, lineHeightPx: 9.5 * 1.45, baseColor: COLORS.text }
    ) + mm(2);
  });

  // .job-tech — mono badge, violet left border, "Tech" lead-in bold. CSS has no
  // white-space:nowrap here, so a long tech list wraps like any other paragraph
  // instead of running off the page — measure the wrapped height before drawing
  // the background box, then render the actual text on top of it.
  const techPadX = mm(7), techPadY = mm(4);
  const techInnerW = w - mm(1.2) - techPadX * 2;
  const techLineHeightPx = 8 * 1.45;
  const techTextH = kit.measureBlockHeight(doc, `Tech ${job.tech}`, techInnerW, { family: 'mono', px: 8, lineHeightPx: techLineHeightPx });
  const techH = techTextH + techPadY * 2;

  kit.filledRect(doc, x, y, w, techH, '#f5f3ff', mm(1.2));
  kit.filledRect(doc, x, y, mm(1.2), techH, COLORS.violet);
  kit.richTextBlock(
    doc,
    [
      { str: 'Tech ', weight: 'bold', color: COLORS.violet },
      { str: job.tech, weight: 'regular', color: '#7c3aed' },
    ],
    x + mm(1.2) + techPadX, y + techPadY, techInnerW,
    { family: 'mono', px: 8, lineHeightPx: techLineHeightPx, baseColor: '#7c3aed' }
  );

  return y + techH + mm(7);
}

/** Flow a list of small pill chips left-to-right, wrapping rows — returns the flow's total height. */
function measureChipFlow(doc, chips, maxW, px) {
  const gap = mm(4), padX = mm(3.5), rowH = mm(px * 1.4) + mm(4);
  let x = 0, rows = 1;
  kit.setFont(doc, 'body', 'medium', px);
  chips.forEach((c) => {
    const w = kit.measureMm(doc, c) + padX * 2;
    if (x + w > maxW && x > 0) { x = 0; rows += 1; }
    x += w + gap;
  });
  return rows * rowH + (rows - 1) * gap;
}

function drawChipFlow(doc, chips, xmm, ymm, maxW, px) {
  const gap = mm(4), padX = mm(3.5), h = mm(px * 1.4) + mm(4);
  let x = xmm, y = ymm;
  chips.forEach((c) => {
    kit.setFont(doc, 'body', 'medium', px);
    const w = kit.measureMm(doc, c) + padX * 2;
    if (x + w > xmm + maxW && x > xmm) { x = xmm; y += h + gap; }
    kit.filledRect(doc, x, y, w, h, COLORS.dark3, h / 2);
    kit.strokedRect(doc, x, y, w, h, '#26263a', mm(0.1), h / 2);
    kit.textCenterY(doc, c, x + w / 2, y, h, { family: 'body', weight: 'medium', px, color: COLORS.whiteT, align: 'center' });
    x += w + gap;
  });
}
