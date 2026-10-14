import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { observeCanvasSize } from './useCanvasSize';

/**
 * Inspired by three.js's "webgl_materials_wireframe" example: geometric
 * solids rendered purely as wireframes, with a few swappable shapes.
 */
const SHAPES = {
  torusKnot: () => new THREE.TorusKnotGeometry(1.1, 0.35, 160, 20),
  icosahedron: () => new THREE.IcosahedronGeometry(1.6, 2),
  dodecahedron: () => new THREE.DodecahedronGeometry(1.7, 0),
  torus: () => new THREE.TorusGeometry(1.4, 0.5, 24, 100),
};

const WireframeShapes = () => {
  const mountRef = useRef(null);
  const [shape, setShape] = useState('torusKnot');
  const shapeRef = useRef(shape);
  shapeRef.current = shape;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 5.5);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enableZoom = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.2;

    let currentGeometry = null;
    let mesh = null;

    const buildMesh = (key) => {
      if (mesh) {
        scene.remove(mesh);
        currentGeometry.dispose();
      }
      currentGeometry = SHAPES[key]();
      const material = new THREE.MeshBasicMaterial({
        color: 0x5dd9ff,
        wireframe: true,
      });
      mesh = new THREE.Mesh(currentGeometry, material);
      scene.add(mesh);
    };
    buildMesh(shapeRef.current);

    let lastShape = shapeRef.current;
    let raf;
    const animate = () => {
      if (shapeRef.current !== lastShape) {
        lastShape = shapeRef.current;
        buildMesh(lastShape);
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
      if (currentGeometry) currentGeometry.dispose();
      if (mesh) mesh.material.dispose();
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
        {Object.keys(SHAPES).map((key) => (
          <ShapeBtn key={key} $active={shape === key} onClick={() => setShape(key)}>
            {key}
          </ShapeBtn>
        ))}
      </Toolbar>
    </Wrap>
  );
};

export default WireframeShapes;

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
  display: flex; flex-wrap: wrap; gap: 6px;
`;

const ShapeBtn = styled.button`
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid ${({ $active }) => ($active ? 'var(--accent-1)' : 'var(--glass-border-strong)')};
  background: ${({ $active }) => ($active ? 'var(--button-background-color)' : 'var(--card-bg-color)')};
  color: ${({ $active }) => ($active ? 'var(--tittle-color)' : 'var(--text-color)')};
  cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: var(--accent-1); color: var(--tittle-color); }
`;
