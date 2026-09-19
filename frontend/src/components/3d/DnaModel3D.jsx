import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * ============================================================================
 * HELIO 3D DNA MODEL (Precision B-DNA Double Helix)
 * ============================================================================
 * 
 * Technical & Anatomical Specifications:
 * 1. Geometric Precision:
 *    - Natural right-handed double helix (Watson-Crick B-DNA) with canonical
 *      alternating Major (~232°) and Minor (~128°) grooves.
 *    - Pitch standard: 10.4 base pairs per 360° turn with uniform axial rise.
 * 
 * 2. Seamless Connectors:
 *    - Outer sugar-phosphate backbones engineered as silky-smooth, continuous
 *      3D cylindrical strands (TubeGeometry with CatmullRom spline interpolation)
 *      with flush molecular junction collars eliminating disjointed segments.
 * 
 * 3. Accurate Base Pairing:
 *    - Strictly horizontal, pitch-aligned rungs composed of dual-locking segments
 *      with natural central locking joints and hydrogen-bond bridges.
 *    - Consistent canonical color pairings:
 *        * Cyan (#06B6D4) ⟷ Violet (#8B5CF6)  [3 Hydrogen Bonds]
 *        * Emerald (#10B981) ⟷ Orange (#F97316) [2 Hydrogen Bonds]
 * 
 * 4. UI/UX & Lighting Enhancement:
 *    - Advanced MeshPhysicalMaterial shaders with clearcoat specular refraction
 *      and rich bioluminescent radiance tuned for dark digital backgrounds.
 *    - Floating bio-digital particle cloud with additive depth blending.
 *    - Anchored gracefully to the right side of the screen on desktop.
 *    - Interactive mouse parallax with smooth 60fps damping and full GPU cleanup.
 */
export function DnaModel3D({ style = {} }) {  
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || 720;

    // Responsive right-side anchor calculation
    const getBaseX = (w) => {
      if (w < 768) return 1.0;     // Centered with slight offset on mobile
      if (w < 1180) return 8.5;    // Balanced on tablets & compact laptops
      return 13.5;                 // Elegant right-side hero showcase on desktop
    };

    let baseX = getBaseX(width);

    // 1. Scene, Atmospheric Fog & Camera Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x08080F, 0.010);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 48);

    // 2. WebGL High-Performance Antialiased Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // 3. Multi-Point Bioluminescent Lighting System with Specular Highlights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.82);
    scene.add(ambientLight);

    // Key Light: Ultraviolet Violet
    const purpleLight = new THREE.PointLight(0x8B5CF6, 4.2, 80);
    purpleLight.position.set(baseX - 14, 18, 18);
    scene.add(purpleLight);

    // Rim / Edge Light: Electric Cyan
    const cyanLight = new THREE.PointLight(0x06B6D4, 4.4, 80);
    cyanLight.position.set(baseX + 16, -18, 20);
    scene.add(cyanLight);

    // Accent Fill Light: Emerald Mint
    const mintLight = new THREE.PointLight(0x10B981, 2.6, 65);
    mintLight.position.set(baseX, 0, 24);
    scene.add(mintLight);

    // Specular Highlight Light: Warm Gold/Orange
    const orangeLight = new THREE.PointLight(0xF97316, 2.2, 55);
    orangeLight.position.set(baseX - 8, -12, 16);
    scene.add(orangeLight);

    // Rear Depth Light: Deep Violet/Blue
    const rearLight = new THREE.PointLight(0x7C3AED, 2.4, 60);
    rearLight.position.set(baseX - 4, 14, -20);
    scene.add(rearLight);

    // 4. DNA Model Group
    const dnaGroup = new THREE.Group();
    scene.add(dnaGroup);

    // Canonical B-DNA Helix Parameters
    const numPairs = 50;                  // Total base pairs along strand
    const pairsPerTurn = 10.4;             // B-DNA canonical 10.4 bp per 360° revolution
    const angleStep = (Math.PI * 2) / pairsPerTurn;
    const minorGrooveAngle = 2.24;         // ~128.3° minor groove / ~231.7° major groove
    const radius = 5.8;                    // Helix cylinder radius
    const heightStep = 1.15;               // Axial rise per base pair
    const startY = -(numPairs * heightStep) / 2;

    // Backbone tube radius and collar radius
    const tubeRadius = 0.35;
    const junctionRadius = 0.44;

    // Reusable Geometries
    const junctionSphereGeo = new THREE.SphereGeometry(junctionRadius, 16, 16);
    const rungCylinderGeo = new THREE.CylinderGeometry(0.20, 0.20, 1, 12);
    const jointCollarGeo = new THREE.CylinderGeometry(0.26, 0.26, 1, 14);
    const hBondGeo = new THREE.CylinderGeometry(0.065, 0.065, 1, 8);

    // Refractive Clearcoat Materials (MeshPhysicalMaterial for specular depth)
    const matStrandViolet = new THREE.MeshPhysicalMaterial({
      color: 0x8B5CF6,
      emissive: 0x6D28D9,
      emissiveIntensity: 0.52,
      roughness: 0.16,
      metalness: 0.35,
      clearcoat: 0.88,
      clearcoatRoughness: 0.10,
    });

    const matStrandCyan = new THREE.MeshPhysicalMaterial({
      color: 0x06B6D4,
      emissive: 0x0891B2,
      emissiveIntensity: 0.52,
      roughness: 0.16,
      metalness: 0.35,
      clearcoat: 0.88,
      clearcoatRoughness: 0.10,
    });

    // Base Pair Materials: Consistent Cyan-Violet & Emerald-Orange Pairings
    const matBaseCyan = new THREE.MeshPhysicalMaterial({
      color: 0x06B6D4,
      emissive: 0x0284C7,
      emissiveIntensity: 0.50,
      roughness: 0.18,
      metalness: 0.30,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12,
    });

    const matBaseViolet = new THREE.MeshPhysicalMaterial({
      color: 0x8B5CF6,
      emissive: 0x7C3AED,
      emissiveIntensity: 0.50,
      roughness: 0.18,
      metalness: 0.30,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12,
    });

    const matBaseEmerald = new THREE.MeshPhysicalMaterial({
      color: 0x10B981,
      emissive: 0x059669,
      emissiveIntensity: 0.50,
      roughness: 0.18,
      metalness: 0.30,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12,
    });

    const matBaseOrange = new THREE.MeshPhysicalMaterial({
      color: 0xF97316,
      emissive: 0xC2410C,
      emissiveIntensity: 0.50,
      roughness: 0.18,
      metalness: 0.30,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12,
    });

    // Natural Locking Joint Collar Material
    const matJointCollar = new THREE.MeshPhysicalMaterial({
      color: 0xF1F5F9,
      emissive: 0x38BDF8,
      emissiveIntensity: 0.85,
      roughness: 0.12,
      metalness: 0.80,
      clearcoat: 0.95,
      clearcoatRoughness: 0.08,
    });

    // Luminous Hydrogen Bond Material
    const matHBond = new THREE.MeshStandardMaterial({
      color: 0xF8FAFC,
      emissive: 0x67E8F9,
      emissiveIntensity: 1.0,
      roughness: 0.1,
      metalness: 0.9,
    });

    const strand1Points = [];
    const strand2Points = [];

    // Canonical Color Pairings (Cyan-Violet & Emerald-Orange)
    const basePairsSequence = [
      { type1: 'cyan',    type2: 'violet',  bonds: 3 },
      { type1: 'emerald', type2: 'orange',  bonds: 2 },
      { type1: 'violet',  type2: 'cyan',    bonds: 3 },
      { type1: 'orange',  type2: 'emerald', bonds: 2 },
      { type1: 'cyan',    type2: 'violet',  bonds: 3 },
      { type1: 'emerald', type2: 'orange',  bonds: 2 },
      { type1: 'violet',  type2: 'cyan',    bonds: 3 },
      { type1: 'orange',  type2: 'emerald', bonds: 2 },
    ];

    const getBaseMat = (type) => {
      switch (type) {
        case 'cyan': return matBaseCyan;
        case 'violet': return matBaseViolet;
        case 'emerald': return matBaseEmerald;
        case 'orange': return matBaseOrange;
        default: return matBaseCyan;
      }
    };

    const cylUp = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i < numPairs; i++) {
      const angle1 = i * angleStep;
      const angle2 = angle1 + minorGrooveAngle;
      const y = startY + i * heightStep;

      // Strand 1 node position
      const pos1 = new THREE.Vector3(
        Math.cos(angle1) * radius,
        y,
        Math.sin(angle1) * radius
      );
      strand1Points.push(pos1);

      // Strand 2 node position (asymmetric major & minor groove)
      const pos2 = new THREE.Vector3(
        Math.cos(angle2) * radius,
        y,
        Math.sin(angle2) * radius
      );
      strand2Points.push(pos2);

      // Seamless flush junction nodes at backbone intersections
      const junc1 = new THREE.Mesh(junctionSphereGeo, matStrandViolet);
      junc1.position.copy(pos1);
      dnaGroup.add(junc1);

      const junc2 = new THREE.Mesh(junctionSphereGeo, matStrandCyan);
      junc2.position.copy(pos2);
      dnaGroup.add(junc2);

      // Vector connecting Strand 1 to Strand 2 (strictly horizontal since pos1.y === pos2.y)
      const dir = new THREE.Vector3().subVectors(pos2, pos1);
      const totalDist = dir.length();
      const u = dir.clone().normalize(); // unit vector along horizontal rung

      // Side vector for hydrogen bond spacing in horizontal plane
      const side = new THREE.Vector3().crossVectors(u, cylUp).normalize();
      const rungQuat = new THREE.Quaternion().setFromUnitVectors(cylUp, u);

      // Dual-locking segment calculations
      const activeSpan = totalDist - (tubeRadius * 2);
      const jointGap = 0.54;
      const halfSegmentLen = (activeSpan - jointGap) / 2;

      const pairInfo = basePairsSequence[i % basePairsSequence.length];

      // Segment 1 (left locking segment)
      const seg1Mesh = new THREE.Mesh(rungCylinderGeo, getBaseMat(pairInfo.type1));
      seg1Mesh.scale.set(1, halfSegmentLen, 1);
      seg1Mesh.position.copy(pos1).addScaledVector(u, tubeRadius + halfSegmentLen / 2);
      seg1Mesh.quaternion.copy(rungQuat);
      dnaGroup.add(seg1Mesh);

      // Segment 2 (right locking segment)
      const seg2Mesh = new THREE.Mesh(rungCylinderGeo, getBaseMat(pairInfo.type2));
      seg2Mesh.scale.set(1, halfSegmentLen, 1);
      seg2Mesh.position.copy(pos2).addScaledVector(u, -(tubeRadius + halfSegmentLen / 2));
      seg2Mesh.quaternion.copy(rungQuat);
      dnaGroup.add(seg2Mesh);

      // Natural Joint Collar at the center interface
      const jointCenter = pos1.clone().addScaledVector(u, tubeRadius + halfSegmentLen + jointGap / 2);
      const jointCollar = new THREE.Mesh(jointCollarGeo, matJointCollar);
      jointCollar.scale.set(1, jointGap * 0.42, 1);
      jointCollar.position.copy(jointCenter);
      jointCollar.quaternion.copy(rungQuat);
      dnaGroup.add(jointCollar);

      // Hydrogen Bond Bridges (3 for Cyan-Violet, 2 for Emerald-Orange)
      if (pairInfo.bonds === 2) {
        const offsets = [-0.16, 0.16];
        offsets.forEach((off) => {
          const bond = new THREE.Mesh(hBondGeo, matHBond);
          bond.scale.set(1, jointGap * 0.96, 1);
          bond.position.copy(jointCenter).addScaledVector(side, off);
          bond.quaternion.copy(rungQuat);
          dnaGroup.add(bond);
        });
      } else {
        const offsets = [-0.22, 0, 0.22];
        offsets.forEach((off) => {
          const bond = new THREE.Mesh(hBondGeo, matHBond);
          bond.scale.set(1, jointGap * 0.96, 1);
          bond.position.copy(jointCenter).addScaledVector(side, off);
          bond.quaternion.copy(rungQuat);
          dnaGroup.add(bond);
        });
      }
    }

    // Outer Sugar-Phosphate Backbones: Smooth, continuous 3D cylindrical strands
    const curve1 = new THREE.CatmullRomCurve3(strand1Points);
    const tubeGeo1 = new THREE.TubeGeometry(curve1, numPairs * 8, tubeRadius, 14, false);
    const tubeMesh1 = new THREE.Mesh(tubeGeo1, matStrandViolet);
    dnaGroup.add(tubeMesh1);

    const curve2 = new THREE.CatmullRomCurve3(strand2Points);
    const tubeGeo2 = new THREE.TubeGeometry(curve2, numPairs * 8, tubeRadius, 14, false);
    const tubeMesh2 = new THREE.Mesh(tubeGeo2, matStrandCyan);
    dnaGroup.add(tubeMesh2);

    // Initial 3D orientation & position
    dnaGroup.rotation.z = -0.24;
    dnaGroup.rotation.x = 0.14;
    dnaGroup.position.set(baseX, 0, -2);

    // 5. Floating Ambient Bio-Digital Particles
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const colorViolet = new THREE.Color(0x8B5CF6);
    const colorCyan = new THREE.Color(0x06B6D4);
    const colorMint = new THREE.Color(0x10B981);
    const colorOrange = new THREE.Color(0xF97316);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = baseX + (Math.random() - 0.5) * 55;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 65;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 45;

      const rand = Math.random();
      const pickColor = rand > 0.65 ? colorViolet : rand > 0.35 ? colorCyan : rand > 0.15 ? colorMint : colorOrange;
      particleColors[i * 3] = pickColor.r;
      particleColors[i * 3 + 1] = pickColor.g;
      particleColors[i * 3 + 2] = pickColor.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.48,
      vertexColors: true,
      transparent: true,
      opacity: 0.82,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 6. Interactive Mouse Parallax with Smooth Damping
    let targetRotX = 0.14;
    let targetRotY = 0;
    let targetPosX = baseX;
    let targetPosY = 0;

    const handleMouseMove = (e) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = -(e.clientY / window.innerHeight) * 2 + 1;

      targetRotY = normX * 0.35;
      targetRotX = 0.14 + normY * 0.25;
      targetPosX = baseX + normX * 2.2;
      targetPosY = normY * 1.8;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // 7. Responsive Window & Container Resize Handler
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || 720;

      baseX = getBaseX(width);
      targetPosX = baseX;

      // Update light positions with new baseX
      purpleLight.position.set(baseX - 14, 18, 18);
      cyanLight.position.set(baseX + 16, -18, 20);
      mintLight.position.set(baseX, 0, 24);
      orangeLight.position.set(baseX - 8, -12, 16);
      rearLight.position.set(baseX - 4, 14, -20);

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);

    // 8. 60 FPS Render Loop
    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Continuous axial double-helix rotation
      dnaGroup.rotation.y += delta * 0.48;

      // Smooth mouse parallax damping
      dnaGroup.rotation.x += (targetRotX - dnaGroup.rotation.x) * 0.05;
      dnaGroup.rotation.z += ((-0.24 + targetRotY * 0.25) - dnaGroup.rotation.z) * 0.05;
      dnaGroup.position.x += (targetPosX - dnaGroup.position.x) * 0.05;
      dnaGroup.position.y += (targetPosY - dnaGroup.position.y) * 0.05;

      // Gentle bio-digital particle drift
      particles.rotation.y += delta * 0.06;
      particles.rotation.x += delta * 0.02;

      renderer.render(scene, camera);
    };

    animate();

    // 9. Comprehensive GPU & Memory Disposal Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }

      // Dispose Geometries
      junctionSphereGeo.dispose();
      rungCylinderGeo.dispose();
      jointCollarGeo.dispose();
      hBondGeo.dispose();
      tubeGeo1.dispose();
      tubeGeo2.dispose();
      particleGeo.dispose();

      // Dispose Materials
      matStrandViolet.dispose();
      matStrandCyan.dispose();
      matBaseCyan.dispose();
      matBaseViolet.dispose();
      matBaseEmerald.dispose();
      matBaseOrange.dispose();
      matJointCollar.dispose();
      matHBond.dispose();
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
