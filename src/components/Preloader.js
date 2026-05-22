import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

const Preloader = ({ onDone }) => {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible]   = useState(true);

  useEffect(() => {
    let frame;
    const start = performance.now();
    const DURATION = 1600;

    const tick = (now) => {
      const t = Math.min(1, (now - start) / DURATION);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(Math.round(eased * 100));
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          setVisible(false);
          onDone && onDone();
        }, 300);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <Overlay
          as={motion.div}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }}
        >
          <Mesh />
          <Center>
            <Logo>
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                SUHILMAN<em>artz</em>
              </motion.span>
            </Logo>
            <Bar>
              <BarFill style={{ width: `${progress}%` }} />
            </Bar>
            <Foot>
              <span>LOADING</span>
              <Counter>{String(progress).padStart(3, '0')}</Counter>
            </Foot>
          </Center>
        </Overlay>
      )}
    </AnimatePresence>
  );
};

export default Preloader;

const pulse = keyframes`
  0%, 100% { opacity: 0.55; }
  50%      { opacity: 1; }
`;

const Overlay = styled.div`
  position: fixed; inset: 0;
  z-index: 100000;
  background: #07070d;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
`;
const Mesh = styled.div`
  position: absolute; inset: 0;
  background-image:
    radial-gradient(at 30% 30%, var(--accent-1) 0, transparent 50%),
    radial-gradient(at 70% 70%, var(--accent-2) 0, transparent 50%);
  opacity: 0.18;
  filter: blur(60px);
  animation: ${pulse} 2.5s ease-in-out infinite;
`;
const Center = styled.div`
  position: relative;
  z-index: 1;
  width: min(420px, 80vw);
  text-align: center;
`;
const Logo = styled.div`
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(2rem, 5vw, 3rem);
  letter-spacing: -0.03em;
  color: #fff;
  margin-bottom: 28px;
  em {
    font-style: normal;
    background: linear-gradient(135deg, #00f0ff, #b14aff, #ff5b94);
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;
const Bar = styled.div`
  width: 100%;
  height: 2px;
  background: rgba(255,255,255,0.08);
  border-radius: 999px;
  overflow: hidden;
`;
const BarFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #00f0ff, #b14aff, #ff5b94);
  box-shadow: 0 0 12px rgba(0,240,255,0.7);
  transition: width 0.1s linear;
`;
const Foot = styled.div`
  display: flex; justify-content: space-between;
  margin-top: 14px;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.5);
`;
const Counter = styled.span`
  color: #00f0ff;
  font-weight: 600;
`;
