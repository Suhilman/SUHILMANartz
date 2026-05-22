import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Select, MenuItem, Box } from '@mui/material';
import BasicGlobe from './Animation/Globe';
import { RevealWords } from './fx';
import CarColorPicker from './Animation/Car';
import Car360Viewer from './Animation/360';
import ArtWork from './Animation/Artwork';
import DeviceShowcase from './Animation/netflix';
import DonutLoader from './Animation/donut';

const tabs = [
  { key: 'netflix',   label: 'Netflix Showcase', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Netflix_2016_N_logo.svg/250px-Netflix_2016_N_logo.svg.png' },
  { key: 'shoes360',  label: 'Shoes 360 Viewer', iconUrl: 'https://ir.ebaystatic.com/pictures/aw/pics/sneakers/58_c513b4495f.png' },
  { key: 'carPicker', label: 'Car Color Picker', iconUrl: 'https://pngimg.com/uploads/volkswagen/volkswagen_PNG1777.png' },
  { key: 'globe',     label: '3D Globe',         iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Earth_Western_Hemisphere_transparent_background.png' },
  { key: 'circular',  label: 'Donut Loader',     iconUrl: 'https://png.pngtree.com/recommend-works/png-clipart/20240515/ourmid/pngtree-sircle-art-shape-png-image_12449903.png' },
  { key: 'artwork',   label: 'Art Work',         iconUrl: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/i/e68661bc-4ef3-4c17-8f56-2e06183279b3/d8q8eqc-d4be5479-bd0c-4be4-9ee7-7cf2906f947e.png/v1/fill/w_894,h_894/mario_head_by_esmasrico_d8q8eqc-pre.png' },
];

const Animation = () => {
  const [selectedTab, setSelectedTab] = useState('netflix');

  const renderContent = () => {
    switch (selectedTab) {
      case 'globe':     return <Centered><BasicGlobe style={{ maxWidth: '100%', width: 600, height: 600 }} /></Centered>;
      case 'netflix':   return <DeviceShowcase />;
      case 'shoes360':  return <Car360Viewer />;
      case 'carPicker': return <CarColorPicker />;
      case 'artwork':   return <ArtWork />;
      case 'circular':  return <DonutLoader />;
      default: return null;
    }
  };

  return (
    <Page>
      <SectionHeader>
        <Eyebrow>{'// 03 — Interactive'}</Eyebrow>
        <Title><RevealWords>Animation</RevealWords> <RevealWords as="span" className="grad" delay={0.2}>Lab</RevealWords></Title>
        <Sub>A small playground of micro-experiences I've crafted.</Sub>
      </SectionHeader>

      <Shell>
        <Sidebar>
          {tabs.map((t) => (
            <SideItem
              key={t.key}
              active={selectedTab === t.key}
              onClick={() => setSelectedTab(t.key)}
              whileHover={{ x: 4 }}
            >
              <IconBox><img src={t.iconUrl} alt={t.label} /></IconBox>
              <span>{t.label}</span>
              {selectedTab === t.key && <ActiveDot layoutId="activeTab" />}
            </SideItem>
          ))}
        </Sidebar>

        <Mobile>
          <Select
            value={selectedTab}
            onChange={(e) => setSelectedTab(e.target.value)}
            fullWidth
            size="small"
            renderValue={(value) => {
              const t = tabs.find((x) => x.key === value);
              if (!t) return null;
              return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    component="img"
                    src={t.iconUrl}
                    alt={t.label}
                    sx={{ width: 22, height: 22, objectFit: 'contain', borderRadius: '6px', flexShrink: 0 }}
                  />
                  <Box sx={{ fontWeight: 600, fontSize: 14 }}>{t.label}</Box>
                </Box>
              );
            }}
            sx={{
              backgroundColor: 'var(--card-bg-color)',
              backdropFilter: 'var(--blur-glass)',
              WebkitBackdropFilter: 'var(--blur-glass)',
              color: 'var(--text-color)',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-body)',
              '.MuiSelect-select': {
                py: 1.25,
                px: 1.5,
                display: 'flex',
                alignItems: 'center',
              },
              '.MuiOutlinedInput-notchedOutline': {
                borderColor: 'var(--glass-border-strong)',
                borderWidth: '1px',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--accent-1)' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'var(--accent-1)',
                borderWidth: '1px',
                boxShadow: '0 0 0 3px var(--accent-glow)',
              },
              '.MuiSvgIcon-root': { color: 'var(--tittle-color)' },
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  mt: 1,
                  backgroundColor: 'var(--card-bg-solid)',
                  color: 'var(--text-color)',
                  border: '1px solid var(--glass-border-strong)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  '.MuiMenuItem-root': {
                    py: 1.25,
                    px: 1.5,
                    fontFamily: 'var(--font-body)',
                    fontSize: 14,
                    borderRadius: '8px',
                    mx: 0.75,
                    my: 0.25,
                    transition: 'background 0.2s, color 0.2s',
                  },
                  '.MuiMenuItem-root:hover': {
                    backgroundColor: 'var(--button-background-color)',
                    color: 'var(--tittle-color)',
                  },
                  '.MuiMenuItem-root.Mui-selected': {
                    backgroundColor: 'var(--button-background-color)',
                    color: 'var(--tittle-color)',
                    fontWeight: 600,
                  },
                  '.MuiMenuItem-root.Mui-selected:hover': {
                    backgroundColor: 'var(--button-background-color-hover)',
                  },
                },
              },
              transformOrigin: { vertical: 'top', horizontal: 'left' },
              anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
            }}
          >
            {tabs.map((t) => (
              <MenuItem key={t.key} value={t.key} sx={{ display: 'flex', gap: 1.5 }}>
                <Box
                  component="img"
                  src={t.iconUrl}
                  alt={t.label}
                  sx={{ width: 22, height: 22, objectFit: 'contain', borderRadius: '6px', flexShrink: 0 }}
                />
                <Box sx={{ flex: 1 }}>{t.label}</Box>
              </MenuItem>
            ))}
          </Select>
        </Mobile>

        <Content>
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedTab}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
              style={{ width: '100%' }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </Content>
      </Shell>
    </Page>
  );
};

export default Animation;

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

const Shell = styled.div`
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 20px;
  background: var(--gradient-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: 20px;
  backdrop-filter: var(--blur-glass);
  -webkit-backdrop-filter: var(--blur-glass);
  @media (max-width: 968px) { grid-template-columns: 1fr; padding: 16px; }
`;

const Sidebar = styled.div`
  display: flex; flex-direction: column; gap: 6px;
  @media (max-width: 968px) { display: none; }
`;

const SideItem = styled(motion.button)`
  position: relative;
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px;
  background: ${({ active }) => (active ? 'var(--button-background-color)' : 'transparent')};
  border: 1px solid ${({ active }) => (active ? 'var(--accent-1)' : 'transparent')};
  border-radius: 12px;
  cursor: pointer;
  color: ${({ active }) => (active ? 'var(--tittle-color)' : 'var(--text-color)')};
  font-size: 14px; font-weight: 500;
  text-align: left;
  width: 100%;
  transition: all 0.2s;
  ${({ active }) => active && 'box-shadow: 0 0 16px var(--accent-glow);'}
  &:hover { background: var(--button-background-color); color: var(--tittle-color); }
`;

const IconBox = styled.div`
  width: 36px; height: 36px;
  border-radius: 10px;
  background: var(--card-bg-color);
  border: 1px solid var(--glass-border);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  img { max-width: 60%; max-height: 60%; object-fit: contain; }
`;
const ActiveDot = styled(motion.div)`
  margin-left: auto;
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--accent-1);
  box-shadow: 0 0 10px var(--accent-glow);
`;

const Mobile = styled.div`
  display: none;
  @media (max-width: 968px) {
    display: block;
    margin-bottom: 16px;
    width: 100%;
  }
`;

const Content = styled.div`
  background: var(--card-bg-color);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  padding: 20px;
  min-height: 540px;
  max-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;

  /* Scale & contain whatever the child renders so it always fits */
  & > div { width: 100%; max-width: 100%; }
  & * { max-width: 100% !important; }
  img, canvas, svg, video {
    max-width: 100% !important;
    max-height: 100% !important;
    object-fit: contain;
  }

  @media (max-width: 968px) {
    min-height: 420px;
    padding: 14px;
  }
`;

const Centered = styled.div`
  display: flex; justify-content: center; align-items: center;
  width: 100%; height: 100%;
  max-width: 100%; overflow: hidden;
`;
