export const SILENCE_THRESHOLD = 0.001;
export const LOOP_CROSSFADE_SECONDS = 1;
const MAX_CROSSFADE_RATIO = 0.1;

export const audibleRange = (
  channels: Float32Array[],
  threshold = SILENCE_THRESHOLD,
): [number, number] => {
  const length = channels[0]?.length ?? 0;
  const isAudible = (i: number) => channels.some((c) => Math.abs(c[i]) > threshold);

  let start = 0;
  while (start < length && !isAudible(start)) start++;
  let end = length;
  while (end > start && !isAudible(end - 1)) end--;

  return start < end ? [start, end] : [0, length];
};

export const seamlessLoop = (channels: Float32Array[], fadeLength: number): Float32Array[] =>
  channels.map((channel) => {
    const length = channel.length;
    const fade = Math.max(0, Math.min(Math.floor(fadeLength), Math.floor(length / 2)));
    const out = channel.slice(0, length - fade);
    for (let i = 0; i < fade; i++) {
      const t = ((i + 0.5) / fade) * (Math.PI / 2);
      out[i] = channel[i] * Math.sin(t) + channel[length - fade + i] * Math.cos(t);
    }
    return out;
  });

export const prepareLoop = (channels: Float32Array[], sampleRate: number): Float32Array[] => {
  const [start, end] = audibleRange(channels);
  const trimmed = channels.map((c) => c.subarray(start, end));
  const fade = Math.min(sampleRate * LOOP_CROSSFADE_SECONDS, (end - start) * MAX_CROSSFADE_RATIO);
  return seamlessLoop(trimmed, fade);
};

export const trimSilence = (channels: Float32Array[]): Float32Array[] => {
  const [start, end] = audibleRange(channels);
  return channels.map((c) => c.slice(start, end));
};
