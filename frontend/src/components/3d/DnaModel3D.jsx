import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * ============================================================================
 * HELIO 3D DNA MODEL (Three.js High-Performance Double Helix)
 * ============================================================================
 * 
 * Features:
 * - Authentic 3D double helix architecture with antiparallel sugar-phosphate backbones
 * - Complementary nucleotide base pair rungs (A-T / C-G) with color-coded nodes
 * - Bioluminescent glow materials (Ultraviolet #8B5CF6 and Cyan #06B6D4)
 * - Multi-point cinematic 3D lighting with depth attenuation
 * - Ambient floating bio-particle field
 * - Interactive mouse parallax with smooth damping
 * - Fully responsive with GPU resource cleanup
 */
export function DnaModel3D({ style = {} }) {  
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || 700;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x08080F, 0.012);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 48);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // Transparent background
    container.appendChild(renderer.domElement);

    // 3. Lighting System
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const purpleLight = new THREE.PointLight(0x8B5CF6, 3.5, 60);
    purpleLight.position.set(-15, 20, 20);
    scene.add(purpleLight);

    const cyanLight = new THREE.PointLight(0x06B6D4, 3.5, 60);
    cyanLight.position.set(15, -20, 20);
    scene.add(cyanLight);

    const mintLight = new THREE.PointLight(0x10B981, 2.0, 50);
    mintLight.position.set(0, 0, 25);
    scene.add(mintLight);

    // 4. DNA Model Construction
    const dnaGroup = new THREE.Group();
    scene.add(dnaGroup);

    // Parameters for authentic double helix
    const numPairs = 48; // Total base pairs along the strand
    const radius = 6.2;  // Helix cylinder radius
    const heightStep = 1.05; // Vertical distance per base pair
    const turns = 3.8;   // Number of full 360° revolutions
    const totalAngle = turns * Math.PI * 2;
    const angleStep = totalAngle / numPairs;

    const strand1Points = [];
    const strand2Points = [];

    // Shared Geometries & Materials for efficiency
    const sphereGeo = new THREE.SphereGeometry(0.55, 16, 16);
    const rungHalfGeo = new THREE.CylinderGeometry(0.16, 0.16, 1, 12);
    const centerNodeGeo = new THREE.SphereGeometry(0.35, 12, 12);

    // Materials
    const matStrand1 = new THREE.MeshStandardMaterial({
      color: 0x8B5CF6,
      emissive: 0x6D28D9,
      emissiveIntensity: 0.65,
      roughness: 0.25,
      metalness: 0.6,
    });

    const matStrand2 = new THREE.MeshStandardMaterial({
      color: 0x06B6D4,
      emissive: 0x0891B2,
      emissiveIntensity: 0.65,
      roughness: 0.25,
      metalness: 0.6,
    });

    const matRungA = new THREE.MeshStandardMaterial({
      color: 0xA78BFA,
      emissive: 0x7C3AED,
      emissiveIntensity: 0.45,
      roughness: 0.3,
      metalness: 0.4,
    });

    const matRungB = new THREE.MeshStandardMaterial({
      color: 0x22D3EE,
      emissive: 0x06B6D4,
      emissiveIntensity: 0.45,
      roughness: 0.3,
      metalness: 0.4,
    });

    const matCenter = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      emissive: 0x10B981,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8,
    });

    const startY = -(numPairs * heightStep) / 2;

    for (let i = 0; i < numPairs; i++) {
      const angle = i * angleStep;
      const y = startY + i * heightStep;

      // Strand 1 node position
      const x1 = Math.cos(angle) * radius;
      const z1 = Math.sin(angle) * radius;
      const pos1 = new THREE.Vector3(x1, y, z1);
      strand1Points.push(pos1);

      // Strand 2 node position (180 degrees offset)
      const x2 = Math.cos(angle + Math.PI) * radius;
      const z2 = Math.sin(angle + Math.PI) * radius;
      const pos2 = new THREE.Vector3(x2, y, z2);
      strand2Points.push(pos2);

      // Sugar-phosphate backbone sphere nodes
      const node1 = new THREE.Mesh(sphereGeo, matStrand1);
      node1.position.copy(pos1);
      dnaGroup.add(node1);

      const node2 = new THREE.Mesh(sphereGeo, matStrand2);
      node2.position.copy(pos2);
      dnaGroup.add(node2);

      // Base Pair Horizontal Rungs (Divided into two halves: Strand1 to Center, Center to Strand2)
      const centerPos = new THREE.Vector3(0, y, 0);

      // Half 1: Strand 1 to Center
      const half1Len = pos1.distanceTo(centerPos);
      const half1Mesh = new THREE.Mesh(rungHalfGeo, i % 2 === 0 ? matRungA : matRungB);
      half1Mesh.scale.set(1, half1Len, 1);
      half1Mesh.position.copy(pos1).add(centerPos).multiplyScalar(0.5);
      half1Mesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3().subVectors(centerPos, pos1).normalize()
      );
      dnaGroup.add(half1Mesh);

      // Half 2: Center to Strand 2
      const half2Len = centerPos.distanceTo(pos2);
      const half2Mesh = new THREE.Mesh(rungHalfGeo, i % 2 === 0 ? matRungB : matRungA);
      half2Mesh.scale.set(1, half2Len, 1);
      half2Mesh.position.copy(centerPos).add(pos2).multiplyScalar(0.5);
      half2Mesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3().subVectors(pos2, centerPos).normalize()
      );
      dnaGroup.add(half2Mesh);

      // Hydrogen Bond Center Node
      const centerNode = new THREE.Mesh(centerNodeGeo, matCenter);
      centerNode.position.copy(centerPos);
      dnaGroup.add(centerNode);
    }

    // Continuous Helical Tubes for both strands
    const curve1 = new THREE.CatmullRomCurve3(strand1Points);
    const tubeGeo1 = new THREE.TubeGeometry(curve1, numPairs * 4, 0.22, 10, false);
    const tubeMesh1 = new THREE.Mesh(tubeGeo1, matStrand1);
    dnaGroup.add(tubeMesh1);

    const curve2 = new THREE.CatmullRomCurve3(strand2Points);
    const tubeGeo2 = new THREE.TubeGeometry(curve2, numPairs * 4, 0.22, 10, false);
    const tubeMesh2 = new THREE.Mesh(tubeGeo2, matStrand2);
    dnaGroup.add(tubeMesh2);

    // Initial orientation: angled slightly across the viewport for dynamic 3D posture
    dnaGroup.rotation.z = -0.22;
    dnaGroup.rotation.x = 0.12;
    dnaGroup.position.set(2, 0, -2); // Centered nicely behind the hero text

    // 5. Floating Ambient Bio-Particles
    const particleCount = 180;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const colorViolet = new THREE.Color(0x8B5CF6);
    const colorCyan = new THREE.Color(0x06B6D4);
    const colorMint = new THREE.Color(0x10B981);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 65;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 65;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 45;

      const pickColor = Math.random() > 0.6 ? colorViolet : Math.random() > 0.3 ? colorCyan : colorMint;
      particleColors[i * 3] = pickColor.r;
      particleColors[i * 3 + 1] = pickColor.g;
      particleColors[i * 3 + 2] = pickColor.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.45,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 6. Mouse Parallax & Dynamic Interaction
    let targetRotX = 0.12;
    let targetRotY = 0;
    let targetPosX = 2;
    let targetPosY = 0;

    const handleMouseMove = (e) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = -(e.clientY / window.innerHeight) * 2 + 1;

      targetRotY = normX * 0.45;
      targetRotX = 0.12 + normY * 0.35;
      targetPosX = 2 + normX * 3.5;
      targetPosY = normY * 2.5;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // 7. Responsive Resize Handler
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || 700;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);

    // 8. Render Loop with Smooth Damping
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Continuous axial double-helix spin
      dnaGroup.rotation.y += delta * 0.55;

      // Smooth mouse parallax lerp
      dnaGroup.rotation.x += (targetRotX - dnaGroup.rotation.x) * 0.05;
      dnaGroup.rotation.z += ((-0.22 + targetRotY * 0.3) - dnaGroup.rotation.z) * 0.05;
      dnaGroup.position.x += (targetPosX - dnaGroup.position.x) * 0.05;
      dnaGroup.position.y += (targetPosY - dnaGroup.position.y) * 0.05;

      // Gentle floating particle drift
      particles.rotation.y += delta * 0.08;
      particles.rotation.x += delta * 0.03;

      renderer.render(scene, camera);
    };

    animate();

    // 9. Resource Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }

      // Dispose Geometries
      sphereGeo.dispose();
      rungHalfGeo.dispose();
      centerNodeGeo.dispose();
      tubeGeo1.dispose();
      tubeGeo2.dispose();
      particleGeo.dispose();

      // Dispose Materials
      matStrand1.dispose();
      matStrand2.dispose();
      matRungA.dispose();
      matRungB.dispose();
      matCenter.dispose();
      particleMat.dispose();

      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
        overflow: 'hidden',
        ...style,
      }}
    />
  );
}

export default DnaModel3D;
