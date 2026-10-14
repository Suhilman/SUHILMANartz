import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { observeCanvasSize } from './useCanvasSize';

const HEAD_MODEL_URL = `${process.env.PUBLIC_URL}/models/LeePerrySmith/LeePerrySmith.glb`;
const MATCAP_URL = `${process.env.PUBLIC_URL}/textures/matcaps/matcap-porcelain-white.jpg`;
const NORMAL_MAP_URL = `${process.env.PUBLIC_URL}/textures/normal/Infinite-Level_02_Tangent_SmoothUV.jpg`;

/**
 * Inspired by three.js's "webgl_materials_matcap" and
 * "webgl_materials_normalmap" examples — the same head mesh switches
 * between a MeshMatcapMaterial and a MeshPhongMaterial + normal map,
 * lit by a moving point light so the normal-map relief reads clearly.
 */
const MatcapNormalDemo = () => {
  const mountRef = useRef(null);
  const [mode, setMode] = useState('matcap');
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 9);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enableZoom = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.6;

    const pointLight = new THREE.PointLight(0xffffff, 60, 0, 2);
    pointLight.position.set(3, 2, 6);
    scene.add(pointLight);
    scene.add(new THREE.AmbientLight(0x404050, 1.2));

    let mesh = null;
    let geometry = null;
    let matcapMaterial = null;
    let normalMaterial = null;
    const disposables = [];
    let disposed = false;

    const texLoader = new THREE.TextureLoader();
    const matcapTex = texLoader.load(MATCAP_URL);
    const normalTex = texLoader.load(NORMAL_MAP_URL);
    disposables.push(matcapTex, normalTex);

    const loader = new GLTFLoader();
    loader.load(
      HEAD_MODEL_URL,
      (gltf) => {
        if (disposed) return;
        let headMesh = null;
        gltf.scene.traverse((child) => { if (!headMesh && child.isMesh) headMesh = child; });
        if (!headMesh) return;

        geometry = headMesh.geometry.clone();
        geometry.center();
        geometry.computeBoundingSphere();
        const scale = 2.6 / geometry.boundingSphere.radius;
        geometry.scale(scale, scale, scale);
        if (!geometry.attributes.uv2 && geometry.attributes.uv) {
          geometry.setAttribute('uv2', geometry.attributes.uv);
        }
        disposables.push(geometry);

        matcapMaterial = new THREE.MeshMatcapMaterial({ matcap: matcapTex });
        normalMaterial = new THREE.MeshPhongMaterial({
          specular: 0x111111,
          shininess: 25,
          normalMap: normalTex,
          normalScale: new THREE.Vector2(0.8, 0.8),
          color: 0x8899aa,
        });
        disposables.push(matcapMaterial, normalMaterial);

        mesh = new THREE.Mesh(geometry, modeRef.current === 'matcap' ? matcapMaterial : normalMaterial);
        scene.add(mesh);
      },
      undefined,
      () => {}
    );

    let lastMode = modeRef.current;
    let raf;
    const animate = () => {
      const t = performance.now() / 1000;
      pointLight.position.x = Math.sin(t * 0.6) * 4;
      pointLight.position.y = Math.cos(t * 0.4) * 2.5;

      if (mesh && modeRef.current !== lastMode) {
        lastMode = modeRef.current;
        mesh.material = lastMode === 'matcap' ? matcapMaterial : normalMaterial;
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
      disposed = true;
      cancelAnimationFrame(raf);
      stopObserving();
      controls.dispose();
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <Wrap>
      <Canvas ref={mountRef} />
      <Toolbar>
        <ModeBtn $active={mode === 'matcap'} onClick={() => setMode('matcap')}>Matcap</ModeBtn>
        <ModeBtn $active={mode === 'normal'} onClick={() => setMode('normal')}>Normal Map</ModeBtn>
      </Toolbar>
    </Wrap>
  );
};

export default MatcapNormalDemo;

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

const Toolbar = styled.div`
  position: absolute;
  top: 10px; left: 10px;
  display: flex; gap: 6px;
`;

const ModeBtn = styled.button`
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid ${({ $active }) => ($active ? 'var(--accent-1)' : 'var(--glass-border-strong)')};
  background: ${({ $active }) => ($active ? 'var(--button-background-color)' : 'var(--card-bg-color)')};
  color: ${({ $active }) => ($active ? 'var(--tittle-color)' : 'var(--text-color)')};
  cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: var(--accent-1); color: var(--tittle-color); }
`;
