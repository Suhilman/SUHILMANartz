import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const HEAD_MODEL_URL = `${process.env.PUBLIC_URL}/models/LeePerrySmith/LeePerrySmith.glb`;

/**
 * Face/head wireframe scan — loads the open-licensed "Lee Perry-Smith"
 * head scan (CC-BY 3.0, used in three.js's own official examples) and
 * renders it as a wireframe with a sparse glowing node overlay, slowly
 * rotating, evoking a biometric scan visual.
 */
const ScanMesh = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100);
    camera.position.set(0, 0, 11);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.background = 'transparent';
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    let raf;
    let disposed = false;
    let geometry = null;
    let basePositions = null;
    let vertexCount = 0;
    let wireMesh = null;
    let nodes = null;
    const disposables = [];

    const loader = new GLTFLoader();
    loader.load(
      HEAD_MODEL_URL,
      (gltf) => {
        if (disposed) return;

        let headMesh = null;
        gltf.scene.traverse((child) => {
          if (!headMesh && child.isMesh) headMesh = child;
        });
        if (!headMesh) return;

        geometry = headMesh.geometry.clone();
        geometry.center();
        geometry.computeBoundingSphere();

        // Fit the model inside the camera's visible frustum (with margin)
        // instead of a fixed size — otherwise it can poke past the canvas
        // edges and look cropped at certain rotation angles.
        const distance = camera.position.z;
        const visibleHalfHeight = distance * Math.tan((camera.fov * Math.PI) / 360);
        const visibleHalfWidth = visibleHalfHeight * camera.aspect;
        const fitRadius = Math.min(visibleHalfHeight, visibleHalfWidth) * 0.9;
        const scale = fitRadius / geometry.boundingSphere.radius;
        geometry.scale(scale, scale, scale);
        disposables.push(geometry);

        basePositions = geometry.attributes.position.array.slice();
        vertexCount = geometry.attributes.position.count;

        const wireMaterial = new THREE.MeshBasicMaterial({
          color: 0x5dd9ff,
          wireframe: true,
          transparent: true,
          opacity: 0.4,
        });
        disposables.push(wireMaterial);
        wireMesh = new THREE.Mesh(geometry, wireMaterial);
        group.add(wireMesh);

        // Sparse glowing nodes at a subset of vertices
        const nodeIndices = [];
        for (let i = 0; i < vertexCount; i++) {
          if (Math.random() < 0.02) nodeIndices.push(i);
        }
        const nodePositions = new Float32Array(nodeIndices.length * 3);
        nodeIndices.forEach((vi, i) => {
          nodePositions[i * 3] = basePositions[vi * 3];
          nodePositions[i * 3 + 1] = basePositions[vi * 3 + 1];
          nodePositions[i * 3 + 2] = basePositions[vi * 3 + 2];
        });
        const nodeGeometry = new THREE.BufferGeometry();
        nodeGeometry.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3));
        disposables.push(nodeGeometry);
        const nodeMaterial = new THREE.PointsMaterial({
          color: 0x00f0ff,
          size: 0.075,
          transparent: true,
          opacity: 0.95,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        disposables.push(nodeMaterial);
        nodes = new THREE.Points(nodeGeometry, nodeMaterial);
        group.add(nodes);
      },
      undefined,
      () => {
        // Silently ignore load failures — splash still shows the rest of the UI.
      }
    );

    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();

      if (geometry) {
        const pos = geometry.attributes.position;
        for (let i = 0; i < vertexCount; i++) {
          const ix = i * 3;
          const nx = basePositions[ix];
          const ny = basePositions[ix + 1];
          const nz = basePositions[ix + 2];
          const wave = 1 + 0.006 * Math.sin(t * 1.4 + (nx + ny + nz) * 2.2);
          pos.array[ix] = nx * wave;
          pos.array[ix + 1] = ny * wave;
          pos.array[ix + 2] = nz * wave;
        }
        pos.needsUpdate = true;
      }

      group.rotation.y = Math.sin(t * 0.25) * 0.5 + t * 0.15;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', handleResize);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
};

export default ScanMesh;
