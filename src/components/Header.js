import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { Link as ScrollLink, animateScroll as scroll } from 'react-scroll';
import { 
    FaBars, FaTimes, FaWhatsapp, FaSun, FaMoon, 
    FaCog, FaAdjust, FaArrowUp, FaInfoCircle, 
    FaBriefcase, FaFileAlt, FaEnvelope, FaGlobe,
    FaExpandAlt, FaSyncAlt // Tambahkan ini
} from 'react-icons/fa';

const Header = ({ isDarkMode, toggleTheme }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isContrastMode, setIsContrastMode] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [isScrolled, setIsBackScrolled] = useState(false);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    const closeDropdown = () => {
        setIsOpen(false);  
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const toggleContrastMode = () => {
        setIsContrastMode(!isContrastMode);
    };

    const handleScroll = () => {
        if (window.scrollY > 300) {
            setShowScrollButton(true);
        } if (window.scrollY > 50) {
            setIsBackScrolled(true);
        } else {
            setShowScrollButton(false);
            setIsBackScrolled(false);
        }
    };

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const scrollToTop = () => {
        scroll.scrollToTop({ duration: 500 });
    };

    const [selectedFont, setSelectedFont] = useState('Public Sans');
    const [fontSize, setFontSize] = useState(16);

    const fonts = [
        { name: 'Public Sans', family: "'Public Sans', sans-serif" },
        { name: 'Inter', family: "'Inter', sans-serif" },
        { name: 'DM Sans', family: "'DM Sans', sans-serif" },
        { name: 'Nunito Sans', family: "'Nunito Sans', sans-serif" },
    ];

    const handleFontChange = (fontName, fontFamily) => {
        setSelectedFont(fontName);
        document.documentElement.style.setProperty('--main-font', fontFamily);
    };

    const handleSizeChange = (e) => {
        const size = e.target.value;
        setFontSize(size);
        document.documentElement.style.setProperty('--base-font-size', `${size}px`);
    };

    const logo = isDarkMode ? require('../assets/artzdark.png') : require('../assets/artz.png');
    return (
        <>
            <HeaderContainer isScrolled={isScrolled}>
                <Logo>
                    <ContactImage src={logo} alt="Contact Illustration" />
                </Logo>
                <Nav>
                    <NavItem 
                        to="about" 
                        smooth={true} 
                        duration={500} 
                        activeClass="active" 
                        spy={true} 
                        onClick={closeDropdown}
                        style={{ fontWeight: 'bold' }}
                    >
                        About
                    </NavItem>
                    <NavItem 
                        to="experience" 
                        smooth={true} 
                        duration={500} 
                        activeClass="active" 
                        spy={true} 
                        onClick={closeDropdown}
                        style={{ fontWeight: 'bold' }}
                    >
                        Experience
                    </NavItem>
                    <NavItem 
                        to="animation" 
                        smooth={true} 
                        duration={500} 
                        activeClass="active" 
                        spy={true} 
                        onClick={closeDropdown}
                        style={{ fontWeight: 'bold' }}
                    >
                        Animation
                    </NavItem>
                    <NavItem 
                        to="documentation" 
                        smooth={true} 
                        duration={500} 
                        activeClass="active" 
                        spy={true} 
                        onClick={closeDropdown}
                        style={{ fontWeight: 'bold' }}
                    >
                        Documentation
                    </NavItem>
                    <NavItem 
                        to="contact" 
                        smooth={true} 
                        duration={500} 
                        activeClass="active" 
                        spy={true} 
                        onClick={closeDropdown}
                        style={{ fontWeight: 'bold' }}
                    >
                        Contact
                    </NavItem>
                    <CallNowButton href="https://wa.me/6285172335192" target="_blank" style={{ fontWeight: 'bold', marginRight:'10px'}}>
                        <FaWhatsapp size={20} style={{ marginRight: '8px' }} />
                        Call Now
                    </CallNowButton>
                    <SettingsButton onClick={toggleSidebar}>
                        <StyledCogIcon size={24} />
                    </SettingsButton>
                </Nav>
                <IconButton onClick={toggleDropdown}>
                    {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                </IconButton>
                {isOpen && (
                    <DropdownContainer>
                    <DropdownMenu>
                        <DropdownItem 
                            to="about" 
                            smooth={true} 
                            duration={500} 
                            activeClass="active" 
                            spy={true} 
                            onClick={closeDropdown}
                        >
                            <FaInfoCircle size={20} style={{ marginRight: '8px' }} />
                            About
                        </DropdownItem>
                        <DropdownItem 
                            to="experience" 
                            smooth={true} 
                            duration={500} 
                            activeClass="active" 
                            spy={true} 
                            onClick={closeDropdown}
                        >
                            <FaBriefcase size={20} style={{ marginRight: '8px' }} />
                            Experience
                        </DropdownItem>
                        <DropdownItem 
                            to="animation" 
                            smooth={true} 
                            duration={500} 
                            activeClass="active" 
                            spy={true} 
                            onClick={closeDropdown}
                        >
                            <FaBriefcase size={20} style={{ marginRight: '8px' }} />
                            Animation
                        </DropdownItem>
                        <DropdownItem 
                            to="documentation" 
                            smooth={true} 
                            duration={500} 
                            activeClass="active" 
                            spy={true} 
                            onClick={closeDropdown}
                        >
                            <FaFileAlt size={20} style={{ marginRight: '8px' }} />
                            Documentation
                        </DropdownItem>
                        <DropdownItem 
                            to="contact" 
                            smooth={true} 
                            duration={500} 
                            activeClass="active" 
                            spy={true} 
                            onClick={closeDropdown}
                        >
                            <FaEnvelope size={20} style={{ marginRight: '8px' }} />
                            Contact Us
                        </DropdownItem>
                        <DropdownItem onClick={toggleTheme}>
                            <IconContainer>
                                {isDarkMode ? <FaMoon size={24} /> : <FaSun size={24} />}
                            </IconContainer>
                            <ToggleSwitch isActive={isDarkMode}>
                                <ToggleThumb isActive={isDarkMode} />
                            </ToggleSwitch>
                        </DropdownItem>
                        <DropdownItem>
                            <CallNowButton href="https://wa.me/6285172335192" target="_blank">
                                <FaWhatsapp size={20} style={{ marginRight: '8px' }} />
                                Call Now
                            </CallNowButton>
                        </DropdownItem>
                    </DropdownMenu>
                </DropdownContainer>                
                )}
            </HeaderContainer>
            <Sidebar isOpen={isSidebarOpen}>
                <SidebarContent>
                   <SidebarHeader>
                        <h2>Settings</h2>
                        <HeaderIcons>
                            <IconButtonSmall><FaExpandAlt size={18} /></IconButtonSmall>
                            <IconButtonSmall style={{ position: 'relative' }}>
                                <FaSyncAlt size={18} />
                                {/* Titik merah kecil seperti di gambar */}
                                <NotificationDot />
                            </IconButtonSmall>
                            <CloseButton onClick={toggleSidebar}>
                                <FaTimes size={20} />
                            </CloseButton>
                        </HeaderIcons>
                    </SidebarHeader>

                    <TopGrid>
                        <SettingCard onClick={toggleTheme}>
                            <IconWrapper><FaMoon size={22} /></IconWrapper>
                            <CardLabel>Mode</CardLabel>
                            <ToggleSwitch isActive={isDarkMode}><ToggleThumb isActive={isDarkMode} /></ToggleSwitch>
                        </SettingCard>

                        <SettingCard>
                            <IconWrapper><FaAdjust size={22} /></IconWrapper>
                            <CardLabel>Contrast</CardLabel>
                            <ToggleSwitch isActive={isContrastMode}><ToggleThumb isActive={isContrastMode} /></ToggleSwitch>
                        </SettingCard>
                    </TopGrid>

                    <FontSection>
                        <SectionBadge>Font</SectionBadge>
                        <p className="label">Family</p>
                        <FontGrid>
                            {fonts.map((font) => (
                                <FontCard 
                                    key={font.name} 
                                    active={selectedFont === font.name}
                                    onClick={() => handleFontChange(font.name, font.family)}
                                >
                                    <span className="aa-preview">Aa</span>
                                    <span className="font-name">{font.name}</span>
                                </FontCard>
                            ))}
                        </FontGrid>

                        <p className="label" style={{marginTop: '20px'}}>Size</p>
                        <SliderContainer>
                            <SizeTooltip val={((fontSize - 12) / (24 - 12)) * 100}>{fontSize}px</SizeTooltip>
                            <input 
                                type="range" 
                                min="12" 
                                max="24" 
                                value={fontSize} 
                                onChange={handleSizeChange} 
                            />
                        </SliderContainer>
                    </FontSection>
                </SidebarContent>
            </Sidebar>
            {showScrollButton && (
                <BackToTopButton onClick={scrollToTop}>
                    <FaArrowUp />
                </BackToTopButton>
            )}
        </>
    );
};

// Styled Components

const HeaderContainer = styled.header`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 9999;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 50px;
    background-color: ${({ isScrolled }) => (isScrolled ? 'var(--header-bg-color)' : 'transparent')};
    box-shadow: ${({ isScrolled }) => (isScrolled ? '0 2px 5px rgba(0, 0, 0, 0.1)' : 'none')};
    @media (max-width: 768px) {
        padding: 10px 20px;
    }
`;

const Logo = styled.div`
    font-size: 30px;
    color: #00695c;
`;

const Nav = styled.nav`
    display: flex;
    align-items: center;

    @media (max-width: 768px) {
        display: none;
    }
`;

const NavItem = styled(ScrollLink)`
    margin-right: 30px;
    font-size: 16px;
    color: var(--text-color);
    cursor: pointer;
    text-decoration: none;

    &.active {
        background-color: var(--button-background-color-hover);
        border-radius: 5px;
        padding: 5px 10px;
        color: var(--text-color);
    }

    &:hover {
        transform: translateY(-0px) scale(1.1); 
    }
`;


const SettingsButton = styled.div`
    color: var(--tittle-color); 
    border: none;
    border-radius: 5px;
    display: flex;
    align-items: center;
    cursor: pointer;
    font-size: 16px;
    text-decoration: none;
`;

const CallNowButton = styled.a`
    background-color: var(--button-background-color);
    color: var(--tittle-color); 
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    display: flex;
    align-items: center;
    cursor: pointer;
    font-size: 16px;
    text-decoration: none;

    &:hover {
        background-color: var(--button-background-color-hover);
    }
`;

const IconButton = styled.div`
    display: none;
    cursor: pointer;
    color: var(--tittle-color);

    @media (max-width: 768px) {
        display: block;
    }
`;

const DropdownContainer = styled.div`
    position: relative;
`;

const DropdownMenu = styled.div`
    position: absolute;
    top: 60px;
    right: 20px;
    background-color: var(--header-bg-color);
    border: 1px solid #dcdcdc;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 20px;
    z-index: 1000;
    width: 200px;
`;

const DropdownItem = styled(ScrollLink)`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 15px;
    font-size: 16px;
    color: var(--text-color);
    cursor: pointer;
    text-decoration: none;
    padding: 5px 10px;
    border-radius: 5px;

    &.active {
        background-color: var(--button-background-color-hover);
        color: var(--text-color);
    }

    &:last-child {
        margin-bottom: 0;
    }

    &:hover {
        text-decoration: none;
        background-color: var(--button-background-color-hover);
        color: var(--text-color);
    }
`;

const ContactImage = styled.img`
    width: 20%;
    height: auto;
`;

const SidebarContent = styled.div`
    margin-top: 40px;
`;

const ToggleSwitch = styled.div`
    width: 40px;
    height: 20px;
    background-color: ${({ isActive }) => (isActive ? 'var(--tittle-color)' : '#ccc')};
    border-radius: 20px;
    position: relative;
    transition: background-color 0.3s ease;
`;

const ToggleThumb = styled.div`
    width: 18px;
    height: 18px;
    background-color: white;
    border-radius: 50%;
    position: absolute;
    top: 1px;
    left: ${({ isActive }) => (isActive ? '20px' : '1px')};
    transition: left 0.3s ease;
`;

const rotate = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const StyledCogIcon = styled(FaCog)`
    color: currentColor;
    animation: ${rotate} 3s linear infinite;
`;

const BackToTopButton = styled.button`
    position: fixed;
    bottom: 40px;
    right: 40px;
    width: 50px;
    height: 50px;
    background-color: var(--button-background-color);
    color: var(--tittle-color);
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
    transition: background-color 0.3s ease;
    z-index:9999;

    &:hover {
        background-color: var(--button-background-color-hover);
    }

    svg {
        width: 24px;
        height: 24px;
    }
`;



// Pastikan IconContainer sudah didefinisikan (tadi error karena mungkin terhapus/lupa dibuat)
const IconContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--tittle-color);
    min-width: 24px;
`;

const Sidebar = styled.div`
    position: fixed;
    right: 0; 
    top: 0; 
    bottom: 0;
    width: 380px;
    
    /* 1. Ubah background ke RGBA (transparan) */
    background-color: rgba(248, 250, 252, 0.8); 
    
    /* 2. Tambahkan Backdrop Filter untuk efek blur */
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px); /* Dukungan untuk Safari */

    /* 3. Border tipis agar lebih elegan (opsional) */
    border-left: 1px solid rgba(255, 255, 255, 0.3);
    
    box-shadow: -10px 0 30px rgba(0, 0, 0, 0.05);
    z-index: 10000;
    padding: 25px;
    transform: ${({ isOpen }) => (isOpen ? 'translateX(0)' : 'translateX(100%)')};
    transition: transform 0.4s cubic-bezier(0.075, 0.82, 0.165, 1);
    color: #334155;
`;

const SidebarHeader = styled.div`
    display: flex;
    justify-content: space-between; /* Menjauhkan Judul (kiri) dan Ikon (kanan) */
    align-items: center;
    margin-bottom: 35px;
    width: 100%;

    h2 { 
        font-size: 22px; 
        font-weight: 700; 
        margin: 0;
        color: #1e293b;
    }
`;


const CloseButton = styled.div`
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    padding: 5px;
    border-radius: 8px;
    transition: all 0.2s;

    &:hover {
        background-color: rgba(0, 0, 0, 0.05);
        color: #ef4444; /* Warna merah saat hover untuk tombol close */
    }
`;

const TopGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-bottom: 30px;
`;

const SettingCard = styled.div`
    background: white;
    padding: 20px;
    border-radius: 20px;
    display: flex;
    flex-direction: column;
    gap: 15px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
`;

const IconWrapper = styled.div`
    background: #f1f5f9;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const CardLabel = styled.span`
    font-weight: 600;
    font-size: 16px;
`;

const FontSection = styled.div`
    background: white;
    padding: 25px;
    border-radius: 24px;
    position: relative;
    border: 1px solid #f1f5f9;
    
    .label { font-size: 14px; color: #64748b; margin-bottom: 15px; font-weight: 500;}
`;

const SectionBadge = styled.div`
    position: absolute;
    top: -12px;
    left: 20px;
    background: #1e293b;
    color: white;
    padding: 4px 16px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
`;

const FontGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
`;

const FontCard = styled.div`
    padding: 20px;
    border-radius: 16px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background: ${props => props.active ? '#fff' : 'transparent'};
    border: 2px solid ${props => props.active ? '#f1f5f9' : 'transparent'};
    box-shadow: ${props => props.active ? '0 10px 15px -3px rgba(0,0,0,0.1)' : 'none'};

    .aa-preview {
        display: block;
        font-size: 28px;
        font-weight: bold;
        color: ${props => props.active ? '#00a8ff' : '#cbd5e1'};
        margin-bottom: 8px;
    }
    .font-name {
        font-size: 14px;
        font-weight: 600;
        color: ${props => props.active ? '#1e293b' : '#94a3b8'};
    }
`;

const SliderContainer = styled.div`
    position: relative;
    padding: 20px 0;
    
    input {
        width: 100%;
        -webkit-appearance: none;
        height: 6px;
        border-radius: 5px;
        background: linear-gradient(to right, #00d2ff, #3a7bd5);
        outline: none;
    }

    input::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: white;
        border: 4px solid #fff;
        box-shadow: 0 0 10px rgba(0,0,0,0.2);
        cursor: pointer;
    }
`;

const SizeTooltip = styled.div`
    position: absolute;
    top: -10px;
    left: ${props => props.val}%;
    transform: translateX(-50%);
    background: #1e293b;
    color: white;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 12px;
    &:after {
        content: '';
        position: absolute;
        top: 100%; left: 50%;
        margin-left: -4px;
        border-width: 4px;
        border-style: solid;
        border-color: #1e293b transparent transparent transparent;
    }
`;

const NotificationDot = styled.div`
    position: absolute;
    top: -2px;
    right: -2px;
    width: 8px;
    height: 8px;
    background-color: #ff4d4f;
    border-radius: 50%;
    border: 2px solid white;
`;

const HeaderIcons = styled.div`
    display: flex;
    align-items: center;
    gap: 15px;
`;

const IconButtonSmall = styled.div`
    cursor: pointer;
    color: #64748b;
    display: flex;
    align-items: center;
    transition: opacity 0.2s;

    &:hover {
        opacity: 0.7;
    }
`;


export default Header;
