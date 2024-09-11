import {
  FaReact,
  FaNodeJs,
  FaLaravel,
  FaDocker,
  FaSwift,
  FaLinkedin,
  FaInstagram,
  FaCog
} from 'react-icons/fa';

import {
  SiFlutter,
  SiNextdotjs,
  SiVuedotjs,
  SiJavascript,
  SiTypescript,
  SiMongodb,
  SiXampp,
  SiExpress,
  SiMysql,
  SiTermius,
  SiHtml5,
  SiMui,
  SiTailwindcss,
  SiVuetify,
  SiPostgresql,
  SiPhp,
  SiFigma,
  SiAdobe,
} from 'react-icons/si';

import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';

// Tech Stack and Social Links
export const techStack = [
  { icon: <SiFlutter />, name: 'Flutter' },
  { icon: <FaSwift />, name: 'Swift' },
  { icon: <SiNextdotjs />, name: 'Next.js' },
  { icon: <FaReact />, name: 'React.js' },
  { icon: <SiVuedotjs />, name: 'Vue.js' },
  { icon: <SiJavascript />, name: 'JavaScript' },
  { icon: <SiTypescript />, name: 'TypeScript' },
  { icon: <FaLaravel />, name: 'Laravel' },
  { icon: <FaNodeJs />, name: 'Node.js' },
  { icon: <SiExpress />, name: 'Express.js' },
  { icon: <SiMongodb />, name: 'MongoDB' },
  { icon: <SiXampp />, name: 'XAMPP' },
  { icon: <FaDocker />, name: 'Docker' },
  { icon: <SiMysql />, name: 'SQL' },
  { icon: <SiTermius />, name: 'Termius' },
  { icon: <SiHtml5 />, name: 'HTML' },
  { icon: <SiPhp />, name: 'PHP' },
  { icon: <SiFigma />, name: 'Figma' },
  { icon: <SiAdobe />, name: 'Photoshop' },
  { icon: <SiMui />, name: 'MUI' },
  { icon: <SiTailwindcss />, name: 'Tailwind CSS' },
  { icon: <SiVuetify />, name: 'Vuetify' },
  { icon: <SiPostgresql />, name: 'PostgreSQL' },
];

export const getSocialLinks = (isDarkMode) => [
  {
    icon: <FaLinkedin style={{ color: isDarkMode ? '#0e76a8' : '#0077b5', fontSize: '24px' }} />,
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/in/suhilman-9ab90a207/',
  },
  {
    icon: (
      <img
        src={
          isDarkMode
            ? 'https://employers.glints.id/images/logo-dark.png'
            : 'https://kontenesia.com/wp-content/uploads/2022/08/logo-glints-kontenesia-review.png'
        }
        alt="Glints"
        style={{ width: '32px', height: '32px', marginRight: '8px' }}
      />
    ),
    name: 'Glints',
    href: 'https://glints.com/id/profile/public/d67e46c1-f424-40cf-874d-5190859600c9',
  },
  {
    icon: (
      <img
        src="https://uploads-ssl.webflow.com/662fbf69a72889ec66f07686/662fbf69a72889ec66f0a406_seek.png"
        alt="Jobstreet"
        style={{ width: '25px', height: '25px', marginRight: '8px' }}
      />
    ),
    name: 'Jobstreet',
    href: 'https://id.jobstreet.com/id/profile/suhilman-hilman-x2TplXR4x3',
  },
  {
    icon: <FaInstagram style={{ fontSize: '30px', color: '#E4405F' }} />,
    name: 'Instagram',
    href: 'https://www.instagram.com/suhilman_fi/',
  },
];

// Floating animation
export const float = keyframes`
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0);
  }
`;

// Circle Backgrounds and Shadows
// Circle Backgrounds and Shadows
export const CircleBackground = styled(motion.div)`
  position: absolute;
  top: 45%;
  left: 70%;
  transform: translate(-50%, -50%);
  width: 300px;
  height: 300px;
  background-color: var(--tittle-color);
  border-radius: 50%;
  animation: ${float} 4s ease-in-out infinite;
  transition: transform 0.3s ease-in-out;

  &:hover {
    animation: none;
    transform: scale(1.5); /* Increase the scale value to see it enlarge */
  }

  @media (max-width: 768px) {
    width: 300px;
    height: 300px;
    top: 80%;
    left: 30%;
  }
`;

export const CircleBackground1 = styled(motion.div)`
  position: absolute;
  top: 15%;
  left: 70%;
  width: 100px;
  height: 100px;
  background-color: var(--tittle-color);
  border-radius: 50%;
  z-index: 1;
  animation: ${float} 5s ease-in-out infinite;
  transition: transform 0.3s ease-in-out;

  &:hover {
    animation: none;
    width: 110px;
    height:110px;
  }

  @media (max-width: 768px) {
    width: 50px;
    height: 50px;
    top: 73%;
    left: 70%;
  }
`;

export const CircleBackground2 = styled(motion.div)`
  position: absolute;
  top: 35%;
  left: 60%;
  width: 50px;
  height: 50px;
  background-color: var(--tittle-color);
  border-radius: 50%;
  z-index: 1;
  animation: ${float} 6s ease-in-out infinite;
  transition: transform 0.3s ease-in-out;

  &:hover {
    animation: none;
    width: 60px;
    height: 60px;
  }

  @media (max-width: 768px) {
    width: 30px;
    height: 30px;
    top: 65%;
    left: 80%;
  }
`;

export const CircleBackground3 = styled(motion.div)`
  position: absolute;
  top: 55%;
  left: 60%;
  width: 30px;
  height: 30px;
  background-color: var(--tittle-color);
  border-radius: 50%;
  z-index: 1;
  animation: ${float} 2s ease-in-out infinite;
  transition: transform 0.3s ease-in-out;

  &:hover {
    animation: none;
    width: 40px;
    height: 40px;
  }

  @media (max-width: 768px) {
    width: 0;
    height: 0;
  }
`;


export const Shadow = styled(motion.div)`
  background-color: var(--card-bg-color);
  border-radius: 8px;
  padding: 15px;
  top: 40%;
  left: 70%;
  height: 500px;
  width: 500px;
  border-radius: 50%;
  position: absolute;
  background: linear-gradient(100deg, var(--card-bg-color) 60%, var(--tittle-color) 150%);
  animation: ${float} 6s ease-in-out infinite;
  transition: transform 0.3s ease-in-out;

  @media (max-width: 768px) {
    width: 0;
    height: 0;
  }
`;

export const Shadow1 = styled(motion.div)`
  background-color: var(--card-bg-color);
  border-radius: 8px;
  padding: 15px;
  height: 500px;
  width: 500px;
  border-radius: 50%;
  top: 13%;
  position: absolute;
  background: linear-gradient(0deg, var(--card-bg-color) 60%, var(--tittle-color) 200%);
  animation: ${float} 6s ease-in-out infinite;
  transition: transform 0.3s ease-in-out;

  @media (max-width: 768px) {
    top: 100px;
    left: -1%;
  }
`;

// Circle backgrounds array for looping
export const circleBackgrounds = [
  { component: Shadow, delay: 1.4 },
  { component: Shadow1, delay: 1.4 },
  { component: CircleBackground, delay: 0.4 },
  { component: CircleBackground1, delay: 0.6 },
  { component: CircleBackground2, delay: 0.8 },
  { component: CircleBackground3, delay: 1 },
];

// Rotate animations for cog icons
const rotate = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const rotateReverse = keyframes`
  100% {
    transform: rotate(0deg);
  }
  0% {
    transform: rotate(360deg);
  }
`;

// Styled components for rotating cog icons
export const StyledCogIcon = styled(FaCog)`
  color: currentColor;
  animation: ${rotate} 3s linear infinite;
  position: absolute;
  opacity: 5%;
`;

export const StyledCogIcon1 = styled(FaCog)`
  color: currentColor;
  animation: ${rotateReverse} 3s linear infinite;
  position: absolute;
  opacity: 5%;
`;

export const StyledCogIcon2 = styled(FaCog)`
  color: currentColor;
  animation: ${rotate} 3s linear infinite;
  position: absolute;
  opacity: 5%;

  @media (max-width: 768px) {
    display: none;
  }
`;

// Cog icons array for looping
export const cogIcons = [
  { component: StyledCogIcon, size: 100, top: '80%', left: '2%' },
  { component: StyledCogIcon1, size: 80, top: '74%', left: '8%' },
  { component: StyledCogIcon2, size: 50, top: '85%', left: '9%' },
];

export const platforms = ['IOS', 'Android', 'MacOS', 'Web', 'Desktop'];