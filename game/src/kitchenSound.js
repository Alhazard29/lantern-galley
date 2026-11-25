// Every sound of the galley, synthesised with WebAudio: no audio files. Browsers only
// let sound start after a key or a click, so nothing plays until unlock() is called.

const PENTATONIC = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33];

export function createKitchenSound() {
  let context = null;
  let master = null;
  let muted = false;
  let musicTimer = null;
  let musicStep = 0;
  let musicPace = 1;

  function tone(frequency, seconds, { type = 'sine', gain = 0.2, delay = 0, slideTo = null } = {}) {
    if (!context) return;
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, start + seconds);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(gain, start + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    oscillator.connect(envelope).connect(master);
    oscillator.start(start);
    oscillator.stop(start + seconds + 0.05);
  }

  function hiss(seconds, { gain = 0.2, band = 2400, sharpness = 1, delay = 0 } = {}) {
    if (!context) return;
    const start = context.currentTime + delay;
    const frames = Math.floor(context.sampleRate * seconds);
    const buffer = context.createBuffer(1, frames, context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) samples[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / frames, 2);
    const source = context.createBufferSource();
    source.buffer = buffer;
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = band;
    filter.Q.value = sharpness;
    const envelope = context.createGain();
    envelope.gain.value = gain;
    source.connect(filter).connect(envelope).connect(master);
    source.start(start);
  }

  function playMusicStep() {
    if (!context || muted) return;
    // A slow plucked figure over a drone: the night market a few boats away.
    const pattern = [0, 2, 4, 2, 5, 4, 2, 1, 0, 3, 4, 6, 5, 4, 2, 1];
    const note = PENTATONIC[pattern[musicStep % pattern.length]];
    tone(note, 0.5, { type: 'triangle', gain: 0.05 });
    if (musicStep % 4 === 0) tone(note / 2, 0.9, { type: 'sine', gain: 0.06 });
    if (musicStep % 8 === 4) hiss(0.08, { gain: 0.03, band: 5200 });
    musicStep += 1;
  }

  function scheduleMusic() {
    clearInterval(musicTimer);
    musicTimer = setInterval(playMusicStep, 330 / musicPace);
  }

  return {
    unlock() {
      if (context) {
        if (context.state === 'suspended') context.resume();
        return;
      }
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      context = new AudioContextClass();
      master = context.createGain();
      master.gain.value = 0.7;
      master.connect(context.destination);
      scheduleMusic();
    },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.7;
      return muted;
    },
    isMuted: () => muted,
    setMusicPace(pace) {
      if (pace === musicPace) return;
      musicPace = pace;
      if (context) scheduleMusic();
    },
    chop() {
      hiss(0.07, { gain: 0.5, band: 1800, sharpness: 0.8 });
      tone(170, 0.06, { type: 'square', gain: 0.12, slideTo: 90 });
    },
    ready() {
      tone(659.25, 0.12, { gain: 0.16 });
      tone(987.77, 0.2, { gain: 0.16, delay: 0.09 });
    },
    plate() {
      tone(523.25, 0.1, { type: 'triangle', gain: 0.2 });
      hiss(0.05, { gain: 0.12, band: 4200 });
    },
    served() {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.22, { type: 'triangle', gain: 0.2, delay: i * 0.07 }));
      tone(2093, 0.5, { gain: 0.08, delay: 0.28 });
    },
    sizzle() {
      hiss(0.6, { gain: 0.22, band: 6000, sharpness: 0.5 });
    },
    ticket() {
      hiss(0.12, { gain: 0.14, band: 3200, sharpness: 2 });
      tone(880, 0.08, { type: 'square', gain: 0.05, delay: 0.1 });
    },
    missed() {
      tone(196, 0.35, { type: 'sawtooth', gain: 0.14, slideTo: 98 });
    },
    refuse() {
      tone(150, 0.12, { type: 'square', gain: 0.08 });
    },
    pick() {
      tone(420, 0.05, { type: 'triangle', gain: 0.1, slideTo: 560 });
    },
    bin() {
      hiss(0.2, { gain: 0.25, band: 500, sharpness: 0.7 });
    },
    rush() {
      [440, 440, 587.33].forEach((f, i) => tone(f, 0.16, { type: 'sawtooth', gain: 0.12, delay: i * 0.16 }));
    },
    closing() {
      [783.99, 659.25, 523.25, 392].forEach((f, i) => tone(f, 0.3, { type: 'triangle', gain: 0.18, delay: i * 0.14 }));
    },
    tick() {
      tone(1200, 0.03, { type: 'square', gain: 0.05 });
    },
  };
}
