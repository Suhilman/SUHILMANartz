import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import { Tilt, RevealWords } from './fx';

const ITEMS = [
  { src: require('../assets/document/nmt.png'),         alt: 'Network Monitoring',     tag: 'PT. BIS DATA INDONESIA' },
  { src: require('../assets/document/nadia.png'),       alt: 'NADIA Dashboard',        tag: 'PT. BIS DATA INDONESIA' },
  { src: require('../assets/document/viona.png'),       alt: 'Viona App',              tag: 'PT. BIS DATA INDONESIA' },
  { src: require('../assets/document/viona4.png'),      alt: 'Viona v4',               tag: 'PT. BIS DATA INDONESIA' },
  { src: require('../assets/document/artzhr.png'),      alt: 'ArtzHR',                 tag: 'Flutter · Frog · Postgres' },
  { src: require('../assets/document/bdi-chat.png'),    alt: 'BDI Chat',               tag: 'Flutter · Frog · Postgres' },
  { src: require('../assets/document/myip.png'),        alt: 'MyIP Web',               tag: 'PT. BIS DATA INDONESIA' },
  { src: require('../assets/document/myipmobile.png'),  alt: 'MyIP Mobile',            tag: 'PT. BIS DATA INDONESIA' },
  { src: require('../assets/document/nadiamobile.png'), alt: 'NADIA Mobile',           tag: 'PT. BIS DATA INDONESIA' },
  { src: require('../assets/document/topup.png'),       alt: 'Top-Up Service',         tag: 'PT. BIS DATA INDONESIA' },
  { src: require('../assets/document/bnp.png'),         alt: 'BNP Project',            tag: 'PT. BIS DATA INDONESIA' },
  { src: require('../assets/document/beetpos.png'),     alt: 'BeetPOS',                tag: 'PT. Life Tech' },
  { src: require('../assets/document/backoffice.png'),  alt: 'BeetPOS Backoffice',     tag: 'PT. Life Tech' },
  { src: require('../assets/document/mrt.png'),         alt: 'MRT CRM',                tag: 'PT. Life Tech' },
];

/* Tidy bento pattern of 7 tiles that tiles 4×3 cells perfectly,
   then repeats. Pattern: 1 large 2×2, 4 small 1×1, 2 wide 2×1. */
const SIZE_PATTERN = ['lg', 'sm', 'sm', 'sm', 'sm', 'md', 'md'];
const sizeFor = (i) => SIZE_PATTERN[i % SIZE_PATTERN.length];

const Documentation = () => {
  const [zoom, setZoom] = useState(null);

  return (
    <Page>
      <SectionHeader>
        <Eyebrow>{'// 04 — Showcase'}</Eyebrow>
        <Title>
          <RevealWords>Selected</RevealWords>{' '}
          <RevealWords as="span" className="grad" delay={0.2}>Projects</RevealWords>
        </Title>
        <Sub>A glimpse of products I've helped ship across multiple industries.</Sub>
      </SectionHeader>

      <Bento>
        {ITEMS.map((item, i) => (
          <TileSlot key={i} size={sizeFor(i)}>
            <Tilt max={5} scale={1.02}>
              <Tile
                as={motion.button}
                type="button"
                onClick={() => setZoom(item)}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: (i % 6) * 0.06, ease: [0.16, 1, 0.3, 1] }}
              >
                <TileImg style={{ backgroundImage: `url(${item.src})` }} />
                <TileOverlay>
                  <TileTag>{item.tag}</TileTag>
                  <TileTitle>{item.alt}</TileTitle>
                </TileOverlay>
                <TileGlow />
              </Tile>
            </Tilt>
          </TileSlot>
        ))}
      </Bento>

      <AnimatePresence>
        {zoom && (
          <Lightbox
            as={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setZoom(null)}
          >
            <LightboxClose onClick={() => setZoom(null)}><FaTimes /></LightboxClose>
            <LightboxImg
              as={motion.img}
              src={zoom.src}
              alt={zoom.alt}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1,    opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            />
            <LightboxCaption>
              <span className="tag">{zoom.tag}</span>
              <span className="name">{zoom.alt}</span>
            </LightboxCaption>
          </Lightbox>
        )}
      </AnimatePresence>
    </Page>
  );
};

export default Documentation;

const Page = styled.div`
  padding: 80px 6vw 80px;
  max-width: 1400px;
  margin: 0 auto;
  @media (max-width: 768px) { padding: 60px 5vw; }
`;
const SectionHeader = styled.div` text-align: center; margin-bottom: 32px; `;
const Eyebrow = styled.div`
  font-family: var(--font-mono);
  font-size: 12px; letter-spacing: 0.2em;
  color: var(--tittle-color);
  margin-bottom: 12px;
  text-transform: uppercase;
`;
const Title = styled.h2`
  font-size: clamp(2rem, 4.5vw, 3.5rem);
  font-weight: 700;
  margin: 0;
  color: var(--text-color);
  .grad { background: var(--gradient-text); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
`;
const Sub = styled.p` color: var(--text-muted); margin-top: 12px; font-size: 16px; `;

const Bento = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 200px;
  grid-auto-flow: dense;
  gap: 16px;
  @media (max-width: 968px) {
    grid-auto-rows: 170px;
  }
  @media (max-width: 568px) {
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: 150px;
  }
`;

const TileSlot = styled.div`
  position: relative;
  grid-column: ${({ size }) =>
    size === 'lg' ? 'span 2' :
    size === 'md' ? 'span 2' : 'span 1'};
  grid-row: ${({ size }) =>
    size === 'lg' ? 'span 2' : 'span 1'};

  /* the tilt wrapper from fx.js must fill the slot */
  & > div { width: 100%; height: 100%; }

  @media (max-width: 568px) {
    grid-column: ${({ size }) => (size === 'lg' ? 'span 2' : 'span 1')};
    grid-row: ${({ size }) => (size === 'lg' ? 'span 2' : 'span 1')};
  }
`;

const Tile = styled.button`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  background: var(--card-bg-solid);
  cursor: pointer;
  padding: 0;
  text-align: left;
  isolation: isolate;
  transition: border-color 0.3s, box-shadow 0.3s;

  &:hover {
    border-color: var(--accent-1);
    box-shadow: 0 12px 40px rgba(0,0,0,0.5), 0 0 32px var(--accent-glow);
  }
  &:hover .glow { opacity: 1; }
  &:hover .img { transform: scale(1.06); }
  &:hover .ov  { background: linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.85)); }
`;

const TileImg = styled.div.attrs({ className: 'img' })`
  position: absolute; inset: 0;
  background-size: cover;
  background-position: center top;
  transition: transform 0.6s cubic-bezier(0.16,1,0.3,1);
`;
const TileOverlay = styled.div.attrs({ className: 'ov' })`
  position: absolute; inset: 0;
  display: flex; flex-direction: column; justify-content: flex-end;
  padding: 16px;
  background: linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.7));
  transition: background 0.35s;
  z-index: 2;
`;
const TileTag = styled.div`
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--accent-1);
  margin-bottom: 4px;
  text-shadow: 0 0 8px var(--accent-glow);
`;
const TileTitle = styled.div`
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 18px;
  color: #fff;
  letter-spacing: -0.01em;
  line-height: 1.2;
`;
const TileGlow = styled.div.attrs({ className: 'glow' })`
  position: absolute; inset: -1px;
  border-radius: inherit;
  background: linear-gradient(135deg, var(--accent-1), var(--accent-2), var(--accent-3));
  opacity: 0;
  z-index: -1;
  filter: blur(20px);
  transition: opacity 0.35s;
`;

const Lightbox = styled.div`
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  padding: 5vw;
  cursor: pointer;
`;
const LightboxImg = styled.img`
  max-width: 100%;
  max-height: 85vh;
  border-radius: var(--radius-lg);
  border: 1px solid var(--glass-border-strong);
  box-shadow: 0 20px 80px rgba(0,0,0,0.8), 0 0 40px var(--accent-glow);
  cursor: zoom-out;
`;
const LightboxClose = styled.button`
  position: absolute;
  top: 20px; right: 20px;
  width: 44px; height: 44px;
  border-radius: 50%;
  background: var(--card-bg-color);
  border: 1px solid var(--glass-border-strong);
  color: #fff;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  z-index: 2;
  &:hover { background: var(--accent-1); color: #07070d; }
`;
const LightboxCaption = styled.div`
  position: absolute;
  bottom: 24px;
  left: 50%; transform: translateX(-50%);
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  text-align: center;
  font-family: var(--font-mono);
  color: #fff;
  .tag  { font-size: 10px; letter-spacing: 0.2em; color: var(--accent-1); text-transform: uppercase; }
  .name { font-size: 16px; font-weight: 600; }
`;
