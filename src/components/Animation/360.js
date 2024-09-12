import React, { useEffect, useRef, useState } from "react";
import * as createjs from "createjs-module";

const Car360Viewer = () => {
  const canvasRef = useRef(null);
  let stage = null;
  let bmp = null;
  let bg = null;
  let rotate360Interval = null;
  let start_x = null;

  const [selectedShoe, setSelectedShoe] = useState("Air-Jordan-5-Retro-International-Flight");

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

  const totalFrames = 35;
  const imgList = [];

  for (let i = 1; i <= totalFrames; i++) {
    const imgNumber = i.toString().padStart(2, "0");
    imgList.push(`${shoes[selectedShoe].imgBaseUrl}${imgNumber}.jpg`);
  }

  const images = [];
  let loaded = 0;
  let currentFrame = 0;

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || !canvas.getContext) return;

    // Initialize the canvas stage
    stage = new createjs.Stage(canvas);
    stage.enableMouseOver(true);
    stage.mouseMoveOutside = true;
    createjs.Touch.enable(stage);

    bg = new createjs.Shape();
    stage.addChild(bg);

    bmp = new createjs.Bitmap();
    stage.addChild(bmp);

    document.body.style.cursor = "progress";

    load360Image(); // Start loading images

    createjs.Ticker.addEventListener("tick", handleTick);
    createjs.Ticker.setFPS(24);
    createjs.Ticker.useRAF = true;

    // Cleanup on unmount
    return () => {
      clearInterval(rotate360Interval);
      createjs.Ticker.removeEventListener("tick", handleTick);
    };
  }, [selectedShoe]); // Reload when selected shoe changes

  function load360Image() {
    const img = new Image();
    img.src = imgList[loaded];
    img.onload = img360Loaded;
    images[loaded] = img;
  }

  function img360Loaded() {
    loaded++;
    bg.graphics
      .clear()
      .beginFill("#fff")
      .drawRect(
        0,
        0,
        (canvasRef.current.width * loaded) / totalFrames,
        canvasRef.current.height
      )
      .endFill();

    if (loaded === totalFrames) start360();
    else load360Image();
  }

  function start360() {
    document.body.style.cursor = "none";

    update360(0);

    rotate360Interval = setInterval(() => {
      if (currentFrame === totalFrames - 1) {
        clearInterval(rotate360Interval);
        addNavigation();
      }
      update360(1);
    }, 25);
  }

  function update360(dir) {
    currentFrame += dir;
    if (currentFrame < 0) currentFrame = totalFrames - 1;
    else if (currentFrame >= totalFrames) currentFrame = 0;

    // Responsively adjust image size
    bmp.image = images[currentFrame];
    bmp.scaleX = bmp.scaleY = canvasRef.current.width / bmp.image.width; // Scale the image to fit the canvas width
  }

  function addNavigation() {
    stage.on("stagemousedown", mousePressed);
    stage.on("stagemousemove", mouseMoved);
    stage.on("stagemouseup", mouseUp);
    document.body.style.cursor = "auto";
  }

  function mousePressed(event) {
    start_x = event.rawX;
    document.body.style.cursor = "w-resize";
  }

  function mouseMoved(event) {
    if (start_x === null) return;

    const dx = event.rawX - start_x;
    const abs_dx = Math.abs(dx);

    if (abs_dx > 5) {
      update360(dx / abs_dx);
      start_x = event.rawX;
    }
  }

  function mouseUp() {
    start_x = null;
    document.body.style.cursor = "pointer";
  }

  function handleTick() {
    stage.update();
  }

  return (
    <div className="canvas-container">
     
      <canvas id="360viewer" ref={canvasRef} width="700px" height="500px"></canvas>
      <div className="tabs">
        {Object.keys(shoes).map((key) => (
          <div
            key={key}
            className={`tab ${selectedShoe === key ? "active" : ""}`}
            onClick={() => setSelectedShoe(key)}
          >
            <img
              src={`${shoes[key].imgBaseUrl}01.jpg`}
              alt={shoes[key].name}
              className="tab-image"
            />
          </div>
        ))}
      </div>
      <style jsx>{`
        .canvas-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 100%;
          transform: scale(0.9);
        }

        .tabs {
          display: flex;
          justify-content: center;
          margin-bottom: 10px;
        }

        .tab {
          margin-right: 10px;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .tab:hover {
          transform: scale(1.1);
        }

        .tab.active {
          border: 2px solid #000;
        }

        .tab-image {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 8px;
        }

        @media (max-width: 768px) {
          canvas {
            width: 100% !important;
            height: auto !important;
          }
          .tab-image {
            width: 50px;
            height: 50px;
          }
        }
      `}</style>
    </div>
  );
};

export default Car360Viewer;
