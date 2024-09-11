import React from "react";
import styled, { keyframes } from "styled-components";

const Kemi = () => {
  return (
    <Container>
      <Title>SUHILMAN</Title>
      <TitleAnimated>SUHILMAN</TitleAnimated>
    </Container>
  );
};

export default Kemi;

// Styled Components

// Container for centering text and positioning titles
const Container = styled.div`
  position: relative;
  width: 100%;
  height: auto;
  text-align: center;
`;

// Title styles with responsive font sizes and absolute positioning
const Title = styled.h2`
  color: #282828;
  font-size: 7em;
  position: absolute;  /* Absolute positioning */
  top: 0;
  left: 50%;
  transform: translateX(-50%); /* Center horizontally */
  -webkit-text-stroke: 0.5px var(--tittle-color);

  @media (max-width: 1024px) {
    font-size: 4em;
  }

  @media (max-width: 768px) {
    font-size: 3em;
  }

  @media (max-width: 480px) {
    font-size: 2.5em;
  }
`;

// Keyframes for the animated title
const animate = keyframes`
  0%,
  100% {
    clip-path: polygon(
      0% 45%,
      16% 44%,
      33% 50%,
      54% 60%,
      70% 61%,
      84% 59%,
      100% 52%,
      100% 100%,
      0% 100%
    );
  }

  50% {
    clip-path: polygon(
      0% 60%,
      15% 65%,
      34% 66%,
      51% 62%,
      67% 50%,
      84% 45%,
      100% 46%,
      100% 100%,
      0% 100%
    );
  }
`;

// TitleAnimated inherits styles from Title and adds animation
const TitleAnimated = styled(Title)`
  color: var(--tittle-color);
  animation: ${animate} 4s ease-in-out infinite;
  z-index: 1; /* Ensure it's on top of the static Title */
`;
