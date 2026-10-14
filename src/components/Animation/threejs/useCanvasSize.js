/**
 * Watches an element's actual rendered size via ResizeObserver and
 * invokes `onResize(width, height)` whenever it changes (including the
 * first real layout pass) — more reliable than reading clientWidth /
 * clientHeight synchronously at mount, which can be 0 before the
 * surrounding flex/grid layout has settled.
 */
export const observeCanvasSize = (el, onResize) => {
  let last = { w: 0, h: 0 };
  const apply = (w, h) => {
    if (w > 0 && h > 0 && (w !== last.w || h !== last.h)) {
      last = { w, h };
      onResize(w, h);
    }
  };
  apply(el.clientWidth, el.clientHeight);

  const ro = new ResizeObserver((entries) => {
    const { width, height } = entries[0].contentRect;
    apply(width, height);
  });
  ro.observe(el);
  return () => ro.disconnect();
};
