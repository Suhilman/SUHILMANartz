import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { Link as ScrollLink, animateScroll as scroll } from 'react-scroll';
import { FaBars, FaTimes, FaWhatsapp, FaSun, FaMoon, FaCog, FaAdjust, FaArrowUp, FaInfoCircle, FaBriefcase, FaFileAlt, FaEnvelope } from 'react-icons/fa';

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
                <CloseButton onClick={toggleSidebar}>
                    <FaTimes size={24} />
                </CloseButton>
                <SidebarContent>
                    <h2>Settings</h2>
                    <SettingsContainer>
                        <SettingButton onClick={toggleTheme}>
                            <IconContainer>
                                {isDarkMode ? <FaMoon size={24} /> : <FaSun size={24} />}
                            </IconContainer>
                            <SettingLabel>Dark mode</SettingLabel>
                            <ToggleSwitch isActive={isDarkMode}>
                                <ToggleThumb isActive={isDarkMode} />
                            </ToggleSwitch>
                        </SettingButton>
                        <SettingButton disabled>
                            <IconContainer>
                                <FaAdjust size={20} />
                            </IconContainer>
                            <SettingLabel>Contrast</SettingLabel>
                            <ToggleSwitch isActive={isContrastMode} disabled>
                                <ToggleThumb isActive={isContrastMode} disabled/>
                            </ToggleSwitch>
                        </SettingButton>
                    </SettingsContainer>
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

const Sidebar = styled.div`
    position: fixed;
    right: 0;
    top: 0;
    bottom: 0;
    width: 300px;
    background-color: var(--header-bg-color);
    box-shadow: -2px 0 5px rgba(0, 0, 0, 0.2);
    z-index: 99999;
    padding: 20px;
    transform: ${({ isOpen }) => (isOpen ? 'translateX(0)' : 'translateX(100%)')};
    transition: transform 0.3s ease-in-out;
`;

const CloseButton = styled.div`
    cursor: pointer;
    color: var(--icon-color);
    position: absolute;
    top: 10px;
    right: 10px;
`;

const SidebarContent = styled.div`
    margin-top: 40px;
`;

const SettingsContainer = styled.div`
    display: flex;
    gap: 20px;
`;

const SettingButton = styled.div`
    background-color: var(--card-experience);
    border-radius: 8px;
    padding: 15px;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
`;

const IconContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 10px;
`;

const SettingLabel = styled.span`
    font-size: 14px;
    color: var(--text-color);
    text-align: center;  // Setting label berada di tengah
    width: 100%;
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

export default Header;
