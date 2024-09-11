import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Timeline, Card } from 'antd';
import { FaChevronDown, FaChevronUp, FaCrosshairs, FaBars } from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import LocationCard from './Location'; 
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getDistance } from 'geolib';

const userLocationIcon = new L.DivIcon({
    html: `<div style="background-color: green; border-radius: 50%; width: 40px; height: 40px; display: flex; justify-content: center; align-items: center;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="24px" height="24px">
                    <path d="M4.27 12L12 4.27L19.73 12H14V19H10V12H4.27Z"/>
                </svg>
           </div>`,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 40]
});

const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], 
    iconAnchor: [12, 41],
    popupAnchor: [1, -34], 
    shadowSize: [41, 41]
});

const BackToCenterButton = ({ center }) => {
    const map = useMap();
    const handleClick = () => {
        if (center) {
            map.setView(center, 13); 
        }
    };

    return (
        <Button onClick={handleClick}>
            <FaCrosshairs size={24} />
        </Button>
    );
};

const AutoFitBounds = ({ userLocation, centerPosition }) => {
    const map = useMap();
    
    useEffect(() => {
        if (userLocation && centerPosition) {
            const bounds = L.latLngBounds([userLocation, centerPosition]);

            // Check if the screen width is mobile-sized
            const isMobile = window.innerWidth <= 768;

            // Apply different padding for mobile and desktop
            map.fitBounds(bounds, {
                paddingTopLeft: isMobile ? [50, 50] : [200, 50], // On mobile, use less offset, otherwise, offset to the right
                paddingBottomRight: [50, 50], // You can adjust this padding as needed
                maxZoom: 10, // Control maximum zoom level
                animate: true, // Enable smooth zooming and transition
                duration: 1.0 // Duration of the animation
            });
        }
    }, [userLocation, centerPosition, map]);

    return null;
};


const Experience = ({ isDarkMode }) => {
    const [openSections, setOpenSections] = useState({});
    const [timelineMode, setTimelineMode] = useState('alternate');
    const [userLocation, setUserLocation] = useState(null);
    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const [isMobile, setIsMobile] = useState(false);
    const [showLocationCard, setShowLocationCard] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [address, setAddress] = useState("");
    const [distance, setDistance] = useState(null); // To store the calculated distance
    const [travelTime, setTravelTime] = useState(null); // To store travel time

    const toggleSection = (index) => {
        setOpenSections((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
    };

    useEffect(() => {
        const handleResize = () => {
            setTimelineMode(window.innerWidth <= 768 ? 'left' : 'alternate');
            setIsMobile(window.innerWidth <= 768);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation([latitude, longitude]);
                    fetchRoute([longitude, latitude], centerPosition); // Fetch route and travel time
                },
                (error) => {
                    console.error("Error getting location: ", error);
                    setIsLoading(false);
                }
            );
        } else {
            console.error("Geolocation not supported");
            setIsLoading(false);
        }
    }, []);

    const fetchRoute = (userPos, centerPos) => {
        const url = `https://router.project-osrm.org/route/v1/driving/${userPos[0]},${userPos[1]};${centerPos[1]},${centerPos[0]}?overview=full&geometries=geojson`;

        fetch(url)
            .then((res) => res.json())
            .then((data) => {
                if (data.routes && data.routes.length > 0) {
                    const route = data.routes[0].geometry.coordinates.map((coord) => [coord[1], coord[0]]);
                    setRouteCoordinates(route);

                    // Calculate travel time from OSRM API (duration is in seconds)
                    const durationInSeconds = data.routes[0].duration;
                    setTravelTime(durationInSeconds / 60); // Convert to minutes
                } else {
                    console.error('No routes found:', data);
                }
            })
            .catch((error) => console.error("Error fetching route:", error));
    };

    useEffect(() => {
        if (userLocation) {
            const [latitude, longitude] = userLocation;
            const url = `https://geocode.xyz/${latitude},${longitude}?geoit=json`;
        
            fetch(url)
                .then((response) => response.json())
                .then((data) => {
                    if (data && data.staddress && data.city && data.country) {
                        setAddress(`${data.staddress}, ${data.city}, ${data.country}`);
                    } else {
                        setAddress('Address not found');
                    }
                    setIsLoading(false);
                })
                .catch((error) => {
                    console.error("Error fetching address:", error);
                    setIsLoading(false);
                });
        }
    }, [userLocation]);

    useEffect(() => {
        if (userLocation) {
            // Calculate distance between userLocation and centerPosition
            const calculatedDistance = getDistance(
                { latitude: userLocation[0], longitude: userLocation[1] },
                { latitude: centerPosition[0], longitude: centerPosition[1] }
            );
            setDistance(calculatedDistance / 1000); // Convert to kilometers
        }
    }, [userLocation]);

    const mapTileUrl = isDarkMode
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png';


    const centerPosition = [-6.659333, 106.850664];

    const toggleLocationCard = () => {
        setShowLocationCard(!showLocationCard);
    };

    const hideLocationCard = () => setShowLocationCard(false);


    return (
        <Container>
            <CardContainer>
                <StyledCardContainer>
                    <CardTitle>Location</CardTitle>
                    <MapContainer
                        center={centerPosition} 
                        zoom={15}
                        style={{ height: '400px', width: '100%' }}
                        key={isDarkMode}
                    >
                        <TileLayer
                            url={mapTileUrl}
                        />
                        <Marker position={centerPosition} icon={redIcon}>
                            <Popup>
                                Ciawi, Bogor, Indonesia
                            </Popup>
                        </Marker>

                        {/* User Location Marker */}
                        {userLocation && (
                            <Marker position={userLocation} icon={userLocationIcon}>
                                <Popup>Your Location</Popup>
                            </Marker>
                        )}

                        {/* Polyline for route */}
                        {routeCoordinates.length > 0 && (
                            <Polyline positions={routeCoordinates} color={isDarkMode ? "yellow" : "blue"} weight={5} />
                        )}

                         {/* AutoFitBounds */}
                         {userLocation && (
                            <AutoFitBounds userLocation={userLocation} centerPosition={centerPosition} />
                        )}

                        {/* Back to Center Button */}
                        {userLocation && <BackToCenterButton center={userLocation} />}



                        {/* Show LocationButton only on mobile */}
                        {isMobile && (
                            <LocationeButton  onClick={toggleLocationCard} onMouseLeave={hideLocationCard}>
                            <FaBars style={{ fontSize: '24px', color: 'white' }} />
                            </LocationeButton>
                        )}

                                            
                        </MapContainer>
                        {!isMobile || (isMobile && showLocationCard) ? (
                            <LocationCardWrapper>
                                <LocationCard address={address} isLoading={isLoading} distance={distance} travelTime={travelTime}/>
                            </LocationCardWrapper>
                        ) : null}
                </StyledCardContainer>

                <StyledCardContainer>
                <CardTitle>Experience</CardTitle>
                    <ExperienceSection>
                        <TimelineContainer mode={timelineMode}>
                            <TimelineItem>
                                <StyledCard>
                                    <JobHeader>
                                        <div>
                                            <JobTitle>PT. BIS DATA INDONESIA</JobTitle>
                                            <JobDate>FRONT END DEVELOPER</JobDate>
                                            <JobDate>(8/2023 – Present)</JobDate>
                                        </div>
                                        <IconButton onClick={() => toggleSection(0)}>
                                            {openSections[0] ? <FaChevronUp /> : <FaChevronDown />}
                                        </IconButton>
                                    </JobHeader>
                                    {openSections[0] && (
                                        <>
                                            <PositionTitle>
                                                NETWORK MONITORING SYSTEM - HUB SATELIT SATRIA-1 BAKTI KOMINFO
                                            </PositionTitle>
                                            <ul>
                                                <li>Mobile & Web Development</li>
                                                <li>UI/UX Design</li>
                                                <li>Device data analysis (FORTIGATE, HUAWEI SWITCH CORE, HPE Proliant) in Jayapura</li>
                                                <li>Implementation of NADIA App</li>
                                                <li>Conduct user research and usability testing</li>
                                                <li>Collaborate with back-end developers to integrate user-facing elements with server-side logic</li>
                                                <li>Optimize applications for maximum speed and scalability</li>
                                                <li>Ensure the technical feasibility of UI/UX designs</li>
                                                <li>JWT and Rest API implementation</li>
                                                <li>Scrum SDLC methodology</li>
                                                <li>Review code and merge to master branch after developers push to Git repository</li>
                                            </ul>
                                            <TechnologiesUsed>
                                                <strong>Used Technologies :</strong> JavaScript, Next.js, MUI, CSS, Cloudflare, Termius, GitHub, Figma, Photoshop, Google Maps API, Rest API.
                                            </TechnologiesUsed>

                                            <PositionTitle>
                                                NETWORK MONITORING SYSTEM – LC BAKTI KOMINFO
                                            </PositionTitle>
                                            <ul>
                                                <li>Mobile & Web Development</li>
                                                <li>UI/UX Design</li>
                                                <li>Device data analysis (FORTIGATE, HUAWEI SWITCH CORE, HPE Proliant) in Jayapura</li>
                                                <li>Implementation of NADIA App</li>
                                                <li>Conduct user research and usability testing</li>
                                                <li>Collaborate with back-end developers to integrate user-facing elements with server-side logic</li>
                                                <li>Optimize applications for maximum speed and scalability</li>
                                                <li>Ensure the technical feasibility of UI/UX designs</li>
                                                <li>JWT and Rest API implementation</li>
                                                <li>Scrum SDLC methodology</li>
                                                <li>Review code and merge to master branch after developers push to Git repository</li>
                                            </ul>
                                            <TechnologiesUsed>
                                                <strong>Used Technologies :</strong> JavaScript, Next.js, MUI, CSS, Cloudflare, Termius, GitHub, Figma, Photoshop, Google Maps API, Rest API.
                                            </TechnologiesUsed>

                                            <JobTitle>
                                                LOOKUP IP – Internal NOC
                                            </JobTitle>
                                            <ul>
                                                <li>Create new feature, LNM (Landscape Monitoring System)</li>
                                                <li>Monitor and maintain AWS infrastructure and manage billing issues</li>
                                                <li>Conduct weekly meetings and report progress to Bakti Kominfo</li>
                                                <li>Fix bugs in VionaApp</li>
                                                <li>Deploy to staging and production servers</li>
                                                <li>Design and implement low-latency, high-availability, and performance applications</li>
                                                <li>Ensure application security and data protection</li>
                                                <li>Write clean, scalable code following best practices</li>
                                                <li>JWT and Rest API implementation</li>
                                                <li>Scrum SDLC methodology</li>
                                                <li>Document development processes and changes</li>
                                            </ul>
                                            <TechnologiesUsed>
                                                <strong>Used Technologies :</strong> Node.js, React.js, Termius, Google Maps API, Rest API, GitHub.
                                            </TechnologiesUsed>
                                        </>
                                    )}
                                </StyledCard>
                            </TimelineItem>

                            <TimelineItem>
                                <StyledCard>
                                    <JobHeader>
                                        <div>
                                            <JobTitle>PT. Life Tech Tanpa Batas</JobTitle>
                                            <JobDate>FRONT END DEVELOPER</JobDate>
                                            <JobDate>(08/2021 – 08/2023)</JobDate>
                                        </div>
                                        <IconButton onClick={() => toggleSection(1)}>
                                            {openSections[1] ? <FaChevronUp /> : <FaChevronDown />}
                                        </IconButton>
                                    </JobHeader>
                                    {openSections[1] && (
                                        <>
                                            <PositionTitle>
                                                POS (Point of Sale) – BeetPOS
                                            </PositionTitle>
                                            <NoBulletList>
                                                <li>Design UI/UX</li>
                                                <li>Develop Backoffice BeetPOS App</li>
                                                <li>Fix payment method issues</li>
                                                <li>Integrate with Tokopedia, Shopee, and QRIS</li>
                                                <li>Troubleshoot and resolve bugs/errors</li>
                                                <li>Collaborate with the team to improve application functionality and user experience</li>
                                                <li>Conduct code reviews and provide feedback to team members</li>
                                                <li>Deploy to staging and production servers</li>
                                            </NoBulletList>
                                            <TechnologiesUsed>
                                                <strong>Used Technologies :</strong> React.js, Rest API, Figma, Photoshop, GitHub.
                                            </TechnologiesUsed>

                                            <PositionTitle>
                                                POS (Point of Sale) – BeetClinic
                                            </PositionTitle>
                                            <NoBulletList>
                                                <li>Design UI/UX</li>
                                                <li>Develop BeetClinic App</li>
                                                <li>Fix payment method issues</li>
                                                <li>Integrate with Tokopedia, Shopee, and QRIS</li>
                                                <li>Troubleshoot and resolve bugs/errors</li>
                                                <li>Collaborate with the team to improve application functionality and user experience</li>
                                                <li>Conduct code reviews and provide feedback to team members</li>
                                                <li>Deploy to staging and production servers</li>
                                            </NoBulletList>
                                            <TechnologiesUsed>
                                                <strong>Used Technologies :</strong> Vue.js,Vuetify, Rest API, Figma, Photoshop, GitHub.
                                            </TechnologiesUsed>

                                            <PositionTitle>
                                                CRM – MRT
                                            </PositionTitle>
                                            <NoBulletList>
                                                <li>Design UI/UX</li>
                                                <li>Develop MRT App</li>
                                                <li>Fix payment method issues</li>
                                                <li>Integrate with Tokopedia, Shopee, and QRIS</li>
                                                <li>Troubleshoot and resolve bugs/errors</li>
                                                <li>Collaborate with the team to improve application functionality and user experience</li>
                                                <li>Conduct code reviews and provide feedback to team members</li>
                                                <li>Deploy to staging and production servers</li>
                                            </NoBulletList>
                                            <TechnologiesUsed>
                                                <strong>Used Technologies :</strong> Vue.js,Vuetify, Rest API, Figma, Photoshop, GitHub.
                                            </TechnologiesUsed>
                                        </>
                                    )}
                                </StyledCard>
                            </TimelineItem>

                            <TimelineItem>
                                <StyledCard>
                                    <JobHeader>
                                        <div>
                                            <JobTitle>Cave Laundry</JobTitle>
                                            <JobDate>Full Stack Developer</JobDate>
                                            <JobDate>(12/2020 – 03/2021)</JobDate>
                                        </div>
                                        <IconButton onClick={() => toggleSection(2)}>
                                            {openSections[2] ? <FaChevronUp /> : <FaChevronDown />}
                                        </IconButton>
                                    </JobHeader>
                                    {openSections[2] && (
                                        <>
                                            <PositionTitle>
                                                Cashier – Cashier Cave Laundry
                                            </PositionTitle>
                                            <ul>
                                                <li>Create Cashier app</li>
                                                <li>Prepare a library to be used</li>
                                                <li>Use a real-time web-socket platform to build a chat feature</li>
                                                <li>Dictate deployment workflow processes to ensure the highest level of productivity</li>
                                                <li>Deploy to staging and production servers</li>
                                                <li>Design and implement low-latency, high-availability, and performant applications</li>
                                            </ul>
                                            <TechnologiesUsed>
                                                <strong>Used Technologies :</strong> Bootstrap, CSS, Laravel, MySQL, jQuery.
                                            </TechnologiesUsed>
                                        </>
                                    )}
                                </StyledCard>
                            </TimelineItem>
                        </TimelineContainer>
                    </ExperienceSection>
                </StyledCardContainer>
            </CardContainer>
        </Container>
    );
};

// Styled Components
const Container = styled.div`
    display: flex;
    flex-direction: column;
    padding: 20px;

    @media(min-width: 769px) {
        flex-direction: row;
    }
`;

const CardContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 20px;
    margin-top: 150px;

    @media(min-width: 769px) {
        flex-direction: row;
    }
`;

const StyledCard = styled(Card)`
    flex: 1;
    border: none;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    background-color:var(--card-experience);
    color:var(--text-color);
`;

const StyledCardContainer = styled(Card)`
    flex: 1;
    border: none;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    background-color: var(--card-bg-color);
`;

const ExperienceSection = styled.section`
    margin-bottom: 20px;
`;

const TimelineContainer = styled(Timeline)`
    .ant-timeline-item {
        &:last-child .ant-timeline-item-tail {
            display: none;
        }
    }
`;

const TimelineItem = styled(Timeline.Item)`
    margin-bottom: 10px;
`;

const JobHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const CardTitle = styled.h1`
    font-size: 24px;
    margin: 0;
    margin-bottom: 20px;
    color: var(--text-color);
`;

const JobTitle = styled.h3`
    margin: 0;
    font-size: 18px;
`;

const JobDate = styled.p`
    margin: 0;
    color: #888;
`;

const IconButton = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    font-size: 18px;
    color: var(--text-color);
`;

const PositionTitle = styled.h4`
    margin: 10px 0;
    font-size: 16px;
`;

const TechnologiesUsed = styled.p`
    margin: 10px 0;
`;

const NoBulletList = styled.ul`
  list-style: none; /* Remove default bullet points */
  padding-left: 0; /* Remove default padding */
  margin: 0; /* Remove default margins */

  li {
    position: relative;
    margin-bottom: 5px;
    padding-right: 20px; /* Add space between text and bullet */
    text-align: right; /* Align text to the right for larger screens by default */

    /* Add bullet point on the right for larger screens */
    &::after {
      content: '•'; /* Bullet symbol */
      color: var(--text-color); /* Bullet color */
      position: absolute;
      right: -15px; /* Position bullet to the right */
    }

    /* On mobile, change alignment and bullet position */
    @media (max-width: 768px) {
      text-align: left; /* Align text to the left for mobile */
      padding-left: 20px; /* Add padding for bullet on the left */
      padding-right: 0; /* Remove right padding */

      &::after {
        content: ''; /* Remove bullet from the right */
      }

      &::before {
        content: '•'; /* Add bullet on the left */
        color: var(--text-color); /* Bullet color */
        position: absolute;
        left: -15px; /* Position bullet to the left */
      }
    }
  }
  `;

const Button = styled.button`
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 10%; /* Make it a circle */
    display: flex;
    background-color:white;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    position: absolute; /* Place button on top of the map */
    top: 80px;
    left: 10px;
    z-index: 1000;
    
    &:active {
        background-color: #222; /* Brighter on active */
    }
`;

const LocationeButton = styled.button`
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 10%; /* Make it a circle */
    display: flex;
    background-color:blue;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    position: absolute; /* Place button on top of the map */
    bottom: 10px;
    left: 10px;
    z-index: 1000;

    &:active {
   
`;

const LocationCardWrapper = styled.div`
  position: absolute;
  top: 230px; 
  left:14px;
  z-index: 1000;
  width: 300px; /* Adjust the width of the card */
`;

export default Experience;
