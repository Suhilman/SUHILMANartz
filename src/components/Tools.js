import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import {
  FaMagic, FaBezierCurve, FaCut, FaFileExport,
  FaFileImage, FaYoutube, FaMusic, FaToolbox, FaExternalLinkAlt,
} from 'react-icons/fa';
import { RevealWords, Tilt } from './fx';

const TOOLS = [
  { href: 'video-download.html',  label: 'YouTube Video Downloader',desc: 'Grab video files straight from a URL', icon: <FaYoutube />   },
  { href: 'youtube-to-mp3.html',  label: 'YouTube to MP3',          desc: 'Extract & convert audio to MP3',     icon: <FaMusic />       },
  { href: 'bgremove.html',        label: 'Remove Background',       desc: 'Cutout + brush edit + swap bg',      icon: <FaCut />         },
  { href: 'enhance.html',         label: 'Enhance / Upscale',       desc: 'Upscale up to 6× with tone repair', icon: <FaMagic />       },
  { href: 'vectorize.html',       label: 'Vectorize SVG',           desc: 'Raster to scalable vector art',      icon: <FaBezierCurve /> },
  { href: 'imageconvert.html',    label: 'Image Converter',         desc: 'PNG · JPEG · WebP · BMP · ICO',      icon: <FaFileImage />   },
  { href: 'convert.html',         label: 'Document Converter',      desc: 'TXT · MD · HTML · DOCX · PDF',       icon: <FaFileExport />  },
];

const Tools = () => {
  const pub = process.env.PUBLIC_URL || '';

  return (
    <Page>
      <SectionHeader>
        <Eyebrow>{'// 04 — Toolkit'}</Eyebrow>
        <Title>
          <RevealWords>Tools</RevealWords>{' '}
          <span className="grad">
            <RevealWords delay={0.15}>&amp;</RevealWords>{' '}
            <RevealWords delay={0.25}>App</RevealWords>
          </span>
        </Title>
        <Sub>Standalone browser utilities I've built — everything runs locally, nothing leaves your device.</Sub>
      </SectionHeader>

      <ChipGrid>
        {TOOLS.map((t, i) => (
          <Tilt key={t.href} max={6} scale={1.02}>
            <Chip
              href={`${pub}/tools/${t.href}`}
              target="_blank"
              rel="noopener noreferrer"
              as={motion.a}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.45, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            >
              <ChipIcon>{t.icon}</ChipIcon>
              <ChipText>
                <span className="label">{t.label}</span>
                <span className="desc">{t.desc}</span>
              </ChipText>
              <ChipGo><FaExternalLinkAlt size={11} /></ChipGo>
            </Chip>
          </Tilt>
        ))}

        <Tilt max={6} scale={1.02}>
          <Chip
            href={`${pub}/tools/index.html`}
            target="_blank"
            rel="noopener noreferrer"
            as={motion.a}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45, delay: TOOLS.length * 0.06, ease: [0.16, 1, 0.3, 1] }}
            $hero
          >
            <ChipIcon $hero><FaToolbox /></ChipIcon>
            <ChipText>
              <span className="label">Open Full Toolkit</span>
              <span className="desc">All utilities in one launcher</span>
            </ChipText>
            <ChipGo><FaExternalLinkAlt size={11} /></ChipGo>
          </Chip>
        </Tilt>
      </ChipGrid>
    </Page>
  );
};

export default Tools;

const Page = styled.div`
  padding: 100px 6vw 80px;
  max-width: 1280px;
  margin: 0 auto;
  @media (max-width: 768px) { padding: 80px 5vw 60px; }
`;
const SectionHeader = styled.div` text-align: center; margin-bottom: 40px; `;
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
  .grad, .grad * { background: var(--gradient-text); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
`;
const Sub = styled.p` color: var(--text-muted); margin-top: 12px; font-size: 16px; `;

const ChipGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  @media (max-width: 560px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  /* Tilt (fx.js) wraps each chip in its own motion.div — stretch it to
     fill the grid cell so the anchor inside still fills the card. */
  & > div { width: 100%; }
`;

const Chip = styled.a`
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  border-radius: var(--radius-lg);
  text-decoration: none;
  background: ${({ $hero }) => ($hero ? 'var(--gradient-card)' : 'var(--card-bg-color)')};
  border: 1px solid ${({ $hero }) => ($hero ? 'var(--accent-1)' : 'var(--glass-border)')};
  backdrop-filter: var(--blur-glass);
  -webkit-backdrop-filter: var(--blur-glass);
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.25s, box-shadow 0.25s;

  &:hover {
    border-color: var(--accent-1);
    box-shadow: 0 12px 32px rgba(0,0,0,0.3), 0 0 28px var(--accent-glow);
  }
  &:hover svg { transform: scale(1.08); }
`;

const ChipIcon = styled.div`
  flex-shrink: 0;
  width: 46px; height: 46px;
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 19px;
  color: ${({ $hero }) => ($hero ? '#fff' : 'var(--tittle-color)')};
  background: ${({ $hero }) => ($hero ? 'var(--gradient-primary)' : 'var(--button-background-color)')};
  box-shadow: ${({ $hero }) => ($hero ? 'var(--shadow-neon)' : 'none')};
  svg { transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
`;

const ChipText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  .label {
    font-size: 14.5px;
    font-weight: 600;
    color: var(--text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .desc {
    font-size: 12px;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const ChipGo = styled.div`
  margin-left: auto;
  flex-shrink: 0;
  color: var(--text-muted);
  opacity: 0.6;
  transition: opacity 0.25s, color 0.25s;
  ${Chip}:hover & { opacity: 1; color: var(--tittle-color); }
`;
