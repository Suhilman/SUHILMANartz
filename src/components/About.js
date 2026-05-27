import React from 'react';
import styled from 'styled-components';
import { Timeline } from 'antd';
import { motion } from 'framer-motion';
import { FaFileDownload, FaGraduationCap } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { Tilt, RevealWords } from './fx';

const FORMAL_SKILLS = [
    { name: 'Communication',       level: 90 },
    { name: 'Technical Writing',   level: 60 },
    { name: 'System Analysis',     level: 90 },
    { name: 'Problem Solving',     level: 85 },
    { name: 'Algorithm & Logic',   level: 80 },
];

const PROFESSIONAL_SKILLS = [
    { name: 'React / Next.js / Vue.js',                  level: 90 },
    { name: 'Flutter / Swift / React Native',            level: 60 },
    { name: 'UI/UX Design',                              level: 75 },
    { name: 'Laravel / Nest.js / Express.js / PHP',      level: 65 },
    { name: 'Adobe / Microsoft Office',                  level: 80 },
];

const EDUCATION_HISTORY = [
    { school: 'Pakuan University',     major: 'Computer Science',      year: '2017 – 2024' },
    { school: 'SMK WIKRAMA Bogor',     major: 'Software Engineering',  year: '2014 – 2017' },
    { school: 'SMP Negeri 2 Megamendung', major: '',                   year: '2011 – 2014' },
    { school: 'SD Negeri Ciawi 03',    major: '',                      year: '2006 – 2011' },
];

const FILES = [
    { name: 'CURICULUM VITAE', size: '29 KB',  date: 'Updated 2025', route: '/cv' },
    { name: 'PORTFOLIO', size: '1.9 MB', date: 'Updated 2025', route: '/portfolio' },
];

const TAGS = [
    'Organized', 'Protective', 'Practical', 'Hardworking', 'Passionate', 'Punctual',
    'Figma', 'C++', 'C#', 'CSS', 'Vue.JS', 'Laravel', 'NestJS', 'Next.JS',
    'React.JS', 'SwiftUI', 'Flutter', 'JavaScript', 'Microsoft Word',
    'Microsoft Excel', 'Illustrator', 'Premiere Pro', 'Photoshop',
    'PHP', 'MySQL', 'Photo & Video Editing',
];

const viewport = { once: true, amount: 0.2 };

const AboutPage = () => {
    const navigate = useNavigate();
    const openFile = (route) => navigate(route);

    return (
        <Page>
            <Header>
                <Eyebrow>{'// 01 — About'}</Eyebrow>
                <Title><RevealWords>Get to know</RevealWords> <RevealWords as="span" className="grad" delay={0.25}>me</RevealWords></Title>
                <Sub>Programmer · UI / UX enthusiast · Lifelong learner</Sub>
            </Header>

            <Grid>
                {/* PROFILE */}
                <ProfileCard
                    as={motion.div}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={viewport}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                >
                    <AvatarWrap>
                        <AvatarRing />
                        <Avatar src={require('../assets/casual.JPG')} alt="Profile" />
                    </AvatarWrap>
                    <Name>SUHILMAN</Name>
                    <Role>Programmer</Role>
                    <Quote>"Crafting digital experiences that simplify lives — one component at a time."</Quote>

                    <InfoList>
                        <InfoItem><strong>Age</strong><span>25</span></InfoItem>
                        <InfoItem><strong>Status</strong><span>Single</span></InfoItem>
                        <InfoItem><strong>Address</strong><span>Ciawi, Bogor 🇮🇩</span></InfoItem>
                    </InfoList>

                    <Tags>
                        {TAGS.map((t, i) => (
                            <Tag
                                key={t}
                                as={motion.span}
                                initial={{ opacity: 0, y: 8 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={viewport}
                                transition={{ duration: 0.4, delay: i * 0.04 }}
                                whileHover={{ y: -2, scale: 1.05 }}
                            >
                                {t}
                            </Tag>
                        ))}
                    </Tags>
                </ProfileCard>

                {/* DETAILS */}
                <Details>
                    <Row>
                        {[
                            { title: 'Formal Skills',       data: FORMAL_SKILLS,       gradient: 'var(--gradient-primary)' },
                            { title: 'Professional Skills', data: PROFESSIONAL_SKILLS, gradient: 'var(--gradient-secondary)' },
                        ].map((sec, idx) => (
                            <Tilt key={sec.title} max={6} scale={1.02}>
                                <Card
                                    as={motion.div}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={viewport}
                                    transition={{ duration: 0.6, delay: idx * 0.15 }}
                                >
                                    <CardTitle>{sec.title}</CardTitle>
                                    {sec.data.map((s, i) => (
                                        <Skill key={s.name}>
                                            <SkillHead>
                                                <span>{s.name}</span>
                                                <em>{s.level}%</em>
                                            </SkillHead>
                                            <ProgressTrack>
                                                <ProgressFill
                                                    as={motion.div}
                                                    initial={{ width: 0 }}
                                                    whileInView={{ width: `${s.level}%` }}
                                                    viewport={viewport}
                                                    transition={{ duration: 1.1, delay: 0.2 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                                                    style={{ background: sec.gradient }}
                                                />
                                            </ProgressTrack>
                                        </Skill>
                                    ))}
                                </Card>
                            </Tilt>
                        ))}
                    </Row>

                    <Row>
                        <Tilt max={6} scale={1.02}>
                            <Card
                                as={motion.div}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={viewport}
                                transition={{ duration: 0.6 }}
                            >
                                <CardTitle><FaGraduationCap style={{ marginRight: 8 }} /> Education</CardTitle>
                                <StyledTimeline mode="left">
                                    {EDUCATION_HISTORY.map((edu, i) => (
                                        <Timeline.Item key={i} color="var(--accent-1)">
                                            <EduSchool>{edu.school}</EduSchool>
                                            {edu.major && <EduMajor>{edu.major}</EduMajor>}
                                            <EduYear>{edu.year}</EduYear>
                                        </Timeline.Item>
                                    ))}
                                </StyledTimeline>
                            </Card>
                        </Tilt>

                        <FileCol>
                            {FILES.map((f, i) => (
                                <Tilt key={f.name} max={6}>
                                    <FileCard
                                        as={motion.button}
                                        type="button"
                                        initial={{ opacity: 0, scale: 0.92 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={viewport}
                                        transition={{ duration: 0.5, delay: i * 0.12 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => openFile(f.route)}
                                    >
                                        <FileIcon><FaFileDownload size={22} /></FileIcon>
                                        <FileBody>
                                            <FileName>{f.name}</FileName>
                                            <FileMeta>{f.date} · {f.size}</FileMeta>
                                        </FileBody>
                                        <FileArrow>→</FileArrow>
                                    </FileCard>
                                </Tilt>
                            ))}
                        </FileCol>
                    </Row>
                </Details>
            </Grid>
        </Page>
    );
};

export default AboutPage;

/* ---------- styled ---------- */
const Page = styled.div`
    padding: 100px 6vw 80px;
    max-width: 1280px;
    margin: 0 auto;
    @media (max-width: 768px) { padding: 80px 5vw 60px; }
`;

const Header = styled.div`
    text-align: center;
    margin-bottom: 56px;
`;
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
const Sub = styled.p`
    color: var(--text-muted);
    margin-top: 12px;
    font-size: 16px;
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: 360px 1fr;
    gap: 28px;
    align-items: flex-start;
    @media (max-width: 968px) { grid-template-columns: 1fr; }
`;

const baseCard = `
    background: var(--gradient-card);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    padding: 28px;
    backdrop-filter: var(--blur-glass);
    -webkit-backdrop-filter: var(--blur-glass);
    transition: border-color 0.3s, transform 0.3s;
`;

const ProfileCard = styled.div`
    ${baseCard}
    text-align: center;
    position: sticky;
    top: 100px;
    &:hover {
        border-color: var(--accent-1);
        box-shadow: 0 0 28px var(--accent-glow);
    }
    @media (max-width: 968px) { position: relative; top: 0; }
`;

const AvatarWrap = styled.div`
    position: relative;
    width: 160px; height: 160px;
    margin: 0 auto 20px;
`;
const AvatarRing = styled.div`
    position: absolute; inset: -6px;
    border-radius: 50%;
    background: var(--gradient-primary);
    opacity: 0.6;
    filter: blur(8px);
    animation: pulse-glow 3s ease-in-out infinite;
`;
const Avatar = styled.img`
    position: relative;
    width: 100%; height: 100%;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid var(--accent-1);
    box-shadow: var(--shadow-md);
`;

const Name = styled.h3`
    font-size: 28px;
    margin: 0;
    background: var(--gradient-text);
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -0.02em;
`;
const Role = styled.p`
    margin: 4px 0 12px;
    color: var(--tittle-color);
    font-family: var(--font-mono);
    font-size: 13px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
`;
const Quote = styled.blockquote`
    color: var(--text-muted);
    font-style: italic;
    font-size: 14px;
    margin: 0 0 20px;
    padding: 0 8px;
    line-height: 1.6;
`;

const InfoList = styled.div`
    display: flex; flex-direction: column; gap: 8px;
    margin-bottom: 24px;
    text-align: left;
`;
const InfoItem = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 8px 12px;
    background: var(--card-bg-color);
    border: 1px solid var(--glass-border);
    border-radius: 10px;
    font-size: 13px;
    color: var(--text-color);
    strong { color: var(--text-muted); font-weight: 500; }
    span   { font-weight: 600; }
`;

const Tags = styled.div`
    display: flex; flex-wrap: wrap; justify-content: center; gap: 6px;
`;
const Tag = styled.span`
    padding: 5px 10px;
    background: var(--button-background-color);
    color: var(--tittle-color);
    border: 1px solid var(--glass-border);
    border-radius: 999px;
    font-size: 11px;
    font-weight: 500;
    cursor: default;
    transition: all 0.2s;
    &:hover { background: var(--gradient-primary); color: #fff; border-color: transparent; }
`;

const Details = styled.div`
    display: flex; flex-direction: column; gap: 24px;
`;

const Row = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    @media (max-width: 768px) { grid-template-columns: 1fr; }
`;

const Card = styled.div`
    ${baseCard}
    height: 100%;
    &:hover {
        border-color: var(--accent-1);
        box-shadow: 0 0 28px var(--accent-glow);
    }
`;

const CardTitle = styled.h3`
    font-size: 18px;
    margin: 0 0 22px;
    color: var(--text-color);
    display: flex; align-items: center;
    &::before {
        content: '';
        display: inline-block;
        width: 4px; height: 18px;
        background: var(--gradient-primary);
        border-radius: 2px;
        margin-right: 10px;
    }
`;

const Skill = styled.div`
    margin-bottom: 14px;
    &:last-child { margin-bottom: 0; }
`;
const SkillHead = styled.div`
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
    font-size: 13px;
    span { color: var(--text-color); font-weight: 500; }
    em   { color: var(--text-muted); font-family: var(--font-mono); font-style: normal; font-size: 12px; }
`;
const ProgressTrack = styled.div`
    height: 6px;
    background: var(--ProgressBar);
    border-radius: 999px;
    overflow: hidden;
`;
const ProgressFill = styled.div`
    height: 100%;
    border-radius: 999px;
    box-shadow: 0 0 12px var(--accent-glow);
`;

const StyledTimeline = styled(Timeline)`
    .ant-timeline-item-tail { border-inline-start: 2px solid var(--divider-color) !important; }
    .ant-timeline-item-head {
        background: var(--gradient-primary) !important;
        border: none !important;
        width: 12px !important;
        height: 12px !important;
        box-shadow: 0 0 10px var(--accent-glow);
    }
    .ant-timeline-item-content { color: var(--text-color) !important; }
`;
const EduSchool = styled.div` font-weight: 600; color: var(--text-color); font-size: 14px; `;
const EduMajor  = styled.div` color: var(--text-muted); font-size: 13px; margin-top: 2px; `;
const EduYear   = styled.div` color: var(--tittle-color); font-family: var(--font-mono); font-size: 12px; margin-top: 2px; `;

const FileCol = styled.div`
    display: flex; flex-direction: column; gap: 14px;
`;

const FileCard = styled.button`
    ${baseCard}
    cursor: pointer;
    padding: 16px;
    display: flex; align-items: center; gap: 14px;
    color: var(--text-color);
    text-align: left;
    width: 100%;
    transition: all 0.3s;
    &:hover {
        border-color: var(--accent-1);
        box-shadow: 0 0 24px var(--accent-glow);
    }
    &:hover .arrow { transform: translateY(2px); color: var(--tittle-color); }
`;
const FileIcon = styled.div`
    width: 48px; height: 48px;
    border-radius: 12px;
    background: var(--gradient-primary);
    color: #fff;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 0 16px var(--accent-glow);
`;
const FileBody = styled.div`
    flex: 1;
    min-width: 0;
`;
const FileName = styled.div`
    font-weight: 600;
    color: var(--text-color);
    font-size: 14px;
    letter-spacing: 0.02em;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;
const FileMeta = styled.div`
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: 11px;
    margin-top: 4px;
`;
const FileArrow = styled.span.attrs({ className: 'arrow' })`
    color: var(--text-muted);
    font-size: 22px;
    font-weight: 700;
    transition: all 0.25s;
    flex-shrink: 0;
`;
