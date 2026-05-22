import React from 'react';
import styled, { keyframes } from 'styled-components';
import { techStack } from './data';

const Marquee = () => {
  const items = [...techStack, ...techStack]; // duplicate for seamless loop
  return (
    <Wrap>
      <FadeLeft />
      <Track>
        {items.map((t, i) => (
          <Item key={i}>
            {t.icon}
            <span>{t.name}</span>
          </Item>
        ))}
      </Track>
      <FadeRight />
    </Wrap>
  );
};

export default Marquee;

const scroll = keyframes`
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
`;

const Wrap = styled.section`
  position: relative;
  padding: 24px 0;
  margin: 24px 0;
  overflow: hidden;
  border-top: 1px solid var(--glass-border);
  border-bottom: 1px solid var(--glass-border);
  background: var(--card-bg-color);
  backdrop-filter: var(--blur-glass);
  -webkit-backdrop-filter: var(--blur-glass);
`;

const Track = styled.div`
  display: flex;
  gap: 36px;
  width: max-content;
  animation: ${scroll} 40s linear infinite;
  &:hover { animation-play-state: paused; }
`;

const Item = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 18px;
  border: 1px solid var(--glass-border);
  border-radius: 999px;
  background: var(--card-bg-color);
  color: var(--text-color);
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.25s;
  flex-shrink: 0;
  svg {
    color: var(--tittle-color);
    font-size: 18px;
  }
  &:hover {
    border-color: var(--accent-1);
    box-shadow: 0 0 16px var(--accent-glow);
    transform: translateY(-2px);
  }
`;

const fade = `
  position: absolute;
  top: 0; bottom: 0;
  width: 120px;
  pointer-events: none;
  z-index: 2;
`;
const FadeLeft = styled.div`
  ${fade}
  left: 0;
  background: linear-gradient(90deg, var(--body-bg-color), transparent);
`;
const FadeRight = styled.div`
  ${fade}
  right: 0;
  background: linear-gradient(-90deg, var(--body-bg-color), transparent);
`;
