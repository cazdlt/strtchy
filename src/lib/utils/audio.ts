export type SoundType =
  | "countdown"
  | "setStart"
  | "setComplete"
  | "restStart"
  | "restEnd"
  | "switchSides"
  | "practiceComplete"
  | "rep";

export function slugifyAudioName(text: string): string {
  return text
    .toLowerCase()
    .replace(/\//g, "-")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-");
}

export class AudioController {
  audioContext: AudioContext | null = null;
  isEnabled = false;
  isVoiceEnabled = true;

  private bufferCache = new Map<string, AudioBuffer>();
  private activeSources: AudioBufferSourceNode[] = [];

  constructor(enabled = false, voiceEnabled = true) {
    this.isEnabled = enabled;
    this.isVoiceEnabled = voiceEnabled;
  }

  ensureAudioContext(): AudioContext | null {
    if (!this.isEnabled) return null;

    if (
      !this.audioContext &&
      typeof window !== "undefined" &&
      "AudioContext" in window
    ) {
      this.audioContext = new AudioContext();
    }

    if (this.audioContext?.state === "suspended") {
      this.audioContext.resume();
    }

    return this.audioContext;
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (enabled && !this.audioContext) {
      this.ensureAudioContext();
    }
  }

  setVoiceEnabled(enabled: boolean) {
    this.isVoiceEnabled = enabled;
  }

  /**
   * Preloads an audio cue buffer into memory for zero-latency playback.
   */
  async preloadCue(nameOrSlug: string): Promise<AudioBuffer | null> {
    const slug = slugifyAudioName(nameOrSlug);
    if (this.bufferCache.has(slug)) {
      return this.bufferCache.get(slug)!;
    }

    const ctx = this.ensureAudioContext();
    if (!ctx) return null;

    try {
      const res = await fetch(`/audio/cues/${slug}.mp3`);
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      this.bufferCache.set(slug, audioBuffer);
      return audioBuffer;
    } catch {
      return null;
    }
  }

  /**
   * Plays a pre-rendered MP3 voice cue (cue phrase or exercise name).
   * Blends directly into the Web Audio graph with clean sub-millisecond timing.
   */
  async playVoiceCue(nameOrSlug: string, delayMs = 0): Promise<void> {
    if (!this.isEnabled || !this.isVoiceEnabled) return;

    const slug = slugifyAudioName(nameOrSlug);
    let audioBuffer = this.bufferCache.get(slug);

    if (!audioBuffer) {
      audioBuffer = (await this.preloadCue(slug)) || undefined;
    }

    const ctx = this.ensureAudioContext();
    if (ctx && audioBuffer) {
      const startTime = ctx.currentTime + Math.max(0, delayMs) / 1000;
      const source = ctx.createBufferSource();
      const gainNode = ctx.createGain();

      source.buffer = audioBuffer;
      gainNode.gain.setValueAtTime(0.9, startTime);

      source.connect(gainNode);
      gainNode.connect(ctx.destination);

      source.start(startTime);
      this.activeSources.push(source);
      source.onended = () => {
        const idx = this.activeSources.indexOf(source);
        if (idx !== -1) this.activeSources.splice(idx, 1);
      };
    } else if (typeof window !== "undefined") {
      // Fallback via HTML5 Audio if decodeAudioData is unavailable
      setTimeout(() => {
        try {
          const sound = new Audio(`/audio/cues/${slug}.mp3`);
          sound.volume = 0.9;
          sound.play().catch(() => {});
        } catch {}
      }, delayMs);
    }
  }

  /**
   * Warm tone with low-pass filtering and clean anti-click envelope
   */
  private playWarmTone(
    freq: number,
    duration: number,
    delay: number = 0,
    options: {
      type?: OscillatorType;
      filterFreq?: number;
      peakGain?: number;
      attack?: number;
    } = {}
  ) {
    if (!this.audioContext) return;
    const ctx = this.audioContext;
    const startTime = ctx.currentTime + delay;
    const type = options.type ?? "triangle";
    const filterFreq = options.filterFreq ?? 2400;
    const peakGain = options.peakGain ?? 0.14;
    const attack = options.attack ?? 0.015;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(filterFreq, startTime);
    filter.Q.setValueAtTime(1.2, startTime);

    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(peakGain, startTime + attack);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  /**
   * Resonant bell / Tibetan singing bowl chime with acoustic partials
   */
  private playBell(
    fundamentalFreq: number,
    duration: number,
    delay: number = 0,
    peakGain: number = 0.16
  ) {
    if (!this.audioContext) return;
    const ctx = this.audioContext;
    const startTime = ctx.currentTime + delay;

    const partials = [
      { ratio: 1.0, gainScale: 1.0, decayScale: 1.0 },
      { ratio: 2.76, gainScale: 0.35, decayScale: 0.65 },
      { ratio: 5.4, gainScale: 0.12, decayScale: 0.35 },
    ];

    partials.forEach(({ ratio, gainScale, decayScale }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = "sine";
      osc.frequency.setValueAtTime(fundamentalFreq * ratio, startTime);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(
        Math.min(fundamentalFreq * ratio * 3, 4000),
        startTime
      );

      const pGain = peakGain * gainScale;
      const pDuration = duration * decayScale;

      gainNode.gain.setValueAtTime(0.0001, startTime);
      gainNode.gain.linearRampToValueAtTime(pGain, startTime + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + pDuration);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + pDuration + 0.05);
    });
  }

  /**
   * Tactile percussive click (woodblock/rimshot click)
   */
  private playPercussionClick(
    baseFreq: number,
    duration: number = 0.05,
    delay: number = 0,
    peakGain: number = 0.12
  ) {
    if (!this.audioContext) return;
    const ctx = this.audioContext;
    const startTime = ctx.currentTime + delay;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gainNode = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(baseFreq * 1.5, startTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.6, startTime + duration);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(baseFreq, startTime);
    filter.Q.setValueAtTime(3.5, startTime);

    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(peakGain, startTime + 0.003);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.03);
  }

  play(type: SoundType) {
    if (!this.isEnabled) return;
    this.ensureAudioContext();
    if (!this.audioContext) return;

    switch (type) {
      case "countdown":
        // 3 tactile metronome ticks spaced 1s apart for 3, 2, 1
        this.playPercussionClick(720, 0.06, 0, 0.12);
        this.playPercussionClick(720, 0.06, 1.0, 0.12);
        this.playPercussionClick(1020, 0.08, 2.0, 0.15);
        break;
      case "setStart":
        // Warm dual-tone analog synth chime
        this.playWarmTone(523.25, 0.28, 0, {
          type: "triangle",
          filterFreq: 2200,
          peakGain: 0.13,
        });
        this.playWarmTone(783.99, 0.32, 0.06, {
          type: "triangle",
          filterFreq: 2400,
          peakGain: 0.11,
        });
        break;
      case "setComplete":
        // Ascending warm major triad (C5 -> E5 -> G5)
        this.playWarmTone(523.25, 0.22, 0, {
          type: "sine",
          filterFreq: 3000,
          peakGain: 0.12,
        });
        this.playWarmTone(659.25, 0.22, 0.08, {
          type: "sine",
          filterFreq: 3000,
          peakGain: 0.12,
        });
        this.playWarmTone(783.99, 0.35, 0.16, {
          type: "triangle",
          filterFreq: 2800,
          peakGain: 0.14,
        });
        break;
      case "restStart":
        // Resonant meditation singing bowl (G4 = 392Hz)
        this.playBell(392.0, 1.8, 0, 0.18);
        break;
      case "restEnd":
        // Two soft rising warning chimes (G4 392Hz -> C5 523Hz)
        this.playWarmTone(392.0, 0.18, 0, {
          type: "sine",
          filterFreq: 2600,
          peakGain: 0.11,
        });
        this.playWarmTone(523.25, 0.25, 0.12, {
          type: "triangle",
          filterFreq: 2800,
          peakGain: 0.13,
        });
        break;
      case "switchSides":
        // Distinct two-tone transition bell (D5 587Hz -> A5 880Hz)
        this.playWarmTone(587.33, 0.2, 0, {
          type: "triangle",
          filterFreq: 3000,
          peakGain: 0.12,
        });
        this.playWarmTone(880.0, 0.35, 0.12, {
          type: "triangle",
          filterFreq: 3200,
          peakGain: 0.14,
        });
        break;
      case "practiceComplete":
        // Full celebratory warm chord arpeggio: C4 -> G4 -> C5 -> E5 -> G5
        [261.63, 392.0, 523.25, 659.25, 783.99].forEach((freq, idx) => {
          this.playWarmTone(freq, 1.2, idx * 0.09, {
            type: idx >= 3 ? "triangle" : "sine",
            filterFreq: 2600,
            peakGain: 0.1,
            attack: 0.02,
          });
        });
        break;
      case "rep":
        // Crisp, subtle tactile click
        this.playPercussionClick(650, 0.035, 0, 0.08);
        break;
    }
  }

  async playCountdown(): Promise<void> {
    this.play("countdown");
    await new Promise((r) => setTimeout(r, 2200));
  }
}

export function createAudioController(
  enabled = false,
  voiceEnabled = true
): AudioController {
  return new AudioController(enabled, voiceEnabled);
}
