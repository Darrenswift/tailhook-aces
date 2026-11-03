import * as THREE from 'three';

export const JET_CONFIGS = {
  f18: {
    id: 'f18',
    name: 'F/A-18E SUPER HORNET',
    shortName: 'F/A-18E Super Hornet',
    roleBadge: 'Maverick Hero Jet',
    liveryName: 'TOPGUN MAVERICK SPECIAL',
    tagline: "Maverick's Special Strike Livery • 8x AIM-9X + 6x GBU-31 JDAM",
    desc: "Maverick's blue-and-black TOPGUN special livery, centerline drop tank, razor-sharp LERX turn rate & balanced strike payload.",
    maxSpeedKts: 670,
    cruiseSpeedKts: 345,
    minSpeedKts: 112,
    idealApproachKts: 138,
    pitchRate: 1.62,
    rollRate: 2.85,
    yawRate: 0.88,
    lockTimeSec: 1.05,
    missiles: 8,
    bombs: 6,
    flares: 12,
    bodyColor: 0x8997a7,
    accentColor: 0x161c24,
    stripeColor: 0x1da1f2,
    noseColor: 0x3b4552
  },
  f14: {
    id: 'f14',
    name: 'F-14D SUPER TOMCAT',
    shortName: 'F-14D Super Tomcat',
    roleBadge: 'Maverick & Goose VF-1',
    liveryName: 'VF-1 WOLFPACK / MAVERICK & GOOSE',
    tagline: 'Two-Seat Swing-Wing Legend • Mach 2.3 Afterburners + 10x AIM-54 + 6x Bombcat JDAM',
    desc: 'Iconic 2-seat tandem cockpit (Pilot + RIO), automatic variable-sweep wings, Mach 2.3+ afterburners & 10-missile payload.',
    maxSpeedKts: 790,
    cruiseSpeedKts: 375,
    minSpeedKts: 118,
    idealApproachKts: 142,
    pitchRate: 1.48,
    rollRate: 2.55,
    yawRate: 0.82,
    lockTimeSec: 1.0,
    missiles: 10,
    bombs: 6,
    flares: 14,
    bodyColor: 0x9aa6b2,
    accentColor: 0x181d24,
    stripeColor: 0xf5b82e,
    noseColor: 0x222830
  },
  f35: {
    id: 'f35',
    name: 'F-35C LIGHTNING II',
    shortName: 'F-35C Lightning II',
    roleBadge: '5th-Gen Carrier Stealth',
    liveryName: 'TOPGUN STEALTH AGGRESSOR',
    tagline: '5th-Gen Carrier Stealth Fighter • Gold RAM Canopy + Rapid Seeker & 6x Internal JDAM',
    desc: 'Chined stealth fuselage, gold radar-absorbent canopy, extreme high-alpha dogfight agility & rapid seeker lock-on.',
    maxSpeedKts: 695,
    cruiseSpeedKts: 355,
    minSpeedKts: 110,
    idealApproachKts: 136,
    pitchRate: 1.88,
    rollRate: 3.18,
    yawRate: 0.98,
    lockTimeSec: 0.78,
    missiles: 8,
    bombs: 6,
    flares: 14,
    bodyColor: 0x464e59,
    accentColor: 0x262b33,
    stripeColor: 0x38bdf8,
    noseColor: 0x2e343d
  },
  f22: {
    id: 'f22',
    name: 'LOCKHEED MARTIN F-22A RAPTOR',
    shortName: 'F-22A Raptor',
    roleBadge: 'Air Dominance King',
    liveryName: '1ST FIGHTER WING • METALLIC RAPTOR STEALTH',
    tagline: '2D Thrust-Vectoring Nozzles • Diamond Stealth Wing + 8x AIM-120D & 6x GBU-32',
    desc: 'Unmatched 5th-gen air dominance fighter with 2D thrust-vectoring nozzles, metallic titanium stealth finish & supercruise.',
    maxSpeedKts: 825,
    cruiseSpeedKts: 395,
    minSpeedKts: 108,
    idealApproachKts: 135,
    pitchRate: 2.08,
    rollRate: 3.38,
    yawRate: 1.1,
    lockTimeSec: 0.7,
    missiles: 8,
    bombs: 6,
    flares: 16,
    bodyColor: 0x64707d,
    accentColor: 0x343c46,
    stripeColor: 0x94a3b8,
    noseColor: 0x293038
  },
  su57: {
    id: 'su57',
    name: 'SUKHOI SU-57 FELON',
    shortName: 'Sukhoi Su-57 Felon',
    roleBadge: '5th-Gen Felon Ace',
    liveryName: 'TOPGUN MAVERICK • DIGITAL SPLINTER FELON',
    tagline: '3D Thrust-Vectoring Supermaneuverability • Digital Shark Camo + 8x R-77M & 6x KAB-500',
    desc: 'The lethal 5th-Gen enemy ace from Top Gun: Maverick! Digital splinter camouflage, extreme Cobra pitch authority & twin heavy bays.',
    maxSpeedKts: 815,
    cruiseSpeedKts: 390,
    minSpeedKts: 106,
    idealApproachKts: 136,
    pitchRate: 2.15,
    rollRate: 3.42,
    yawRate: 1.16,
    lockTimeSec: 0.74,
    missiles: 8,
    bombs: 6,
    flares: 16,
    bodyColor: 0x384352,
    accentColor: 0x1b222c,
    stripeColor: 0xd9222b,
    noseColor: 0x181d24
  },
  f15ex: {
    id: 'f15ex',
    name: 'BOEING F-15EX EAGLE II',
    shortName: 'Boeing F-15EX Eagle II',
    roleBadge: 'Mach 2.5 Bomb Truck',
    liveryName: '104TH FW • HEAVY STRIKE EAGLE II',
    tagline: 'Undefeated Mach 2.5 Heavy Striker • Massive 12x Missile & 8x 2,000-LB JDAM Payload',
    desc: 'Twin-tailed Mach 2.5 powerhouse carrying the heaviest arsenal in the fleet: 12 air-to-air missiles plus 8 heavy guided bombs!',
    maxSpeedKts: 860,
    cruiseSpeedKts: 405,
    minSpeedKts: 116,
    idealApproachKts: 144,
    pitchRate: 1.68,
    rollRate: 2.95,
    yawRate: 0.94,
    lockTimeSec: 0.84,
    missiles: 12,
    bombs: 8,
    flares: 18,
    bodyColor: 0x7b8998,
    accentColor: 0x384350,
    stripeColor: 0xf59e0b,
    noseColor: 0x2d3642
  },
  typhoon: {
    id: 'typhoon',
    name: 'EUROFIGHTER TYPHOON FGR4',
    shortName: 'Eurofighter Typhoon',
    roleBadge: 'Delta-Canard Agile',
    liveryName: 'RAF NO. 1 SQUADRON • NATO INTERCEPTOR',
    tagline: 'Active Forward Canard Foreplanes + Tail-Less Delta Wing • 8x Meteor + 6x Paveway IV',
    desc: 'European delta-canard dogfighter with animated forward canards, single tall vertical fin & the fastest roll rate in the sky.',
    maxSpeedKts: 780,
    cruiseSpeedKts: 375,
    minSpeedKts: 105,
    idealApproachKts: 134,
    pitchRate: 2.2,
    rollRate: 3.65,
    yawRate: 1.06,
    lockTimeSec: 0.76,
    missiles: 8,
    bombs: 6,
    flares: 14,
    bodyColor: 0x8694a4,
    accentColor: 0x242c36,
    stripeColor: 0xef4444,
    noseColor: 0x3b4552
  },
  su35: {
    id: 'su35',
    name: 'SUKHOI SU-35S FLANKER-E',
    shortName: 'Sukhoi Su-35 Flanker-E',
    roleBadge: '3D Vectoring Cobra',
    liveryName: 'RUSSIAN KNIGHTS • SKY-BLUE FLANKER CAMO',
    tagline: 'Tri-Tone Sky Camo • Central Tail Sting + 10x R-77 Adder & 6x Guided Bombs',
    desc: 'Iconic Flanker silhouette with three-tone azure camouflage, white radome, tail sting boom & extreme high-AoA maneuverability.',
    maxSpeedKts: 795,
    cruiseSpeedKts: 382,
    minSpeedKts: 108,
    idealApproachKts: 137,
    pitchRate: 2.1,
    rollRate: 3.28,
    yawRate: 1.12,
    lockTimeSec: 0.8,
    missiles: 10,
    bombs: 6,
    flares: 16,
    bodyColor: 0x4b779e,
    accentColor: 0x1e3852,
    stripeColor: 0x38bdf8,
    noseColor: 0xeef4fa
  },
  j20: {
    id: 'j20',
    name: 'CHENGDU J-20 MIGHTY DRAGON',
    shortName: 'Chengdu J-20 Dragon',
    roleBadge: 'Stealth Canard-Delta',
    liveryName: 'DARK GRAPHITE • MIGHTY DRAGON STEALTH',
    tagline: 'Long-Range Chined Stealth Canard-Delta • 10x PL-15 Long-Range Missiles + 6x Precision Bombs',
    desc: 'Sleek long-fuselage 5th-gen stealth fighter combining forward stealth canards, clipped delta wings & canted twin V-tails.',
    maxSpeedKts: 810,
    cruiseSpeedKts: 388,
    minSpeedKts: 110,
    idealApproachKts: 138,
    pitchRate: 1.98,
    rollRate: 3.32,
    yawRate: 1.05,
    lockTimeSec: 0.75,
    missiles: 10,
    bombs: 6,
    flares: 16,
    bodyColor: 0x323944,
    accentColor: 0x181c23,
    stripeColor: 0x64748b,
    noseColor: 0x1f242d
  }
};

// Cache procedural color, bump, and tail-flash textures
const materialCache = new Map();
const tailMaterialCache = new Map();

function getAircraftMaterialSet(type, bodyHex, accentHex, stripeHex, isEnemy) {
  const key = `${type}-${bodyHex}-${accentHex}-${stripeHex}-${isEnemy}`;
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

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 512, 512);

  if (type === 'su33' || type === 'su57') {
    // Digital splinter shark camo blocks for Su-57 Felon
    const camoColors = ['#2d3744', '#637487', '#1b222c', '#8293a6'];
    for (let i = 0; i < 42; i++) {
      ctx.fillStyle = camoColors[i % camoColors.length];
      ctx.fillRect((i * 83) % 460, (i * 59) % 460, 72, 42);
    }
  } else if (type === 'su35') {
    // Russian Flanker 3-Tone Sky-Blue / Azure Camouflage
    const flankerColors = ['#3c6894', '#6b9ec9', '#254463', '#8cb9de'];
    for (let i = 0; i < 34; i++) {
      ctx.fillStyle = flankerColors[i % flankerColors.length];
      ctx.beginPath();
      ctx.ellipse(
        (i * 97) % 480,
        (i * 67) % 480,
        58 + (i % 3) * 18,
        36 + (i % 2) * 16,
        (i % 4) * 0.4,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  } else if (type === 'f22' || type === 'j20') {
    // Raptor / Mighty Dragon geometric stealth RAM edge panels
    const ramColors =
      type === 'f22'
        ? ['#515c69', '#778594', '#424b57']
        : ['#262c35', '#3d4654', '#1d2229'];
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = ramColors[i % ramColors.length];
      ctx.fillRect((i * 79) % 460, (i * 53) % 460, 68, 48);
    }
  } else {
    // Subtle metallic panel shade variation & airflow weathering streaks
    for (let i = 0; i < 28; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.038)' : 'rgba(0,0,0,0.048)';
      ctx.fillRect((i * 73) % 480, (i * 41) % 480, 64 + (i % 3) * 36, 44 + (i % 4) * 32);
    }
  }

  // Engraved Aerospace Panel Seams
  ctx.strokeStyle = isEnemy ? 'rgba(0, 0, 0, 0.45)' : 'rgba(18, 26, 36, 0.34)';
  ctx.lineWidth = 2;
  bCtx.strokeStyle = '#303030';
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

  // Livery Racing Stripes
  if (type === 'f18') {
    ctx.fillStyle = `#${accentColor.getHexString()}`;
    ctx.fillRect(0, 196, 512, 52);
    ctx.fillStyle = `#${stripeColor.getHexString()}`;
    ctx.fillRect(0, 184, 512, 9);
    ctx.fillRect(0, 251, 512, 9);
  } else if (type === 'f14') {
    ctx.fillStyle = `#${accentColor.getHexString()}`;
    ctx.fillRect(0, 200, 512, 34);
    ctx.fillStyle = `#${stripeColor.getHexString()}`;
    ctx.fillRect(0, 236, 512, 10);
  } else {
    ctx.fillStyle = `#${stripeColor.getHexString()}`;
    ctx.fillRect(0, 212, 512, 18);
  }

  // Wing & Fuselage Roundel Insignia
  if (isEnemy || type === 'su57' || type === 'su35' || type === 'j20') {
    const starFill = type === 'j20' ? '#d9222b' : '#e61919';
    const starStroke = type === 'j20' ? '#f5b82e' : '#ffffff';
    drawStar(ctx, 256, 140, 5, 28, 12, starFill, starStroke);
  } else if (type === 'typhoon') {
    // RAF Bullseye Roundel (Blue outer, White mid, Red center)
    ctx.beginPath();
    ctx.arc(256, 140, 26, 0, Math.PI * 2);
    ctx.fillStyle = '#1d4ed8';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(256, 140, 17, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(256, 140, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#dc2626';
    ctx.fill();
  } else {
    // US National Star-and-Bars Roundel
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

  const isMetallicStealth = type === 'f22' || type === 'mig29';
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: colorTex,
    bumpMap: bumpTex,
    bumpScale: 0.032,
    roughness: isMetallicStealth ? 0.24 : 0.34,
    metalness: isMetallicStealth ? 0.74 : 0.62
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
  const key = `${type}-${isEnemy}`;
  if (tailMaterialCache.has(key)) return tailMaterialCache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (isEnemy || type === 'su57' || type === 'su35') {
    ctx.fillStyle = type === 'su35' ? '#254a6e' : '#1b222c';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#d91b24';
    ctx.fillRect(0, 24, 256, 14);
    drawStar(ctx, 128, 122, 5, 44, 18, '#e61919', '#ffffff');
    ctx.fillStyle = '#eef4fa';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(type === 'su35' ? 'FLANKER' : type === 'su57' ? 'FELON' : 'MIG-28', 128, 206);
  } else if (type === 'f18') {
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
  } else if (type === 'f22') {
    ctx.fillStyle = '#38414d';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(0, 28, 256, 14);
    drawStar(ctx, 128, 126, 5, 34, 14, '#cbd5e1', '#1e293b');
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FF 1FW', 128, 206);
  } else if (type === 'f15ex') {
    ctx.fillStyle = '#2d3744';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(0, 26, 256, 16);
    drawStar(ctx, 128, 126, 5, 36, 15, '#f59e0b', '#ffffff');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EAGLE II', 128, 206);
  } else if (type === 'typhoon') {
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, 0, 256, 256);
    // RAF Red-White-Blue Fin Flash
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(68, 70, 40, 80);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(108, 70, 40, 80);
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(148, 70, 40, 80);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 21px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TYPHOON', 128, 206);
  } else if (type === 'j20') {
    ctx.fillStyle = '#1e242d';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, 30, 256, 10);
    drawStar(ctx, 128, 126, 5, 34, 14, '#d9222b', '#f5b82e');
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('J-20', 128, 206);
  } else {
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
  tailMaterialCache.set(key, mat);
  return mat;
}

/**
 * Builds an authentic, high-detail 3D naval/air-superiority fighter or bomber mesh.
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
    if (type === 'f35' || type === 'f22' || type === 'j20') {
      canopyHex = 0xd4a238; // Gold-tinted radar-absorbent stealth canopy
    } else if (type === 'su57') {
      canopyHex = 0xff7733;
    }
  } else if (type === 'mig29') {
    bodyHex = 0x14181f;
    accentHex = 0xd91b24;
    stripeHex = 0xd91b24;
    noseHex = 0x0c0e12;
    canopyHex = 0xffa630;
    isEnemy = true;
  } else if (type === 'su33') {
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
  const bombOliveMat = new THREE.MeshStandardMaterial({
    color: 0x3f4d36,
    roughness: 0.6,
    metalness: 0.25
  });

  const isBomber = type === 'bomber';
  const isTomcat = type === 'f14';
  const isSingleEngine = type === 'f35';
  const hasCanards = type === 'typhoon' || type === 'j20';
  const isDeltaWing = type === 'typhoon' || type === 'j20';
  const isDiamondWing = type === 'f22' || type === 'su57' || type === 'su33';
  const scaleMul = isBomber ? 1.85 : 1.0;

  // ==========================================
  // 1. LOFTED AERODYNAMIC FUSELAGE & RADOME
  // ==========================================
  const lathePoints = [
    new THREE.Vector2(0.01, -9.0),
    new THREE.Vector2(0.32, -7.8),
    new THREE.Vector2(0.62, -6.1),
    new THREE.Vector2(0.78, -4.2),
    new THREE.Vector2(0.86, -1.8),
    new THREE.Vector2(0.84, 1.4),
    new THREE.Vector2(0.66, 4.4),
    new THREE.Vector2(0.35, 4.85)
  ];
  const fuselageGeo = new THREE.LatheGeometry(lathePoints, 20);
  fuselageGeo.rotateX(Math.PI / 2);
  const wideBody = isTomcat || type === 'su57' || type === 'su33' || type === 'f22' || type === 'f15ex';
  fuselageGeo.scale(wideBody ? 1.32 : 1.15, 0.76, type === 'j20' ? 1.08 : 1.0);
  const fuselage = new THREE.Mesh(fuselageGeo, bodyMat);
  fuselage.position.set(0, 0.05, 0);
  fuselage.castShadow = true;
  root.add(fuselage);

  const radomeCapGeo = new THREE.ConeGeometry(0.56, 3.3, 18);
  radomeCapGeo.rotateX(-Math.PI / 2);
  radomeCapGeo.scale(1.12, 0.78, 1.0);
  const radomeCap = new THREE.Mesh(radomeCapGeo, noseMat);
  radomeCap.position.set(0, 0.03, type === 'j20' ? -7.95 : -7.45);
  root.add(radomeCap);

  const pitot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.035, 1.25, 8).rotateX(-Math.PI / 2),
    chromeMat
  );
  pitot.position.set(0, 0.02, -9.5);
  root.add(pitot);

  // Twin or Single Engine Nacelles
  const nacelleOffsets = isSingleEngine
    ? [0]
    : isTomcat || type === 'su57' || type === 'su33' || type === 'su35'
    ? [-0.88, 0.88]
    : [-0.58, 0.58];
  for (const nx of nacelleOffsets) {
    const nacRadius = isSingleEngine ? 0.68 : 0.48;
    const nacGeo = new THREE.CylinderGeometry(nacRadius * 0.9, nacRadius, 7.6, 16);
    nacGeo.rotateX(Math.PI / 2);
    const nac = new THREE.Mesh(nacGeo, bodyMat);
    nac.position.set(nx, -0.14, 1.05);
    nac.castShadow = true;
    root.add(nac);
  }

  // Su-35 / Su-57 Central Tail Sting Boom between twin nozzles
  if (type === 'su35' || type === 'su57' || type === 'su33') {
    const stingGeo = new THREE.ConeGeometry(0.28, 2.6, 12).rotateX(Math.PI / 2);
    const sting = new THREE.Mesh(stingGeo, noseMat);
    sting.position.set(0, -0.05, 5.4);
    root.add(sting);
  }

  // Upper Deck / LERX
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

  // Air Intakes
  const intakeX = isTomcat || type === 'f15ex' ? 1.22 : 1.02;
  for (const side of [-1, 1]) {
    const intakeHousing = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.66, 4.6), accentMat);
    intakeHousing.position.set(side * intakeX, -0.22, -0.2);
    intakeHousing.rotation.z = side * (isTomcat ? -0.1 : 0.16);
    root.add(intakeHousing);

    const intakeMouth = new THREE.Mesh(
      new THREE.PlaneGeometry(0.68, 0.58),
      new THREE.MeshBasicMaterial({ color: 0x070a0f })
    );
    intakeMouth.position.set(side * intakeX, -0.22, -2.51);
    intakeMouth.rotation.y = Math.PI;
    root.add(intakeMouth);
  }

  // ==========================================
  // 2. COCKPIT TUB, PILOTS & BUBBLE CANOPY
  // ==========================================
  const isTwoSeat = isTomcat || type === 'f15ex';
  const crewPositionsZ = isTwoSeat ? [-2.75, -1.15] : [-2.35];
  crewPositionsZ.forEach((cz, idx) => {
    const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.66, 0.22), darkMetalMat);
    seatBack.position.set(0, 0.46, cz + 0.34);
    seatBack.rotation.x = -0.15;
    root.add(seatBack);

    const helmetMat = new THREE.MeshStandardMaterial({
      color: idx === 0 ? 0x1c2838 : 0xe8f0f8,
      roughness: 0.18,
      metalness: 0.45
    });
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.21, 12, 12), helmetMat);
    helmet.position.set(0, 0.59, cz);
    root.add(helmet);

    const visor = new THREE.Mesh(
      new THREE.SphereGeometry(0.216, 10, 10, 0, Math.PI, 0, Math.PI * 0.55),
      new THREE.MeshBasicMaterial({ color: 0x0b0f14 })
    );
    visor.rotation.x = -Math.PI * 0.65;
    visor.position.copy(helmet.position);
    root.add(visor);
  });

  const hudComb = new THREE.Mesh(
    new THREE.PlaneGeometry(0.36, 0.28),
    new THREE.MeshBasicMaterial({
      color: 0x24f07d,
      transparent: true,
      opacity: 0.48,
      side: THREE.DoubleSide
    })
  );
  hudComb.position.set(0, 0.57, isTwoSeat ? -3.55 : -3.18);
  hudComb.rotation.x = -0.45;
  root.add(hudComb);

  const canopyGeo = new THREE.SphereGeometry(0.58, 20, 14);
  canopyGeo.scale(0.96, 0.78, isTwoSeat ? 4.35 : 3.4);
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.set(0, 0.49, isTwoSeat ? -2.05 : -2.35);
  root.add(canopy);

  const archPositionsZ = isTwoSeat ? [-3.4, -1.95] : [-3.1];
  for (const az of archPositionsZ) {
    const archGeo = new THREE.TorusGeometry(0.54, 0.04, 8, 16, Math.PI);
    const arch = new THREE.Mesh(archGeo, darkMetalMat);
    arch.position.set(0, 0.43, az);
    arch.rotation.x = -0.25;
    root.add(arch);
  }

  // ==========================================
  // 2B. ANIMATED FORWARD CANARD FOREPLANES (TYPHOON & J-20)
  // ==========================================
  let leftCanardPivot = null;
  let rightCanardPivot = null;
  if (hasCanards) {
    leftCanardPivot = new THREE.Group();
    leftCanardPivot.position.set(-0.92, 0.15, -3.65);
    root.add(leftCanardPivot);

    rightCanardPivot = new THREE.Group();
    rightCanardPivot.position.set(0.92, 0.15, -3.65);
    root.add(rightCanardPivot);

    const canardShape = new THREE.Shape();
    canardShape.moveTo(0, -0.55);
    canardShape.lineTo(1.65, 0.25);
    canardShape.lineTo(1.65, 0.72);
    canardShape.lineTo(0, 0.85);
    canardShape.closePath();

    const canardGeoR = new THREE.ExtrudeGeometry(canardShape, { depth: 0.06, bevelEnabled: false });
    canardGeoR.rotateX(Math.PI / 2);
    const rCanard = new THREE.Mesh(canardGeoR, bodyMat);
    rightCanardPivot.add(rCanard);

    const lCanard = rCanard.clone();
    lCanard.scale.x = -1;
    leftCanardPivot.add(lCanard);
  }

  // ==========================================
  // 3. WINGS, NAVIGATION LIGHTS, MISSILES & GUIDED BOMBS
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
    mGrp.add(mBody, mNose, mFins);
    mGrp.position.set(x, y, z);
    return mGrp;
  }

  function buildGuidedBomb(x, y, z) {
    const bGrp = new THREE.Group();
    const bBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 1.9, 10).rotateX(Math.PI / 2),
      bombOliveMat
    );
    const bNose = new THREE.Mesh(
      new THREE.ConeGeometry(0.14, 0.45, 10).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xf5b82e }) // Yellow live-ordnance stripe
    );
    bNose.position.z = -1.15;
    const bFins = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.46, 0.35), darkMetalMat);
    bFins.position.z = 0.8;
    bGrp.add(bBody, bNose, bFins);
    bGrp.position.set(x, y, z);
    return bGrp;
  }

  if (isTomcat) {
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

    const stbdLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x22ff55 })
    );
    stbdLight.position.set(6.65, 0.06, 0.65);
    rightWingPivot.add(stbdLight);

    for (const mx of [-1.85, 1.85]) {
      const m = buildOrdnanceMissile(mx, -0.32, 0.1, 1.0);
      root.add(m);
      externalMissiles.push(m);
    }
    for (const mx of [-0.55, 0.55]) {
      const bmb = buildGuidedBomb(mx, -0.44, -0.2);
      root.add(bmb);
    }
  } else {
    const wingSpan = type === 'f15ex' || type === 'su35' ? 13.2 : isDiamondWing ? 12.8 : 12.2;
    const halfSpan = wingSpan * 0.5;
    const wingShape = new THREE.Shape();

    if (isDeltaWing) {
      // Pure Delta Wing (Eurofighter Typhoon & Chengdu J-20)
      wingShape.moveTo(-1.05, -2.25);
      wingShape.lineTo(-halfSpan, 2.35);
      wingShape.lineTo(-halfSpan, 3.35);
      wingShape.lineTo(-1.05, 3.6);
      wingShape.lineTo(1.05, 3.6);
      wingShape.lineTo(halfSpan, 3.35);
      wingShape.lineTo(halfSpan, 2.35);
      wingShape.lineTo(1.05, -2.25);
      wingShape.closePath();
    } else if (isDiamondWing) {
      // Diamond Clipped Delta Wing (F-22A Raptor & Su-57 Felon)
      wingShape.moveTo(-1.15, -2.1);
      wingShape.lineTo(-halfSpan, 0.85);
      wingShape.lineTo(-halfSpan * 0.94, 2.25);
      wingShape.lineTo(-1.15, 3.15);
      wingShape.lineTo(1.15, 3.15);
      wingShape.lineTo(halfSpan * 0.94, 2.25);
      wingShape.lineTo(halfSpan, 0.85);
      wingShape.lineTo(1.15, -2.1);
      wingShape.closePath();
    } else {
      wingShape.moveTo(-1.1, -1.85);
      wingShape.lineTo(-halfSpan, 1.25);
      wingShape.lineTo(-halfSpan, 2.55);
      wingShape.lineTo(-1.1, 2.9);
      wingShape.lineTo(1.1, 2.9);
      wingShape.lineTo(halfSpan, 2.55);
      wingShape.lineTo(halfSpan, 1.25);
      wingShape.lineTo(1.1, -1.85);
      wingShape.closePath();
    }

    const wingGeo = new THREE.ExtrudeGeometry(wingShape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelThickness: 0.035,
      bevelSize: 0.05,
      bevelSegments: 2
    });
    wingGeo.rotateX(Math.PI / 2);
    const wings = new THREE.Mesh(wingGeo, bodyMat);
    wings.position.set(0, type === 'f15ex' ? 0.24 : 0.12, 0.2);
    wings.castShadow = true;
    root.add(wings);

    if (type === 'f18') {
      const tankGeo = new THREE.CylinderGeometry(0.24, 0.24, 3.6, 12).rotateX(Math.PI / 2);
      const tank = new THREE.Mesh(tankGeo, bodyMat);
      tank.position.set(0, -0.48, 0.2);
      root.add(tank);
    }

    const railGeo = new THREE.BoxGeometry(0.14, 0.2, 2.75);
    for (const side of [-1, 1]) {
      const rail = new THREE.Mesh(railGeo, accentMat);
      rail.position.set(side * halfSpan, 0.05, isDeltaWing ? 2.5 : 1.9);
      root.add(rail);

      const navLight = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 8, 8),
        new THREE.MeshBasicMaterial({ color: side < 0 ? 0xff2222 : 0x22ff55 })
      );
      navLight.position.set(side * (halfSpan + 0.18), 0.08, isDeltaWing ? 2.1 : 1.5);
      root.add(navLight);

      const tipMissile = buildOrdnanceMissile(side * (halfSpan + 0.14), 0.05, isDeltaWing ? 2.4 : 1.8);
      root.add(tipMissile);
      externalMissiles.push(tipMissile);

      // Inboard Guided Bomb Pylon + Outboard AIM-120/AIM-9 Pylon
      const bombPylon = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.36, 1.65), accentMat);
      bombPylon.position.set(side * 2.4, -0.14, 1.1);
      root.add(bombPylon);
      root.add(buildGuidedBomb(side * 2.4, -0.36, 1.1));

      const mslPylon = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.36, 1.65), accentMat);
      mslPylon.position.set(side * 3.95, -0.14, 1.35);
      root.add(mslPylon);
      const pylonMissile = buildOrdnanceMissile(side * 3.95, -0.34, 1.35);
      root.add(pylonMissile);
      externalMissiles.push(pylonMissile);
    }
  }

  // ==========================================
  // 4. ANIMATED STABILATORS & PAINTED SQUADRON VERTICAL TAILS
  // ==========================================
  let leftStabPivot = null;
  let rightStabPivot = null;

  // Tail-less delta Eurofighter Typhoon uses trailing-edge elevons + forward canards (no rear stabilators)
  if (type !== 'typhoon') {
    const stabX = isTomcat || type === 'su35' || type === 'su57' ? 1.35 : 1.1;
    leftStabPivot = new THREE.Group();
    leftStabPivot.position.set(-stabX, 0.0, 4.15);
    root.add(leftStabPivot);

    rightStabPivot = new THREE.Group();
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
  }

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
  if (isBomber || type === 'mig29' || type === 'typhoon') {
    const singleTail = new THREE.Mesh(tailGeo, tailMat);
    singleTail.scale.set(1.15, type === 'typhoon' ? 1.38 : 1.3, 1.15);
    singleTail.position.set(0, 0.22, 2.4);
    root.add(singleTail);

    tailStrobeMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    tailStrobeMesh.position.set(0, 3.25, 4.2);
    root.add(tailStrobeMesh);
  } else {
    const isUprightTwin = isTomcat || type === 'f15ex' || type === 'su35';
    const cantAngle = isUprightTwin ? 0.04 : 0.34;
    const tailOffsetX = isUprightTwin ? 1.18 : 1.02;
    const tailScaleY = type === 'f15ex' || type === 'su35' ? 1.18 : 1.0;

    const leftTail = new THREE.Mesh(tailGeo, tailMat);
    leftTail.scale.set(1, tailScaleY, 1);
    leftTail.position.set(-tailOffsetX, 0.18, 2.3);
    leftTail.rotation.z = cantAngle;
    root.add(leftTail);

    const rightTail = new THREE.Mesh(tailGeo, tailMat);
    rightTail.scale.set(1, tailScaleY, 1);
    rightTail.position.set(tailOffsetX, 0.18, 2.3);
    rightTail.rotation.z = -cantAngle;
    root.add(rightTail);

    tailStrobeMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    tailStrobeMesh.position.set(-tailOffsetX - 0.15, 2.48 * tailScaleY, 4.1);
    root.add(tailStrobeMesh);
  }

  // ==========================================
  // 5. VARIABLE NOZZLES, AFTERBURNERS & SUPERSONIC VAPOR CONE
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

    if (type === 'f22') {
      // F-22A Raptor Rectangular 2D Thrust-Vectoring Stealth Nozzle Paddles
      const vecBox = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.56, 1.25), darkMetalMat);
      nozzleGroup.add(vecBox);
    } else {
      const nozzleRing = new THREE.Mesh(
        new THREE.CylinderGeometry(nozzleRadius * 0.82, nozzleRadius, 1.25, 16, 1, true).rotateX(Math.PI / 2),
        darkMetalMat
      );
      nozzleGroup.add(nozzleRing);

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
    leftCanardPivot,
    rightCanardPivot,
    externalMissiles,
    vaporConeMesh,
    tailStrobeMesh
  };

  return root;
}

/**
 * Updates F-14 variable-sweep wings, canards, stabilator control surfaces, afterburners,
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
    leftCanardPivot,
    rightCanardPivot,
    vaporConeMesh,
    tailStrobeMesh
  } = jetMesh.userData;

  if (gearGroup) {
    gearGroup.visible = Boolean(gearDown);
  }

  if (tailStrobeMesh) {
    const strobeOn = Math.floor(performance.now() * 0.008) % 6 === 0;
    tailStrobeMesh.visible = strobeOn;
  }

  if (leftWingPivot && rightWingPivot) {
    const sweepFactor = gearDown
      ? 0
      : Math.max(0, Math.min(1, (speedKts - 240) / 340));
    const sweepRad = sweepFactor * 0.64;
    leftWingPivot.rotation.y = sweepRad;
    rightWingPivot.rotation.y = -sweepRad;
  }

  if (leftStabPivot && rightStabPivot) {
    leftStabPivot.rotation.x = THREE.MathUtils.clamp(pitchInput * 0.36 - rollInput * 0.24, -0.45, 0.45);
    rightStabPivot.rotation.x = THREE.MathUtils.clamp(pitchInput * 0.36 + rollInput * 0.24, -0.45, 0.45);
  }

  if (leftCanardPivot && rightCanardPivot) {
    leftCanardPivot.rotation.x = THREE.MathUtils.clamp(-pitchInput * 0.38 + rollInput * 0.2, -0.45, 0.45);
    rightCanardPivot.rotation.x = THREE.MathUtils.clamp(-pitchInput * 0.38 - rollInput * 0.2, -0.45, 0.45);
  }

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
 * Builds 3D Air-to-Ground Strike Targets (Bunkers, Radar Domes, SAM Sites, Fuel Depots, Enemy Destroyers, and Sky Rings).
 */
export function createStrikeTargetMesh(targetType = 'bunker') {
  const grp = new THREE.Group();

  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0x5c646d,
    emissive: 0x14181d,
    roughness: 0.75
  });
  const darkSteelMat = new THREE.MeshStandardMaterial({
    color: 0x2c3540,
    emissive: 0x0c1015,
    roughness: 0.45,
    metalness: 0.55
  });
  const hazardRedMat = new THREE.MeshStandardMaterial({
    color: 0xd92626,
    emissive: 0x3a0808,
    roughness: 0.4
  });

  if (targetType === 'bunker') {
    // Hardened Mountain Uranium Bunker with Glowing Target Ventilation Hatch
    const base = new THREE.Mesh(new THREE.CylinderGeometry(22, 28, 12, 12), concreteMat);
    base.position.y = 6;
    grp.add(base);

    const blastRim = new THREE.Mesh(
      new THREE.TorusGeometry(11.5, 2.2, 10, 24).rotateX(Math.PI / 2),
      darkSteelMat
    );
    blastRim.position.y = 12.2;
    grp.add(blastRim);

    const ventGlow = new THREE.Mesh(
      new THREE.CircleGeometry(9.5, 24).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xff4422 })
    );
    ventGlow.position.y = 12.35;
    grp.add(ventGlow);

    const targetRing = new THREE.Mesh(
      new THREE.RingGeometry(13.5, 16.0, 24).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xf5b82e, side: THREE.DoubleSide })
    );
    targetRing.position.y = 12.5;
    grp.add(targetRing);
  } else if (targetType === 'radar') {
    // Early-Warning Geodesic Radar Dome & Tower
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(7, 9.5, 18, 10), concreteMat);
    pedestal.position.y = 9;
    grp.add(pedestal);

    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(11.5, 16, 12),
      new THREE.MeshStandardMaterial({ color: 0xeef4fa, emissive: 0x1e293b, roughness: 0.3 })
    );
    dome.position.y = 24;
    grp.add(dome);

    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(1.4, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff2222 })
    );
    beacon.position.y = 36.5;
    grp.add(beacon);
  } else if (targetType === 'sam') {
    // S-400 Surface-to-Air Missile Battery & TEL Launcher
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(16, 18, 3, 12), concreteMat);
    pad.position.y = 1.5;
    grp.add(pad);

    const truck = new THREE.Mesh(new THREE.BoxGeometry(8, 5, 18), darkSteelMat);
    truck.position.y = 5.5;
    grp.add(truck);

    for (const xOff of [-2.4, -0.8, 0.8, 2.4]) {
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 14, 10), hazardRedMat);
      tube.position.set(xOff, 12, 1);
      tube.rotation.x = -0.55;
      grp.add(tube);
    }
  } else if (targetType === 'depot') {
    // Fuel & Munitions Storage Complex
    for (const xOff of [-14, 0, 14]) {
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(5.8, 5.8, 14, 14), concreteMat);
      tank.position.set(xOff, 7, 0);
      grp.add(tank);

      const stripe = new THREE.Mesh(new THREE.CylinderGeometry(5.9, 5.9, 2.8, 14), hazardRedMat);
      stripe.position.set(xOff, 10, 0);
      grp.add(stripe);
    }
  } else if (targetType === 'destroyer') {
    // Enemy Guided-Missile Warship / Battlecruiser (145m long)
    const hull = new THREE.Mesh(new THREE.BoxGeometry(20, 11, 145), darkSteelMat);
    hull.position.y = 5.5;
    grp.add(hull);

    const redDeck = new THREE.Mesh(new THREE.BoxGeometry(19.2, 1.0, 140), hazardRedMat);
    redDeck.position.y = 11.2;
    grp.add(redDeck);

    const bridge = new THREE.Mesh(new THREE.BoxGeometry(14, 16, 38), concreteMat);
    bridge.position.set(0, 19, -8);
    grp.add(bridge);

    const mast = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 2.5, 18, 8), darkSteelMat);
    mast.position.set(0, 34, -10);
    grp.add(mast);

    const wake = new THREE.Mesh(
      new THREE.PlaneGeometry(26, 210).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xdff6ff, transparent: true, opacity: 0.3 })
    );
    wake.position.set(0, 0.4, 140);
    grp.add(wake);
  } else if (targetType === 'skyring') {
    // Glowing Holographic Canyon Time-Trial Gate Ring
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(28, 1.6, 12, 32),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    const innerRing = new THREE.Mesh(
      new THREE.TorusGeometry(25, 0.7, 8, 32),
      new THREE.MeshBasicMaterial({ color: 0xf5b82e })
    );
    grp.add(ring, innerRing);
  }

  return grp;
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

  const coaming = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.28, 0.85), frameMat);
  coaming.position.set(0, -0.52, -1.25);
  cockpit.add(coaming);

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

  for (const side of [-0.24, 0.24]) {
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.42, 8), frameMat);
    strut.position.set(side, -0.22, -1.18);
    strut.rotation.x = -0.35;
    cockpit.add(strut);
  }

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

  ctx.fillStyle = '#242930';
  ctx.fillRect(0, 0, 1024, 2048);

  for (let i = 0; i < 3200; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.05)';
    ctx.fillRect(Math.random() * 1024, Math.random() * 2048, 4, 8);
  }

  ctx.fillStyle = 'rgba(10, 12, 15, 0.42)';
  for (let i = 0; i < 95; i++) {
    const sx = 430 + (Math.random() - 0.5) * 160;
    const sy = 1280 + Math.random() * 480;
    ctx.fillRect(sx, sy, 6, 65 + Math.random() * 90);
  }

  ctx.fillStyle = '#f5b82e';
  ctx.fillRect(18, 0, 14, 2048);
  ctx.fillRect(992, 0, 14, 2048);

  ctx.fillStyle = '#f5b82e';
  ctx.fillRect(256, 180, 12, 1820);
  ctx.fillRect(756, 180, 12, 1820);

  ctx.fillStyle = '#eef3f8';
  for (let y = 220; y < 1940; y += 90) {
    ctx.fillRect(502, y, 20, 52);
  }

  for (let x = 285; x <= 715; x += 48) {
    ctx.fillRect(x, 1945, 28, 68);
  }

  ctx.strokeStyle = '#6c7a89';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(390, 60);
  ctx.lineTo(390, 740);
  ctx.moveTo(640, 60);
  ctx.lineTo(640, 740);
  ctx.stroke();

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

  const sponsonGeo = new THREE.BoxGeometry(68, 5.5, 260);
  const sponson = new THREE.Mesh(sponsonGeo, hullMat);
  sponson.position.set(0, 16.2, 10);
  carrier.add(sponson);

  const deckGeo = new THREE.BoxGeometry(74, 2.0, 340);
  const deckMaterials = [hullMat, hullMat, deckMat, hullMat, hullMat, hullMat];
  const deck = new THREE.Mesh(deckGeo, deckMaterials);
  deck.position.set(0, DECK_Y - 1.0, 0);
  deck.receiveShadow = true;
  carrier.add(deck);

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

  const islandGroup = new THREE.Group();
  islandGroup.position.set(27, DECK_Y, -18);

  const islandBase = new THREE.Mesh(new THREE.BoxGeometry(12, 18, 46), hullMat);
  islandBase.position.set(0, 9, 0);
  islandBase.castShadow = true;
  islandGroup.add(islandBase);

  const catwalkLower = new THREE.Mesh(new THREE.BoxGeometry(13.4, 1.2, 48), islandTrimMat);
  catwalkLower.position.set(0, 17.8, 0);
  islandGroup.add(catwalkLower);

  const bridgeTower = new THREE.Mesh(new THREE.BoxGeometry(10.5, 9.5, 24), islandTrimMat);
  bridgeTower.position.set(0, 22.5, -6);
  islandGroup.add(bridgeTower);

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

  const mastPole = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.9, 18, 8), islandTrimMat);
  mastPole.position.set(0, 34, 2);
  islandGroup.add(mastPole);

  const yardarm = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 14, 6).rotateZ(Math.PI / 2), islandTrimMat);
  yardarm.position.set(0, 39, 2);
  islandGroup.add(yardarm);

  const radarSpinner = new THREE.Group();
  radarSpinner.position.set(0, 31, -5);
  const radarDish = new THREE.Mesh(
    new THREE.BoxGeometry(10.2, 2.4, 1.2),
    new THREE.MeshStandardMaterial({ color: 0xe2ebf2, roughness: 0.25 })
  );
  radarSpinner.add(radarDish);
  islandGroup.add(radarSpinner);

  carrier.add(islandGroup);

  const parkedCoords = [
    { x: 24, z: -95, yaw: 0.45, type: 'f18' },
    { x: 24, z: -62, yaw: 0.45, type: 'f14' },
    { x: 25, z: 28, yaw: 0.52, type: 'f22' }
  ];
  for (const pk of parkedCoords) {
    const parkedJet = createJetMesh(pk.type);
    parkedJet.position.set(pk.x, DECK_Y + 1.36, pk.z);
    parkedJet.rotation.y = pk.yaw;
    updateJetVisuals(parkedJet, 0, 0, true);
    carrier.add(parkedJet);
  }

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
    olsGroup,
    islandWorldOffset: new THREE.Vector3(27, DECK_Y + 24, -24)
  };

  return carrier;
}
