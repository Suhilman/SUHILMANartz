import React from 'react';
import styled from 'styled-components';
import { FaArrowUp, FaMapMarkerAlt, FaCar, FaClock, FaMoneyBillWave } from 'react-icons/fa';

const LocationCard = ({ address, isLoading, distance, travelTime }) => {
  const calculateFare = (km, min) => {
    const baseFare = 10200, costPerKm = 2550, costPerMinute = 2000, minimumFare = 15000;
    return Math.max(baseFare + costPerKm * km + costPerMinute * min, minimumFare);
  };

  const fare = !isLoading && distance != null && travelTime != null
    ? calculateFare(distance, travelTime).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
    : null;

  return (
    <Card>
      <Row>
        <DotGreen><FaArrowUp size={11} color="#fff" /></DotGreen>
        <RowText>
          <Label>Your Location</Label>
          {isLoading ? <Loader /> : <Value>{address || 'Locating…'}</Value>}
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

      <Divider />

      {isLoading ? <Loader /> : (
        distance != null && travelTime != null && (
          <Meta>
            <MetaItem><FaCar /> {distance.toFixed(1)} km</MetaItem>
            <MetaItem><FaClock /> {travelTime.toFixed(0)} min</MetaItem>
            <Fare><FaMoneyBillWave /> <strong>{fare}</strong><sub>est.</sub></Fare>
          </Meta>
        )
      )}
    </Card>
  );
};

export default LocationCard;

const Card = styled.div`
  background: var(--gradient-card);
  backdrop-filter: var(--blur-glass);
  -webkit-backdrop-filter: var(--blur-glass);
  border: 1px solid var(--glass-border-strong);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  padding: 14px;
  width: 280px;
  color: var(--text-color);
  transition: transform 0.3s, box-shadow 0.3s;
  &:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
`;

const Row = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 4px 0;
`;

const RowText = styled.div` flex: 1; min-width: 0; `;

const dot = `
  flex-shrink: 0;
  width: 24px; height: 24px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 0 3px rgba(255,255,255,0.05);
`;
const DotGreen = styled.div`${dot} background: #22c55e;`;
const DotRed   = styled.div`${dot} background: #ef4444;`;

const Tail = styled.div`
  height: 14px;
  margin-left: 11px;
  border-left: 2px dashed var(--glass-border-strong);
`;

const Label = styled.div` font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; font-family: var(--font-mono); `;
const Value = styled.div` font-size: 12px; color: var(--text-color); margin-top: 2px; line-height: 1.45; `;

const Divider = styled.hr` border: none; height: 1px; background: var(--divider-color); margin: 10px 0; `;

const Meta = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
  font-size: 12px;
`;
const MetaItem = styled.div`
  display: flex; align-items: center; gap: 6px;
  color: var(--text-muted);
  svg { color: var(--tittle-color); }
`;
const Fare = styled.div`
  grid-column: 1 / -1;
  display: flex; align-items: center; gap: 6px;
  font-size: 13px;
  color: var(--text-color);
  svg { color: var(--accent-3); }
  sub { font-size: 10px; color: var(--text-muted); margin-left: 4px; }
`;

const Loader = styled.div`
  width: 18px; height: 18px;
  border-radius: 50%;
  border: 2px solid var(--glass-border-strong);
  border-top-color: var(--accent-1);
  animation: spin-slow 0.9s linear infinite;
`;
