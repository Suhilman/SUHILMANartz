import React, { useEffect, useState, useRef } from 'react';
import Globe from 'react-globe.gl';

const BasicGlobe = () => {
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 });
  const globeContainerRef = useRef(null);

  // Function to handle resizing
  const handleResize = () => {
    if (globeContainerRef.current) {
      const { offsetWidth } = globeContainerRef.current;
      setDimensions({
        width: offsetWidth,
        height: offsetWidth, // Keep globe square-shaped for simplicity
      });
    }
  };

  useEffect(() => {
    // Initial setting of globe dimensions
    handleResize();

    // Add event listener for window resize to update dimensions
    window.addEventListener('resize', handleResize);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div ref={globeContainerRef} style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
      <Globe
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        backgroundColor="rgba(0,0,0,0)"
        width={dimensions.width}
        height={dimensions.height}
      />
    </div>
  );
};

export default BasicGlobe;
