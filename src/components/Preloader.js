import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import ScanMesh from './ScanMesh';
import WordmarkFill from './WordmarkFill';

const STATUS_STEPS = [
  { label: 'INDEXING ASSETS', at: 0 },
  { label: 'COMPILING INTERFACE', at: 35 },
  { label: 'RENDERING EXPERIENCE', at: 70 },
];

const pad3 = (n) => String(n).padStart(3, '0');

const Preloader = ({ onDone }) => {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible]   = useState(true);
  const [now, setNow]           = useState(new Date());

  useEffect(() => {
    let frame;
    const start = performance.now();
    const DURATION = 2200;

    const tick = (t0) => {
      const t = Math.min(1, (t0 - start) / DURATION);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(Math.round(eased * 100));
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          setVisible(false);
          onDone && onDone();
        }, 350);
      }
    };
    frame = requestAnimationFrame(tick);

    const clockId = setInterval(() => setNow(new Date()), 1000);
    return () => { cancelAnimationFrame(frame); clearInterval(clockId); };
  }, [onDone]);

  const timeStr = now.toLocaleTimeString('en-GB', { hour12: false }).replace(/:/g, '') +
    ' ' + now.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase().replace(' ', ' ') +
    ' WIB';

  return (
    <AnimatePresence>
      {visible && (
        <Overlay
          as={motion.div}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }}
        >
          <Grid />

          <TopRight>
            <span>MODULE BOOT</span>
            <span>MODE DEV ENVIRONMENT</span>
            <span>{timeStr}</span>
          </TopRight>

          <Layout>
            <LeftPanel>
              <Eyebrow>
                <Dot /> MODULE PRELOAD
              </Eyebrow>

              <TitleRow>
                <div>
                  <WordmarkFill progress={progress} text="SUHILMAN" />
                  <Subtitle>Application Developer — Portfolio Runtime</Subtitle>
                </div>
              </TitleRow>

              <SectionHead><Bar /> SYSTEM INITIALIZATION</SectionHead>

              <StatusList>
                {STATUS_STEPS.map((s) => (
                  <StatusRow key={s.label}>
                    <span>{s.label}</span>
                    <StatusState $state={progress >= s.at + 30 ? 'done' : progress >= s.at ? 'running' : 'idle'}>
                      {progress >= s.at + 30 ? 'DONE' : progress >= s.at ? 'RUNNING' : 'QUEUED'}
                    </StatusState>
                  </StatusRow>
                ))}
              </StatusList>
            </LeftPanel>

            <RightPanel>
              <MeshWrap>
                <ScanMesh />
              </MeshWrap>
            </RightPanel>
          </Layout>

          <BottomBar>
            <Percent>
              {pad3(progress)}<sup>%</sup>
            </Percent>
            <ProgressTrack>
              <ProgressFill style={{ width: `${progress}%` }} />
            </ProgressTrack>
            <BottomRight>
              <span>{progress < 100 ? 'PLEASE WAIT' : 'READY'}</span>
              <Footnote>HEAD SCAN · LEE PERRY-SMITH · CC BY 3.0</Footnote>
            </BottomRight>
          </BottomBar>
        </Overlay>
      )}
    </AnimatePresence>
  );
};

export default Preloader;

const pulse = keyframes`
  0%, 100% { opacity: 0.5; }
  50%      { opacity: 1; }
`;

const Overlay = styled.div`
  position: fixed; inset: 0;
  height: 100dvh;
  z-index: 100000;
  background: #05060b;
  overflow: hidden;
  font-family: var(--font-mono);
  color: #e8e9f3;
  @media (max-width: 760px) {
    display: flex;
    flex-direction: column;
  }
`;

const Grid = styled.div`
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(93, 217, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(93, 217, 255, 0.05) 1px, transparent 1px);
  background-size: 42px 42px;
  mask-image: radial-gradient(circle at 70% 50%, black 0%, transparent 75%);
`;

const TopRight = styled.div`
  position: absolute;
  top: 28px; right: 32px;
  display: flex; flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  font-size: 10.5px;
  letter-spacing: 0.1em;
  color: rgba(232, 233, 243, 0.45);
  @media (max-width: 760px) {
    top: 18px; right: 20px;
    font-size: 9px;
  }
  @media (max-width: 480px) {
    span:not(:last-child) { display: none; }
  }
`;

const Layout = styled.div`
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 clamp(24px, 6vw, 80px);
  gap: clamp(20px, 5vw, 60px);
  @media (max-width: 760px) {
    flex: 1;
    min-height: 0;
    height: auto;
    flex-direction: column-reverse;
    justify-content: center;
    padding: 50px 20px 0;
    gap: 14px;
  }
`;

const LeftPanel = styled.div`
  position: relative;
  z-index: 1;
  flex: 1 1 420px;
  max-width: 480px;
  @media (max-width: 760px) {
    flex: 0 0 auto;
    width: 100%;
  }
`;

const Eyebrow = styled.div`
  display: flex; align-items: center; gap: 9px;
  font-size: 11px;
  letter-spacing: 0.2em;
  color: #5dd9ff;
  margin-bottom: 28px;
  @media (max-width: 760px) {
    margin-bottom: 10px;
  }
`;

const Dot = styled.span`
  width: 7px; height: 7px; border-radius: 50%;
  background: #5dd9ff;
  box-shadow: 0 0 10px #5dd9ff;
  animation: ${pulse} 1.6s ease-in-out infinite;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 40px;
  @media (max-width: 760px) {
    margin-bottom: 14px;
  }
`;

const Subtitle = styled.div`
  font-family: var(--font-body);
  font-size: 13px;
  color: rgba(232, 233, 243, 0.5);
`;

const SectionHead = styled.div`
  display: flex; align-items: center; gap: 10px;
  font-size: 11px;
  letter-spacing: 0.18em;
  color: rgba(232, 233, 243, 0.6);
  margin-bottom: 16px;
  @media (max-width: 760px) {
    margin-bottom: 8px;
  }
`;

const Bar = styled.span`
  width: 3px; height: 14px;
  background: linear-gradient(180deg, #00f0ff, #b14aff);
  border-radius: 2px;
`;

const StatusList = styled.div`
  display: flex; flex-direction: column;
  gap: 11px;
  @media (max-width: 760px) {
    gap: 6px;
  }
`;

const StatusRow = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  font-size: 12px;
  letter-spacing: 0.04em;
  color: rgba(232, 233, 243, 0.65);
  padding-bottom: 11px;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.08);
  @media (max-width: 760px) {
    padding-bottom: 6px;
    font-size: 11px;
  }
`;

const StatusState = styled.span`
  font-weight: 600;
  letter-spacing: 0.08em;
  color: ${({ $state }) =>
    $state === 'done' ? '#22d3a7' : $state === 'running' ? '#5dd9ff' : 'rgba(232,233,243,0.3)'};
`;

const RightPanel = styled.div`
  position: relative;
  flex: 1 1 420px;
  height: min(70vh, 560px);
  display: flex; align-items: center; justify-content: center;
  @media (max-width: 760px) {
    width: 100%;
    flex: 1 1 auto;
    min-height: 200px;
    max-height: 340px;
  }
`;

const MeshWrap = styled.div`
  width: 100%;
  height: 100%;
`;

const BottomBar = styled.div`
  position: absolute;
  left: 0; right: 0; bottom: 0;
  display: flex; align-items: center; gap: 24px;
  padding: 22px clamp(24px, 6vw, 80px) 30px;
  @media (max-width: 760px) {
    position: static;
    flex-shrink: 0;
    gap: 14px;
    padding: 16px 20px 24px;
  }
`;

const Percent = styled.div`
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(1.8rem, 5vw, 3.2rem);
  color: #fff;
  line-height: 1;
  flex-shrink: 0;
  sup { font-size: 0.4em; color: rgba(232,233,243,0.5); margin-left: 2px; }
`;

const ProgressTrack = styled.div`
  flex: 1;
  height: 2px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #00f0ff, #b14aff, #ff5b94);
  box-shadow: 0 0 12px rgba(0, 240, 255, 0.7);
  transition: width 0.1s linear;
`;

const BottomRight = styled.div`
  flex-shrink: 0;
  display: flex; flex-direction: column; align-items: flex-end;
  gap: 4px;
  font-size: 11px;
  letter-spacing: 0.14em;
  color: rgba(232, 233, 243, 0.55);
  @media (max-width: 540px) {
    display: none;
  }
`;

const Footnote = styled.span`
  font-size: 9.5px;
  color: rgba(232, 233, 243, 0.3);
`;
