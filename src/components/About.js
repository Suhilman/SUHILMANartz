import React from 'react';
import styled from 'styled-components';
import { Timeline } from 'antd';
import { motion } from 'framer-motion';
import { FaFileDownload } from 'react-icons/fa';

const AboutPage = () => {
    const openFile = (filePath) => {
        window.open(filePath, '_blank');
    };

    return (
        <PageContainer>
            <TitlePage>About</TitlePage>
            <AboutSection>
                <ProfileSection
                    as={motion.div}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
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
                            <InfoItem><strong>Address:</strong> Ciawi, Bogor  🇮🇩</InfoItem>
                        </InfoList>
                        <TagContainer>
                            {['Organized', 'Protective', 'Practical', 'Hardworking', 'Passionate', 'Punctual'].map((tag, index) => (
                                <Tag
                                    key={index}
                                    as={motion.span}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                >
                                    {tag}
                                </Tag>
                            ))}
                        </TagContainer>
                    </ProfileDetails>
                </ProfileSection>

                <DetailsSection>
                    <CardWrapper>
                        <Card
                            as={motion.div}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <SectionTitle>Formal</SectionTitle>
                            <ProgressBar>
                                <Progress width="60%" />
                            </ProgressBar>
                            <ProgressBar>
                                <Progress width="40%" />
                            </ProgressBar>
                            <ProgressBar>
                                <Progress width="90%" />
                            </ProgressBar>
                            <ProgressBar>
                                <Progress width="50%" />
                            </ProgressBar>
                        </Card>

                        <Card
                            as={motion.div}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                        >
                            <SectionTitle>Professional</SectionTitle>
                            <ProgressBar>
                                <Progress width="80%" />
                            </ProgressBar>
                            <ProgressBar>
                                <Progress width="90%" />
                            </ProgressBar>
                            <ProgressBar>
                                <Progress width="75%" />
                            </ProgressBar>
                            <ProgressBar>
                                <Progress width="65%" />
                            </ProgressBar>
                            <ProgressBar>
                                <Progress width="70%" />
                            </ProgressBar>
                        </Card>
                    </CardWrapper>

                    <CardWrapper>
                        <Card
                            as={motion.div}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.6 }}
                        >
                            <SectionTitle style={{ marginBottom: '30px' }}>Education</SectionTitle>
                            <TimelineContainer>
                                <TimelineItem><strong>Pakuan University</strong><br />Computer Sience<br /> (2017 - 2024)</TimelineItem>
                                <TimelineItem><strong>SMK WIKRAMA BOGOR</strong><br />Software Engineering<br /> (2014 - 2017)</TimelineItem>
                                <TimelineItem><strong>SMP Negeri 2 Megamendung</strong><br /> (2011 - 2014)</TimelineItem>
                                <TimelineItem><strong>SD Negeri Ciawi 03</strong><br /> (2006 - 2011)</TimelineItem>
                            </TimelineContainer>
                        </Card>

                        <ColumnWrapper>
                            <FileCard
                                as={motion.div}
                                whileHover={{ scale: 1.05 }}
                                onClick={() => openFile(require('../assets/CURICULUM VITAE.pdf'))}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: 0.8 }}
                            >
                                <IconContainer>
                                    <FaFileDownload size={40} color="var(--tittle-color)" />
                                </IconContainer>
                                <FileName>CURICULUM VITAE.PDF</FileName>
                                <FileDetails>
                                    <FileDate>Sat Feb 25</FileDate> • <FileSize>2.4 MB</FileSize>
                                </FileDetails>
                            </FileCard>

                            <FileCard
                                as={motion.div}
                                whileHover={{ scale: 1.05 }}
                                onClick={() => openFile(require('../assets/PORTOFOLIO.pdf'))}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: 1 }}
                            >
                                <IconContainer>
                                    <FaFileDownload size={40} color="var(--tittle-color)" />
                                </IconContainer>
                                <FileName>PORTOFOLIO.PDF</FileName>
                                <FileDetails>
                                    <FileDate>Sat Feb 25</FileDate> • <FileSize>2.4 MB</FileSize>
                                </FileDetails>
                            </FileCard>
                        </ColumnWrapper>
                    </CardWrapper>
                </DetailsSection>
            </AboutSection>
        </PageContainer>
    );
};

// Container untuk halaman utama
const PageContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

// Title Page
const TitlePage = styled.h1`
    font-size: 36px;
    color: var(--text-color);
    margin-bottom: 10px;
    margin-top:80px;
    text-align: center;
`;

// About Section
const AboutSection = styled.section`
    display: flex;
    padding: 10px;
    color: white;
    max-width: 1200px;
    width: 100%;

    @media (max-width: 768px) {
        flex-direction: column;
        padding: 20px;
    }
`;

// Profile Section
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
    @media (max-width: 768px) {
        margin-right: 0;
        margin-bottom: 20px;
    }
`;

const ProfileImage = styled.img`
    border-radius: 50%;
    width: 150px;
    height: 150px;
    object-fit: cover;
    margin-bottom: 20px;
`;

const ProfileDetails = styled.div`
    text-align: center;
`;

const Name = styled.h1`
    font-size: 44px;
    color: var(--text-color);
    margin-bottom: -20px;
`;

const Title = styled.h2`
    font-size: 18px;
    color: var(--tittle-color);
    margin-bottom: -10px;
`;

const Quote = styled.p`
    font-style: italic;
    color: #777;
    margin-bottom: 20px;
`;

const InfoList = styled.ul`
    list-style: none;
    padding: 0;
    margin-bottom: 20px;
    text-align: left;
    align-self: center;
`;

const InfoItem = styled.li`
    margin-bottom: 10px;
    color: var(--text-color);
`;

// Tags
const TagContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
`;

const Tag = styled.span`
    background-color: var(--button-background-color);
    color: var(--tittle-color);  
    padding: 5px 10px;
    border-radius: 20px;
    margin: 5px;
    font-size: 12px;
`;

// Details Section
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

    @media (max-width: 768px) {
        flex-direction: column;
    }
`;

const ColumnWrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    flex: 1;
    gap: 10px; 
    
`;

// Card
const Card = styled.div`
    background-color: var(--card-bg-color);
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
    margin-bottom: 10px; /* Mengurangi margin bottom pada Card */
    flex: 1;
    margin-right: 20px;

    &:last-child {
        margin-right: 0;
    }

    @media (max-width: 768px) {
        margin-right: 0;
        margin-bottom: 10px;
    }
`;

const SectionTitle = styled.h3`
    font-size: 20px;
    color: var(--text-color);
    margin-bottom: 10px;
`;

// Progress Bar
const ProgressBar = styled.div`
    background-color: var(--ProgressBar);
    border-radius: 10px;
    margin-bottom: 10px;
    overflow: hidden;
    height: 10px;
    &:hover {
        animation: none; /* Disable floating animation on hover */
        transform: translateY(0px) scale(1.02); 
    }
`;

const Progress = styled.div`
    background-color: var(--tittle-color);
    width: ${props => props.width || '100%'};
    height: 100%;
    &:hover {
        animation: none; /* Disable floating animation on hover */
        transform: translateY(0px) scale(1.02); 
    }
`;

// Timeline
const TimelineContainer = styled(Timeline)`
    padding-left: 0;
    color: var(--text-color);
    font-size: 20px;
    .ant-timeline-item-tail {
        background-color: var(--text-color);
    }

    .ant-timeline-item-head {
        border-color: var(--tittle-color);
    }
`;

const TimelineItem = styled(Timeline.Item)`
    font-weight: bold;
    font-size: 20px;
    padding-left: 0;
`;

// File Card
const FileCard = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center; /* Center align horizontally */
    justify-content: center; /* Center align vertically */
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    position: relative;
    text-align: center; 
    border: 2px dashed #777;
    margin-bottom: 10px; 
    background-color: var(--card-bg-color);
    height: 200px; /* Adjust this value to increase the height */
`;

const IconContainer = styled.div`
    margin-bottom: 8px;
`;

const FileName = styled.h3`
    font-size: 16px;
    color: var(--text-color);
    margin: 0;
`;

const FileDetails = styled.div`
    font-size: 14px;
    color: #757575;
    margin-top: 8px;
`;

const FileDate = styled.span`
    margin-right: 4px;
`;

const FileSize = styled.span`
    margin-left: 4px;
`;

export default AboutPage;
