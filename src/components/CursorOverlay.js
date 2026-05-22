import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

const CursorOverlay = () => {
  const dotRef  = useRef(null);
  const ringRef = useRef(null);
  const [hover, setHover] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Disable on touch / small screens
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
    if (!hasFinePointer) return;
    setEnabled(true);

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ring  = { x: mouse.x, y: mouse.y };

    const onMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      document.documentElement.style.setProperty('--mx', `${e.clientX}px`);
      document.documentElement.style.setProperty('--my', `${e.clientY}px`);
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0) translate(-50%, -50%)`;
      }
    };

    let raf;
    const animate = () => {
      ring.x += (mouse.x - ring.x) * 0.18;
      ring.y += (mouse.y - ring.y) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(animate);
    };
    animate();

    const isInteractive = (el) =>
      el && (el.matches('a, button, [role="button"], input, textarea, select, label, .magnetic') ||
             el.closest('a, button, [role="button"], input, textarea, select, label, .magnetic'));

    const onOver = (e) => isInteractive(e.target) && setHover(true);
    const onOut  = (e) => isInteractive(e.target) && setHover(false);

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout',  onOut);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout',  onOut);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!enabled) return null;
  return (
    <>
      <Spotlight />
      <Ring ref={ringRef} $hover={hover} />
      <Dot  ref={dotRef}  $hover={hover} />
    </>
  );
};

export default CursorOverlay;

const Dot = styled.div`
  position: fixed;
  top: 0; left: 0;
  width: ${({ $hover }) => ($hover ? '6px' : '8px')};
  height: ${({ $hover }) => ($hover ? '6px' : '8px')};
  border-radius: 50%;
  background: var(--accent-1);
  pointer-events: none;
  z-index: 100000;
  mix-blend-mode: screen;
  transition: width 0.2s, height 0.2s;
  will-change: transform;
`;

const Ring = styled.div`
  position: fixed;
  top: 0; left: 0;
  width: ${({ $hover }) => ($hover ? '56px' : '32px')};
  height: ${({ $hover }) => ($hover ? '56px' : '32px')};
  border-radius: 50%;
  border: 1.5px solid var(--accent-1);
  background: ${({ $hover }) => ($hover ? 'rgba(0,240,255,0.08)' : 'transparent')};
  pointer-events: none;
  z-index: 99999;
  mix-blend-mode: screen;
  box-shadow: 0 0 24px var(--accent-glow);
  transition: width 0.25s cubic-bezier(0.16,1,0.3,1),
              height 0.25s cubic-bezier(0.16,1,0.3,1),
              background 0.25s;
  will-change: transform;
`;

const Spotlight = styled.div`
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9998;
  background: radial-gradient(circle 600px at var(--mx, 50%) var(--my, 50%),
              rgba(0, 240, 255, 0.06),
              transparent 60%);
  mix-blend-mode: screen;
  transition: opacity 0.3s;
`;
