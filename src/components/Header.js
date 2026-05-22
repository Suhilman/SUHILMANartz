import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Link as ScrollLink, animateScroll as scroll } from 'react-scroll';
import {
    FaBars, FaTimes, FaWhatsapp, FaSun, FaMoon,
    FaCog, FaAdjust, FaArrowUp, FaInfoCircle,
    FaBriefcase, FaFileAlt, FaEnvelope, FaPalette
} from 'react-icons/fa';
import artzLogo     from '../assets/artz.png';
import artzDarkLogo from '../assets/artzdark.png';
import { Magnetic } from './fx';

const NAV_ITEMS = [
    { id: 'about',         label: 'About',         icon: <FaInfoCircle  size={16} /> },
    { id: 'experience',    label: 'Experience',    icon: <FaBriefcase   size={16} /> },
    { id: 'animation',     label: 'Animation',     icon: <FaPalette     size={16} /> },
    { id: 'documentation', label: 'Documentation', icon: <FaFileAlt     size={16} /> },
    { id: 'contact',       label: 'Contact',       icon: <FaEnvelope    size={16} /> },
];

const FONTS = [
    { name: 'Inter',          family: "'Inter', sans-serif" },
    { name: 'Space Grotesk',  family: "'Space Grotesk', sans-serif" },
    { name: 'DM Sans',        family: "'DM Sans', sans-serif" },
    { name: 'JetBrains Mono', family: "'JetBrains Mono', monospace" },
];

const Header = ({ isDarkMode, toggleTheme }) => {
    const [isOpen, setIsOpen]               = useState(false);
    const [isSidebarOpen, setSidebarOpen]   = useState(false);
    const [isContrast, setIsContrast]       = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [isScrolled, setIsScrolled]       = useState(false);
    const [selectedFont, setSelectedFont]   = useState('Inter');
    const [fontSize, setFontSize]           = useState(16);

    useEffect(() => {
        const onScroll = () => {
            setIsScrolled(window.scrollY > 50);
            setShowScrollTop(window.scrollY > 300);
        };
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const handleFontChange = (name, family) => {
        setSelectedFont(name);
        document.documentElement.style.setProperty('--base-font', family);
        document.body.style.fontFamily = family;
    };

    const handleSizeChange = (e) => {
        const size = e.target.value;
        setFontSize(size);
        document.documentElement.style.setProperty('--base-font-size', `${size}px`);
        document.body.style.fontSize = `${size}px`;
    };

    return (
        <>
            <HeaderContainer isScrolled={isScrolled}>
                <Logo>
                    <LogoImg src={isDarkMode ? artzDarkLogo : artzLogo} alt="SUHILMANartz" />
                </Logo>

                <Nav>
                    {NAV_ITEMS.map((it) => (
                        <NavItem
                            key={it.id}
                            to={it.id}
                            smooth
                            duration={500}
                            activeClass="active"
                            spy
                            offset={-80}
                        >
                            {it.label}
                        </NavItem>
                    ))}
                    <Magnetic strength={0.35}>
                        <CallNowButton href="https://wa.me/6285172335192" target="_blank" rel="noopener noreferrer">
                            <FaWhatsapp size={16} />
                            <span>Call Now</span>
                        </CallNowButton>
                    </Magnetic>
                    <SettingsButton onClick={() => setSidebarOpen(true)} aria-label="Settings">
                        <StyledCogIcon size={20} />
                    </SettingsButton>
                </Nav>

                <MobileToggle onClick={() => setIsOpen((v) => !v)} aria-label="Menu">
                    {isOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
                </MobileToggle>

                {isOpen && (
                    <DropdownMenu>
                        {NAV_ITEMS.map((it) => (
                            <DropdownItem
                                key={it.id}
                                to={it.id}
                                smooth
                                duration={500}
                                spy
                                offset={-80}
                                onClick={() => setIsOpen(false)}
                            >
                                <span className="ic">{it.icon}</span>
                                {it.label}
                            </DropdownItem>
                        ))}
                        <DropdownAction onClick={toggleTheme}>
                            <span className="ic">{isDarkMode ? <FaMoon size={16} /> : <FaSun size={16} />}</span>
                            {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                            <ToggleSwitch isActive={isDarkMode}><ToggleThumb isActive={isDarkMode} /></ToggleSwitch>
                        </DropdownAction>
                        <DropdownAction as="a" href="https://wa.me/6285172335192" target="_blank" rel="noopener noreferrer">
                            <span className="ic"><FaWhatsapp size={16} /></span>
                            Call Now
                        </DropdownAction>
                    </DropdownMenu>
                )}
            </HeaderContainer>

            {/* Settings sidebar */}
            <SidebarOverlay isOpen={isSidebarOpen} onClick={() => setSidebarOpen(false)} />
            <Sidebar isOpen={isSidebarOpen}>
                <SidebarHeader>
                    <h2>Settings</h2>
                    <CloseButton onClick={() => setSidebarOpen(false)}><FaTimes size={18} /></CloseButton>
                </SidebarHeader>

                <TopGrid>
                    <SettingCard onClick={toggleTheme}>
                        <IconWrapper>{isDarkMode ? <FaMoon size={18} /> : <FaSun size={18} />}</IconWrapper>
                        <CardLabel>Theme</CardLabel>
                        <ToggleSwitch isActive={isDarkMode}><ToggleThumb isActive={isDarkMode} /></ToggleSwitch>
                    </SettingCard>
                    <SettingCard onClick={() => setIsContrast((v) => !v)}>
                        <IconWrapper><FaAdjust size={18} /></IconWrapper>
                        <CardLabel>Contrast</CardLabel>
                        <ToggleSwitch isActive={isContrast}><ToggleThumb isActive={isContrast} /></ToggleSwitch>
                    </SettingCard>
                </TopGrid>

                <FontSection>
                    <SectionBadge>Typography</SectionBadge>
                    <p className="label">Font Family</p>
                    <FontGrid>
                        {FONTS.map((f) => (
                            <FontCard
                                key={f.name}
                                active={selectedFont === f.name}
                                onClick={() => handleFontChange(f.name, f.family)}
                                style={{ fontFamily: f.family }}
                            >
                                <span className="aa">Aa</span>
                                <span className="nm">{f.name}</span>
                            </FontCard>
                        ))}
                    </FontGrid>
                    <p className="label" style={{ marginTop: 20 }}>Font Size</p>
                    <SliderContainer>
                        <SizeTooltip val={((fontSize - 12) / (24 - 12)) * 100}>{fontSize}px</SizeTooltip>
                        <input type="range" min="12" max="24" value={fontSize} onChange={handleSizeChange} />
                    </SliderContainer>
                </FontSection>
            </Sidebar>

            {showScrollTop && (
                <BackToTopButton onClick={() => scroll.scrollToTop({ duration: 500 })} aria-label="Back to top">
                    <FaArrowUp />
                </BackToTopButton>
            )}
        </>
    );
};

/* ---------- styled ---------- */
const HeaderContainer = styled.header`
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 9999;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${({ isScrolled }) => (isScrolled ? '10px 50px' : '18px 50px')};
    background: ${({ isScrolled }) => (isScrolled ? 'var(--header-bg-color)' : 'transparent')};
    backdrop-filter: ${({ isScrolled }) => (isScrolled ? 'var(--blur-glass)' : 'none')};
    -webkit-backdrop-filter: ${({ isScrolled }) => (isScrolled ? 'var(--blur-glass)' : 'none')};
    border-bottom: 1px solid ${({ isScrolled }) => (isScrolled ? 'var(--glass-border)' : 'transparent')};
    transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    @media (max-width: 768px) {
        padding: 12px 20px;
    }
`;

const Logo = styled.div`
    display: flex; align-items: center;
`;

const LogoImg = styled.img`
    height: 48px;
    width: auto;
    object-fit: contain;
    filter: drop-shadow(0 0 18px var(--accent-glow));
    transition: transform 0.3s;
    &:hover { transform: scale(1.05); }
    @media (max-width: 768px) { height: 40px; }
`;

const Nav = styled.nav`
    display: flex; align-items: center; gap: 6px;
    @media (max-width: 968px) { display: none; }
`;

const NavItem = styled(ScrollLink)`
    position: relative;
    padding: 8px 14px;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-color);
    cursor: pointer;
    border-radius: 10px;
    transition: color 0.25s;

    &::after {
        content: '';
        position: absolute;
        left: 14px; right: 14px; bottom: 4px;
        height: 2px;
        background: var(--gradient-primary);
        border-radius: 2px;
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    &:hover { color: var(--tittle-color); }
    &:hover::after { transform: scaleX(1); }
    &.active {
        color: var(--tittle-color);
    }
    &.active::after { transform: scaleX(1); }
`;

const CallNowButton = styled.a`
    display: inline-flex; align-items: center; gap: 8px;
    margin-left: 10px;
    padding: 10px 18px;
    background: var(--gradient-primary);
    color: #fff !important;
    font-weight: 600; font-size: 14px;
    border-radius: 999px;
    box-shadow: var(--shadow-neon);
    transition: transform 0.25s, box-shadow 0.25s;
    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 0 32px var(--accent-glow);
    }
`;

const SettingsButton = styled.button`
    margin-left: 6px;
    background: var(--button-background-color);
    color: var(--tittle-color);
    border: 1px solid var(--glass-border);
    width: 40px; height: 40px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: background 0.25s, transform 0.25s;
    &:hover { background: var(--button-background-color-hover); transform: rotate(60deg); }
`;

const MobileToggle = styled.button`
    display: none;
    background: var(--button-background-color);
    color: var(--tittle-color);
    border: 1px solid var(--glass-border);
    width: 42px; height: 42px;
    border-radius: 12px;
    align-items: center; justify-content: center;
    cursor: pointer;
    @media (max-width: 968px) { display: flex; }
`;

const DropdownMenu = styled.div`
    position: absolute;
    top: 70px;
    right: 16px;
    width: 240px;
    padding: 12px;
    background: var(--card-bg-solid);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    display: flex; flex-direction: column; gap: 4px;
    animation: fadeInUp 0.25s ease both;
`;

const dropdownItemStyle = css`
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px;
    font-size: 14px; font-weight: 500;
    color: var(--text-color);
    cursor: pointer; text-decoration: none;
    border-radius: 10px;
    transition: background 0.2s, color 0.2s;
    .ic {
        width: 28px; height: 28px;
        border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        background: var(--button-background-color);
        color: var(--tittle-color);
    }
    &:hover, &.active {
        background: var(--button-background-color);
        color: var(--tittle-color);
    }
`;

const DropdownItem = styled(ScrollLink)`${dropdownItemStyle}`;
const DropdownAction = styled.div`${dropdownItemStyle}`;

const ToggleSwitch = styled.div`
    margin-left: auto;
    width: 38px; height: 22px;
    background: ${({ isActive }) => (isActive ? 'var(--gradient-primary)' : 'var(--ProgressBar)')};
    border-radius: 999px;
    position: relative;
    transition: background 0.3s ease;
`;
const ToggleThumb = styled.div`
    width: 16px; height: 16px;
    background: #fff;
    border-radius: 50%;
    position: absolute;
    top: 3px;
    left: ${({ isActive }) => (isActive ? '19px' : '3px')};
    transition: left 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
`;

const rotate = keyframes`to { transform: rotate(360deg); }`;
const StyledCogIcon = styled(FaCog)`
    animation: ${rotate} 6s linear infinite;
`;

const BackToTopButton = styled.button`
    position: fixed;
    bottom: 32px; right: 32px;
    width: 52px; height: 52px;
    border: none;
    border-radius: 50%;
    background: var(--gradient-primary);
    color: #fff;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    box-shadow: var(--shadow-neon);
    z-index: 9999;
    transition: transform 0.25s;
    animation: fadeInUp 0.4s ease both;
    &:hover { transform: translateY(-4px) scale(1.05); }
    svg { width: 20px; height: 20px; }
    @media (max-width: 768px) {
        bottom: 20px; right: 20px;
        width: 46px; height: 46px;
    }
`;

const SidebarOverlay = styled.div`
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.5);
    backdrop-filter: blur(4px);
    opacity: ${({ isOpen }) => (isOpen ? 1 : 0)};
    pointer-events: ${({ isOpen }) => (isOpen ? 'all' : 'none')};
    transition: opacity 0.3s;
    z-index: 9998;
`;

const Sidebar = styled.aside`
    position: fixed;
    top: 0; right: 0; bottom: 0;
    width: 380px;
    max-width: 90vw;
    z-index: 9999;
    padding: 24px;
    background: var(--card-bg-solid);
    border-left: 1px solid var(--glass-border);
    box-shadow: var(--shadow-lg);
    transform: ${({ isOpen }) => (isOpen ? 'translateX(0)' : 'translateX(100%)')};
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    overflow-y: auto;
`;

const SidebarHeader = styled.div`
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 28px;
    h2 {
        font-family: var(--font-display);
        font-size: 22px; font-weight: 700; margin: 0;
        background: var(--gradient-text);
        -webkit-background-clip: text; background-clip: text;
        -webkit-text-fill-color: transparent;
    }
`;

const CloseButton = styled.button`
    width: 36px; height: 36px;
    background: var(--button-background-color);
    color: var(--text-color);
    border: 1px solid var(--glass-border);
    border-radius: 10px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
    &:hover { background: var(--button-background-color-hover); color: var(--tittle-color); }
`;

const TopGrid = styled.div`
    display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
    margin-bottom: 24px;
`;

const SettingCard = styled.div`
    background: var(--card-bg-color);
    border: 1px solid var(--glass-border);
    padding: 16px;
    border-radius: var(--radius-md);
    display: flex; align-items: center; gap: 12px;
    cursor: pointer;
    transition: all 0.25s;
    &:hover { border-color: var(--accent-1); }
`;

const IconWrapper = styled.div`
    width: 36px; height: 36px;
    background: var(--button-background-color);
    color: var(--tittle-color);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
`;

const CardLabel = styled.span`
    font-weight: 600; font-size: 14px; color: var(--text-color);
`;

const FontSection = styled.div`
    background: var(--card-bg-color);
    border: 1px solid var(--glass-border);
    padding: 22px;
    border-radius: var(--radius-lg);
    position: relative;
    .label { font-size: 13px; color: var(--text-muted); margin: 0 0 14px; font-weight: 500; }
`;

const SectionBadge = styled.div`
    position: absolute;
    top: -12px; left: 18px;
    background: var(--gradient-primary);
    color: #fff;
    padding: 4px 14px;
    border-radius: 8px;
    font-size: 12px; font-weight: 600; letter-spacing: 0.05em;
    text-transform: uppercase;
`;

const FontGrid = styled.div`
    display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
`;

const FontCard = styled.button`
    padding: 16px 10px;
    border-radius: 14px;
    cursor: pointer;
    background: ${({ active }) => (active ? 'var(--button-background-color)' : 'transparent')};
    border: 2px solid ${({ active }) => (active ? 'var(--accent-1)' : 'var(--glass-border)')};
    color: var(--text-color);
    transition: all 0.2s;
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    .aa  { font-size: 24px; font-weight: 700; color: ${({ active }) => (active ? 'var(--tittle-color)' : 'var(--text-muted)')}; }
    .nm  { font-size: 12px; font-weight: 600; color: ${({ active }) => (active ? 'var(--text-color)' : 'var(--text-muted)')}; }
    &:hover { border-color: var(--accent-1); }
`;

const SliderContainer = styled.div`
    position: relative; padding: 20px 0 0;
    input {
        width: 100%;
        -webkit-appearance: none;
        appearance: none;
        height: 6px;
        border-radius: 999px;
        background: var(--gradient-primary);
        outline: none;
    }
    input::-webkit-slider-thumb {
        -webkit-appearance: none; appearance: none;
        width: 20px; height: 20px;
        border-radius: 50%;
        background: #fff;
        border: 3px solid var(--accent-1);
        box-shadow: 0 0 10px var(--accent-glow);
        cursor: pointer;
    }
`;

const SizeTooltip = styled.div`
    position: absolute;
    top: -2px; left: ${({ val }) => val}%;
    transform: translateX(-50%);
    background: var(--gradient-primary);
    color: #fff;
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 11px; font-weight: 600;
    white-space: nowrap;
`;

export default Header;
