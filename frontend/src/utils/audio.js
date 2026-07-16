// Web Audio API Synthesizer for ChessMate Game Sound Effects
// Programmatic synthesis avoids loading network audio assets and guarantees zero latency.

class SoundSynth {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume context if suspended (browser security policy)
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // Play standard move sound (subtle wood block pop)
  playMove() {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = "sine";
    // Pitch sweep down quickly for a "pop"
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.09);
  }

  // Play capture sound (sharp metallic tick/strike)
  playCapture() {
    this.init();
    const osc = this.ctx.createOscillator();
    const noise = this.ctx.createOscillator(); // High pitch ring
    const gain = this.ctx.createGain();

    osc.connect(gain);
    noise.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = "triangle";
    osc.frequency.setValueAtTime(450, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.12);

    noise.type = "sine";
    noise.frequency.setValueAtTime(1800, this.ctx.currentTime);
    noise.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

    osc.start(this.ctx.currentTime);
    noise.start(this.ctx.currentTime);
    
    osc.stop(this.ctx.currentTime + 0.16);
    noise.stop(this.ctx.currentTime + 0.16);
  }

  // Play check sound (dissonant warning chord)
  playCheck() {
    this.init();
    const now = this.ctx.currentTime;
    const notes = [293.66, 311.13]; // D4 and Eb4 (dissonant semitone)
    
    notes.forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.start(now);
      osc.stop(now + 0.4);
    });
  }

  // Play checkmate sound (heroic major chord chime)
  playCheckmate() {
    this.init();
    const now = this.ctx.currentTime;
    // C major arpeggio (C4, E4, G4, C5)
    const notes = [261.63, 329.63, 392.00, 523.25];
    
    notes.forEach((freq, index) => {
      const delay = index * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0.12, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.6);

      osc.start(now + delay);
      osc.stop(now + delay + 0.7);
    });
  }

  // Play promotion sound (uplifting sweep)
  playPromotion() {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = "triangle";
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(880, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);

    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.3);
  }

  // Play illegal move sound (low buzzy synthesizer thud)
  playIllegal() {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(130, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.2);
  }

  // Play board cracking/shattering sound (filtered white noise snap)
  playCrack() {
    this.init();
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(700, this.ctx.currentTime);
    filter.Q.setValueAtTime(2.0, this.ctx.currentTime);

    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 0.12);

    const gain = this.ctx.createGain();

    noiseNode.connect(filter);
    filter.connect(gain);
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

    noiseNode.start(this.ctx.currentTime);
    osc.start(this.ctx.currentTime);

    noiseNode.stop(this.ctx.currentTime + 0.35);
    osc.stop(this.ctx.currentTime + 0.35);
  }
}

export const audio = new SoundSynth();
