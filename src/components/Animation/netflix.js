import React, { useState } from 'react';

const WeeMoviesShowcase = () => {
  const [isMacHover, setIsMacHover] = useState(false);
  const [isIphoneHover, setIsIphoneHover] = useState(false);

  const containerStyle = {
    width: '100%',
    aspectRatio: '16 / 10',
    maxHeight: '70vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: '-apple-system, sans-serif',
    overflow: 'hidden',
    position: 'relative',
    perspective: '2000px',
  };

  const macbookStyle = {
    position: 'absolute',
    width: 'min(660px, 78%)',
    aspectRatio: '14 / 9',
    left: '50%',
    top: '50%',
    transform: `translate(-50%, -50%) rotateX(15deg) rotateY(${isMacHover ? '0deg' : '-10deg'})`,
    transition: 'all 0.6s ease-out',
    transformStyle: 'preserve-3d',
    zIndex: 1,
  };

  const iphoneStyle = {
    position: 'absolute',
    width: 'min(180px, 22%)',
    aspectRatio: '9 / 18',
    right: '6%',
    top: '50%',
    transform: `translateY(-50%) rotateY(${isIphoneHover ? '0deg' : '-15deg'}) rotateX(5deg)`,
    transition: 'all 0.6s ease-out',
    transformStyle: 'preserve-3d',
    zIndex: 10,
  };

  return (
    <div style={containerStyle}>
      <div
        style={macbookStyle}
        onMouseEnter={() => setIsMacHover(true)}
        onMouseLeave={() => setIsMacHover(false)}
      >
        <div style={{
          width: '100%', height: '100%', padding: '10px', borderRadius: '18px',
          background: 'linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 100%)',
          boxShadow: isMacHover ? '0 60px 120px rgba(229,9,20,0.3)' : '0 40px 80px rgba(0,0,0,0.6)',
          transition: 'box-shadow 0.5s',
        }}>
          <div style={{ width: '100%', height: '100%', backgroundColor: '#141414', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)' }}>
              <span style={{ color: '#e50914', fontWeight: 900, fontSize: 'clamp(14px, 1.6vw, 20px)' }}>Netflix</span>
              <div style={{ marginLeft: '24px', display: 'flex', gap: '16px', color: '#e5e5e5', fontSize: 'clamp(10px, 0.9vw, 13px)' }}>
                <span>Home</span><span>Movies</span><span>TV Shows</span>
              </div>
            </div>
            <div style={{ flex: 1, minHeight: '50%', background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)', display: 'flex', alignItems: 'flex-end', padding: '16px' }}>
              <div>
                <div style={{ background: '#e50914', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: 'clamp(9px, 0.7vw, 11px)', marginBottom: '8px', width: 'fit-content', fontWeight: 700 }}>#5 TRENDING TODAY</div>
                <h1 style={{ color: 'white', fontSize: 'clamp(16px, 2.2vw, 26px)', fontWeight: 800, margin: '0 0 8px 0', lineHeight: 1.1 }}>SUHILMANartz CAPITAL</h1>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{ background: '#e50914', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: 'clamp(10px, 0.9vw, 13px)' }}>Play</button>
                  <button style={{ background: 'rgba(109,109,110,0.7)', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: 'clamp(10px, 0.9vw, 13px)' }}>My List</button>
                </div>
              </div>
            </div>
            <div style={{ padding: '12px 16px' }}>
              <div style={{ color: 'white', marginBottom: '6px', fontWeight: 'bold', fontSize: 'clamp(10px, 0.95vw, 13px)' }}>Trending Now</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[1,2,3,4].map((i) => (
                  <div key={i} style={{ flex: 1, aspectRatio: '2 / 3', backgroundColor: '#2a2a2a', borderRadius: '4px', cursor: 'pointer', transition: 'transform 0.3s' }}
                    onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
                    onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        style={iphoneStyle}
        onMouseEnter={() => setIsIphoneHover(true)}
        onMouseLeave={() => setIsIphoneHover(false)}
      >
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(145deg, #3a3a3a 0%, #1a1a1a 100%)', borderRadius: '24px', padding: '6px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
          <div style={{ width: '100%', height: '100%', backgroundColor: '#141414', borderRadius: '18px', overflow: 'hidden', position: 'relative', border: '2px solid black' }}>
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '50%', height: '14px', backgroundColor: 'black', borderRadius: '0 0 8px 8px', zIndex: 10 }} />
            <div style={{ flex: 1, height: '46%', background: 'linear-gradient(to top, #141414, #1a1a2e)', padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <span style={{ color: '#e50914', fontWeight: 'bold', fontSize: 'clamp(11px, 1vw, 14px)' }}>N</span>
              <div style={{ color: 'white', fontSize: 'clamp(8px, 0.8vw, 11px)', fontWeight: 'bold', marginTop: '4px' }}>Peaky Blinders</div>
            </div>
            <div style={{ padding: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                {[1,2,3,4].map((i) => <div key={i} style={{ aspectRatio: '4 / 5', backgroundColor: '#2a2a2a', borderRadius: '4px' }} />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeMoviesShowcase;
