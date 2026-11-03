import * as THREE from 'three';

// ==========================================
// SHARED GLSL ATMOSPHERIC & NOISE FUNCTIONS
// (100% safe for fp16/mediump & Linux Mesa drivers)
// ==========================================
const COMMON_ATMOS_GLSL = `
  uniform vec3 uSunDir;
  uniform vec3 uZenithColor;
  uniform vec3 uMidSkyColor;
  uniform vec3 uHorizonColor;
  uniform vec3 uSunGlowColor;
  uniform float uSunIntensity;
  uniform float uTime;

  // Range-bounded hash (never exceeds 50.0, 100% immune to fp16 overflow)
  float hash21(vec2 p) {
    vec2 q = mod(p, 64.0);
    q = fract(q * vec2(0.1031, 0.1030));
    q += dot(q, q.yx + 19.19);
    return fract((q.x + q.y) * q.x);
  }

  // Value noise returning vec3(value, dValue/dx, dValue/dy)
  vec3 noised2(vec2 x) {
    vec2 i = mod(floor(x), 64.0);
    vec2 f = fract(x);
    // Quintic interpolation with smooth analytical derivatives
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    vec2 du = 30.0 * f * f * (f * (f - 2.0) + 1.0);

    float a = hash21(i + vec2(0.0, 0.0));
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));

    float k0 = a;
    float k1 = b - a;
    float k2 = c - a;
    float k3 = a - b - c + d;

    return vec3(
      k0 + k1 * u.x + k2 * u.y + k3 * u.x * u.y,
      du * (vec2(k1, k2) + k3 * u.yx)
    );
  }

  // Standard 2D value noise (scalar)
  float vnoise(vec2 x) {
    vec2 i = mod(floor(x), 64.0);
    vec2 f = fract(x);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash21(i + vec2(0.0, 0.0));
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  // Non-axis-aligned rotation matrix to prevent rectangular grid moire
  const mat2 ROT_OCTAVE = mat2(0.80, -0.60, 0.60, 0.80);

  float fbm4(vec2 p) {
    float f = 0.0;
    float amp = 0.5;
    vec2 q = mod(p, 64.0);
    for (int i = 0; i < 4; i++) {
      f += amp * vnoise(q);
      q = mod(ROT_OCTAVE * q * 2.03 + vec2(3.7, 7.1), 64.0);
      amp *= 0.5;
    }
    return f;
  }

  // Shared physically-inspired sky radiance (used by Sky Dome, Ocean reflection, and Aerial Perspective)
  vec3 computeBaseSkyColor(vec3 dir) {
    float y = clamp(dir.y, 0.0, 1.0);
    // Safe non-zero base for pow() so Mesa log2(0) never produces NaN
    float lowerCurve = pow(max(y, 0.0001), 0.42);
    float upperCurve = smoothstep(0.12, 0.88, y);
    vec3 skyCol = mix(uHorizonColor, uMidSkyColor, lowerCurve);
    skyCol = mix(skyCol, uZenithColor, upperCurve);

    // Subtle warm horizon band toward the sun azimuth (using pure multiplications instead of pow)
    float sunDot = clamp(dot(dir, normalize(uSunDir)), 0.0, 1.0);
    float invY = 1.0 - y;
    float invY2 = invY * invY;
    float horizonFactor = invY2 * invY * sqrt(max(invY, 0.0001));
    float sunDot2 = sunDot * sunDot;
    float sunDot3 = sunDot2 * sunDot;
    skyCol += uSunGlowColor * (sunDot3 * horizonFactor * 0.38 * clamp(uSunIntensity * 0.4, 0.0, 1.0));

    // Mie forward-scattering solar aureole & corona
    float sunDot4 = sunDot2 * sunDot2;
    float sunDot8 = sunDot4 * sunDot4;
    float sunDot16 = sunDot8 * sunDot8;
    float sunDot64 = (sunDot16 * sunDot16) * (sunDot16 * sunDot16);
    float mieWide = sunDot8 * 0.22;
    float mieTight = sunDot64 * 0.45;
    skyCol += uSunGlowColor * (mieWide + mieTight) * clamp(uSunIntensity * 0.45, 0.0, 1.2);

    return clamp(skyCol, 0.0, 4.0);
  }
`;

// ==========================================
// 1. REALISTIC SKY DOME + VOLUMETRIC CLOUD SHADER
// ==========================================
const SKY_VERTEX_SHADER = `
  varying vec3 vRayDir;
  void main() {
    // Pass normalized unit vector [-1, 1] so interpolator never overflows fp16
    vRayDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SKY_FRAGMENT_SHADER = `
  ${COMMON_ATMOS_GLSL}
  uniform vec3 uCameraPos;
  uniform float uCloudCoverage;
  uniform float uNightFactor;
  varying vec3 vRayDir;

  // 5-octave organic cumulus cloud density
  float cloudFBM(vec2 p) {
    float v = 0.0;
    float a = 0.52;
    vec2 q = mod(p, 64.0);
    for (int i = 0; i < 5; i++) {
      v += a * vnoise(q);
      q = mod(ROT_OCTAVE * q * 2.07 + vec2(5.3, 11.7), 64.0);
      a *= 0.48;
    }
    return v;
  }

  void main() {
    vec3 dir = normalize(vRayDir);
    vec3 sunDir = normalize(uSunDir);
    vec3 col = computeBaseSkyColor(dir);

    // Below horizon fallback (covered by ocean, but prevents any sub-horizon seam)
    if (dir.y < 0.0) {
      gl_FragColor = vec4(col, 1.0);
      return;
    }

    // Crisp solar disc above horizon
    float sunDot = clamp(dot(dir, sunDir), 0.0, 1.0);
    float sunDisc = smoothstep(0.99945, 0.99985, sunDot) * step(0.0, sunDir.y);
    col += vec3(1.0, 0.96, 0.88) * sunDisc * 1.4;

    // Night stars when sun is below horizon
    if (uNightFactor > 0.05 && dir.y > 0.05) {
      vec2 starUV = dir.xz / (dir.y + 0.35) * 45.0;
      float starVal = hash21(floor(starUV));
      vec2 cell = fract(starUV) - 0.5;
      float starSpot = smoothstep(0.18, 0.02, length(cell)) * step(0.992, starVal);
      float twinkle = 0.65 + 0.35 * sin(mod(uTime, 62.83) * 3.5 + starVal * 25.0);
      col += vec3(0.85, 0.92, 1.0) * starSpot * twinkle * uNightFactor * smoothstep(0.05, 0.3, dir.y);
    }

    // Volumetric 2-Layer Cloud Deck (projected onto curved atmospheric shell in range-safe UV units)
    if (dir.y > 0.012) {
      float shellScale = 0.44 / (dir.y + 0.085);
      vec2 camUV = mod(uCameraPos.xz * 0.00013, 64.0);
      vec2 windUV = mod(vec2(uTime * 0.0053, uTime * 0.0025), 64.0);
      vec2 baseCloudUV = camUV + dir.xz * shellScale + windUV;

      // High-altitude wispy cirrus layer
      vec2 cirrusUV = baseCloudUV * 0.58 + vec2(4.2, -1.8);
      float cirrusWarp = vnoise(cirrusUV * 1.5);
      float cirrusVal = fbm4(cirrusUV * vec2(1.8, 0.7) + cirrusWarp * 0.65);
      float cirrusMask = smoothstep(0.58, 0.86, cirrusVal) * smoothstep(0.03, 0.25, dir.y) * 0.35;
      vec3 cirrusColor = mix(uHorizonColor * 1.08, vec3(1.0, 0.98, 0.95), clamp(sunDir.y * 2.2 + 0.35, 0.15, 1.0));
      col = mix(col, cirrusColor, cirrusMask * (1.0 - uNightFactor * 0.7));

      // Main cumulus cloud deck with directional sun self-shadowing
      vec2 cumUV = baseCloudUV;
      vec2 warp = vec2(vnoise(cumUV * 1.8 + 3.1), vnoise(cumUV * 1.8 + 9.4)) - 0.5;
      float rawDensity = cloudFBM(cumUV + warp * 0.28);
      float thresh = 0.50 - uCloudCoverage * 0.14;
      float cloudAlpha = smoothstep(thresh, thresh + 0.26, rawDensity);

      if (cloudAlpha > 0.005) {
        // Sample density slightly toward the sun for realistic 3D self-shadowing & sunlit rims
        float densityTowardSun = cloudFBM(cumUV + warp * 0.28 + sunDir.xz * 0.12);
        float lightTrans = clamp(1.0 - (densityTowardSun - rawDensity) * 3.2, 0.15, 1.0);
        float billowTop = smoothstep(thresh, thresh + 0.32, rawDensity);

        // Cloud base & lit top colors adapt to day / sunset / night
        float dayLight = clamp(sunDir.y * 2.5 + 0.25, 0.08, 1.0);
        vec3 litCloudCol = mix(uSunGlowColor * 1.05, vec3(0.98, 0.99, 1.0), clamp(sunDir.y * 3.0, 0.0, 1.0));
        vec3 shadowCloudCol = mix(vec3(0.06, 0.10, 0.17), vec3(0.42, 0.53, 0.66), dayLight);

        // Silver-lining forward scatter near the sun (sunDot^6 via multiplication)
        float sd2 = sunDot * sunDot;
        float sd6 = sd2 * sd2 * sd2;
        float silverLining = sd6 * (1.0 - cloudAlpha * 0.65) * 0.55;

        vec3 cloudCol = mix(shadowCloudCol, litCloudCol, clamp(lightTrans * 0.65 + billowTop * 0.45, 0.0, 1.0));
        cloudCol += uSunGlowColor * silverLining * dayLight;

        // Smooth atmospheric fade near the horizon so clouds blend into horizon haze
        float horizonFade = smoothstep(0.015, 0.14, dir.y);
        cloudCol = mix(uHorizonColor, cloudCol, horizonFade);

        col = mix(col, cloudCol, cloudAlpha * horizonFade * 0.92);
      }
    }

    gl_FragColor = vec4(clamp(col, 0.0, 4.0), 1.0);
  }
`;

// ==========================================
// 2. SINGLE-PASS REALISTIC OCEAN SHADER (ZERO MOIRE)
// ==========================================
// Deterministic coastline shape shared between JS Island Builder and GLSL Ocean Lagoon/Surf
export function evaluateIslandCoastMultiplier(angle, seed) {
  return (
    1.0 +
    0.16 * Math.sin(angle * 3.0 + seed * 1.7) +
    0.11 * Math.cos(angle * 5.0 - seed * 2.3) +
    0.06 * Math.sin(angle * 8.0 + seed * 4.1)
  );
}

const OCEAN_VERTEX_SHADER = `
  uniform float uTime;
  uniform vec3 uCameraPos;
  varying vec3 vWorldPos;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vec2 xz = worldPosition.xz;
    // Compute distance in kilometers first so dot() never overflows fp16
    float distKm = length((xz - uCameraPos.xz) * 0.001);

    // Smooth 3D vertex ocean swells near the aircraft (attenuated in the distance for a rock-steady horizon)
    float swellFade = 1.0 - smoothstep(0.4, 3.2, distKm);
    float t = mod(uTime, 62.8318);
    vec2 phase = mod(xz, 628.318);
    float w1 = sin(phase.x * 0.032 + phase.y * 0.018 + t * 1.45) * 1.15;
    float w2 = cos(phase.x * 0.021 - phase.y * 0.039 + t * 1.15) * 0.85;
    float w3 = sin(phase.x * 0.065 + phase.y * 0.052 - t * 1.95) * 0.38;
    worldPosition.y += (w1 + w2 + w3) * swellFade;

    vWorldPos = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const OCEAN_FRAGMENT_SHADER = `
  ${COMMON_ATMOS_GLSL}
  uniform vec3 uCameraPos;
  uniform vec3 uDeepWaterColor;
  uniform vec3 uShallowWaterColor;
  uniform vec3 uCarrierPos;
  uniform vec4 uIslands[6];
  varying vec3 vWorldPos;

  float getCoastMultiplier(float angle, float seed) {
    return 1.0
      + 0.16 * sin(angle * 3.0 + seed * 1.7)
      + 0.11 * cos(angle * 5.0 - seed * 2.3)
      + 0.06 * sin(angle * 8.0 + seed * 4.1);
  }

  void main() {
    // Scale to kilometers before length() so dot(toCamKm, toCamKm) is <= 650 (never overflows fp16!)
    vec3 toCamKm = (uCameraPos - vWorldPos) * 0.001;
    float distKm = length(toCamKm);
    vec3 V = toCamKm / max(distKm, 0.00001);
    vec3 sunDir = normalize(uSunDir);

    // Projected pixel footprint in kilometers on the horizontal water plane:
    // Eliminates 100% of moire / aliasing by attenuating high-frequency waves before they alias!
    float grazing = max(abs(V.y), 0.055);
    float footprintKm = distKm / grazing;

    vec2 p = mod(vWorldPos.xz, 2048.0);
    float t = mod(uTime, 256.0);
    vec2 gradSum = vec2(0.0);
    float waveHeight = 0.0;

    // Octave 1: Primary deep-ocean swell (~140m scale)
    float w1 = 1.0 - smoothstep(2.5, 18.0, footprintKm);
    if (w1 > 0.001) {
      vec2 uv1 = p * 0.024 + vec2(t * 0.32, t * 0.18);
      vec3 n1 = noised2(uv1);
      waveHeight += (n1.x - 0.5) * 1.2 * w1;
      gradSum += n1.yz * 0.24 * w1;
    }

    // Octave 2: Cross-swell (~52m scale, rotated via ROT_OCTAVE)
    float w2 = 1.0 - smoothstep(1.1, 6.5, footprintKm);
    if (w2 > 0.001) {
      vec2 uv2 = (ROT_OCTAVE * p) * 0.068 + vec2(-t * 0.46, t * 0.31);
      vec3 n2 = noised2(uv2);
      waveHeight += (n2.x - 0.5) * 0.65 * w2;
      gradSum += (ROT_OCTAVE * n2.yz) * 0.28 * w2;
    }

    // Octave 3: Wind waves (~21m scale)
    float w3 = 1.0 - smoothstep(0.42, 2.2, footprintKm);
    if (w3 > 0.001) {
      vec2 p3 = ROT_OCTAVE * (ROT_OCTAVE * p);
      vec2 uv3 = p3 * 0.17 + vec2(t * 0.68, -t * 0.52);
      vec3 n3 = noised2(uv3);
      waveHeight += (n3.x - 0.5) * 0.32 * w3;
      gradSum += n3.yz * 0.26 * w3;
    }

    // Octave 4: Short wind chop (~7.5m scale)
    float w4 = 1.0 - smoothstep(0.16, 0.78, footprintKm);
    if (w4 > 0.001) {
      vec2 uv4 = (ROT_OCTAVE * p) * 0.48 + vec2(-t * 1.05, -t * 0.84);
      vec3 n4 = noised2(uv4);
      waveHeight += (n4.x - 0.5) * 0.15 * w4;
      gradSum += n4.yz * 0.22 * w4;
    }

    // Octave 5: Close-range capillary ripples (~2.6m scale)
    float w5 = 1.0 - smoothstep(0.055, 0.26, footprintKm);
    if (w5 > 0.001) {
      vec2 uv5 = p * 1.35 + vec2(t * 1.55, t * 1.25);
      vec3 n5 = noised2(uv5);
      gradSum += n5.yz * 0.16 * w5;
    }

    vec3 N = normalize(vec3(-gradSum.x, 1.0, -gradSum.y));

    // ==========================================
    // ISLAND CORAL LAGOON & BREAKING WHITE SURF
    // ==========================================
    float minShoreDist = 1000.0;
    for (int i = 0; i < 6; i++) {
      vec2 dVecKm = (vWorldPos.xz - uIslands[i].xy) * 0.001;
      float rKm = length(dVecKm);
      float baseRadiusKm = uIslands[i].z * 0.001;
      if (rKm < baseRadiusKm * 1.75) {
        float ang = atan(dVecKm.y, dVecKm.x);
        float seed = float(i) + 1.0;
        float coastRKm = baseRadiusKm * getCoastMultiplier(ang, seed);
        float sDist = (rKm - coastRKm) * 1000.0;
        minShoreDist = min(minShoreDist, sDist);
      }
    }

    // Lagoon shallow factor (0 = deep ocean, 1 = shallow sandy beach edge)
    float lagoonFactor = 1.0 - smoothstep(-10.0, 210.0, minShoreDist);
    // Breaking white surf rings washing onto island beaches
    float surfZone = (1.0 - smoothstep(-6.0, 58.0, minShoreDist)) * smoothstep(-18.0, -2.0, minShoreDist);
    float surfWavePattern = sin(minShoreDist * 0.34 + t * 2.8 + waveHeight * 2.5);
    float surfFoam = surfZone * smoothstep(0.15, 0.85, surfWavePattern) * (0.65 + 0.35 * (1.0 - smoothstep(0.0, 22.0, minShoreDist)));

    // ==========================================
    // AIRCRAFT CARRIER KELVIN V-WAKE & PROP WASH
    // ==========================================
    vec2 relCarrier = vWorldPos.xz - uCarrierPos.xz;
    float wakeFoam = 0.0;
    float wakeTurquoise = 0.0;
    if (abs(relCarrier.x) < 220.0 && relCarrier.y > -120.0 && relCarrier.y < 680.0) {
      float aftProgress = clamp((relCarrier.y + 120.0) / 800.0, 0.0, 1.0);
      float wakeHalfWidth = mix(10.0, 44.0, aftProgress);
      float propWash = 1.0 - smoothstep(wakeHalfWidth * 0.35, wakeHalfWidth, abs(relCarrier.x));
      float fadeAft = (1.0 - aftProgress) * smoothstep(-120.0, -40.0, relCarrier.y);
      float wakeNoise = vnoise(p * 0.18 + vec2(0.0, -t * 2.2));
      wakeTurquoise = propWash * fadeAft * 0.75;
      wakeFoam = propWash * fadeAft * smoothstep(0.32, 0.78, wakeNoise) * 0.72;

      // Bow V-wake arms
      float bowZ = relCarrier.y + 135.0;
      if (bowZ > 0.0 && bowZ < 520.0) {
        float vArmX = bowZ * 0.24 + 8.0;
        float vDist = abs(abs(relCarrier.x) - vArmX);
        float vLine = (1.0 - smoothstep(1.5, 9.5, vDist)) * (1.0 - bowZ / 520.0);
        wakeFoam = max(wakeFoam, vLine * 0.55);
      }
    }

    // ==========================================
    // WATER COLOR, SUBSURFACE SCATTERING & FOAM
    // ==========================================
    float dayLight = clamp(sunDir.y * 2.4 + 0.28, 0.08, 1.0);

    // Crest subsurface scattering (emerald-teal glow when sunlight passes through wave peaks)
    float backScatter = clamp(dot(V, -sunDir) * 0.5 + 0.5, 0.0, 1.0);
    float crestSSS = clamp(waveHeight * 0.55 + 0.25, 0.0, 1.0) * (backScatter * backScatter);
    vec3 waterBodyColor = mix(uDeepWaterColor, uShallowWaterColor, crestSSS * 0.55);

    // Blend in tropical turquoise lagoon around islands & carrier prop wash
    vec3 lagoonColor = vec3(0.07, 0.62, 0.72) * dayLight;
    vec3 beachEdgeAqua = vec3(0.26, 0.82, 0.84) * dayLight;
    float lf3 = lagoonFactor * lagoonFactor * lagoonFactor;
    waterBodyColor = mix(waterBodyColor, lagoonColor, lagoonFactor * 0.78);
    waterBodyColor = mix(waterBodyColor, beachEdgeAqua, lf3 * 0.65);
    waterBodyColor = mix(waterBodyColor, lagoonColor * 0.9, wakeTurquoise);

    // Diffuse sun illumination on wave slopes
    float NdotL = max(dot(N, sunDir), 0.0);
    waterBodyColor *= (0.58 + 0.42 * NdotL);

    // True physical water Fresnel (F0 = 0.02 so water looks rich blue, NOT a grey mirror!)
    float NdotV = clamp(dot(N, V), 0.0, 1.0);
    float oneMinusNV = 1.0 - NdotV;
    float om2 = oneMinusNV * oneMinusNV;
    float fresnel = 0.02 + 0.98 * (om2 * om2 * oneMinusNV);
    // Reduce Fresnel mirror factor slightly at ultra-long distance so ocean retains deep blue tint
    fresnel *= mix(0.85, 0.58, smoothstep(0.8, 9.0, distKm));

    vec3 R = reflect(-V, N);
    R.y = max(R.y, 0.01); // Always reflect upper sky hemisphere
    vec3 skyReflect = computeBaseSkyColor(normalize(R)) * 0.92;

    vec3 surfaceCol = mix(waterBodyColor, skyReflect, fresnel);

    // ==========================================
    // DUAL-LOBE SUN GLITTER PATH (ANTI-ALIASED)
    // ==========================================
    vec3 H = normalize(sunDir + V);
    float NdotH = max(dot(N, H), 0.0001);
    float specPowerTight = mix(220.0, 75.0, smoothstep(0.3, 7.0, distKm));
    float specTight = pow(NdotH, specPowerTight) * 1.65;
    float specBroad = pow(NdotH, 22.0) * 0.22;
    float sunAboveHorizon = smoothstep(-0.02, 0.08, sunDir.y);
    surfaceCol += uSunGlowColor * (specTight + specBroad) * sunAboveHorizon * clamp(uSunIntensity * 0.42, 0.0, 1.4);

    // Open-ocean whitecap foam on high wave crests + island surf + carrier wake
    float openWhitecap = smoothstep(0.62, 1.05, waveHeight) * (1.0 - smoothstep(0.25, 2.4, distKm)) * 0.45;
    float totalFoam = clamp(max(openWhitecap, max(surfFoam, wakeFoam)), 0.0, 1.0);
    vec3 foamColor = vec3(0.94, 0.97, 1.0) * dayLight;
    surfaceCol = mix(surfaceCol, foamColor, totalFoam);

    // ==========================================
    // SEAMLESS HORIZON & AERIAL PERSPECTIVE BLEND
    // ==========================================
    vec3 viewRay = -V;
    vec3 horizonSkyCol = computeBaseSkyColor(vec3(viewRay.x, max(viewRay.y, 0.002), viewRay.z));
    float fogFactor = 1.0 - exp(-0.085 * distKm);
    float horizonEdge = smoothstep(7.5, 16.5, distKm);
    surfaceCol = mix(surfaceCol, horizonSkyCol, clamp(fogFactor * 0.72 + horizonEdge, 0.0, 1.0));

    gl_FragColor = vec4(clamp(surfaceCol, 0.0, 4.0), 1.0);
  }
`;

// ==========================================
// 3. REALISTIC VOLCANIC ISLAND TERRAIN SHADER
// ==========================================
const ISLAND_VERTEX_SHADER = `
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPosition.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const ISLAND_FRAGMENT_SHADER = `
  ${COMMON_ATMOS_GLSL}
  uniform vec3 uCameraPos;
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;

  void main() {
    // Discard underwater skirt below -1.5m so ocean surface handles the lagoon cleanly
    if (vWorldPos.y < -1.5) {
      discard;
    }

    vec3 sunDir = normalize(uSunDir);
    // Compute distance in kilometers to avoid fp16 dot() overflow
    vec3 toCamKm = (uCameraPos - vWorldPos) * 0.001;
    float distKm = length(toCamKm);
    vec3 V = toCamKm / max(distKm, 0.00001);

    // Multi-scale world-space procedural detail (wrapped into safe UV range)
    vec2 wp = mod(vWorldPos.xz, 1024.0);
    vec3 detail1 = noised2(wp * 0.045);
    vec3 detail2 = noised2((ROT_OCTAVE * wp) * 0.16);
    float micro = vnoise(wp * 0.65);

    // Perturb terrain normal with fine canopy / cliff rock bump detail
    float detailFade = 1.0 - smoothstep(0.35, 3.2, distKm);
    vec3 bumpOffset = vec3(
      (detail1.y * 0.14 + detail2.y * 0.12) * detailFade,
      0.0,
      (detail1.z * 0.14 + detail2.z * 0.12) * detailFade
    );
    vec3 N = normalize(vWorldNormal + bumpOffset);

    float alt = vWorldPos.y + (detail1.x - 0.5) * 6.5;
    float slope = clamp(N.y, 0.0, 1.0); // 1.0 = flat ground, 0.0 = vertical cliff

    // 1. Wet & Dry Coral Beach Sand (0m - 16m)
    vec3 wetSand = vec3(0.48, 0.42, 0.32);
    vec3 drySand = mix(vec3(0.82, 0.75, 0.58), vec3(0.90, 0.84, 0.68), micro);
    float wetFactor = 1.0 - smoothstep(0.5, 4.2, vWorldPos.y);
    vec3 beachColor = mix(drySand, wetSand, wetFactor);

    // 2. Lush Tropical Rainforest Canopy (dappled multi-species greens)
    vec3 deepJungle = vec3(0.08, 0.24, 0.10);
    vec3 midCanopy = vec3(0.16, 0.36, 0.15);
    vec3 sunlitCrown = vec3(0.28, 0.47, 0.18);
    vec3 jungleColor = mix(deepJungle, midCanopy, detail1.x);
    jungleColor = mix(jungleColor, sunlitCrown, smoothstep(0.45, 0.82, detail2.x) * (0.5 + 0.5 * micro));

    // 3. Stratified Volcanic Basalt Cliff Rock & Summit Ridges
    float strata = 0.5 + 0.5 * sin(vWorldPos.y * 0.42 + detail1.x * 5.0);
    vec3 darkBasalt = vec3(0.22, 0.23, 0.26);
    vec3 warmRock = vec3(0.38, 0.35, 0.31);
    vec3 cliffColor = mix(darkBasalt, warmRock, strata * 0.65 + (micro - 0.5) * 0.25);

    // Biome blending by altitude and slope
    float beachToForest = smoothstep(8.0, 19.0, alt);
    vec3 albedo = mix(beachColor, jungleColor, beachToForest);

    // Steep slopes and high rocky summits expose volcanic cliff rock
    float cliffBySlope = 1.0 - smoothstep(0.52, 0.74, slope);
    float cliffBySummit = smoothstep(155.0, 245.0, alt);
    float rockMask = clamp(max(cliffBySlope * smoothstep(4.0, 14.0, vWorldPos.y), cliffBySummit * 0.82), 0.0, 1.0);
    albedo = mix(albedo, cliffColor, rockMask);

    // Directional Sunlight + Sky Hemisphere Ambient + Subtle Indirect Bounce
    float dayLight = clamp(sunDir.y * 2.4 + 0.25, 0.08, 1.0);
    float NdotL = max(dot(N, sunDir), 0.0);
    float wrapDiffuse = max(0.0, (dot(N, sunDir) + 0.18) / 1.18);
    float diff = mix(wrapDiffuse, NdotL, rockMask);

    vec3 sunCol = mix(uSunGlowColor, vec3(1.0, 0.97, 0.90), clamp(sunDir.y * 2.0, 0.0, 1.0));
    vec3 skyAmbient = mix(vec3(0.10, 0.15, 0.24), uMidSkyColor * 0.48, clamp(0.5 + 0.5 * N.y, 0.0, 1.0)) * dayLight;

    vec3 litColor = albedo * (skyAmbient + sunCol * diff * clamp(uSunIntensity * 0.38, 0.1, 1.15));

    // Wet shoreline specular glint
    if (wetFactor > 0.05) {
      vec3 H = normalize(sunDir + V);
      float wetSpec = pow(max(dot(N, H), 0.0001), 48.0) * wetFactor * 0.35 * dayLight;
      litColor += sunCol * wetSpec;
    }

    // Seamless Aerial Perspective (matches Sky & Ocean horizon haze)
    vec3 viewRay = -V;
    vec3 aerialHaze = computeBaseSkyColor(vec3(viewRay.x, max(viewRay.y, 0.01), viewRay.z));
    float hazeAmount = 1.0 - exp(-0.11 * distKm);
    litColor = mix(litColor, aerialHaze, clamp(hazeAmount * 0.85, 0.0, 0.92));

    gl_FragColor = vec4(clamp(litColor, 0.0, 4.0), 1.0);
  }
`;

// ==========================================
// PROCEDURAL ISLAND HEIGHTFIELD GENERATOR (CPU)
// ==========================================
function fract(x) {
  return x - Math.floor(x);
}

function hash2D(ix, iz) {
  const n = Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453123;
  return fract(n);
}

function smoothNoise2D(x, z) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const ux = fx * fx * (3.0 - 2.0 * fx);
  const uz = fz * fz * (3.0 - 2.0 * fz);

  const a = hash2D(ix, iz);
  const b = hash2D(ix + 1, iz);
  const c = hash2D(ix, iz + 1);
  const d = hash2D(ix + 1, iz + 1);

  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

function ridgedFBM(x, z) {
  let sum = 0.0;
  let amp = 0.52;
  let freq = 1.0;
  for (let i = 0; i < 4; i++) {
    const n = smoothNoise2D(x * freq, z * freq);
    // Ridged multifractal fold creates natural volcanic mountain spines & gullies
    const ridge = 1.0 - Math.abs(2.0 * n - 1.0);
    sum += ridge * ridge * amp;
    const nx = x * 0.8 - z * 0.6;
    const nz = x * 0.6 + z * 0.8;
    x = nx + 17.3;
    z = nz + 31.7;
    freq *= 2.05;
    amp *= 0.48;
  }
  return sum;
}

function createErodedVolcanicIslandMesh(ix, iz, baseRadius, maxHeight, seed, islandMaterial) {
  const segments = 88;
  const span = baseRadius * 2.45;
  const geo = new THREE.PlaneGeometry(span, span, segments, segments);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const lx = pos.getX(i);
    const lz = pos.getZ(i);
    const r = Math.hypot(lx, lz);
    const angle = Math.atan2(lz, lx);

    const coastR = baseRadius * evaluateIslandCoastMultiplier(angle, seed);
    const normR = r / coastR;

    let vy = -6.0;
    if (normR < 1.04) {
      // Smooth coastal profile from shoreline (normR = 1.0) to interior summit
      const inland = Math.max(0.0, 1.0 - normR);
      // Gentle sandy beach bench near the water, rising into steep volcanic ridges inland
      const beachShelf = Math.min(1.0, inland / 0.14) * 12.0;
      const mountainCore = Math.pow(Math.max(0.0, (inland - 0.08) / 0.92), 1.55);

      // Multi-peak volcanic ridge + radial erosion gullies
      const wx = (ix + lx) * 0.0032 + seed * 5.0;
      const wz = (iz + lz) * 0.0032 + seed * 9.0;
      const ridgeVal = ridgedFBM(wx, wz);
      const radialGullies =
        0.82 +
        0.18 * Math.sin(angle * 6.0 + ridgeVal * 3.5 + seed) * Math.min(1.0, normR * 1.4);

      vy = beachShelf + mountainCore * maxHeight * (0.48 + 0.68 * ridgeVal) * radialGullies;

      // Underwater shoreline slope between normR = 1.0 and 1.04
      if (normR > 1.0) {
        const subT = (normR - 1.0) / 0.04;
        vy = -subT * 6.0;
      }
    }

    pos.setY(i, vy);
  }

  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, islandMaterial);
  mesh.position.set(ix, 0, iz);
  return mesh;
}

// ==========================================
// MAIN ENVIRONMENT SYSTEM FACTORY
// ==========================================
export const ISLAND_DEFINITIONS = [
  { x: -2500, z: -2100, radius: 560, height: 310 },
  { x: 2800, z: -1750, radius: 660, height: 360 },
  { x: -2100, z: 2550, radius: 490, height: 260 },
  { x: 2450, z: 2350, radius: 580, height: 330 },
  { x: -3800, z: 400, radius: 720, height: 390 },
  { x: 3900, z: 650, radius: 620, height: 340 }
];

export function createRealisticEnvironment(scene) {
  // Shared uniform value holders across Sky, Ocean, and Islands so lighting & horizon always match 100%
  const sharedUniforms = {
    uTime: { value: 0 },
    uCameraPos: { value: new THREE.Vector3(0, 25, 80) },
    uSunDir: { value: new THREE.Vector3(0.45, 0.42, -0.78).normalize() },
    uZenithColor: { value: new THREE.Color(0x0b2e63) },
    uMidSkyColor: { value: new THREE.Color(0x2768b5) },
    uHorizonColor: { value: new THREE.Color(0x9acbf0) },
    uSunGlowColor: { value: new THREE.Color(0xfff0d4) },
    uSunIntensity: { value: 2.6 },
    uCloudCoverage: { value: 0.48 },
    uNightFactor: { value: 0.0 },
    uDeepWaterColor: { value: new THREE.Color(0x031d3c) },
    uShallowWaterColor: { value: new THREE.Color(0x0a6c7e) },
    uCarrierPos: { value: new THREE.Vector3(0, 0, 0) },
    uIslands: {
      value: ISLAND_DEFINITIONS.map(
        (isl) => new THREE.Vector4(isl.x, isl.z, isl.radius, isl.height)
      )
    }
  };

  scene.background = new THREE.Color(0x2768b5);

  // 1. Sky Dome Mesh (depthTest: false & renderOrder: -1000 so it always paints the background cleanly)
  const skyGeo = new THREE.SphereGeometry(10000, 48, 32);
  const skyMat = new THREE.ShaderMaterial({
    vertexShader: SKY_VERTEX_SHADER,
    fragmentShader: SKY_FRAGMENT_SHADER,
    uniforms: sharedUniforms,
    side: THREE.BackSide,
    depthTest: false,
    depthWrite: false,
    toneMapped: false
  });
  const skyMesh = new THREE.Mesh(skyGeo, skyMat);
  skyMesh.frustumCulled = false;
  skyMesh.renderOrder = -1000;
  scene.add(skyMesh);

  // 2. Single-Pass Anti-Moire Ocean Mesh
  // Grid step = 36000 / 180 = 200m (snapped to 200m in update() so vertices never swim!)
  const oceanGeo = new THREE.PlaneGeometry(36000, 36000, 180, 180);
  oceanGeo.rotateX(-Math.PI / 2);
  const oceanMat = new THREE.ShaderMaterial({
    vertexShader: OCEAN_VERTEX_SHADER,
    fragmentShader: OCEAN_FRAGMENT_SHADER,
    uniforms: sharedUniforms,
    toneMapped: false
  });
  const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
  oceanMesh.frustumCulled = false;
  scene.add(oceanMesh);

  // 3. Volcanic Archipelago Islands
  const environmentGroup = new THREE.Group();
  scene.add(environmentGroup);

  const islandMat = new THREE.ShaderMaterial({
    vertexShader: ISLAND_VERTEX_SHADER,
    fragmentShader: ISLAND_FRAGMENT_SHADER,
    uniforms: sharedUniforms,
    toneMapped: false
  });

  ISLAND_DEFINITIONS.forEach((isl, idx) => {
    const islandMesh = createErodedVolcanicIslandMesh(
      isl.x,
      isl.z,
      isl.radius,
      isl.height,
      idx + 1,
      islandMat
    );
    environmentGroup.add(islandMesh);
  });

  function setAtmosphere({
    sunElevation = 24,
    sunAzimuth = 145,
    turbidity = 3.5,
    fogDensity = 0.00009,
    waterColor = 0x002b4d,
    sunIntensity = 2.6
  }) {
    const phi = THREE.MathUtils.degToRad(90 - sunElevation);
    const theta = THREE.MathUtils.degToRad(sunAzimuth);
    const sunVec = new THREE.Vector3().setFromSphericalCoords(1, phi, theta).normalize();
    sharedUniforms.uSunDir.value.copy(sunVec);
    sharedUniforms.uSunIntensity.value = sunIntensity;

    // Determine time-of-day palette (Day vs Sunset vs Night)
    if (sunElevation < 0) {
      // Stage 5: Night & Fog Instrument Trap
      sharedUniforms.uZenithColor.value.setHex(0x02060f);
      sharedUniforms.uMidSkyColor.value.setHex(0x061224);
      sharedUniforms.uHorizonColor.value.setHex(0x0b1d33);
      sharedUniforms.uSunGlowColor.value.setHex(0x3a6088);
      sharedUniforms.uDeepWaterColor.value.setHex(0x010711);
      sharedUniforms.uShallowWaterColor.value.setHex(0x052538);
      sharedUniforms.uCloudCoverage.value = 0.62;
      sharedUniforms.uNightFactor.value = 1.0;
    } else if (sunElevation < 8) {
      // Stage 4: Top Gun Golden Hour / Sunset Heavy Seas
      sharedUniforms.uZenithColor.value.setHex(0x162247);
      sharedUniforms.uMidSkyColor.value.setHex(0x6e4763);
      sharedUniforms.uHorizonColor.value.setHex(0xe87a42);
      sharedUniforms.uSunGlowColor.value.setHex(0xff9442);
      sharedUniforms.uDeepWaterColor.value.setHex(0x071a2e);
      sharedUniforms.uShallowWaterColor.value.setHex(0x145263);
      sharedUniforms.uCloudCoverage.value = 0.56;
      sharedUniforms.uNightFactor.value = 0.15;
    } else {
      // Crisp Pacific Daylight (Stages 1, 2, 3 & Combat)
      const hazeMix = THREE.MathUtils.clamp((turbidity - 2.5) * 0.12, 0.0, 0.35);
      sharedUniforms.uZenithColor.value.setHex(0x0a2d63).lerp(new THREE.Color(0x1a467a), hazeMix);
      sharedUniforms.uMidSkyColor.value.setHex(0x2568b8).lerp(new THREE.Color(0x3e7bc2), hazeMix);
      sharedUniforms.uHorizonColor.value.setHex(0x98ccf2).lerp(new THREE.Color(0xb0d6f0), hazeMix);
      sharedUniforms.uSunGlowColor.value.setHex(0xfff2d6);
      sharedUniforms.uDeepWaterColor.value.setHex(waterColor || 0x031d3c);
      sharedUniforms.uShallowWaterColor.value.setHex(0x0a6e80);
      sharedUniforms.uCloudCoverage.value = 0.45 + hazeMix * 0.25;
      sharedUniforms.uNightFactor.value = 0.0;
    }

    if (scene.background) {
      scene.background.copy(sharedUniforms.uHorizonColor.value);
    }

    if (scene.fog) {
      scene.fog.color.copy(sharedUniforms.uHorizonColor.value);
      scene.fog.density = fogDensity * 0.55;
    }

    return sunVec;
  }

  function update(dt, cameraPos, carrierPos) {
    sharedUniforms.uTime.value += dt;
    sharedUniforms.uCameraPos.value.copy(cameraPos);
    if (carrierPos) {
      sharedUniforms.uCarrierPos.value.copy(carrierPos);
    }

    // Keep Sky Dome centered on camera
    skyMesh.position.copy(cameraPos);

    // Keep Ocean Mesh snapped to its 200m vertex grid step around the camera so vertices never swim
    oceanMesh.position.x = Math.floor(cameraPos.x / 200) * 200;
    oceanMesh.position.z = Math.floor(cameraPos.z / 200) * 200;
  }

  return {
    skyMesh,
    oceanMesh,
    environmentGroup,
    setAtmosphere,
    update
  };
}
