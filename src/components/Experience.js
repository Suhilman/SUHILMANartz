import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronDown, FaChevronUp, FaCrosshairs, FaMapMarkerAlt, FaBriefcase } from 'react-icons/fa';
import { RevealWords } from './fx';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import LocationCard from './Location';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getDistance } from 'geolib';

const userLocationIcon = new L.DivIcon({
    html: `<div style="background:#22c55e;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 6px rgba(34,197,94,0.3),0 0 20px rgba(34,197,94,0.6);">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="18" height="18"><path d="M4.27 12L12 4.27L19.73 12H14V19H10V12H4.27Z"/></svg>
           </div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
});

const redIcon = new L.DivIcon({
    html: `<div style="background:#ef4444;border-radius:50% 50% 50% 0;transform:rotate(-45deg);width:30px;height:30px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 6px rgba(239,68,68,0.3),0 0 16px rgba(239,68,68,0.6);">
              <div style="transform:rotate(45deg);color:white;font-size:14px;">●</div>
           </div>`,
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
});

const BackToCenterButton = ({ center }) => {
    const map = useMap();
    return (
        <MapBtn onClick={() => center && map.setView(center, 13)}>
            <FaCrosshairs size={16} />
        </MapBtn>
    );
};

const AutoFitBounds = ({ userLocation, CENTER_POSITION }) => {
    const map = useMap();
    useEffect(() => {
        if (!userLocation || !CENTER_POSITION) return;
        const isMobile = window.innerWidth <= 768;
        const padding = isMobile ? [36, 36] : [56, 44];
        const bounds = L.latLngBounds([userLocation, CENTER_POSITION]);

        // Keep things readable: never zoom out past MIN_ZOOM, never closer than MAX_ZOOM.
        const MIN_ZOOM = 12; // if the two pins are far apart, don't shrink below this
        const MAX_ZOOM = 15;
        const fitZoom = map.getBoundsZoom(bounds, false, L.point(padding[0], padding[1]));

        if (fitZoom < MIN_ZOOM) {
            // Pins too far apart — focus on the destination pin so it's clearly visible.
            map.setView(CENTER_POSITION, MIN_ZOOM, { animate: true, duration: 1 });
        } else {
            map.fitBounds(bounds, {
                paddingTopLeft: padding,
                paddingBottomRight: padding,
                maxZoom: MAX_ZOOM,
                animate: true,
                duration: 1,
            });
        }
    }, [userLocation, CENTER_POSITION, map]);
    return null;
};

const CENTER_POSITION = [-6.659333, 106.850664];

const EXPERIENCES = [
    {
        company: 'PT. BIS DATA INDONESIA',
        role: 'Front End Developer',
        period: '08/2023 – Present',
        positions: [
            {
                title: 'Network Monitoring System — HUB Satelit SATRIA-1 BAKTI KOMINFO (Jayapura)',
                bullets: [
                    'Mobile & Web Development',
                    'UI/UX Design',
                    'Device data analysis (FORTIGATE, HUAWEI SWITCH CORE, HPE Proliant) in Jayapura',
                    'Implementation of NADIA App',
                    'User research, usability testing & collaboration with back-end team',
                    'JWT & REST API implementation, Scrum SDLC',
                ],
                tech: 'JavaScript, Next.js, MUI, Cloudflare, Termius, GitHub, Figma, Photoshop, Google Maps API, REST API',
            },
            {
                title: 'Network Monitoring System — HUB BAKTI KOMINFO (Jayapura, Manokwari, Timika)',
                bullets: [
                    'Mobile & Web Development',
                    'UI/UX Design',
                    'Device data analysis (FORTIGATE, HUAWEI SWITCH CORE, HPE Proliant)',
                    'Implementation of VIONA App',
                    'JWT & REST API implementation, Scrum SDLC',
                ],
                tech: 'JavaScript, Next.js, MUI, Cloudflare, Termius, GitHub, Figma, REST API',
            },
            {
                title: 'LOOKUP IP — Internal NOC',
                bullets: [
                    'Create new feature LNM (Landscape Monitoring System)',
                    'Monitor & maintain AWS infrastructure',
                    'Weekly meeting & progress report to Bakti Kominfo',
                    'Fix bugs in VionaApp, deploy to staging & production',
                ],
                tech: 'Node.js, React.js, Termius, Google Maps API, REST API, GitHub',
            },
            {
                title: 'ARTZ HR — Internal Human Resource Platform',
                bullets: [
                    'Built end-to-end HR platform: attendance, payroll, leave & employee directory',
                    'Designed RESTful backend in Dart with the Frog framework',
                    'PostgreSQL schema design, migrations & query optimization',
                    'Cross-platform Flutter mobile + web client',
                    'JWT authentication, role-based access control & audit logs',
                ],
                tech: 'Dart, Flutter, Frog, PostgreSQL, REST API, Figma, GitHub',
            },
            {
                title: 'BDI Chat — Internal Real-Time Messaging',
                bullets: [
                    'Real-time chat for internal team with channels, DMs & file sharing',
                    'Backend with Dart + Frog over WebSocket for low-latency messaging',
                    'PostgreSQL for persistence with full-text search',
                    'Flutter client (mobile + desktop) with offline cache',
                    'Push notifications & read-receipts',
                ],
                tech: 'Dart, Flutter, Frog, WebSocket, PostgreSQL, REST API, GitHub',
            },
        ],
    },
    {
        company: 'PT. Life Tech Tanpa Batas',
        role: 'Front End Developer',
        period: '08/2021 – 08/2023',
        positions: [
            {
                title: 'POS (Point of Sale) — BeetPOS',
                bullets: [
                    'UI/UX design & develop Backoffice BeetPOS App',
                    'Fix payment method issues',
                    'Integrate with Tokopedia, Shopee, QRIS',
                    'Code review & deploy to production',
                ],
                tech: 'React.js, REST API, Figma, Photoshop, GitHub',
            },
            {
                title: 'POS (Point of Sale) — BeetClinic',
                bullets: [
                    'UI/UX design & develop BeetClinic App',
                    'Integrate marketplace & QRIS payment',
                ],
                tech: 'Vue.js, Vuetify, REST API, Figma, GitHub',
            },
            {
                title: 'CRM — MRT',
                bullets: ['UI/UX design & develop MRT App', 'Integrate marketplace & payment'],
                tech: 'Vue.js, Vuetify, REST API, Figma, GitHub',
            },
        ],
    },
    {
        company: 'Cave Laundry',
        role: 'Full Stack Developer',
        period: '12/2020 – 03/2021',
        positions: [
            {
                title: 'Cashier — Cashier Cave Laundry',
                bullets: [
                    'Built cashier app with real-time chat via WebSocket',
                    'Deploy to staging & production',
                    'Design low-latency, high-availability app',
                ],
                tech: 'Bootstrap, Laravel, MySQL, jQuery',
            },
        ],
    },
];

const Experience = ({ isDarkMode }) => {
    const [openSections, setOpenSections] = useState({ 0: true });
    const [userLocation, setUserLocation] = useState(null);
    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 768);
    const [isLoading, setIsLoading] = useState(true);
    const [address, setAddress] = useState('');
    const [distance, setDistance] = useState(null);
    const [travelTime, setTravelTime] = useState(null);

    const toggleSection = (i) => setOpenSections((p) => ({ ...p, [i]: !p[i] }));

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth <= 768);
        onResize();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // Fetch user location + route + reverse-geocode with safe fallbacks
    useEffect(() => {
        if (!navigator.geolocation) { setIsLoading(false); return; }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                const userPos = [latitude, longitude];
                setUserLocation(userPos);

                // 1) Distance (geolib — always available, no network)
                const km = getDistance(
                    { latitude, longitude },
                    { latitude: CENTER_POSITION[0], longitude: CENTER_POSITION[1] }
                ) / 1000;
                setDistance(km);

                // 2) Travel-time fallback estimate (~30 km/h average city speed)
                const fallbackMinutes = Math.round((km / 30) * 60);
                setTravelTime(fallbackMinutes);

                // 3) Polyline fallback: straight line user → destination (in case OSRM fails)
                setRouteCoordinates([userPos, CENTER_POSITION]);

                // 4) Try OSRM for real route + accurate travel-time (upgrades both)
                fetch(`https://router.project-osrm.org/route/v1/driving/${longitude},${latitude};${CENTER_POSITION[1]},${CENTER_POSITION[0]}?overview=full&geometries=geojson`)
                    .then((r) => r.json())
                    .then((d) => {
                        if (d.routes?.length) {
                            setRouteCoordinates(d.routes[0].geometry.coordinates.map((c) => [c[1], c[0]]));
                            setTravelTime(Math.round(d.routes[0].duration / 60));
                        }
                    })
                    .catch(() => {});

                // 5) Reverse geocode — BigDataCloud client API (free, no key, no throttling)
                const coordFallback = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
                    .then((r) => r.json())
                    .then((d) => {
                        const parts = [
                            d?.locality || d?.city,
                            d?.principalSubdivision,
                            d?.countryName,
                        ].filter(Boolean);
                        setAddress(parts.length ? parts.join(', ') : coordFallback);
                    })
                    .catch(() => setAddress(coordFallback))
                    .finally(() => setIsLoading(false));
            },
            () => setIsLoading(false),
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        );
    }, []);

    const mapTileUrl = isDarkMode
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png';

    return (
        <Page>
            <Header>
                <Eyebrow>{'// 02 — Experience'}</Eyebrow>
                <Title><RevealWords>Where I've</RevealWords> <RevealWords as="span" className="grad" delay={0.25}>worked</RevealWords></Title>
                <Sub>Building scalable apps across telco, satellite, POS & laundry domains.</Sub>
            </Header>

            <Panel
                as={motion.div}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.7 }}
            >
                <PanelTitle><FaMapMarkerAlt /> Location</PanelTitle>
                <MapRow>
                    <MapWrap>
                        <MapContainer center={CENTER_POSITION} zoom={13} style={{ height: isMobile ? 320 : 420, width: '100%' }} key={String(isDarkMode)}>
                            <TileLayer url={mapTileUrl} />
                            <Marker position={CENTER_POSITION} icon={redIcon}>
                                <Popup>Ciawi, Bogor, Indonesia</Popup>
                            </Marker>
                            {userLocation && (
                                <Marker position={userLocation} icon={userLocationIcon}>
                                    <Popup>Your Location</Popup>
                                </Marker>
                            )}
                            {routeCoordinates.length > 0 && (
                                <Polyline positions={routeCoordinates} color={isDarkMode ? '#00f0ff' : '#0066ff'} weight={4} opacity={0.85} />
                            )}
                            {userLocation && <AutoFitBounds userLocation={userLocation} CENTER_POSITION={CENTER_POSITION} />}
                            {userLocation && <BackToCenterButton center={userLocation} />}
                        </MapContainer>
                    </MapWrap>
                    <LocationSide>
                        <LocationCard address={address} isLoading={isLoading} distance={distance} travelTime={travelTime} />
                    </LocationSide>
                </MapRow>
            </Panel>

            <CareerSection
                as={motion.div}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                style={{ marginTop: 24 }}
            >
                <PanelTitle><FaBriefcase /> Career</PanelTitle>
                <TimelineWrap>
                    <TimelineLine />
                    {EXPERIENCES.map((exp, idx) => (
                        <TLItem
                            key={idx}
                            as={motion.div}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, amount: 0.2 }}
                            transition={{ duration: 0.5, delay: idx * 0.08 }}
                        >
                            <TLDot>{idx + 1}</TLDot>
                            <JobCard>
                                <JobHeader onClick={() => toggleSection(idx)}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <CompanyRow>
                                            <JobCompany>{exp.company}</JobCompany>
                                            {/present/i.test(exp.period) && <NowBadge>Current</NowBadge>}
                                        </CompanyRow>
                                        <JobRoleRow>
                                            <JobRole>{exp.role}</JobRole>
                                            <JobPeriod>{exp.period}</JobPeriod>
                                        </JobRoleRow>
                                    </div>
                                    <ExpandBtn aria-label={openSections[idx] ? 'Collapse' : 'Expand'}>
                                        {openSections[idx] ? <FaChevronUp /> : <FaChevronDown />}
                                    </ExpandBtn>
                                </JobHeader>
                                <AnimatePresence initial={false}>
                                    {openSections[idx] && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                            style={{ overflow: 'hidden' }}
                                        >
                                            {exp.positions.map((p, j) => (
                                                <Position key={j}>
                                                    <PosTitle>{p.title}</PosTitle>
                                                    <BulletList>
                                                        {p.bullets.map((b, k) => <li key={k}>{b}</li>)}
                                                    </BulletList>
                                                    <TechLabel>Tech Stack</TechLabel>
                                                    <TechRow>
                                                        {p.tech.split(',').map((t, k) => (
                                                            <TechChip key={k}>{t.trim()}</TechChip>
                                                        ))}
                                                    </TechRow>
                                                </Position>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </JobCard>
                        </TLItem>
                    ))}
                </TimelineWrap>
            </CareerSection>
        </Page>
    );
};

export default Experience;

/* ---------- styled ---------- */
const Page = styled.div`
    padding: 100px 6vw 80px;
    max-width: 1280px;
    margin: 0 auto;
    @media (max-width: 768px) { padding: 80px 5vw 60px; }
`;
const Header = styled.div` text-align: center; margin-bottom: 56px; `;
const Eyebrow = styled.div`
    font-family: var(--font-mono);
    font-size: 12px;
    letter-spacing: 0.2em;
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

const Panel = styled.div`
    background: var(--gradient-card);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    padding: 24px;
    backdrop-filter: var(--blur-glass);
    -webkit-backdrop-filter: var(--blur-glass);
    transition: border-color 0.3s;
    &:hover { border-color: var(--accent-1); }
`;
const CareerSection = styled.div`
    background: transparent;
    border: none;
    padding: 0;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
`;
const PanelTitle = styled.h3`
    margin: 0 0 18px;
    font-size: 22px;
    color: var(--text-color);
    display: flex; align-items: center; gap: 10px;
    svg { color: var(--tittle-color); }
    &::after {
        content: '';
        flex: 1;
        height: 1px;
        background: linear-gradient(90deg, var(--glass-border-strong), transparent);
        margin-left: 8px;
    }
`;

const MapRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 16px;
    align-items: stretch;
    @media (max-width: 968px) {
        grid-template-columns: 1fr;
    }
`;
const MapWrap = styled.div`
    position: relative;
    border-radius: var(--radius-md);
    overflow: hidden;
    border: 1px solid var(--glass-border);
    min-width: 0;
    .leaflet-container { background: var(--card-bg-solid); }
`;
const LocationSide = styled.div`
    display: flex; align-items: stretch;
    & > * { width: 100%; }
`;
const MapBtn = styled.button`
    position: absolute;
    top: 80px; left: 12px;
    z-index: 1000;
    width: 34px; height: 34px;
    border-radius: 10px;
    border: 1px solid var(--glass-border-strong);
    background: var(--card-bg-solid);
    color: var(--text-color);
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.2s;
    &:hover { background: var(--button-background-color); color: var(--tittle-color); }
`;

const TimelineWrap = styled.div`
    position: relative;
    margin-top: 24px;
    padding-left: 64px;
    @media (max-width: 768px) { padding-left: 46px; }
`;
const TimelineLine = styled.div`
    position: absolute;
    top: 12px; bottom: 12px;
    /* dot center (settled): padding-left(64) + dot left(-56) + radius(22) = 30 → line at 29 (2px) */
    left: 29px;
    width: 2px;
    background: linear-gradient(180deg, var(--accent-1), var(--accent-2), var(--accent-3));
    border-radius: 999px;
    box-shadow: 0 0 12px var(--accent-glow);
    /* mobile: padding(46) + dot left(-40) + radius(16) = 22 → line at 21 (2px) */
    @media (max-width: 768px) { left: 21px; }
`;
const TLItem = styled.div`
    position: relative;
    margin-bottom: 22px;
    &:last-child { margin-bottom: 0; }
`;
const TLDot = styled.div`
    position: absolute;
    top: 20px;
    left: -56px;
    width: 44px; height: 44px;
    border-radius: 50%;
    background: var(--gradient-primary);
    color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-mono);
    font-size: 15px; font-weight: 700;
    border: 4px solid var(--body-bg-color);
    box-shadow: 0 0 0 1.5px var(--accent-1), 0 6px 20px var(--accent-glow);
    z-index: 2;
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    ${TLItem}:hover & { transform: scale(1.08) rotate(-4deg); }
    @media (max-width: 768px) {
        width: 32px; height: 32px;
        left: -40px;
        top: 16px;
        font-size: 12px;
        border-width: 3px;
    }
`;

const JobCard = styled.div`
    position: relative;
    background: var(--gradient-card);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    padding: 18px 20px;
    overflow: hidden;
    backdrop-filter: var(--blur-glass);
    -webkit-backdrop-filter: var(--blur-glass);
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s, box-shadow 0.3s;
    &::before {
        content: '';
        position: absolute;
        left: 0; top: 0; bottom: 0;
        width: 3px;
        background: var(--gradient-primary);
        opacity: 0.85;
    }
    &:hover {
        transform: translateY(-3px);
        border-color: var(--accent-1);
        box-shadow: 0 16px 44px rgba(0, 0, 0, 0.22), 0 0 26px var(--accent-glow);
    }
    @media (max-width: 768px) { padding: 14px 16px; }
`;
const JobHeader = styled.div`
    display: flex; justify-content: space-between; align-items: flex-start;
    cursor: pointer;
    gap: 12px;
`;
const CompanyRow = styled.div`
    display: flex; align-items: center; flex-wrap: wrap; gap: 10px;
`;
const JobCompany = styled.h4` margin: 0; font-size: 18px; color: var(--text-color); font-family: var(--font-display); letter-spacing: -0.01em; `;
const NowBadge = styled.span`
    display: inline-flex; align-items: center; gap: 5px;
    font-family: var(--font-mono);
    font-size: 10px; font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #22c55e;
    background: rgba(34, 197, 94, 0.12);
    border: 1px solid rgba(34, 197, 94, 0.35);
    padding: 3px 9px;
    border-radius: 999px;
    &::before {
        content: '';
        width: 6px; height: 6px; border-radius: 50%;
        background: #22c55e;
        box-shadow: 0 0 8px rgba(34, 197, 94, 0.9);
    }
`;
const JobRoleRow = styled.div` display: flex; flex-wrap: wrap; gap: 6px 14px; margin-top: 6px; align-items: baseline; `;
const JobRole    = styled.span` font-size: 13px; color: var(--tittle-color); font-weight: 600; `;
const JobPeriod  = styled.span`
    font-size: 12px; color: var(--text-muted); font-family: var(--font-mono);
    display: inline-flex; align-items: center; gap: 6px;
    &::before { content: ''; width: 4px; height: 4px; border-radius: 50%; background: var(--accent-2); }
`;
const ExpandBtn  = styled.button`
    background: var(--button-background-color);
    color: var(--tittle-color);
    border: 1px solid var(--glass-border);
    width: 34px; height: 34px;
    border-radius: 50%;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    transition: all 0.25s;
    &:hover { background: var(--gradient-primary); color: #fff; border-color: transparent; box-shadow: 0 0 18px var(--accent-glow); }
`;

const Position = styled.div`
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px dashed var(--divider-color);
    &:first-of-type { margin-top: 16px; }
`;
const PosTitle = styled.h5`
    margin: 0 0 10px;
    font-size: 13.5px;
    color: var(--accent-2);
    font-weight: 600;
    line-height: 1.4;
    display: flex; gap: 8px;
    &::before {
        content: '';
        flex-shrink: 0;
        width: 4px; margin-top: 3px;
        background: var(--gradient-primary);
        border-radius: 2px;
    }
`;
const BulletList = styled.ul`
    margin: 0;
    padding-left: 18px;
    list-style: none;
    li {
        position: relative;
        font-size: 13px;
        color: var(--text-color);
        line-height: 1.6;
        margin-bottom: 6px;
        padding-left: 4px;
        &::before {
            content: '▸';
            position: absolute;
            left: -14px;
            color: var(--accent-1);
            font-weight: 700;
        }
    }
`;
const TechLabel = styled.div`
    margin: 14px 0 8px;
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--text-muted);
`;
const TechRow = styled.div`
    display: flex; flex-wrap: wrap; gap: 6px;
`;
const TechChip = styled.span`
    font-family: var(--font-mono);
    font-size: 11px;
    padding: 3px 10px;
    border-radius: 999px;
    background: var(--button-background-color);
    border: 1px solid var(--glass-border);
    color: var(--tittle-color);
    transition: border-color 0.2s, color 0.2s;
    &:hover { border-color: var(--accent-1); color: var(--accent-1); }
`;
