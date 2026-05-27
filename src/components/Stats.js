import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { motion, useInView } from 'framer-motion';
import { Tilt } from './fx';

const STATS = [
  { value: 5,   suffix: '+',  label: 'Years Experience',  color: 'var(--accent-1)' },
  { value: 30,  suffix: '+',  label: 'Projects Shipped',  color: 'var(--accent-2)' },
  { value: 3,   suffix: '',   label: 'Companies Worked',  color: 'var(--accent-3)' },
  { value: 20,  suffix: '+',  label: 'Tech Stack Mastered', color: 'var(--accent-1)' },
];

const Counter = ({ to, suffix, color, start }) => {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!start) return;
    let raf;
    const t0 = performance.now();
    const DURATION = 1400;
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / DURATION);
      const eased = 1 - Math.pow(1 - t, 3);
      setN(Math.round(to * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, to]);

  return (
    <Big style={{ color }}>
      {n}<small>{suffix}</small>
    </Big>
  );
};

const Stats = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <Section ref={ref}>
      <Tilt max={4} scale={1.01}>
      <Grid>
        {STATS.map((s, i) => (
          <Item
            key={i}
            as={motion.div}
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <Counter to={s.value} suffix={s.suffix} color={s.color} start={inView} />
            <Label>{s.label}</Label>
          </Item>
        ))}
      </Grid>
      </Tilt>
    </Section>
  );
};

export default Stats;

const Section = styled.section`
  padding: 40px 6vw;
  max-width: 1280px;
  margin: 0 auto;
  @media (max-width: 768px) { padding: 30px 5vw; }
`;
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  background: var(--gradient-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: 32px;
  backdrop-filter: var(--blur-glass);
  -webkit-backdrop-filter: var(--blur-glass);
  transition: border-color 0.3s, box-shadow 0.3s;
  &:hover { border-color: var(--accent-1); box-shadow: 0 0 32px var(--accent-glow); }
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    padding: 24px;
  }
`;
const Item = styled.div`
  text-align: center;
  padding: 16px 8px;
  border-right: 1px solid var(--glass-border);
  &:last-child { border-right: none; }
  @media (max-width: 768px) {
    border-right: none;
    border-bottom: 1px solid var(--glass-border);
    &:nth-last-child(-n+2) { border-bottom: none; }
    &:nth-child(odd) { border-right: 1px solid var(--glass-border); }
  }
`;
const Big = styled.div`
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(2.4rem, 5vw, 3.5rem);
  letter-spacing: -0.04em;
  line-height: 1;
  text-shadow: 0 0 24px currentColor;
  small {
    font-size: 0.5em;
    margin-left: 2px;
    opacity: 0.8;
  }
`;
const Label = styled.div`
  margin-top: 10px;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-muted);
`;
