import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import AICoach from '../components/AICoach';
import QuickInsights from '../components/QuickInsights';

// ─── camera view presets ─────────────────────────────────────────────────────
const CAM_PRESETS = {
  angled: { pos: [0, 50, 40], look: [0, 0, 0] },
  top: { pos: [0, 80, 0.1], look: [0, 0, 0] },
  side: { pos: [60, 20, 0], look: [0, 0, 0] },
  goal: { pos: [0, 10, -55], look: [0, 0, 0] },
};

const TEAM_A_COLOR = 0x667eea;
const TEAM_B_COLOR = 0xf093fb;

export default function Match3D({ simResults, selectedFormation, selectedTactic }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const playersRef = useRef({ teamA: [], teamB: [] });
  const ballRef = useRef(null);
  const heatmapMeshRef = useRef(null);
  const animFrameRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const accumRef = useRef(0);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  // ── state ──────────────────────────────────────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackData, setPlaybackData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [cameraView, setCameraView] = useState('angled');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // expose mutable state to animation loop via refs (avoid deps cycles)
  const isPlayingRef = useRef(false);
  const speedRef = useRef(1);
  const frameRef = useRef(0);
  const totalRef = useRef(0);
  const playbackRef = useRef(null);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  useEffect(() => {
    frameRef.current = currentFrame;
  }, [currentFrame]);
  useEffect(() => {
    totalRef.current = totalFrames;
  }, [totalFrames]);
  useEffect(() => {
    playbackRef.current = playbackData;
  }, [playbackData]);

  // ── helper: apply a frame's position data to Three.js meshes ──────────────
  const applyFrame = useCallback((frameData) => {
    if (!frameData) return;
    frameData.players?.team_a?.forEach((pos, idx) => {
      const m = playersRef.current.teamA[idx];
      if (m) m.position.set((pos.x - 52.5) * 0.5, (34 - pos.y) * 0.5, 0.8);
    });
    frameData.players?.team_b?.forEach((pos, idx) => {
      const m = playersRef.current.teamB[idx];
      if (m) m.position.set((pos.x - 52.5) * 0.5, (34 - pos.y) * 0.5, 0.8);
    });
    if (frameData.ball && ballRef.current) {
      ballRef.current.position.set(
        (frameData.ball.x - 52.5) * 0.5,
        (34 - frameData.ball.y) * 0.5,
        frameData.ball.z || 0.35,
      );
    }
  }, []);

  // ── build pressure heatmap overlay from frame.pressure_zones ──────────────
  const rebuildHeatmap = useCallback((frameData) => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (heatmapMeshRef.current) {
      scene.remove(heatmapMeshRef.current);
      heatmapMeshRef.current = null;
    }
    if (!frameData?.pressure_zones?.length) return;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 256, 256);
    frameData.pressure_zones.forEach((z) => {
      const px = ((z.x || 52.5) / 105) * 256;
      const py = ((z.y || 34) / 68) * 256;
      const r = ctx.createRadialGradient(px, py, 0, px, py, 20);
      const intensity = Math.min(1, z.intensity || 0.5);
      r.addColorStop(0, `rgba(255,80,80,${intensity * 0.6})`);
      r.addColorStop(1, 'rgba(255,80,80,0)');
      ctx.fillStyle = r;
      ctx.fillRect(0, 0, 256, 256);
    });
    const tex = new THREE.CanvasTexture(canvas);
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(105 * 0.5, 68 * 0.5),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }),
    );
    mesh.position.set(0, 0, 0.05);
    scene.add(mesh);
    heatmapMeshRef.current = mesh;
  }, []);

  // ── fetch playback data whenever simResults change ─────────────────────────
  useEffect(() => {
    if (!simResults) return;
    const fetchPlaybackData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/playback-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sim_results: simResults, time_step: 5 }),
        });
        if (!response.ok) throw new Error('Failed to fetch playback data');
        const json = await response.json();
        if (json.ok) {
          setPlaybackData(json.data.playback_data);
          setTotalFrames(json.data.playback_data.total_frames || 1);
          setCurrentFrame(0);
        }
      } catch (err) {
        console.error('Playback data error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaybackData();
  }, [simResults]);

  // ── ONE-TIME Three.js scene initialisation ─────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a3a20);
    scene.fog = new THREE.Fog(0x1a3a20, 80, 160);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000,
    );
    camera.position.set(...CAM_PRESETS.angled.pos);
    camera.lookAt(...CAM_PRESETS.angled.look);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.minDistance = 10;
    controls.maxDistance = 120;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const sun = new THREE.DirectionalLight(0xfff8e7, 1.2);
    sun.position.set(30, 80, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 200;
    sun.shadow.camera.left = -70;
    sun.shadow.camera.right = 70;
    sun.shadow.camera.top = 45;
    sun.shadow.camera.bottom = -45;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x8eb4ff, 0.3);
    fill.position.set(-30, 40, -40);
    scene.add(fill);

    // Pitch surface
    const pitchMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(105, 68),
      new THREE.MeshStandardMaterial({ color: 0x2d5a3d, roughness: 0.8 }),
    );
    pitchMesh.receiveShadow = true;
    scene.add(pitchMesh);

    // Alternating stripes
    for (let i = 0; i < 7; i++) {
      const stripe = new THREE.Mesh(
        new THREE.PlaneGeometry(15, 68),
        new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? 0x2d5a3d : 0x336644,
          transparent: true,
          opacity: 0.5,
          depthWrite: false,
        }),
      );
      stripe.position.set(-45 + i * 15, 0, 0.001);
      scene.add(stripe);
    }

    // Pitch markings
    const lm = new THREE.LineBasicMaterial({ color: 0xffffff });
    const addLine = (...pts) => {
      const g = new THREE.BufferGeometry().setFromPoints(pts.map((p) => new THREE.Vector3(...p)));
      scene.add(new THREE.Line(g, lm));
    };
    addLine(
      [-52.5, 34, 0.02],
      [52.5, 34, 0.02],
      [52.5, -34, 0.02],
      [-52.5, -34, 0.02],
      [-52.5, 34, 0.02],
    );
    addLine([0, 34, 0.02], [0, -34, 0.02]);
    addLine(
      [-52.5, 20.16, 0.02],
      [-40.32, 20.16, 0.02],
      [-40.32, -20.16, 0.02],
      [-52.5, -20.16, 0.02],
    );
    addLine([52.5, 20.16, 0.02], [40.32, 20.16, 0.02], [40.32, -20.16, 0.02], [52.5, -20.16, 0.02]);
    addLine([-52.5, 9.16, 0.02], [-47.5, 9.16, 0.02], [-47.5, -9.16, 0.02], [-52.5, -9.16, 0.02]);
    addLine([52.5, 9.16, 0.02], [47.5, 9.16, 0.02], [47.5, -9.16, 0.02], [52.5, -9.16, 0.02]);

    // Centre circle
    const circPts = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      circPts.push(new THREE.Vector3(Math.cos(a) * 9.15, Math.sin(a) * 9.15, 0.02));
    }
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(circPts), lm));

    // Spots
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    [
      [0, 0, 0.3],
      [-41.5, 0, 0.2],
      [41.5, 0, 0.2],
    ].forEach(([x, y, r]) => {
      const d = new THREE.Mesh(new THREE.CircleGeometry(r, 12), dotMat);
      d.position.set(x, y, 0.02);
      scene.add(d);
    });

    // Goals
    const goalMat = new THREE.MeshStandardMaterial({
      color: 0xdddddd,
      metalness: 0.8,
      roughness: 0.3,
    });
    [-1, 1].forEach((side) => {
      const gx = side * 52.5;
      [-3.66, 3.66].forEach((gy) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.44, 8), goalMat);
        post.position.set(gx, gy, 1.22);
        post.rotation.x = Math.PI / 2;
        scene.add(post);
      });
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 7.32, 8), goalMat);
      bar.position.set(gx, 0, 2.44);
      bar.rotation.z = Math.PI / 2;
      scene.add(bar);
    });

    // Players + Ball
    const playerGeo = new THREE.SphereGeometry(0.8, 16, 16);
    playersRef.current = { teamA: [], teamB: [] };
    const teamAGroup = new THREE.Group();
    const teamBGroup = new THREE.Group();

    for (let i = 0; i < 11; i++) {
      const pa = new THREE.Mesh(
        playerGeo,
        new THREE.MeshStandardMaterial({ color: TEAM_A_COLOR, metalness: 0.3, roughness: 0.4 }),
      );
      pa.castShadow = true;
      pa.userData = { team: 'A', number: i + 1 };
      teamAGroup.add(pa);
      playersRef.current.teamA.push(pa);

      const pb = new THREE.Mesh(
        playerGeo,
        new THREE.MeshStandardMaterial({ color: TEAM_B_COLOR, metalness: 0.3, roughness: 0.4 }),
      );
      pb.castShadow = true;
      pb.userData = { team: 'B', number: i + 1 };
      teamBGroup.add(pb);
      playersRef.current.teamB.push(pb);
    }
    scene.add(teamAGroup);
    scene.add(teamBGroup);

    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.4, roughness: 0.3 }),
    );
    ball.castShadow = true;
    ball.position.set(0, 0, 0.35);
    scene.add(ball);
    ballRef.current = ball;

    // Animation loop
    const loop = () => {
      animFrameRef.current = requestAnimationFrame(loop);
      const delta = clockRef.current.getDelta();
      controls.update();

      if (isPlayingRef.current && totalRef.current > 0 && playbackRef.current) {
        const baseFrameSec = playbackRef.current.time_step_seconds || 5;
        const frameSec = Math.max(0.03, baseFrameSec / Math.max(0.1, speedRef.current));
        accumRef.current += delta;
        if (accumRef.current >= frameSec) {
          accumRef.current -= frameSec;
          setCurrentFrame((prev) => {
            const next = (prev + 1) % totalRef.current;
            const frame = playbackRef.current.frames?.[next];
            if (frame) {
              frame.players?.team_a?.forEach((pos, idx) => {
                const m = playersRef.current.teamA[idx];
                if (m) m.position.set((pos.x - 52.5) * 0.5, (34 - pos.y) * 0.5, 0.8);
              });
              frame.players?.team_b?.forEach((pos, idx) => {
                const m = playersRef.current.teamB[idx];
                if (m) m.position.set((pos.x - 52.5) * 0.5, (34 - pos.y) * 0.5, 0.8);
              });
              if (frame.ball && ballRef.current) {
                ballRef.current.position.set(
                  (frame.ball.x - 52.5) * 0.5,
                  (34 - frame.ball.y) * 0.5,
                  frame.ball.z || 0.35,
                );
              }
            }
            return next;
          });
        }
      }
      renderer.render(scene, camera);
    };
    loop();

    // Resize
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth,
        h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []); // ← runs ONCE

  // ── Apply frame when slider dragged manually ───────────────────────────────
  useEffect(() => {
    const frame = playbackRef.current?.frames?.[currentFrame];
    if (frame) applyFrame(frame);
    if (showHeatmap) rebuildHeatmap(frame);
  }, [currentFrame, applyFrame, rebuildHeatmap, showHeatmap]);

  // ── Heatmap toggle ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!showHeatmap) {
      if (heatmapMeshRef.current && sceneRef.current) {
        sceneRef.current.remove(heatmapMeshRef.current);
        heatmapMeshRef.current = null;
      }
    } else {
      rebuildHeatmap(playbackRef.current?.frames?.[frameRef.current]);
    }
  }, [showHeatmap]); // eslint-disable-line

  // ── Camera preset ──────────────────────────────────────────────────────────
  useEffect(() => {
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (!cam || !ctrl) return;
    const p = CAM_PRESETS[cameraView];
    cam.position.set(...p.pos);
    ctrl.target.set(...p.look);
    ctrl.update();
  }, [cameraView]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      switch (e.key) {
        case ' ':
          e.preventDefault();
          setIsPlaying((p) => !p);
          break;
        case 'ArrowRight':
          setCurrentFrame((p) => Math.min(totalRef.current - 1, p + 1));
          break;
        case 'ArrowLeft':
          setCurrentFrame((p) => Math.max(0, p - 1));
          break;
        case 'r':
        case 'R':
          setCurrentFrame(0);
          setIsPlaying(false);
          break;
        case '+':
        case '=':
          setSpeed((s) => Math.min(8, parseFloat((s * 2).toFixed(2))));
          break;
        case '-':
        case '_':
          setSpeed((s) => Math.max(0.25, parseFloat((s / 2).toFixed(2))));
          break;
        case 'h':
        case 'H':
          setShowHeatmap((v) => !v);
          break;
        case '1':
          setCameraView('angled');
          break;
        case '2':
          setCameraView('top');
          break;
        case '3':
          setCameraView('side');
          break;
        case '4':
          setCameraView('goal');
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Click-to-select players via raycasting ─────────────────────────────────
  const handleCanvasClick = useCallback((e) => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    if (!renderer || !camera) return;

    const rect = renderer.domElement.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, camera);
    const allPlayers = [...playersRef.current.teamA, ...playersRef.current.teamB];
    const hits = raycasterRef.current.intersectObjects(allPlayers);

    if (hits.length > 0) {
      const hit = hits[0].object;
      allPlayers.forEach((p) => {
        if (p.material.emissive) p.material.emissive.set(0x000000);
        p.scale.setScalar(1);
      });
      if (hit.material.emissive) hit.material.emissive.set(0xffff00);
      if (hit.material.emissiveIntensity !== undefined) hit.material.emissiveIntensity = 0.4;
      hit.scale.setScalar(1.35);

      const frame = playbackRef.current?.frames?.[frameRef.current];
      const teamList = hit.userData.team === 'A' ? frame?.players?.team_a : frame?.players?.team_b;
      const pd = teamList?.[hit.userData.number - 1];

      setSelectedPlayer({
        team: hit.userData.team,
        number: hit.userData.number,
        x: pd?.x?.toFixed(1) ?? '??',
        y: pd?.y?.toFixed(1) ?? '??',
        speed: pd?.speed?.toFixed(1) ?? 'N/A',
        stamina: pd?.stamina?.toFixed(0) ?? 'N/A',
      });
    } else {
      allPlayers.forEach((p) => {
        if (p.material.emissive) p.material.emissive.set(0x000000);
        p.scale.setScalar(1);
      });
      setSelectedPlayer(null);
    }
  }, []);

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!simResults)
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ fontSize: 48 }}>⚽</div>
        <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>No Simulation Data</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
          Run a simulation on the Overview tab to view 3D match analysis
        </p>
      </div>
    );

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const timeLabel = (() => {
    if (!playbackData) return '0:00';
    const elapsed = (playbackData.time_step_seconds || 5) * currentFrame;
    const mins = Math.floor(elapsed / 60);
    const secs = Math.floor(elapsed % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  })();

  const btnStyle = (active) => ({
    padding: '7px 12px',
    fontWeight: 700,
    fontSize: 12,
    background: active ? 'var(--plasma)' : 'var(--surface-1)',
    color: active ? 'var(--void)' : 'var(--text-secondary)',
    border: `1px solid ${active ? 'var(--plasma)' : 'var(--border-subtle)'}`,
    borderRadius: 'var(--panel-radius)',
    cursor: 'pointer',
    transition: 'all 0.12s',
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      <div className="dashboard-body">
        {/* ── Main column ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div style={{ marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)' }}>
              3D Match Simulation
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 12 }}>
              {selectedFormation} vs 4-4-2 &nbsp;·&nbsp; {selectedTactic} vs balanced &nbsp;·&nbsp;
              <kbd
                style={{
                  background: 'var(--surface-0)',
                  padding: '1px 4px',
                  borderRadius: 3,
                  fontSize: 10,
                }}
              >
                Space
              </kbd>{' '}
              play &nbsp;
              <kbd
                style={{
                  background: 'var(--surface-0)',
                  padding: '1px 4px',
                  borderRadius: 3,
                  fontSize: 10,
                }}
              >
                ←→
              </kbd>{' '}
              step &nbsp;
              <kbd
                style={{
                  background: 'var(--surface-0)',
                  padding: '1px 4px',
                  borderRadius: 3,
                  fontSize: 10,
                }}
              >
                H
              </kbd>{' '}
              heatmap &nbsp;
              <kbd
                style={{
                  background: 'var(--surface-0)',
                  padding: '1px 4px',
                  borderRadius: 3,
                  fontSize: 10,
                }}
              >
                1-4
              </kbd>{' '}
              camera
            </p>
          </div>

          {/* 3D Canvas */}
          <div
            style={{
              position: 'relative',
              borderRadius: 10,
              overflow: 'hidden',
              border: '1px solid var(--border-subtle)',
              marginBottom: 12,
            }}
          >
            {loading && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.6)',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div className="match-3d-spinner" />
                <p style={{ color: '#fff', fontSize: 13, margin: 0 }}>Loading playback data…</p>
              </div>
            )}

            {/* Selected-player tooltip */}
            {selectedPlayer && (
              <div
                style={{
                  position: 'absolute',
                  top: 12,
                  left: 12,
                  zIndex: 20,
                  background: 'rgba(0,0,0,0.8)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  minWidth: 150,
                  border: `1px solid ${selectedPlayer.team === 'A' ? '#667eea' : '#f093fb'}`,
                }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 13,
                    color: selectedPlayer.team === 'A' ? '#667eea' : '#f093fb',
                    marginBottom: 6,
                  }}
                >
                  Team {selectedPlayer.team} &nbsp;·&nbsp; #{selectedPlayer.number}
                </div>
                {[
                  ['Position', `(${selectedPlayer.x}, ${selectedPlayer.y})`],
                  ['Speed', selectedPlayer.speed !== 'N/A' ? `${selectedPlayer.speed} m/s` : 'N/A'],
                  [
                    'Stamina',
                    selectedPlayer.stamina !== 'N/A' ? `${selectedPlayer.stamina}%` : 'N/A',
                  ],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 14,
                      fontSize: 11,
                      color: '#ccc',
                      marginBottom: 2,
                    }}
                  >
                    <span>{k}</span>
                    <strong style={{ color: '#fff' }}>{v}</strong>
                  </div>
                ))}
                <button
                  onClick={() => {
                    setSelectedPlayer(null);
                    [...playersRef.current.teamA, ...playersRef.current.teamB].forEach((p) => {
                      if (p.material.emissive) p.material.emissive.set(0x000000);
                      p.scale.setScalar(1);
                    });
                  }}
                  style={{
                    marginTop: 8,
                    fontSize: 10,
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  ✕ Deselect
                </button>
              </div>
            )}

            <div
              ref={containerRef}
              onClick={handleCanvasClick}
              style={{ width: '100%', height: 420, cursor: 'crosshair' }}
            />
          </div>

          {/* Playback bar */}
          <div className="panel" style={{ padding: '12px 16px', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <button
                style={btnStyle(false)}
                onClick={() => {
                  setCurrentFrame(0);
                  setIsPlaying(false);
                }}
              >
                ⏮
              </button>
              <button
                style={btnStyle(false)}
                onClick={() => setCurrentFrame((p) => Math.max(0, p - 1))}
              >
                ◀
              </button>
              <button
                style={{ ...btnStyle(isPlaying), minWidth: 76 }}
                onClick={() => setIsPlaying((p) => !p)}
              >
                {isPlaying ? '⏸ Pause' : '▶ Play'}
              </button>
              <button
                style={btnStyle(false)}
                onClick={() => setCurrentFrame((p) => Math.min(totalFrames - 1, p + 1))}
              >
                ▶
              </button>

              <input
                type="range"
                min={0}
                max={Math.max(0, totalFrames - 1)}
                value={currentFrame}
                onChange={(e) => {
                  setIsPlaying(false);
                  setCurrentFrame(parseInt(e.target.value));
                }}
                style={{ flex: 1, minWidth: 80, accentColor: 'var(--plasma)' }}
              />

              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                }}
              >
                {timeLabel} &nbsp;
                <span style={{ color: 'var(--text-secondary)' }}>
                  f{currentFrame}/{totalFrames}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Speed</span>
                <input
                  type="range"
                  min={0.25}
                  max={8}
                  step={0.25}
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  style={{ width: 72, accentColor: 'var(--plasma)' }}
                />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, width: 34 }}>
                  {speed}x
                </span>
              </div>
            </div>
          </div>

          {/* View toggles */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {Object.keys(CAM_PRESETS).map((v, i) => (
              <button key={v} style={btnStyle(cameraView === v)} onClick={() => setCameraView(v)}>
                {i + 1}. {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
            <button style={btnStyle(showHeatmap)} onClick={() => setShowHeatmap((v) => !v)}>
              🔥 Pressure Heatmap
            </button>
            <button
              style={btnStyle(false)}
              onClick={() => {
                if (!playbackData) return;
                const blob = new Blob([JSON.stringify(playbackData, null, 2)], {
                  type: 'application/json',
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `playback_${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              ⬇ Export JSON
            </button>
          </div>

          {/* Stats row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 10,
              marginBottom: 14,
            }}
          >
            {[
              ['Avg PMU', (simResults.avgPMU || 20.5).toFixed(1)],
              ['Goal Prob', `${((simResults.goalProbability || 0.015) * 100).toFixed(1)}%`],
              ['xG', (simResults.xg || 0.04).toFixed(3)],
              ['Peak PMU', (simResults.peakPMU || 45).toFixed(1)],
            ].map(([label, val]) => (
              <div
                key={label}
                className="panel"
                style={{ textAlign: 'center', padding: '10px 8px' }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    marginBottom: 4,
                    textTransform: 'uppercase',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    fontSize: 18,
                    color: 'var(--plasma)',
                  }}
                >
                  {val}
                </div>
              </div>
            ))}
          </div>

          {/* Team comparison */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              {
                label: 'Team A',
                color: '#667eea',
                pmu: simResults.avgPMU_A,
                xg: simResults.xg_a,
                win: simResults.probability_outcomes?.team_a_win_probability,
              },
              {
                label: 'Team B',
                color: '#f093fb',
                pmu: simResults.avgPMU_B,
                xg: simResults.xg_b,
                win: simResults.probability_outcomes?.team_b_win_probability,
              },
            ].map((t) => (
              <div
                key={t.label}
                className="panel"
                style={{ borderTopWidth: 3, borderTopColor: t.color }}
              >
                <div style={{ fontWeight: 800, color: t.color, marginBottom: 8, fontSize: 13 }}>
                  {t.label}
                </div>
                {[
                  ['Momentum', `${(t.pmu || 20).toFixed(1)} PMU`],
                  ['xG', (t.xg || 0.02).toFixed(3)],
                  t.win !== undefined ? ['Win %', `${t.win.toFixed(1)}%`] : null,
                ]
                  .filter(Boolean)
                  .map(([k, v]) => (
                    <div
                      key={k}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 12,
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{v}</strong>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div
          style={{
            width: '300px',
            minWidth: '260px',
            maxWidth: '320px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <AICoach
            matchState={
              simResults
                ? {
                    formation_id: 0,
                    tactic_id: 0,
                    possession_pct: simResults.avgPossession || 50,
                    team_fatigue: simResults.avgTeamFatigue || 50,
                    momentum_pmu: simResults.avgPMU_A || 0,
                    opponent_formation_id: 1,
                    opponent_tactic_id: 0,
                    score_differential: (simResults.goals_a || 0) - (simResults.goals_b || 0),
                  }
                : null
            }
          />
          <QuickInsights simResults={simResults} />

          {/* Legend */}
          <div className="panel" style={{ padding: '12px 14px' }}>
            <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 10 }}>Legend</div>
            {[
              ['#667eea', 'Team A (Blue)'],
              ['#f093fb', 'Team B (Pink)'],
              ['#ffffff', 'Ball'],
            ].map(([c, l]) => (
              <div
                key={l}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 6,
                  fontSize: 12,
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: c,
                    border: '1px solid rgba(255,255,255,0.3)',
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: 'var(--text-secondary)' }}>{l}</span>
              </div>
            ))}
            <div
              style={{ marginTop: 12, fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.8 }}
            >
              🖱 <strong>Drag</strong> to orbit &nbsp;·&nbsp; <strong>Scroll</strong> to zoom
              <br />
              🖱 <strong>Click player</strong> to inspect stats
              <br />⌨ <strong>Space</strong> &nbsp;·&nbsp; <strong>←→</strong> &nbsp;·&nbsp;{' '}
              <strong>H</strong> &nbsp;·&nbsp; <strong>±</strong> speed
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
