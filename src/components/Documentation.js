import React, { useState, useEffect } from 'react';

const Documentation = () => {
  const ITEMS = [
    { src: require('../assets/document/nadia.png'), alt: 'Project 1' },
    { src: require('../assets/document/viona.png'), alt: 'Project 2' },
    { src: require('../assets/document/myip.png'), alt: 'Project 3' },
    { src: require('../assets/document/nadiamobile.png'), alt: 'Project 4' },
    { src: require('../assets/document/myipmobile.png'), alt: 'Project 5' },
    { src: require('../assets/document/bnp.png'), alt: 'Project 6' },
    { src: require('../assets/document/mrt.png'), alt: 'Project 7' },
    { src: require('../assets/document/nmt.png'), alt: 'Project 8' },
    { src: require('../assets/document/beetpos.png'), alt: 'Project 9' },
    { src: require('../assets/document/backoffice.png'), alt: 'Project 10' },
    { src: require('../assets/document/topup.png'), alt: 'Project 11' },
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [hoveredImage, setHoveredImage] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768); // Detect mobile by screen width

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768); // Update state on resize
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNext = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % ITEMS.length);
  };

  const handlePrev = () => {
    setActiveIndex((prevIndex) => (prevIndex - 1 + ITEMS.length) % ITEMS.length);
  };

  const handleDotClick = (index) => {
    setActiveIndex(index);
  };

  const styles = {
    sliderContainer: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      width: '100%',
      height: isMobile ? '400px' : '670px', // Adjust height for mobile
      overflow: 'hidden',
      paddingTop: isMobile ? '50px' : '150px',
    },
    sliderTitle: {
      margin: '0',
      fontSize: '28px',
      textAlign: 'center',
    },
    sliderWrapper: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      width: '100%',
      height: '100%',
    },
    sliderItem: {
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      width: isMobile ? '250px' : '500px', // Adjust width for mobile
      transition: 'transform 0.5s ease, opacity 0.5s ease',
    },
    sliderItemImg: {
      display: 'block',
      width: '100%',
      height: 'auto',
      borderRadius: '10px',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    },
    sliderItemImgHover: {
      transform: 'scale(1.05)',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
    },
    sliderItemActive: {
      transform: isMobile ? 'translateX(0) translateY(-50%) scale(1)' : 'translateX(0) translateY(-50%) scale(1.2)', // Adjust scale for mobile
      opacity: 1,
      zIndex: 3,
    },
    sliderItemPrev: {
      transform: isMobile ? 'translateX(-150px) translateY(-50%) scale(0.8)' : 'translateX(-550px) translateY(-50%) scale(0.9)', // Adjust for mobile
      opacity: 0.7,
      zIndex: 2,
    },
    sliderItemNext: {
      transform: isMobile ? 'translateX(150px) translateY(-50%) scale(0.8)' : 'translateX(550px) translateY(-50%) scale(0.9)', // Adjust for mobile
      opacity: 0.7,
      zIndex: 2,
    },
    sliderButton: {
      backgroundColor: 'var(--button-background-color-hover)',
      color: 'var(--tittle-color)',
      border: 'none',
      cursor: 'pointer',
      padding: '0',
      width: isMobile ? '40px' : '50px', // Adjust button size for mobile
      height: isMobile ? '40px' : '50px',
      zIndex: 4,
      position: 'absolute',
      top: '60%',
      transform: 'translateY(-50%)',
      borderRadius: '50%',
      outline: 'none',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      transition: 'transform 0.3s ease',
    },
    sliderButtonHover: {
      backgroundColor: 'var(--button-background-color-hover-mobile)',
      transform: 'translateY(-20px) scale(1.1)',
    },
    prevButton: {
      left: '20px',
    },
    nextButton: {
      right: '20px',
    },
    sliderDots: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      bottom: '10px',
    },
    dot: {
      width: '12px',
      height: '12px',
      margin: '0 5px',
      backgroundColor: 'var(--button-background-color)',
      borderRadius: '50%',
      cursor: 'pointer',
      transition: 'background-color 0.3s ease',
    },
    dotActive: {
      backgroundColor: 'var(--tittle-color)',
    },
  };

  return (
    <div style={styles.sliderContainer}>
      <h2 style={styles.sliderTitle}>Documentation</h2>
      <button
        onClick={handlePrev}
        style={{
          ...styles.sliderButton,
          ...styles.prevButton,
          ...(hoveredButton === 'prev' ? styles.sliderButtonHover : {}),
        }}
        onMouseEnter={() => setHoveredButton('prev')}
        onMouseLeave={() => setHoveredButton(null)}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div style={styles.sliderWrapper}>
        {ITEMS.map((item, index) => {
          const isActive = index === activeIndex;
          const isPrev = index === (activeIndex - 1 + ITEMS.length) % ITEMS.length;
          const isNext = index === (activeIndex + 1) % ITEMS.length;

          if (!isActive && !isPrev && !isNext) {
            return null;
          }

          let itemStyle = styles.sliderItem;
          if (isActive) itemStyle = { ...itemStyle, ...styles.sliderItemActive };
          else if (isPrev) itemStyle = { ...itemStyle, ...styles.sliderItemPrev };
          else if (isNext) itemStyle = { ...itemStyle, ...styles.sliderItemNext };

          return (
            <div
              key={index}
              style={itemStyle}
              onMouseEnter={() => setHoveredImage(index)}
              onMouseLeave={() => setHoveredImage(null)}
            >
              <img
                src={item.src}
                alt={item.alt}
                style={{
                  ...styles.sliderItemImg,
                  ...(hoveredImage === index ? styles.sliderItemImgHover : {}),
                }}
              />
            </div>
          );
        })}
      </div>
      <button
        onClick={handleNext}
        style={{
          ...styles.sliderButton,
          ...styles.nextButton,
          ...(hoveredButton === 'next' ? styles.sliderButtonHover : {}),
        }}
        onMouseEnter={() => setHoveredButton('next')}
        onMouseLeave={() => setHoveredButton(null)}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 18L15 12L9 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div style={styles.sliderDots}>
        {ITEMS.map((_, index) => (
          <span
            key={index}
            style={index === activeIndex ? { ...styles.dot, ...styles.dotActive } : styles.dot}
            onClick={() => handleDotClick(index)}
          ></span>
        ))}
      </div>
    </div>
  );
};

export default Documentation;
