import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { observeCanvasSize } from './useCanvasSize';

/**
 * Inspired by cyber-ocean.vercel.app's look — a glowing particle "ocean"
 * surface with a wireframe creature gliding above it, HUD telemetry
 * overlay, drag-to-orbit / scroll-to-zoom. Built from scratch with
 * procedural geometry (no third-party model or audio).
 */
const GRID = 90;
const SPACING = 0.16;

const CyberOcean = () => {
  const mountRef = useRef(null);
  const hudRef = useRef({ depth: null, velocity: null, session: null });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030711, 0.045);

    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
    camera.position.set(0, 3.2, 8);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0.5, 0);
    controls.minDistance = 4;
    controls.maxDistance = 14;
    controls.maxPolarAngle = Math.PI / 2.05;

    // Ocean particle grid
    const oceanPositions = new Float32Array(GRID * GRID * 3);
    const oceanBase = new Float32Array(GRID * GRID * 2);
    let p = 0;
    for (let i = 0; i < GRID; i++) {
      for (let j = 0; j < GRID; j++) {
        const x = (i - GRID / 2) * SPACING;
        const z = (j - GRID / 2) * SPACING;
        oceanPositions[p * 3] = x;
        oceanPositions[p * 3 + 1] = 0;
        oceanPositions[p * 3 + 2] = z;
        oceanBase[p * 2] = x;
        oceanBase[p * 2 + 1] = z;
        p++;
      }
    }
    const oceanGeo = new THREE.BufferGeometry();
    oceanGeo.setAttribute('position', new THREE.BufferAttribute(oceanPositions, 3));
    const oceanMat = new THREE.PointsMaterial({
      color: 0x2fd0ff,
      size: 0.035,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ocean = new THREE.Points(oceanGeo, oceanMat);
    scene.add(ocean);

    // Abstract wireframe "creature": stretched icosahedron with a point halo
    const creatureGeo = new THREE.IcosahedronGeometry(1, 2);
    creatureGeo.scale(1.6, 0.55, 0.6);
    const creatureBase = creatureGeo.attributes.position.array.slice();
    const creatureMat = new THREE.MeshBasicMaterial({
      color: 0x5dd9ff,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
    });
    const creature = new THREE.Mesh(creatureGeo, creatureMat);
    scene.add(creature);

    const haloCount = Math.floor(creatureGeo.attributes.position.count * 0.25);
    const haloIdx = [];
    for (let i = 0; i < creatureGeo.attributes.position.count; i++) {
      if (Math.random() < 0.25) haloIdx.push(i);
    }
    const haloPos = new Float32Array(haloIdx.length * 3);
    const haloGeo = new THREE.BufferGeometry();
    haloGeo.setAttribute('position', new THREE.BufferAttribute(haloPos, 3));
    const haloMat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.05,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const halo = new THREE.Points(haloGeo, haloMat);
    scene.add(halo);
    void haloCount;

    let raf;
    const start = performance.now();
    const animate = () => {
      const t = (performance.now() - start) / 1000;

      // Ocean wave displacement
      const pos = oceanGeo.attributes.position;
      for (let i = 0; i < GRID * GRID; i++) {
        const x = oceanBase[i * 2];
        const z = oceanBase[i * 2 + 1];
        const wave =
          Math.sin(x * 1.1 + t * 1.2) * 0.12 +
          Math.cos(z * 0.9 + t * 0.9) * 0.1;
        pos.array[i * 3 + 1] = wave;
      }
      pos.needsUpdate = true;

      // Creature breathing + swimming path
      const cpos = creatureGeo.attributes.position;
      for (let i = 0; i < creatureBase.length / 3; i++) {
        const ix = i * 3;
        const wobble = 1 + 0.03 * Math.sin(t * 2 + i * 0.3);
        cpos.array[ix] = creatureBase[ix] * wobble;
        cpos.array[ix + 1] = creatureBase[ix + 1] * wobble;
        cpos.array[ix + 2] = creatureBase[ix + 2] * wobble;
      }
      cpos.needsUpdate = true;

      creature.position.set(Math.sin(t * 0.3) * 2, 0.6 + Math.sin(t * 0.8) * 0.3, Math.cos(t * 0.3) * 2);
      creature.rotation.y = -t * 0.3 + Math.PI / 2;

      haloIdx.forEach((vi, i) => {
        haloPos[i * 3] = cpos.array[vi * 3] + creature.position.x;
        haloPos[i * 3 + 1] = cpos.array[vi * 3 + 1] + creature.position.y;
        haloPos[i * 3 + 2] = cpos.array[vi * 3 + 2] + creature.position.z;
      });
      haloGeo.attributes.position.needsUpdate = true;

      const hud = hudRef.current;
      if (hud.depth) hud.depth.textContent = `${(12 + Math.sin(t * 0.4) * 4).toFixed(0)} M`;
      if (hud.velocity) hud.velocity.textContent = `${(2.4 + Math.sin(t * 0.7) * 0.8).toFixed(1)} M/S`;
      if (hud.session) {
        const mins = Math.floor(t / 60).toString().padStart(2, '0');
        const secs = Math.floor(t % 60).toString().padStart(2, '0');
        hud.session.textContent = `${mins}:${secs}`;
      }

      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const stopObserving = observeCanvasSize(mount, (w, h) => {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });

    return () => {
      cancelAnimationFrame(raf);
      stopObserving();
      controls.dispose();
      oceanGeo.dispose();
      oceanMat.dispose();
      creatureGeo.dispose();
      creatureMat.dispose();
      haloGeo.dispose();
      haloMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <Wrap>
      <Canvas ref={mountRef} />
      <HudLeft>
        <HudTitle><Dot /> TELEMETRY</HudTitle>
        <HudRow><label>DEPTH</label><strong ref={(el) => (hudRef.current.depth = el)}>12 M</strong></HudRow>
        <HudRow><label>VELOCITY</label><strong ref={(el) => (hudRef.current.velocity = el)}>2.4 M/S</strong></HudRow>
        <HudRow><label>SESSION</label><strong ref={(el) => (hudRef.current.session = el)}>00:00</strong></HudRow>
      </HudLeft>
      <HudRight>
        <HudTitle><Dot /> CONTROLS</HudTitle>
        <HudRow><label>DRAG</label><span>Orbit</span></HudRow>
        <HudRow><label>SCROLL</label><span>Zoom</span></HudRow>
      </HudRight>
    </Wrap>
  );
};

export default CyberOcean;

const Wrap = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 420px;
`;

const Canvas = styled.div`
  width: 100%;
  height: 100%;
  cursor: grab;
  &:active { cursor: grabbing; }
`;

const hudPanel = `
  position: absolute;
  top: 10px;
  padding: 10px 12px;
  background: rgba(5, 10, 20, 0.55);
  border: 1px solid rgba(93, 217, 255, 0.25);
  border-radius: 10px;
  font-family: var(--font-mono);
  min-width: 128px;
  backdrop-filter: blur(6px);
`;

const HudLeft = styled.div`
  ${hudPanel}
  left: 10px;
`;

const HudRight = styled.div`
  ${hudPanel}
  right: 10px;
  @media (max-width: 560px) { display: none; }
`;

const HudTitle = styled.div`
  display: flex; align-items: center; gap: 6px;
  font-size: 9.5px;
  letter-spacing: 0.14em;
  color: #5dd9ff;
  margin-bottom: 8px;
`;

const Dot = styled.span`
  width: 5px; height: 5px; border-radius: 50%;
  background: #5dd9ff;
  box-shadow: 0 0 8px #5dd9ff;
`;

const HudRow = styled.div`
  display: flex; justify-content: space-between; gap: 10px;
  font-size: 10px;
  color: rgba(232, 233, 243, 0.55);
  margin-bottom: 4px;
  strong { color: #fff; font-weight: 600; }
  span { color: rgba(232, 233, 243, 0.8); }
`;
