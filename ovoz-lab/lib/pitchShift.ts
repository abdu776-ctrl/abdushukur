// Free voice change, entirely in the browser.
//
// Without a voice provider there is no real voice conversion, but raising the
// pitch of a recording is most of what makes an adult's sentence sound like a
// girl's or a boy's. This shifts pitch and keeps the timing, so the words stay
// where they were said.
//
// The method is plain granular overlap-add: short Hann-windowed grains are
// read from the input at `ratio` times normal speed and laid down at normal
// speed. Simple, dependency-free, and good enough for a lesson recording.

/** Semitones for each target, from a typical adult female recording. */
export const PITCH_PRESETS = { teacher: 0, girl: 4, boy: 2 } as const;
export type PitchTarget = keyof typeof PITCH_PRESETS;

export function shiftSamples(
  input: Float32Array,
  sampleRate: number,
  semitones: number
): Float32Array<ArrayBuffer> {
  if (semitones === 0) return new Float32Array(input);
  const ratio = Math.pow(2, semitones / 12);
  const grain = Math.max(256, Math.round(sampleRate * 0.05));
  const hop = Math.round(grain / 4);
  const out = new Float32Array(input.length);
  const norm = new Float32Array(input.length);
  const win = new Float32Array(grain);
  for (let k = 0; k < grain; k++) win[k] = 0.5 - 0.5 * Math.cos((2 * Math.PI * k) / (grain - 1));

  for (let start = 0; start < input.length; start += hop) {
    // Centre the faster read on the grain, so the grain stays in place in time.
    const readStart = start + (grain * (1 - ratio)) / 2;
    for (let k = 0; k < grain && start + k < out.length; k++) {
      const pos = readStart + k * ratio;
      const i = Math.floor(pos);
      if (i < 0 || i + 1 >= input.length) continue;
      const frac = pos - i;
      const sample = input[i] * (1 - frac) + input[i + 1] * frac;
      out[start + k] += sample * win[k];
      norm[start + k] += win[k];
    }
  }
  for (let i = 0; i < out.length; i++) if (norm[i] > 1e-3) out[i] /= norm[i];
  return out;
}

/** Decode an audio file and return it pitch-shifted, mixed down to mono. */
export async function shiftFile(file: Blob, semitones: number): Promise<AudioBuffer> {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  try {
    const decoded = await ctx.decodeAudioData(await file.arrayBuffer());
    const mono = new Float32Array(decoded.length);
    for (let c = 0; c < decoded.numberOfChannels; c++) {
      const ch = decoded.getChannelData(c);
      for (let i = 0; i < ch.length; i++) mono[i] += ch[i] / decoded.numberOfChannels;
    }
    const shifted = shiftSamples(mono, decoded.sampleRate, semitones);
    const out = ctx.createBuffer(1, shifted.length, decoded.sampleRate);
    out.copyToChannel(shifted, 0);
    return out;
  } finally {
    ctx.close().catch(() => {});
  }
}

/** 16-bit PCM WAV, so a shifted recording can be played or saved like any file. */
export function toWav(buffer: AudioBuffer): Blob {
  const data = buffer.getChannelData(0);
  const bytes = new ArrayBuffer(44 + data.length * 2);
  const v = new DataView(bytes);
  const str = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF');
  v.setUint32(4, 36 + data.length * 2, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, buffer.sampleRate, true);
  v.setUint32(28, buffer.sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, 'data');
  v.setUint32(40, data.length * 2, true);
  for (let i = 0; i < data.length; i++) {
    const s = Math.max(-1, Math.min(1, data[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([bytes], { type: 'audio/wav' });
}
