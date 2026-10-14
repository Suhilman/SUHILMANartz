import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

/**
 * "SUHILMAN" wordmark with an outlined style that fills like rising
 * water as `progress` (0–100) increases — the fill's top edge is a
 * continuously animated sine wave (two layered waves for depth).
 *
 * clip-path lives on an outer wrapper and background-clip:text on an
 * inner element — combining both on the same node makes some browsers
 * fall back to painting the full box instead of just the glyphs.
 */
const buildWavePoints = (baseYPct, amplitude, frequency, phase) => {
  const points = [];
  const steps = 28;
  for (let i = 0; i <= steps; i++) {
    const xPct = (i / steps) * 100;
    const wave = amplitude * Math.sin((xPct / 100) * frequency * Math.PI * 2 + phase);
    const yPct = Math.max(0, Math.min(100, baseYPct + wave));
    points.push(`${xPct}% ${yPct}%`);
  }
  points.push('100% 100%', '0% 100%');
  return points.join(', ');
};

const WordmarkFill = ({ progress = 0, text = 'SUHILMAN' }) => {
  const progressRef = useRef(progress);
  const backRef = useRef(null);
  const frontRef = useRef(null);

  useEffect(() => { progressRef.current = progress; }, [progress]);

  useEffect(() => {
    let raf;
    const start = performance.now();

    const tick = (now) => {
      const t = (now - start) / 1000;
      const filled = Math.max(0, Math.min(100, progressRef.current));
      const baseY = 100 - filled;

      if (backRef.current) {
        backRef.current.style.clipPath = `polygon(${buildWavePoints(baseY + 2.5, 4.5, 1.6, t * 1.6)})`;
      }
      if (frontRef.current) {
        frontRef.current.style.clipPath = `polygon(${buildWavePoints(baseY, 3.2, 2.1, t * -2.1 + 2)})`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <Wrap>
      <Outline aria-hidden="true">{text}</Outline>
      <ClipLayer ref={backRef} aria-hidden="true">
        <FillText $variant="back">{text}</FillText>
      </ClipLayer>
      <ClipLayer ref={frontRef} aria-hidden="true">
        <FillText $variant="front">{text}</FillText>
      </ClipLayer>
      <ScreenReaderText>{text}</ScreenReaderText>
    </Wrap>
  );
};

export default WordmarkFill;

const Wrap = styled.div`
  position: relative;
  display: inline-block;
  line-height: 1;
`;

const base = `
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(2.2rem, 11vw, 4.4rem);
  letter-spacing: -0.01em;
  line-height: 1;
  margin: 0;
  white-space: nowrap;
`;

const Outline = styled.div`
  ${base}
  color: transparent;
  -webkit-text-stroke: 1.5px rgba(93, 217, 255, 0.55);
`;

const ClipLayer = styled.div`
  position: absolute;
  inset: 0;
  will-change: clip-path;
`;

const FillText = styled.div`
  ${base}
  color: transparent;
  -webkit-text-fill-color: transparent;
  background-image: linear-gradient(100deg, #00c2ff 0%, #6a5bff ${({ $variant }) => ($variant === 'back' ? 60 : 45)}%, #ff5b94 100%);
  -webkit-background-clip: text;
  background-clip: text;
  opacity: ${({ $variant }) => ($variant === 'back' ? 0.45 : 1)};
`;

const ScreenReaderText = styled.span`
  position: absolute;
  width: 1px; height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
`;
