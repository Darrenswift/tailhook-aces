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
    bodyColor: 0x7a8896,
    accentColor: 0x2c3844,
    noseColor: 0x525e6b
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
    bodyColor: 0x89949f,
    accentColor: 0x1e242b,
    noseColor: 0x262c34
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
    bodyColor: 0x454d57,
    accentColor: 0x2c323a,
    noseColor: 0x333942
  }
};

/**
 * Builds a procedural 3D jet fighter or bomber mesh.
 * Forward direction in local space is -Z.
 */
export function createJetMesh(type = 'f18') {
  const root = new THREE.Group();

  let bodyHex = 0x7a8896;
  let accentHex = 0x2c3844;
  let noseHex = 0x4d5966;
  let canopyHex = 0x38a3d6;
  let burnerHex = 0xff7722;

  if (JET_CONFIGS[type]) {
    bodyHex = JET_CONFIGS[type].bodyColor;
    accentHex = JET_CONFIGS[type].accentColor;
    noseHex = JET_CONFIGS[type].noseColor;
  } else if (type === 'mig29') {
    bodyHex = 0x4b5d52;
    accentHex = 0x8f2424;
    noseHex = 0x2a332d;
    canopyHex = 0xd69038;
  } else if (type === 'su33') {
    // Ace Squadron Boss Flanker
    bodyHex = 0x252932;
    accentHex = 0xc9222b;
    noseHex = 0x14171d;
    canopyHex = 0xff4433;
  } else if (type === 'bomber') {
    // Tu-22M Heavy Fleet Strike Bomber
    bodyHex = 0x62707c;
    accentHex = 0x992828;
    noseHex = 0x323a42;
  }

  const bodyMat = new THREE.MeshStandardMaterial({
    color: bodyHex,
    roughness: 0.42,
    metalness: 0.55
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: accentHex,
    roughness: 0.5,
    metalness: 0.4
  });
  const noseMat = new THREE.MeshStandardMaterial({
    color: noseHex,
    roughness: 0.35,
    metalness: 0.5
  });
  const canopyMat = new THREE.MeshStandardMaterial({
    color: canopyHex,
    roughness: 0.12,
    metalness: 0.85,
    transparent: true,
    opacity: 0.78
  });
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x1a1e24,
    roughness: 0.6,
    metalness: 0.7
  });

  // 1. Main Fuselage Spine & Nose Cone
  const isBomber = type === 'bomber';
  const scaleMul = isBomber ? 1.85 : 1.0;

  const fuselageGeo = new THREE.BoxGeometry(1.7, 0.85, 9.2);
  const fuselage = new THREE.Mesh(fuselageGeo, bodyMat);
  fuselage.position.set(0, 0, 0.2);
  fuselage.castShadow = true;
  root.add(fuselage);

  // Nose Radome (-Z is forward)
  const noseGeo = new THREE.ConeGeometry(0.78, 4.4, 8);
  noseGeo.rotateX(-Math.PI / 2);
  const nose = new THREE.Mesh(noseGeo, noseMat);
  nose.position.set(0, -0.04, -6.5);
  root.add(nose);

  // Leading Edge Extensions (LEX / Strakes)
  const lexGeo = new THREE.BoxGeometry(3.8, 0.16, 4.6);
  const lex = new THREE.Mesh(lexGeo, bodyMat);
  lex.position.set(0, 0.08, -1.6);
  root.add(lex);

  // Engine Air Intakes
  const intakeGeo = new THREE.BoxGeometry(2.65, 0.72, 5.8);
  const intakes = new THREE.Mesh(intakeGeo, accentMat);
  intakes.position.set(0, -0.18, 0.8);
  root.add(intakes);

  // Bubble Canopy
  const canopyGeo = new THREE.SphereGeometry(0.58, 12, 10);
  canopyGeo.scale(0.95, 0.78, 3.2);
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.set(0, 0.52, -2.5);
  root.add(canopy);

  // 2. Main Wings (F-14 has animated variable-sweep pivots!)
  let leftWingPivot = null;
  let rightWingPivot = null;

  if (type === 'f14') {
    leftWingPivot = new THREE.Group();
    leftWingPivot.position.set(-1.1, 0.12, -0.6);
    root.add(leftWingPivot);

    const leftWingShape = new THREE.BoxGeometry(6.8, 0.16, 2.1);
    const leftWingMesh = new THREE.Mesh(leftWingShape, bodyMat);
    leftWingMesh.position.set(-3.1, 0, 0.4);
    leftWingPivot.add(leftWingMesh);

    const leftStripe = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 2.12), accentMat);
    leftStripe.position.set(-5.6, 0, 0.4);
    leftWingPivot.add(leftStripe);

    rightWingPivot = new THREE.Group();
    rightWingPivot.position.set(1.1, 0.12, -0.6);
    root.add(rightWingPivot);

    const rightWingMesh = new THREE.Mesh(leftWingShape, bodyMat);
    rightWingMesh.position.set(3.1, 0, 0.4);
    rightWingPivot.add(rightWingMesh);

    const rightStripe = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 2.12), accentMat);
    rightStripe.position.set(5.6, 0, 0.4);
    rightWingPivot.add(rightStripe);
  } else {
    // Delta / Trapezoidal swept wings
    const wingSpan = type === 'f35' ? 12.6 : 11.8;
    const wingShape = new THREE.Shape();
    const halfSpan = wingSpan * 0.5;
    wingShape.moveTo(-1.1, -1.6);
    wingShape.lineTo(-halfSpan, 1.4);
    wingShape.lineTo(-halfSpan, 2.6);
    wingShape.lineTo(-1.1, 2.8);
    wingShape.lineTo(1.1, 2.8);
    wingShape.lineTo(halfSpan, 2.6);
    wingShape.lineTo(halfSpan, 1.4);
    wingShape.lineTo(1.1, -1.6);
    wingShape.closePath();

    const extrudeSettings = { depth: 0.16, bevelEnabled: false };
    const wingGeo = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
    wingGeo.rotateX(Math.PI / 2);
    const wings = new THREE.Mesh(wingGeo, bodyMat);
    wings.position.set(0, 0.12, 0.2);
    wings.castShadow = true;
    root.add(wings);

    // Wingtip Missile Rails + AIM-9 Sidewinders
    const railGeo = new THREE.BoxGeometry(0.18, 0.22, 2.6);
    const leftRail = new THREE.Mesh(railGeo, accentMat);
    leftRail.position.set(-halfSpan, 0.04, 1.9);
    root.add(leftRail);

    const rightRail = new THREE.Mesh(railGeo, accentMat);
    rightRail.position.set(halfSpan, 0.04, 1.9);
    root.add(rightRail);
  }

  // Horizontal Tailplanes (Stabilators)
  const stabGeo = new THREE.BoxGeometry(5.6, 0.12, 1.8);
  const stabs = new THREE.Mesh(stabGeo, accentMat);
  stabs.position.set(0, 0.02, 4.1);
  root.add(stabs);

  // Vertical Stabilizers (Twin tails for fighters, single tall tail for bomber)
  if (isBomber) {
    const tailGeo = new THREE.BoxGeometry(0.22, 2.6, 2.4);
    const tail = new THREE.Mesh(tailGeo, accentMat);
    tail.position.set(0, 1.4, 3.6);
    root.add(tail);
  } else {
    const tailGeo = new THREE.BoxGeometry(0.16, 2.0, 2.1);
    const cantAngle = type === 'f14' ? 0.08 : 0.32;

    const leftTail = new THREE.Mesh(tailGeo, accentMat);
    leftTail.position.set(-1.05, 1.1, 3.5);
    leftTail.rotation.z = cantAngle;
    root.add(leftTail);

    const rightTail = new THREE.Mesh(tailGeo, accentMat);
    rightTail.position.set(1.05, 1.1, 3.5);
    rightTail.rotation.z = -cantAngle;
    root.add(rightTail);
  }

  // 3. Engine Exhaust Nozzles & Glowing Afterburner Plumes
  const burnerMeshes = [];
  const burnerMat = new THREE.MeshBasicMaterial({
    color: burnerHex,
    transparent: true,
    opacity: 0.85
  });

  const nozzleOffsets = type === 'f35' ? [0] : [-0.62, 0.62];
  for (const xOff of nozzleOffsets) {
    const nozzleRadius = type === 'f35' ? 0.52 : 0.42;
    const nozzleGeo = new THREE.CylinderGeometry(nozzleRadius * 0.88, nozzleRadius, 1.1, 12);
    nozzleGeo.rotateX(Math.PI / 2);
    const nozzle = new THREE.Mesh(nozzleGeo, darkMetalMat);
    nozzle.position.set(xOff, -0.05, 4.9);
    root.add(nozzle);

    const plumeGeo = new THREE.ConeGeometry(nozzleRadius * 0.82, 3.2, 12);
    plumeGeo.rotateX(Math.PI / 2);
    plumeGeo.translate(0, 0, 1.6);
    const plume = new THREE.Mesh(plumeGeo, burnerMat.clone());
    plume.position.set(xOff, -0.05, 5.2);
    root.add(plume);
    burnerMeshes.push(plume);
  }

  // 4. Deployable Landing Gear & Carrier Tailhook
  const gearGroup = new THREE.Group();
  const strutGeo = new THREE.BoxGeometry(0.14, 1.05, 0.14);
  const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 12);
  wheelGeo.rotateZ(Math.PI / 2);

  // Nose gear
  const noseStrut = new THREE.Mesh(strutGeo, darkMetalMat);
  noseStrut.position.set(0, -0.85, -3.6);
  gearGroup.add(noseStrut);
  const noseWheel = new THREE.Mesh(wheelGeo, darkMetalMat);
  noseWheel.position.set(0, -1.35, -3.6);
  gearGroup.add(noseWheel);

  // Main Left & Right Gear
  for (const side of [-1.45, 1.45]) {
    const mainStrut = new THREE.Mesh(strutGeo, darkMetalMat);
    mainStrut.position.set(side, -0.85, 1.2);
    gearGroup.add(mainStrut);
    const mainWheel = new THREE.Mesh(wheelGeo, darkMetalMat);
    mainWheel.position.set(side, -1.35, 1.2);
    gearGroup.add(mainWheel);
  }

  // Tailhook Assembly
  const tailhookPivot = new THREE.Group();
  tailhookPivot.position.set(0, -0.35, 3.8);
  const hookBarGeo = new THREE.BoxGeometry(0.12, 0.12, 2.3);
  hookBarGeo.translate(0, 0, 1.15);
  const hookBar = new THREE.Mesh(hookBarGeo, accentMat);
  tailhookPivot.add(hookBar);
  tailhookPivot.rotation.x = -0.58; // Deployed downward angle
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
    rightWingPivot
  };

  return root;
}

/**
 * Updates F-14 variable-sweep wings, afterburner plumes, and landing gear visibility.
 */
export function updateJetVisuals(jetMesh, speedKts, throttle, gearDown) {
  if (!jetMesh || !jetMesh.userData) return;
  const { burnerMeshes, gearGroup, leftWingPivot, rightWingPivot } = jetMesh.userData;

  if (gearGroup) {
    gearGroup.visible = Boolean(gearDown);
  }

  // F-14 Tomcat Swing-Wing sweep angle based on airspeed
  if (leftWingPivot && rightWingPivot) {
    // Sweep back smoothly between 240 kts and 580 kts (unless gear is down)
    const sweepFactor = gearDown
      ? 0
      : Math.max(0, Math.min(1, (speedKts - 240) / 340));
    const sweepRad = sweepFactor * 0.58;
    leftWingPivot.rotation.y = sweepRad;
    rightWingPivot.rotation.y = -sweepRad;
  }

  // Afterburner plume scaling
  if (burnerMeshes) {
    const isAfterburner = throttle > 0.85;
    const scaleZ = isAfterburner
      ? 1.1 + (throttle - 0.85) * 3.8 + Math.sin(performance.now() * 0.06) * 0.18
      : Math.max(0.15, throttle * 0.65);

    for (const plume of burnerMeshes) {
      plume.scale.set(1, 1, scaleZ);
      plume.material.opacity = isAfterburner ? 0.92 : 0.45 * throttle;
      plume.material.color.setHex(isAfterburner ? 0xff9933 : 0xd94814);
    }
  }
}

/**
 * Builds the Nimitz-Class Aircraft Carrier (CVN-68) with angled flight deck,
 * 4 arrestor wires, optical landing system ("Meatball"), and rotating radar.
 * Carrier heads along -Z; aircraft approach from +Z toward -Z.
 * Deck surface is at Y = 20.0.
 */
export function createCarrierGroup() {
  const carrier = new THREE.Group();
  const DECK_Y = 20.0;

  const hullMat = new THREE.MeshStandardMaterial({
    color: 0x2e353d,
    roughness: 0.7,
    metalness: 0.3
  });
  const deckMat = new THREE.MeshStandardMaterial({
    color: 0x23282e,
    roughness: 0.88,
    metalness: 0.15
  });
  const stripeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xf0f4f8 });
  const stripeYellowMat = new THREE.MeshBasicMaterial({ color: 0xf5b82e });
  const wireMat = new THREE.MeshBasicMaterial({ color: 0xd0dae5 });

  // Lower Waterline Hull
  const hullGeo = new THREE.BoxGeometry(44, 18.5, 310);
  const hull = new THREE.Mesh(hullGeo, hullMat);
  hull.position.set(0, 9.25, 0);
  carrier.add(hull);

  // Main Flight Deck Surface (top face at Y = 20.0)
  const deckGeo = new THREE.BoxGeometry(74, 2.0, 340);
  const deck = new THREE.Mesh(deckGeo, deckMat);
  deck.position.set(0, DECK_Y - 1.0, 0);
  deck.receiveShadow = true;
  carrier.add(deck);

  // Runway Centerline & Threshold Markings (extending from stern z = +165 to bow z = -155)
  for (let z = -140; z <= 155; z += 18) {
    const dashGeo = new THREE.BoxGeometry(1.1, 0.08, 9.5);
    const dash = new THREE.Mesh(dashGeo, stripeWhiteMat);
    dash.position.set(0, DECK_Y + 0.05, z);
    carrier.add(dash);
  }

  // Left & Right Landing Area Foul Lines
  const foulLineGeo = new THREE.BoxGeometry(0.85, 0.08, 300);
  const leftFoul = new THREE.Mesh(foulLineGeo, stripeYellowMat);
  leftFoul.position.set(-18, DECK_Y + 0.05, 10);
  carrier.add(leftFoul);

  const rightFoul = new THREE.Mesh(foulLineGeo, stripeYellowMat);
  rightFoul.position.set(18, DECK_Y + 0.05, 10);
  carrier.add(rightFoul);

  // Stern Ramp Threshold Bar ("Ramp")
  const thresholdGeo = new THREE.BoxGeometry(36, 0.1, 3.5);
  const threshold = new THREE.Mesh(thresholdGeo, stripeYellowMat);
  threshold.position.set(0, DECK_Y + 0.06, 162);
  carrier.add(threshold);

  // 4 Arrestor Wires across the landing zone:
  // Wire #1: z = 115, Wire #2: z = 95, Wire #3 (Target!): z = 75, Wire #4: z = 55
  const wirePositionsZ = [115, 95, 75, 55];
  const wireMeshes = [];
  wirePositionsZ.forEach((zPos, idx) => {
    const isTargetThreeWire = idx === 2;
    const wGeo = new THREE.CylinderGeometry(0.18, 0.18, 34, 8);
    wGeo.rotateZ(Math.PI / 2);
    const wMesh = new THREE.Mesh(
      wGeo,
      isTargetThreeWire ? new THREE.MeshBasicMaterial({ color: 0x24f07d }) : wireMat
    );
    wMesh.position.set(0, DECK_Y + 0.18, zPos);
    carrier.add(wMesh);
    wireMeshes.push({ number: idx + 1, z: zPos, mesh: wMesh });
  });

  // Touchdown Aimpoint Box around #3 Wire (z = 75)
  const aimBoxGeo = new THREE.BoxGeometry(14, 0.07, 6);
  const aimBox = new THREE.Mesh(aimBoxGeo, stripeWhiteMat);
  aimBox.position.set(0, DECK_Y + 0.04, 75);
  carrier.add(aimBox);

  // Optical Landing System ("Meatball" IFLOLS Light Array on Port Side at z = 65)
  const olsGroup = new THREE.Group();
  olsGroup.position.set(-22, DECK_Y + 2.5, 65);
  const olsFrame = new THREE.Mesh(
    new THREE.BoxGeometry(4.5, 5.0, 0.8),
    new THREE.MeshBasicMaterial({ color: 0x12161a })
  );
  olsGroup.add(olsFrame);

  // Green Datum Lights
  for (const xDatum of [-1.6, -0.9, 0.9, 1.6]) {
    const datumLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x24f07d })
    );
    datumLight.position.set(xDatum, 0, 0.45);
    olsGroup.add(datumLight);
  }

  // Moving Amber Meatball Light on the 3D deck
  const meatballLight3D = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xffaa00 })
  );
  meatballLight3D.position.set(0, 0, 0.5);
  olsGroup.add(meatballLight3D);
  carrier.add(olsGroup);

  // Starboard Island Superstructure & Bridge
  const islandGroup = new THREE.Group();
  islandGroup.position.set(27, DECK_Y, -18);

  const islandBase = new THREE.Mesh(new THREE.BoxGeometry(12, 18, 46), hullMat);
  islandBase.position.set(0, 9, 0);
  islandGroup.add(islandBase);

  const bridgeTower = new THREE.Mesh(new THREE.BoxGeometry(10, 9, 22), hullMat);
  bridgeTower.position.set(0, 22.5, -6);
  islandGroup.add(bridgeTower);

  // Bridge Windows
  const bridgeGlass = new THREE.Mesh(
    new THREE.BoxGeometry(10.4, 2.2, 14),
    new THREE.MeshBasicMaterial({ color: 0x5ce6ff })
  );
  bridgeGlass.position.set(-0.2, 24, -8);
  islandGroup.add(bridgeGlass);

  // Rotating Radar Dish on Mast
  const radarSpinner = new THREE.Group();
  radarSpinner.position.set(0, 31, -4);
  const radarDish = new THREE.Mesh(
    new THREE.BoxGeometry(9.5, 2.2, 1.2),
    new THREE.MeshStandardMaterial({ color: 0xd8e2ec, roughness: 0.3 })
  );
  radarSpinner.add(radarDish);
  islandGroup.add(radarSpinner);

  carrier.add(islandGroup);

  // Deck Edge Approach Lights (for Stage 4 Sunset & Stage 5 Night/Fog)
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

  // Stern vertical drop lights
  for (let y = 4; y <= 19; y += 3) {
    const sternLight = new THREE.Mesh(lightBulbGeo, amberLightMat);
    sternLight.position.set(0, y, 170.4);
    deckLightsGroup.add(sternLight);
  }
  carrier.add(deckLightsGroup);

  // White Foam Wake Trail behind the Carrier Stern
  const wakeGeo = new THREE.PlaneGeometry(52, 420);
  wakeGeo.rotateX(-Math.PI / 2);
  const wakeMat = new THREE.MeshBasicMaterial({
    color: 0xd9f2ff,
    transparent: true,
    opacity: 0.25
  });
  const wake = new THREE.Mesh(wakeGeo, wakeMat);
  wake.position.set(0, 0.35, 380);
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
