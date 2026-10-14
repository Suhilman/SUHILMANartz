import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { observeCanvasSize } from './useCanvasSize';

/**
 * Inspired by three.js's "webgl_lights_spotlight" example: a moving,
 * shadow-casting SpotLight sweeping over a floor and a few objects.
 */
const SpotlightDemo = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 3.2, 7.5);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enableZoom = false;
    controls.target.set(0, 0.5, 0);
    controls.maxPolarAngle = Math.PI / 2.1;

    scene.add(new THREE.AmbientLight(0x202030, 1));

    const spot = new THREE.SpotLight(0x5dd9ff, 220, 18, Math.PI / 7, 0.4, 1.2);
    spot.position.set(0, 5, 0);
    spot.castShadow = true;
    spot.shadow.mapSize.set(1024, 1024);
    spot.shadow.camera.near = 1;
    spot.shadow.camera.far = 12;
    scene.add(spot);
    scene.add(spot.target);

    const spotHelperCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.05, 0.3, 16),
      new THREE.MeshBasicMaterial({ color: 0x5dd9ff })
    );
    spotHelperCone.position.copy(spot.position);
    scene.add(spotHelperCone);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 14),
      new THREE.MeshStandardMaterial({ color: 0x0a0d16, roughness: 0.9, metalness: 0.1 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const objectsGroup = new THREE.Group();
    scene.add(objectsGroup);

    const geoms = [
      new THREE.TorusKnotGeometry(0.55, 0.18, 120, 16),
      new THREE.IcosahedronGeometry(0.7, 0),
      new THREE.BoxGeometry(1, 1, 1),
    ];
    const positions = [[-2.2, 0.8, 0], [0, 0.9, 0], [2.2, 0.7, 0]];
    geoms.forEach((geo, i) => {
      const mat = new THREE.MeshStandardMaterial({ color: 0xb14aff, roughness: 0.35, metalness: 0.4 });
      const m = new THREE.Mesh(geo, mat);
      m.position.set(...positions[i]);
      m.castShadow = true;
      m.receiveShadow = true;
      objectsGroup.add(m);
    });

    let raf;
    const animate = () => {
      const t = performance.now() / 1000;
      spot.position.x = Math.sin(t * 0.5) * 3.2;
      spot.position.z = Math.cos(t * 0.5) * 3.2;
      spotHelperCone.position.copy(spot.position);
      spot.target.position.set(Math.sin(t * 0.5) * 1.2, 0, Math.cos(t * 0.5) * 1.2);

      objectsGroup.children.forEach((m, i) => {
        m.rotation.y = t * (0.4 + i * 0.15);
        m.rotation.x = t * 0.2;
      });

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
      floor.geometry.dispose();
      floor.material.dispose();
      geoms.forEach((g) => g.dispose());
      objectsGroup.children.forEach((m) => m.material.dispose());
      spotHelperCone.geometry.dispose();
      spotHelperCone.material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <Canvas ref={mountRef} />;
};

export default SpotlightDemo;

const Canvas = styled.div`
  width: 100%;
  height: 100%;
  min-height: 420px;
  cursor: grab;
  &:active { cursor: grabbing; }
`;
