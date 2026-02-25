import React, { useLayoutEffect } from 'react';

const DonutLoader = () => {
  const content = "SUHILMANartz";
  const contentToShow = (content + content).split("");
  const lettersCount = contentToShow.length;
  const slicesCount = lettersCount * 2;
  const donutSize = 300; 

  useLayoutEffect(() => {
    try {
      window.CSS.registerProperty({
        name: '--progress',
        syntax: '<angle>',
        inherits: false,
        initialValue: '0deg',
      });
    } catch (e) {
      // Properti mungkin sudah terdaftar
    }
  }, []);

  return (
    <div className="donut-wrapper">
      <style>
        {`
          .donut-wrapper {
            margin: 0;
            
            min-height: 100vh;
            width: 90%;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
          }

          .donut {
            --radius: calc(var(--donut-size) / 2);
            position: relative;
            width: var(--donut-size);
            height: var(--donut-size);
            display: flex;
            justify-content: center;
            align-items: center;

            /* EFEK CAHAYA UTAMA */
            /* Membuat pendaran merah-hitam melingkar yang halus */
            border-radius: 50%;
            box-shadow: 
                0 0 10px 0px rgba(255, 255, 255, 0.2),               /* Inti Putih */
                0 0 10px 10px rgba(64, 62, 62, 0.1),               /* Lapisan Abu */
                0 0 50px 100px rgba(229, 9, 20, 0.6),         /* MERAH LUAS: Blur 250px, Spread 100px */
                0 0 400px 150px rgba(229, 9, 20, 0.2);
            
            /* Animasi Cahaya Bernapas */
            animation: pulse-glow 4s ease-in-out infinite;
          }

          @keyframes pulse-glow {
            0%, 100% {
              box-shadow: 
                0 0 10px 20px rgba(255, 255, 255, 0.1),               /* Inti Putih */
                0 0 100px 10px rgba(64, 62, 62, 0.1),                 /* Lapisan Abu */
                0 0 250px 120px rgba(229, 9, 20, 0.8),         /* MERAH LUAS: Blur 250px, Spread 100px */
                0 0 400px 150px rgba(229, 9, 20, 0.2);
            }
            50% {
              box-shadow: 
                0 0 10px 0px rgba(255, 255, 255, 0.2),               /* Inti Putih */
                0 0 10px 10px rgba(64, 62, 62, 0.1),                 /* Lapisan Abu */
                0 0 250px 100px rgba(229, 9, 20, 0.6),         /* MERAH LUAS: Blur 250px, Spread 100px */
                0 0 400px 150px rgba(229, 9, 20, 0.2);
            }
          }

          .donut__slice {
            --angle: calc(360deg / var(--slices) * var(--slice-i) - 90deg);
            position: absolute;
            top: 50%;
            left: 50%;
            transform-origin: 0 0;
            transform: rotate(var(--angle)) translate(var(--radius)) rotate(90deg);
          }

          .donut__inner-circle {
            --radius-x: calc(var(--radius) / 2.3);
            --radius-y: calc(var(--radius-x) * 1.5);
            position: absolute;
            top: 50%;
            right: 50%;
            transform: translate(50%, -50%);
            width: calc(var(--radius-x) * 2);
            height: calc(var(--radius-y) * 2);
          }

          .donut__letter {
            --base-angle: calc(360deg / var(--letters) * var(--letter-i));
            --angle: calc(var(--base-angle) + var(--progress));
            --speed: calc(var(--letters) / 1.5 * 1s);

            --raw_phase: calc((sin(var(--angle) + 90deg) + 1) / 1.8);
            --phase: calc(var(--raw_phase) * var(--raw_phase));

            position: absolute;
            top: 50%;
            left: 50%;
            font-size: calc((var(--radius) / 100) * 2px + var(--phase) * (var(--radius) / 12 * 1px));
            font-weight: 600;
            text-transform: uppercase;
            white-space: nowrap;
            will-change: transform, font-size, color;

            /* Warna huruf yang terpengaruh cahaya merah */
            color: color-mix(
              in srgb,
              transparent calc((1 - var(--phase)) * 100%),
              #ffffff calc(var(--phase) * 100%)
            );

            /* Efek glow pada teks itu sendiri agar lebih "nyala" */
            text-shadow: 0 0 8px rgba(229, 9, 20, calc(var(--phase) * 0.8));

            transform: translate(-50%, -50%)
              translate(
                calc(cos(var(--angle)) * var(--radius-x)),
                calc(sin(var(--angle)) * var(--radius-y))
              );

            animation: orbit var(--speed) linear infinite;
          }

          @keyframes orbit {
            from { --progress: 0deg; }
            to { --progress: 360deg; }
          }
        `}
      </style>

      <div 
        className="donut" 
        style={{ 
          '--slices': slicesCount, 
          '--letters': lettersCount,
          '--donut-size': `${donutSize}px`
        }}
      >
        {[...Array(slicesCount)].map((_, sliceI) => (
          <div 
            key={`slice-${sliceI}`} 
            className="donut__slice" 
            style={{ '--slice-i': sliceI }}
          >
            <div className="donut__inner-circle">
              {contentToShow.map((letter, letterI) => (
                <div
                  key={`letter-${sliceI}-${letterI}`}
                  className="donut__letter"
                  style={{ '--letter-i': letterI }}
                >
                  {letter}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DonutLoader;