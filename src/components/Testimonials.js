import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FaQuoteLeft, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { Tilt } from './fx';

const TESTIMONIALS = [
  {
    quote: 'Suhilman built our satellite network monitoring dashboard with high precision and a UI that makes it easy for our team to work around the clock. The result exceeded expectations.',
    name: 'Rangga Pratama',
    email: 'rangga.p@bisdata.co.id',
    role: 'Engineering Lead · PT. BIS DATA INDONESIA',
    avatar: 'R',
    color: 'var(--gradient-primary)',
  },
  {
    quote: 'Quick communication, clean code, and always prioritizes user experience. One of the best front-end engineers we have ever collaborated with.',
    name: 'Dewi Anggraini',
    email: 'dewi.a@lifetech.id',
    role: 'Product Manager · PT. Life Tech Tanpa Batas',
    avatar: 'D',
    color: 'var(--gradient-secondary)',
  },
  {
    quote: 'From ideation to production deploy, everything is handled with a professional attitude. Features ship on time and the documentation is clean.',
    name: 'Bagus Setiawan',
    email: 'bagus@beetpos.com',
    role: 'Product Owner · BeetPOS / BeetClinic',
    avatar: 'B',
    color: 'linear-gradient(135deg, #ff5b94, #00f0ff)',
  },
  {
    quote: 'He turned a complex full-stack Dart project into something maintainable and elegant. The HR platform he delivered is rock-solid and a joy to use.',
    name: 'Putri Lestari',
    email: 'putri.l@bisdata.co.id',
    role: 'HR Operations · PT. BIS DATA INDONESIA',
    avatar: 'P',
    color: 'linear-gradient(135deg, #00f0ff, #b14aff)',
  },
  {
    quote: 'A rare engineer who genuinely cares about design detail. The dashboards are not just functional, they look stunning and load fast.',
    name: 'Andi Nugroho',
    email: 'andi.nugroho@gmail.com',
    role: 'UI/UX Designer · Freelance Collaboration',
    avatar: 'A',
    color: 'linear-gradient(135deg, #b14aff, #ff5b94)',
  },
  {
    quote: 'Reliable, fast, and proactive. He anticipated edge cases we never thought of and shipped a flawless POS integration with Tokopedia and Shopee.',
    name: 'Maya Kusuma',
    email: 'maya.k@lifetech.id',
    role: 'Project Lead · PT. Life Tech Tanpa Batas',
    avatar: 'M',
    color: 'linear-gradient(135deg, #00f0ff, #22c55e)',
  },
  {
    quote: 'Working with Suhilman felt effortless. Great attitude, sharp problem-solving, and always delivers more than asked. Highly recommended.',
    name: 'Reza Maulana',
    email: 'reza.maulana@outlook.com',
    role: 'Startup Founder · Client',
    avatar: 'R',
    color: 'linear-gradient(135deg, #ff5b94, #b14aff)',
  },
];

const Testimonials = () => {
  const [i, setI] = useState(0);
  const next = () => setI((p) => (p + 1) % TESTIMONIALS.length);
  const prev = () => setI((p) => (p - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);

  useEffect(() => {
    const id = setInterval(next, 7000);
    return () => clearInterval(id);
  }, []);

  const t = TESTIMONIALS[i];

  return (
    <Section>
      <Header>
        <Eyebrow>{'// 07 — Voices'}</Eyebrow>
        <Title>What people <span>say</span></Title>
      </Header>

      <Tilt max={5} scale={1.01}>
      <Card>
        <QuoteIcon><FaQuoteLeft /></QuoteIcon>
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <Quote>{t.quote}</Quote>
            <Person>
              <Avatar style={{ background: t.color }}>{t.avatar}</Avatar>
              <PersonInfo>
                <strong>{t.name}</strong>
                {t.email && <Email>{t.email}</Email>}
              </PersonInfo>
            </Person>
          </motion.div>
        </AnimatePresence>

        <Nav>
          <NavBtn onClick={prev} aria-label="Previous testimonial"><FaChevronLeft /></NavBtn>
          <Dots>
            {TESTIMONIALS.map((_, idx) => (
              <Dot key={idx} active={idx === i} onClick={() => setI(idx)} />
            ))}
          </Dots>
          <NavBtn onClick={next} aria-label="Next testimonial"><FaChevronRight /></NavBtn>
        </Nav>
      </Card>
      </Tilt>
    </Section>
  );
};

export default Testimonials;

const Section = styled.section`
  padding: 80px 6vw;
  max-width: 1100px;
  margin: 0 auto;
  @media (max-width: 768px) { padding: 60px 5vw; }
`;
const Header = styled.div` text-align: center; margin-bottom: 32px; `;
const Eyebrow = styled.div`
  font-family: var(--font-mono);
  font-size: 12px; letter-spacing: 0.2em;
  color: var(--tittle-color);
  margin-bottom: 12px;
  text-transform: uppercase;
`;
const Title = styled.h2`
  font-size: clamp(2rem, 4.5vw, 3.5rem);
  font-weight: 700;
  margin: 0;
  color: var(--text-color);
  span { background: var(--gradient-text); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
`;
const Card = styled.div`
  position: relative;
  background: var(--gradient-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: 48px 40px 32px;
  backdrop-filter: var(--blur-glass);
  -webkit-backdrop-filter: var(--blur-glass);
  min-height: 280px;
  transition: border-color 0.3s, box-shadow 0.3s;
  &:hover { border-color: var(--accent-1); box-shadow: 0 0 28px var(--accent-glow); }
  @media (max-width: 768px) { padding: 36px 24px 24px; }
`;
const QuoteIcon = styled.div`
  position: absolute;
  top: -18px; left: 24px;
  width: 44px; height: 44px;
  border-radius: 12px;
  background: var(--gradient-primary);
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
  box-shadow: var(--shadow-neon);
`;
const Quote = styled.p`
  font-size: clamp(1.05rem, 1.6vw, 1.3rem);
  line-height: 1.6;
  color: var(--text-color);
  font-weight: 500;
  margin: 0 0 28px;
  font-style: italic;
`;
const Person = styled.div`
  display: flex; align-items: center; gap: 14px;
`;
const Avatar = styled.div`
  width: 48px; height: 48px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  font-weight: 700;
  font-family: var(--font-display);
  font-size: 18px;
  border: 2px solid var(--glass-border);
  box-shadow: 0 0 16px var(--accent-glow);
`;
const PersonInfo = styled.div`
  strong { display: block; font-size: 14px; color: var(--text-color); }
  small  { display: block; margin-top: 3px; font-size: 12px; color: var(--tittle-color); font-family: var(--font-mono); }
`;
const Email = styled.span`
  display: block;
  margin-top: 1px;
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-muted);
  opacity: 0.45;
  letter-spacing: 0.02em;
`;
const Nav = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--glass-border);
`;
const NavBtn = styled.button`
  width: 36px; height: 36px;
  border-radius: 50%;
  border: 1px solid var(--glass-border-strong);
  background: var(--card-bg-color);
  color: var(--text-color);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
  &:hover { background: var(--gradient-primary); color: #fff; border-color: transparent; }
`;
const Dots = styled.div` display: flex; gap: 8px; `;
const Dot = styled.button`
  width: ${({ active }) => (active ? '24px' : '8px')};
  height: 8px;
  border-radius: 999px;
  border: none;
  background: ${({ active }) => (active ? 'var(--gradient-primary)' : 'var(--ProgressBar)')};
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
`;
