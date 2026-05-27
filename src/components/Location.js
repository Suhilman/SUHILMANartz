import React from 'react';
import styled from 'styled-components';
import { FaArrowUp, FaMapMarkerAlt, FaCar, FaClock, FaMoneyBillWave, FaRoute } from 'react-icons/fa';
import { Tilt } from './fx';

const LocationCard = ({ address, isLoading, distance, travelTime }) => {
  const calculateFare = (km, min) => {
    const baseFare = 10200, costPerKm = 2550, costPerMinute = 2000, minimumFare = 15000;
    return Math.max(baseFare + costPerKm * km + costPerMinute * min, minimumFare);
  };

  const fare = !isLoading && distance != null && travelTime != null
    ? calculateFare(distance, travelTime).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
    : null;

  return (
    <Tilt max={7} scale={1.02} style={{ width: '100%' }}>
      <Card>
        <CardHead>
          <HeadIcon><FaRoute /></HeadIcon>
          <div>
            <HeadTitle>Route to me</HeadTitle>
            <HeadSub>Live distance from your location</HeadSub>
          </div>
        </CardHead>

        <Route>
          <Row>
            <DotGreen><FaArrowUp size={11} color="#fff" /></DotGreen>
            <RowText>
              <Label>Your Location</Label>
              {isLoading ? <SkeletonLine /> : <Value>{address || 'Locating…'}</Value>}
            </RowText>
          </Row>
          <Tail />
          <Row>
            <DotRed><FaMapMarkerAlt size={11} color="#fff" /></DotRed>
            <RowText>
              <Label>SUHILMANartz</Label>
              <Value>Gg. Wr. Seri, Ciawi, Kabupaten Bogor, Jawa Barat 16720</Value>
            </RowText>
          </Row>
        </Route>

        {isLoading ? (
          <Stats>
            <Stat><SkeletonChip /></Stat>
            <Stat><SkeletonChip /></Stat>
          </Stats>
        ) : (
          distance != null && travelTime != null && (
            <Stats>
              <Stat>
                <StatIcon><FaCar /></StatIcon>
                <StatText><b>{distance.toFixed(1)}</b><span>km</span></StatText>
              </Stat>
              <Stat>
                <StatIcon><FaClock /></StatIcon>
                <StatText><b>{travelTime.toFixed(0)}</b><span>min</span></StatText>
              </Stat>
              <FareStat>
                <StatIcon className="fare"><FaMoneyBillWave /></StatIcon>
                <StatText><b>{fare}</b><span>estimated fare</span></StatText>
              </FareStat>
            </Stats>
          )
        )}
      </Card>
    </Tilt>
  );
};

export default LocationCard;

const Card = styled.div`
  background: var(--gradient-card);
  backdrop-filter: var(--blur-glass);
  -webkit-backdrop-filter: var(--blur-glass);
  border: 1px solid var(--glass-border-strong);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: 18px;
  width: 100%;
  color: var(--text-color);
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s, box-shadow 0.3s;
  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: 3px;
    background: var(--gradient-primary);
  }
  &:hover { border-color: var(--accent-1); box-shadow: 0 0 26px var(--accent-glow); }
`;

const CardHead = styled.div`
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 16px;
`;
const HeadIcon = styled.div`
  width: 38px; height: 38px;
  border-radius: 11px;
  flex-shrink: 0;
  background: var(--gradient-primary);
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px;
  box-shadow: 0 0 16px var(--accent-glow);
`;
const HeadTitle = styled.div`
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 15px;
  color: var(--text-color);
  line-height: 1.1;
`;
const HeadSub = styled.div`
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  margin-top: 3px;
`;

const Route = styled.div`
  background: var(--card-bg-color);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  padding: 12px 14px;
`;

const Row = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 11px;
`;

const RowText = styled.div` flex: 1; min-width: 0; `;

const dot = `
  flex-shrink: 0;
  width: 24px; height: 24px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
`;
const DotGreen = styled.div`${dot} background: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,0.18);`;
const DotRed   = styled.div`${dot} background: #ef4444; box-shadow: 0 0 0 3px rgba(239,68,68,0.18);`;

const Tail = styled.div`
  height: 16px;
  margin-left: 11px;
  border-left: 2px dashed var(--glass-border-strong);
`;

const Label = styled.div` font-size: 10px; color: var(--tittle-color); text-transform: uppercase; letter-spacing: 0.12em; font-family: var(--font-mono); `;
const Value = styled.div` font-size: 12.5px; color: var(--text-color); margin-top: 3px; line-height: 1.45; `;

const Stats = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 12px;
`;
const Stat = styled.div`
  display: flex; align-items: center; gap: 9px;
  padding: 10px 12px;
  background: var(--card-bg-color);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  min-height: 46px;
`;
const FareStat = styled(Stat)`
  grid-column: 1 / -1;
`;
const StatIcon = styled.div`
  width: 28px; height: 28px;
  border-radius: 8px;
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0, 240, 255, 0.1);
  color: var(--tittle-color);
  font-size: 13px;
  &.fare { background: rgba(255, 91, 148, 0.12); color: var(--accent-3); }
`;
const StatText = styled.div`
  display: flex; flex-direction: column; line-height: 1.1; min-width: 0;
  b {
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 700;
    color: var(--text-color);
    letter-spacing: -0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  span {
    font-family: var(--font-mono);
    font-size: 9.5px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-top: 3px;
  }
`;

const SkeletonLine = styled.div`
  height: 12px;
  width: 80%;
  margin-top: 5px;
  border-radius: 6px;
  background: linear-gradient(90deg, var(--glass-border) 25%, var(--glass-border-strong) 50%, var(--glass-border) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.2s linear infinite;
  @keyframes shimmer { to { background-position: -200% 0; } }
`;
const SkeletonChip = styled(SkeletonLine)`
  width: 100%;
  height: 18px;
  margin-top: 0;
`;
