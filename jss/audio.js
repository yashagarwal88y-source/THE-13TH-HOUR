/**
 * THE 13TH HOUR - Web Audio Procedural Sound Engine
 * Synthesizes all gothic horror sound effects, organs, bells, and ticks with zero external files.
 */

class SoundSystem {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;
    this.isInitialized = false;

    // Ambient organ sequence
    this.organInterval = null;
    this.organStep = 0;
    this.isOrganPlaying = false;

    // Clock ticking
    this.tickInterval = null;
    this.tickTock = false;
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.isInitialized = true;
      this.startAmbience();
    } catch (e) {
      console.warn('Web Audio API could not be initialized:', e);
    }
  }

  ensureContext() {
    if (!this.isInitialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.ensureContext();
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  // --- Organ Pipe Note for Calliope Puzzle ---
  playOrganPipe(freq) {
    if (!this.isInitialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.65);
  }

  // --- Clock Ticking Sound ---
  startClockTicking() {
    if (this.tickInterval) return;
    this.tickInterval = setInterval(() => {
      this.playTick();
    }, 1000);
  }

  stopClockTicking() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  playTick(fast = false) {
    if (!this.isInitialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    this.tickTock = !this.tickTock;
    const baseFreq = this.tickTock ? 1200 : 980;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.035);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(baseFreq, now);
    filter.Q.setValueAtTime(3, now);

    gain.gain.setValueAtTime(fast ? 0.25 : 0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.045);
  }

  // --- Chronos Heart: 13-Second Rewind SFX ---
  playRewind() {
    if (!this.isInitialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Pitch sweep oscillator
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.35);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    // Filtered noise for tape whoosh
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(600, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(2800, now + 0.18);
    noiseFilter.frequency.exponentialRampToValueAtTime(400, now + 0.35);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.35);
    noise.start(now);
    noise.stop(now + 0.35);
  }

  // --- The Silent Bell: Deep Gothic Toll (Partial frequencies) ---
  playBell(ringIndex = 1) {
    if (!this.isInitialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    // Inharmonic frequencies of a cathedral church bell
    // Fundamental drops slightly deeper or sharpens as rings progress
    const fundamental = 110 + (ringIndex * 2);
    const partials = [
      { mult: 0.5, gain: 0.3, decay: 3.5 }, // Hum tone
      { mult: 1.0, gain: 0.5, decay: 2.8 }, // Prime
      { mult: 1.2, gain: 0.4, decay: 2.2 }, // Minor third
      { mult: 1.5, gain: 0.3, decay: 1.8 }, // Fifth
      { mult: 2.0, gain: 0.25, decay: 1.4 },// Octave / Nominal
      { mult: 2.7, gain: 0.15, decay: 0.9 },
      { mult: 4.1, gain: 0.1, decay: 0.6 }
    ];

    partials.forEach(p => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(fundamental * p.mult, now);

      gain.gain.setValueAtTime(p.gain * 0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + p.decay);
    });

    // Metallic initial strike transient
    const strikeOsc = this.ctx.createOscillator();
    const strikeGain = this.ctx.createGain();
    strikeOsc.type = 'triangle';
    strikeOsc.frequency.setValueAtTime(880, now);
    strikeOsc.frequency.exponentialRampToValueAtTime(200, now + 0.05);

    strikeGain.gain.setValueAtTime(0.4, now);
    strikeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    strikeOsc.connect(strikeGain);
    strikeGain.connect(this.masterGain);
    strikeOsc.start(now);
    strikeOsc.stop(now + 0.06);
  }

  // --- Memory Echo Collected Chime ---
  playEchoCollect() {
    if (!this.isInitialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880, 1108.73]; // A major ethereal chord

    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const delay = i * 0.07;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.2, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 1.8);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + delay);
      osc.stop(now + delay + 1.85);
    });
  }

  // --- UI & Interaction Sounds ---
  playClick() {
    if (!this.isInitialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.03);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.035);
  }

  playGearClick() {
    if (!this.isInitialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.05);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  playGlassShatter() {
    if (!this.isInitialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    const count = 8;
    for (let i = 0; i < count; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const delay = Math.random() * 0.15;
      const freq = 1200 + Math.random() * 2400;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);
      osc.frequency.exponentialRampToValueAtTime(300, now + delay + 0.2);

      gain.gain.setValueAtTime(0.15, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + delay);
      osc.stop(now + delay + 0.3);
    }
  }

  playFootstep() {
    if (!this.isInitialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(70 + Math.random() * 20, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  // --- Gothic Ambience & Organ Progression ---
  startAmbience() {
    if (this.isOrganPlaying) return;
    this.isOrganPlaying = true;
    this.startClockTicking();

    // Minor progression: Dm, Bb, Gm, A
    const chords = [
      [146.83, 220.00, 261.63, 349.23], // Dm (D3, A3, C4, F4)
      [116.54, 174.61, 233.08, 293.66], // Bb (Bb2, F3, Bb3, D4)
      [98.00, 146.83, 196.00, 293.66],  // Gm (G2, D3, G3, D4)
      [110.00, 164.81, 220.00, 277.18]  // A  (A2, E3, A3, C#4)
    ];

    let chordIdx = 0;
    this.playChord(chords[chordIdx]);

    this.organInterval = setInterval(() => {
      chordIdx = (chordIdx + 1) % chords.length;
      this.playChord(chords[chordIdx]);
    }, 6000);
  }

  playChord(frequencies) {
    if (!this.isInitialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    const duration = 5.5;

    frequencies.forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);
      filter.frequency.exponentialRampToValueAtTime(250, now + duration);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.025, now + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + duration + 0.1);
    });
  }
}

// Global audio singleton
window.gameAudio = new SoundSystem();
