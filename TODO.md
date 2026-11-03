# TAILHOOK ACES — Project Status & Future Roadmap (`TODO.md`)

**Live URL:** [https://tailhookaces.netlify.app/](https://tailhookaces.netlify.app/)  
**Repository:** `Darrenswift/tailhook-aces` (`main` branch)  
**Target Platform:** Chrome on Chromebook / Linux / Desktop (60 FPS Single-Pass WebGL)

---

## 1. Completed Features (`[x]`)

### ✈️ Playable Fighter Aircraft Fleet (9 Jets in [`src/jets.js`](./src/jets.js))
- [x] **F/A-18E Super Hornet (`f18`)** — Maverick's *Top Gun* blue-and-black special livery, centerline drop tank, 8× AIM-9X & 6× JDAMs.
- [x] **F-14D Super Tomcat (`f14`)** — VF-1 Wolfpack Maverick & Goose livery, 2-seat tandem cockpit, automatic variable-sweep wings, Mach 2.3+ afterburners, 10× AIM-54 Phoenix & 6× Bombcat JDAMs.
- [x] **Lockheed Martin F-22A Raptor (`f22`)** — 5th-gen metallic titanium stealth skin, diamond delta wings, rectangular 2D thrust-vectoring nozzles, gold RAM canopy, 0.70s instant radar lock.
- [x] **Sukhoi Su-57 Felon (`su57`)** — *Top Gun: Maverick* adversary with digital splinter shark camo, central tail sting boom, extreme 3D thrust-vectoring pitch/roll authority, 8× R-77M & 6× KAB-500 bombs.
- [x] **Boeing F-15EX Eagle II (`f15ex`)** — Undefeated Mach 2.5 "Bomb Truck" with upright twin tails and the heaviest payload in the game (**12× air-to-air missiles + 8× 2,000-lb JDAM bombs**).
- [x] **Eurofighter Typhoon FGR4 (`typhoon`)** — RAF No. 1 Squadron bullseye roundels, **animated forward canard foreplanes**, tail-less delta wing, single tall vertical fin & fastest roll rate in the sky.
- [x] **Sukhoi Su-35S Flanker-E (`su35`)** — Three-tone Russian Knights azure sky camouflage, white radome, central tail sting boom, high-AoA maneuverability, 10× R-77 missiles & 6× bombs.
- [x] **Chengdu J-20 Mighty Dragon (`j20`)** — Dark graphite 5th-gen stealth interceptor with **animated forward stealth canards**, clipped delta wings, canted twin V-tails, 10× PL-15 missiles & 6× bombs.
- [x] **F-35C Lightning II (`f35`)** — Carrier stealth strike fighter with gold RAM canopy, chined fuselage, 8× AIM-9X & 6× internal JDAMs.

---

### 💣 Air-to-Ground Bombing System & 3 Strike Missions ([`src/main.js`](./src/main.js))
- [x] **HUD CCIP Bombing Pipper & 2,000-lb GBU-31 JDAMs (`[V]` Key)** — Real-time ballistic ground impact calculation (`computeBombImpactPoint`), dashed HUD bomb fall line + circular impact pipper that turns red (`DROP JDAM [V]!`) over targets, terminal GPS/Laser bomb guidance, and 95m blast radius.
- [x] **Strike 1: Maverick Canyon Bunker Run** — Fly below the **850 FT radar ceiling** (busting the ceiling triggers enemy SAM launches), bomb the fortified Uranium Reactor Bunker + flanking SAMs, then splash **2 scrambling Su-57 Felon interceptors** on exfil.
- [x] **Strike 2: Island SEAD & SAM Suppression** — Destroy **6 fortified island ground targets** (2 Geodesic Early-Warning Radar Domes, 2 firing S-400 SAM Batteries, and 2 Fuel/Munitions Depots) while dogfighting defending MiG-28s.
- [x] **Strike 3: Crimson Fleet Naval Strike** — Sink a moving 4-ship enemy naval task force (**Battlecruiser Kirov + 3 Guided-Missile Destroyers**) steaming south under Su-35 Flanker escort.

---

### 🎮 Special Operations & Arcade Missions ([`src/main.js`](./src/main.js))
- [x] **Op 1: Mach 10 Canyon Ring Time-Trial** — Blast through **16 glowing holographic Sky Gates** curving past the carrier tower and around the volcanic islands with speed-boost chimes (`GOLD MACH 10 ★` under 65s).
- [x] **Op 2: Defend the Fleet (Carrier Escort)** — Intercept **3 waves of heavy Tu-22M Backfire strike bombers** and Su-57 escorts before their anti-ship missiles sink `USS Nimitz (CVN-68)`.
- [x] **Op 3: Maverick & Rooster Wingman Sortie + Carrier Trap** — Dogfight the 6-plane Crimson Ace Squadron alongside **AI Wingman `ROOSTER`** (who flies on your wing and fires support missiles), then **lower gear (`[L]`) and trap on the carrier deck** to finish the mission.

---

### ⚓ 10-Stage Carrier Landing Qualification Ladder ([`src/main.js`](./src/main.js))
- [x] **Stage 1: Straight-In Calm Day** — 3.5 NM final approach, calm seas, clear sky.
- [x] **Stage 2: Moving Deck & Crosswind** — 22 KT crosswind & steaming carrier.
- [x] **Stage 3: Case I Overhead Break** — Pass carrier bow at 800 FT / 350 KTS, execute 180° left break turn onto downwind, drop gear & trap.
- [x] **Stage 4: Sunset Heavy Seas** — Pitching flight deck & golden-hour turbulence.
- [x] **Stage 5: Night & Fog Instrument Trap** — Low visibility night recovery with illuminated deck & HUD guidance.
- [x] **Stage 6: Single-Engine Flameout Emergency** — Starboard engine out with trailing black smoke, capped thrust (`76%`), and continuous asymmetric right yaw/roll pull countered with Left Rudder (`[A]`).
- [x] **Stage 7: "Cobra" High-Speed Short-Field Trap** — Hot 275 KT entry at 1.1 NM with gear up; pitch up into a high-AoA Cobra airbrake to bleed below 190 KTS, drop gear (`[L]`), and trap.
- [x] **Stage 8: Typhoon Cyclone & Gusting Squall** — 38 KT shifting wind shear & violently pitching deck in storm conditions.
- [x] **Stage 9: "Broken Meatball" LSO Talk-Down** — Optical IFLOLS Meatball and sky glide-slope boxes knocked out; pure LSO Paddles voice talk-down every 2.4 seconds.
- [x] **Stage 10: Evasive S-Turning Carrier** — `CVN-68` steaming at 28 KTS while executing continuous evasive S-turns; carrier-local coordinate transformation tracks the rotating angled deck.

---

### 🌊 3D Graphics, Audio & UI Polish ([`src/environment.js`](./src/environment.js), [`src/audio.js`](./src/audio.js), [`index.html`](./index.html))
- [x] **Chromebook & Linux GPU Compatibility** — Single-pass custom GLSL Gerstner wave ocean shader & atmospheric Rayleigh/Mie sky dome (zero multi-pass RTT framebuffer dependencies).
- [x] **Top Gun Audio System** — Synthesized 80s *Top Gun Anthem* & *Danger Zone* music sequencer (`[B]`), jet turbine/afterburner rumble, AIM-9 seeker growl, bomb whistle, and Web Speech API radio callouts (`LSO PADDLES`, `TOPGUN MAVERICK`, `WINGMAN ROOSTER`, `AWACS SKYEYE`).
- [x] **Hangar Mission Category Filter Tabs** — Filter missions by `ALL`, `BOMBING (3)`, `SPECIAL OPS (3)`, or `CARRIER (10)` with persistent local save data (`localStorage`).

---

## 2. Next Up / Ideas for Future Sessions (`[ ]`)

When we pick this project back up, here are great next features to build:

- [ ] **Steam Catapult Launch Sequence**
  - Start missions parked on Catapult #1 on the `CVN-68` flight deck with blast deflector raised, steam particles billowing across the bow, pilot salute (`[SPACE]` to launch), and a 2.5-second 0-to-170 KT catapult shot!
- [ ] **Mid-Air Refueling Challenge (Tanker Probe-and-Drogue)**
  - Add a new Special Op where you match speed and altitude behind a KC-130 tanker aircraft and guide your nose refueling probe into the basket under light turbulence.
- [ ] **Gamepad / USB Flight Stick Support (HTML5 Gamepad API)**
  - Add plug-and-play support for Xbox, PlayStation, or USB joysticks on Chromebook so pitch, roll, throttle, guns, missiles, and bombs work directly from controller thumbsticks and triggers.
- [ ] **More Legendary Aircraft**
  - **A-10C Thunderbolt II ("Warthog")** — Heavy armor, 30mm GAU-8 Avenger `BRRRT` rotary cannon, and 12× air-to-ground bombs/Mavericks.
  - **SR-72 Darkstar (Hypersonic Concept)** — Mach 5+ scramjet plasma trail from *Top Gun: Maverick*.
  - **Dassault Rafale M** — French Navy carrier-borne omnirole delta-canard fighter.
- [ ] **Custom Ordnance Loadout & Livery Painter in Hangar**
  - Let the pilot customize their wing pylons (e.g., Heavy Bomb Loadout vs. All-Missile Dogfight Loadout) and pick custom squadron colors in the hangar.
- [ ] **2-Player Split-Screen / Co-Op Mode**
  - Local 2-player mode (Keyboard vs. Controller) to fly co-op wingman missions or 1v1 Top Gun dogfights together!

---

## 3. Quick Development Reference

```bash
# Start local Vite dev server (http://127.0.0.1:5173)
npm run dev

# Build production bundle into dist/
npm run build
```

### Key Files
- [`index.html`](./index.html) — Hangar UI, 9 aircraft cards, mission category tabs, HUD telemetry overlays.
- [`index.css`](./index.css) — Tactical aviation styling, responsive layout, HUD animations.
- [`src/main.js`](./src/main.js) — Flight physics, 4 mission modes, 10 carrier stages, CCIP bombing pipper, 2D HUD canvas renderer.
- [`src/jets.js`](./src/jets.js) — `JET_CONFIGS` (9 jets), 3D aircraft mesh builder (`createJetMesh`), 3D strike/ring target builder (`createStrikeTargetMesh`), and `CVN-68` carrier builder (`createCarrierGroup`).
- [`src/environment.js`](./src/environment.js) — Single-pass GLSL Gerstner ocean shader, atmospheric sky dome, volumetric clouds, and 5 volcanic islands.
- [`src/audio.js`](./src/audio.js) — Web Audio API synthesizer (*Top Gun Anthem*, *Danger Zone*, jet engine, weapons, radio speech).
