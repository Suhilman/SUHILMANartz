import React, { useState } from 'react';

const WeeMoviesShowcase = () => {
  const [isMacHover, setIsMacHover] = useState(false);
  const [isIphoneHover, setIsIphoneHover] = useState(false);

  // Variabel Animasi & Style Dasar
  const containerStyle = {
    // backgroundColor: '#0a0a0a',
    minHeight: '80vh',
    width: '80vw',
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
    width: '700px',
    height: '450px',
    left: '50%',
    top: '45%',
    transform: `translate(-50%, -50%) rotateX(15deg) rotateY(${isMacHover ? '0deg' : '-10deg'})`,
    transition: 'all 0.6s ease-out',
    transformStyle: 'preserve-3d',
    zIndex: 1,
  };

  const iphoneStyle = {
    position: 'absolute',
    width: '200px',
    height: '400px',
    right: '15%',
    top: '50%',
    transform: `translateY(-50%) rotateY(${isIphoneHover ? '0deg' : '-15deg'}) rotateX(5deg)`,
    transition: 'all 0.6s ease-out',
    transformStyle: 'preserve-3d',
    zIndex: 10,
  };

  return (
    <div style={containerStyle}>
      {/* Glow Background */}
      {/* <div style={{ position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', filter: 'blur(150px)', opacity: 0.3, background: '#e50914', top: '-200px', left: '-200px' }} />
      <div style={{ position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', filter: 'blur(150px)', opacity: 0.3, background: '#1a1a2e', bottom: '-200px', right: '-200px' }} /> */}

      {/* MACBOOK */}
      <div 
        style={macbookStyle} 
        onMouseEnter={() => setIsMacHover(true)} 
        onMouseLeave={() => setIsMacHover(false)}
      >
        <div style={{
          width: '100%', height: '100%', padding: '12px', borderRadius: '20px',
          background: 'linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 100%)',
          boxShadow: isMacHover ? '0 60px 120px rgba(229,9,20,0.3)' : '0 50px 100px rgba(0,0,0,0.8)',
          transition: 'box-shadow 0.5s'
        }}>
          <div style={{ width: '100%', height: '100%', backgroundColor: '#141414', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
            {/* Nav */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '15px 20px', background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)' }}>
              <span style={{ color: '#e50914', fontWeight: 900, fontSize: '24px' }}>Netflix</span>
              <div style={{ marginLeft: '40px', display: 'flex', gap: '25px', color: '#e5e5e5', fontSize: '14px' }}>
                <span>Home</span><span>Movies</span><span>TV Shows</span>
              </div>
            </div>
            {/* Hero */}
            <div style={{ height: '240px', background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)', display: 'flex', alignItems: 'flex-end', padding: '30px' }}>
              <div>
                <div style={{ background: '#e50914', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', marginBottom: '10px', width: 'fit-content' }}>#5 TRENDING TODAY</div>
                <h1 style={{ color: 'white', fontSize: '32px', fontWeight: 800, margin: '0 0 10px 0' }}>SUHILMANartz CAPITAL</h1>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                   <button style={{ background: '#e50914', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Play</button>
                   <button style={{ background: 'rgba(109,109,110,0.7)', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>My List</button>
                </div>
              </div>
            </div>
            {/* Row */}
            <div style={{ padding: '20px' }}>
               <div style={{ color: 'white', marginBottom: '10px', fontWeight: 'bold' }}>Trending Now</div>
               <div style={{ display: 'flex', gap: '10px' }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{ width: '100px', height: '140px', backgroundColor: '#2a2a2a', borderRadius: '4px', cursor: 'pointer', transition: 'transform 0.3s' }} 
                         onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'} 
                         onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'} />
                  ))}
               </div>
            </div>
          </div>
        </div>
        {/* Base Laptop */}
        <div style={{ position: 'absolute', bottom: '-30px', left: '50%', transform: 'translateX(-50%)', width: '800px', height: '40px', background: 'linear-gradient(180deg, #3a3a3a 0%, #1a1a1a 100%)', borderRadius: '0 0 20px 20px' }} />
      </div>

      {/* IPHONE */}
      <div 
        style={iphoneStyle}
        onMouseEnter={() => setIsIphoneHover(true)}
        onMouseLeave={() => setIsIphoneHover(false)}
      >
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(145deg, #3a3a3a 0%, #1a1a1a 100%)', borderRadius: '30px', padding: '8px', boxShadow: '0 30px 60px rgba(0,0,0,0.7)' }}>
          <div style={{ width: '100%', height: '100%', backgroundColor: '#141414', borderRadius: '22px', overflow: 'hidden', position: 'relative', border: '2px solid black' }}>
            {/* Notch */}
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '80px', height: '18px', backgroundColor: 'black', borderRadius: '0 0 10px 10px', zIndex: 10 }} />
            <div style={{ height: '150px', background: 'linear-gradient(to top, #141414, #1a1a2e)', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
               <span style={{ color: '#e50914', fontWeight: 'bold' }}>N</span>
               <div style={{ color: 'white', fontSize: '12px', fontWeight: 'bold', marginTop: '5px' }}>Peaky Blinders: The Immortal Man</div>
            </div>
            <div style={{ padding: '10px' }}>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                  {[1,2,3,4].map(i => <div key={i} style={{ height: '60px', backgroundColor: '#2a2a2a', borderRadius: '4px' }} />)}
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS untuk Animasi Melayang (Opsional - bisa dihapus jika masih error) */}
      <style>{`
        @keyframes float {
          0%, 100% { margin-top: 0; }
          50% { margin-top: -20px; }
        }
      `}</style>
    </div>
  );
};

export default WeeMoviesShowcase;