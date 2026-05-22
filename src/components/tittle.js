import React from "react";
import styled, { keyframes } from "styled-components";

const Kemi = () => {
  return (
    <Container>
      <TitleStroke>SUHILMAN</TitleStroke>
      <TitleAnimated>SUHILMAN</TitleAnimated>
    </Container>
  );
};

export default Kemi;

const Container = styled.div`
  position: relative;
  width: 100%;
  height: auto;
  text-align: left;
  @media (max-width: 968px) { text-align: center; }
`;

const baseTitle = `
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(2.5rem, 8.5vw, 7rem);
  letter-spacing: -0.04em;
  line-height: 0.95;
  margin: 0;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  word-break: keep-all;
  white-space: nowrap;
  text-align: inherit;

  @media (max-width: 968px) {
    font-size: clamp(3.5rem, 15vw, 6rem);
    text-align: center;
  }
`;

const TitleStroke = styled.h2`
  ${baseTitle}
  color: transparent;
  -webkit-text-stroke: 1.5px var(--tittle-color);
  opacity: 0.55;
`;

const animate = keyframes`
  0%, 100% {
    clip-path: polygon(0% 45%, 16% 44%, 33% 50%, 54% 60%, 70% 61%, 84% 59%, 100% 52%, 100% 100%, 0% 100%);
  }
  50% {
    clip-path: polygon(0% 60%, 15% 65%, 34% 66%, 51% 62%, 67% 50%, 84% 45%, 100% 46%, 100% 100%, 0% 100%);
  }
`;

const TitleAnimated = styled.h2`
  ${baseTitle}
  background: var(--gradient-text);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ${animate} 4s ease-in-out infinite;
  z-index: 1;
`;
