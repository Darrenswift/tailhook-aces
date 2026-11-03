// Synthesized Web Audio API Jet Engine, Weapons, Seeker Tones & Radio Callouts

export class SoundSystem {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.engineGain = null;
    this.turbineOsc = null;
    this.rumbleSource = null;
    this.rumbleFilter = null;
    this.seekerOsc = null;
    this.seekerGain = null;
    this.lastRadioTime = 0;
    this.radioTimeoutId = null;
    this.lastWarningBeep = 0;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();

    // Create white noise buffer for jet rumble, afterburner, and explosions
    const bufferSize = this.ctx.sampleRate * 2;
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    // Continuous Jet Engine Rumble + Turbine Whine
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0.0;
    this.engineGain.connect(this.ctx.destination);

    this.rumbleSource = this.ctx.createBufferSource();
    this.rumbleSource.buffer = this.noiseBuffer;
    this.rumbleSource.loop = true;

    this.rumbleFilter = this.ctx.createBiquadFilter();
    this.rumbleFilter.type = 'lowpass';
    this.rumbleFilter.frequency.value = 180;

    this.rumbleSource.connect(this.rumbleFilter);
    this.rumbleFilter.connect(this.engineGain);
    this.rumbleSource.start();

    this.turbineOsc = this.ctx.createOscillator();
    this.turbineOsc.type = 'sawtooth';
    this.turbineOsc.frequency.value = 110;

    this.turbineGain = this.ctx.createGain();
    this.turbineGain.gain.value = 0.04;

    this.turbineOsc.connect(this.turbineGain);
    this.turbineGain.connect(this.engineGain);
    this.turbineOsc.start();

    // AIM-9 Sidewinder Seeker Tone Oscillator
    this.seekerOsc = this.ctx.createOscillator();
    this.seekerOsc.type = 'square';
    this.seekerOsc.frequency.value = 380;

    this.seekerGain = this.ctx.createGain();
    this.seekerGain.gain.value = 0.0;

    this.seekerOsc.connect(this.seekerGain);
    this.seekerGain.connect(this.ctx.destination);
    this.seekerOsc.start();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      if (this.engineGain && this.ctx) {
        this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      }
      if (this.seekerGain && this.ctx) {
        this.seekerGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
    return this.muted;
  }

  updateEngine(throttle, activeFlight) {
    if (!this.ctx || !this.engineGain) return;
    if (this.muted || !activeFlight) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
      return;
    }

    const clamped = Math.max(0, Math.min(1.2, throttle));
    const isAfterburner = clamped > 0.88;
    const baseVolume = 0.07 + clamped * 0.12 + (isAfterburner ? 0.08 : 0);
    const filterFreq = 140 + clamped * 380 + (isAfterburner ? 320 : 0);
    const turbineFreq = 95 + clamped * 210;

    this.engineGain.gain.setTargetAtTime(baseVolume, this.ctx.currentTime, 0.08);
    this.rumbleFilter.frequency.setTargetAtTime(filterFreq, this.ctx.currentTime, 0.08);
    this.turbineOsc.frequency.setTargetAtTime(turbineFreq, this.ctx.currentTime, 0.08);
  }

  updateSeekerTone(state) {
    // state: 'off' | 'seeking' | 'locked'
    if (!this.ctx || !this.seekerGain) return;
    if (this.muted || state === 'off') {
      this.seekerGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.04);
      return;
    }

    const now = this.ctx.currentTime;
    if (state === 'seeking') {
      // Classic Sidewinder growl
      const flutter = 260 + Math.sin(performance.now() * 0.045) * 55;
      this.seekerOsc.frequency.setValueAtTime(flutter, now);
      this.seekerGain.gain.setTargetAtTime(0.025, now, 0.03);
    } else if (state === 'locked') {
      // High steady lock tone
      this.seekerOsc.frequency.setValueAtTime(880, now);
      this.seekerGain.gain.setTargetAtTime(0.045, now, 0.02);
    }
  }

  playGunShot() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(145, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.055);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  playMissileLaunch() {
    if (this.muted || !this.ctx || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;

    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(320, now + 0.65);
    filter.Q.value = 1.8;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.26, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.65);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(now);
    src.stop(now + 0.68);
  }

  playFlare() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(130, now + 0.14);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  playExplosion(intensity = 1.0) {
    if (this.muted || !this.ctx || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;

    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(420, now);
    filter.frequency.exponentialRampToValueAtTime(65, now + 0.9);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(Math.min(0.42, 0.28 * intensity), now);
    gain.gain.exponentialRampToValueAtTime(0.002, now + 0.9);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(now);
    src.stop(now + 0.95);
  }

  playWireTrap() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.35);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.38);
  }

  playWarningBeep() {
    if (this.muted || !this.ctx) return;
    const nowMs = performance.now();
    if (nowMs - this.lastWarningBeep < 240) return;
    this.lastWarningBeep = nowMs;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1180, now);
    osc.frequency.setValueAtTime(880, now + 0.06);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.002, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  playRadioSquelch() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1650, now);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.002, now + 0.06);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.065);
  }

  speakRadio(sender, message, force = false) {
    const now = performance.now();
    if (!force && now - this.lastRadioTime < 2600) return;
    this.lastRadioTime = now;

    // Update HUD banner safely using textContent
    const banner = document.getElementById('radio-comms-banner');
    const senderEl = document.getElementById('radio-sender');
    const textEl = document.getElementById('radio-text');

    if (banner && senderEl && textEl) {
      senderEl.textContent = `[${sender}]`;
      textEl.textContent = message;
      banner.classList.remove('hidden');

      if (this.radioTimeoutId) clearTimeout(this.radioTimeoutId);
      this.radioTimeoutId = setTimeout(() => {
        banner.classList.add('hidden');
      }, 4200);
    }

    this.playRadioSquelch();

    if (!this.muted && 'speechSynthesis' in window) {
      try {
        if (force) {
          window.speechSynthesis.cancel();
        }
        const utter = new SpeechSynthesisUtterance(message);
        utter.rate = sender === 'LSO PADDLES' ? 1.12 : 1.06;
        utter.pitch = sender === 'LSO PADDLES' ? 0.92 : 1.02;
        utter.volume = 0.75;
        window.speechSynthesis.speak(utter);
      } catch {
        // Ignore speech synthesis errors on restricted browsers
      }
    }
  }
}
