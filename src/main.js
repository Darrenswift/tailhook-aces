import * as THREE from 'three';
import { SoundSystem } from './audio.js';
import {
  JET_CONFIGS,
  createJetMesh,
  updateJetVisuals,
  createCarrierGroup,
  createCockpitInteriorGroup,
  createStrikeTargetMesh
} from './jets.js';
import { createRealisticEnvironment, ISLAND_DEFINITIONS, evaluateIslandCoastMultiplier } from './environment.js';

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
    stageGrades: {},
    strikeGrades: {},
    specopsGrades: {}
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
      stageGrades: typeof parsed.stageGrades === 'object' && parsed.stageGrades ? parsed.stageGrades : {},
      strikeGrades: typeof parsed.strikeGrades === 'object' && parsed.strikeGrades ? parsed.strikeGrades : {},
      specopsGrades: typeof parsed.specopsGrades === 'object' && parsed.specopsGrades ? parsed.specopsGrades : {}
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
// CARRIER CHALLENGE 10-STAGE DEFINITIONS
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
    carrierSpeedMps: 11.5,
    windVec: new THREE.Vector3(10.5, 0, 0),
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
  },
  6: {
    id: 6,
    name: 'STAGE 6: SINGLE-ENGINE FLAMEOUT EMERGENCY',
    sunElevation: 14,
    sunAzimuth: 135,
    turbidity: 6.0,
    rayleigh: 2.3,
    fogColor: 0x7ea6c8,
    fogDensity: 0.00016,
    waterColor: 0x00223e,
    sunIntensity: 2.1,
    ambientIntensity: 0.8,
    carrierSpeedMps: 9.5,
    windVec: new THREE.Vector3(5.0, 0, 0),
    turbulence: 0.22,
    deckPitchAmp: 0.01,
    overheadBreak: false,
    engineFailure: true,
    startPos: new THREE.Vector3(18, 136, 1780),
    startYaw: 0,
    startSpeedKts: 152,
    startGearDown: true
  },
  7: {
    id: 7,
    name: 'STAGE 7: "COBRA" HIGH-SPEED SHORT-FIELD TRAP',
    sunElevation: 26,
    sunAzimuth: 155,
    turbidity: 3.2,
    rayleigh: 1.7,
    fogColor: 0x8fbce0,
    fogDensity: 0.00009,
    waterColor: 0x002d52,
    sunIntensity: 2.7,
    ambientIntensity: 0.92,
    carrierSpeedMps: 11.0,
    windVec: new THREE.Vector3(0, 0, 0),
    turbulence: 0.1,
    deckPitchAmp: 0.005,
    overheadBreak: false,
    cobraEntry: true,
    startPos: new THREE.Vector3(0, 118, 1120),
    startYaw: 0,
    startSpeedKts: 275,
    startGearDown: false
  },
  8: {
    id: 8,
    name: 'STAGE 8: TYPHOON CYCLONE & GUSTING SQUALL',
    sunElevation: 3.8,
    sunAzimuth: 200,
    turbidity: 11.0,
    rayleigh: 3.8,
    fogColor: 0x5c6e82,
    fogDensity: 0.00038,
    waterColor: 0x0a1826,
    sunIntensity: 1.35,
    ambientIntensity: 0.52,
    carrierSpeedMps: 12.0,
    windVec: new THREE.Vector3(-12.5, 0, 5.0),
    turbulence: 0.85,
    deckPitchAmp: 0.036,
    overheadBreak: false,
    windGusting: true,
    startPos: new THREE.Vector3(35, 145, 1920),
    startYaw: 0,
    startSpeedKts: 150,
    startGearDown: true
  },
  9: {
    id: 9,
    name: 'STAGE 9: "BROKEN MEATBALL" LSO TALK-DOWN',
    sunElevation: 5.5,
    sunAzimuth: 175,
    turbidity: 8.5,
    rayleigh: 2.9,
    fogColor: 0xc27a52,
    fogDensity: 0.00024,
    waterColor: 0x102030,
    sunIntensity: 1.75,
    ambientIntensity: 0.62,
    carrierSpeedMps: 10.0,
    windVec: new THREE.Vector3(6.5, 0, 0),
    turbulence: 0.25,
    deckPitchAmp: 0.014,
    overheadBreak: false,
    meatballOut: true,
    startPos: new THREE.Vector3(-15, 134, 1820),
    startYaw: 0,
    startSpeedKts: 142,
    startGearDown: true
  },
  10: {
    id: 10,
    name: 'STAGE 10: EVASIVE S-TURNING CARRIER UNDER FIRE',
    sunElevation: 2.8,
    sunAzimuth: 188,
    turbidity: 9.0,
    rayleigh: 3.2,
    fogColor: 0xc87248,
    fogDensity: 0.0002,
    waterColor: 0x142234,
    sunIntensity: 1.95,
    ambientIntensity: 0.68,
    carrierSpeedMps: 14.0,
    windVec: new THREE.Vector3(-5.0, 0, 0),
    turbulence: 0.35,
    deckPitchAmp: 0.018,
    overheadBreak: false,
    carrierTurning: true,
    startPos: new THREE.Vector3(0, 142, 1950),
    startYaw: 0,
    startSpeedKts: 148,
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
  antialias: true
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
  32000
);

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

setAtmosphere(CARRIER_STAGES[1]);

const carrierGroup = createCarrierGroup();
scene.add(carrierGroup);

const cockpitInteriorGroup = createCockpitInteriorGroup();
cockpitInteriorGroup.visible = false;
scene.add(cockpitInteriorGroup);

const glideBoxesGroup = new THREE.Group();
scene.add(glideBoxesGroup);

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
  state: 'HANGAR', // 'HANGAR' | 'COMBAT' | 'CARRIER' | 'STRIKE' | 'SPECOPS' | 'DEBRIEF'
  cameraMode: 'CHASE', // 'CHASE' | 'COCKPIT' | 'LSO'
  showGlideBoxes: true,
  carrierStage: 1,
  strikeMission: 1,
  specopsMission: 1,
  wave: 1,
  score: 0,
  kills: 0,
  wavePauseTimer: 0,
  lsoLastCallTime: 0,
  lastTowerBuzzTime: 0,
  cameraShake: 0,
  breakPassedBow: false,
  missionStartTime: 0,
  missionPhase: 1,
  radarCeilingTimer: 0,
  carrierHp: 100,
  ringIndex: 0,
  totalRings: 16,

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
    bombs: 6,
    flares: 12,
    gunCooldown: 0,
    missileCooldown: 0,
    bombCooldown: 0,
    flareCooldown: 0,
    gLoad: 1.0,
    aoaDeg: 3.5,
    verticalSpeedFps: 0,
    trappedWire: null,
    trapProgress: 0,
    lockedTarget: null,
    lockProgress: 0
  },

  wingman: null,
  enemies: [],
  groundTargets: [],
  skyRings: [],
  bullets: [],
  missiles: [],
  bombs: [],
  flares: [],
  particles: []
};

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
  if (game.wingman && game.wingman.mesh) {
    scene.remove(game.wingman.mesh);
  }
  game.wingman = null;

  for (const e of game.enemies) scene.remove(e.mesh);
  for (const g of game.groundTargets) scene.remove(g.mesh);
  for (const r of game.skyRings) scene.remove(r.mesh);
  for (const b of game.bullets) scene.remove(b.mesh);
  for (const m of game.missiles) scene.remove(m.mesh);
  for (const bmb of game.bombs) scene.remove(bmb.mesh);
  for (const f of game.flares) scene.remove(f.mesh);
  for (const p of game.particles) scene.remove(p.mesh);

  game.enemies = [];
  game.groundTargets = [];
  game.skyRings = [];
  game.bullets = [];
  game.missiles = [];
  game.bombs = [];
  game.flares = [];
  game.particles = [];
  trapLineMesh.visible = false;
  if (carrierGroup.userData.olsGroup) {
    carrierGroup.userData.olsGroup.visible = true;
  }
}

function resetPlayerForFlight(pos, yaw, speedKts, throttle, gearDown) {
  const cfg = game.player.config;
  const p = game.player;
  p.pos.copy(pos);
  p.pitch = gearDown ? -0.04 : 0.02;
  p.roll = 0;
  p.yaw = yaw;
  p.quat.setFromEuler(new THREE.Euler(p.pitch, p.yaw, p.roll, 'YXZ'));
  p.speedKts = speedKts || cfg.cruiseSpeedKts;
  p.throttle = throttle;
  p.hull = 100;
  p.gearDown = Boolean(gearDown);
  p.missiles = cfg.missiles;
  p.bombs = cfg.bombs || 6;
  p.flares = cfg.flares;
  p.trappedWire = null;
  p.trapProgress = 0;
  p.lockedTarget = null;
  p.lockProgress = 0;
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
  resetPlayerForFlight(new THREE.Vector3(0, 420, 350), 0, cfg.cruiseSpeedKts, 0.76, false);

  updateUIOverlays();
  spawnCombatWave(1);
  const radioCaller = cfg.id === 'f14' ? 'RIO GOOSE' : 'TOPGUN VIPER';
  sound.speakRadio(
    radioCaller,
    `Talk to me, ${saveData.callsign}! Welcome to the Danger Zone—MiG-28s & Su-57s inbound, weapons free!`,
    true
  );
}

function spawnEnemyPlane(type, spawnPos, labelOverride = null) {
  const mesh = createJetMesh(type);
  mesh.position.copy(spawnPos);
  scene.add(mesh);

  const isAce = type === 'su33' || type === 'su57';
  const isBomber = type === 'bomber';
  const isFlanker = type === 'su35';

  const enemyObj = {
    id: `enemy-${performance.now()}-${Math.random()}`,
    type,
    label:
      labelOverride ||
      (isAce
        ? 'SU-57 FELON ACE'
        : isFlanker
        ? 'SU-35 FLANKER-E'
        : isBomber
        ? 'TU-22M BOMBER'
        : 'MIG-28 AGGRESSOR'),
    mesh,
    pos: spawnPos.clone(),
    vel: new THREE.Vector3(0, 0, 1),
    quat: new THREE.Quaternion(),
    speedKts: isAce ? 350 : isFlanker ? 335 : isBomber ? 235 : 305,
    turnRate: isAce ? 1.58 : isFlanker ? 1.42 : isBomber ? 0.58 : 1.15,
    hp: isAce ? 160 : isBomber ? 220 : 100,
    maxHp: isAce ? 160 : isBomber ? 220 : 100,
    missileTimer: 5.5 + Math.random() * 4.0,
    gunTimer: 1.5 + Math.random() * 2.0,
    antiShipRole: isBomber && game.state === 'SPECOPS' && game.specopsMission === 2
  };
  game.enemies.push(enemyObj);
  return enemyObj;
}

function spawnCombatWave(waveNum) {
  game.wave = waveNum;
  const isBossWave = waveNum % 3 === 0;
  const fighterCount = 2 + Math.min(5, waveNum);
  const bomberCount = waveNum >= 2 ? Math.floor(waveNum / 2) : 0;
  const aceCount = isBossWave ? 2 : waveNum >= 3 ? 1 : 0;

  const spawnList = [];
  for (let i = 0; i < fighterCount; i++) spawnList.push(i % 2 === 0 ? 'mig29' : 'su35');
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
    spawnEnemyPlane(type, spawnPos);
  });

  game.player.lockedTarget = game.enemies[0] || null;
  game.player.lockProgress = 0;
}

// ==========================================
// START MODE 2: AIR-TO-GROUND BOMBING STRIKES (3 MISSIONS)
// ==========================================
function spawnGroundTarget(targetType, label, x, y, z, hp = 180, canFireSam = false, movingVel = null) {
  const mesh = createStrikeTargetMesh(targetType);
  mesh.position.set(x, y, z);
  scene.add(mesh);

  const tgt = {
    id: `gt-${performance.now()}-${Math.random()}`,
    isGroundTarget: true,
    targetType,
    label,
    mesh,
    pos: new THREE.Vector3(x, y + 6, z),
    vel: movingVel ? movingVel.clone() : new THREE.Vector3(0, 0, 0),
    hp,
    maxHp: hp,
    canFireSam,
    samTimer: 4.5 + Math.random() * 4.5
  };
  game.groundTargets.push(tgt);
  return tgt;
}

function startStrikeMission(strikeId) {
  sound.init();
  sound.setMusicMode('dangerzone');
  clearCombatEntities();

  game.state = 'STRIKE';
  game.strikeMission = strikeId;
  game.missionPhase = 1;
  game.score = 0;
  game.kills = 0;
  game.radarCeilingTimer = 0;
  game.missionStartTime = performance.now() * 0.001;

  carrierGroup.position.set(0, 0, 0);
  carrierGroup.rotation.set(0, 0, 0);
  glideBoxesGroup.visible = false;

  const cfg = game.player.config;

  if (strikeId === 1) {
    // Strike 1: Operation Maverick Canyon ("Uranium Bunker Run")
    // Island 0 is at (-2500, -2100). Place the Uranium Reactor Bunker on its southern coastal shelf (-2500, -1620)
    setAtmosphere({
      sunElevation: 18,
      sunAzimuth: 140,
      turbidity: 3.5,
      fogDensity: 0.0001,
      waterColor: 0x002b4d,
      sunIntensity: 2.5,
      ambientIntensity: 0.9
    });

    resetPlayerForFlight(new THREE.Vector3(-1250, 165, -350), 0.66, cfg.cruiseSpeedKts, 0.78, false);
    // Double bomb load for canyon run
    game.player.bombs = Math.max(8, cfg.bombs);

    // Primary Uranium Bunker Target + 2 Flanking S-400 SAM Batteries
    const bunker = spawnGroundTarget('bunker', 'URANIUM REACTOR BUNKER', -2500, 12, -1610, 200, false);
    spawnGroundTarget('sam', 'CRATER SAM BATTERY WEST', -2660, 14, -1690, 100, true);
    spawnGroundTarget('sam', 'CRATER SAM BATTERY EAST', -2340, 14, -1690, 100, true);

    game.player.lockedTarget = bunker;
    sound.speakRadio(
      'TOPGUN MAVERICK',
      `${saveData.callsign}, stay BELOW 850 feet radar ceiling! Align the green CCIP Bombing Pipper on the Uranium Reactor Bunker and press [V] to drop JDAMs!`,
      true
    );
  } else if (strikeId === 2) {
    // Strike 2: Island SEAD & SAM Suppression (6 Ground Targets across Islands)
    setAtmosphere({
      sunElevation: 26,
      sunAzimuth: 155,
      turbidity: 3.0,
      fogDensity: 0.00009,
      waterColor: 0x003056,
      sunIntensity: 2.7,
      ambientIntensity: 0.92
    });

    resetPlayerForFlight(new THREE.Vector3(1100, 290, -350), -0.72, cfg.cruiseSpeedKts, 0.78, false);
    game.player.bombs = Math.max(10, cfg.bombs + 4);

    // 6 Fortified Targets around Island 1 (x: 2800, z: -1750)
    spawnGroundTarget('radar', 'EW RADAR DOME ALPHA', 2380, 11, -1380, 120, false);
    spawnGroundTarget('sam', 'S-400 SAM SITE NORTH', 2520, 12, -1280, 110, true);
    spawnGroundTarget('depot', 'FUEL DEPOT COMPLEX 1', 2260, 10, -1550, 110, false);
    spawnGroundTarget('radar', 'EW RADAR DOME BRAVO', 3180, 11, -1420, 120, false);
    spawnGroundTarget('sam', 'S-400 SAM SITE SOUTH', 2980, 12, -1240, 110, true);
    spawnGroundTarget('depot', 'MUNITIONS DEPOT 2', 3250, 10, -1680, 110, false);

    // 2 Defending MiG-28 CAP Fighters
    spawnEnemyPlane('mig29', new THREE.Vector3(2450, 420, -1400));
    spawnEnemyPlane('mig29', new THREE.Vector3(3050, 460, -1500));

    game.player.lockedTarget = game.groundTargets[0];
    sound.speakRadio(
      'AWACS SKYEYE',
      `Operation Iron Archipelago: Destroy all 6 Island Radar Domes, SAM Sites & Fuel Depots! Use [V] for JDAM Bombs, [F] for Missiles, and [T] to cycle targets!`,
      true
    );
  } else {
    // Strike 3: Crimson Fleet Naval Task Force Strike (4 Moving Enemy Warships)
    setAtmosphere({
      sunElevation: 4.5,
      sunAzimuth: 190,
      turbidity: 8.5,
      fogDensity: 0.00018,
      waterColor: 0x122234,
      sunIntensity: 2.0,
      ambientIntensity: 0.7
    });

    resetPlayerForFlight(new THREE.Vector3(0, 320, -180), 0, cfg.cruiseSpeedKts, 0.8, false);
    game.player.bombs = Math.max(10, cfg.bombs + 4);

    const shipVel = new THREE.Vector3(0, 0, 7.5); // Steaming South toward carrier
    spawnGroundTarget('destroyer', 'BATTLECRUISER KIROV', 0, 0, -1650, 240, true, shipVel);
    spawnGroundTarget('destroyer', 'DESTROYER SOVREMENNY', -240, 0, -1480, 160, true, shipVel);
    spawnGroundTarget('destroyer', 'DESTROYER UDALOY', 240, 0, -1480, 160, true, shipVel);
    spawnGroundTarget('destroyer', 'FRIGATE GRIGOROVICH', 0, 0, -1320, 150, false, shipVel);

    // 2 Su-35 Flanker Naval Escorts
    spawnEnemyPlane('su35', new THREE.Vector3(-180, 440, -1550));
    spawnEnemyPlane('su35', new THREE.Vector3(180, 460, -1550));

    game.player.lockedTarget = game.groundTargets[0];
    sound.speakRadio(
      'AWACS SKYEYE',
      `Operation Crimson Fleet: Enemy Battlecruiser & 3 Destroyers steaming south! Align your CCIP Bombing Pipper [V] on their decks and sink the task force!`,
      true
    );
  }

  updateUIOverlays();
}

// ==========================================
// START MODE 3: SPECIAL OPERATIONS (3 FUN MISSIONS)
// ==========================================
function startSpecOpsMission(opId) {
  sound.init();
  sound.setMusicMode('dangerzone');
  clearCombatEntities();

  game.state = 'SPECOPS';
  game.specopsMission = opId;
  game.missionPhase = 1;
  game.score = 0;
  game.kills = 0;
  game.missionStartTime = performance.now() * 0.001;
  game.carrierHp = 100;
  game.ringIndex = 0;

  carrierGroup.position.set(0, 0, 0);
  carrierGroup.rotation.set(0, 0, 0);
  glideBoxesGroup.visible = false;

  const cfg = game.player.config;

  if (opId === 1) {
    // Op 1: Mach 10 "Darkstar" Canyon Ring Time-Trial
    setAtmosphere({
      sunElevation: 22,
      sunAzimuth: 145,
      turbidity: 3.0,
      fogDensity: 0.00008,
      waterColor: 0x002d52,
      sunIntensity: 2.7,
      ambientIntensity: 0.92
    });

    resetPlayerForFlight(new THREE.Vector3(45, 75, 520), 0, Math.min(520, cfg.maxSpeedKts * 0.8), 0.92, false);

    // Build 16 Glowing Sky Gates curving past the Carrier Tower and toward the NW Island Lagoon
    const ringCoords = [
      [40, 62, 180],
      [32, 52, -60],
      [-40, 68, -320],
      [-160, 88, -580],
      [-340, 110, -820],
      [-580, 125, -1040],
      [-860, 115, -1240],
      [-1160, 95, -1420],
      [-1460, 82, -1580],
      [-1720, 95, -1780],
      [-1920, 135, -2050],
      [-1820, 185, -2380],
      [-1520, 225, -2520],
      [-1180, 195, -2350],
      [-840, 145, -2050],
      [-480, 110, -1720]
    ];

    game.totalRings = ringCoords.length;
    ringCoords.forEach((rc, idx) => {
      const rMesh = createStrikeTargetMesh('skyring');
      rMesh.position.set(rc[0], rc[1], rc[2]);
      if (idx < ringCoords.length - 1) {
        const next = ringCoords[idx + 1];
        rMesh.lookAt(next[0], next[1], next[2]);
      }
      scene.add(rMesh);
      game.skyRings.push({
        index: idx,
        mesh: rMesh,
        pos: new THREE.Vector3(rc[0], rc[1], rc[2]),
        cleared: false
      });
    });

    sound.speakRadio(
      'TOPGUN VIPER',
      `Mach 10 Canyon Time-Trial! Punch full afterburner [W] and fly through all 16 glowing Sky Rings in sequence!`,
      true
    );
  } else if (opId === 2) {
    // Op 2: "Defend the Fleet" — Carrier Escort against 3 Waves of Heavy Bombers
    setAtmosphere({
      sunElevation: 15,
      sunAzimuth: 130,
      turbidity: 4.2,
      fogDensity: 0.00011,
      waterColor: 0x002646,
      sunIntensity: 2.4,
      ambientIntensity: 0.88
    });

    resetPlayerForFlight(new THREE.Vector3(0, 310, -120), 0, cfg.cruiseSpeedKts, 0.82, false);
    game.wave = 1;
    spawnFleetDefenseWave(1);

    sound.speakRadio(
      'AIR BOSS TOWER',
      `Red Alert! Tu-22M Backfire Bombers inbound to sink USS Nimitz! Splash the bombers before they launch anti-ship missiles at the carrier!`,
      true
    );
  } else {
    // Op 3: "Maverick & Rooster" Wingman Furball + Carrier Trap!
    setAtmosphere({
      sunElevation: 9,
      sunAzimuth: 175,
      turbidity: 6.5,
      fogDensity: 0.00014,
      waterColor: 0x0d2238,
      sunIntensity: 2.2,
      ambientIntensity: 0.78
    });

    resetPlayerForFlight(new THREE.Vector3(0, 380, 420), 0, cfg.cruiseSpeedKts, 0.8, false);

    // Spawn Friendly AI Wingman "ROOSTER" on Player's Starboard Wing
    const wingMesh = createJetMesh(cfg.id === 'f14' ? 'f18' : 'f14');
    const wingPos = new THREE.Vector3(35, 382, 435);
    wingMesh.position.copy(wingPos);
    scene.add(wingMesh);
    game.wingman = {
      callsign: 'ROOSTER',
      mesh: wingMesh,
      pos: wingPos,
      vel: new THREE.Vector3(0, 0, -1),
      quat: new THREE.Quaternion(),
      speedKts: 350,
      missileTimer: 3.5
    };

    // Spawn Crimson Ace Squadron (3 Su-57 Felons + 3 MiG-28s)
    const formation = ['su57', 'su33', 'su57', 'mig29', 'mig29', 'su35'];
    formation.forEach((t, i) => {
      const ang = (i - 2.5) * 0.25;
      const sPos = new THREE.Vector3(Math.sin(ang) * 1450, 390 + (i % 3) * 65, -1350 - (i % 2) * 280);
      spawnEnemyPlane(t, sPos, t === 'su57' || t === 'su33' ? 'CRIMSON SU-57 ACE' : 'CRIMSON MIG-28');
    });
    game.player.lockedTarget = game.enemies[0];

    sound.speakRadio(
      'WINGMAN ROOSTER',
      `Rooster on your starboard wing, ${saveData.callsign}! Let's splash all 6 Crimson Squadron bandits, then bring it home to the carrier deck!`,
      true
    );
  }

  updateUIOverlays();
}

function spawnFleetDefenseWave(waveNum) {
  game.wave = waveNum;
  const bomberCount = 2 + waveNum;
  const escortCount = 1 + Math.floor(waveNum / 2);

  for (let i = 0; i < bomberCount; i++) {
    const spreadX = (i - (bomberCount - 1) * 0.5) * 320;
    const pos = new THREE.Vector3(spreadX, 240 + (i % 2) * 45, -1850 - i * 220);
    spawnEnemyPlane('bomber', pos, 'TU-22M STRIKE BOMBER');
  }
  for (let i = 0; i < escortCount; i++) {
    const pos = new THREE.Vector3((i === 0 ? -1 : 1) * 380, 340, -1650);
    spawnEnemyPlane('su33', pos, 'SU-57 ESCORT ACE');
  }
  game.player.lockedTarget = game.enemies[0] || null;
}

// ==========================================
// START MODE 4: 10-STAGE CARRIER LANDING CHALLENGE
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
  glideBoxesGroup.visible = game.showGlideBoxes && !stage.meatballOut;
  if (carrierGroup.userData.olsGroup) {
    carrierGroup.userData.olsGroup.visible = !stage.meatballOut;
  }

  const cfg = game.player.config;
  resetPlayerForFlight(
    stage.startPos,
    stage.startYaw,
    stage.startSpeedKts,
    stage.overheadBreak || stage.cobraEntry ? 0.75 : 0.43,
    stage.startGearDown
  );

  updateUIOverlays();

  if (stage.engineFailure) {
    sound.speakRadio(
      'LSO PADDLES',
      `Mayday ${saveData.callsign}! Starboard engine flameout—counter right yaw with Left Rudder [A] and nurse her onto the #3 wire!`,
      true
    );
  } else if (stage.cobraEntry) {
    sound.speakRadio(
      'LSO PADDLES',
      `${saveData.callsign}, you're hot at 275 knots! Cut throttle [S], pitch up a Cobra airbrake to bleed below 190 knots, press [L] for gear, and trap!`,
      true
    );
  } else if (stage.meatballOut) {
    sound.speakRadio(
      'LSO PADDLES',
      `${saveData.callsign}, optical Meatball is knocked out! Fly a pure LSO talk-down approach—listen to my voice calls all the way to the deck!`,
      true
    );
  } else if (stage.carrierTurning) {
    sound.speakRadio(
      'LSO PADDLES',
      `${saveData.callsign}, CVN-68 is executing evasive S-turns at 28 knots! Track the turning angled deck and call the ball!`,
      true
    );
  } else if (stage.overheadBreak) {
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
// WEAPONS: CANNON, MISSILES, PRECISION JDAM BOMBS & FLARES
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
  p.missileCooldown = 0.6;

  sound.playMissileLaunch();
  const isLocked = p.lockProgress >= 1.0 && p.lockedTarget && p.lockedTarget.hp > 0;
  sound.speakRadio(
    'AWACS SKYEYE',
    isLocked ? `${saveData.callsign}, Fox Two! Missile tracking ${p.lockedTarget.label}!` : 'Fox Two—missile away!',
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
    vel: forward.clone().multiplyScalar(p.speedKts * 0.5144 + 295),
    quat: p.quat.clone(),
    target: isLocked ? p.lockedTarget : null,
    isPlayer: true,
    speedMps: 390,
    turnRate: isLocked ? 3.5 : 0.0,
    ttl: 7.5
  });
}

// Compute ballistic ground impact point for CCIP Bombing Pipper on HUD
const BOMB_GRAVITY = 34.0;
function computeBombImpactPoint(startPos, startVel, targetY = 8.0) {
  const dy = startPos.y - targetY;
  if (dy <= 1.0) return startPos.clone();
  const vy = startVel.y - 6.0;
  // 0.5 * g * t^2 - vy * t - dy = 0
  const disc = vy * vy + 2.0 * BOMB_GRAVITY * dy;
  const tImpact = (vy + Math.sqrt(Math.max(0, disc))) / BOMB_GRAVITY;
  return new THREE.Vector3(
    startPos.x + startVel.x * tImpact,
    targetY,
    startPos.z + startVel.z * tImpact
  );
}

function dropPlayerBomb() {
  const p = game.player;
  if (p.bombs <= 0 || p.bombCooldown > 0) return;
  p.bombs -= 1;
  p.bombCooldown = 0.45;

  sound.playBombDrop();

  // Build 2,000-lb GBU-31 JDAM Guided Bomb Mesh
  const bGroup = new THREE.Group();
  const bBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.24, 3.0, 10).rotateX(Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x4b5d42 })
  );
  const bNose = new THREE.Mesh(
    new THREE.ConeGeometry(0.24, 0.7, 10).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xf5b82e })
  );
  bNose.position.z = -1.85;
  bGroup.add(bBody, bNose);

  const sideOffset = (p.bombs % 2 === 0 ? 1 : -1) * 1.9;
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(p.quat).normalize();
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(p.quat).normalize();
  const spawnPos = p.pos.clone().addScaledVector(right, sideOffset).addScaledVector(up, -0.8);

  bGroup.position.copy(spawnPos);
  bGroup.quaternion.copy(p.quat);
  scene.add(bGroup);

  // Check if CCIP pipper is near a ground target or if player has a ground target selected
  const impactPt = computeBombImpactPoint(p.pos, p.vel, 10.0);
  let guidedTarget = null;
  let bestDist = 420;
  for (const gt of game.groundTargets) {
    const d = impactPt.distanceTo(gt.pos);
    if (d < bestDist) {
      bestDist = d;
      guidedTarget = gt;
    }
  }
  if (!guidedTarget && p.lockedTarget && p.lockedTarget.isGroundTarget) {
    guidedTarget = p.lockedTarget;
  }

  sound.speakRadio(
    'TOPGUN WEAPONS',
    guidedTarget
      ? `Pickle! GBU-31 JDAM away—tracking ${guidedTarget.label}!`
      : 'Pickle! 2,000-pound JDAM bomb away!',
    false
  );

  const initVel = p.vel.clone();
  initVel.y -= 6.0;

  game.bombs.push({
    mesh: bGroup,
    pos: spawnPos,
    vel: initVel,
    target: guidedTarget,
    ttl: 14.0
  });
}

function fireEnemyMissile(shooterPos, shooterQuat, warningText = 'Warning! Bandit missile launch! Press G for flares!') {
  const mGroup = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 3.2, 8).rotateX(Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xff3b47 })
  );
  mGroup.add(body);
  mGroup.position.copy(shooterPos);
  mGroup.quaternion.copy(shooterQuat);
  scene.add(mGroup);

  const forward = game.player.pos.clone().sub(shooterPos).normalize();
  game.missiles.push({
    mesh: mGroup,
    pos: shooterPos.clone(),
    vel: forward.multiplyScalar(275),
    quat: shooterQuat.clone(),
    target: game.player,
    isPlayer: false,
    speedMps: 290,
    turnRate: 1.85,
    ttl: 6.5,
    spoofedByFlare: null
  });

  sound.speakRadio('AWACS SKYEYE', warningText, false);
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
let pitchInvertStick = true;

function updateSimulation(dt) {
  const nowSec = performance.now() * 0.001;

  if (carrierGroup.userData.radarSpinner) {
    carrierGroup.userData.radarSpinner.rotation.y += dt * 1.8;
  }

  // Hangar Showcase Mode
  if (game.state === 'HANGAR') {
    sound.updateEngine(0, false);
    sound.updateSeekerTone('off');
    cockpitInteriorGroup.visible = false;
    carrierGroup.position.set(0, 0, 0);
    carrierGroup.rotation.set(0, 0, 0);

    const p = game.player;
    p.mesh.visible = true;
    p.pos.set(0, 21.38, 65);
    p.quat.setFromEuler(new THREE.Euler(0.02, nowSec * 0.45, 0, 'YXZ'));
    p.mesh.position.copy(p.pos);
    p.mesh.quaternion.copy(p.quat);
    updateJetVisuals(p.mesh, 0, 0, true, Math.sin(nowSec * 1.5) * 0.3, Math.cos(nowSec * 1.2) * 0.3);

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

  p.gunCooldown = Math.max(0, p.gunCooldown - dt);
  p.missileCooldown = Math.max(0, p.missileCooldown - dt);
  p.bombCooldown = Math.max(0, p.bombCooldown - dt);
  p.flareCooldown = Math.max(0, p.flareCooldown - dt);

  // Update Carrier Motion in Carrier Mode
  const stage = CARRIER_STAGES[game.carrierStage] || CARRIER_STAGES[1];
  if (game.state === 'CARRIER') {
    if (stage.carrierTurning) {
      // Stage 10: Evasive S-Turning Carrier
      carrierGroup.rotation.y = Math.sin(nowSec * 0.24) * 0.22;
      const cFwd = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), carrierGroup.rotation.y);
      carrierGroup.position.addScaledVector(cFwd, stage.carrierSpeedMps * dt);
    } else {
      carrierGroup.position.z -= stage.carrierSpeedMps * dt;
    }

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

    const wireZ = carrierGroup.userData.wirePositionsZ[p.trappedWire - 1];
    const localHookZ = p.pos.z - carrierGroup.position.z + 4.8;
    const posArr = trapLineGeo.attributes.position;
    posArr.setXYZ(0, -17, 20.25, wireZ);
    posArr.setXYZ(1, p.pos.x - carrierGroup.position.x, 20.35, localHookZ);
    posArr.setXYZ(2, 17, 20.25, wireZ);
    posArr.needsUpdate = true;
    trapLineMesh.visible = true;

    if (p.speedKts <= 1 || p.trapProgress > 2.2) {
      if (game.state === 'SPECOPS' && game.specopsMission === 3) {
        finishSpecOpsWingmanSortie();
      } else {
        finishCarrierTrap();
      }
    }
    updateCamera(dt);
    return;
  }

  // ==========================================
  // KEYBOARD FLIGHT CONTROLS
  // ==========================================
  const isEngineFailed = game.state === 'CARRIER' && stage.engineFailure;
  const maxThrottleAllowed = isEngineFailed ? 0.76 : 1.0;

  if (keys['KeyW']) {
    p.throttle = Math.min(maxThrottleAllowed, p.throttle + 0.42 * dt);
  } else if (keys['KeyS']) {
    p.throttle = Math.max(0.05, p.throttle - 0.52 * dt);
  }

  const maxSpd = p.gearDown ? Math.min(265, cfg.maxSpeedKts * 0.45) : cfg.maxSpeedKts;
  const minSpd = cfg.minSpeedKts;
  // High-AoA Cobra pitch-up bleeds airspeed rapidly (used in Stage 7 Cobra Short-Field Trap!)
  const cobraDrag = p.pitch > 0.28 ? Math.sin(p.pitch) * 145 : Math.sin(p.pitch) * 48;
  const targetSpd = minSpd + p.throttle * (maxSpd - minSpd) - cobraDrag;
  p.speedKts += (targetSpd - p.speedKts) * Math.min(1, dt * 2.4);
  p.speedKts = Math.max(minSpd * 0.92, Math.min(cfg.maxSpeedKts * 1.05, p.speedKts));

  sound.updateEngine(p.throttle, true);

  let pitchInput = 0;
  if (keys['ArrowDown']) pitchInput += pitchInvertStick ? 1 : -1;
  if (keys['ArrowUp']) pitchInput += pitchInvertStick ? -1 : 1;

  let rollInput = 0;
  if (keys['ArrowLeft']) rollInput += 1;
  if (keys['ArrowRight']) rollInput -= 1;

  let yawInput = 0;
  if (keys['KeyA']) yawInput += 1;
  if (keys['KeyD']) yawInput -= 1;

  // Stage 6 Single-Engine Flameout: Asymmetric starboard thrust loss pulls nose right & banks right
  if (isEngineFailed) {
    yawInput -= 0.28;
    rollInput -= 0.14;
    if (Math.random() < 0.65) {
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(p.quat);
      const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(p.quat);
      const smokePos = p.pos.clone().addScaledVector(right, 0.85).addScaledVector(fwd, -5.2);
      spawnSmokePuff(smokePos, 0.65, 0x383e46, 0.65);
    }
  }

  const dPitch = pitchInput * cfg.pitchRate * dt;
  const dRoll = rollInput * cfg.rollRate * dt;
  const dYaw = yawInput * cfg.yawRate * dt;

  const qDelta = new THREE.Quaternion().setFromEuler(new THREE.Euler(dPitch, dYaw, dRoll, 'YXZ'));
  p.quat.multiply(qDelta).normalize();

  const euler = new THREE.Euler().setFromQuaternion(p.quat, 'YXZ');
  p.pitch = THREE.MathUtils.clamp(euler.x, -Math.PI * 0.46, Math.PI * 0.46);
  p.yaw = euler.y;
  p.roll = euler.z;

  const bankTurnRate = Math.sin(p.roll) * 0.62 * dt;
  p.yaw += bankTurnRate;

  if (rollInput === 0 && Math.abs(p.roll) < 0.45 && !isEngineFailed) {
    p.roll *= Math.pow(0.18, dt);
  }
  if (pitchInput === 0 && Math.abs(p.roll) < 0.35) {
    const restPitch = (game.state === 'CARRIER' || (game.state === 'SPECOPS' && game.specopsMission === 3 && game.missionPhase === 2)) && p.gearDown ? -0.052 : 0.0;
    p.pitch += (restPitch - p.pitch) * Math.min(1, dt * 0.75);
  }

  p.quat.setFromEuler(new THREE.Euler(p.pitch, p.yaw, p.roll, 'YXZ'));

  p.gLoad = +(1.0 + pitchInput * (p.speedKts / 145) * 3.2 + Math.abs(Math.sin(p.roll)) * 1.1).toFixed(1);
  const idealSpd = cfg.idealApproachKts;
  const baseAoa = THREE.MathUtils.clamp(8.1 + (idealSpd - p.speedKts) * 0.032, 1.5, 14.5);
  p.aoaDeg = +THREE.MathUtils.clamp(baseAoa + pitchInput * 4.5, -3.5, 22.0).toFixed(1);

  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(p.quat).normalize();
  const speedMps = p.speedKts * 0.5144;
  p.vel.copy(forward).multiplyScalar(speedMps);

  // Add Wind & Gusting Squall Turbulence in Carrier Mode
  if (game.state === 'CARRIER') {
    p.vel.add(stage.windVec);
    if (stage.windGusting) {
      p.vel.x += Math.sin(nowSec * 1.1) * 14.5;
      p.vel.y += Math.cos(nowSec * 1.7) * 4.5;
    }
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

  if (Math.abs(p.gLoad) > 2.5 || p.speedKts > 480) {
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(p.quat).normalize();
    for (const side of [-5.8, 5.8]) {
      spawnSmokePuff(p.pos.clone().addScaledVector(right, side), 0.26, 0xe8f4ff, 0.32);
    }
  }

  if (keys['Space']) {
    firePlayerCannon();
  }

  // Top Gun "Buzz the Tower" Flyby Detection
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
    game.score += 250;
    if (game.score > saveData.bestScore) {
      saveData.bestScore = game.score;
      writeSaveData(saveData);
    }
    sound.speakRadio(
      'AIR BOSS TOWER',
      `Negative Ghost Rider, the pattern is full!! (${saveData.callsign} Tower Flyby +250 PTS!)`,
      true
    );
  }

  updateProjectilesAndParticles(dt);

  // Mode-Specific Logic
  if (game.state === 'COMBAT') {
    updateCombatMode(dt);
  } else if (game.state === 'CARRIER') {
    updateCarrierApproach(dt);
  } else if (game.state === 'STRIKE') {
    updateStrikeMission(dt);
  } else if (game.state === 'SPECOPS') {
    updateSpecOpsMission(dt);
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
// UPDATE PROJECTILES, MISSILES, BOMBS & PARTICLES
// ==========================================
function updateProjectilesAndParticles(dt) {
  const p = game.player;

  // 1. Bullets (hit both Air Enemies and Ground/Naval Strike Targets!)
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
      if (!hit) {
        for (const gt of game.groundTargets) {
          if (b.pos.distanceTo(gt.pos) < 24) {
            gt.hp -= 14;
            spawnExplosion(b.pos, 0.45);
            hit = true;
            if (gt.hp <= 0) {
              destroyGroundTarget(gt);
            }
            break;
          }
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

  // 2. Precision Guided Bombs (GBU-31 JDAMs)
  for (let i = game.bombs.length - 1; i >= 0; i--) {
    const bmb = game.bombs[i];
    bmb.ttl -= dt;
    bmb.vel.y -= BOMB_GRAVITY * dt;

    // Terminal GPS / Laser guidance toward target horizontal coordinates
    if (bmb.target && bmb.target.hp > 0) {
      const toTgtXZ = new THREE.Vector2(bmb.target.pos.x - bmb.pos.x, bmb.target.pos.z - bmb.pos.z);
      const horizDist = toTgtXZ.length();
      if (horizDist > 2.0 && horizDist < 650) {
        toTgtXZ.normalize();
        const horizSpd = Math.hypot(bmb.vel.x, bmb.vel.z);
        bmb.vel.x = THREE.MathUtils.lerp(bmb.vel.x, toTgtXZ.x * horizSpd, Math.min(1, dt * 3.2));
        bmb.vel.z = THREE.MathUtils.lerp(bmb.vel.z, toTgtXZ.y * horizSpd, Math.min(1, dt * 3.2));
      }
    }

    bmb.pos.addScaledVector(bmb.vel, dt);
    bmb.mesh.position.copy(bmb.pos);
    bmb.mesh.lookAt(bmb.pos.clone().add(bmb.vel));
    spawnSmokePuff(bmb.pos, 0.55, 0xf5d77f, 0.35);

    let bombDetonated = false;
    for (const gt of game.groundTargets) {
      if (bmb.pos.distanceTo(gt.pos) < 32) {
        bombDetonated = true;
        break;
      }
    }
    if (bmb.pos.y <= 8.0 || bmb.ttl <= 0) {
      bombDetonated = true;
    }

    if (bombDetonated) {
      spawnExplosion(bmb.pos, 2.8, 0xff9922);
      game.cameraShake = Math.max(game.cameraShake, 0.55);

      // 95-meter heavy blast radius damages/destroys all ground & naval targets nearby!
      for (let gIdx = game.groundTargets.length - 1; gIdx >= 0; gIdx--) {
        const gt = game.groundTargets[gIdx];
        const dist = bmb.pos.distanceTo(gt.pos);
        if (dist < 105) {
          gt.hp -= 160 * (1.0 - dist / 135);
          if (gt.hp <= 0) {
            destroyGroundTarget(gt);
          }
        }
      }

      scene.remove(bmb.mesh);
      game.bombs.splice(i, 1);
    }
  }

  // 3. Flares
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

  // 4. Missiles
  let incomingEnemyMissile = false;
  for (let i = game.missiles.length - 1; i >= 0; i--) {
    const m = game.missiles[i];
    m.ttl -= dt;

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
      if (!detonated) {
        for (const gt of game.groundTargets) {
          if (m.pos.distanceTo(gt.pos) < 28) {
            gt.hp -= 85;
            spawnExplosion(gt.pos, 1.45);
            detonated = true;
            if (gt.hp <= 0) {
              destroyGroundTarget(gt);
            }
            break;
          }
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
        p.hull = Math.max(0, p.hull - 32);
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

  const alertBanner = document.getElementById('alert-warning-banner');
  if (incomingEnemyMissile && (game.state === 'COMBAT' || game.state === 'STRIKE' || game.state === 'SPECOPS')) {
    alertBanner.classList.remove('hidden');
    sound.playWarningBeep();
  } else {
    alertBanner.classList.add('hidden');
  }

  // 5. Explosion & Smoke Particles
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

  const pts = enemy.type === 'su33' || enemy.type === 'su57' ? 500 : enemy.type === 'bomber' ? 350 : 250;
  game.score += pts;
  game.kills += 1;

  if (game.score > saveData.bestScore) {
    saveData.bestScore = game.score;
    writeSaveData(saveData);
  }

  if (game.player.lockedTarget === enemy) {
    game.player.lockedTarget = game.groundTargets[0] || game.enemies[0] || null;
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

function destroyGroundTarget(gt) {
  const idx = game.groundTargets.indexOf(gt);
  if (idx === -1) return;

  spawnExplosion(gt.pos, gt.targetType === 'destroyer' || gt.targetType === 'bunker' ? 3.2 : 2.2, 0xff8811);
  scene.remove(gt.mesh);
  game.groundTargets.splice(idx, 1);

  game.score += 450;
  game.kills += 1;
  if (game.score > saveData.bestScore) {
    saveData.bestScore = game.score;
    writeSaveData(saveData);
  }

  if (game.player.lockedTarget === gt) {
    game.player.lockedTarget = game.groundTargets[0] || game.enemies[0] || null;
    game.player.lockProgress = 0;
  }

  sound.speakRadio(
    'AWACS SKYEYE',
    `Direct hit! ${gt.label} destroyed! (${game.groundTargets.length} strike targets remaining)`,
    true
  );
}

// ==========================================
// UPDATE ENEMY AI & SEEKER LOCK HELPER
// ==========================================
function updateEnemiesAndSeeker(dt) {
  const p = game.player;

  // Update Moving Naval Targets & Ground SAM Batteries
  for (const gt of game.groundTargets) {
    if (gt.vel.lengthSq() > 0.01) {
      gt.pos.addScaledVector(gt.vel, dt);
      gt.mesh.position.set(gt.pos.x, 0, gt.pos.z);
    }
    if (gt.canFireSam) {
      gt.samTimer -= dt;
      const distToP = gt.pos.distanceTo(p.pos);
      if (gt.samTimer <= 0 && distToP < 2300 && p.pos.y > 75) {
        gt.samTimer = 7.5 + Math.random() * 4.0;
        fireEnemyMissile(
          gt.pos.clone().add(new THREE.Vector3(0, 14, 0)),
          new THREE.Quaternion(),
          `SAM Launch from ${gt.label}! Press [G] for flares or dive low!`
        );
      }
    }
  }

  // Update Friendly AI Wingman "ROOSTER" (if active in Special Op 3)
  if (game.wingman) {
    const w = game.wingman;
    const targetEnemy = game.enemies[0];
    let desiredPoint;
    if (targetEnemy) {
      desiredPoint = targetEnemy.pos.clone().add(new THREE.Vector3(0, 15, 65));
    } else {
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(p.quat);
      const back = new THREE.Vector3(0, 0, 1).applyQuaternion(p.quat);
      desiredPoint = p.pos.clone().addScaledVector(right, 34).addScaledVector(back, 22);
    }

    const desiredDir = desiredPoint.sub(w.pos).normalize();
    const curDir = w.vel.clone().normalize();
    curDir.lerp(desiredDir, Math.min(1, 1.85 * dt)).normalize();
    w.vel.copy(curDir).multiplyScalar(w.speedKts * 0.5144);
    w.pos.addScaledVector(w.vel, dt);
    w.mesh.position.copy(w.pos);
    w.mesh.lookAt(w.pos.clone().add(curDir));
    w.quat.copy(w.mesh.quaternion);
    updateJetVisuals(w.mesh, w.speedKts, 0.85, false, 0.15, 0);

    // Wingman Rooster fires support missiles at enemies!
    if (targetEnemy) {
      w.missileTimer -= dt;
      if (w.missileTimer <= 0 && w.pos.distanceTo(targetEnemy.pos) < 1600) {
        w.missileTimer = 7.5;
        sound.speakRadio('WINGMAN ROOSTER', `Rooster engaging ${targetEnemy.label}—Fox Two!`, false);
        const mGrp = new THREE.Group();
        mGrp.add(
          new THREE.Mesh(
            new THREE.CylinderGeometry(0.14, 0.14, 3.0, 8).rotateX(Math.PI / 2),
            new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
          )
        );
        mGrp.position.copy(w.pos);
        scene.add(mGrp);
        game.missiles.push({
          mesh: mGrp,
          pos: w.pos.clone(),
          vel: curDir.clone().multiplyScalar(370),
          quat: w.quat.clone(),
          target: targetEnemy,
          isPlayer: true,
          speedMps: 375,
          turnRate: 3.2,
          ttl: 6.0
        });
      }
    }
  }

  // Update Enemy Aircraft AI
  for (const e of game.enemies) {
    const toPlayer = p.pos.clone().sub(e.pos);
    const dist = toPlayer.length();

    let targetPoint = p.pos.clone();
    if (e.antiShipRole) {
      // In Special Op 2 (Defend the Fleet), Tu-22M Bombers head straight for USS Nimitz!
      targetPoint = new THREE.Vector3(carrierGroup.position.x, 190, carrierGroup.position.z);
      const distToCarrier = Math.hypot(e.pos.x - carrierGroup.position.x, e.pos.z - carrierGroup.position.z);
      if (distToCarrier < 880) {
        e.missileTimer -= dt * 1.4;
        if (e.missileTimer <= 0) {
          e.missileTimer = 6.5;
          game.carrierHp = Math.max(0, game.carrierHp - 14);
          spawnExplosion(
            new THREE.Vector3(
              carrierGroup.position.x + (Math.random() - 0.5) * 20,
              22,
              carrierGroup.position.z + (Math.random() - 0.5) * 90
            ),
            2.2
          );
          sound.speakRadio(
            'AIR BOSS TOWER',
            `Warning! Bombers hit CVN-68 flight deck! Carrier integrity at ${game.carrierHp}%!`,
            true
          );
        }
      }
    } else if (dist < 260) {
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

    if (!e.antiShipRole) {
      e.missileTimer -= dt;
      if (e.missileTimer <= 0 && dist < 2000 && dist > 180 && curDir.dot(toPlayer.clone().normalize()) > 0.65) {
        e.missileTimer = 8.5 + Math.random() * 5.0;
        fireEnemyMissile(e.pos, e.quat);
      }
    }
  }

  // Player Seeker Lock-On Calculation (locks onto both Air Enemies and Ground Targets!)
  const playerForward = new THREE.Vector3(0, 0, -1).applyQuaternion(p.quat).normalize();
  let bestCandidate = null;
  let bestDot = 0.84;

  const allTargets = [...game.enemies, ...game.groundTargets];
  for (const t of allTargets) {
    const toT = t.pos.clone().sub(p.pos);
    const dist = toT.length();
    if (dist < 2800) {
      const dot = playerForward.dot(toT.normalize());
      if (dot > bestDot) {
        bestDot = dot;
        bestCandidate = t;
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
    if (!p.lockedTarget || !allTargets.includes(p.lockedTarget)) {
      p.lockedTarget = allTargets[0] || null;
    }
    sound.updateSeekerTone('off');
  }
}

// ==========================================
// UPDATE MODE 1: WAVE SURVIVAL
// ==========================================
function updateCombatMode(dt) {
  const p = game.player;

  if (game.enemies.length === 0) {
    sound.updateSeekerTone('off');
    if (game.wavePauseTimer === 0) {
      const nextWave = game.wave + 1;
      if (nextWave > saveData.bestWave) {
        saveData.bestWave = nextWave;
        writeSaveData(saveData);
      }
      p.missiles = p.config.missiles;
      p.bombs = p.config.bombs || 6;
      p.flares = p.config.flares;
      p.hull = Math.min(100, p.hull + 35);
      sound.speakRadio(
        'AWACS SKYEYE',
        `Wave ${game.wave} cleared! Ordnance & flares replenished, hull repaired. Wave ${nextWave} inbound!`,
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

  updateEnemiesAndSeeker(dt);
}

// ==========================================
// UPDATE MODE 2: AIR-TO-GROUND BOMBING STRIKES
// ==========================================
function updateStrikeMission(dt) {
  const p = game.player;
  updateEnemiesAndSeeker(dt);

  // Strike 1 Special Rule: 850 FT Radar Hard Deck during Phase 1 (before Uranium Bunker is destroyed)
  if (game.strikeMission === 1 && game.missionPhase === 1) {
    const hasBunker = game.groundTargets.some((g) => g.targetType === 'bunker');
    if (hasBunker) {
      const altFt = p.pos.y * 3.28084;
      if (altFt > 850) {
        game.radarCeilingTimer += dt;
        if (game.radarCeilingTimer > 2.2) {
          game.radarCeilingTimer = 0;
          fireEnemyMissile(
            new THREE.Vector3(-2500, 95, -1700),
            new THREE.Quaternion(),
            'Above 850 FT Hard Deck! Enemy Radar SAM Launch! Dive below 850 feet!'
          );
        }
      } else {
        game.radarCeilingTimer = Math.max(0, game.radarCeilingTimer - dt);
      }
    } else {
      // Bunker Destroyed! Trigger Phase 2: 2 Su-57 Felon Interceptors scramble!
      game.missionPhase = 2;
      spawnEnemyPlane('su57', new THREE.Vector3(p.pos.x - 450, 480, p.pos.z - 1200), 'SU-57 FELON INTERCEPTOR');
      spawnEnemyPlane('su57', new THREE.Vector3(p.pos.x + 450, 520, p.pos.z - 1250), 'SU-57 FELON INTERCEPTOR');
      game.player.lockedTarget = game.enemies[0];
      sound.speakRadio(
        'TOPGUN MAVERICK',
        `Miracle Two—Bullseye on the Uranium Bunker!! Two Su-57 Felons scrambling onto our six—splash the Felons to complete the mission!`,
        true
      );
    }
  }

  // Check Victory Conditions for Strike Missions
  if (game.strikeMission === 1 && game.missionPhase === 2 && game.enemies.length === 0) {
    finishStrikeVictory(
      1,
      'URANIUM BUNKER & FELONS DESTROYED',
      'Textbook Top Gun canyon run! Reactor destroyed and scrambling Su-57 Felons splashed!'
    );
  } else if (game.strikeMission === 2 && game.groundTargets.length === 0) {
    finishStrikeVictory(
      2,
      'ISLAND SEAD COMPLETE',
      'All 6 enemy Radar Domes, S-400 SAM Batteries, and Fuel Depots obliterated!'
    );
  } else if (game.strikeMission === 3 && game.groundTargets.length === 0) {
    finishStrikeVictory(
      3,
      'CRIMSON FLEET SUNK',
      'All 4 enemy guided-missile warships and the Battlecruiser Kirov sent to the bottom!'
    );
  }
}

function finishStrikeVictory(strikeId, title, subtitle) {
  const elapsedSec = Math.round(performance.now() * 0.001 - game.missionStartTime);
  saveData.strikeGrades[strikeId] = 'COMPLETED ★';
  writeSaveData(saveData);

  showDebriefModal({
    badge: `STRIKE MISSION ${strikeId} VICTORY`,
    title,
    subtitle,
    metrics: [
      ['AIRCRAFT', game.player.config.shortName || game.player.config.name],
      ['MISSION TIME', `${elapsedSec} SEC`],
      ['TARGETS DESTROYED', `${game.kills}`],
      ['COMBAT SCORE', `${game.score} PTS`]
    ],
    canAdvance: strikeId < 3,
    advanceType: 'STRIKE'
  });
}

// ==========================================
// UPDATE MODE 3: SPECIAL OPERATIONS MISSIONS
// ==========================================
function updateSpecOpsMission(dt) {
  const p = game.player;

  if (game.specopsMission === 1) {
    // Op 1: Mach 10 Canyon Ring Time-Trial
    sound.updateSeekerTone('off');
    const activeRing = game.skyRings[game.ringIndex];
    if (activeRing) {
      activeRing.mesh.rotation.z += dt * 1.5;
      if (p.pos.distanceTo(activeRing.pos) < 44) {
        activeRing.cleared = true;
        scene.remove(activeRing.mesh);
        game.ringIndex += 1;
        game.score += 250;
        p.speedKts = Math.min(p.config.maxSpeedKts * 1.08, p.speedKts + 45);
        sound.playCheckpointChime();

        if (game.ringIndex >= game.totalRings) {
          const elapsed = +(performance.now() * 0.001 - game.missionStartTime).toFixed(1);
          const grade = elapsed < 65 ? 'GOLD MACH 10 ★' : elapsed < 85 ? 'SILVER ACE' : 'QUALIFIED';
          saveData.specopsGrades[1] = grade;
          writeSaveData(saveData);
          showDebriefModal({
            badge: 'SPECIAL OP 1: CANYON TIME-TRIAL COMPLETE',
            title: grade,
            subtitle: `All 16 supersonic canyon gates cleared in ${elapsed} seconds!`,
            metrics: [
              ['GATES CLEARED', `${game.totalRings} / ${game.totalRings}`],
              ['COURSE TIME', `${elapsed} SEC`],
              ['TOP SPEED', `${Math.round(p.speedKts)} KTS`],
              ['SCORE', `${game.score} PTS`]
            ],
            canAdvance: true,
            advanceType: 'SPECOPS'
          });
        }
      }
    }
  } else if (game.specopsMission === 2) {
    // Op 2: Defend the Fleet (Carrier Escort)
    updateEnemiesAndSeeker(dt);

    if (game.carrierHp <= 0) {
      showDebriefModal({
        badge: 'FLEET DEFENSE FAILED',
        title: 'USS NIMITZ HEAVILY DAMAGED',
        subtitle: 'Enemy Tu-22M Backfire Bombers overwhelmed the carrier defenses.',
        metrics: [
          ['WAVE REACHED', `WAVE ${game.wave} / 3`],
          ['BANDITS SPLASHED', `${game.kills}`],
          ['CARRIER INTEGRITY', '0%'],
          ['SCORE', `${game.score} PTS`]
        ],
        canAdvance: false
      });
      return;
    }

    if (game.enemies.length === 0) {
      if (game.wave < 3) {
        const nextW = game.wave + 1;
        p.missiles = p.config.missiles;
        p.flares = p.config.flares;
        spawnFleetDefenseWave(nextW);
        sound.speakRadio(
          'AIR BOSS TOWER',
          `Bomber Wave ${nextW - 1} splashed! Missiles reloaded—Wave ${nextW} of 3 inbound now!`,
          true
        );
      } else {
        saveData.specopsGrades[2] = `SAVED (${game.carrierHp}%) ★`;
        writeSaveData(saveData);
        showDebriefModal({
          badge: 'SPECIAL OP 2: FLEET DEFENDED',
          title: 'USS NIMITZ SAVED!',
          subtitle: 'All 3 waves of enemy strike bombers intercepted before they could sink CVN-68!',
          metrics: [
            ['CARRIER INTEGRITY', `${game.carrierHp}%`],
            ['BOMBERS SPLASHED', `${game.kills}`],
            ['WAVES CLEARED', '3 / 3'],
            ['COMBAT SCORE', `${game.score} PTS`]
          ],
          canAdvance: true,
          advanceType: 'SPECOPS'
        });
      }
    }
  } else if (game.specopsMission === 3) {
    // Op 3: Maverick & Rooster Wingman Furball + Carrier Trap!
    updateEnemiesAndSeeker(dt);

    if (game.missionPhase === 1 && game.enemies.length === 0) {
      game.missionPhase = 2;
      rebuildGlideSlopeBoxes(false);
      glideBoxesGroup.visible = game.showGlideBoxes;
      sound.speakRadio(
        'LSO PADDLES',
        `All Crimson Squadron bandits splashed! Return to USS Nimitz, lower gear [L], and trap on the flight deck to finish the sortie!`,
        true
      );
    }

    if (game.missionPhase === 2) {
      updateCarrierApproach(dt);
    }
  }
}

function finishSpecOpsWingmanSortie() {
  const m = game.player.TouchdownMetrics || { wire: 3, speedKts: 138, sinkRateFps: 10 };
  saveData.specopsGrades[3] = `TOPGUN #${m.wire} WIRE ★`;
  writeSaveData(saveData);

  showDebriefModal({
    badge: 'SPECIAL OP 3: WINGMAN SORTIE COMPLETE',
    title: 'TOPGUN TROPHY EARNED!',
    subtitle: `Crimson Squadron defeated alongside Wingman Rooster & trapped on the #${m.wire} wire!`,
    metrics: [
      ['BANDITS SPLASHED', `${game.kills}`],
      ['WINGMAN STATUS', 'ROOSTER SURVIVED'],
      ['CARRIER RECOVERY', `#${m.wire} WIRE (${m.speedKts} KTS)`],
      ['TOTAL SCORE', `${game.score + 500} PTS`]
    ],
    canAdvance: false
  });
}

// ==========================================
// UPDATE MODE 4: CARRIER APPROACH, LSO & WIRE TRAP
// ==========================================
function updateCarrierApproach(dt) {
  const p = game.player;
  const stage = CARRIER_STAGES[game.carrierStage] || CARRIER_STAGES[1];

  // Transform player world position into carrier-local coordinates (handles moving & S-turning carrier!)
  const localPos = p.pos.clone().sub(carrierGroup.position);
  if (carrierGroup.rotation.y !== 0) {
    localPos.applyAxisAngle(new THREE.Vector3(0, 1, 0), -carrierGroup.rotation.y);
  }
  const relX = localPos.x;
  const relY = p.pos.y - carrierGroup.userData.deckY;
  const relZ = localPos.z;

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
    // Stage 9 ("Broken Meatball") gives more frequent LSO talk-down calls (every 2.4s)
    const callInterval = stage.meatballOut ? 2400 : 4400;
    if (distFromWire3 < 1400 && distFromWire3 > 85 && now - game.lsoLastCallTime > callInterval) {
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(p.quat);
      if (forward.z < -0.5) {
        game.lsoLastCallTime = now;
        const distMeters = Math.round(distFromWire3);
        if (!p.gearDown && distFromWire3 < 950) {
          sound.speakRadio('LSO PADDLES', 'Check gear! Press L to drop landing gear and tailhook!', true);
        } else if (glideErrorDeg < -0.85) {
          sound.speakRadio('LSO PADDLES', `${distMeters}M out—you're low, add power, power!`, false);
        } else if (glideErrorDeg > 1.05) {
          sound.speakRadio('LSO PADDLES', `${distMeters}M out—you're high on glide slope, ease throttle.`, false);
        } else if (Math.abs(relX) > 9) {
          sound.speakRadio(
            'LSO PADDLES',
            relX > 0 ? `${distMeters}M out—come left for centerline!` : `${distMeters}M out—come right for centerline!`,
            false
          );
        } else {
          sound.speakRadio('LSO PADDLES', `${distMeters}M out—on glide slope and centerline, hold ${p.config.idealApproachKts} knots!`, false);
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

    if (p.gearDown && relZ >= 38 && relZ <= 132 && p.speedKts < 198) {
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
        `Trap! Caught the number ${bestWire} wire! Sierra Hotel pass, ${saveData.callsign}!`,
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
    canAdvance: game.carrierStage < 10,
    advanceType: 'CARRIER'
  });
}

function finishCombatGameOver(reason) {
  showDebriefModal({
    badge: 'MISSION DEBRIEF',
    title: game.state === 'COMBAT' ? `REACHED WAVE ${game.wave}` : 'MISSION ABORTED',
    subtitle: `${reason} • Targets Destroyed: ${game.kills}`,
    metrics: [
      ['PILOT CALLSIGN', saveData.callsign],
      ['AIRCRAFT', game.player.config.shortName || game.player.config.name],
      ['TARGETS DESTROYED', `${game.kills}`],
      ['COMBAT SCORE', `${game.score} PTS`]
    ],
    canAdvance: false
  });
}

// ==========================================
// CAMERA CONTROLLER (CHASE, COCKPIT 3D & LSO DECK CAM)
// ==========================================
function cycleCameraMode() {
  const order = ['CHASE', 'COCKPIT', 'LSO'];
  const nextIdx = (order.indexOf(game.cameraMode) + 1) % order.length;
  game.cameraMode = order[nextIdx];
  document.getElementById('btn-toggle-camera').textContent = `CAM: ${game.cameraMode} [C]`;
}

function updateCamera(dt) {
  const p = game.player;
  if (game.cameraMode === 'COCKPIT') {
    p.mesh.visible = false;
    cockpitInteriorGroup.visible = true;
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(p.quat);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(p.quat);
    const camPos = p.pos.clone().addScaledVector(up, 0.85).addScaledVector(forward, 1.5);
    camera.position.copy(camPos);
    camera.quaternion.copy(p.quat);
    cockpitInteriorGroup.position.copy(camPos);
    cockpitInteriorGroup.quaternion.copy(p.quat);
  } else if (game.cameraMode === 'LSO') {
    p.mesh.visible = true;
    cockpitInteriorGroup.visible = false;
    if (game.state === 'CARRIER') {
      camera.position.set(
        carrierGroup.position.x - 21.0,
        carrierGroup.userData.deckY + 3.4,
        carrierGroup.position.z + 68.0
      );
      camera.lookAt(p.pos);
    } else {
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(p.quat);
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(p.quat);
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(p.quat);
      const desiredCamPos = p.pos
        .clone()
        .addScaledVector(forward, 16.0)
        .addScaledVector(right, 11.5)
        .addScaledVector(up, 3.2);
      camera.position.lerp(desiredCamPos, Math.min(1, dt * 10.0));
      camera.lookAt(p.pos);
    }
  } else {
    p.mesh.visible = true;
    cockpitInteriorGroup.visible = false;
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
    if (cockpitInteriorGroup.visible) {
      cockpitInteriorGroup.position.copy(camera.position);
    }
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

  if (game.state === 'HANGAR' || game.state === 'DEBRIEF') return;

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

  // 2B. CCIP (Continuously Computed Impact Point) Air-to-Ground Bombing Pipper!
  if ((game.state === 'STRIKE' || game.groundTargets.length > 0) && p.bombs > 0) {
    const impactWorld = computeBombImpactPoint(p.pos, p.vel, 10.0);
    const ccipScr = projectWorldToScreen(impactWorld);
    if (ccipScr.inFront) {
      const pipX = THREE.MathUtils.clamp(ccipScr.x, 60, w - 60);
      const pipY = THREE.MathUtils.clamp(ccipScr.y, 60, h - 60);

      let overTarget = false;
      for (const gt of game.groundTargets) {
        if (impactWorld.distanceTo(gt.pos) < 88) {
          overTarget = true;
          break;
        }
      }

      ctxHUD.save();
      ctxHUD.strokeStyle = overTarget ? '#ff3b47' : '#f5a623';
      ctxHUD.fillStyle = ctxHUD.strokeStyle;
      ctxHUD.lineWidth = overTarget ? 2.4 : 1.6;
      ctxHUD.setLineDash([5, 4]);
      ctxHUD.beginPath();
      ctxHUD.moveTo(cx, cy + 8);
      ctxHUD.lineTo(pipX, pipY);
      ctxHUD.stroke();
      ctxHUD.setLineDash([]);

      ctxHUD.beginPath();
      ctxHUD.arc(pipX, pipY, 16, 0, Math.PI * 2);
      ctxHUD.stroke();
      ctxHUD.beginPath();
      ctxHUD.arc(pipX, pipY, 3, 0, Math.PI * 2);
      ctxHUD.fill();

      ctxHUD.font = '700 11px "JetBrains Mono", monospace';
      ctxHUD.fillText(overTarget ? 'DROP JDAM [V]!' : 'CCIP [V]', pipX - 34, pipY + 28);
      ctxHUD.restore();
    }
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

  // Strike 1 Canyon Radar Hard Deck Warning Indicator
  if (game.state === 'STRIKE' && game.strikeMission === 1 && game.missionPhase === 1) {
    ctxHUD.fillStyle = altFt > 850 ? '#ff3b47' : '#38bdf8';
    ctxHUD.font = '700 12px "JetBrains Mono", monospace';
    ctxHUD.fillText(
      altFt > 850 ? 'WARNING: ABOVE 850 FT RADAR CEILING — DIVE!' : 'RADAR CEILING: 850 FT (SAFE)',
      cx - 115,
      cy - 162
    );
  }

  // Special Op 2 Carrier Fleet Integrity Bar
  if (game.state === 'SPECOPS' && game.specopsMission === 2) {
    ctxHUD.fillStyle = game.carrierHp < 40 ? '#ff3b47' : '#38bdf8';
    ctxHUD.font = '700 12px "JetBrains Mono", monospace';
    ctxHUD.fillText(`USS NIMITZ INTEGRITY: ${game.carrierHp}%`, cx - 88, cy - 162);
  }

  // 5. Compass Heading Tape at Top
  const hdgDeg = ((Math.round(THREE.MathUtils.radToDeg(-p.yaw)) % 360) + 360) % 360;
  ctxHUD.strokeRect(cx - 32, 54, 64, 24);
  ctxHUD.font = '700 13px "JetBrains Mono", monospace';
  ctxHUD.fillStyle = '#24f07d';
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

  // Friendly AI Wingman "ROOSTER" Reticle
  if (game.wingman) {
    const wScr = projectWorldToScreen(game.wingman.pos);
    if (wScr.inFront && wScr.x > 25 && wScr.x < w - 25 && wScr.y > 25 && wScr.y < h - 25) {
      ctxHUD.strokeStyle = '#38bdf8';
      ctxHUD.fillStyle = '#38bdf8';
      ctxHUD.strokeRect(wScr.x - 14, wScr.y - 14, 28, 28);
      ctxHUD.font = '600 10px "JetBrains Mono", monospace';
      ctxHUD.fillText('ALLY ROOSTER', wScr.x - 32, wScr.y - 18);
    }
  }

  // Next Sky Ring Gate Indicator (Special Op 1)
  if (game.state === 'SPECOPS' && game.specopsMission === 1 && game.skyRings[game.ringIndex]) {
    const nextRing = game.skyRings[game.ringIndex];
    const rScr = projectWorldToScreen(nextRing.pos);
    const distM = Math.round(p.pos.distanceTo(nextRing.pos));
    if (rScr.inFront) {
      const rx = THREE.MathUtils.clamp(rScr.x, 45, w - 45);
      const ry = THREE.MathUtils.clamp(rScr.y, 45, h - 45);
      ctxHUD.strokeStyle = '#38bdf8';
      ctxHUD.fillStyle = '#38bdf8';
      ctxHUD.beginPath();
      ctxHUD.arc(rx, ry, 22, 0, Math.PI * 2);
      ctxHUD.stroke();
      ctxHUD.font = '700 11px "JetBrains Mono", monospace';
      ctxHUD.fillText(`GATE ${game.ringIndex + 1}/${game.totalRings} (${distM}M)`, rx - 48, ry - 28);
    }
  }

  // Air Enemies & Ground Strike Targets on Radar & 3D HUD Reticles
  const allTargets = [...game.enemies, ...game.groundTargets];
  if (allTargets.length > 0) {
    ctxHUD.strokeStyle = 'hsla(146, 86%, 54%, 0.35)';
    ctxHUD.beginPath();
    ctxHUD.arc(cx, cy, 132, 0, Math.PI * 2);
    ctxHUD.stroke();

    for (const e of allTargets) {
      const rel = e.pos.clone().sub(p.pos);
      const rx = (rel.x * cosY - rel.z * sinY) / 45;
      const rz = (rel.x * sinY + rel.z * cosY) / 45;
      const rDist = Math.hypot(rx, rz);
      const clampedRx = rDist > radarR - 5 ? (rx / rDist) * (radarR - 5) : rx;
      const clampedRz = rDist > radarR - 5 ? (rz / rDist) * (radarR - 5) : rz;

      ctxHUD.fillStyle = e === p.lockedTarget ? '#ff3b47' : e.isGroundTarget ? '#38bdf8' : '#f5a623';
      ctxHUD.beginPath();
      ctxHUD.arc(radarX + clampedRx, radarY + clampedRz, 3.5, 0, Math.PI * 2);
      ctxHUD.fill();

      const scr = projectWorldToScreen(e.pos);
      const distMeters = Math.round(p.pos.distanceTo(e.pos));
      const isLockedTarget = e === p.lockedTarget;

      if (scr.inFront && scr.x >= 20 && scr.x <= w - 20 && scr.y >= 20 && scr.y <= h - 20) {
        const isFullLock = isLockedTarget && p.lockProgress >= 1.0;
        ctxHUD.strokeStyle = isFullLock
          ? '#ff3b47'
          : isLockedTarget
          ? '#f5a623'
          : e.isGroundTarget
          ? '#38bdf8'
          : '#24f07d';
        ctxHUD.fillStyle = ctxHUD.strokeStyle;
        ctxHUD.lineWidth = isLockedTarget ? 2.0 : 1.4;

        if (e.isGroundTarget) {
          // Diamond target box for Ground / Naval Strike Targets
          ctxHUD.beginPath();
          ctxHUD.moveTo(scr.x, scr.y - 22);
          ctxHUD.lineTo(scr.x + 22, scr.y);
          ctxHUD.lineTo(scr.x, scr.y + 22);
          ctxHUD.lineTo(scr.x - 22, scr.y);
          ctxHUD.closePath();
          ctxHUD.stroke();
        } else {
          ctxHUD.strokeRect(scr.x - 18, scr.y - 18, 36, 36);
        }

        ctxHUD.font = '600 11px "JetBrains Mono", monospace';
        const labelX = THREE.MathUtils.clamp(scr.x - 32, 24, w - 185);
        const labelY = THREE.MathUtils.clamp(scr.y - 26, 34, h - 42);
        ctxHUD.fillText(`${e.label} ${distMeters}M`, labelX, labelY);

        ctxHUD.fillRect(scr.x - 18, scr.y + 24, 36 * (e.hp / e.maxHp), 3);

        if (isLockedTarget) {
          if (p.lockProgress > 0) {
            ctxHUD.beginPath();
            ctxHUD.arc(scr.x, scr.y, 26, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p.lockProgress);
            ctxHUD.stroke();
          }
          if (isFullLock) {
            ctxHUD.font = '700 12px "JetBrains Mono", monospace';
            const shootX = THREE.MathUtils.clamp(scr.x - 35, 24, w - 125);
            ctxHUD.fillText(e.isGroundTarget ? 'BOMB [V] / [F]' : 'SHOOT [F]', shootX, scr.y + 40);
          }

          if (!e.isGroundTarget && distMeters < 1100) {
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
        const arrowR = 132;
        const ax = cx + Math.cos(angle) * arrowR;
        let ay = cy + Math.sin(angle) * arrowR;
        if (Math.abs(ay - cy) < 28) {
          ay = ay < cy ? cy - 32 : cy + 32;
        }
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
  const isCarrierApproachActive =
    game.state === 'CARRIER' || (game.state === 'SPECOPS' && game.specopsMission === 3 && game.missionPhase === 2);

  if (isCarrierApproachActive) {
    const stage = CARRIER_STAGES[game.carrierStage] || CARRIER_STAGES[1];
    const TouchdownWorld = new THREE.Vector3(0, carrierGroup.userData.deckY, 75)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), carrierGroup.rotation.y)
      .add(carrierGroup.position);

    const tdScr = projectWorldToScreen(TouchdownWorld);
    if (tdScr.inFront) {
      ctxHUD.strokeStyle = '#38bdf8';
      ctxHUD.strokeRect(tdScr.x - 10, tdScr.y - 10, 20, 20);
      ctxHUD.font = '600 11px "JetBrains Mono", monospace';
      ctxHUD.fillStyle = '#38bdf8';
      ctxHUD.fillText('#3 WIRE', tdScr.x - 22, tdScr.y - 15);
    }

    const relY = p.pos.y - carrierGroup.userData.deckY;
    const distFromWire3 = p.pos.z - carrierGroup.position.z - 75;
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(p.quat);

    if (distFromWire3 > -25 && forward.z < -0.2 && !(game.state === 'CARRIER' && stage.meatballOut)) {
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
  } else if (game.state === 'STRIKE') {
    modeLabel.textContent = `STRIKE MISSION ${game.strikeMission}`;
    waveVal.textContent = `${game.groundTargets.length} TGT LEFT • ${game.score} PTS`;
  } else if (game.state === 'SPECOPS') {
    modeLabel.textContent = `SPECIAL OP ${game.specopsMission}`;
    if (game.specopsMission === 1) {
      waveVal.textContent = `GATE ${game.ringIndex} / ${game.totalRings}`;
    } else if (game.specopsMission === 2) {
      waveVal.textContent = `CVN-68: ${game.carrierHp}% • W${game.wave}/3`;
    } else {
      waveVal.textContent = game.missionPhase === 1 ? `${game.enemies.length} BANDITS` : 'TRAP ON DECK';
    }
  } else {
    modeLabel.textContent = 'CARRIER TRAP';
    waveVal.textContent = `STAGE ${game.carrierStage} (${p.config.idealApproachKts} KT TGT)`;
  }

  document.getElementById('hud-missile-val').textContent = `${p.missiles} / ${p.config.missiles} [F]`;
  const bombEl = document.getElementById('hud-bomb-val');
  if (bombEl) {
    bombEl.textContent = `${p.bombs} [V]`;
  }
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

  for (let s = 1; s <= 10; s++) {
    const badge = document.getElementById(`badge-stage-${s}`);
    if (badge) {
      const grade = saveData.stageGrades[s];
      badge.textContent = grade || 'UNFLOWN';
      badge.className = grade ? 'stage-grade-badge earned' : 'stage-grade-badge';
    }
  }

  for (let st = 1; st <= 3; st++) {
    const badge = document.getElementById(`badge-strike-${st}`);
    if (badge) {
      const grade = saveData.strikeGrades[st];
      badge.textContent = grade || 'UNFLOWN';
      badge.className = grade ? 'stage-grade-badge earned' : 'stage-grade-badge';
    }
  }

  for (let sp = 1; sp <= 3; sp++) {
    const badge = document.getElementById(`badge-specops-${sp}`);
    if (badge) {
      const grade = saveData.specopsGrades[sp];
      badge.textContent = grade || 'UNFLOWN';
      badge.className = grade ? 'stage-grade-badge earned' : 'stage-grade-badge';
    }
  }

  if (game.state === 'HANGAR') {
    hangarScreen.classList.remove('hidden');
    flightUI.classList.add('hidden');
    debriefModal.classList.add('hidden');
    abortBtn.classList.add('hidden');
  } else if (['COMBAT', 'CARRIER', 'STRIKE', 'SPECOPS'].includes(game.state)) {
    hangarScreen.classList.add('hidden');
    flightUI.classList.remove('hidden');
    debriefModal.classList.add('hidden');
    abortBtn.classList.remove('hidden');
  }
}

let lastAdvanceType = 'CARRIER';

function showDebriefModal({ badge, title, subtitle, metrics, canAdvance, advanceType = 'CARRIER' }) {
  game.state = 'DEBRIEF';
  lastAdvanceType = advanceType;
  sound.updateEngine(0, false);
  sound.updateSeekerTone('off');
  sound.setMusicMode('anthem');

  document.getElementById('debrief-badge').textContent = badge;
  document.getElementById('debrief-title').textContent = title;
  document.getElementById('debrief-subtitle').textContent = subtitle;

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

// Mission Category Filter Tabs in Hangar Right Column
document.querySelectorAll('.filter-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    const filter = tab.getAttribute('data-filter') || 'all';
    document.querySelectorAll('.filter-tab').forEach((t) => t.classList.toggle('active', t === tab));
    document.querySelectorAll('.mission-category-group').forEach((grp) => {
      const cat = grp.getAttribute('data-category');
      if (filter === 'all' || cat === filter) {
        grp.classList.remove('hidden');
      } else {
        grp.classList.add('hidden');
      }
    });
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

document.querySelectorAll('.carrier-stage-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    saveCallsignFromInput();
    const stg = Number(btn.getAttribute('data-stage')) || 1;
    lastMissionType = 'CARRIER';
    startCarrierStage(stg);
  });
});

document.querySelectorAll('.strike-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    saveCallsignFromInput();
    const strikeId = Number(btn.getAttribute('data-strike')) || 1;
    lastMissionType = 'STRIKE';
    startStrikeMission(strikeId);
  });
});

document.querySelectorAll('.specops-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    saveCallsignFromInput();
    const opId = Number(btn.getAttribute('data-specops')) || 1;
    lastMissionType = 'SPECOPS';
    startSpecOpsMission(opId);
  });
});

document.getElementById('btn-toggle-music').addEventListener('click', () => {
  sound.init();
  const musicOn = sound.toggleMusic();
  document.getElementById('btn-toggle-music').textContent = musicOn ? 'MUSIC: TOP GUN [B]' : 'MUSIC: OFF [B]';
});

document.getElementById('btn-toggle-camera').addEventListener('click', () => {
  cycleCameraMode();
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
  cockpitInteriorGroup.visible = false;
  sound.setMusicMode('anthem');
  setAtmosphere(CARRIER_STAGES[1]);
  updateUIOverlays();
});

document.getElementById('btn-debrief-retry').addEventListener('click', () => {
  if (lastMissionType === 'CARRIER') {
    startCarrierStage(game.carrierStage);
  } else if (lastMissionType === 'STRIKE') {
    startStrikeMission(game.strikeMission);
  } else if (lastMissionType === 'SPECOPS') {
    startSpecOpsMission(game.specopsMission);
  } else {
    startCombatMode();
  }
});

document.getElementById('btn-debrief-next').addEventListener('click', () => {
  if (lastAdvanceType === 'STRIKE') {
    startStrikeMission(Math.min(3, game.strikeMission + 1));
  } else if (lastAdvanceType === 'SPECOPS') {
    startSpecOpsMission(Math.min(3, game.specopsMission + 1));
  } else {
    startCarrierStage(Math.min(10, game.carrierStage + 1));
  }
});

document.getElementById('btn-debrief-hangar').addEventListener('click', () => {
  clearCombatEntities();
  game.state = 'HANGAR';
  game.player.mesh.visible = true;
  cockpitInteriorGroup.visible = false;
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
    cycleCameraMode();
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
  } else if (e.code === 'Escape' && ['COMBAT', 'CARRIER', 'STRIKE', 'SPECOPS'].includes(game.state)) {
    clearCombatEntities();
    game.state = 'HANGAR';
    game.player.mesh.visible = true;
    cockpitInteriorGroup.visible = false;
    sound.setMusicMode('anthem');
    setAtmosphere(CARRIER_STAGES[1]);
    updateUIOverlays();
  }

  if (['COMBAT', 'CARRIER', 'STRIKE', 'SPECOPS'].includes(game.state)) {
    if (e.code === 'KeyF') {
      firePlayerMissile();
    } else if (e.code === 'KeyV') {
      dropPlayerBomb();
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
    } else if (e.code === 'KeyT') {
      const allTargets = [...game.groundTargets, ...game.enemies];
      if (allTargets.length > 0) {
        const idx = allTargets.indexOf(game.player.lockedTarget);
        game.player.lockedTarget = allTargets[(idx + 1) % allTargets.length];
        game.player.lockProgress = 0;
      }
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
