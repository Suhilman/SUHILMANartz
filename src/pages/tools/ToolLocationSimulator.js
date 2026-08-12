import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  FaLocationArrow, FaMapMarkerAlt, FaCopy, FaTrash, FaPlay, FaPlus, FaInfoCircle,
} from 'react-icons/fa';
import ToolShell from '../../components/tools/ToolShell';
import {
  Panel, PanelTitle, Btn, BtnGhost, Seg, SegBtn, Field, FieldLabel, Hint, NumberInput,
} from '../../components/tools/ToolUI';

const DEFAULT_CENTER = [-6.6350, 106.8290]; // Ciawi, Bogor

const pinIcon = new L.DivIcon({
  html: '<div style="background:linear-gradient(135deg,#00f0ff,#b14aff);width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4)"></div>',
  className: '', iconSize: [30, 30], iconAnchor: [15, 30],
});
const waypointIcon = new L.DivIcon({
  html: '<div style="background:#fff;width:12px;height:12px;border-radius:50%;border:3px solid #00f0ff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>',
  className: '', iconSize: [12, 12], iconAnchor: [6, 6],
});

function ClickHandler({ onPick }) {
  useMapEvents({ click(e) { onPick([e.latlng.lat, e.latlng.lng]); } });
  return null;
}

function AnimatedMarker({ path, onDone }) {
  const [pos, setPos] = useState(path[0]);

  useEffect(() => {
    let frame;
    let t = 0;
    const segLen = path.length - 1;
    const speed = 0.012;

    const step = () => {
      const idx = Math.min(Math.floor(t), segLen - 1);
      const localT = t - idx;
      const [lat1, lng1] = path[idx];
      const [lat2, lng2] = path[Math.min(idx + 1, segLen)];
      setPos([lat1 + (lat2 - lat1) * localT, lng1 + (lng2 - lng1) * localT]);
      t += speed;
      if (t >= segLen) { setPos(path[segLen]); onDone(); return; }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Marker position={pos} icon={pinIcon} />;
}

const ToolLocationSimulator = () => {
  const [theme] = useState(() => (document.body.getAttribute('data-theme') === 'light' ? 'light' : 'dark'));
  const [mode, setMode] = useState('teleport');
  const [pin, setPin] = useState(DEFAULT_CENTER);
  const [route, setRoute] = useState([]);
  const [playing, setPlaying] = useState(false);
  const [name, setName] = useState('');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(() => {
    try { return JSON.parse(localStorage.getItem('locSimSaved') || '[]'); } catch { return []; }
  });

  const handlePick = useCallback((latlng) => {
    if (mode === 'teleport') { setPin(latlng); }
    else if (!playing) { setRoute((r) => [...r, latlng]); }
  }, [mode, playing]);

  const copyCoords = () => {
    navigator.clipboard?.writeText(`${pin[0].toFixed(6)}, ${pin[1].toFixed(6)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const persistSaved = (next) => {
    setSaved(next);
    localStorage.setItem('locSimSaved', JSON.stringify(next));
  };

  const saveLocation = () => {
    if (!name.trim()) return;
    persistSaved([...saved, { name: name.trim(), lat: pin[0], lng: pin[1] }]);
    setName('');
  };

  const removeSaved = (idx) => persistSaved(saved.filter((_, i) => i !== idx));

  const jumpTo = (loc) => { setMode('teleport'); setPin([loc.lat, loc.lng]); };

  const tileUrl = theme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png';

  return (
    <ToolShell
      title="Location Simulator"
      icon={<FaLocationArrow />}
      subtitle="Interactive map demo, inspired by Location Artz"
    >
      <Disclaimer>
        <FaInfoCircle />
        <span>
          Demo interaktif — klik peta untuk memindahkan pin atau menyusun rute.
          Ini <b>tidak</b> mengubah lokasi GPS asli perangkat Anda atau memengaruhi aplikasi lain.
        </span>
      </Disclaimer>

      <Workspace>
        <Sidebar>
          <Panel>
            <PanelTitle>Mode</PanelTitle>
            <Seg>
              <SegBtn active={mode === 'teleport'} onClick={() => setMode('teleport')}>Teleport</SegBtn>
              <SegBtn active={mode === 'route'} onClick={() => { setMode('route'); setPlaying(false); }}>Route</SegBtn>
            </Seg>
            <Hint>
              {mode === 'teleport'
                ? 'Klik di peta untuk memindahkan pin.'
                : 'Klik beberapa titik di peta untuk menyusun rute, lalu simulasikan.'}
            </Hint>
          </Panel>

          {mode === 'teleport' ? (
            <Panel>
              <PanelTitle>Koordinat</PanelTitle>
              <CoordBox>{pin[0].toFixed(6)}, {pin[1].toFixed(6)}</CoordBox>
              <BtnGhost onClick={copyCoords}><FaCopy /> {copied ? 'Disalin!' : 'Salin koordinat'}</BtnGhost>
              <Field style={{ marginTop: 14 }}>
                <FieldLabel>Simpan lokasi ini</FieldLabel>
                <SaveRow>
                  <NumberInput
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveLocation()}
                    placeholder="Nama lokasi…"
                  />
                  <IconBtn onClick={saveLocation} title="Simpan"><FaPlus /></IconBtn>
                </SaveRow>
              </Field>
            </Panel>
          ) : (
            <Panel>
              <PanelTitle>Rute ({route.length} titik)</PanelTitle>
              <Btn disabled={route.length < 2 || playing} onClick={() => setPlaying(true)}>
                <FaPlay /> Simulasikan rute
              </Btn>
              <BtnGhost style={{ marginTop: 8 }} onClick={() => { setRoute([]); setPlaying(false); }}>
                <FaTrash /> Reset rute
              </BtnGhost>
              <Hint>Rute berjalan dari titik pertama ke titik terakhir secara berurutan.</Hint>
            </Panel>
          )}

          {saved.length > 0 && (
            <Panel>
              <PanelTitle>Lokasi tersimpan</PanelTitle>
              {saved.map((loc, i) => (
                <SavedRow key={`${loc.name}-${i}`}>
                  <button onClick={() => jumpTo(loc)}><FaMapMarkerAlt /> {loc.name}</button>
                  <TrashBtn onClick={() => removeSaved(i)} title="Hapus"><FaTrash /></TrashBtn>
                </SavedRow>
              ))}
            </Panel>
          )}
        </Sidebar>

        <MapWrap>
          <MapContainer center={pin} zoom={14} style={{ height: '100%', width: '100%' }} key={theme}>
            <TileLayer url={tileUrl} />
            <ClickHandler onPick={handlePick} />
            {mode === 'teleport' && <Marker position={pin} icon={pinIcon} />}
            {mode === 'route' && route.length > 0 && (
              <>
                <Polyline positions={route} pathOptions={{ color: '#00f0ff', weight: 3, dashArray: '6 8' }} />
                {route.map((p, i) => <Marker key={i} position={p} icon={waypointIcon} />)}
                {playing && <AnimatedMarker path={route} onDone={() => setPlaying(false)} />}
              </>
            )}
          </MapContainer>
        </MapWrap>
      </Workspace>
    </ToolShell>
  );
};

export default ToolLocationSimulator;

const Disclaimer = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  margin-bottom: 16px;
  border-radius: var(--radius-md);
  background: var(--button-background-color);
  border: 1px solid var(--glass-border-strong);
  color: var(--text-color);
  font-size: 13px;
  line-height: 1.5;
  svg { flex-shrink: 0; margin-top: 2px; color: var(--tittle-color); }
  b { color: var(--tittle-color); }
`;

const Workspace = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 16px;
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const MapWrap = styled.div`
  position: relative;
  height: 620px;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--glass-border);
  .leaflet-container { background: var(--card-bg-solid); }
  @media (max-width: 900px) {
    height: 420px;
  }
`;

const CoordBox = styled.div`
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text-color);
  background: var(--card-bg-solid);
  border: 1px solid var(--glass-border-strong);
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 10px;
  word-break: break-all;
`;

const SaveRow = styled.div`
  display: flex;
  gap: 8px;
  input { flex: 1; }
`;

const IconBtn = styled.button`
  flex-shrink: 0;
  width: 40px;
  border: 1px solid var(--glass-border-strong);
  background: var(--gradient-primary);
  color: #fff;
  border-radius: 10px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: box-shadow 0.2s;
  &:hover { box-shadow: 0 0 16px var(--accent-glow); }
`;

const SavedRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  &:last-child { margin-bottom: 0; }

  button {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--card-bg-solid);
    border: 1px solid var(--glass-border);
    color: var(--text-color);
    border-radius: 8px;
    padding: 8px 10px;
    font-size: 13px;
    cursor: pointer;
    text-align: left;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    transition: border-color 0.2s;
    &:hover { border-color: var(--accent-1); color: var(--tittle-color); }
    svg { flex-shrink: 0; color: var(--tittle-color); }
  }
`;

const TrashBtn = styled.button`
  flex-shrink: 0;
  width: 32px; height: 32px;
  border-radius: 8px;
  border: 1px solid var(--glass-border);
  background: var(--card-bg-solid);
  color: var(--text-muted);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
  &:hover { border-color: var(--accent-3); color: var(--accent-3); }
`;
