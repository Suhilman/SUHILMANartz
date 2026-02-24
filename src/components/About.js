import React from 'react';
import styled from 'styled-components';
import { Timeline } from 'antd';
import { motion } from 'framer-motion';
import { FaFileDownload } from 'react-icons/fa';

// --- DATA CONFIGURATION ---
const FORMAL_SKILLS = [
    { name: 'Communication', level: '90%' },
    { name: 'Technical Writing', level: '60%' }, 
    { name: 'System Analysis', level: '90%' },
    { name: 'Problem Solving', level: '85%' },
    { name: 'Algorithm & Logic', level: '80%' },
];

const PROFESSIONAL_SKILLS = [
    { name: 'React / Next.js/ Vue.js', level: '90%' },
    { name: 'Flutter / Swift / React Native', level: '60%' },
    { name: 'UI/UX Design', level: '75%' },
    { name: 'Laravel / Nest.js / Express.js / PHP', level: '65%' },
    { name: 'Adobe / Microsoft ', level: '80%' },
];

const EDUCATION_HISTORY = [
    { school: 'Pakuan University', major: 'Computer Science', year: '2017 - 2024' },
    { school: 'SMK WIKRAMA BOGOR', major: 'Software Engineering', year: '2014 - 2017' },
    { school: 'SMP Negeri 2 Megamendung', major: '', year: '2011 - 2014' },
    { school: 'SD Negeri Ciawi 03', major: '', year: '2006 - 2011' },
];

const FILES = [
    { name: 'CURICULUM VITAE.PDF', size: '2.4 MB', date: 'Sat Feb 25', path: 'CURICULUM VITAE.pdf' },
    { name: 'PORTOFOLIO.PDF', size: '2.4 MB', date: 'Sat Feb 25', path: 'PORTOFOLIO.pdf' },
];

const TAGS = [
    'Organized', 'Protective', 'Practical', 'Hardworking', 'Passionate', 'Punctual',
    'Figma', 'C++', 'C#', 'CSS', 'Vue.JS', 'Laravel', 'NestJS', 'Next.JS', 
    'React.JS', 'SwiftUI', 'Flutter', 'JavaScript', 'Microsoft Word', 
    'Microsoft Excel', 'Ilustrator', 'Premiere Pro', 'Photoshop', 
    'PHP', 'MySQL', 'Photo & Video Editing', 'Software & Hardware Installation'
];

const AboutPage = () => {
    const openFile = (filePath) => {
        window.open(filePath, '_blank');
    };

    // Varian animasi hover untuk digunakan berulang
    const hoverEffect = {
        scale: 1.02,
        boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.2)",
        transition: { duration: 0.3 }
    };

    return (
        <PageContainer>
            <TitlePage>About</TitlePage>
            <AboutSection>
                {/* PROFILE SECTION */}
                <ProfileSection
                    as={motion.div}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={hoverEffect} // Efek Zoom
                    transition={{ duration: 0.5 }}
                >
                    <ProfileImage src={require('../assets/casual.JPG')} alt="Profile" />
                    <ProfileDetails>
                        <Name>SUHILMAN</Name>
                        <Title>Programmer</Title>
                        <Quote>"I'm looking for a site that will simplify the planning of my business trips."</Quote>
                        <InfoList>
                            <InfoItem><strong>Age:</strong> 25</InfoItem>
                            <InfoItem><strong>Status:</strong> Single</InfoItem>
                            <InfoItem><strong>Address:</strong> Ciawi, Bogor 🇮🇩</InfoItem>
                        </InfoList>
                        <TagContainer>
                            {TAGS.map((tag, index) => (
                                <Tag
                                    key={tag}
                                    as={motion.span}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    whileHover={{ scale: 1.1, backgroundColor: 'var(--tittle-color)', color: '#fff' }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                >
                                    {tag}
                                </Tag>
                            ))}
                        </TagContainer>
                    </ProfileDetails>
                </ProfileSection>

                {/* DETAILS SECTION */}
                <DetailsSection>
                    <CardWrapper>
                        {[
                            { title: 'Formal', data: FORMAL_SKILLS, delay: 0.2 },
                            { title: 'Professional', data: PROFESSIONAL_SKILLS, delay: 0.4 }
                        ].map((section) => (
                            <Card
                                key={section.title}
                                as={motion.div}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={hoverEffect} // Efek Zoom
                                transition={{ duration: 0.5, delay: section.delay }}
                            >
                                <SectionTitle>{section.title}</SectionTitle>
                                {section.data.map((skill) => (
                                    <div className="skill-item" key={skill.name}>
                                        <SkillText>{skill.name}</SkillText>
                                        <ProgressBar>
                                            <Progress 
                                                as={motion.div}
                                                initial={{ width: 0 }}
                                                animate={{ width: skill.level }}
                                                transition={{ duration: 1, delay: section.delay + 0.5 }}
                                            />
                                        </ProgressBar>
                                    </div>
                                ))}
                            </Card>
                        ))}
                    </CardWrapper>

                    <CardWrapper>
                        <Card
                            as={motion.div}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={hoverEffect} // Efek Zoom
                            transition={{ duration: 0.5, delay: 0.6 }}
                        >
                            <SectionTitle style={{ marginBottom: '30px' }}>Education</SectionTitle>
                            <TimelineContainer>
                                {EDUCATION_HISTORY.map((edu, idx) => (
                                    <TimelineItem key={idx}>
                                        <strong>{edu.school}</strong>
                                        {edu.major && <><br />{edu.major}</>}
                                        <br /> ({edu.year})
                                    </TimelineItem>
                                ))}
                            </TimelineContainer>
                        </Card>

                        <ColumnWrapper>
                            {FILES.map((file, idx) => (
                                <FileCard
                                    key={file.name}
                                    as={motion.div}
                                    whileHover={{ 
                                        scale: 1.05, 
                                        borderColor: 'var(--tittle-color)',
                                        boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.2)"
                                    }}
                                    onClick={() => openFile(require(`../assets/${file.path}`))}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5, delay: 0.8 + (idx * 0.2) }}
                                >
                                    <div className="file-content">
                                        <IconContainer>
                                            <FaFileDownload size={40} color="var(--tittle-color)" />
                                        </IconContainer>
                                        <FileName>{file.name}</FileName>
                                        <FileDetails>
                                            <FileDate>{file.date}</FileDate> • <FileSize>{file.size}</FileSize>
                                        </FileDetails>
                                    </div>
                                    <div className="hover-text">
                                        <FaFileDownload size={40} />
                                        <span>Click to Download</span>
                                    </div>
                                </FileCard>
                            ))}
                        </ColumnWrapper>
                    </CardWrapper>
                </DetailsSection>
            </AboutSection>
        </PageContainer>
    );
};

// --- STYLED COMPONENTS ---

const PageContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const TitlePage = styled.h1`
    font-size: 36px;
    color: var(--text-color);
    margin-bottom: 10px;
    margin-top: 80px;
    text-align: center;
`;

const AboutSection = styled.section`
    display: flex;
    padding: 10px;
    max-width: 1200px;
    width: 100%;
    @media (max-width: 768px) { flex-direction: column; padding: 20px; }
`;

const ProfileSection = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 30px;
    background-color: var(--card-bg-color);
    border-radius: 10px;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
    margin-right: 20px;
    cursor: default;
    @media (max-width: 768px) { margin-right: 0; margin-bottom: 20px; }
`;

const ProfileImage = styled.img`
    border-radius: 50%;
    width: 150px;
    height: 150px;
    object-fit: cover;
    margin-bottom: 20px;
`;

const ProfileDetails = styled.div` text-align: center; `;
const Name = styled.h1` font-size: 44px; color: var(--text-color); margin-bottom: -20px; `;
const Title = styled.h2` font-size: 18px; color: var(--tittle-color); margin-bottom: -10px; `;
const Quote = styled.p` font-style: italic; color: #777; margin-bottom: 20px; `;
const InfoList = styled.ul` list-style: none; padding: 0; margin-bottom: 20px; text-align: left; `;
const InfoItem = styled.li` margin-bottom: 10px; color: var(--text-color); `;

const TagContainer = styled.div` display: flex; flex-wrap: wrap; justify-content: center; `;
const Tag = styled.span`
    background-color: var(--button-background-color);
    color: var(--tittle-color);  
    padding: 5px 10px;
    border-radius: 20px;
    margin: 5px;
    font-size: 12px;
    cursor: pointer;
`;

const DetailsSection = styled.div`
    flex: 2;
    display: flex;
    flex-direction: column;
    padding: 0 20px;
`;

const CardWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
    gap: 20px;
    @media (max-width: 768px) { flex-direction: column; }
`;

const ColumnWrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    flex: 1;
    gap: 10px; 
`;

const Card = styled.div`
    background-color: var(--card-bg-color);
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
    flex: 1;
    cursor: default;
`;

const SectionTitle = styled.h3` font-size: 20px; color: var(--text-color); margin-bottom: 20px; `;
const SkillText = styled.p` color: var(--text-color); margin-bottom: 8px; font-size: 14px; font-weight: 500; `;
const ProgressBar = styled.div` background-color: var(--ProgressBar); border-radius: 10px; margin-bottom: 15px; overflow: hidden; height: 10px; `;
const Progress = styled.div` background-color: var(--tittle-color); height: 100%; `;

const TimelineContainer = styled(Timeline)`
    color: var(--text-color);
    .ant-timeline-item-tail { border-inline-start: 2px solid var(--text-color) !important; }
    .ant-timeline-item-head { border-color: var(--tittle-color) !important; background: transparent; }
`;

const TimelineItem = styled(Timeline.Item)` color: var(--text-color) !important; padding-bottom: 20px; `;

const FileCard = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 16px;
    border-radius: 12px;
    cursor: pointer;
    border: 2px dashed #777;
    background-color: var(--card-bg-color);
    height: 200px;
    position: relative;
    overflow: hidden;

    .file-content { transition: all 0.3s ease; display: flex; flex-direction: column; align-items: center; }
    .hover-text {
        position: absolute;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.3s ease;
        color: var(--tittle-color);
        font-weight: bold;
    }

    &:hover {
        .file-content { opacity: 0; transform: scale(0.9); }
        .hover-text { opacity: 1; transform: translateY(0); }
    }
`;

const IconContainer = styled.div` margin-bottom: 8px; `;
const FileName = styled.h3` font-size: 16px; color: var(--text-color); margin: 0; `;
const FileDetails = styled.div` font-size: 12px; color: #757575; margin-top: 8px; `;
const FileDate = styled.span` margin-right: 4px; `;
const FileSize = styled.span` margin-left: 4px; `;

export default AboutPage;
