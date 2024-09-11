import React from 'react';
import styled from 'styled-components';
import { FaArrowUp, FaMapMarkerAlt, FaCar, FaClock, FaMoneyBill } from 'react-icons/fa';

const LocationCard = ({ address, isLoading, distance, travelTime }) => {
  const calculateFare = (distance, travelTime) => {
    const baseFare = 10200; // Base fare
    const costPerKm = 2550; // Cost per Km
    const costPerMinute = 2000; // Cost per minute
    const minimumFare = 15000; // Minimum fare

    let totalFare = baseFare + costPerKm * distance + costPerMinute * travelTime;

    if (totalFare < minimumFare) {
      totalFare = minimumFare;
    }

    return totalFare;
  };

  const fare =
    !isLoading && distance !== null && travelTime !== null
      ? calculateFare(distance, travelTime).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })
      : null;

  return (
    <CardContainer>
      <LocationSection>
        <LocationInfo>
          <IconWrapperGreen>
            <FaArrowUp style={{ fontSize: '12px', color: 'white' }} />
          </IconWrapperGreen>
          <LocationDetailsContainer>
            <LocationName>Your Location</LocationName>
            {isLoading ? <Loader /> : <LocationDetails>{address}</LocationDetails>}
          </LocationDetailsContainer>
        </LocationInfo>
      </LocationSection>

      <LocationSection>
        <LocationInfo>
          <IconWrapperRed>
            <FaMapMarkerAlt style={{ fontSize: '12px', color: 'white' }} />
          </IconWrapperRed>
          <div>
            <LocationName>SUHILMANartz</LocationName>
            <LocationDetails>Gg. Wr. Seri, Ciawi, Kec. Ciawi, Kabupaten Bogor, Jawa Barat 16720</LocationDetails>
          </div>
        </LocationInfo>
      </LocationSection>
      <Horizontal />
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <LocationDetails>
            {distance !== null && travelTime !== null && (
              <>
                <InfoRow>
                  <FaCar style={{ marginRight: '5px' }} />
                  {distance.toFixed(2)} Km
                  <FaClock style={{ marginLeft: '10px', marginRight: '5px' }} />
                  {travelTime.toFixed(2)} Min
                </InfoRow>
                <InfoRow>
                  <FaMoneyBill style={{ marginRight: '5px' }} />
                  <strong>{fare}</strong> <EstimateText>Estimasi</EstimateText>
                </InfoRow>
              </>
            )}
          </LocationDetails>
        </>
      )}
    </CardContainer>
  );
};

// Styled Components for Card and Loader
const CardContainer = styled.div`
  background-color: var(--card-bg-color);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 16px;
  width: 90%;
  max-width: 350px;
  margin: 0 auto;
  position: relative;
  opacity: 0.90;
  transition: all 0.3s ease-in-out;

  &:hover {
    opacity: 1;
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 768px) {
    width: 90%;
    padding: 16px;
  }
`;

const LocationSection = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
`;

const LocationInfo = styled.div`
  display: flex;
  align-items: center;
`;

const LocationName = styled.p`
  font-size: 14px;
  font-weight: bold;
  color: var(--text-color);
  margin: 4px 0;
`;

const LocationDetails = styled.p`
  font-size: 12px;
  color: #555;
  margin: 4px 0;
`;

const LocationDetailsContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const IconWrapperGreen = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #28a745;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  padding: 6px;
  margin-right: 12px;
`;

const IconWrapperRed = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #dc3545;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  padding: 6px;
  margin-right: 12px;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #555;
  margin-top: 8px;
`;

const EstimateText = styled.span`
  color: #e74c3c;
  font-size: 12px;
  opacity: 0.7;
  margin-left: 4px;
`;

// Loader component styled as a spinning circle
const Loader = styled.div`
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const Horizontal = styled.hr`
  height: 1px;
  background-image: linear-gradient(90deg, #555, #555 75%, transparent 75%, transparent 90%);
  background-size: 20px 1px;
  border: none;
`;

export default LocationCard;
