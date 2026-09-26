/** Soft two-tone success chime via Web Audio (no asset download). */

let audioCtx: AudioContext | null = null;

function getCtx() {
  const AC =
    typeof window !== "undefined"
      ? window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      : undefined;
  if (!AC) return null;
  if (!audioCtx) audioCtx = new AC();
  return audioCtx;
}

export function playSuccessDing() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();

    const t0 = ctx.currentTime;
    const notes: Array<[number, number]> = [
      [0, 987.77], // B5
      [0.07, 1318.51], // E6
    ];

    for (const [offset, freq] of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0 + offset);
      gain.gain.exponentialRampToValueAtTime(0.07, t0 + offset + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + offset + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0 + offset);
      osc.stop(t0 + offset + 0.18);
    }
  } catch {
    /* autoplay policy / unsupported */
  }
}
