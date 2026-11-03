import * as THREE from 'three';

export const JET_CONFIGS = {
  f18: {
    id: 'f18',
    name: 'F/A-18E SUPER HORNET',
    tagline: 'Twin-Engine Carrier Strike Fighter • M61 Vulcan 20mm + 8x AIM-9X',
    maxSpeedKts: 660,
    cruiseSpeedKts: 340,
    minSpeedKts: 112,
    idealApproachKts: 138,
    pitchRate: 1.55,
    rollRate: 2.75,
    yawRate: 0.85,
    lockTimeSec: 1.2,
    missiles: 8,
    flares: 12,
    bodyColor: 0x8291a0,
    accentColor: 0x2b3642,
    noseColor: 0x45505c
  },
  f14: {
    id: 'f14',
    name: 'F-14D SUPER TOMCAT',
    tagline: 'Variable-Sweep Fleet Defender • Mach 2+ Afterburners + 10x Missiles',
    maxSpeedKts: 780,
    cruiseSpeedKts: 370,
    minSpeedKts: 118,
    idealApproachKts: 142,
    pitchRate: 1.42,
    rollRate: 2.45,
    yawRate: 0.78,
    lockTimeSec: 1.15,
    missiles: 10,
    flares: 14,
    bodyColor: 0x909ca8,
    accentColor: 0x1c2229,
    noseColor: 0x252b33
  },
  f35: {
    id: 'f35',
    name: 'F-35C LIGHTNING II',
    tagline: '5th-Gen Stealth Carrier Fighter • High-Alpha Agility + Rapid Lock Seeker',
    maxSpeedKts: 680,
    cruiseSpeedKts: 350,
    minSpeedKts: 110,
    idealApproachKts: 136,
    pitchRate: 1.82,
    rollRate: 3.1,
    yawRate: 0.95,
    lockTimeSec: 0.82,
    missiles: 6,
    flares: 14,
    bodyColor: 0x4b535e,
    accentColor: 0x2d333b,
    noseColor: 0x343a43
  }
};

// Cache procedural panel textures by color key
const hullTextureCache = new Map();

function getAircraftPanelTexture(baseHex, stripeHex, isEnemy = false) {
  const key = `${baseHex}-${stripeHex}-${isEnemy}`;
  if (hullTextureCache.has(key)) return hullTextureCache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const baseColor = new THREE.Color(baseHex);
  const stripeColor = new THREE.Color(stripeHex);

  ctx.fillStyle = `#${baseColor.getHexString()}`;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle metallic panel variation
  for (let i = 0; i < 24; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)';
    ctx.fillRect(
      (i * 73) % 480,
      (i * 41) % 480,
      60 + (i % 3) * 40,
      40 + (i % 4) * 35
    );
  }

  // Crisp aerospace panel seam lines
  ctx.strokeStyle = 'rgba(15, 23, 34, 0.32)';
  ctx.lineWidth = 2;
  for (let y = 64; y < 512; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }
  for (let x = 64; x < 512; x += 96) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }

  // Squadron accent stripe
  ctx.fillStyle = `#${stripeColor.getHexString()}`;
  ctx.fillRect(0, 210, 512, 28);

  // Insignia marking
  if (isEnemy) {
    // Red tactical star / diamond
    ctx.fillStyle = '#d92626';
    ctx.beginPath();
    ctx.moveTo(256, 110);
    ctx.lineTo(286, 150);
    ctx.lineTo(256, 190);
    ctx.lineTo(226, 150);
    ctx.closePath();
    ctx.fill();
  } else {
    // Low-vis Navy roundel bar
    ctx.fillStyle = 'rgba(30, 42, 56, 0.55)';
    ctx.fillRect(216, 138, 80, 18);
    ctx.beginPath();
    ctx.arc(256, 147, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  hullTextureCache.set(key, tex);
  return tex;
}

/**
 * Builds a sleek, high-detail procedural 3D jet fighter or bomber mesh.
 * Forward direction in local space is -Z.
 */
export function createJetMesh(type = 'f18') {
  const root = new THREE.Group();

  let bodyHex = 0x8291a0;
  let accentHex = 0x2b3642;
  let noseHex = 0x45505c;
  let canopyHex = 0x58c4f6;
  let burnerHex = 0xff8822;
  let isEnemy = false;

  if (JET_CONFIGS[type]) {
    bodyHex = JET_CONFIGS[type].bodyColor;
    accentHex = JET_CONFIGS[type].accentColor;
    noseHex = JET_CONFIGS[type].noseColor;
  } else if (type === 'mig29') {
    bodyHex = 0x54685c;
    accentHex = 0x992626;
    noseHex = 0x2a332d;
    canopyHex = 0xe6a145;
    isEnemy = true;
  } else if (type === 'su33') {
    bodyHex = 0x282d38;
    accentHex = 0xd9222b;
    noseHex = 0x15181f;
    canopyHex = 0xff5533;
    isEnemy = true;
  } else if (type === 'bomber') {
    bodyHex = 0x6c7a89;
    accentHex = 0x992828;
    noseHex = 0x323a42;
    isEnemy = true;
  }

  const panelTex = getAircraftPanelTexture(bodyHex, accentHex, isEnemy);

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: panelTex,
    roughness: 0.34,
    metalness: 0.62
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: accentHex,
    roughness: 0.42,
    metalness: 0.52
  });
  const noseMat = new THREE.MeshStandardMaterial({
    color: noseHex,
    roughness: 0.28,
    metalness: 0.48
  });
  const canopyMat = new THREE.MeshPhysicalMaterial({
    color: canopyHex,
    roughness: 0.08,
    metalness: 0.15,
    transmission: 0.45,
    transparent: true,
    opacity: 0.82,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05
  });
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x1c2128,
    roughness: 0.45,
    metalness: 0.8
  });
  const missileWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xf0f4f8,
    roughness: 0.25,
    metalness: 0.3
  });

  const isBomber = type === 'bomber';
  const scaleMul = isBomber ? 1.85 : 1.0;

  // 1. Sculpted Aerodynamic Fuselage Spine & Chined Radome
  const spineGeo = new THREE.CylinderGeometry(0.68, 0.92, 8.8, 14);
  spineGeo.rotateX(Math.PI / 2);
  spineGeo.scale(1.15, 0.72, 1.0);
  const spine = new THREE.Mesh(spineGeo, bodyMat);
  spine.position.set(0, 0.08, 0.2);
  spine.castShadow = true;
  root.add(spine);

  // Twin Engine Nacelles
  const nacelleOffsets = type === 'f35' ? [0] : [-0.62, 0.62];
  for (const nx of nacelleOffsets) {
    const nacRadius = type === 'f35' ? 0.66 : 0.48;
    const nacGeo = new THREE.CylinderGeometry(nacRadius * 0.92, nacRadius, 7.2, 12);
    nacGeo.rotateX(Math.PI / 2);
    const nac = new THREE.Mesh(nacGeo, bodyMat);
    nac.position.set(nx, -0.14, 1.15);
    nac.castShadow = true;
    root.add(nac);
  }

  // Nose Cone Radome (-Z is forward) + Pitot Tube
  const noseGeo = new THREE.ConeGeometry(0.76, 4.8, 16);
  noseGeo.rotateX(-Math.PI / 2);
  noseGeo.scale(1.05, 0.78, 1.0);
  const nose = new THREE.Mesh(noseGeo, noseMat);
  nose.position.set(0, -0.02, -6.5);
  root.add(nose);

  const pitotGeo = new THREE.CylinderGeometry(0.02, 0.035, 1.1, 6);
  pitotGeo.rotateX(-Math.PI / 2);
  const pitot = new THREE.Mesh(pitotGeo, darkMetalMat);
  pitot.position.set(0, -0.03, -9.2);
  root.add(pitot);

  // Blended Leading Edge Extensions (LEX / Strakes)
  const lexShape = new THREE.Shape();
  lexShape.moveTo(-0.7, -4.6);
  lexShape.lineTo(-2.15, -0.4);
  lexShape.lineTo(-2.15, 2.2);
  lexShape.lineTo(2.15, 2.2);
  lexShape.lineTo(2.15, -0.4);
  lexShape.lineTo(0.7, -4.6);
  lexShape.closePath();

  const lexGeo = new THREE.ExtrudeGeometry(lexShape, {
    depth: 0.14,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.06,
    bevelSegments: 2
  });
  lexGeo.rotateX(Math.PI / 2);
  const lex = new THREE.Mesh(lexGeo, bodyMat);
  lex.position.set(0, 0.14, -0.4);
  root.add(lex);

  // Angled Supersonic Air Intakes with Dark Compressor Face
  for (const side of [-1, 1]) {
    const intakeHousing = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.68, 4.4),
      accentMat
    );
    intakeHousing.position.set(side * 1.05, -0.22, -0.2);
    intakeHousing.rotation.z = side * 0.12;
    root.add(intakeHousing);

    const intakeMouth = new THREE.Mesh(
      new THREE.PlaneGeometry(0.66, 0.58),
      new THREE.MeshBasicMaterial({ color: 0x080b10 })
    );
    intakeMouth.position.set(side * 1.05, -0.22, -2.41);
    intakeMouth.rotation.y = Math.PI;
    root.add(intakeMouth);
  }

  // 2. Cockpit Tub, Pilot Silhouette, HUD Glass & Bubble Canopy
  const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.65, 0.25), darkMetalMat);
  seatBack.position.set(0, 0.45, -1.85);
  root.add(seatBack);

  const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0xe8f0f8, roughness: 0.2, metalness: 0.4 })
  );
  helmet.position.set(0, 0.58, -2.25);
  root.add(helmet);

  const visor = new THREE.Mesh(
    new THREE.SphereGeometry(0.225, 10, 10, 0, Math.PI, 0, Math.PI * 0.55),
    new THREE.MeshBasicMaterial({ color: 0x11161d })
  );
  visor.rotation.x = -Math.PI * 0.65;
  visor.position.copy(helmet.position);
  root.add(visor);

  // Glowing green cockpit HUD combiner glass
  const hudComb = new THREE.Mesh(
    new THREE.PlaneGeometry(0.36, 0.28),
    new THREE.MeshBasicMaterial({
      color: 0x24f07d,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    })
  );
  hudComb.position.set(0, 0.56, -3.15);
  hudComb.rotation.x = -0.45;
  root.add(hudComb);

  const canopyGeo = new THREE.SphereGeometry(0.58, 18, 14);
  canopyGeo.scale(0.96, 0.78, 3.35);
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.set(0, 0.48, -2.35);
  root.add(canopy);

  // Canopy Frame Arch
  const archGeo = new THREE.TorusGeometry(0.54, 0.045, 8, 16, Math.PI);
  const arch = new THREE.Mesh(archGeo, darkMetalMat);
  arch.position.set(0, 0.42, -3.1);
  arch.rotation.x = -0.35;
  root.add(arch);

  // 3. Main Wings & Underwing Ordnance (Missiles)
  let leftWingPivot = null;
  let rightWingPivot = null;
  const externalMissiles = [];

  function buildOrdnanceMissile(x, y, z) {
    const mGrp = new THREE.Group();
    const mBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 2.35, 8).rotateX(Math.PI / 2),
      missileWhiteMat
    );
    const mNose = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.42, 8).rotateX(-Math.PI / 2),
      darkMetalMat
    );
    mNose.position.z = -1.38;
    const mFins = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.42, 0.35),
      darkMetalMat
    );
    mFins.position.z = 0.85;
    mGrp.add(mBody, mNose, mFins);
    mGrp.position.set(x, y, z);
    return mGrp;
  }

  if (type === 'f14') {
    leftWingPivot = new THREE.Group();
    leftWingPivot.position.set(-1.15, 0.12, -0.5);
    root.add(leftWingPivot);

    const lwShape = new THREE.Shape();
    lwShape.moveTo(0, -1.1);
    lwShape.lineTo(-6.4, 0.2);
    lwShape.lineTo(-6.4, 1.25);
    lwShape.lineTo(0, 1.65);
    lwShape.closePath();

    const lwGeo = new THREE.ExtrudeGeometry(lwShape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.04
    });
    lwGeo.rotateX(Math.PI / 2);
    const leftWingMesh = new THREE.Mesh(lwGeo, bodyMat);
    leftWingMesh.castShadow = true;
    leftWingPivot.add(leftWingMesh);

    rightWingPivot = new THREE.Group();
    rightWingPivot.position.set(1.15, 0.12, -0.5);
    root.add(rightWingPivot);

    const rwShape = new THREE.Shape();
    rwShape.moveTo(0, -1.1);
    rwShape.lineTo(6.4, 0.2);
    rwShape.lineTo(6.4, 1.25);
    rwShape.lineTo(0, 1.65);
    rwShape.closePath();

    const rwGeo = new THREE.ExtrudeGeometry(rwShape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.04
    });
    rwGeo.rotateX(Math.PI / 2);
    const rightWingMesh = new THREE.Mesh(rwGeo, bodyMat);
    rightWingMesh.castShadow = true;
    rightWingPivot.add(rightWingMesh);

    for (const mx of [-1.75, 1.75, -0.85, 0.85]) {
      const m = buildOrdnanceMissile(mx, -0.36, 0.2);
      root.add(m);
      externalMissiles.push(m);
    }
  } else {
    const wingSpan = type === 'f35' ? 12.8 : 12.0;
    const halfSpan = wingSpan * 0.5;
    const wingShape = new THREE.Shape();
    wingShape.moveTo(-1.1, -1.8);
    wingShape.lineTo(-halfSpan, 1.3);
    wingShape.lineTo(-halfSpan, 2.55);
    wingShape.lineTo(-1.1, 2.85);
    wingShape.lineTo(1.1, 2.85);
    wingShape.lineTo(halfSpan, 2.55);
    wingShape.lineTo(halfSpan, 1.3);
    wingShape.lineTo(1.1, -1.8);
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

    const railGeo = new THREE.BoxGeometry(0.14, 0.2, 2.7);
    for (const side of [-1, 1]) {
      const rail = new THREE.Mesh(railGeo, accentMat);
      rail.position.set(side * halfSpan, 0.05, 1.9);
      root.add(rail);

      const tipMissile = buildOrdnanceMissile(side * (halfSpan + 0.12), 0.05, 1.8);
      root.add(tipMissile);
      externalMissiles.push(tipMissile);

      for (const px of [2.6, 4.1]) {
        const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.36, 1.6), accentMat);
        pylon.position.set(side * px, -0.14, 1.2);
        root.add(pylon);

        const pylonMissile = buildOrdnanceMissile(side * px, -0.34, 1.2);
        root.add(pylonMissile);
        externalMissiles.push(pylonMissile);
      }
    }
  }

  // 4. Animated Horizontal Stabilators & Twin Vertical Tails
  const leftStabPivot = new THREE.Group();
  leftStabPivot.position.set(-1.1, 0.0, 4.15);
  root.add(leftStabPivot);

  const rightStabPivot = new THREE.Group();
  rightStabPivot.position.set(1.1, 0.0, 4.15);
  root.add(rightStabPivot);

  const stabShape = new THREE.Shape();
  stabShape.moveTo(0, -0.8);
  stabShape.lineTo(2.2, 0.35);
  stabShape.lineTo(2.2, 1.15);
  stabShape.lineTo(0, 1.25);
  stabShape.closePath();

  const stabGeoR = new THREE.ExtrudeGeometry(stabShape, { depth: 0.08, bevelEnabled: false });
  stabGeoR.rotateX(Math.PI / 2);
  const rightStabMesh = new THREE.Mesh(stabGeoR, accentMat);
  rightStabPivot.add(rightStabMesh);

  const leftStabMesh = rightStabMesh.clone();
  leftStabMesh.scale.x = -1;
  leftStabPivot.add(leftStabMesh);

  // Vertical Stabilizers
  const tailShape = new THREE.Shape();
  tailShape.moveTo(0, 0);
  tailShape.lineTo(1.2, 2.15);
  tailShape.lineTo(2.35, 2.15);
  tailShape.lineTo(2.45, 0);
  tailShape.closePath();

  const tailGeo = new THREE.ExtrudeGeometry(tailShape, {
    depth: 0.12,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02
  });
  tailGeo.rotateY(Math.PI / 2);

  if (isBomber) {
    const singleTail = new THREE.Mesh(tailGeo, accentMat);
    singleTail.scale.set(1.2, 1.35, 1.2);
    singleTail.position.set(0, 0.25, 2.5);
    root.add(singleTail);
  } else {
    const cantAngle = type === 'f14' ? 0.08 : 0.32;
    const leftTail = new THREE.Mesh(tailGeo, accentMat);
    leftTail.position.set(-1.05, 0.18, 2.3);
    leftTail.rotation.z = cantAngle;
    root.add(leftTail);

    const rightTail = new THREE.Mesh(tailGeo, accentMat);
    rightTail.position.set(1.05, 0.18, 2.3);
    rightTail.rotation.z = -cantAngle;
    root.add(rightTail);
  }

  // 5. Detailed Variable Exhaust Nozzles & Multi-Layer Shock-Diamond Afterburners
  const burnerMeshes = [];
  const outerPlumeMat = new THREE.MeshBasicMaterial({
    color: burnerHex,
    transparent: true,
    opacity: 0.82,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const innerCoreMat = new THREE.MeshBasicMaterial({
    color: 0xd8f4ff,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  for (const xOff of nacelleOffsets) {
    const nozzleRadius = type === 'f35' ? 0.54 : 0.44;
    const nozzleGeo = new THREE.CylinderGeometry(nozzleRadius * 0.84, nozzleRadius, 1.2, 16);
    nozzleGeo.rotateX(Math.PI / 2);
    const nozzle = new THREE.Mesh(nozzleGeo, darkMetalMat);
    nozzle.position.set(xOff, -0.12, 4.95);
    root.add(nozzle);

    const coreDisc = new THREE.Mesh(
      new THREE.CircleGeometry(nozzleRadius * 0.78, 14),
      new THREE.MeshBasicMaterial({ color: 0xff9933 })
    );
    coreDisc.position.set(xOff, -0.12, 5.45);
    root.add(coreDisc);

    const plumeGroup = new THREE.Group();
    plumeGroup.position.set(xOff, -0.12, 5.5);

    const outerConeGeo = new THREE.ConeGeometry(nozzleRadius * 0.85, 3.8, 16, 1, true);
    outerConeGeo.rotateX(Math.PI / 2);
    outerConeGeo.translate(0, 0, 1.9);
    const outerCone = new THREE.Mesh(outerConeGeo, outerPlumeMat.clone());
    plumeGroup.add(outerCone);

    const innerConeGeo = new THREE.ConeGeometry(nozzleRadius * 0.48, 2.4, 12);
    innerConeGeo.rotateX(Math.PI / 2);
    innerConeGeo.translate(0, 0, 1.2);
    const innerCone = new THREE.Mesh(innerConeGeo, innerCoreMat.clone());
    plumeGroup.add(innerCone);

    for (let d = 1; d <= 3; d++) {
      const diamond = new THREE.Mesh(
        new THREE.OctahedronGeometry(nozzleRadius * (0.36 - d * 0.06), 0),
        innerCoreMat
      );
      diamond.scale.set(1, 1, 1.8);
      diamond.position.set(0, 0, d * 0.78);
      plumeGroup.add(diamond);
    }

    root.add(plumeGroup);
    burnerMeshes.push({ group: plumeGroup, outerMat: outerCone.material, innerMat: innerCone.material });
  }

  // 6. Deployable Landing Gear & Carrier Tailhook
  const gearGroup = new THREE.Group();
  const strutGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.05, 8);
  const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 14);
  wheelGeo.rotateZ(Math.PI / 2);

  const noseStrut = new THREE.Mesh(strutGeo, darkMetalMat);
  noseStrut.position.set(0, -0.85, -3.6);
  gearGroup.add(noseStrut);
  for (const wx of [-0.14, 0.14]) {
    const nw = new THREE.Mesh(wheelGeo, darkMetalMat);
    nw.scale.setScalar(0.78);
    nw.position.set(wx, -1.32, -3.6);
    gearGroup.add(nw);
  }

  for (const side of [-1.45, 1.45]) {
    const mainStrut = new THREE.Mesh(strutGeo, darkMetalMat);
    mainStrut.position.set(side, -0.85, 1.2);
    gearGroup.add(mainStrut);
    const mainWheel = new THREE.Mesh(wheelGeo, darkMetalMat);
    mainWheel.position.set(side, -1.35, 1.2);
    gearGroup.add(mainWheel);
  }

  const tailhookPivot = new THREE.Group();
  tailhookPivot.position.set(0, -0.35, 3.8);
  const hookBarGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.35, 8);
  hookBarGeo.rotateX(Math.PI / 2);
  hookBarGeo.translate(0, 0, 1.18);
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
    externalMissiles
  };

  return root;
}

/**
 * Updates F-14 variable-sweep wings, stabilator control surfaces, afterburner plumes, and landing gear.
 */
export function updateJetVisuals(jetMesh, speedKts, throttle, gearDown, pitchInput = 0, rollInput = 0) {
  if (!jetMesh || !jetMesh.userData) return;
  const {
    burnerMeshes,
    gearGroup,
    leftWingPivot,
    rightWingPivot,
    leftStabPivot,
    rightStabPivot
  } = jetMesh.userData;

  if (gearGroup) {
    gearGroup.visible = Boolean(gearDown);
  }

  if (leftWingPivot && rightWingPivot) {
    const sweepFactor = gearDown
      ? 0
      : Math.max(0, Math.min(1, (speedKts - 240) / 340));
    const sweepRad = sweepFactor * 0.62;
    leftWingPivot.rotation.y = sweepRad;
    rightWingPivot.rotation.y = -sweepRad;
  }

  if (leftStabPivot && rightStabPivot) {
    leftStabPivot.rotation.x = THREE.MathUtils.clamp(pitchInput * 0.35 - rollInput * 0.22, -0.45, 0.45);
    rightStabPivot.rotation.x = THREE.MathUtils.clamp(pitchInput * 0.35 + rollInput * 0.22, -0.45, 0.45);
  }

  if (burnerMeshes) {
    const isAfterburner = throttle > 0.85;
    const flutter = Math.sin(performance.now() * 0.08) * 0.14;
    const scaleZ = isAfterburner
      ? 1.15 + (throttle - 0.85) * 3.8 + flutter
      : Math.max(0.18, throttle * 0.55);

    for (const b of burnerMeshes) {
      b.group.scale.set(1, 1, scaleZ);
      b.outerMat.opacity = isAfterburner ? 0.88 : 0.38 * throttle;
      b.outerMat.color.setHex(isAfterburner ? 0xff8822 : 0xd94814);
      b.innerMat.opacity = isAfterburner ? 0.95 : 0.25 * throttle;
    }
  }
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
    color: 0x353e48,
    roughness: 0.62,
    metalness: 0.38
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

  const bridgeTower = new THREE.Mesh(new THREE.BoxGeometry(10.5, 9.5, 24), hullMat);
  bridgeTower.position.set(0, 22.5, -6);
  islandGroup.add(bridgeTower);

  const bridgeGlass = new THREE.Mesh(
    new THREE.BoxGeometry(10.9, 2.2, 16),
    new THREE.MeshBasicMaterial({ color: 0x70e4ff })
  );
  bridgeGlass.position.set(-0.2, 24.2, -7);
  islandGroup.add(bridgeGlass);

  const mastPole = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.9, 18, 8), hullMat);
  mastPole.position.set(0, 34, 2);
  islandGroup.add(mastPole);

  const yardarm = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 14, 6).rotateZ(Math.PI / 2), hullMat);
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
    { x: 25, z: 28, yaw: 0.52, type: 'f35' }
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
    meatballLight3D
  };

  return carrier;
}
