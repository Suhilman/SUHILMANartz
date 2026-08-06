import React, { useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

const ToolShell = ({ title, icon, subtitle, children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const prev = document.title;
    if (title) document.title = `${title} — SUHILMANartz`;
    return () => { document.title = prev; };
  }, [title]);

  return (
    <Page
      as={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <TopBar>
        <TopRow>
          <BackBtn
            onClick={() => navigate('/')}
            as={motion.button}
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.96 }}
          >
            <FaArrowLeft />
            <span>Back to SUHILMANartz</span>
          </BackBtn>

          <TitleWrap>
            <TitleIcon>{icon}</TitleIcon>
            <div>
              <Title>{title}</Title>
              {subtitle && <Subtitle>{subtitle}</Subtitle>}
            </div>
          </TitleWrap>

          <LocalBadge>100% Local</LocalBadge>
        </TopRow>
      </TopBar>

      <Content>{children}</Content>
    </Page>
  );
};

export default ToolShell;

const Page = styled.div`
  min-height: 100vh;
  background: var(--body-bg-color);
`;

const TopBar = styled.div`
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--header-bg-color);
  backdrop-filter: var(--blur-glass);
  -webkit-backdrop-filter: var(--blur-glass);
  border-bottom: 1px solid var(--glass-border);
  padding: 14px 24px;
  @media (max-width: 768px) {
    padding: 10px 14px;
  }
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  @media (max-width: 768px) {
    gap: 10px;
  }
`;

const BackBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: var(--card-bg-color);
  border: 1px solid var(--glass-border-strong);
  border-radius: 999px;
  color: var(--text-color);
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.25s;
  &:hover {
    border-color: var(--accent-1);
    color: var(--tittle-color);
    box-shadow: 0 0 16px var(--accent-glow);
  }
  svg { font-size: 12px; }
  @media (max-width: 768px) {
    padding: 7px 10px;
    span { display: none; }
  }
`;

const TitleWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
`;

const TitleIcon = styled.div`
  flex-shrink: 0;
  width: 38px; height: 38px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 17px;
  color: var(--tittle-color);
  background: var(--button-background-color);
  @media (max-width: 768px) { display: none; }
`;

const Title = styled.h1`
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 18px;
  letter-spacing: -0.01em;
  color: var(--text-color);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  @media (max-width: 768px) { font-size: 14px; }
`;

const Subtitle = styled.p`
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  @media (max-width: 768px) { display: none; }
`;

const LocalBadge = styled.span`
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.05em;
  padding: 6px 12px;
  border-radius: 999px;
  color: var(--accent-1);
  border: 1px solid var(--glass-border-strong);
  background: var(--button-background-color);
  @media (max-width: 640px) { display: none; }
`;

const Content = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  @media (max-width: 768px) {
    padding: 14px;
  }
`;
