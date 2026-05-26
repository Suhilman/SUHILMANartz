import React, { useEffect, useState } from 'react';
import { Stack } from '@mui/material';
import { motion } from 'framer-motion';
import { Link as ScrollLink } from 'react-scroll';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import styled, { keyframes } from 'styled-components';

import { techStack, getSocialLinks, platforms } from './data';
import profile from '../assets/suhilman.png';
import Bdi from '../assets/bdi.png';
import Kemi from './tittle';
import { Magnetic } from './fx';

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};
const fadeUpItem = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const Hero = ({ isDarkMode }) => {
  const socialLinks = getSocialLinks(isDarkMode);
  const fullText = 'PT. Bis Data Indonesia';
  const [displayed, setDisplayed] = useState('');
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    let t;
    if (idx < fullText.length) {
      t = setTimeout(() => {
        setDisplayed((p) => p + fullText[idx]);
        setIdx((i) => i + 1);
      }, 90);
    } else {
      t = setTimeout(() => { setDisplayed(''); setIdx(0); }, 1500);
    }
    return () => clearTimeout(t);
  }, [idx]);

  return (
    <HeroWrapper>
      {/* Decorative blobs */}
      <Blob style={{ top: '-12%', left: '-8%', background: 'radial-gradient(circle, var(--accent-1) 0%, transparent 60%)' }} />
      <Blob style={{ bottom: '-15%', right: '-10%', background: 'radial-gradient(circle, var(--accent-2) 0%, transparent 60%)' }} />
      <Blob style={{ top: '40%', right: '20%', width: 220, height: 220, background: 'radial-gradient(circle, var(--accent-3) 0%, transparent 70%)' }} />
      <Grid />

      {/* Active chip — diposisikan di sisi kanan atas hero */}
      <ChipSlot
        as={motion.div}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <ActiveBadge>
          <span className="pulse" /> ACTIVE
        </ActiveBadge>
        <ActiveChip>
          <img src={Bdi} alt="BDI" />
          <span className="text">{displayed}</span>
        </ActiveChip>
      </ChipSlot>

      <Container
        as={motion.div}
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <Left>
          <span style={{ display: 'none' }}>
            <img src={Bdi} alt="BDI" />
            <span>{displayed || ' '}</span>
          </span>

          {/* Big name */}
          <motion.div variants={fadeUp} style={{ marginTop: 2 }}>
            <NameBlock>
              <Kemi />
            </NameBlock>
          </motion.div>

          {/* Description */}
          <motion.div variants={fadeUp}>
            <Description>
              Software engineer building modern digital experiences — from
              satellite network monitoring dashboards to mobile apps used
              every day.
            </Description>
          </motion.div>

          {/* Platforms */}
          <motion.div variants={fadeUp}>
            <Platforms>
              {platforms.map((p, i) => (
                <React.Fragment key={p}>
                  <motion.span whileHover={{ y: -2, color: 'var(--tittle-color)' }}>{p}</motion.span>
                  {i < platforms.length - 1 && <em>·</em>}
                </React.Fragment>
              ))}
            </Platforms>
          </motion.div>

          {/* CTA */}
          <motion.div variants={fadeUp}>
            <CTARow>
              <Magnetic strength={0.4}>
                <CTAPrimary to="documentation" smooth duration={600} offset={-60}>
                  View Documentation →
                </CTAPrimary>
              </Magnetic>
            </CTARow>
          </motion.div>

          {/* Tech stack */}
          <motion.div variants={fadeUp}>
            <SectionLabel>Tech Stack</SectionLabel>
          </motion.div>
          <Stack
            component={motion.div}
            variants={containerVariants}
            direction="row" flexWrap="wrap" gap={1}
            justifyContent={{ xs: 'center', md: 'flex-start' }}
            sx={{ mt: 1 }}
          >
            {techStack.map((t, i) => (
              <TechChip key={i} as={motion.div} variants={fadeUpItem} whileHover={{ y: -3, scale: 1.04 }}>
                {t.icon}
                <span>{t.name}</span>
              </TechChip>
            ))}
          </Stack>

          {/* Social */}
          <motion.div variants={fadeUp}>
            <SectionLabel>Social</SectionLabel>
          </motion.div>
          <Stack
            component={motion.div}
            variants={containerVariants}
            direction="row" flexWrap="wrap" gap={1}
            justifyContent={{ xs: 'center', md: 'flex-start' }}
            sx={{ mt: 1, mb: 4 }}
          >
            {socialLinks.map((s, i) => (
              <SocialLink
                key={i}
                href={s.href}
                target="_blank" rel="noopener noreferrer"
                as={motion.a}
                variants={fadeUpItem}
                whileHover={{ y: -3, scale: 1.04 }}
              >
                {s.icon}
                <span>{s.name}</span>
              </SocialLink>
            ))}
          </Stack>
        </Left>

        <Right>
          <ProfileWrap as={motion.div} variants={fadeUp}>
            <Ring1 />
            <Ring2 />
            <Glow />
            <ProfileImage src={profile} alt="Suhilman" />
          </ProfileWrap>

          <ScrollHint>
            <ScrollLink to="about" smooth duration={500} offset={-60}>
              <ScrollPill
                as={motion.div}
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 1.7, ease: 'easeInOut' }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.96 }}
              >
                <span className="label">Scroll Down</span>
                <KeyboardDoubleArrowDownIcon sx={{ fontSize: 28, color: 'var(--tittle-color)' }} />
              </ScrollPill>
            </ScrollLink>
          </ScrollHint>
        </Right>
      </Container>
    </HeroWrapper>
  );
};

export default Hero;

/* ---------- styled ---------- */

const float = keyframes`
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-14px); }
`;

const rotate = keyframes`
  to { transform: rotate(360deg); }
`;

const HeroWrapper = styled.section`
  position: relative;
  min-height: 100vh;
  padding: 96px 6vw 60px;
  overflow: hidden;
  isolation: isolate;
  @media (max-width: 968px) {
    padding: 96px 5vw 60px;
    min-height: auto;
  }
`;

const Blob = styled.div`
  position: absolute;
  width: 380px; height: 380px;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.55;
  z-index: -1;
  animation: ${float} 8s ease-in-out infinite;
`;

const Grid = styled.div`
  position: absolute; inset: 0;
  z-index: -1;
  background-image:
    linear-gradient(var(--glass-border) 1px, transparent 1px),
    linear-gradient(90deg, var(--glass-border) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse at center, #000 30%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse at center, #000 30%, transparent 75%);
  opacity: 0.4;
`;

const Container = styled.div`
  position: relative;
  max-width: 1280px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 60px;
  align-items: center;
  @media (max-width: 968px) {
    grid-template-columns: 1fr;
    gap: 40px;
    text-align: center;
  }
`;

const Left = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const ChipSlot = styled.div`
  position: absolute;
  top: 88px;
  right: 6vw;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  @media (max-width: 968px) {
    position: relative;
    top: auto; right: auto;
    align-items: center;
    margin: 0 0 4px;
    padding: 0 5vw;
  }
`;

const pulseDot = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(34,197,94,0.6); }
  50%      { transform: scale(1.2); opacity: 0.9; box-shadow: 0 0 0 6px rgba(34,197,94,0); }
`;

const ActiveBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  margin-bottom: 6px;
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.35);
  border-radius: 999px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  line-height: 1;
  width: fit-content;

  .pulse {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #22c55e;
    animation: ${pulseDot} 1.6s ease-in-out infinite;
  }
  @media (max-width: 968px) { align-self: center; margin-left: auto; margin-right: auto; }
`;

const ActiveChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px 5px 6px;
  min-height: 28px;
  min-width: 200px;
  border: 1px solid var(--glass-border);
  background: var(--card-bg-color);
  backdrop-filter: var(--blur-glass);
  -webkit-backdrop-filter: var(--blur-glass);
  border-radius: 999px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
  align-self: flex-start;
  img  { width: 18px; height: 18px; border-radius: 50%; object-fit: cover; }
  .text { color: var(--text-color); font-weight: 500; }
  @media (max-width: 968px) { align-self: center; }
`;

const NameBlock = styled.div`
  position: relative;
  min-height: clamp(56px, 9.5vw, 110px);
  margin-bottom: 8px;
  @media (max-width: 968px) {
    min-height: clamp(64px, 15vw, 100px);
    margin-bottom: 12px;
  }
`;

const Description = styled.p`
  font-size: clamp(1rem, 1.4vw, 1.125rem);
  line-height: 1.65;
  color: var(--text-muted);
  max-width: 560px;
  margin: 4px 0 0;
  @media (max-width: 968px) { margin: 4px auto 0; }
`;

const Platforms = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  gap: 14px;
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
  span { cursor: pointer; transition: color 0.2s, transform 0.2s; }
  em   { color: var(--accent-2); font-style: normal; }
  @media (max-width: 968px) { justify-content: center; }
`;

const CTARow = styled.div`
  display: flex; flex-wrap: wrap; gap: 12px;
  margin-top: 8px;
  @media (max-width: 968px) { justify-content: center; }
`;

const CTAPrimary = styled(ScrollLink)`
  display: inline-flex; align-items: center; justify-content: center;
  padding: 14px 28px;
  background: var(--gradient-primary);
  color: #fff;
  font-weight: 600; font-size: 14px;
  border-radius: 999px;
  cursor: pointer;
  box-shadow: var(--shadow-neon);
  transition: transform 0.25s, box-shadow 0.25s;
  &:hover { transform: translateY(-2px); box-shadow: 0 0 32px var(--accent-glow); }
`;

const SectionLabel = styled.div`
  margin-top: 24px;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--text-muted);
  &::before {
    content: '';
    display: inline-block;
    width: 24px; height: 1px;
    background: var(--gradient-primary);
    margin-right: 10px;
    vertical-align: middle;
  }
  @media (max-width: 968px) {
    text-align: center;
  }
`;

const TechChip = styled.div`
  display: inline-flex; align-items: center; gap: 8px;
  padding: 6px 12px;
  background: var(--card-bg-color);
  border: 1px solid var(--glass-border);
  border-radius: 999px;
  font-size: 13px; font-weight: 500;
  color: var(--text-color);
  cursor: default;
  transition: all 0.25s;
  svg { color: var(--tittle-color); font-size: 16px; }
  &:hover { border-color: var(--accent-1); box-shadow: 0 0 12px var(--accent-glow); }
`;

const SocialLink = styled.a`
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 14px;
  background: var(--card-bg-color);
  border: 1px solid var(--glass-border);
  border-radius: 999px;
  font-size: 13px; font-weight: 500;
  color: var(--text-color) !important;
  text-decoration: none;
  transition: all 0.25s;
  span { color: var(--text-color); }
  & > *:first-child { display: inline-flex; align-items: center; font-size: 18px; }
  & > *:first-child img { width: 18px !important; height: 18px !important; margin: 0 !important; }
  &:hover { border-color: var(--accent-1); box-shadow: 0 0 12px var(--accent-glow); transform: translateY(-2px); }
`;

const Right = styled.div`
  position: relative;
  display: flex; justify-content: center; align-items: center;
  min-height: 380px;
  @media (max-width: 968px) {
    flex-direction: column;
    min-height: auto;
    gap: 0;
  }
`;

const ProfileWrap = styled.div`
  position: relative;
  width: clamp(280px, 36vw, 460px);
  aspect-ratio: 1 / 1;
  display: flex; align-items: center; justify-content: center;
`;

const Ring1 = styled.div`
  position: absolute; inset: 0;
  border: 2px dashed var(--accent-1);
  border-radius: 50%;
  opacity: 0.35;
  animation: ${rotate} 24s linear infinite;
`;
const Ring2 = styled.div`
  position: absolute; inset: 8%;
  border: 1px dashed var(--accent-2);
  border-radius: 50%;
  opacity: 0.3;
  animation: ${rotate} 18s linear infinite reverse;
`;
const Glow = styled.div`
  position: absolute; inset: 12%;
  border-radius: 50%;
  background: radial-gradient(circle, var(--accent-1) 0%, transparent 70%);
  opacity: 0.35;
  filter: blur(30px);
  animation: ${float} 6s ease-in-out infinite;
`;
const ProfileImage = styled.img`
  position: relative;
  z-index: 1;
  width: 90%;
  height: 90%;
  object-fit: contain;
  animation: ${float} 5s ease-in-out infinite;
  filter: drop-shadow(0 20px 40px rgba(0,0,0,0.4));
`;

const ScrollHint = styled.div`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  cursor: pointer;
  z-index: 3;
  & > a { display: inline-block; text-decoration: none; }
  @media (max-width: 968px) {
    position: relative;
    bottom: auto;
    left: auto;
    transform: none;
    width: 100%;
    text-align: center;
    margin-top: -72px;
    z-index: 5;
    & > a { display: inline-block; }
  }
`;

const ScrollPill = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 14px;
  padding: 14px 28px;
  background: var(--card-bg-color);
  backdrop-filter: var(--blur-glass);
  -webkit-backdrop-filter: var(--blur-glass);
  border: 2px solid var(--accent-1);
  border-radius: 999px;
  box-shadow: 0 0 28px var(--accent-glow);
  color: var(--text-color);
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
  transition: box-shadow 0.25s, border-color 0.25s;
  .label { color: var(--text-color); }
  &:hover {
    box-shadow: 0 0 44px var(--accent-glow);
    border-color: var(--accent-2);
  }
  @media (max-width: 968px) {
    font-size: 13px;
    padding: 12px 24px;
    gap: 12px;
  }
`;
