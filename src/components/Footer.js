import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Link as ScrollLink } from 'react-scroll';
import { FaStar, FaLinkedinIn, FaInstagram, FaGithub, FaWhatsapp, FaArrowRight } from 'react-icons/fa';
import { MdEmail, MdPhone, MdLocationOn } from 'react-icons/md';

const NAV = [
    { to: 'about',         label: 'About' },
    { to: 'experience',    label: 'Experience' },
    { to: 'animation',     label: 'Animation' },
    { to: 'documentation', label: 'Documentation' },
    { to: 'contact',       label: 'Contact' },
];

const SOCIALS = [
    { icon: <FaLinkedinIn />, href: 'https://www.linkedin.com/in/suhilman/' },
    { icon: <FaInstagram />,  href: 'https://www.instagram.com/suhilman_fi/' },
    { icon: <FaGithub />,     href: 'https://github.com/Suhilman' },
    { icon: <FaWhatsapp />,   href: 'https://wa.me/6285172335192' },
];

const Footer = () => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);

    return (
        <Container>
            <Top>
                <Brand>
                    <BrandHead>
                        <BrandTitle>SUHILMAN<span>artz</span></BrandTitle>
                    </BrandHead>
                    <Tagline>
                        Get exclusive <em>IT &amp; Developer</em> updates straight to your inbox.
                    </Tagline>
                    <Stars>
                        {[1, 2, 3, 4, 5].map((n) => (
                            <StarBtn
                                key={n}
                                active={(hover || rating) >= n}
                                onClick={() => setRating(n)}
                                onMouseEnter={() => setHover(n)}
                                onMouseLeave={() => setHover(0)}
                                aria-label={`Rate ${n} stars`}
                            >
                                <FaStar />
                            </StarBtn>
                        ))}
                    </Stars>
                    {rating > 0 && <RatingText>Thanks! You rated {rating} ★</RatingText>}
                </Brand>

                <Col>
                    <ColTitle>Pages</ColTitle>
                    {NAV.map((n) => (
                        <NavLink key={n.to} to={n.to} smooth duration={500} offset={-60}>
                            <FaArrowRight />
                            {n.label}
                        </NavLink>
                    ))}
                </Col>

                <Col>
                    <ColTitle>Contact</ColTitle>
                    <ContactRow><MdPhone /> +62 8517-2335-192</ContactRow>
                    <ContactRow><MdEmail /> Suhilman.sch@gmail.com</ContactRow>
                    <ContactRow><MdLocationOn /> Ciawi, Bogor, Indonesia</ContactRow>
                </Col>
            </Top>

            <Bottom>
                <Socials>
                    {SOCIALS.map((s, i) => (
                        <SocialBtn
                            key={i}
                            href={s.href}
                            target="_blank" rel="noopener noreferrer"
                            as={motion.a}
                            whileHover={{ y: -3, scale: 1.08 }}
                        >
                            {s.icon}
                        </SocialBtn>
                    ))}
                </Socials>
                <Legal>
                    <span>© {new Date().getFullYear()} SUHILMANartz — All rights reserved.</span>
                    <a href="#privacy">Privacy</a>
                    <a href="#terms">Terms</a>
                </Legal>
            </Bottom>
        </Container>
    );
};

export default Footer;

const Container = styled.footer`
  position: relative;
  margin-top: 60px;
  padding: 60px 6vw 24px;
  background: linear-gradient(180deg, transparent, rgba(0,0,0,0.25));
  border-top: 1px solid var(--glass-border);
  color: var(--text-color);
`;

const Top = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  gap: 40px;
  max-width: 1280px;
  margin: 0 auto;
  @media (max-width: 768px) { grid-template-columns: 1fr; gap: 32px; }
`;

const Brand = styled.div``;
const BrandHead = styled.div` display: flex; align-items: center; gap: 12px; `;
const BrandTitle = styled.div`
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(2rem, 4vw, 3rem);
  letter-spacing: -0.03em;
  line-height: 1.05;
  span {
    background: var(--gradient-text);
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;
const Tagline = styled.p`
  color: var(--text-muted);
  margin: 16px 0;
  max-width: 320px;
  line-height: 1.6;
  font-size: 14px;
  em { color: var(--tittle-color); font-style: normal; font-weight: 600; }
`;

const Stars = styled.div` display: flex; gap: 6px; `;
const StarBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 22px;
  color: ${({ active }) => (active ? '#facc15' : 'var(--text-muted)')};
  transition: all 0.2s;
  filter: ${({ active }) => (active ? 'drop-shadow(0 0 6px rgba(250,204,21,0.6))' : 'none')};
  &:hover { transform: scale(1.15); }
`;
const RatingText = styled.p` margin-top: 10px; font-size: 13px; color: #facc15; font-family: var(--font-mono); `;

const Col = styled.div``;
const ColTitle = styled.h4`
  font-size: 14px;
  font-family: var(--font-mono);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--tittle-color);
  margin: 0 0 18px;
  position: relative;
  padding-bottom: 8px;
  &::after {
    content: '';
    position: absolute;
    left: 0; bottom: 0;
    width: 28px; height: 2px;
    background: var(--gradient-primary);
    border-radius: 2px;
  }
`;
const NavLink = styled(ScrollLink)`
  display: flex; align-items: center; gap: 8px;
  font-size: 14px;
  color: var(--text-color);
  cursor: pointer;
  padding: 6px 0;
  transition: all 0.25s;
  svg { color: var(--text-muted); transition: all 0.25s; font-size: 10px; }
  &:hover { color: var(--tittle-color); padding-left: 6px; }
  &:hover svg { color: var(--tittle-color); transform: translateX(2px); }
`;
const ContactRow = styled.p`
  display: flex; align-items: center; gap: 10px;
  margin: 0 0 12px;
  font-size: 14px;
  color: var(--text-color);
  svg {
    color: var(--tittle-color);
    background: var(--button-background-color);
    padding: 6px;
    border-radius: 8px;
    font-size: 28px;
    box-sizing: content-box;
    width: 14px; height: 14px;
  }
`;

const Bottom = styled.div`
  max-width: 1280px;
  margin: 40px auto 0;
  padding-top: 24px;
  border-top: 1px solid var(--glass-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  @media (max-width: 768px) { justify-content: center; text-align: center; }
`;
const Socials = styled.div` display: flex; gap: 10px; `;
const SocialBtn = styled.a`
  width: 38px; height: 38px;
  border-radius: 12px;
  background: var(--card-bg-color);
  border: 1px solid var(--glass-border-strong);
  color: var(--text-color);
  display: flex; align-items: center; justify-content: center;
  text-decoration: none;
  transition: all 0.25s;
  &:hover { background: var(--gradient-primary); color: #fff; border-color: transparent; box-shadow: var(--shadow-neon); }
`;
const Legal = styled.div`
  display: flex; gap: 16px; align-items: center;
  font-size: 12px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  a { color: var(--text-muted); transition: color 0.2s; }
  a:hover { color: var(--tittle-color); }
  @media (max-width: 768px) { flex-wrap: wrap; justify-content: center; }
`;
