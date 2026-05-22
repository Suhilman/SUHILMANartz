import React, { useEffect, useRef, useState } from "react";
import * as createjs from "createjs-module";

const Car360Viewer = () => {
  const canvasRef = useRef(null);
  const [selectedShoe, setSelectedShoe] = useState("Air-Jordan-5-Retro-International-Flight");
  const [isLoading, setIsLoading] = useState(true);
  const [showHint, setShowHint] = useState(false); // State untuk ikon swipe
  const [progress, setProgress] = useState(0);

  const stageRef = useRef(null);
  const bmpRef = useRef(null);
  const imagesRef = useRef([]);
  const currentFrameRef = useRef(0);
  const startXRef = useRef(null);
  const rotateIntervalRef = useRef(null);

  const totalFrames = 35;

  const shoes = {
    "Air-Jordan-5-Retro-International-Flight": {
      name: "Air Jordan 5 Retro",
      imgBaseUrl: "https://images.stockx.com/360/Air-Jordan-5-Retro-International-Flight/Images/Air-Jordan-5-Retro-International-Flight/Lv2/img",
    },
    "Air-Jordan-11-Retro-Pantone": {
      name: "Air Jordan 11 Retro Pantone",
      imgBaseUrl: "https://images.stockx.com/360/Air-Jordan-11-Retro-Pantone/Images/Air-Jordan-11-Retro-Pantone/Lv2/img",
    },
    "adidas-Handball-Spezial-Shadow-Red-Womens": {
      name: "Adidas Handball Spezial",
      imgBaseUrl: "https://images.stockx.com/360/adidas-Handball-Spezial-Shadow-Red-Womens/Images/adidas-Handball-Spezial-Shadow-Red-Womens/Lv2/img",
    },
    "Nike-Air-Force-1-Low-Drake-Certified-Lover-Boy": {
      name: "Nike Air Force 1 Drake",
      imgBaseUrl: "https://images.stockx.com/360/Nike-Air-Force-1-Low-Drake-Certified-Lover-Boy/Images/Nike-Air-Force-1-Low-Drake-Certified-Lover-Boy/Lv2/img",
    },
    "Air-Jordan-1-Low-Black-Toe": {
      name: "Air Jordan 1 Low Black Toe",
      imgBaseUrl: "https://images.stockx.com/360/Air-Jordan-1-Low-Black-Toe/Images/Air-Jordan-1-Low-Black-Toe/Lv2/img",
    },
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsLoading(true);
    setShowHint(false);
    setProgress(0);
    imagesRef.current = [];
    currentFrameRef.current = 0;
    if (rotateIntervalRef.current) clearInterval(rotateIntervalRef.current);

    const stage = new createjs.Stage(canvas);
    stageRef.current = stage;
    createjs.Touch.enable(stage);
    stage.enableMouseOver(true);
    stage.mouseMoveOutside = true;

    const bmp = new createjs.Bitmap();
    bmpRef.current = bmp;
    stage.addChild(bmp);

    const imgList = Array.from({ length: totalFrames }, (_, i) => {
      const imgNumber = (i + 1).toString().padStart(2, "0");
      return `${shoes[selectedShoe].imgBaseUrl}${imgNumber}.jpg`;
    });

    const loadImages = async () => {
      let loadedCount = 0;
      const promises = imgList.map((src, index) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.src = src;
          img.onload = () => {
            imagesRef.current[index] = img;
            loadedCount++;
            setProgress(Math.round((loadedCount / totalFrames) * 100));
            resolve();
          };
          img.onerror = resolve;
        });
      });

      await Promise.all(promises);
      setIsLoading(false);
      startIntroRotation();
    };

    loadImages();

    const tickListener = createjs.Ticker.on("tick", () => stage.update());
    createjs.Ticker.setFPS(60);

    return () => {
      createjs.Ticker.off("tick", tickListener);
      if (rotateIntervalRef.current) clearInterval(rotateIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShoe]);

  const update360 = (dir) => {
    let nextFrame = currentFrameRef.current + dir;
    if (nextFrame < 0) nextFrame = totalFrames - 1;
    if (nextFrame >= totalFrames) nextFrame = 0;

    currentFrameRef.current = nextFrame;
    const img = imagesRef.current[nextFrame];
    if (img && bmpRef.current) {
      bmpRef.current.image = img;
      const scale = canvasRef.current.width / img.width;
      bmpRef.current.scaleX = bmpRef.current.scaleY = scale;
    }
  };

  const startIntroRotation = () => {
    if (rotateIntervalRef.current) clearInterval(rotateIntervalRef.current);

    rotateIntervalRef.current = setInterval(() => {
      if (currentFrameRef.current >= totalFrames - 1) {
        clearInterval(rotateIntervalRef.current);
        rotateIntervalRef.current = null;
        setShowHint(true); // Tampilkan ikon hint setelah putaran intro selesai
        addInteractions();
        return;
      }
      update360(1);
    }, 30);
  };

  const addInteractions = () => {
    const stage = stageRef.current;
    stage.on("stagemousedown", (e) => {
      startXRef.current = e.rawX;
      setShowHint(false); // Sembunyikan ikon saat user mulai drag
      document.body.style.cursor = "grabbing";
    });

    stage.on("stagemousemove", (e) => {
      if (startXRef.current === null) return;
      const dx = e.rawX - startXRef.current;
      if (Math.abs(dx) > 7) {
        update360(dx > 0 ? -1 : 1);
        startXRef.current = e.rawX;
      }
    });

    stage.on("stagemouseup", () => {
      startXRef.current = null;
      document.body.style.cursor = "default";
    });
  };

  return (
    <div className="container">
      <div className="viewer-wrapper">
        {isLoading && (
          <div className="loader-overlay">
            <div className="spinner"></div>
            <p>{progress}%</p>
          </div>
        )}

        {/* Ikon Hint Swipe */}
        {showHint && !isLoading && (
          <div className="swipe-hint">
            <svg viewBox="0 0 24 24" width="60" height="60" fill="white">
              <path fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7.367 12.171L9.501 14V4.25a1.75 1.75 0 1 1 3.5 0V9.5l2.988.478c1.929.289 2.893.434 3.572.84c1.122.673 1.935 1.682 1.935 3.156c0 1.026-.254 1.715-.87 3.565c-.392 1.174-.587 1.76-.906 2.225a4 4 0 0 1-2.192 1.58c-.542.156-1.16.156-2.398.156h-1.05c-1.644 0-2.467 0-3.2-.302a4 4 0 0 1-.384-.183C9.8 20.637 9.281 20 8.244 18.722l-3.358-4.134a1.74 1.74 0 0 1 2.481-2.417M20 4.5h-4m4 0c0 .56-1.494 1.607-2 2m2-2c0-.56-1.494-1.607-2-2m-15.5 2h4m-4 0c0-.56 1.494-1.607 2-2m-2 2c0 .56 1.494 1.607 2 2" />
            </svg>
          </div>
        )}

        <canvas ref={canvasRef} width="700" height="500"></canvas>
      </div>

      <div className="tabs">
        {Object.keys(shoes).map((key) => (
          <button
            key={key}
            className={`tab ${selectedShoe === key ? "active" : ""}`}
            onClick={() => setSelectedShoe(key)}
          >
            <img src={`${shoes[key].imgBaseUrl}01.jpg`} alt={shoes[key].name} />
          </button>
        ))}
      </div>

      <style jsx>{`
        .container { display: flex; flex-direction: column; align-items: center; }
        .viewer-wrapper { position: relative; background: #fff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); overflow: hidden; }
        canvas { max-width: 100%; height: auto; display: block; cursor: grab; }
        
        /* Hint Swipe Animation */
        .swipe-hint {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 5;
          background: rgba(0,0,0,0.3);
          padding: 20px;
          border-radius: 50%;
          pointer-events: none;
          animation: side-to-side 2s ease-in-out infinite;
        }

        @keyframes side-to-side {
          0%, 100% { transform: translate(-70%, -50%); opacity: 0.8; }
          50% { transform: translate(-30%, -50%); opacity: 0.5; }
        }

        .loader-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.8); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; }
        .spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #333; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        
        .tabs { display: flex; gap: 12px; margin-top: 20px; }
        .tab { border: 2px solid transparent; background: none; cursor: pointer; border-radius: 8px; transition: 0.3s; }
        .tab.active { border-color: #000; }
        .tab img { width: 60px; height: 60px; object-fit: contain; }
      `}</style>
    </div>
  );
};

export default Car360Viewer;