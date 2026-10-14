import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import * as THREE from 'three';
import { observeCanvasSize } from './useCanvasSize';

const SIZE = 64;
const DEPTH = 32;

/**
 * Inspired by three.js's "webgpu_textures_2d-array" example — a stack of
 * procedurally generated cross-section slices sampled from a single
 * `DataArrayTexture`, rendered with a GLSL3 `sampler2DArray` shader
 * (WebGL2, since WebGPU isn't broadly supported in browsers yet).
 */
const generateVolumeData = () => {
  const data = new Uint8Array(SIZE * SIZE * DEPTH * 4);
  const center = (SIZE - 1) / 2;
  for (let d = 0; d < DEPTH; d++) {
    const depthT = d / (DEPTH - 1); // 0..1
    const radius = Math.sin(depthT * Math.PI) * (SIZE * 0.42) + 2;
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const dx = x - center;
        const dy = y - center;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const ring = Math.abs(Math.sin((dist - radius) * 0.35)) < 0.18 ? 1 : 0;
        const inside = dist < radius ? 1 : 0;
        const intensity = Math.max(ring * 0.9, inside * 0.18);
        const i = (d * SIZE * SIZE + y * SIZE + x) * 4;
        data[i] = 60 + intensity * 40;
        data[i + 1] = 180 + intensity * 70;
        data[i + 2] = 255;
        data[i + 3] = Math.min(255, intensity * 255);
      }
    }
  }
  return data;
};

const VERTEX_SHADER = `
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;
precision highp sampler2DArray;
uniform sampler2DArray map;
uniform float layer;
in vec2 vUv;
out vec4 outColor;
void main() {
  outColor = texture(map, vec3(vUv, layer));
}
`;

const TextureArrayViewer = () => {
  const mountRef = useRef(null);
  const labelRef = useRef(null);
  const [stacked, setStacked] = useState(true);
  const stackedRef = useRef(stacked);
  stackedRef.current = stacked;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 6);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const texture = new THREE.DataArrayTexture(generateVolumeData(), SIZE, SIZE, DEPTH);
    texture.format = THREE.RGBAFormat;
    texture.type = THREE.UnsignedByteType;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;

    const group = new THREE.Group();
    scene.add(group);

    const planeGeo = new THREE.PlaneGeometry(2.4, 2.4);
    const sliceCount = 16;
    const slices = [];
    for (let i = 0; i < sliceCount; i++) {
      const layerIndex = Math.floor((i / (sliceCount - 1)) * (DEPTH - 1));
      const material = new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        uniforms: {
          map: { value: texture },
          layer: { value: layerIndex },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(planeGeo, material);
      mesh.position.z = (i - sliceCount / 2) * 0.16;
      group.add(mesh);
      slices.push(mesh);
    }

    let raf;
    const animate = () => {
      const t = performance.now() / 1000;
      group.rotation.y = t * 0.3;

      if (stackedRef.current) {
        slices.forEach((m, i) => { m.position.z = (i - sliceCount / 2) * 0.16; });
      } else {
        const spread = 0.16 + Math.sin(t * 0.6) * 0.1 + 0.3;
        slices.forEach((m, i) => { m.position.z = (i - sliceCount / 2) * spread; });
      }

      const cycleLayer = Math.floor(t * 8) % DEPTH;
      if (labelRef.current) labelRef.current.textContent = `LAYER ${String(cycleLayer).padStart(2, '0')} / ${DEPTH - 1}`;

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
      planeGeo.dispose();
      slices.forEach((m) => m.material.dispose());
      texture.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <Wrap>
      <Canvas ref={mountRef} />
      <HUD>
        <span ref={labelRef}>LAYER 00 / {DEPTH - 1}</span>
        <ToggleBtn onClick={() => setStacked((s) => !s)}>
          {stacked ? 'EXPLODE VIEW' : 'STACK VIEW'}
        </ToggleBtn>
      </HUD>
    </Wrap>
  );
};

export default TextureArrayViewer;

const Wrap = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 420px;
`;

const Canvas = styled.div`
  width: 100%;
  height: 100%;
`;

const HUD = styled.div`
  position: absolute;
  top: 10px; left: 10px;
  display: flex; align-items: center; gap: 10px;
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.08em;
  color: var(--tittle-color);
`;

const ToggleBtn = styled.button`
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.05em;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--glass-border-strong);
  background: var(--card-bg-color);
  color: var(--text-color);
  cursor: pointer;
  &:hover { border-color: var(--accent-1); color: var(--tittle-color); }
`;
