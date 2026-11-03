import * as THREE from 'three';

export const JET_CONFIGS = {
  f18: {
    id: 'f18',
    name: 'F/A-18E SUPER HORNET',
    liveryName: 'TOPGUN MAVERICK SPECIAL',
    tagline: "Maverick's Special Strike Livery • M61 Vulcan 20mm + 8x AIM-9X",
    maxSpeedKts: 670,
    cruiseSpeedKts: 345,
    minSpeedKts: 112,
    idealApproachKts: 138,
    pitchRate: 1.58,
    rollRate: 2.8,
    yawRate: 0.86,
    lockTimeSec: 1.15,
    missiles: 8,
    flares: 12,
    bodyColor: 0x8997a7,
    accentColor: 0x161c24,
    stripeColor: 0x1da1f2,
    noseColor: 0x3b4552
  },
  f14: {
    id: 'f14',
    name: 'F-14D SUPER TOMCAT',
    liveryName: 'VF-1 WOLFPACK / MAVERICK & GOOSE',
    tagline: 'Two-Seat Swing-Wing Legend • Mach 2.3 Afterburners + AIM-54 Phoenix',
    maxSpeedKts: 790,
    cruiseSpeedKts: 375,
    minSpeedKts: 118,
    idealApproachKts: 142,
    pitchRate: 1.45,
    rollRate: 2.5,
    yawRate: 0.8,
    lockTimeSec: 1.1,
    missiles: 10,
    flares: 14,
    bodyColor: 0x9aa6b2,
    accentColor: 0x181d24,
    stripeColor: 0xf5b82e,
    noseColor: 0x222830
  },
  f35: {
    id: 'f35',
    name: 'F-35C LIGHTNING II',
    liveryName: 'TOPGUN STEALTH AGGRESSOR',
    tagline: '5th-Gen Carrier Stealth Fighter • Gold RAM Canopy + Rapid Lock Seeker',
    maxSpeedKts: 690,
    cruiseSpeedKts: 355,
    minSpeedKts: 110,
    idealApproachKts: 136,
    pitchRate: 1.85,
    rollRate: 3.15,
    yawRate: 0.96,
    lockTimeSec: 0.8,
    missiles: 6,
    flares: 14,
    bodyColor: 0x464e59,
    accentColor: 0x262b33,
    stripeColor: 0x38bdf8,
    noseColor: 0x2e343d
  }
};

// Cache procedural color, bump, and tail-flash textures
const materialCache = new Map();
const tailMaterialCache = new Map();

function getAircraftMaterialSet(type, bodyHex, accentHex, stripeHex, isEnemy) {
  const key = `${type}-${bodyHex}-${accentHex}-${stripeHex}`;
  if (materialCache.has(key)) return materialCache.get(key);

  // 1. Color Albedo Canvas (512x512)
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = 512;
  colorCanvas.height = 512;
  const ctx = colorCanvas.getContext('2d');

  // 2. Bump Map Canvas (512x512) for 3D engraved panel seams & rivets
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 512;
  bumpCanvas.height = 512;
  const bCtx = bumpCanvas.getContext('2d');

  const baseColor = new THREE.Color(bodyHex);
  const accentColor = new THREE.Color(accentHex);
  const stripeColor = new THREE.Color(stripeHex || accentHex);

  ctx.fillStyle = `#${baseColor.getHexString()}`;
  ctx.fillRect(0, 0, 512, 512);

  bCtx.fillStyle = '#808080'; // Neutral bump height
  bCtx.fillRect(0, 0, 512, 512);

  // If Su-57 5th-Gen Felon ('su33'), paint digital splinter camo blocks
  if (type === 'su33') {
    const camoColors = ['#2d3744', '#566575', '#1b222c'];
    for (let i = 0; i < 36; i++) {
      ctx.fillStyle = camoColors[i % camoColors.length];
      ctx.fillRect((i * 83) % 460, (i * 59) % 460, 75, 45);
    }
  } else {
    // Subtle metallic panel shade variation & airflow weathering streaks
    for (let i = 0; i < 28; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.045)';
      ctx.fillRect((i * 73) % 480, (i * 41) % 480, 64 + (i % 3) * 36, 44 + (i % 4) * 32);
    }
  }

  // Engraved Aerospace Panel Seams (drawn onto both Color and Bump maps)
  ctx.strokeStyle = isEnemy ? 'rgba(0, 0, 0, 0.45)' : 'rgba(18, 26, 36, 0.34)';
  ctx.lineWidth = 2;
  bCtx.strokeStyle = '#303030'; // Deep panel groove in bump map
  bCtx.lineWidth = 3;

  for (let y = 48; y < 512; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();

    bCtx.beginPath();
    bCtx.moveTo(0, y);
    bCtx.lineTo(512, y);
    bCtx.stroke();

    // Raised rivets along panel seams
    bCtx.fillStyle = '#c8c8c8';
    for (let rx = 12; rx < 512; rx += 18) {
      bCtx.fillRect(rx, y - 5, 2, 2);
      bCtx.fillRect(rx, y + 4, 2, 2);
    }
  }

  for (let x = 64; x < 512; x += 96) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();

    bCtx.beginPath();
    bCtx.moveTo(x, 0);
    bCtx.lineTo(x, 512);
    bCtx.stroke();
  }

  // Top Gun Livery Racing Stripes
  if (type === 'f18') {
    // Maverick's iconic black spine band bordered by dual electric-blue stripes
    ctx.fillStyle = `#${accentColor.getHexString()}`;
    ctx.fillRect(0, 196, 512, 52);
    ctx.fillStyle = `#${stripeColor.getHexString()}`;
    ctx.fillRect(0, 184, 512, 9);
    ctx.fillRect(0, 251, 512, 9);
  } else if (type === 'f14') {
    // VF-1 / VF-84 high-contrast black-and-gold squadron trim
    ctx.fillStyle = `#${accentColor.getHexString()}`;
    ctx.fillRect(0, 200, 512, 34);
    ctx.fillStyle = `#${stripeColor.getHexString()}`;
    ctx.fillRect(0, 236, 512, 10);
  } else {
    ctx.fillStyle = `#${stripeColor.getHexString()}`;
    ctx.fillRect(0, 212, 512, 22);
  }

  // Wing & Fuselage Roundel Insignia
  if (isEnemy) {
    // Red Star with crisp white outline (Top Gun MiG-28 / Su-57 style)
    drawStar(ctx, 256, 140, 5, 28, 12, '#e61919', '#ffffff');
  } else {
    // US Navy National Star-and-Bars Roundel
    ctx.fillStyle = '#1b2838';
    ctx.fillRect(204, 128, 104, 24);
    ctx.strokeStyle = '#d8e4f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(204, 128, 104, 24);
    ctx.beginPath();
    ctx.arc(256, 140, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    drawStar(ctx, 256, 140, 5, 20, 8, '#eef4fa', null);
  }

  const colorTex = new THREE.CanvasTexture(colorCanvas);
  colorTex.wrapS = THREE.RepeatWrapping;
  colorTex.wrapT = THREE.RepeatWrapping;
  colorTex.anisotropy = 4;

  const bumpTex = new THREE.CanvasTexture(bumpCanvas);
  bumpTex.wrapS = THREE.RepeatWrapping;
  bumpTex.wrapT = THREE.RepeatWrapping;

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: colorTex,
    bumpMap: bumpTex,
    bumpScale: 0.032,
    roughness: type === 'mig29' ? 0.24 : 0.34,
    metalness: type === 'mig29' ? 0.72 : 0.62
  });

  materialCache.set(key, bodyMat);
  return bodyMat;
}

function drawStar(ctx, cx, cy, spikes, outerR, innerR, fillStyle, strokeStyle) {
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
    rot += step;
  }
  ctx.closePath();
  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }
}

function getTailFinMaterial(type, isEnemy) {
  if (tailMaterialCache.has(type)) return tailMaterialCache.get(type);

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (isEnemy) {
    // Top Gun "MiG-28" / Su-57 Aggressor Black Tail with Red Star
    ctx.fillStyle = type === 'su33' ? '#1f2630' : '#101318';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#d91b24';
    ctx.fillRect(0, 24, 256, 12);
    drawStar(ctx, 128, 128, 5, 46, 19, '#e61919', '#ffffff');
  } else if (type === 'f18') {
    // Top Gun: Maverick F/A-18E Tail: Charcoal black with dual electric-blue stripes & gold TOPGUN star
    ctx.fillStyle = '#141920';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#1da1f2';
    ctx.fillRect(0, 32, 256, 14);
    ctx.fillRect(0, 54, 256, 8);
    drawStar(ctx, 128, 132, 5, 34, 14, '#f5b82e', '#1da1f2');
    ctx.fillStyle = '#eef4fa';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TOPGUN', 128, 206);
  } else if (type === 'f14') {
    // Iconic Tomcat Black Tail with Gold/White Chevron & VF-1 / Jolly Rogers tribute
    ctx.fillStyle = '#14181f';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#f5b82e';
    ctx.fillRect(0, 26, 256, 18);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 48, 256, 8);
    drawStar(ctx, 128, 128, 5, 38, 16, '#f5b82e', '#ffffff');
    ctx.fillStyle = '#f5b82e';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VF-1', 128, 208);
  } else {
    // F-35C Stealth Low-Vis Tail
    ctx.fillStyle = '#262c34';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(0, 34, 256, 10);
    drawStar(ctx, 128, 130, 5, 32, 13, '#38bdf8', null);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.35,
    metalness: 0.55
  });
  tailMaterialCache.set(type, mat);
  return mat;
}

/**
 * Builds an authentic, high-detail 3D naval jet fighter or bomber mesh with Top Gun liveries.
 * Forward direction in local space is -Z.
 */
export function createJetMesh(type = 'f18') {
  const root = new THREE.Group();

  let bodyHex = 0x8997a7;
  let accentHex = 0x161c24;
  let stripeHex = 0x1da1f2;
  let noseHex = 0x3b4552;
  let canopyHex = 0x58c4f6;
  const burnerHex = 0xff8822;
  let isEnemy = false;

  if (JET_CONFIGS[type]) {
    bodyHex = JET_CONFIGS[type].bodyColor;
    accentHex = JET_CONFIGS[type].accentColor;
    stripeHex = JET_CONFIGS[type].stripeColor;
    noseHex = JET_CONFIGS[type].noseColor;
    if (type === 'f35') {
      canopyHex = 0xd4a238; // Gold-tinted radar-absorbent stealth canopy
    }
  } else if (type === 'mig29') {
    // Top Gun Iconic Jet-Black "MiG-28" Aggressor!
    bodyHex = 0x14181f;
    accentHex = 0xd91b24;
    stripeHex = 0xd91b24;
    noseHex = 0x0c0e12;
    canopyHex = 0xffa630;
    isEnemy = true;
  } else if (type === 'su33') {
    // Top Gun: Maverick 5th-Gen "Su-57 Felon" Enemy Ace!
    bodyHex = 0x384352;
    accentHex = 0xd9222b;
    stripeHex = 0xd9222b;
    noseHex = 0x181d24;
    canopyHex = 0xff5533;
    isEnemy = true;
  } else if (type === 'bomber') {
    bodyHex = 0x6c7a89;
    accentHex = 0x992828;
    stripeHex = 0x992828;
    noseHex = 0x323a42;
    isEnemy = true;
  }

  const bodyMat = getAircraftMaterialSet(type, bodyHex, accentHex, stripeHex, isEnemy);
  const tailMat = getTailFinMaterial(type, isEnemy);

  const accentMat = new THREE.MeshStandardMaterial({
    color: accentHex,
    roughness: 0.38,
    metalness: 0.56
  });
  const noseMat = new THREE.MeshStandardMaterial({
    color: noseHex,
    roughness: 0.26,
    metalness: 0.45
  });
  const canopyMat = new THREE.MeshPhysicalMaterial({
    color: canopyHex,
    roughness: 0.06,
    metalness: 0.18,
    transmission: 0.48,
    transparent: true,
    opacity: 0.82,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04
  });
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x1a1f26,
    roughness: 0.42,
    metalness: 0.82
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xdbe4eb,
    roughness: 0.15,
    metalness: 0.92
  });
  const missileWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xf2f6fa,
    roughness: 0.22,
    metalness: 0.32
  });

  const isBomber = type === 'bomber';
  const isTomcat = type === 'f14';
  const isSingleEngine = type === 'f35';
  const scaleMul = isBomber ? 1.85 : 1.0;

  // ==========================================
  // 1. LOFTED AERODYNAMIC FUSELAGE, RADOME & PANCAKE DECK
  // ==========================================
  // Continuous LatheGeometry profile from nose tip (-9.0) to tailcone (+4.8)
  const lathePoints = [
    new THREE.Vector2(0.01, -9.0), // Radome tip
    new THREE.Vector2(0.32, -7.8), // Forward radome
    new THREE.Vector2(0.62, -6.1), // Radome base
    new THREE.Vector2(0.78, -4.2), // Forward cockpit tub
    new THREE.Vector2(0.86, -1.8), // Mid cockpit / dorsal spine
    new THREE.Vector2(0.84, 1.4),  // Aft dorsal spine
    new THREE.Vector2(0.66, 4.4),  // Tailcone taper
    new THREE.Vector2(0.35, 4.85)  // Beaver tail tip
  ];
  const fuselageGeo = new THREE.LatheGeometry(lathePoints, 20);
  fuselageGeo.rotateX(Math.PI / 2);
  // Flatten fuselage cross-section into an aerodynamic chined oval
  fuselageGeo.scale(isTomcat ? 1.32 : 1.15, 0.76, 1.0);
  const fuselage = new THREE.Mesh(fuselageGeo, bodyMat);
  fuselage.position.set(0, 0.05, 0);
  fuselage.castShadow = true;
  root.add(fuselage);

  // Dark Radome Nose Cap & Matte Black Anti-Glare Panel ahead of Windscreen
  const radomeCapGeo = new THREE.ConeGeometry(0.56, 3.3, 18);
  radomeCapGeo.rotateX(-Math.PI / 2);
  radomeCapGeo.scale(1.12, 0.78, 1.0);
  const radomeCap = new THREE.Mesh(radomeCapGeo, noseMat);
  radomeCap.position.set(0, 0.03, -7.45);
  root.add(radomeCap);

  // Supersonic Pitot Probe & AoA Vanes on Nose
  const pitot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.035, 1.25, 8).rotateX(-Math.PI / 2),
    chromeMat
  );
  pitot.position.set(0, 0.02, -9.5);
  root.add(pitot);

  // Twin Engine Nacelles (Widely spaced on F-14 Tomcat & Su-57; closely spaced on F/A-18E; single on F-35C)
  const nacelleOffsets = isSingleEngine ? [0] : isTomcat ? [-0.88, 0.88] : [-0.58, 0.58];
  for (const nx of nacelleOffsets) {
    const nacRadius = isSingleEngine ? 0.68 : 0.48;
    const nacGeo = new THREE.CylinderGeometry(nacRadius * 0.9, nacRadius, 7.6, 16);
    nacGeo.rotateX(Math.PI / 2);
    const nac = new THREE.Mesh(nacGeo, bodyMat);
    nac.position.set(nx, -0.14, 1.05);
    nac.castShadow = true;
    root.add(nac);
  }

  // F-14 Wide Pancake Upper Deck & Wing-Glove Fairings
  if (isTomcat) {
    const pancakeShape = new THREE.Shape();
    pancakeShape.moveTo(-0.85, -4.2);
    pancakeShape.lineTo(-2.45, -1.2);
    pancakeShape.lineTo(-2.15, 1.8);
    pancakeShape.lineTo(-1.1, 4.4);
    pancakeShape.lineTo(1.1, 4.4);
    pancakeShape.lineTo(2.15, 1.8);
    pancakeShape.lineTo(2.45, -1.2);
    pancakeShape.lineTo(0.85, -4.2);
    pancakeShape.closePath();

    const pancakeGeo = new THREE.ExtrudeGeometry(pancakeShape, {
      depth: 0.22,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.1,
      bevelSegments: 3
    });
    pancakeGeo.rotateX(Math.PI / 2);
    const pancake = new THREE.Mesh(pancakeGeo, bodyMat);
    pancake.position.set(0, 0.18, 0.1);
    pancake.castShadow = true;
    root.add(pancake);
  } else {
    // Curved Leading Edge Root Extensions (LERX) for F/A-18E, F-35C, MiG-28, Su-57
    const lexShape = new THREE.Shape();
    lexShape.moveTo(-0.68, -4.9);
    lexShape.quadraticCurveTo(-1.85, -2.5, -2.25, -0.3);
    lexShape.lineTo(-2.25, 2.4);
    lexShape.lineTo(2.25, 2.4);
    lexShape.lineTo(2.25, -0.3);
    lexShape.quadraticCurveTo(1.85, -2.5, 0.68, -4.9);
    lexShape.closePath();

    const lexGeo = new THREE.ExtrudeGeometry(lexShape, {
      depth: 0.14,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.07,
      bevelSegments: 2
    });
    lexGeo.rotateX(Math.PI / 2);
    const lex = new THREE.Mesh(lexGeo, bodyMat);
    lex.position.set(0, 0.14, -0.3);
    lex.castShadow = true;
    root.add(lex);
  }

  // Supersonic Wedge / Caret Air Intakes with Compressor Face
  const intakeX = isTomcat ? 1.22 : 1.02;
  for (const side of [-1, 1]) {
    const intakeHousing = new THREE.Mesh(
      new THREE.BoxGeometry(0.76, 0.66, 4.6),
      accentMat
    );
    intakeHousing.position.set(side * intakeX, -0.22, -0.2);
    intakeHousing.rotation.z = side * (isTomcat ? -0.1 : 0.16);
    root.add(intakeHousing);

    // Angled supersonic splitter ramp lip
    const intakeMouth = new THREE.Mesh(
      new THREE.PlaneGeometry(0.68, 0.58),
      new THREE.MeshBasicMaterial({ color: 0x070a0f })
    );
    intakeMouth.position.set(side * intakeX, -0.22, -2.51);
    intakeMouth.rotation.y = Math.PI;
    root.add(intakeMouth);
  }

  // ==========================================
  // 2. COCKPIT TUB, PILOTS (MAVERICK + GOOSE/ROOSTER ON F-14!) & BUBBLE CANOPY
  // ==========================================
  const crewPositionsZ = isTomcat ? [-2.75, -1.15] : [-2.35];
  crewPositionsZ.forEach((cz, idx) => {
    // Martin-Baker Ejection Seat with yellow pull handle
    const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.66, 0.22), darkMetalMat);
    seatBack.position.set(0, 0.46, cz + 0.34);
    seatBack.rotation.x = -0.15;
    root.add(seatBack);

    // Pilot / RIO Flight Helmet (Maverick in front, Goose/Rooster in back!)
    const helmetMat = new THREE.MeshStandardMaterial({
      color: idx === 0 ? 0x1c2838 : 0xe8f0f8,
      roughness: 0.18,
      metalness: 0.45
    });
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.21, 12, 12), helmetMat);
    helmet.position.set(0, 0.59, cz);
    root.add(helmet);

    // Dark Reflective Flight Visor
    const visor = new THREE.Mesh(
      new THREE.SphereGeometry(0.216, 10, 10, 0, Math.PI, 0, Math.PI * 0.55),
      new THREE.MeshBasicMaterial({ color: 0x0b0f14 })
    );
    visor.rotation.x = -Math.PI * 0.65;
    visor.position.copy(helmet.position);
    root.add(visor);
  });

  // Glowing Green Avionics HUD Combiner Glass in Front Cockpit
  const hudComb = new THREE.Mesh(
    new THREE.PlaneGeometry(0.36, 0.28),
    new THREE.MeshBasicMaterial({
      color: 0x24f07d,
      transparent: true,
      opacity: 0.48,
      side: THREE.DoubleSide
    })
  );
  hudComb.position.set(0, 0.57, isTomcat ? -3.55 : -3.18);
  hudComb.rotation.x = -0.45;
  root.add(hudComb);

  // Teardrop Bubble Canopy (Elongated on 2-Seat F-14 Tomcat!)
  const canopyGeo = new THREE.SphereGeometry(0.58, 20, 14);
  canopyGeo.scale(0.96, 0.78, isTomcat ? 4.35 : 3.4);
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.set(0, 0.49, isTomcat ? -2.05 : -2.35);
  root.add(canopy);

  // Canopy Frame Bow Arches
  const archPositionsZ = isTomcat ? [-3.4, -1.95] : [-3.1];
  for (const az of archPositionsZ) {
    const archGeo = new THREE.TorusGeometry(0.54, 0.04, 8, 16, Math.PI);
    const arch = new THREE.Mesh(archGeo, darkMetalMat);
    arch.position.set(0, 0.43, az);
    arch.rotation.x = -0.25;
    root.add(arch);
  }

  // ==========================================
  // 3. SWEPT AIRFOIL WINGS, NAVIGATION LIGHTS & ORDNANCE
  // ==========================================
  let leftWingPivot = null;
  let rightWingPivot = null;
  const externalMissiles = [];

  function buildOrdnanceMissile(x, y, z, scale = 1.0) {
    const mGrp = new THREE.Group();
    const mBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08 * scale, 0.08 * scale, 2.4 * scale, 10).rotateX(Math.PI / 2),
      missileWhiteMat
    );
    const mNose = new THREE.Mesh(
      new THREE.ConeGeometry(0.08 * scale, 0.44 * scale, 10).rotateX(-Math.PI / 2),
      darkMetalMat
    );
    mNose.position.z = -1.42 * scale;
    const mFins = new THREE.Mesh(
      new THREE.BoxGeometry(0.42 * scale, 0.42 * scale, 0.34 * scale),
      darkMetalMat
    );
    mFins.position.z = 0.88 * scale;
    const mForwardFins = new THREE.Mesh(
      new THREE.BoxGeometry(0.28 * scale, 0.28 * scale, 0.2 * scale),
      darkMetalMat
    );
    mForwardFins.position.z = -0.85 * scale;
    mGrp.add(mBody, mNose, mFins, mForwardFins);
    mGrp.position.set(x, y, z);
    return mGrp;
  }

  if (isTomcat) {
    // Variable-Sweep Tomcat Wings with Pivot Hinges inside Wing Gloves
    leftWingPivot = new THREE.Group();
    leftWingPivot.position.set(-1.35, 0.16, -0.45);
    root.add(leftWingPivot);

    const lwShape = new THREE.Shape();
    lwShape.moveTo(0, -1.05);
    lwShape.lineTo(-6.6, 0.15);
    lwShape.lineTo(-6.6, 1.15);
    lwShape.lineTo(0, 1.65);
    lwShape.closePath();

    const lwGeo = new THREE.ExtrudeGeometry(lwShape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelThickness: 0.035,
      bevelSize: 0.045,
      bevelSegments: 2
    });
    lwGeo.rotateX(Math.PI / 2);
    const leftWingMesh = new THREE.Mesh(lwGeo, bodyMat);
    leftWingMesh.castShadow = true;
    leftWingPivot.add(leftWingMesh);

    // Port Red Navigation Light on Tomcat Wingtip
    const portLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff2222 })
    );
    portLight.position.set(-6.65, 0.06, 0.65);
    leftWingPivot.add(portLight);

    rightWingPivot = new THREE.Group();
    rightWingPivot.position.set(1.35, 0.16, -0.45);
    root.add(rightWingPivot);

    const rwShape = new THREE.Shape();
    rwShape.moveTo(0, -1.05);
    rwShape.lineTo(6.6, 0.15);
    rwShape.lineTo(6.6, 1.15);
    rwShape.lineTo(0, 1.65);
    rwShape.closePath();

    const rwGeo = new THREE.ExtrudeGeometry(rwShape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelThickness: 0.035,
      bevelSize: 0.045,
      bevelSegments: 2
    });
    rwGeo.rotateX(Math.PI / 2);
    const rightWingMesh = new THREE.Mesh(rwGeo, bodyMat);
    rightWingMesh.castShadow = true;
    rightWingPivot.add(rightWingMesh);

    // Starboard Green Navigation Light on Tomcat Wingtip
    const stbdLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x22ff55 })
    );
    stbdLight.position.set(6.65, 0.06, 0.65);
    rightWingPivot.add(stbdLight);

    // Heavy AIM-54 Phoenix Belly Missiles + Glove AIM-9 Sidewinders
    for (const mx of [-1.85, 1.85]) {
      const m = buildOrdnanceMissile(mx, -0.32, 0.1, 1.0);
      root.add(m);
      externalMissiles.push(m);
    }
    for (const mx of [-0.55, 0.55]) {
      const phoenix = buildOrdnanceMissile(mx, -0.42, -0.4, 1.28);
      root.add(phoenix);
      externalMissiles.push(phoenix);
    }
  } else {
    const wingSpan = type === 'f35' ? 12.8 : 12.2;
    const halfSpan = wingSpan * 0.5;
    const wingShape = new THREE.Shape();
    wingShape.moveTo(-1.1, -1.85);
    wingShape.lineTo(-halfSpan, 1.25);
    wingShape.lineTo(-halfSpan, 2.55);
    wingShape.lineTo(-1.1, 2.9);
    wingShape.lineTo(1.1, 2.9);
    wingShape.lineTo(halfSpan, 2.55);
    wingShape.lineTo(halfSpan, 1.25);
    wingShape.lineTo(1.1, -1.85);
    wingShape.closePath();

    const wingGeo = new THREE.ExtrudeGeometry(wingShape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelThickness: 0.035,
      bevelSize: 0.05,
      bevelSegments: 2
    });
    wingGeo.rotateX(Math.PI / 2);
    const wings = new THREE.Mesh(wingGeo, bodyMat);
    wings.position.set(0, 0.12, 0.2);
    wings.castShadow = true;
    root.add(wings);

    // Centerline Drop Tank on F/A-18E (Top Gun: Maverick hero fuel tank!)
    if (type === 'f18') {
      const tankGeo = new THREE.CylinderGeometry(0.24, 0.24, 3.6, 12).rotateX(Math.PI / 2);
      const tank = new THREE.Mesh(tankGeo, bodyMat);
      tank.position.set(0, -0.48, 0.2);
      root.add(tank);
    }

    // Wingtip Launch Rails, Nav Lights & Underwing Pylons
    const railGeo = new THREE.BoxGeometry(0.14, 0.2, 2.75);
    for (const side of [-1, 1]) {
      const rail = new THREE.Mesh(railGeo, accentMat);
      rail.position.set(side * halfSpan, 0.05, 1.9);
      root.add(rail);

      const navLight = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 8, 8),
        new THREE.MeshBasicMaterial({ color: side < 0 ? 0xff2222 : 0x22ff55 })
      );
      navLight.position.set(side * (halfSpan + 0.18), 0.08, 1.5);
      root.add(navLight);

      const tipMissile = buildOrdnanceMissile(side * (halfSpan + 0.14), 0.05, 1.8);
      root.add(tipMissile);
      externalMissiles.push(tipMissile);

      for (const px of [2.55, 4.05]) {
        const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.36, 1.65), accentMat);
        pylon.position.set(side * px, -0.14, 1.2);
        root.add(pylon);

        const pylonMissile = buildOrdnanceMissile(side * px, -0.34, 1.2);
        root.add(pylonMissile);
        externalMissiles.push(pylonMissile);
      }
    }
  }

  // ==========================================
  // 4. ANIMATED STABILATORS & PAINTED SQUADRON VERTICAL TAILS
  // ==========================================
  const stabX = isTomcat ? 1.35 : 1.1;
  const leftStabPivot = new THREE.Group();
  leftStabPivot.position.set(-stabX, 0.0, 4.15);
  root.add(leftStabPivot);

  const rightStabPivot = new THREE.Group();
  rightStabPivot.position.set(stabX, 0.0, 4.15);
  root.add(rightStabPivot);

  const stabShape = new THREE.Shape();
  stabShape.moveTo(0, -0.85);
  stabShape.lineTo(2.35, 0.35);
  stabShape.lineTo(2.35, 1.2);
  stabShape.lineTo(0, 1.3);
  stabShape.closePath();

  const stabGeoR = new THREE.ExtrudeGeometry(stabShape, { depth: 0.08, bevelEnabled: false });
  stabGeoR.rotateX(Math.PI / 2);
  const rightStabMesh = new THREE.Mesh(stabGeoR, accentMat);
  rightStabPivot.add(rightStabMesh);

  const leftStabMesh = rightStabMesh.clone();
  leftStabMesh.scale.x = -1;
  leftStabPivot.add(leftStabMesh);

  // Vertical Stabilizers with Top Gun Tail Flash Texture
  const tailShape = new THREE.Shape();
  tailShape.moveTo(0, 0);
  tailShape.lineTo(1.25, 2.25);
  tailShape.lineTo(2.4, 2.25);
  tailShape.lineTo(2.55, 0);
  tailShape.closePath();

  const tailGeo = new THREE.ExtrudeGeometry(tailShape, {
    depth: 0.12,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02
  });
  tailGeo.rotateY(Math.PI / 2);

  // Compute planar UVs for the vertical tail (flip U on starboard +X face so TOPGUN/VF-1 text is never mirrored!)
  const tPos = tailGeo.attributes.position;
  const tNorm = tailGeo.attributes.normal;
  const tUvs = [];
  for (let i = 0; i < tPos.count; i++) {
    const zVal = tPos.getZ(i);
    const nx = tNorm ? tNorm.getX(i) : -1;
    const u = nx >= 0 ? -zVal / 2.55 : (zVal + 2.55) / 2.55;
    const v = tPos.getY(i) / 2.25;
    tUvs.push(u, v);
  }
  tailGeo.setAttribute('uv', new THREE.Float32BufferAttribute(tUvs, 2));

  let tailStrobeMesh = null;
  if (isBomber || type === 'mig29') {
    const singleTail = new THREE.Mesh(tailGeo, tailMat);
    singleTail.scale.set(1.15, 1.3, 1.15);
    singleTail.position.set(0, 0.22, 2.4);
    root.add(singleTail);

    tailStrobeMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    tailStrobeMesh.position.set(0, 3.15, 4.2);
    root.add(tailStrobeMesh);
  } else {
    const cantAngle = isTomcat ? 0.07 : 0.32;
    const tailOffsetX = isTomcat ? 1.18 : 1.02;

    const leftTail = new THREE.Mesh(tailGeo, tailMat);
    leftTail.position.set(-tailOffsetX, 0.18, 2.3);
    leftTail.rotation.z = cantAngle;
    root.add(leftTail);

    const rightTail = new THREE.Mesh(tailGeo, tailMat);
    rightTail.position.set(tailOffsetX, 0.18, 2.3);
    rightTail.rotation.z = -cantAngle;
    root.add(rightTail);

    tailStrobeMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    tailStrobeMesh.position.set(-tailOffsetX - 0.15, 2.48, 4.1);
    root.add(tailStrobeMesh);
  }

  // ==========================================
  // 5. MULTI-PETAL VARIABLE NOZZLES, AFTERBURNERS & SUPERSONIC VAPOR CONE
  // ==========================================
  const burnerMeshes = [];
  const outerPlumeMat = new THREE.MeshBasicMaterial({
    color: burnerHex,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const innerCoreMat = new THREE.MeshBasicMaterial({
    color: 0xdff6ff,
    transparent: true,
    opacity: 0.96,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  for (const xOff of nacelleOffsets) {
    const nozzleRadius = isSingleEngine ? 0.56 : 0.45;
    const nozzleGroup = new THREE.Group();
    nozzleGroup.position.set(xOff, -0.12, 4.95);

    const nozzleRing = new THREE.Mesh(
      new THREE.CylinderGeometry(nozzleRadius * 0.82, nozzleRadius, 1.25, 16, 1, true).rotateX(Math.PI / 2),
      darkMetalMat
    );
    nozzleGroup.add(nozzleRing);

    // 10 Turkey-Feather Nozzle Petals around the perimeter
    for (let p = 0; p < 10; p++) {
      const ang = (p / 10) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.95), darkMetalMat);
      petal.position.set(
        Math.cos(ang) * nozzleRadius * 0.88,
        Math.sin(ang) * nozzleRadius * 0.88,
        0.15
      );
      petal.rotation.z = ang + Math.PI / 2;
      nozzleGroup.add(petal);
    }
    root.add(nozzleGroup);

    const coreDisc = new THREE.Mesh(
      new THREE.CircleGeometry(nozzleRadius * 0.78, 16),
      new THREE.MeshBasicMaterial({ color: 0xffaa33 })
    );
    coreDisc.position.set(xOff, -0.12, 5.45);
    root.add(coreDisc);

    const plumeGroup = new THREE.Group();
    plumeGroup.position.set(xOff, -0.12, 5.5);

    const outerConeGeo = new THREE.ConeGeometry(nozzleRadius * 0.86, 4.1, 16, 1, true);
    outerConeGeo.rotateX(Math.PI / 2);
    outerConeGeo.translate(0, 0, 2.05);
    const outerCone = new THREE.Mesh(outerConeGeo, outerPlumeMat.clone());
    plumeGroup.add(outerCone);

    const innerConeGeo = new THREE.ConeGeometry(nozzleRadius * 0.48, 2.6, 12);
    innerConeGeo.rotateX(Math.PI / 2);
    innerConeGeo.translate(0, 0, 1.3);
    const innerCone = new THREE.Mesh(innerConeGeo, innerCoreMat.clone());
    plumeGroup.add(innerCone);

    // Glowing Mach Shock Diamonds inside the Afterburner Plume
    for (let d = 1; d <= 4; d++) {
      const diamond = new THREE.Mesh(
        new THREE.OctahedronGeometry(nozzleRadius * (0.38 - d * 0.055), 0),
        innerCoreMat
      );
      diamond.scale.set(1, 1, 1.85);
      diamond.position.set(0, 0, d * 0.75);
      plumeGroup.add(diamond);
    }

    root.add(plumeGroup);
    burnerMeshes.push({ group: plumeGroup, outerMat: outerCone.material, innerMat: innerCone.material });
  }

  // Supersonic Mach 1+ Prandtl-Glauert Vapor Cone (appears above 550 KTS!)
  const vaporConeGeo = new THREE.ConeGeometry(4.2, 4.5, 24, 1, true);
  vaporConeGeo.rotateX(-Math.PI / 2);
  const vaporConeMat = new THREE.MeshBasicMaterial({
    color: 0xeef8ff,
    transparent: true,
    opacity: 0.0,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const vaporConeMesh = new THREE.Mesh(vaporConeGeo, vaporConeMat);
  vaporConeMesh.position.set(0, 0.1, 1.2);
  root.add(vaporConeMesh);

  // ==========================================
  // 6. DEPLOYABLE CARRIER LANDING GEAR & STRIPED TAILHOOK
  // ==========================================
  const gearGroup = new THREE.Group();
  const strutGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.05, 10);
  const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 16);
  wheelGeo.rotateZ(Math.PI / 2);

  // Nose Oleo Strut + Dual Catapult Launch Bar Tires + Taxi Headlight
  const noseStrut = new THREE.Mesh(strutGeo, chromeMat);
  noseStrut.position.set(0, -0.85, -3.65);
  gearGroup.add(noseStrut);

  const taxiLight = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xfffae0 })
  );
  taxiLight.position.set(0, -0.75, -3.75);
  gearGroup.add(taxiLight);

  for (const wx of [-0.14, 0.14]) {
    const nw = new THREE.Mesh(wheelGeo, darkMetalMat);
    nw.scale.setScalar(0.78);
    nw.position.set(wx, -1.32, -3.65);
    gearGroup.add(nw);
  }

  for (const side of [-1.48, 1.48]) {
    const mainStrut = new THREE.Mesh(strutGeo, chromeMat);
    mainStrut.position.set(side, -0.85, 1.2);
    gearGroup.add(mainStrut);
    const mainWheel = new THREE.Mesh(wheelGeo, darkMetalMat);
    mainWheel.position.set(side, -1.35, 1.2);
    gearGroup.add(mainWheel);
  }

  // Carrier Arrestor Tailhook Assembly
  const tailhookPivot = new THREE.Group();
  tailhookPivot.position.set(0, -0.35, 3.8);
  const hookBarGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.38, 8);
  hookBarGeo.rotateX(Math.PI / 2);
  hookBarGeo.translate(0, 0, 1.19);
  const hookBar = new THREE.Mesh(hookBarGeo, missileWhiteMat);
  tailhookPivot.add(hookBar);
  tailhookPivot.rotation.x = -0.58;
  gearGroup.add(tailhookPivot);

  gearGroup.visible = false;
  root.add(gearGroup);

  root.scale.setScalar(scaleMul);

  root.userData = {
    type,
    burnerMeshes,
    gearGroup,
    tailhookPivot,
    leftWingPivot,
    rightWingPivot,
    leftStabPivot,
    rightStabPivot,
    externalMissiles,
    vaporConeMesh,
    tailStrobeMesh
  };

  return root;
}

/**
 * Updates F-14 variable-sweep wings, stabilator control surfaces, afterburners,
 * supersonic Mach vapor cone, navigation strobe, and landing gear.
 */
export function updateJetVisuals(jetMesh, speedKts, throttle, gearDown, pitchInput = 0, rollInput = 0) {
  if (!jetMesh || !jetMesh.userData) return;
  const {
    burnerMeshes,
    gearGroup,
    leftWingPivot,
    rightWingPivot,
    leftStabPivot,
    rightStabPivot,
    vaporConeMesh,
    tailStrobeMesh
  } = jetMesh.userData;

  if (gearGroup) {
    gearGroup.visible = Boolean(gearDown);
  }

  // Flashing Anti-Collision Strobe Light
  if (tailStrobeMesh) {
    const strobeOn = Math.floor(performance.now() * 0.008) % 6 === 0;
    tailStrobeMesh.visible = strobeOn;
  }

  // F-14 Tomcat Swing-Wing sweep angle based on airspeed
  if (leftWingPivot && rightWingPivot) {
    const sweepFactor = gearDown
      ? 0
      : Math.max(0, Math.min(1, (speedKts - 240) / 340));
    const sweepRad = sweepFactor * 0.64;
    leftWingPivot.rotation.y = sweepRad;
    rightWingPivot.rotation.y = -sweepRad;
  }

  // Differential Stabilator deflection for Pitch + Roll
  if (leftStabPivot && rightStabPivot) {
    leftStabPivot.rotation.x = THREE.MathUtils.clamp(pitchInput * 0.36 - rollInput * 0.24, -0.45, 0.45);
    rightStabPivot.rotation.x = THREE.MathUtils.clamp(pitchInput * 0.36 + rollInput * 0.24, -0.45, 0.45);
  }

  // Supersonic Prandtl-Glauert Mach Vapor Cone (visible around 560 - 650 KTS)
  if (vaporConeMesh) {
    if (speedKts > 545 && !gearDown) {
      const machIntensity = Math.min(1, (speedKts - 545) / 80);
      const shimmer = 0.85 + Math.sin(performance.now() * 0.05) * 0.15;
      vaporConeMesh.material.opacity = machIntensity * 0.32 * shimmer;
      vaporConeMesh.scale.set(1 + machIntensity * 0.18, 1 + machIntensity * 0.18, 1);
      vaporConeMesh.visible = true;
    } else {
      vaporConeMesh.visible = false;
    }
  }

  // Afterburner plume scaling & Mach shock diamonds (hidden when parked / idle throttle)
  if (burnerMeshes) {
    const isParked = throttle <= 0.05;
    const isAfterburner = throttle > 0.85;
    const flutter = Math.sin(performance.now() * 0.08) * 0.14;
    const scaleZ = isAfterburner
      ? 1.18 + (throttle - 0.85) * 4.0 + flutter
      : Math.max(0.18, throttle * 0.55);

    for (const b of burnerMeshes) {
      b.group.visible = !isParked;
      if (!isParked) {
        b.group.scale.set(1, 1, scaleZ);
        b.outerMat.opacity = isAfterburner ? 0.9 : 0.38 * throttle;
        b.outerMat.color.setHex(isAfterburner ? 0xff8822 : 0xd94814);
        b.innerMat.opacity = isAfterburner ? 0.96 : 0.25 * throttle;
      }
    }
  }
}

/**
 * Builds a 3D first-person fighter cockpit glareshield, canopy bow, and dual MFD screens
 * for COCKPIT camera mode.
 */
export function createCockpitInteriorGroup() {
  const cockpit = new THREE.Group();

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x1b222c,
    roughness: 0.55,
    metalness: 0.45,
    emissive: 0x090d12
  });

  // Curved Glareshield Coaming below HUD
  const coaming = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.28, 0.85), frameMat);
  coaming.position.set(0, -0.52, -1.25);
  cockpit.add(coaming);

  // Dual Glowing Green Avionics MFD Screens (Left Radar / Right Stores)
  const mfdBezelGeo = new THREE.BoxGeometry(0.36, 0.32, 0.06);
  const mfdScreenGeo = new THREE.PlaneGeometry(0.3, 0.26);
  const mfdScreenMat = new THREE.MeshBasicMaterial({ color: 0x16442e });

  for (const side of [-0.42, 0.42]) {
    const bezel = new THREE.Mesh(mfdBezelGeo, frameMat);
    bezel.position.set(side, -0.62, -1.02);
    bezel.rotation.x = -0.22;
    cockpit.add(bezel);

    const scr = new THREE.Mesh(mfdScreenGeo, mfdScreenMat);
    scr.position.set(side, -0.62, -0.985);
    scr.rotation.x = -0.22;
    cockpit.add(scr);
  }

  // HUD Combiner Frame Uprights & Glass
  for (const side of [-0.24, 0.24]) {
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.42, 8), frameMat);
    strut.position.set(side, -0.22, -1.18);
    strut.rotation.x = -0.35;
    cockpit.add(strut);
  }

  // Forward Canopy Bow Arch & Side Rails
  const bowArch = new THREE.Mesh(
    new THREE.TorusGeometry(0.84, 0.032, 10, 24, Math.PI),
    frameMat
  );
  bowArch.position.set(0, -0.28, -1.15);
  bowArch.rotation.x = -0.32;
  cockpit.add(bowArch);

  for (const side of [-0.82, 0.82]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.065, 2.2), frameMat);
    rail.position.set(side, -0.32, -0.35);
    cockpit.add(rail);
  }

  return cockpit;
}

/**
 * Generates a high-resolution procedural Nimitz-class flight deck texture on an offscreen canvas.
 */
function createCarrierDeckTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d');

  // 1. Non-skid dark flight deck asphalt base
  ctx.fillStyle = '#242930';
  ctx.fillRect(0, 0, 1024, 2048);

  // Subtle asphalt grain & tire rubber marks in the landing zone
  for (let i = 0; i < 3200; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.05)';
    ctx.fillRect(Math.random() * 1024, Math.random() * 2048, 4, 8);
  }

  // Dark tire touchdown skid marks around the arrestor wire zone
  ctx.fillStyle = 'rgba(10, 12, 15, 0.42)';
  for (let i = 0; i < 95; i++) {
    const sx = 430 + (Math.random() - 0.5) * 160;
    const sy = 1280 + Math.random() * 480;
    ctx.fillRect(sx, sy, 6, 65 + Math.random() * 90);
  }

  // 2. Yellow Deck-Edge Perimeter Safety Stripes
  ctx.fillStyle = '#f5b82e';
  ctx.fillRect(18, 0, 14, 2048);
  ctx.fillRect(992, 0, 14, 2048);

  // 3. Landing Runway Foul Lines
  ctx.fillStyle = '#f5b82e';
  ctx.fillRect(256, 180, 12, 1820);
  ctx.fillRect(756, 180, 12, 1820);

  // White Solid & Dashed Runway Centerline
  ctx.fillStyle = '#eef3f8';
  for (let y = 220; y < 1940; y += 90) {
    ctx.fillRect(502, y, 20, 52);
  }

  // Stern Ramp Threshold Zebra Stripes & Meatball Aimpoint Bar
  for (let x = 285; x <= 715; x += 48) {
    ctx.fillRect(x, 1945, 28, 68);
  }

  // Steam Catapult Tracks on Bow + Jet Blast Deflector (JBD) markings
  ctx.strokeStyle = '#6c7a89';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(390, 60);
  ctx.lineTo(390, 740);
  ctx.moveTo(640, 60);
  ctx.lineTo(640, 740);
  ctx.stroke();

  // Giant "68" Hull Number on the Bow & Stern
  ctx.fillStyle = '#eef3f8';
  ctx.font = 'bold 145px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('68', 512, 175);
  ctx.font = 'bold 92px sans-serif';
  ctx.fillText('68', 512, 1915);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  return tex;
}

/**
 * Builds the Nimitz-Class Aircraft Carrier (CVN-68) with high-detail textured flight deck,
 * 4 arrestor wires, optical landing system ("Meatball"), parked jets, and rotating radar.
 */
export function createCarrierGroup() {
  const carrier = new THREE.Group();
  const DECK_Y = 20.0;

  // Authentic US Navy Haze Grey with subtle ambient fill so backlit faces never turn pitch-black
  const hullMat = new THREE.MeshStandardMaterial({
    color: 0x627284,
    emissive: 0x18222e,
    roughness: 0.52,
    metalness: 0.26
  });
  const islandTrimMat = new THREE.MeshStandardMaterial({
    color: 0x7b8c9e,
    emissive: 0x1d2938,
    roughness: 0.45,
    metalness: 0.3
  });
  const deckMat = new THREE.MeshStandardMaterial({
    map: createCarrierDeckTexture(),
    roughness: 0.82,
    metalness: 0.18
  });
  const wireMat = new THREE.MeshBasicMaterial({ color: 0xd8e2ec });

  // Lower Waterline Red Anti-Fouling Boot Stripe + Grey Hull
  const bootGeo = new THREE.BoxGeometry(45, 3.2, 314);
  const boot = new THREE.Mesh(
    bootGeo,
    new THREE.MeshStandardMaterial({ color: 0x6e2424, roughness: 0.7 })
  );
  boot.position.set(0, 1.2, 0);
  carrier.add(boot);

  const hullGeo = new THREE.BoxGeometry(44, 17.5, 310);
  const hull = new THREE.Mesh(hullGeo, hullMat);
  hull.position.set(0, 10.25, 0);
  hull.castShadow = true;
  carrier.add(hull);

  // Under-deck Hangar Sponsons
  const sponsonGeo = new THREE.BoxGeometry(68, 5.5, 260);
  const sponson = new THREE.Mesh(sponsonGeo, hullMat);
  sponson.position.set(0, 16.2, 10);
  carrier.add(sponson);

  // Main Flight Deck Surface (top face at Y = 20.0)
  const deckGeo = new THREE.BoxGeometry(74, 2.0, 340);
  const deckMaterials = [
    hullMat,
    hullMat,
    deckMat,
    hullMat,
    hullMat,
    hullMat
  ];
  const deck = new THREE.Mesh(deckGeo, deckMaterials);
  deck.position.set(0, DECK_Y - 1.0, 0);
  deck.receiveShadow = true;
  carrier.add(deck);

  // 4 Arrestor Wires across the landing zone
  const wirePositionsZ = [115, 95, 75, 55];
  const wireMeshes = [];
  wirePositionsZ.forEach((zPos, idx) => {
    const isTargetThreeWire = idx === 2;
    const wGeo = new THREE.CylinderGeometry(0.18, 0.18, 36, 8);
    wGeo.rotateZ(Math.PI / 2);
    const wMesh = new THREE.Mesh(
      wGeo,
      isTargetThreeWire ? new THREE.MeshBasicMaterial({ color: 0x24f07d }) : wireMat
    );
    wMesh.position.set(0, DECK_Y + 0.18, zPos);
    carrier.add(wMesh);
    wireMeshes.push({ number: idx + 1, z: zPos, mesh: wMesh });
  });

  // Optical Landing System ("Meatball" IFLOLS Light Array on Port Side at z = 65)
  const olsGroup = new THREE.Group();
  olsGroup.position.set(-22, DECK_Y + 2.5, 65);
  const olsFrame = new THREE.Mesh(
    new THREE.BoxGeometry(4.8, 5.2, 0.8),
    new THREE.MeshBasicMaterial({ color: 0x12161a })
  );
  olsGroup.add(olsFrame);

  for (const xDatum of [-1.7, -0.95, 0.95, 1.7]) {
    const datumLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x24f07d })
    );
    datumLight.position.set(xDatum, 0, 0.45);
    olsGroup.add(datumLight);
  }

  const meatballLight3D = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xffaa00 })
  );
  meatballLight3D.position.set(0, 0, 0.5);
  olsGroup.add(meatballLight3D);
  carrier.add(olsGroup);

  // Starboard Island Superstructure ("The Tower" — Buzz it at >350 KTS for a Top Gun Flyby!)
  const islandGroup = new THREE.Group();
  islandGroup.position.set(27, DECK_Y, -18);

  const islandBase = new THREE.Mesh(new THREE.BoxGeometry(12, 18, 46), hullMat);
  islandBase.position.set(0, 9, 0);
  islandBase.castShadow = true;
  islandGroup.add(islandBase);

  // Structural catwalks & levels on the Island Tower for 3D depth
  const catwalkLower = new THREE.Mesh(new THREE.BoxGeometry(13.4, 1.2, 48), islandTrimMat);
  catwalkLower.position.set(0, 17.8, 0);
  islandGroup.add(catwalkLower);

  const bridgeTower = new THREE.Mesh(new THREE.BoxGeometry(10.5, 9.5, 24), islandTrimMat);
  bridgeTower.position.set(0, 22.5, -6);
  islandGroup.add(bridgeTower);

  // Illuminated "68" Hull Number Signboard on Island Superstructure
  const numCanvas = document.createElement('canvas');
  numCanvas.width = 256;
  numCanvas.height = 128;
  const nCtx = numCanvas.getContext('2d');
  nCtx.fillStyle = '#384656';
  nCtx.fillRect(0, 0, 256, 128);
  nCtx.strokeStyle = '#f5b82e';
  nCtx.lineWidth = 6;
  nCtx.strokeRect(6, 6, 244, 116);
  nCtx.fillStyle = '#ffffff';
  nCtx.font = 'bold 88px sans-serif';
  nCtx.textAlign = 'center';
  nCtx.fillText('68', 128, 96);
  const numTex = new THREE.CanvasTexture(numCanvas);
  const numSignMat = new THREE.MeshBasicMaterial({ map: numTex });

  const portSign = new THREE.Mesh(new THREE.PlaneGeometry(11, 5.5), numSignMat);
  portSign.position.set(-6.12, 12.0, -4);
  portSign.rotation.y = -Math.PI / 2;
  islandGroup.add(portSign);

  const aftSign = new THREE.Mesh(new THREE.PlaneGeometry(9.5, 4.8), numSignMat);
  aftSign.position.set(0, 12.0, 23.12);
  islandGroup.add(aftSign);

  // Glowing Bridge & Pri-Fly Air Boss Windows (wrap around port, forward, and aft faces)
  const bridgeGlass = new THREE.Mesh(
    new THREE.BoxGeometry(11.1, 2.3, 18),
    new THREE.MeshBasicMaterial({ color: 0x70e4ff })
  );
  bridgeGlass.position.set(-0.2, 24.2, -6);
  islandGroup.add(bridgeGlass);

  const priFlyGlass = new THREE.Mesh(
    new THREE.BoxGeometry(11.2, 1.8, 12),
    new THREE.MeshBasicMaterial({ color: 0xffdf9a })
  );
  priFlyGlass.position.set(-0.3, 20.5, 2);
  islandGroup.add(priFlyGlass);

  // Communications Mast & Yardarms
  const mastPole = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.9, 18, 8), islandTrimMat);
  mastPole.position.set(0, 34, 2);
  islandGroup.add(mastPole);

  const yardarm = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 14, 6).rotateZ(Math.PI / 2), islandTrimMat);
  yardarm.position.set(0, 39, 2);
  islandGroup.add(yardarm);

  // Rotating Radar Dish on Mast
  const radarSpinner = new THREE.Group();
  radarSpinner.position.set(0, 31, -5);
  const radarDish = new THREE.Mesh(
    new THREE.BoxGeometry(10.2, 2.4, 1.2),
    new THREE.MeshStandardMaterial({ color: 0xe2ebf2, roughness: 0.25 })
  );
  radarSpinner.add(radarDish);
  islandGroup.add(radarSpinner);

  carrier.add(islandGroup);

  // Parked Squadron Aircraft on Starboard Bow & Apron
  const parkedCoords = [
    { x: 24, z: -95, yaw: 0.45, type: 'f18' },
    { x: 24, z: -62, yaw: 0.45, type: 'f14' },
    { x: 25, z: 28, yaw: 0.52, type: 'f35' }
  ];
  for (const pk of parkedCoords) {
    const parkedJet = createJetMesh(pk.type);
    parkedJet.position.set(pk.x, DECK_Y + 1.36, pk.z);
    parkedJet.rotation.y = pk.yaw;
    updateJetVisuals(parkedJet, 0, 0, true);
    carrier.add(parkedJet);
  }

  // Deck Edge Approach Lights
  const deckLightsGroup = new THREE.Group();
  const lightBulbGeo = new THREE.SphereGeometry(0.42, 6, 6);
  const greenLightMat = new THREE.MeshBasicMaterial({ color: 0x24f07d });
  const amberLightMat = new THREE.MeshBasicMaterial({ color: 0xf5a623 });

  for (let z = -150; z <= 162; z += 16) {
    const lLight = new THREE.Mesh(lightBulbGeo, greenLightMat);
    lLight.position.set(-18.5, DECK_Y + 0.45, z);
    deckLightsGroup.add(lLight);

    const rLight = new THREE.Mesh(lightBulbGeo, greenLightMat);
    rLight.position.set(18.5, DECK_Y + 0.45, z);
    deckLightsGroup.add(rLight);
  }

  for (let y = 4; y <= 19; y += 3) {
    const sternLight = new THREE.Mesh(lightBulbGeo, amberLightMat);
    sternLight.position.set(0, y, 170.4);
    deckLightsGroup.add(sternLight);
  }
  carrier.add(deckLightsGroup);

  // Churning Stern Wake
  const wakeGeo = new THREE.PlaneGeometry(54, 460);
  wakeGeo.rotateX(-Math.PI / 2);
  const wakeMat = new THREE.MeshBasicMaterial({
    color: 0xdff6ff,
    transparent: true,
    opacity: 0.28
  });
  const wake = new THREE.Mesh(wakeGeo, wakeMat);
  wake.position.set(0, 0.35, 400);
  carrier.add(wake);

  carrier.userData = {
    deckY: DECK_Y,
    wirePositionsZ,
    wireMeshes,
    radarSpinner,
    meatballLight3D,
    islandWorldOffset: new THREE.Vector3(27, DECK_Y + 24, -24)
  };

  return carrier;
}
