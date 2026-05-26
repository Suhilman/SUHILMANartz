import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaDownload, FaExpand, FaCompress, FaExchangeAlt } from 'react-icons/fa';

const DocViewer = ({ title, htmlSrc, downloadSrc, downloadName, swapRoute, swapLabel }) => {
  const navigate = useNavigate();
  const [fullscreen, setFullscreen] = React.useState(false);
  const iframeRef = React.useRef(null);

  const onDownload = () => {
    // Langsung buat elemen anchor <a> untuk mendownload file statis
    const a = document.createElement('a');
    a.href = downloadSrc; 
    a.download = downloadName || 'Suhilman-Document.pdf';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Viewer
      as={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <TopBar>
        <BackBtn
          onClick={() => navigate('/')}
          as={motion.button}
          whileHover={{ x: -3 }}
          whileTap={{ scale: 0.96 }}
        >
          <FaArrowLeft />
          <span>Back to Portfolio</span>
        </BackBtn>

        <Title>{title}</Title>

        <Actions>
          {swapRoute && (
            <SwapBtn
              onClick={() => navigate(swapRoute)}
              as={motion.button}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
            >
              <FaExchangeAlt />
              <span>{swapLabel || 'Switch'}</span>
            </SwapBtn>
          )}
          <IconBtn
            onClick={() => setFullscreen((v) => !v)}
            as={motion.button}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {fullscreen ? <FaCompress /> : <FaExpand />}
          </IconBtn>
          <DownloadBtn
            onClick={onDownload}
            as={motion.button}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
          >
            <FaDownload />
            <span>Download PDF</span>
          </DownloadBtn>
        </Actions>
      </TopBar>

      <Stage fullscreen={fullscreen ? 1 : 0}>
        <Iframe
          ref={iframeRef}
          src={htmlSrc}
          title={title}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads allow-modals"
        />
      </Stage>
    </Viewer>
  );
};

export default DocViewer;

const Viewer = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: var(--body-bg-color, #07070d);
  display: flex;
  flex-direction: column;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 24px;
  background: var(--card-bg-color);
  backdrop-filter: var(--blur-glass);
  -webkit-backdrop-filter: var(--blur-glass);
  border-bottom: 1px solid var(--glass-border);
  position: relative;
  z-index: 2;
  @media (max-width: 768px) {
    padding: 10px 12px;
    gap: 8px;
    flex-wrap: wrap;
  }
`;

const Title = styled.h1`
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 16px;
  letter-spacing: -0.01em;
  color: var(--text-color);
  background: var(--gradient-text);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
  flex: 1;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  @media (max-width: 768px) {
    order: 3;
    width: 100%;
    text-align: left;
    font-size: 13px;
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
  transition: all 0.25s;
  &:hover {
    border-color: var(--accent-1);
    color: var(--tittle-color);
    box-shadow: 0 0 16px var(--accent-glow);
  }
  svg { font-size: 12px; }
  @media (max-width: 768px) {
    padding: 7px 12px;
    font-size: 12px;
    span { display: none; }
  }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const IconBtn = styled.button`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid var(--glass-border-strong);
  background: var(--card-bg-color);
  color: var(--text-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s;
  &:hover {
    border-color: var(--accent-1);
    color: var(--tittle-color);
  }
  @media (max-width: 768px) {
    width: 34px;
    height: 34px;
  }
`;

const SwapBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--card-bg-color);
  border: 1px solid var(--accent-2);
  border-radius: 999px;
  color: var(--text-color);
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s;
  &:hover {
    background: rgba(177, 74, 255, 0.15);
    color: var(--accent-2);
    box-shadow: 0 0 18px rgba(177, 74, 255, 0.35);
  }
  svg { font-size: 12px; }
  @media (max-width: 768px) {
    padding: 7px 12px;
    font-size: 12px;
    span { display: none; }
  }
`;

const DownloadBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 18px;
  background: var(--gradient-primary);
  color: #fff;
  border: none;
  border-radius: 999px;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--shadow-neon);
  transition: all 0.25s;
  &:hover { box-shadow: 0 0 28px var(--accent-glow); }
  @media (max-width: 768px) {
    padding: 7px 14px;
    font-size: 12px;
    span { display: none; }
  }
`;

const Stage = styled.div`
  flex: 1;
  background: ${({ fullscreen }) => (fullscreen ? '#000' : 'var(--body-bg-color)')};
  display: flex;
  justify-content: center;
  align-items: stretch;
  overflow: auto;
  padding: ${({ fullscreen }) => (fullscreen ? '0' : '24px')};
  @media (max-width: 768px) {
    padding: ${({ fullscreen }) => (fullscreen ? '0' : '12px')};
  }
`;

const Iframe = styled.iframe`
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 110px);
  border: none;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
`;
