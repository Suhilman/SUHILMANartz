import styled, { css } from 'styled-components';

/* ---------- layout ---------- */
export const Workspace = styled.div`
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 20px;
  align-items: start;
  @media (max-width: 968px) {
    grid-template-columns: 1fr;
  }
`;

export const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: 148px;
  max-height: calc(100vh - 168px);
  overflow-y: auto;
  padding-right: 4px;
  @media (max-width: 968px) {
    position: static;
    max-height: none;
  }
`;

export const Stage = styled.div`
  min-height: 540px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

/* ---------- panel / card ---------- */
export const Panel = styled.div`
  background: var(--card-bg-color);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  padding: 16px;
  backdrop-filter: var(--blur-glass);
  -webkit-backdrop-filter: var(--blur-glass);
`;

export const PanelTitle = styled.div`
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const Field = styled.div`
  margin-bottom: 14px;
  &:last-child { margin-bottom: 0; }
`;

export const FieldLabel = styled.div`
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 6px;
  display: flex;
  justify-content: space-between;
  b { color: var(--text-color); font-weight: 600; }
`;

/* ---------- dropzone ---------- */
export const Dropzone = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  cursor: pointer;
  padding: 24px 14px;
  border: 1.6px dashed var(--glass-border-strong);
  border-radius: var(--radius-md);
  background: var(--card-bg-solid);
  transition: border-color 0.2s, background 0.2s;
  &:hover { border-color: var(--accent-1); }
  ${({ over }) => over && css`
    border-color: var(--accent-1);
    background: var(--button-background-color);
  `}
`;

export const DropIcon = styled.div`
  width: 42px; height: 42px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  background: var(--button-background-color);
  color: var(--tittle-color);
  font-size: 18px;
`;

export const DropTitle = styled.b`
  font-size: 13.5px;
  color: var(--text-color);
`;

export const DropHint = styled.span`
  font-size: 11.5px;
  color: var(--text-muted);
`;

export const DropFormats = styled.span`
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
  opacity: 0.7;
`;

/* ---------- inputs ---------- */
export const Select = styled.select`
  width: 100%;
  background: var(--card-bg-solid);
  color: var(--text-color);
  border: 1px solid var(--glass-border-strong);
  border-radius: 10px;
  padding: 9px 10px;
  font: inherit;
  font-size: 13px;
  &:focus { outline: none; border-color: var(--accent-1); }
`;

export const NumberInput = styled.input`
  width: 100%;
  background: var(--card-bg-solid);
  color: var(--text-color);
  border: 1px solid var(--glass-border-strong);
  border-radius: 10px;
  padding: 9px 10px;
  font: inherit;
  font-size: 13px;
  &:focus { outline: none; border-color: var(--accent-1); }
`;

export const Range = styled.input`
  width: 100%;
  -webkit-appearance: none;
  appearance: none;
  height: 5px;
  border-radius: 999px;
  background: var(--gradient-primary);
  outline: none;
  margin: 4px 0;
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px; height: 16px;
    border-radius: 50%;
    background: #fff;
    border: 2.5px solid var(--accent-1);
    box-shadow: 0 0 8px var(--accent-glow);
    cursor: pointer;
  }
  &::-moz-range-thumb {
    width: 16px; height: 16px;
    border-radius: 50%;
    background: #fff;
    border: 2.5px solid var(--accent-1);
    cursor: pointer;
  }
`;

export const Checkbox = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-color);
  cursor: pointer;
  margin-bottom: 8px;
  input { accent-color: var(--accent-1); width: 15px; height: 15px; }
`;

export const Grid2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

/* ---------- segmented control ---------- */
export const Seg = styled.div`
  display: flex;
  background: var(--card-bg-solid);
  border: 1px solid var(--glass-border-strong);
  border-radius: 10px;
  padding: 3px;
  gap: 2px;
`;

export const SegBtn = styled.button`
  flex: 1;
  border: 0;
  background: ${({ active }) => (active ? 'var(--gradient-primary)' : 'transparent')};
  color: ${({ active }) => (active ? '#fff' : 'var(--text-muted)')};
  padding: 7px 4px;
  border-radius: 8px;
  font: inherit;
  font-size: 12px;
  font-weight: ${({ active }) => (active ? 600 : 500)};
  cursor: pointer;
  transition: all 0.2s;
`;

/* ---------- buttons ---------- */
export const Btn = styled.button`
  width: 100%;
  border: none;
  border-radius: 12px;
  padding: 12px;
  font: inherit;
  font-weight: 650;
  font-size: 14px;
  cursor: pointer;
  background: var(--gradient-primary);
  color: #fff;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  box-shadow: var(--shadow-neon);
  transition: box-shadow 0.25s, transform 0.15s, opacity 0.2s;
  &:hover:not(:disabled) { box-shadow: 0 0 28px var(--accent-glow); transform: translateY(-1px); }
  &:disabled { opacity: 0.5; cursor: default; transform: none; }
`;

export const BtnGhost = styled(Btn)`
  background: var(--card-bg-color);
  color: var(--text-color);
  border: 1px solid var(--glass-border-strong);
  box-shadow: none;
  &:hover:not(:disabled) {
    border-color: var(--accent-1);
    color: var(--tittle-color);
    box-shadow: 0 0 16px var(--accent-glow);
    transform: translateY(-1px);
  }
`;

/* ---------- toolbar (compare / zoom) ---------- */
export const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 10px 14px;
  background: var(--card-bg-color);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  font-size: 12px;
  color: var(--text-muted);
`;

export const ToolbarBtn = styled.button`
  border: 1px solid ${({ active }) => (active ? 'var(--accent-1)' : 'var(--glass-border-strong)')};
  background: ${({ active }) => (active ? 'var(--button-background-color)' : 'var(--card-bg-solid)')};
  color: ${({ active }) => (active ? 'var(--tittle-color)' : 'var(--text-color)')};
  border-radius: 8px;
  padding: 6px 10px;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  display: inline-flex; align-items: center; gap: 6px;
  transition: all 0.2s;
  &:hover { border-color: var(--accent-1); }
`;

export const ToolbarSep = styled.div`
  width: 1px; height: 18px;
  background: var(--glass-border-strong);
`;

/* ---------- canvas viewport ---------- */
export const ViewportFrame = styled.div`
  position: relative;
  flex: 1;
  min-height: 460px;
  overflow: hidden;
  border-radius: var(--radius-md);
  border: 1px solid var(--glass-border);
  background:
    repeating-conic-gradient(rgba(255,255,255,0.04) 0% 25%, transparent 0% 50%) 50% / 22px 22px,
    var(--card-bg-solid);
  display: flex; align-items: center; justify-content: center;
  cursor: grab;
  &.dragging { cursor: grabbing; }
  @media (max-width: 768px) { min-height: 340px; }
`;

export const Badge = styled.div`
  position: absolute;
  top: 10px;
  ${({ side }) => (side === 'right' ? 'right: 10px;' : 'left: 10px;')}
  padding: 4px 10px;
  border-radius: 8px;
  background: rgba(0,0,0,0.55);
  color: #fff;
  font-size: 11px;
  letter-spacing: 0.05em;
  z-index: 6;
  pointer-events: none;
`;

export const CompareHandle = styled.div`
  position: absolute;
  top: 0; bottom: 0;
  left: ${({ split }) => split * 100}%;
  width: 2px;
  background: var(--accent-1);
  box-shadow: 0 0 0 1px rgba(0,0,0,0.4);
  cursor: ew-resize;
  z-index: 5;
  &::after {
    content: '';
    position: absolute;
    top: 50%; left: 50%;
    width: 28px; height: 28px;
    margin: -14px;
    border-radius: 50%;
    background: var(--accent-1);
    box-shadow: 0 2px 10px rgba(0,0,0,0.4);
  }
`;

/* ---------- floating action panel ---------- */
export const FloatPanel = styled.div`
  position: absolute;
  top: 12px; right: 12px;
  width: 250px;
  z-index: 15;
  background: color-mix(in srgb, var(--card-bg-solid) 88%, transparent);
  border: 1px solid var(--glass-border-strong);
  border-radius: var(--radius-md);
  padding: 14px;
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(10px) saturate(1.2);
  @media (max-width: 968px) {
    position: static;
    width: auto;
    margin-top: 14px;
  }
`;

/* ---------- overlays / feedback ---------- */
export const BusyOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(7,7,13,0.82);
  color: #fff;
  display: ${({ on }) => (on ? 'flex' : 'none')};
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  z-index: 20;
  backdrop-filter: blur(2px);
  text-align: center;
  padding: 20px;
`;

export const ProgressBar = styled.div`
  width: 220px;
  height: 6px;
  border-radius: 999px;
  background: rgba(255,255,255,0.15);
  overflow: hidden;
  i {
    display: block;
    height: 100%;
    width: ${({ p }) => p || 0}%;
    background: var(--gradient-primary);
    transition: width 0.15s;
  }
`;

export const ErrorText = styled.div`
  color: var(--accent-3);
  font-size: 12.5px;
  margin-top: 8px;
`;

export const Hint = styled.p`
  font-size: 11.5px;
  color: var(--text-muted);
  margin: 8px 0 0;
`;

export const DropOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: ${({ over }) => (over ? 'flex' : 'none')};
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  color: var(--text-color);
  background: var(--button-background-color);
  outline: 2px dashed var(--accent-1);
  outline-offset: -14px;
  z-index: 10;
  font-weight: 600;
`;
