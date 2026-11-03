import * as THREE from 'three';
import { SoundSystem } from './audio.js';
import { JET_CONFIGS, createJetMesh, updateJetVisuals, createCarrierGroup } from './jets.js';
import { createRealisticEnvironment } from './environment.js';

// ==========================================
// STORAGE & INPUT SANITIZATION (SECURE CODING)
// ==========================================
const STORAGE_KEY = 'tailhook_aces_save_v1';
const CALLSIGN_REGEX = /^[A-Za-z0-9 _-]{1,16}$/;

function sanitizeCallsign(raw) {
  if (typeof raw !== 'string') return 'MAVERICK JR';
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9 _-]/g, '').trim().slice(0, 16);
  return CALLSIGN_REGEX.test(cleaned) ? cleaned : 'MAVERICK JR';
}

function loadSaveData() {
  // Note: Only non-sensitive game high scores, stage grades, and pilot callsign are stored locally.
  // TODO(security): If backend authentication is ever added, use HttpOnly SameSite cookies instead of localStorage.
  const defaults = {
    callsign: 'MAVERICK JR',
    selectedJet: 'f18',
    bestWave: 1,
    bestScore: 0,
    stageGrades: {}
  };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return {
      callsign: sanitizeCallsign(parsed.callsign || defaults.callsign),
      selectedJet: JET_CONFIGS[parsed.selectedJet] ? parsed.selectedJet : 'f18',
      bestWave: Math.max(1, Number(parsed.bestWave) || 1),
      bestScore: Math.max(0, Number(parsed.bestScore) || 0),
      stageGrades: typeof parsed.stageGrades === 'object' && parsed.stageGrades ? parsed.stageGrades : {}
    };
  } catch {
    return defaults;
  }
}

function writeSaveData(data) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
}

// ==========================================
// CARRIER CHALLENGE 5-STAGE DEFINITIONS
// ==========================================
const CARRIER_STAGES = {
  1: {
    id: 1,
    name: 'STAGE 1: STRAIGHT-IN CALM DAY',
    sunElevation: 24,
    sunAzimuth: 145,
    turbidity: 3.5,
    rayleigh: 1.8,
    fogColor: 0x8fbce0,
    fogDensity: 0.00009,
    waterColor: 0x002b4d,
    sunIntensity: 2.6,
    ambientIntensity: 0.9,
    carrierSpeedMps: 0,
    windVec: new THREE.Vector3(0, 0, 0),
    turbulence: 0,
    deckPitchAmp: 0,
    overheadBreak: false,
    startPos: new THREE.Vector3(0, 128, 1750),
    startYaw: 0,
    startSpeedKts: 144,
    startGearDown: true
  },
  2: {
    id: 2,
    name: 'STAGE 2: MOVING DECK & CROSSWIND',
    sunElevation: 16,
    sunAzimuth: 120,
    turbidity: 5.0,
    rayleigh: 2.1,
    fogColor: 0x82accf,
    fogDensity: 0.00014,
    waterColor: 0x002442,
    sunIntensity: 2.3,
    ambientIntensity: 0.85,
    carrierSpeedMps: 11.5, // ~22 kts forward along -Z
    windVec: new THREE.Vector3(10.5, 0, 0), // 20+ kt crosswind pushing right
    turbulence: 0.15,
    deckPitchAmp: 0.006,
    overheadBreak: false,
    startPos: new THREE.Vector3(-45, 138, 1900),
    startYaw: 0,
    startSpeedKts: 148,
    startGearDown: true
  },
  3: {
    id: 3,
    name: 'STAGE 3: CASE I OVERHEAD BREAK',
    sunElevation: 32,
    sunAzimuth: 160,
    turbidity: 2.8,
    rayleigh: 1.6,
    fogColor: 0x95c2e4,
    fogDensity: 0.00008,
    waterColor: 0x00335c,
    sunIntensity: 2.8,
    ambientIntensity: 0.95,
    carrierSpeedMps: 8.0,
    windVec: new THREE.Vector3(3.0, 0, 0),
    turbulence: 0.08,
    deckPitchAmp: 0.004,
    overheadBreak: true,
    startPos: new THREE.Vector3(120, 245, 420),
    startYaw: 0,
    startSpeedKts: 350,
    startGearDown: false
  },
  4: {
    id: 4,
    name: 'STAGE 4: SUNSET HEAVY SEAS',
    sunElevation: 2.2,
    sunAzimuth: 192,
    turbidity: 9.5,
    rayleigh: 3.4,
    fogColor: 0xc97449,
    fogDensity: 0.00022,
    waterColor: 0x162436,
    sunIntensity: 1.9,
    ambientIntensity: 0.65,
    carrierSpeedMps: 10.0,
    windVec: new THREE.Vector3(-9.5, 0, 4.0),
    turbulence: 0.55,
    deckPitchAmp: 0.024,
    overheadBreak: false,
    startPos: new THREE.Vector3(25, 142, 1950),
    startYaw: 0,
    startSpeedKts: 146,
    startGearDown: true
  },
  5: {
    id: 5,
    name: 'STAGE 5: NIGHT & FOG INSTRUMENT TRAP',
    sunElevation: -6.0,
    sunAzimuth: 180,
    turbidity: 4.0,
    rayleigh: 0.8,
    fogColor: 0x060f1c,
    fogDensity: 0.00055,
    waterColor: 0x020812,
    sunIntensity: 0.18,
    ambientIntensity: 0.28,
    carrierSpeedMps: 9.0,
    windVec: new THREE.Vector3(7.5, 0, 0),
    turbulence: 0.35,
    deckPitchAmp: 0.015,
    overheadBreak: false,
    startPos: new THREE.Vector3(-20, 140, 1850),
    startYaw: 0,
    startSpeedKts: 144,
    startGearDown: true
  }
};

// ==========================================
// MAIN GAME STATE & THREE.JS INITIALIZATION
// ==========================================
const saveData = loadSaveData();
const sound = new SoundSystem();

const canvas3D = document.getElementById('game-canvas');
const canvasHUD = document.getElementById('hud-canvas');
const ctxHUD = canvasHUD.getContext('2d');

const renderer = new THREE.WebGLRenderer({
  canvas: canvas3D,
  antialias: true,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x8fbce0, 0.00009);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.5,
  24000
);

// Hemisphere + Directional Sun Lighting
const ambientLight = new THREE.HemisphereLight(0xd8ecff, 0x1a3048, 0.95);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfff4e0, 2.6);
sunLight.position.set(600, 1200, 500);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
sunLight.shadow.camera.near = 10;
sunLight.shadow.camera.far = 2600;
const dShadow = 90;
sunLight.shadow.camera.left = -dShadow;
sunLight.shadow.camera.right = dShadow;
sunLight.shadow.camera.top = dShadow;
sunLight.shadow.camera.bottom = -dShadow;
scene.add(sunLight);

// ==========================================
// REALISTIC SINGLE-PASS SKY, OCEAN & VOLCANIC ISLANDS
// ==========================================
const envSystem = createRealisticEnvironment(scene, renderer);

function setAtmosphere(atmosConfig) {
  const {
    sunElevation = 24,
    sunIntensity = 2.6,
    ambientIntensity = 0.9
  } = atmosConfig;

  const sunVec = envSystem.setAtmosphere(atmosConfig);

  sunLight.position.copy(sunVec).multiplyScalar(1400);
  sunLight.intensity = sunIntensity;
  sunLight.color.setHex(sunElevation < 6 ? 0xff9d5c : 0xfff5e4);
  ambientLight.intensity = ambientIntensity;
}

// Initialize Default Atmosphere
setAtmosphere(CARRIER_STAGES[1]);

// Carrier Instance in Scene
const carrierGroup = createCarrierGroup();
scene.add(carrierGroup);

// Sky Glide-Slope Approach Boxes Group (Carrier Mode)
const glideBoxesGroup = new THREE.Group();
scene.add(glideBoxesGroup);

// Arrestor Cable Stretch Line (when trapped on deck)
const trapLineGeo = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(-17, 20.3, 75),
  new THREE.Vector3(0, 20.3, 75),
  new THREE.Vector3(17, 20.3, 75)
]);
const trapLineMat = new THREE.LineBasicMaterial({ color: 0x24f07d, linewidth: 3 });
const trapLineMesh = new THREE.Line(trapLineGeo, trapLineMat);
trapLineMesh.visible = false;
carrierGroup.add(trapLineMesh);

// ==========================================
// RUNTIME STATE OBJECT
// ==========================================
const keys = {};
const game = {
  state: 'HANGAR', // 'HANGAR' | 'COMBAT' | 'CARRIER' | 'DEBRIEF'
  cameraMode: 'CHASE', // 'CHASE' | 'COCKPIT'
  showGlideBoxes: true,
  carrierStage: 1,
  wave: 1,
  score: 0,
  kills: 0,
  wavePauseTimer: 0,
  lsoLastCallTime: 0,
  lastTowerBuzzTime: 0,
  cameraShake: 0,
  breakPassedBow: false,

  player: {
    mesh: null,
    config: JET_CONFIGS[saveData.selectedJet],
    pos: new THREE.Vector3(0, 21.35, 45),
    vel: new THREE.Vector3(0, 0, -1),
    quat: new THREE.Quaternion(),
    pitch: 0,
    roll: 0,
    yaw: 0,
    speedKts: 0,
    throttle: 0.72,
    hull: 100,
    gearDown: true,
    missiles: 8,
    flares: 12,
    gunCooldown: 0,
    missileCooldown: 0,
    flareCooldown: 0,
    gLoad: 1.0,
    aoaDeg: 3.5,
    verticalSpeedFps: 0,
    trappedWire: null,
    trapProgress: 0,
    lockedTarget: null,
    lockProgress: 0,
    seekingTarget: null
  },

  enemies: [],
  bullets: [],
  missiles: [],
  flares: [],
  particles: []
};

// Build Initial Player Jet Mesh
function rebuildPlayerJetMesh(jetId) {
  if (game.player.mesh) {
    scene.remove(game.player.mesh);
  }
  const config = JET_CONFIGS[jetId] || JET_CONFIGS.f18;
  game.player.config = config;
  game.player.mesh = createJetMesh(config.id);
  scene.add(game.player.mesh);
}
rebuildPlayerJetMesh(saveData.selectedJet);

// ==========================================
// GLIDE-SLOPE SKY BOXES BUILDER
// ==========================================
function rebuildGlideSlopeBoxes(overheadBreak = false) {
  while (glideBoxesGroup.children.length > 0) {
    glideBoxesGroup.remove(glideBoxesGroup.children[0]);
  }

  const boxMat = new THREE.LineBasicMaterial({
    color: 0x24f07d,
    transparent: true,
    opacity: 0.68
  });

  // Target touchdown on carrier is (0, 20.0, 75) in carrier-local coordinates
  // Standard 3.5-degree glide slope: tan(3.5 deg) = 0.06116
  const slope = Math.tan(THREE.MathUtils.degToRad(3.5));
  const distances = [260, 460, 680, 920, 1180, 1450];

  for (const distFromTouchdown of distances) {
    const zLocal = 75 + distFromTouchdown;
    const yLocal = 20.0 + distFromTouchdown * slope;
    const w = 22 + distFromTouchdown * 0.012;
    const h = 13 + distFromTouchdown * 0.008;

    const pts = [
      new THREE.Vector3(-w, -h, 0),
      new THREE.Vector3(w, -h, 0),
      new THREE.Vector3(w, h, 0),
      new THREE.Vector3(-w, h, 0),
      new THREE.Vector3(-w, -h, 0)
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const frame = new THREE.Line(geo, boxMat);
    frame.position.set(0, yLocal, zLocal);
    glideBoxesGroup.add(frame);
  }

  // If Stage 3 Case I Overhead Break, add amber turn-gate boxes showing the break path
  if (overheadBreak) {
    const breakMat = new THREE.LineBasicMaterial({ color: 0xf5a623 });
    const breakWaypoints = [
      { pos: new THREE.Vector3(120, 240, -220), rotY: 0 },
      { pos: new THREE.Vector3(0, 225, -480), rotY: Math.PI * 0.45 },
      { pos: new THREE.Vector3(-280, 205, -220), rotY: Math.PI * 0.85 },
      { pos: new THREE.Vector3(-340, 185, 450), rotY: Math.PI },
      { pos: new THREE.Vector3(-240, 155, 1150), rotY: -Math.PI * 0.65 }
    ];
    for (const wp of breakWaypoints) {
      const w = 32;
      const h = 20;
      const pts = [
        new THREE.Vector3(-w, -h, 0),
        new THREE.Vector3(w, -h, 0),
        new THREE.Vector3(w, h, 0),
        new THREE.Vector3(-w, h, 0),
        new THREE.Vector3(-w, -h, 0)
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const gate = new THREE.Line(geo, breakMat);
      gate.position.copy(wp.pos);
      gate.rotation.y = wp.rotY;
      glideBoxesGroup.add(gate);
    }
  }
}

// ==========================================
// CLEAR ENTITIES HELPER
// ==========================================
function clearCombatEntities() {
  for (const e of game.enemies) scene.remove(e.mesh);
  for (const b of game.bullets) scene.remove(b.mesh);
  for (const m of game.missiles) scene.remove(m.mesh);
  for (const f of game.flares) scene.remove(f.mesh);
  for (const p of game.particles) scene.remove(p.mesh);

  game.enemies = [];
  game.bullets = [];
  game.missiles = [];
  game.flares = [];
  game.particles = [];
  trapLineMesh.visible = false;
}

// ==========================================
// START MODE 1: AIR-TO-AIR WAVE SURVIVAL
// ==========================================
function startCombatMode() {
  sound.init();
  sound.setMusicMode('dangerzone');
  clearCombatEntities();

  game.state = 'COMBAT';
  game.wave = 1;
  game.score = 0;
  game.kills = 0;
  game.wavePauseTimer = 0;

  // Set crisp high-altitude combat atmosphere
  setAtmosphere({
    sunElevation: 28,
    sunAzimuth: 150,
    turbidity: 2.8,
    rayleigh: 1.75,
    fogColor: 0x8fbce0,
    fogDensity: 0.00008,
    waterColor: 0x002b4d,
    sunIntensity: 2.7,
    ambientIntensity: 0.95
  });

  carrierGroup.position.set(0, 0, 0);
  carrierGroup.rotation.set(0, 0, 0);
  glideBoxesGroup.visible = false;

  const cfg = game.player.config;
  const p = game.player;
  p.pos.set(0, 420, 350);
  p.pitch = 0.03;
  p.roll = 0;
  p.yaw = 0;
  p.quat.setFromEuler(new THREE.Euler(p.pitch, p.yaw, p.roll, 'YXZ'));
  p.speedKts = cfg.cruiseSpeedKts;
  p.throttle = 0.76;
  p.hull = 100;
  p.gearDown = false;
  p.missiles = cfg.missiles;
  p.flares = cfg.flares;
  p.trappedWire = null;
  p.lockedTarget = null;
  p.lockProgress = 0;

  updateUIOverlays();
  spawnCombatWave(1);
  sound.speakRadio(
    'RIO GOOSE',
    `Talk to me, ${saveData.callsign}! Welcome to the Danger Zone—MiG-28s inbound, weapons free!`,
    true
  );
}

function spawnCombatWave(waveNum) {
  game.wave = waveNum;
  const isBossWave = waveNum % 3 === 0;
  const fighterCount = 2 + Math.min(5, waveNum);
  const bomberCount = waveNum >= 2 ? Math.floor(waveNum / 2) : 0;
  const aceCount = isBossWave ? 2 : waveNum >= 4 ? 1 : 0;

  const spawnList = [];
  for (let i = 0; i < fighterCount; i++) spawnList.push('mig29');
  for (let i = 0; i < bomberCount; i++) spawnList.push('bomber');
  for (let i = 0; i < aceCount; i++) spawnList.push('su33');

  spawnList.forEach((type, idx) => {
    const angle = (idx / spawnList.length) * Math.PI * 1.4 - Math.PI * 0.7;
    const dist = 1500 + (idx % 3) * 420;
    const spawnPos = new THREE.Vector3(
      game.player.pos.x + Math.sin(angle) * dist,
      360 + (idx % 4) * 95,
      game.player.pos.z - Math.cos(angle) * dist
    );

    const mesh = createJetMesh(type);
    mesh.position.copy(spawnPos);
    scene.add(mesh);

    const isAce = type === 'su33';
    const isBomber = type === 'bomber';

    game.enemies.push({
      id: `${waveNum}-${idx}-${performance.now()}`,
      type,
      label: isAce ? 'SU-57 FELON ACE' : isBomber ? 'TU-22M BOMBER' : 'MIG-28 AGGRESSOR',
      mesh,
      pos: spawnPos,
      vel: new THREE.Vector3(0, 0, 1),
      quat: new THREE.Quaternion(),
      speedKts: isAce ? 345 : isBomber ? 245 : 305,
      turnRate: isAce ? 1.55 : isBomber ? 0.62 : 1.15,
      hp: isAce ? 160 : isBomber ? 220 : 100,
      maxHp: isAce ? 160 : isBomber ? 220 : 100,
      missileTimer: 5.5 + idx * 2.4,
      gunTimer: 1.5 + Math.random() * 2.0,
      evadeTimer: 0
    });
  });

  game.player.lockedTarget = game.enemies[0] || null;
  game.player.lockProgress = 0;
}

// ==========================================
// START MODE 2: CARRIER LANDING CHALLENGE
// ==========================================
function startCarrierStage(stageNum) {
  sound.init();
  sound.setMusicMode('anthem');
  clearCombatEntities();

  const stage = CARRIER_STAGES[stageNum] || CARRIER_STAGES[1];
  game.state = 'CARRIER';
  game.carrierStage = stage.id;
  game.breakPassedBow = false;

  setAtmosphere(stage);

  carrierGroup.position.set(0, 0, 0);
  carrierGroup.rotation.set(0, 0, 0);

  rebuildGlideSlopeBoxes(stage.overheadBreak);
  glideBoxesGroup.visible = game.showGlideBoxes;

  const cfg = game.player.config;
  const p = game.player;
  p.pos.copy(stage.startPos);
  p.pitch = stage.overheadBreak ? 0.0 : -0.04;
  p.roll = 0;
  p.yaw = stage.startYaw;
  p.quat.setFromEuler(new THREE.Euler(p.pitch, p.yaw, p.roll, 'YXZ'));
  p.speedKts = stage.startSpeedKts;
  p.throttle = stage.overheadBreak ? 0.75 : 0.43;
  p.hull = 100;
  p.gearDown = stage.startGearDown;
  p.missiles = cfg.missiles;
  p.flares = cfg.flares;
  p.trappedWire = null;
  p.trapProgress = 0;
  p.lockedTarget = null;
  p.lockProgress = 0;

  updateUIOverlays();

  if (stage.overheadBreak) {
    sound.speakRadio(
      'LSO PADDLES',
      `${saveData.callsign}, Case One overhead break! Pass the carrier bow at 800 feet, break left 180 degrees, drop gear and hook!`,
      true
    );
  } else {
    sound.speakRadio(
      'LSO PADDLES',
      `${saveData.callsign}, three-quarter mile, call the ball! Target speed ${cfg.idealApproachKts} knots for the three-wire.`,
      true
    );
  }
}

// ==========================================
// WEAPONS, FLARES & EXPLOSIONS
// ==========================================
const bulletGeo = new THREE.BoxGeometry(0.18, 0.18, 4.5);
const playerBulletMat = new THREE.MeshBasicMaterial({ color: 0xfff066 });
const enemyBulletMat = new THREE.MeshBasicMaterial({ color: 0xff4433 });

function firePlayerCannon() {
  const p = game.player;
  if (p.gunCooldown > 0) return;
  p.gunCooldown = 0.065;
  sound.playGunShot();

  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(p.quat).normalize();
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(p.quat).normalize();
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(p.quat).normalize();

  for (const side of [-0.85, 0.85]) {
    const mesh = new THREE.Mesh(bulletGeo, playerBulletMat);
    const spawnPos = p.pos
      .clone()
      .addScaledVector(forward, 7.5)
      .addScaledVector(right, side)
      .addScaledVector(up, -0.2);

    mesh.position.copy(spawnPos);
    mesh.quaternion.copy(p.quat);
    scene.add(mesh);

    const speedMps = p.speedKts * 0.5144 + 620;
    game.bullets.push({
      mesh,
      pos: spawnPos,
      vel: forward.clone().multiplyScalar(speedMps),
      isPlayer: true,
      ttl: 1.8
    });
  }
}

function firePlayerMissile() {
  const p = game.player;
  if (p.missiles <= 0 || p.missileCooldown > 0) return;
  p.missiles -= 1;
  p.missileCooldown = 0.65;

  sound.playMissileLaunch();
  const isLocked = p.lockProgress >= 1.0 && p.lockedTarget && p.lockedTarget.hp > 0;
  sound.speakRadio(
    'AWACS SKYEYE',
    isLocked ? `${saveData.callsign}, Fox Two! Missile tracking!` : 'Fox Two—missile away!',
    false
  );

  const mGroup = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 3.2, 8).rotateX(Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  const flame = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffaa22 })
  );
  flame.position.set(0, 0, 1.8);
  mGroup.add(body, flame);

  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(p.quat).normalize();
  const sideOffset = (p.missiles % 2 === 0 ? 1 : -1) * 2.8;
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(p.quat).normalize();

  const spawnPos = p.pos.clone().addScaledVector(right, sideOffset).addScaledVector(forward, 2.0);
  mGroup.position.copy(spawnPos);
  mGroup.quaternion.copy(p.quat);
  scene.add(mGroup);

  game.missiles.push({
    mesh: mGroup,
    pos: spawnPos,
    vel: forward.clone().multiplyScalar(p.speedKts * 0.5144 + 290),
    quat: p.quat.clone(),
    target: isLocked ? p.lockedTarget : null,
    isPlayer: true,
    speedMps: 380,
    turnRate: isLocked ? 3.4 : 0.0,
    ttl: 7.5
  });
}

function fireEnemyMissile(enemy) {
  const toPlayer = game.player.pos.clone().sub(enemy.pos);
  const dist = toPlayer.length();
  if (dist > 2100 || dist < 180) return;

  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(enemy.quat).normalize();
  if (forward.dot(toPlayer.normalize()) < 0.65) return;

  const mGroup = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 3.2, 8).rotateX(Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xff3b47 })
  );
  mGroup.add(body);
  mGroup.position.copy(enemy.pos);
  mGroup.quaternion.copy(enemy.quat);
  scene.add(mGroup);

  game.missiles.push({
    mesh: mGroup,
    pos: enemy.pos.clone(),
    vel: forward.clone().multiplyScalar(280),
    quat: enemy.quat.clone(),
    target: game.player,
    isPlayer: false,
    speedMps: 295,
    turnRate: 1.95,
    ttl: 6.5,
    spoofedByFlare: null
  });

  sound.speakRadio('AWACS SKYEYE', 'Warning! Bandit missile launch! Press G for flares!', false);
}

function deployPlayerFlares() {
  const p = game.player;
  if (p.flares <= 0 || p.flareCooldown > 0) return;
  p.flares -= 1;
  p.flareCooldown = 0.45;
  sound.playFlare();

  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(p.quat).normalize();
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(p.quat).normalize();

  for (const side of [-1, 1]) {
    const flareMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xfff088 })
    );
    const fPos = p.pos.clone().addScaledVector(right, side * 1.8).addScaledVector(up, -0.8);
    flareMesh.position.copy(fPos);
    scene.add(flareMesh);

    const fVel = p.vel
      .clone()
      .multiplyScalar(0.5)
      .addScaledVector(right, side * 18)
      .addScaledVector(up, -14);

    const flareObj = {
      mesh: flareMesh,
      pos: fPos,
      vel: fVel,
      ttl: 3.2
    };
    game.flares.push(flareObj);

    // Divert any incoming enemy missiles toward this flare decoy!
    for (const m of game.missiles) {
      if (!m.isPlayer && !m.spoofedByFlare) {
        m.spoofedByFlare = flareObj;
      }
    }
  }
}

function spawnExplosion(pos, scale = 1.0, colorHex = 0xff7722) {
  sound.playExplosion(scale);
  const count = Math.floor(16 * scale);
  for (let i = 0; i < count; i++) {
    const pMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.9 + Math.random() * 1.9 * scale, 6, 6),
      new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? colorHex : 0xffcc44,
        transparent: true,
        opacity: 0.92,
        blending: THREE.AdditiveBlending
      })
    );
    pMesh.position.copy(pos);
    scene.add(pMesh);

    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 65 * scale,
      (Math.random() - 0.3) * 65 * scale,
      (Math.random() - 0.5) * 65 * scale
    );
    game.particles.push({
      mesh: pMesh,
      pos: pos.clone(),
      vel,
      ttl: 0.65 + Math.random() * 0.55,
      maxTtl: 1.1
    });
  }
}

function spawnSmokePuff(pos, size = 0.55, colorHex = 0xdce6f2, ttl = 0.55) {
  const sMesh = new THREE.Mesh(
    new THREE.SphereGeometry(size, 5, 5),
    new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.42
    })
  );
  sMesh.position.copy(pos);
  scene.add(sMesh);
  game.particles.push({
    mesh: sMesh,
    pos: pos.clone(),
    vel: new THREE.Vector3(0, 1.5, 0),
    ttl,
    maxTtl: ttl
  });
}

// ==========================================
// PHYSICS & SIMULATION STEP
// ==========================================
let pitchInvertStick = true; // True = ArrowDown pulls nose UP (flight stick); press [I] to toggle

function updateSimulation(dt) {
  const nowSec = performance.now() * 0.001;

  // Advance Carrier Radar Spinner
  if (carrierGroup.userData.radarSpinner) {
    carrierGroup.userData.radarSpinner.rotation.y += dt * 1.8;
  }

  // Hangar Showcase Mode
  if (game.state === 'HANGAR') {
    sound.updateEngine(0, false);
    sound.updateSeekerTone('off');
    carrierGroup.position.set(0, 0, 0);
    carrierGroup.rotation.set(0, 0, 0);

    const p = game.player;
    p.pos.set(0, 21.38, 65);
    p.quat.setFromEuler(new THREE.Euler(0.02, nowSec * 0.45, 0, 'YXZ'));
    p.mesh.position.copy(p.pos);
    p.mesh.quaternion.copy(p.quat);
    updateJetVisuals(p.mesh, 380, 0.86, true, Math.sin(nowSec * 1.5) * 0.3, Math.cos(nowSec * 1.2) * 0.3);

    camera.position.set(Math.sin(nowSec * 0.25) * 16.5, 24.8, 84);
    camera.lookAt(0, 21.6, 65);
    return;
  }

  if (game.state === 'DEBRIEF') {
    sound.updateEngine(0, false);
    sound.updateSeekerTone('off');
    return;
  }

  const p = game.player;
  const cfg = p.config;

  // Cooldowns
  p.gunCooldown = Math.max(0, p.gunCooldown - dt);
  p.missileCooldown = Math.max(0, p.missileCooldown - dt);
  p.flareCooldown = Math.max(0, p.flareCooldown - dt);

  // Update Carrier Motion in Carrier Mode
  const stage = CARRIER_STAGES[game.carrierStage] || CARRIER_STAGES[1];
  if (game.state === 'CARRIER') {
    carrierGroup.position.z -= stage.carrierSpeedMps * dt;
    if (stage.deckPitchAmp > 0) {
      carrierGroup.rotation.x = Math.sin(nowSec * 1.35) * stage.deckPitchAmp;
      carrierGroup.rotation.z = Math.cos(nowSec * 1.05) * (stage.deckPitchAmp * 0.65);
    }
    glideBoxesGroup.position.copy(carrierGroup.position);
    glideBoxesGroup.rotation.copy(carrierGroup.rotation);
  }

  // Check if Player is Trapped on Carrier Wire (Decelerating on Deck)
  if (p.trappedWire !== null) {
    p.trapProgress += dt;
    p.speedKts = Math.max(0, p.speedKts - 98 * dt);
    p.throttle = 0;
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(p.quat).normalize();
    const deckMoveZ = game.state === 'CARRIER' ? -stage.carrierSpeedMps * dt : 0;
    p.pos.addScaledVector(forward, p.speedKts * 0.5144 * dt);
    p.pos.z += deckMoveZ;
    p.pos.y = carrierGroup.userData.deckY + 1.36;
    p.mesh.position.copy(p.pos);
    updateJetVisuals(p.mesh, p.speedKts, 0, true, 0, 0);

    // Update stretched arrestor wire line from port/starboard sheaves to tailhook
    const wireZ = carrierGroup.userData.wirePositionsZ[p.trappedWire - 1];
    const localHookZ = p.pos.z - carrierGroup.position.z + 4.8;
    const posArr = trapLineGeo.attributes.position;
    posArr.setXYZ(0, -17, 20.25, wireZ);
    posArr.setXYZ(1, p.pos.x, 20.35, localHookZ);
    posArr.setXYZ(2, 17, 20.25, wireZ);
    posArr.needsUpdate = true;
    trapLineMesh.visible = true;

    if (p.speedKts <= 1 || p.trapProgress > 2.2) {
      finishCarrierTrap();
    }
    updateCamera(dt);
    return;
  }

  // ==========================================
  // KEYBOARD FLIGHT CONTROLS (ARCADE-PLUS)
  // ==========================================
  // Throttle: W / S
  if (keys['KeyW']) {
    p.throttle = Math.min(1.0, p.throttle + 0.42 * dt);
  } else if (keys['KeyS']) {
    p.throttle = Math.max(0.05, p.throttle - 0.48 * dt);
  }

  // Target Airspeed based on Throttle, Gear Drag, and Pitch Climb/Dive
  const maxSpd = p.gearDown ? Math.min(265, cfg.maxSpeedKts * 0.45) : cfg.maxSpeedKts;
  const minSpd = cfg.minSpeedKts;
  const targetSpd = minSpd + p.throttle * (maxSpd - minSpd) - Math.sin(p.pitch) * 48;
  p.speedKts += (targetSpd - p.speedKts) * Math.min(1, dt * 2.2);
  p.speedKts = Math.max(minSpd * 0.92, Math.min(cfg.maxSpeedKts * 1.05, p.speedKts));

  sound.updateEngine(p.throttle, true);

  // Pitch, Roll, Yaw Inputs
  let pitchInput = 0;
  if (keys['ArrowDown']) pitchInput += pitchInvertStick ? 1 : -1;
  if (keys['ArrowUp']) pitchInput += pitchInvertStick ? -1 : 1;

  let rollInput = 0;
  if (keys['ArrowLeft']) rollInput += 1;
  if (keys['ArrowRight']) rollInput -= 1;

  let yawInput = 0;
  if (keys['KeyA']) yawInput += 1;
  if (keys['KeyD']) yawInput -= 1;

  // Apply Angular Rotations in Local Aircraft Frame
  const dPitch = pitchInput * cfg.pitchRate * dt;
  const dRoll = rollInput * cfg.rollRate * dt;
  const dYaw = yawInput * cfg.yawRate * dt;

  const qDelta = new THREE.Quaternion().setFromEuler(new THREE.Euler(dPitch, dYaw, dRoll, 'YXZ'));
  p.quat.multiply(qDelta).normalize();

  // Extract Euler Angles to apply Arcade-Plus Bank-to-Turn & Gentle Auto-Leveling
  const euler = new THREE.Euler().setFromQuaternion(p.quat, 'YXZ');
  p.pitch = THREE.MathUtils.clamp(euler.x, -Math.PI * 0.46, Math.PI * 0.46);
  p.yaw = euler.y;
  p.roll = euler.z;

  // Natural Coordinated Turn: Banking rolls the nose smoothly into the turn
  const bankTurnRate = Math.sin(p.roll) * 0.62 * dt;
  p.yaw += bankTurnRate;

  // Gentle Auto-Leveling when no Roll key is pressed and bank is mild (< 25 deg)
  if (rollInput === 0 && Math.abs(p.roll) < 0.45) {
    p.roll *= Math.pow(0.18, dt);
  }
  // Gentle Pitch Stabilization toward level/glide slope when no Pitch key pressed
  if (pitchInput === 0 && Math.abs(p.roll) < 0.35) {
    const restPitch = game.state === 'CARRIER' && p.gearDown ? -0.052 : 0.0;
    p.pitch += (restPitch - p.pitch) * Math.min(1, dt * 0.75);
  }

  p.quat.setFromEuler(new THREE.Euler(p.pitch, p.yaw, p.roll, 'YXZ'));

  // Compute G-Load & Angle of Attack (AoA)
  p.gLoad = +(1.0 + pitchInput * (p.speedKts / 145) * 3.2 + Math.abs(Math.sin(p.roll)) * 1.1).toFixed(1);
  const idealSpd = cfg.idealApproachKts;
  p.aoaDeg = +(8.1 + (idealSpd - p.speedKts) * 0.14 + pitchInput * 3.5).toFixed(1);

  // Move Player Position
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(p.quat).normalize();
  const speedMps = p.speedKts * 0.5144;
  p.vel.copy(forward).multiplyScalar(speedMps);

  // Add Wind & Turbulence in Carrier Mode
  if (game.state === 'CARRIER') {
    p.vel.add(stage.windVec);
    if (stage.turbulence > 0) {
      p.vel.y += Math.sin(nowSec * 3.7) * stage.turbulence * 3.2;
      p.vel.x += Math.cos(nowSec * 2.9) * stage.turbulence * 2.5;
    }
  }

  const prevY = p.pos.y;
  p.pos.addScaledVector(p.vel, dt);
  p.verticalSpeedFps = ((p.pos.y - prevY) / Math.max(0.001, dt)) * 3.28084;

  p.mesh.position.copy(p.pos);
  p.mesh.quaternion.copy(p.quat);
  updateJetVisuals(p.mesh, p.speedKts, p.throttle, p.gearDown, pitchInput, rollInput);

  // Wingtip Contrails during high-G turns or high speed
  if (Math.abs(p.gLoad) > 2.5 || p.speedKts > 480) {
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(p.quat).normalize();
    for (const side of [-5.8, 5.8]) {
      spawnSmokePuff(p.pos.clone().addScaledVector(right, side), 0.26, 0xe8f4ff, 0.32);
    }
  }

  // Player Weapons Trigger
  if (keys['Space']) {
    firePlayerCannon();
  }

  // Top Gun "Buzz the Tower" Flyby Detection!
  // Carrier Island Tower is at carrierGroup.position + (27, 44, -24)
  const towerWorldPos = new THREE.Vector3(
    carrierGroup.position.x + 27,
    44,
    carrierGroup.position.z - 24
  );
  const distToTower = p.pos.distanceTo(towerWorldPos);
  if (
    distToTower < 115 &&
    p.speedKts >= 340 &&
    nowSec - game.lastTowerBuzzTime > 10.0
  ) {
    game.lastTowerBuzzTime = nowSec;
    game.cameraShake = 0.75;
    sound.playFlybyRoar();
    if (game.state === 'COMBAT') {
      game.score += 250;
      if (game.score > saveData.bestScore) {
        saveData.bestScore = game.score;
        writeSaveData(saveData);
      }
    }
    sound.speakRadio(
      'AIR BOSS TOWER',
      `Negative Ghost Rider, the pattern is full!! (${saveData.callsign} Tower Flyby +250 PTS!)`,
      true
    );
  }

  // Update Projectiles, Missiles, Flares & Particles
  updateProjectilesAndParticles(dt);

  // Mode-Specific Logic
  if (game.state === 'COMBAT') {
    updateCombatMode(dt);
  } else if (game.state === 'CARRIER') {
    updateCarrierApproach(dt);
  }

  // Check Sea / Water Impact
  if (p.pos.y < 1.8) {
    spawnExplosion(p.pos, 1.8);
    if (game.state === 'CARRIER') {
      showDebriefModal({
        badge: 'CARRIER CHALLENGE INCIDENT',
        title: 'RAMP STRIKE / DITCHED AT SEA',
        subtitle: 'Watch your altitude and keep the Meatball centered on approach.',
        metrics: [
          ['STAGE', `STAGE ${game.carrierStage}`],
          ['AIRSPEED', `${Math.round(p.speedKts)} KTS`],
          ['SINK RATE', `${Math.round(Math.abs(p.verticalSpeedFps))} FPS`],
          ['LSO GRADE', 'NO GRADE']
        ],
        canAdvance: false
      });
    } else {
      finishCombatGameOver('SPLASHED IN THE OCEAN');
    }
    return;
  }

  updateCamera(dt);
  updateTelemetryDOM();
}

// ==========================================
// UPDATE PROJECTILES, MISSILES & PARTICLES
// ==========================================
function updateProjectilesAndParticles(dt) {
  const p = game.player;

  // Bullets
  for (let i = game.bullets.length - 1; i >= 0; i--) {
    const b = game.bullets[i];
    b.ttl -= dt;
    b.pos.addScaledVector(b.vel, dt);
    b.mesh.position.copy(b.pos);

    let hit = false;
    if (b.isPlayer) {
      for (const e of game.enemies) {
        const hitRadius = e.type === 'bomber' ? 16 : 11;
        if (b.pos.distanceTo(e.pos) < hitRadius) {
          e.hp -= 24;
          spawnExplosion(b.pos, 0.35);
          hit = true;
          if (e.hp <= 0) {
            destroyEnemy(e);
          }
          break;
        }
      }
    } else if (b.pos.distanceTo(p.pos) < 9.5) {
      p.hull = Math.max(0, p.hull - 6);
      spawnExplosion(b.pos, 0.3);
      hit = true;
      if (p.hull <= 0) {
        spawnExplosion(p.pos, 2.0);
        finishCombatGameOver('SHOT DOWN IN DOGFIGHT');
        return;
      }
    }

    if (hit || b.ttl <= 0 || b.pos.y < 0) {
      scene.remove(b.mesh);
      game.bullets.splice(i, 1);
    }
  }

  // Flares
  for (let i = game.flares.length - 1; i >= 0; i--) {
    const f = game.flares[i];
    f.ttl -= dt;
    f.vel.y -= 9.8 * dt;
    f.pos.addScaledVector(f.vel, dt);
    f.mesh.position.copy(f.pos);
    if (Math.random() < 0.45) {
      spawnSmokePuff(f.pos, 0.65, 0xfff3aa, 0.4);
    }
    if (f.ttl <= 0 || f.pos.y < 0) {
      scene.remove(f.mesh);
      game.flares.splice(i, 1);
    }
  }

  // Missiles
  let incomingEnemyMissile = false;
  for (let i = game.missiles.length - 1; i >= 0; i--) {
    const m = game.missiles[i];
    m.ttl -= dt;

    // Guidance steering
    const targetObj = m.spoofedByFlare || m.target;
    if (targetObj && m.turnRate > 0) {
      const targetPos = targetObj.pos;
      const desiredDir = targetPos.clone().sub(m.pos).normalize();
      const currentDir = m.vel.clone().normalize();
      currentDir.lerp(desiredDir, Math.min(1, m.turnRate * dt)).normalize();
      m.vel.copy(currentDir).multiplyScalar(m.speedMps);
      m.mesh.lookAt(m.pos.clone().add(currentDir));
    }

    m.pos.addScaledVector(m.vel, dt);
    m.mesh.position.copy(m.pos);
    spawnSmokePuff(m.pos, 0.72, 0xe2e8f0, 0.48);

    let detonated = false;
    if (m.isPlayer) {
      for (const e of game.enemies) {
        if (m.pos.distanceTo(e.pos) < 18) {
          e.hp -= 125;
          spawnExplosion(e.pos, 1.35);
          detonated = true;
          if (e.hp <= 0) {
            destroyEnemy(e);
          }
          break;
        }
      }
    } else {
      if (!m.spoofedByFlare) {
        incomingEnemyMissile = true;
      }
      if (m.spoofedByFlare && m.pos.distanceTo(m.spoofedByFlare.pos) < 15) {
        spawnExplosion(m.pos, 0.9, 0xffee55);
        detonated = true;
      } else if (m.pos.distanceTo(p.pos) < 14) {
        p.hull = Math.max(0, p.hull - 34);
        spawnExplosion(p.pos, 1.4);
        detonated = true;
        if (p.hull <= 0) {
          finishCombatGameOver('STRUCK BY ENEMY MISSILE');
          return;
        }
      }
    }

    if (detonated || m.ttl <= 0 || m.pos.y < 0) {
      scene.remove(m.mesh);
      game.missiles.splice(i, 1);
    }
  }

  // Incoming Missile Warning Banner & Audio Beep
  const alertBanner = document.getElementById('alert-warning-banner');
  if (incomingEnemyMissile && game.state === 'COMBAT') {
    alertBanner.classList.remove('hidden');
    sound.playWarningBeep();
  } else {
    alertBanner.classList.add('hidden');
  }

  // Explosion & Smoke Particles
  for (let i = game.particles.length - 1; i >= 0; i--) {
    const pt = game.particles[i];
    pt.ttl -= dt;
    pt.pos.addScaledVector(pt.vel, dt);
    pt.mesh.position.copy(pt.pos);
    pt.mesh.material.opacity = Math.max(0, (pt.ttl / pt.maxTtl) * 0.75);
    if (pt.ttl <= 0) {
      scene.remove(pt.mesh);
      game.particles.splice(i, 1);
    }
  }
}

function destroyEnemy(enemy) {
  const idx = game.enemies.indexOf(enemy);
  if (idx === -1) return;

  spawnExplosion(enemy.pos, enemy.type === 'bomber' ? 2.1 : 1.5);
  scene.remove(enemy.mesh);
  game.enemies.splice(idx, 1);

  const pts = enemy.type === 'su33' ? 500 : enemy.type === 'bomber' ? 350 : 200;
  game.score += pts;
  game.kills += 1;

  if (game.score > saveData.bestScore) {
    saveData.bestScore = game.score;
    writeSaveData(saveData);
  }

  if (game.player.lockedTarget === enemy) {
    game.player.lockedTarget = game.enemies[0] || null;
    game.player.lockProgress = 0;
  }

  const topGunKillQuotes = [
    `Splash one ${enemy.label}! You can be my wingman anytime, ${saveData.callsign}!`,
    `Splash one ${enemy.label}! Come on ${saveData.callsign}, do some of that pilot stuff!`,
    `Target destroyed! Don't think, just do—great shooting, ${saveData.callsign}!`,
    `Splash ${enemy.label}! Too close for missiles, switching to guns!`
  ];
  const quote = topGunKillQuotes[game.kills % topGunKillQuotes.length];
  sound.speakRadio('WINGMAN ICEMAN', quote, false);
}

// ==========================================
// UPDATE MODE 1: AIR-TO-AIR COMBAT AI & SEEKER
// ==========================================
function updateCombatMode(dt) {
  const p = game.player;

  // Check if Wave Cleared
  if (game.enemies.length === 0) {
    sound.updateSeekerTone('off');
    if (game.wavePauseTimer === 0) {
      const nextWave = game.wave + 1;
      if (nextWave > saveData.bestWave) {
        saveData.bestWave = nextWave;
        writeSaveData(saveData);
      }
      p.missiles = p.config.missiles;
      p.flares = p.config.flares;
      p.hull = Math.min(100, p.hull + 35);
      sound.speakRadio(
        'AWACS SKYEYE',
        `Wave ${game.wave} cleared! Missiles & flares replenished, hull repaired. Wave ${nextWave} inbound!`,
        true
      );
    }
    game.wavePauseTimer += dt;
    if (game.wavePauseTimer > 3.2) {
      game.wavePauseTimer = 0;
      spawnCombatWave(game.wave + 1);
    }
    return;
  }

  // Update Enemy AI
  for (const e of game.enemies) {
    const toPlayer = p.pos.clone().sub(e.pos);
    const dist = toPlayer.length();

    const targetPoint = p.pos.clone();
    if (dist < 260) {
      targetPoint.add(new THREE.Vector3(280, 90, 280));
    }
    if (e.pos.y < 140) {
      targetPoint.y = 320;
    }

    const desiredDir = targetPoint.sub(e.pos).normalize();
    const curDir = e.vel.clone().normalize();
    curDir.lerp(desiredDir, Math.min(1, e.turnRate * dt)).normalize();

    const speedMps = e.speedKts * 0.5144;
    e.vel.copy(curDir).multiplyScalar(speedMps);
    e.pos.addScaledVector(e.vel, dt);

    e.mesh.position.copy(e.pos);
    e.mesh.lookAt(e.pos.clone().add(curDir));
    e.quat.copy(e.mesh.quaternion);
    updateJetVisuals(e.mesh, e.speedKts, 0.85, false, 0.2, 0);

    // Enemy Gun Burst when aligned at medium-close range
    e.gunTimer -= dt;
    if (e.gunTimer <= 0 && dist < 680 && curDir.dot(toPlayer.clone().normalize()) > 0.92) {
      e.gunTimer = 1.4 + Math.random() * 1.2;
      const bMesh = new THREE.Mesh(bulletGeo, enemyBulletMat);
      bMesh.position.copy(e.pos);
      bMesh.quaternion.copy(e.quat);
      scene.add(bMesh);
      game.bullets.push({
        mesh: bMesh,
        pos: e.pos.clone(),
        vel: curDir.clone().multiplyScalar(speedMps + 460),
        isPlayer: false,
        ttl: 1.6
      });
    }

    // Enemy Missile Launch
    e.missileTimer -= dt;
    if (e.missileTimer <= 0) {
      e.missileTimer = 8.5 + Math.random() * 5.0;
      fireEnemyMissile(e);
    }
  }

  // Player AIM-9X Seeker Lock-On Calculation
  const playerForward = new THREE.Vector3(0, 0, -1).applyQuaternion(p.quat).normalize();
  let bestCandidate = null;
  let bestDot = 0.84;

  for (const e of game.enemies) {
    const toE = e.pos.clone().sub(p.pos);
    const dist = toE.length();
    if (dist < 2600) {
      const dot = playerForward.dot(toE.normalize());
      if (dot > bestDot) {
        bestDot = dot;
        bestCandidate = e;
      }
    }
  }

  if (bestCandidate && p.missiles > 0) {
    if (p.lockedTarget !== bestCandidate) {
      p.lockedTarget = bestCandidate;
      p.lockProgress = 0;
    }
    p.lockProgress = Math.min(1.0, p.lockProgress + dt / p.config.lockTimeSec);
    sound.updateSeekerTone(p.lockProgress >= 1.0 ? 'locked' : 'seeking');
  } else {
    p.lockProgress = Math.max(0, p.lockProgress - dt * 1.5);
    if (!p.lockedTarget || !game.enemies.includes(p.lockedTarget)) {
      p.lockedTarget = game.enemies[0] || null;
    }
    sound.updateSeekerTone('off');
  }
}

// ==========================================
// UPDATE MODE 2: CARRIER APPROACH, LSO & WIRE TRAP
// ==========================================
function updateCarrierApproach(dt) {
  const p = game.player;
  const stage = CARRIER_STAGES[game.carrierStage] || CARRIER_STAGES[1];

  const relX = p.pos.x - carrierGroup.position.x;
  const relY = p.pos.y - carrierGroup.userData.deckY;
  const relZ = p.pos.z - carrierGroup.position.z;

  if (stage.overheadBreak && !game.breakPassedBow && relZ < -180) {
    game.breakPassedBow = true;
    sound.speakRadio(
      'LSO PADDLES',
      'Good break point! Bank left 180 degrees onto downwind, throttle back and press L for Gear and Hook!',
      true
    );
  }

  const distFromWire3 = relZ - 75;
  const idealSlopeRad = THREE.MathUtils.degToRad(3.5);

  if (distFromWire3 > 20 && distFromWire3 < 1900) {
    const actualAngleRad = Math.atan2(relY, Math.max(10, distFromWire3));
    const glideErrorDeg = THREE.MathUtils.radToDeg(actualAngleRad - idealSlopeRad);
    const ballOffsetY = THREE.MathUtils.clamp(glideErrorDeg * 0.85, -2.0, 2.0);
    carrierGroup.userData.meatballLight3D.position.y = ballOffsetY;

    const now = performance.now();
    if (distFromWire3 < 1300 && distFromWire3 > 95 && now - game.lsoLastCallTime > 4400) {
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(p.quat);
      if (forward.z < -0.7) {
        game.lsoLastCallTime = now;
        if (!p.gearDown && distFromWire3 < 950) {
          sound.speakRadio('LSO PADDLES', 'Check gear! Press L to drop landing gear and tailhook!', true);
        } else if (glideErrorDeg < -0.95) {
          sound.speakRadio('LSO PADDLES', "You're a little low—add power, power!", false);
        } else if (glideErrorDeg > 1.15) {
          sound.speakRadio('LSO PADDLES', "You're high on the glide slope—ease throttle.", false);
        } else if (Math.abs(relX) > 10) {
          sound.speakRadio(
            'LSO PADDLES',
            relX > 0 ? 'Come left for centerline!' : 'Come right for centerline!',
            false
          );
        } else {
          sound.speakRadio('LSO PADDLES', 'On glide slope, looking good—hold the ball!', false);
        }
      }
    }
  }

  if (relY <= 1.65 && relY >= -2.5 && Math.abs(relX) <= 21 && relZ <= 165 && relZ >= -155) {
    const sinkRateFps = Math.abs(p.verticalSpeedFps);

    if (sinkRateFps > 34 || Math.abs(p.roll) > 0.55) {
      spawnExplosion(p.pos, 1.8);
      showDebriefModal({
        badge: 'LSO LANDING INCIDENT',
        title: 'HARD DECK IMPACT',
        subtitle: 'Sink rate or bank angle exceeded structural landing gear limits.',
        metrics: [
          ['SINK RATE', `${Math.round(sinkRateFps)} FPS (MAX 34)`],
          ['APPROACH SPEED', `${Math.round(p.speedKts)} KTS`],
          ['BANK ANGLE', `${Math.round(THREE.MathUtils.radToDeg(Math.abs(p.roll)))}°`],
          ['LSO GRADE', 'WAVE OFF / CRASH']
        ],
        canAdvance: false
      });
      return;
    }

    if (p.gearDown && relZ >= 38 && relZ <= 132 && p.speedKts < 195) {
      const wires = carrierGroup.userData.wirePositionsZ;
      let bestWire = 3;
      let bestDist = Infinity;
      wires.forEach((wz, idx) => {
        const d = Math.abs(relZ - wz);
        if (d < bestDist) {
          bestDist = d;
          bestWire = idx + 1;
        }
      });

      p.trappedWire = bestWire;
      p.trapProgress = 0;
      p.TouchdownMetrics = {
        wire: bestWire,
        speedKts: Math.round(p.speedKts),
        sinkRateFps: Math.round(sinkRateFps),
        centerlineOffsetM: +Math.abs(relX).toFixed(1)
      };

      sound.playWireTrap();
      sound.speakRadio(
        'LSO PADDLES',
        `Trap! Caught the number ${bestWire} wire! Nice work, ${saveData.callsign}!`,
        true
      );
    } else {
      p.pos.y = carrierGroup.userData.deckY + 2.2;
      p.pitch = Math.max(0.08, p.pitch);
      p.throttle = 1.0;
      sound.speakRadio(
        'LSO PADDLES',
        p.gearDown
          ? 'Bolter! Bolter! Missed the wires—full afterburner, climb out and go around!'
          : 'No hook! Press L to lower gear and tailhook!',
        true
      );
    }
  }
}

function finishCarrierTrap() {
  const m = game.player.TouchdownMetrics || {
    wire: 3,
    speedKts: 138,
    sinkRateFps: 10,
    centerlineOffsetM: 1.2
  };

  const spdDiff = Math.abs(m.speedKts - game.player.config.idealApproachKts);
  let grade = 'OK 3-WIRE';
  let subtitle = 'Textbook naval aviator arrestment right on the target #3 wire!';

  if (m.wire === 3 && spdDiff <= 10 && m.centerlineOffsetM <= 5.0) {
    grade = '_OK_ 3-WIRE (GOLD)';
    subtitle = 'Flawless Sierra Hotel pass! Centerline, on-speed, #3 wire!';
  } else if (m.wire === 3) {
    grade = 'OK 3-WIRE';
  } else if (m.wire === 2 || m.wire === 4) {
    grade = `OK ${m.wire}-WIRE`;
    subtitle =
      m.wire === 2
        ? 'Solid trap—settled slightly early on the #2 wire.'
        : 'Solid trap—floated slightly long to the #4 wire.';
  } else {
    grade = '(OK) 1-WIRE';
    subtitle = 'Safe recovery on deck, though dangerously low over the ramp (#1 wire).';
  }

  saveData.stageGrades[game.carrierStage] = grade;
  writeSaveData(saveData);

  showDebriefModal({
    badge: `STAGE ${game.carrierStage} RECOVERY COMPLETE`,
    title: grade,
    subtitle,
    metrics: [
      ['ARRESTOR WIRE', `#${m.wire} WIRE`],
      ['TOUCHDOWN SPEED', `${m.speedKts} KTS`],
      ['SINK RATE', `${m.sinkRateFps} FT/SEC`],
      ['CENTERLINE OFFSET', `${m.centerlineOffsetM} M`]
    ],
    canAdvance: game.carrierStage < 5
  });
}

function finishCombatGameOver(reason) {
  showDebriefModal({
    badge: 'AIR-TO-AIR COMBAT DEBRIEF',
    title: `REACHED WAVE ${game.wave}`,
    subtitle: `${reason} • Bandits Splashed: ${game.kills}`,
    metrics: [
      ['PILOT CALLSIGN', saveData.callsign],
      ['WAVE REACHED', `WAVE ${game.wave}`],
      ['BANDITS SPLASHED', `${game.kills}`],
      ['COMBAT SCORE', `${game.score} PTS`]
    ],
    canAdvance: false
  });
}

// ==========================================
// CAMERA CONTROLLER (CHASE & COCKPIT HUD)
// ==========================================
function updateCamera(dt) {
  const p = game.player;
  if (game.cameraMode === 'COCKPIT') {
    p.mesh.visible = false;
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(p.quat);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(p.quat);
    const camPos = p.pos.clone().addScaledVector(up, 0.85).addScaledVector(forward, 1.5);
    camera.position.copy(camPos);
    camera.quaternion.copy(p.quat);
  } else {
    p.mesh.visible = true;
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(p.quat);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(p.quat);
    const desiredCamPos = p.pos
      .clone()
      .addScaledVector(forward, -22.5)
      .addScaledVector(up, 5.2);

    camera.position.lerp(desiredCamPos, Math.min(1, dt * 11.5));
    const lookTarget = p.pos.clone().addScaledVector(forward, 35);
    camera.lookAt(lookTarget);
  }

  if (game.cameraShake > 0) {
    game.cameraShake = Math.max(0, game.cameraShake - dt * 1.4);
    camera.position.x += (Math.random() - 0.5) * game.cameraShake * 1.2;
    camera.position.y += (Math.random() - 0.5) * game.cameraShake * 1.2;
  }
}

// ==========================================
// 2D AVIONICS HUD CANVAS RENDERER
// ==========================================
function projectWorldToScreen(worldPos) {
  const v = worldPos.clone().project(camera);
  const inFront = v.z < 1.0;
  const x = (v.x * 0.5 + 0.5) * canvasHUD.width;
  const y = (-v.y * 0.5 + 0.5) * canvasHUD.height;
  return { x, y, inFront };
}

function renderAvionicsHUD() {
  const w = canvasHUD.width;
  const h = canvasHUD.height;
  ctxHUD.clearRect(0, 0, w, h);

  if (game.state !== 'COMBAT' && game.state !== 'CARRIER') return;

  const p = game.player;
  const cx = w * 0.5;
  const cy = h * 0.5;

  ctxHUD.save();
  ctxHUD.strokeStyle = '#24f07d';
  ctxHUD.fillStyle = '#24f07d';
  ctxHUD.lineWidth = 1.6;
  ctxHUD.font = '600 13px "JetBrains Mono", monospace';

  // 1. Central Aircraft Bore-Sight Crosshair ("W" Waterline Symbol)
  ctxHUD.beginPath();
  ctxHUD.moveTo(cx - 18, cy);
  ctxHUD.lineTo(cx - 7, cy);
  ctxHUD.lineTo(cx - 3, cy + 5);
  ctxHUD.lineTo(cx, cy);
  ctxHUD.lineTo(cx + 3, cy + 5);
  ctxHUD.lineTo(cx + 7, cy);
  ctxHUD.lineTo(cx + 18, cy);
  ctxHUD.stroke();

  // 2. Velocity Vector (Flight Path Marker)
  const velTarget = p.pos.clone().add(p.vel.clone().normalize().multiplyScalar(200));
  const fpm = projectWorldToScreen(velTarget);
  if (fpm.inFront) {
    const vx = THREE.MathUtils.clamp(fpm.x, cx - 220, cx + 220);
    const vy = THREE.MathUtils.clamp(fpm.y, cy - 180, cy + 180);
    ctxHUD.beginPath();
    ctxHUD.arc(vx, vy, 7, 0, Math.PI * 2);
    ctxHUD.moveTo(vx - 15, vy);
    ctxHUD.lineTo(vx - 7, vy);
    ctxHUD.moveTo(vx + 7, vy);
    ctxHUD.lineTo(vx + 15, vy);
    ctxHUD.moveTo(vx, vy - 7);
    ctxHUD.lineTo(vx, vy - 14);
    ctxHUD.stroke();
  }

  // 3. Pitch Ladder & Artificial Horizon
  ctxHUD.save();
  ctxHUD.translate(cx, cy);
  ctxHUD.rotate(-p.roll);
  const pitchDeg = THREE.MathUtils.radToDeg(p.pitch);
  const pxPerDeg = 5.5;

  for (let deg = -30; deg <= 30; deg += 10) {
    const yOff = (pitchDeg - deg) * pxPerDeg;
    if (Math.abs(yOff) > 135) continue;

    ctxHUD.beginPath();
    if (deg === 0) {
      ctxHUD.moveTo(-85, yOff);
      ctxHUD.lineTo(-24, yOff);
      ctxHUD.moveTo(24, yOff);
      ctxHUD.lineTo(85, yOff);
    } else {
      const tickDir = deg > 0 ? 6 : -6;
      ctxHUD.moveTo(-52, yOff + tickDir);
      ctxHUD.lineTo(-52, yOff);
      ctxHUD.lineTo(-22, yOff);
      ctxHUD.moveTo(22, yOff);
      ctxHUD.lineTo(52, yOff);
      ctxHUD.lineTo(52, yOff + tickDir);
      ctxHUD.fillText(`${deg}`, 57, yOff + 4);
    }
    ctxHUD.stroke();
  }
  ctxHUD.restore();

  // 4. Airspeed Tape & Altitude Tape
  const spdKts = Math.round(p.speedKts);
  const altFt = Math.max(0, Math.round(p.pos.y * 3.28084));

  ctxHUD.strokeRect(cx - 235, cy - 16, 78, 32);
  ctxHUD.font = '700 16px "JetBrains Mono", monospace';
  ctxHUD.fillText(`${spdKts}`, cx - 226, cy + 6);
  ctxHUD.font = '500 11px "JetBrains Mono", monospace';
  ctxHUD.fillText('KTS', cx - 182, cy + 5);

  ctxHUD.strokeRect(cx + 157, cy - 16, 86, 32);
  ctxHUD.font = '700 16px "JetBrains Mono", monospace';
  ctxHUD.fillText(`${altFt}`, cx + 165, cy + 6);
  ctxHUD.font = '500 11px "JetBrains Mono", monospace';
  ctxHUD.fillText('FT', cx + 222, cy + 5);

  // 5. Compass Heading Tape at Top
  const hdgDeg = ((Math.round(THREE.MathUtils.radToDeg(-p.yaw)) % 360) + 360) % 360;
  ctxHUD.strokeRect(cx - 32, 54, 64, 24);
  ctxHUD.font = '700 13px "JetBrains Mono", monospace';
  ctxHUD.fillText(`HDG ${String(hdgDeg).padStart(3, '0')}`, cx - 27, 71);

  // 6. Tactical Radar Minimap
  const radarX = 88;
  const radarY = 128;
  const radarR = 58;
  ctxHUD.fillStyle = 'hsla(212, 42%, 6%, 0.72)';
  ctxHUD.beginPath();
  ctxHUD.arc(radarX, radarY, radarR, 0, Math.PI * 2);
  ctxHUD.fill();
  ctxHUD.strokeStyle = '#24f07d';
  ctxHUD.stroke();

  ctxHUD.strokeStyle = 'hsla(146, 86%, 54%, 0.28)';
  ctxHUD.beginPath();
  ctxHUD.arc(radarX, radarY, radarR * 0.5, 0, Math.PI * 2);
  ctxHUD.moveTo(radarX, radarY);
  ctxHUD.lineTo(radarX - 28, radarY - 48);
  ctxHUD.moveTo(radarX, radarY);
  ctxHUD.lineTo(radarX + 28, radarY - 48);
  ctxHUD.stroke();

  const toCarrier = carrierGroup.position.clone().sub(p.pos);
  const cosY = Math.cos(p.yaw);
  const sinY = Math.sin(p.yaw);
  const cRx = (toCarrier.x * cosY - toCarrier.z * sinY) / 45;
  const cRz = (toCarrier.x * sinY + toCarrier.z * cosY) / 45;
  if (Math.hypot(cRx, cRz) < radarR - 5) {
    ctxHUD.fillStyle = '#38bdf8';
    ctxHUD.fillRect(radarX + cRx - 3, radarY + cRz - 5, 6, 10);
  }

  // Enemies on Radar & 3D Target Reticles (Mode 1: Combat)
  if (game.state === 'COMBAT') {
    ctxHUD.strokeStyle = 'hsla(146, 86%, 54%, 0.35)';
    ctxHUD.beginPath();
    ctxHUD.arc(cx, cy, 145, 0, Math.PI * 2);
    ctxHUD.stroke();

    for (const e of game.enemies) {
      const rel = e.pos.clone().sub(p.pos);
      const rx = (rel.x * cosY - rel.z * sinY) / 45;
      const rz = (rel.x * sinY + rel.z * cosY) / 45;
      const rDist = Math.hypot(rx, rz);
      const clampedRx = rDist > radarR - 5 ? (rx / rDist) * (radarR - 5) : rx;
      const clampedRz = rDist > radarR - 5 ? (rz / rDist) * (radarR - 5) : rz;

      ctxHUD.fillStyle = e === p.lockedTarget ? '#ff3b47' : '#f5a623';
      ctxHUD.beginPath();
      ctxHUD.arc(radarX + clampedRx, radarY + clampedRz, 3.5, 0, Math.PI * 2);
      ctxHUD.fill();

      const scr = projectWorldToScreen(e.pos);
      const distMeters = Math.round(p.pos.distanceTo(e.pos));
      const isLockedTarget = e === p.lockedTarget;

      if (scr.inFront && scr.x >= 20 && scr.x <= w - 20 && scr.y >= 20 && scr.y <= h - 20) {
        const isFullLock = isLockedTarget && p.lockProgress >= 1.0;
        ctxHUD.strokeStyle = isFullLock ? '#ff3b47' : isLockedTarget ? '#f5a623' : '#24f07d';
        ctxHUD.fillStyle = ctxHUD.strokeStyle;
        ctxHUD.lineWidth = isLockedTarget ? 2.0 : 1.4;

        ctxHUD.strokeRect(scr.x - 18, scr.y - 18, 36, 36);
        ctxHUD.font = '600 11px "JetBrains Mono", monospace';
        ctxHUD.fillText(`${e.label} ${distMeters}M`, scr.x - 28, scr.y - 24);

        ctxHUD.fillRect(scr.x - 18, scr.y + 22, 36 * (e.hp / e.maxHp), 3);

        if (isLockedTarget) {
          if (p.lockProgress > 0) {
            ctxHUD.beginPath();
            ctxHUD.arc(scr.x, scr.y, 26, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p.lockProgress);
            ctxHUD.stroke();
          }
          if (isFullLock) {
            ctxHUD.font = '700 12px "JetBrains Mono", monospace';
            ctxHUD.fillText('SHOOT [F]', scr.x - 30, scr.y + 38);
          }

          if (distMeters < 1100) {
            const bulletSpeed = p.speedKts * 0.5144 + 620;
            const timeOfFlight = distMeters / bulletSpeed;
            const leadPos = e.pos.clone().addScaledVector(e.vel, timeOfFlight);
            const leadScr = projectWorldToScreen(leadPos);
            if (leadScr.inFront) {
              ctxHUD.strokeStyle = '#fff066';
              ctxHUD.beginPath();
              ctxHUD.arc(leadScr.x, leadScr.y, 9, 0, Math.PI * 2);
              ctxHUD.moveTo(leadScr.x, leadScr.y);
              ctxHUD.lineTo(scr.x, scr.y);
              ctxHUD.stroke();
            }
          }
        }
      } else if (isLockedTarget) {
        const angle = Math.atan2(
          scr.inFront ? scr.y - cy : cy - scr.y,
          scr.inFront ? scr.x - cx : cx - scr.x
        );
        const arrowR = 175;
        const ax = cx + Math.cos(angle) * arrowR;
        const ay = cy + Math.sin(angle) * arrowR;
        ctxHUD.fillStyle = '#f5a623';
        ctxHUD.beginPath();
        ctxHUD.arc(ax, ay, 6, 0, Math.PI * 2);
        ctxHUD.fill();
        ctxHUD.font = '600 11px "JetBrains Mono", monospace';
        ctxHUD.fillText(`TGT ${distMeters}M`, ax - 28, ay - 10);
      }
    }
  }

  // 7. Carrier Approach IFLOLS "Meatball" & AoA Indexer
  if (game.state === 'CARRIER') {
    const TouchdownWorld = new THREE.Vector3(
      carrierGroup.position.x,
      carrierGroup.userData.deckY,
      carrierGroup.position.z + 75
    );
    const tdScr = projectWorldToScreen(TouchdownWorld);
    if (tdScr.inFront) {
      ctxHUD.strokeStyle = '#38bdf8';
      ctxHUD.strokeRect(tdScr.x - 10, tdScr.y - 10, 20, 20);
      ctxHUD.font = '600 11px "JetBrains Mono", monospace';
      ctxHUD.fillStyle = '#38bdf8';
      ctxHUD.fillText('#3 WIRE', tdScr.x - 22, tdScr.y - 15);
    }

    const olsX = cx - 315;
    const olsY = cy - 75;
    const olsW = 48;
    const olsH = 150;

    ctxHUD.fillStyle = 'hsla(212, 42%, 6%, 0.78)';
    ctxHUD.fillRect(olsX, olsY, olsW, olsH);
    ctxHUD.strokeStyle = 'hsla(206, 30%, 82%, 0.35)';
    ctxHUD.strokeRect(olsX, olsY, olsW, olsH);

    ctxHUD.font = '700 10px "JetBrains Mono", monospace';
    ctxHUD.fillStyle = '#9db2c8';
    ctxHUD.fillText('BALL', olsX + 11, olsY - 6);

    const midY = olsY + olsH * 0.5;
    ctxHUD.strokeStyle = '#24f07d';
    ctxHUD.lineWidth = 3;
    ctxHUD.beginPath();
    ctxHUD.moveTo(olsX + 4, midY);
    ctxHUD.lineTo(olsX + 16, midY);
    ctxHUD.moveTo(olsX + olsW - 16, midY);
    ctxHUD.lineTo(olsX + olsW - 4, midY);
    ctxHUD.stroke();

    const relY = p.pos.y - carrierGroup.userData.deckY;
    const distFromWire3 = p.pos.z - carrierGroup.position.z - 75;
    const actualSlopeDeg = THREE.MathUtils.radToDeg(Math.atan2(relY, Math.max(15, Math.abs(distFromWire3))));
    const slopeErr = THREE.MathUtils.clamp(actualSlopeDeg - 3.5, -2.5, 2.5);
    const ballY = midY - (slopeErr / 2.5) * (olsH * 0.42);

    ctxHUD.fillStyle = Math.abs(slopeErr) < 0.55 ? '#24f07d' : slopeErr < -1.1 ? '#ff3b47' : '#f5a623';
    ctxHUD.beginPath();
    ctxHUD.arc(olsX + olsW * 0.5, ballY, 7, 0, Math.PI * 2);
    ctxHUD.fill();

    const idealSpd = p.config.idealApproachKts;
    const spdDelta = p.speedKts - idealSpd;
    let aoaText = 'ON SPEED';
    let aoaColor = '#24f07d';
    if (spdDelta > 9) {
      aoaText = 'FAST (S)';
      aoaColor = '#f5a623';
    } else if (spdDelta < -8) {
      aoaText = 'SLOW (W)';
      aoaColor = '#ff3b47';
    }
    ctxHUD.fillStyle = aoaColor;
    ctxHUD.font = '700 11px "JetBrains Mono", monospace';
    ctxHUD.fillText(aoaText, olsX - 4, olsY + olsH + 18);
  }

  ctxHUD.restore();
}

// ==========================================
// DOM TELEMETRY & UI HANDLERS (SAFE TEXTCONTENT)
// ==========================================
function updateTelemetryDOM() {
  const p = game.player;
  const throttlePct = Math.round(p.throttle * 100);
  const throttleEl = document.getElementById('hud-throttle-val');
  throttleEl.textContent = p.throttle > 0.85 ? `${throttlePct}% AB` : `${throttlePct}% MIL`;
  throttleEl.className = p.throttle > 0.85 ? 'hud-val warn' : 'hud-val';

  const hullEl = document.getElementById('hud-hull-val');
  hullEl.textContent = `${Math.round(p.hull)}%`;
  hullEl.className = p.hull < 35 ? 'hud-val danger' : p.hull < 65 ? 'hud-val warn' : 'hud-val';

  const gearEl = document.getElementById('hud-gear-val');
  gearEl.textContent = p.gearDown ? 'DOWN & HOOK [L]' : 'UP [L]';
  gearEl.className = p.gearDown ? 'hud-val' : 'hud-val warn';

  const gEl = document.getElementById('hud-g-val');
  gEl.textContent = `${p.gLoad.toFixed(1)}G • ${p.aoaDeg.toFixed(1)}°`;

  const modeLabel = document.getElementById('hud-mode-label');
  const waveVal = document.getElementById('hud-wave-val');
  if (game.state === 'COMBAT') {
    modeLabel.textContent = 'WAVE SURVIVAL';
    waveVal.textContent = `WAVE ${game.wave} • ${game.score} PTS`;
  } else {
    modeLabel.textContent = 'CARRIER TRAP';
    waveVal.textContent = `STAGE ${game.carrierStage} (${p.config.idealApproachKts} KT TGT)`;
  }

  document.getElementById('hud-missile-val').textContent = `${p.missiles} / ${p.config.missiles} [F]`;
  document.getElementById('hud-flare-val').textContent = `${p.flares} [G]`;
}

function updateUIOverlays() {
  const hangarScreen = document.getElementById('hangar-screen');
  const flightUI = document.getElementById('flight-ui');
  const debriefModal = document.getElementById('debrief-modal');
  const abortBtn = document.getElementById('btn-abort-mission');

  document.getElementById('active-callsign-label').textContent = saveData.callsign;
  document.getElementById('active-jet-label').textContent = game.player.config.name;
  document.getElementById('showcase-jet-name').textContent = game.player.config.name;
  document.getElementById('showcase-jet-tagline').textContent = game.player.config.tagline;
  const liveryEl = document.getElementById('showcase-jet-livery');
  if (liveryEl && game.player.config.liveryName) {
    liveryEl.textContent = game.player.config.liveryName;
  }
  document.getElementById('combat-high-score-label').textContent =
    `BEST: WAVE ${saveData.bestWave} • ${saveData.bestScore} PTS`;

  document.querySelectorAll('.preset-pill').forEach((pill) => {
    pill.classList.toggle('active', pill.getAttribute('data-callsign') === saveData.callsign);
  });

  for (let s = 1; s <= 5; s++) {
    const badge = document.getElementById(`badge-stage-${s}`);
    if (badge) {
      const grade = saveData.stageGrades[s];
      badge.textContent = grade || 'UNFLOWN';
      badge.className = grade ? 'stage-grade-badge earned' : 'stage-grade-badge';
    }
  }

  if (game.state === 'HANGAR') {
    hangarScreen.classList.remove('hidden');
    flightUI.classList.add('hidden');
    debriefModal.classList.add('hidden');
    abortBtn.classList.add('hidden');
  } else if (game.state === 'COMBAT' || game.state === 'CARRIER') {
    hangarScreen.classList.add('hidden');
    flightUI.classList.remove('hidden');
    debriefModal.classList.add('hidden');
    abortBtn.classList.remove('hidden');
  }
}

function showDebriefModal({ badge, title, subtitle, metrics, canAdvance }) {
  game.state = 'DEBRIEF';
  sound.updateEngine(0, false);
  sound.updateSeekerTone('off');
  sound.setMusicMode('anthem');

  document.getElementById('debrief-badge').textContent = badge;
  document.getElementById('debrief-title').textContent = title;
  document.getElementById('debrief-subtitle').textContent = subtitle;

  // Build metrics grid safely using createElement and textContent (zero innerHTML)
  const container = document.getElementById('debrief-metrics');
  container.replaceChildren();
  for (const [label, value] of metrics) {
    const cell = document.createElement('div');
    cell.className = 'metric-cell';

    const lblEl = document.createElement('span');
    lblEl.className = 'metric-cell-label';
    lblEl.textContent = label;

    const valEl = document.createElement('span');
    valEl.className = 'metric-cell-value';
    valEl.textContent = value;

    cell.appendChild(lblEl);
    cell.appendChild(valEl);
    container.appendChild(cell);
  }

  const nextBtn = document.getElementById('btn-debrief-next');
  if (canAdvance) {
    nextBtn.classList.remove('hidden');
  } else {
    nextBtn.classList.add('hidden');
  }

  document.getElementById('debrief-modal').classList.remove('hidden');
}

// ==========================================
// EVENT LISTENERS & CONTROLS BINDINGS
// ==========================================
let lastMissionType = 'COMBAT';

function saveCallsignFromInput() {
  const input = document.getElementById('input-pilot-callsign');
  const sanitized = sanitizeCallsign(input.value);
  input.value = sanitized;
  saveData.callsign = sanitized;
  writeSaveData(saveData);
  updateUIOverlays();
}

document.getElementById('btn-save-callsign').addEventListener('click', saveCallsignFromInput);
document.getElementById('input-pilot-callsign').addEventListener('change', saveCallsignFromInput);

// Top Gun Callsign Preset Pills
document.querySelectorAll('.preset-pill').forEach((pill) => {
  pill.addEventListener('click', () => {
    sound.init();
    const cs = pill.getAttribute('data-callsign');
    if (!cs) return;
    const input = document.getElementById('input-pilot-callsign');
    input.value = cs;
    saveCallsignFromInput();
  });
});

document.querySelectorAll('.jet-card').forEach((card) => {
  card.addEventListener('click', () => {
    sound.init();
    const jetId = card.getAttribute('data-jet');
    if (!JET_CONFIGS[jetId]) return;

    document.querySelectorAll('.jet-card').forEach((c) => c.classList.remove('active'));
    card.classList.add('active');

    saveData.selectedJet = jetId;
    writeSaveData(saveData);
    rebuildPlayerJetMesh(jetId);
    updateUIOverlays();
  });
});

document.querySelectorAll('.jet-card').forEach((c) => {
  c.classList.toggle('active', c.getAttribute('data-jet') === saveData.selectedJet);
});
document.getElementById('input-pilot-callsign').value = saveData.callsign;
updateUIOverlays();

document.getElementById('btn-launch-combat').addEventListener('click', () => {
  saveCallsignFromInput();
  lastMissionType = 'COMBAT';
  startCombatMode();
});

document.querySelectorAll('.stage-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    saveCallsignFromInput();
    const stg = Number(btn.getAttribute('data-stage')) || 1;
    lastMissionType = 'CARRIER';
    startCarrierStage(stg);
  });
});

document.getElementById('btn-toggle-music').addEventListener('click', () => {
  sound.init();
  const musicOn = sound.toggleMusic();
  document.getElementById('btn-toggle-music').textContent = musicOn ? 'MUSIC: TOP GUN [B]' : 'MUSIC: OFF [B]';
});

document.getElementById('btn-toggle-camera').addEventListener('click', () => {
  game.cameraMode = game.cameraMode === 'CHASE' ? 'COCKPIT' : 'CHASE';
  document.getElementById('btn-toggle-camera').textContent = `CAM: ${game.cameraMode} [C]`;
});

document.getElementById('btn-toggle-audio').addEventListener('click', () => {
  sound.init();
  const isMuted = sound.toggleMute();
  document.getElementById('btn-toggle-audio').textContent = isMuted ? 'AUDIO: MUTED [M]' : 'AUDIO: ON [M]';
});

document.getElementById('btn-abort-mission').addEventListener('click', () => {
  clearCombatEntities();
  game.state = 'HANGAR';
  game.player.mesh.visible = true;
  sound.setMusicMode('anthem');
  setAtmosphere(CARRIER_STAGES[1]);
  updateUIOverlays();
});

document.getElementById('btn-debrief-retry').addEventListener('click', () => {
  if (lastMissionType === 'CARRIER') {
    startCarrierStage(game.carrierStage);
  } else {
    startCombatMode();
  }
});

document.getElementById('btn-debrief-next').addEventListener('click', () => {
  const nextStg = Math.min(5, game.carrierStage + 1);
  startCarrierStage(nextStg);
});

document.getElementById('btn-debrief-hangar').addEventListener('click', () => {
  clearCombatEntities();
  game.state = 'HANGAR';
  game.player.mesh.visible = true;
  sound.setMusicMode('anthem');
  setAtmosphere(CARRIER_STAGES[1]);
  updateUIOverlays();
});

window.addEventListener('keydown', (e) => {
  if (document.activeElement && document.activeElement.id === 'input-pilot-callsign') {
    if (e.code === 'Enter') {
      saveCallsignFromInput();
      document.activeElement.blur();
    }
    return;
  }

  keys[e.code] = true;

  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
    e.preventDefault();
  }

  if (e.code === 'KeyC') {
    game.cameraMode = game.cameraMode === 'CHASE' ? 'COCKPIT' : 'CHASE';
    document.getElementById('btn-toggle-camera').textContent = `CAM: ${game.cameraMode} [C]`;
  } else if (e.code === 'KeyB') {
    sound.init();
    const musicOn = sound.toggleMusic();
    document.getElementById('btn-toggle-music').textContent = musicOn ? 'MUSIC: TOP GUN [B]' : 'MUSIC: OFF [B]';
  } else if (e.code === 'KeyM') {
    sound.init();
    const isMuted = sound.toggleMute();
    document.getElementById('btn-toggle-audio').textContent = isMuted ? 'AUDIO: MUTED [M]' : 'AUDIO: ON [M]';
  } else if (e.code === 'KeyI') {
    pitchInvertStick = !pitchInvertStick;
    sound.speakRadio(
      'AVIONICS',
      pitchInvertStick ? 'Flight-stick pitch active: Down arrow pulls nose up.' : 'Direct pitch active: Up arrow pitches nose up.',
      true
    );
  } else if (e.code === 'Escape' && (game.state === 'COMBAT' || game.state === 'CARRIER')) {
    clearCombatEntities();
    game.state = 'HANGAR';
    game.player.mesh.visible = true;
    sound.setMusicMode('anthem');
    setAtmosphere(CARRIER_STAGES[1]);
    updateUIOverlays();
  }

  if (game.state === 'COMBAT' || game.state === 'CARRIER') {
    if (e.code === 'KeyF') {
      firePlayerMissile();
    } else if (e.code === 'KeyG') {
      deployPlayerFlares();
    } else if (e.code === 'KeyL') {
      game.player.gearDown = !game.player.gearDown;
      sound.speakRadio(
        'AVIONICS',
        game.player.gearDown ? 'Landing gear and tailhook deployed.' : 'Landing gear retracted.',
        true
      );
    } else if (e.code === 'KeyH') {
      game.showGlideBoxes = !game.showGlideBoxes;
      glideBoxesGroup.visible = game.state === 'CARRIER' && game.showGlideBoxes;
    } else if (e.code === 'KeyT' && game.state === 'COMBAT' && game.enemies.length > 0) {
      const idx = game.enemies.indexOf(game.player.lockedTarget);
      game.player.lockedTarget = game.enemies[(idx + 1) % game.enemies.length];
      game.player.lockProgress = 0;
    }
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

function handleResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  canvasHUD.width = w;
  canvasHUD.height = h;
}
window.addEventListener('resize', handleResize);
handleResize();

// ==========================================
// MAIN ANIMATION LOOP
// ==========================================
let lastFrameTime = performance.now();

function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, (now - lastFrameTime) * 0.001);
  lastFrameTime = now;

  updateSimulation(dt);
  envSystem.update(dt, camera.position, carrierGroup.position);
  renderer.render(scene, camera);
  renderAvionicsHUD();
}

requestAnimationFrame(animate);
