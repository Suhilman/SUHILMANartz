import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/* ---------- Magnetic wrapper ---------- */
export const Magnetic = ({ children, strength = 0.35, ...rest }) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 200, damping: 18, mass: 0.4 });

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    x.set((e.clientX - cx) * strength);
    y.set((e.clientY - cy) * strength);
  };
  const onLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.span
      ref={ref}
      style={{ x: sx, y: sy, display: 'inline-block' }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="magnetic"
      {...rest}
    >
      {children}
    </motion.span>
  );
};

/* ---------- 3D tilt wrapper ---------- */
export const Tilt = ({ children, max = 8, scale = 1.02, ...rest }) => {
  const ref = useRef(null);
  const x  = useMotionValue(0);
  const y  = useMotionValue(0);
  const rx = useSpring(useTransform(y, (v) => -v * max), { stiffness: 220, damping: 22 });
  const ry = useSpring(useTransform(x, (v) =>  v * max), { stiffness: 220, damping: 22 });
  const sc = useSpring(0, { stiffness: 220, damping: 22 });

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    x.set(((e.clientX - r.left) / r.width  - 0.5) * 2);
    y.set(((e.clientY - r.top)  / r.height - 0.5) * 2);
  };
  const onEnter = () => sc.set(scale - 1);
  const onLeave = () => { x.set(0); y.set(0); sc.set(0); };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        rotateX: rx,
        rotateY: ry,
        scale: useTransform(sc, (v) => 1 + v),
        transformStyle: 'preserve-3d',
        transformPerspective: 1000,
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

/* ---------- Reveal-on-scroll: text per word ----------
   Uses useInView so titles always show, even if Preloader covers the
   viewport on initial mount. Falls back to immediate animation if the
   browser misses the intersection event. */
export const RevealWords = ({ children, className, as: As = 'span', delay = 0, stagger = 0.05, ...rest }) => {
  const text = typeof children === 'string' ? children : '';
  const words = text.split(' ');
  return (
    <As className={className} {...rest}>
      {words.map((w, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            overflow: 'hidden',
            verticalAlign: 'bottom',
            lineHeight: 1.1,
            paddingBottom: '0.12em',
          }}
        >
          <motion.span
            style={{ display: 'inline-block' }}
            initial={{ y: '110%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: delay + i * stagger, ease: [0.16, 1, 0.3, 1] }}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </As>
  );
};
