import React, { useState } from 'react';
import styled from 'styled-components';
import { Link as ScrollLink } from 'react-scroll';
import { FaStar, FaFacebookF, FaLinkedinIn, FaTwitter, FaInstagram, FaYoutube } from 'react-icons/fa';
import { MdEmail, MdPhone, MdLocationOn } from 'react-icons/md';

const Footer = () => {
    const [rating, setRating] = useState(null);
    const [hover, setHover] = useState(null);

    return (
        <FooterContainer>
            <FooterContent>
                <Section>
                    <Title>SUHILMANartz</Title>
                    <Description>
                        Get exclusive <Highlight>IT-Developer</Highlight> updates straight to your inbox.
                    </Description>
                    <StarRating>
                        {[...Array(5)].map((star, index) => {
                            const ratingValue = index + 1;

                            return (
                                <Star
                                    key={index}
                                    role="button"
                                    aria-label={`Rate ${ratingValue} star${ratingValue > 1 ? 's' : ''}`}
                                    size={30}
                                    onClick={() => setRating(ratingValue)}
                                    onMouseEnter={() => setHover(ratingValue)}
                                    onMouseLeave={() => setHover(null)}
                                    color={(hover || rating) >= ratingValue ? '#ffc107' : '#e4e5e9'}
                                >
                                    <FaStar />
                                </Star>
                            );
                        })}
                    </StarRating>
                    {rating && <RatingText>Your rating: {rating} star{rating > 1 ? 's' : ''}</RatingText>}
                </Section>
                <Section>
                    <SectionTitle>Page</SectionTitle>
                    <List>
                        <ListItem>
                            <NavLink to="about" smooth={true} duration={500}>
                                About
                            </NavLink>
                        </ListItem>
                        <ListItem>
                            <NavLink to="experience" smooth={true} duration={500}>
                                Experience
                            </NavLink>
                        </ListItem>
                        <ListItem>
                            <NavLink to="documentation" smooth={true} duration={500}>
                                Documentation
                            </NavLink>
                        </ListItem>
                        <ListItem>
                            <NavLink to="contact" smooth={true} duration={500}>
                                Contact
                            </NavLink>
                        </ListItem>
                    </List>
                </Section>
                <Section>
                    <SectionTitle>Contact Us</SectionTitle>
                    <ContactInfo>
                        <ContactItem><MdPhone /> +62 8517-2335-192</ContactItem>
                        <ContactItem><MdEmail /> Suhilman.sch@gmail.com</ContactItem>
                        <ContactItem><MdLocationOn /> Ciawi, Bogor</ContactItem>
                    </ContactInfo>
                </Section>
            </FooterContent>
            <FooterBottom>
                <SocialIcons>
                    <SocialIcon><FaFacebookF /></SocialIcon>
                    <SocialIcon><FaLinkedinIn /></SocialIcon>
                    <SocialIcon><FaTwitter /></SocialIcon>
                    <SocialIcon><FaInstagram /></SocialIcon>
                    <SocialIcon><FaYoutube /></SocialIcon>
                </SocialIcons>
                <LegalLinks>
                    <span>©2020 SUHILMANartz Private Ltd. All Rights Reserved.</span>
                    <span>Terms of Service</span>
                    <span>Privacy Policy</span>
                </LegalLinks>
            </FooterBottom>
        </FooterContainer>
    );
};

const FooterContainer = styled.footer`
    background-color: var(--card-bg-color);
    padding: 40px 20px;
    font-size: 14px;
    color: var(--text-color);
`;

const FooterContent = styled.div`
    display: flex;
    justify-content: space-between;
    max-width: 1200px;
    margin: 0 auto;

    @media (max-width: 768px) {
        flex-direction: column;
    }
`;

const Section = styled.div`
    flex: 1;
    padding: 0 20px;

    &:first-child {
        flex: 2;
    }
`;

const Title = styled.h2`
    font-size: 18px;
    margin-bottom: 10px;
`;

const Description = styled.p`
    margin-bottom: 20px;
    line-height: 1.6;
`;

const Highlight = styled.span`
    font-weight: bold;
`;

const StarRating = styled.div`
    display: flex;
    gap: 5px;
`;

const Star = styled.div`
    cursor: pointer;
    transition: color 0.2s;
`;

const RatingText = styled.p`
    margin-top: 10px;
    font-size: 16px;
    color: #ffc107;
`;

const SectionTitle = styled.h3`
    font-size: 16px;
    margin-bottom: 10px;
`;

const List = styled.ul`
    list-style: none;
    padding: 0;
    margin: 0;
`;

const ListItem = styled.li`
    margin-bottom: 10px;
`;

const NavLink = styled(ScrollLink)`
    cursor: pointer;
    color: var(--text-color);
    text-decoration: none;
    font-size: 16px;
    transition: color 0.3s ease;

    &:hover {
        color: var(--highlight-color);
    }
`;

const ContactInfo = styled.div``;

const ContactItem = styled.p`
    margin: 0;
    margin-bottom: 10px;
    display: flex;
    align-items: center;

    svg {
        margin-right: 8px;
    }
`;

const FooterBottom = styled.div`
    border-top: 1px solid #444;
    margin-top: 20px;
    padding-top: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1200px;
    margin: 20px auto 0;

    @media (max-width: 768px) {
        flex-direction: column;
        text-align: center;
    }
`;

const SocialIcons = styled.div`
    display: flex;
    gap: 15px;
`;

const SocialIcon = styled.div`
    cursor: pointer;
    transition: color 0.3s;

    &:hover {
        color: #27ae60;
    }
`;

const LegalLinks = styled.div`
    display: flex;
    gap: 15px;
    align-items: center;

    @media (max-width: 768px) {
        flex-direction: column;
        margin-top: 10px;
        gap: 5px;
    }
`;

export default Footer;
