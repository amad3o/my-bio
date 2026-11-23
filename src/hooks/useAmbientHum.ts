import { useCallback, useEffect, useRef, useState } from "react";

type Hum = { ctx: AudioContext; master: GainNode };

const VOLUME = 0.05;

/**
 * A low, slowly breathing synth drone. Synthesized with the Web Audio API,
 * so there is no audio file. Nothing is created until the user opts in.
 */
export function useAmbientHum() {
  const [on, setOn] = useState(false);
  const hum = useRef<Hum | null>(null);

  const build = (): Hum => {
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = 0;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 180;
    filter.connect(master);
    master.connect(ctx.destination);

    // Slightly detuned oscillators beat against each other.
    const voices: [OscillatorType, number, number][] = [
      ["sine", 55, 0.6],
      ["sawtooth", 55.4, 0.25],
      ["sine", 110.3, 0.15],
    ];
    for (const [type, freq, level] of voices) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = level;
      osc.connect(gain).connect(filter);
      osc.start();
    }

    // Slow LFO opens and closes the filter so the drone "breathes".
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = 0.07;
    depth.gain.value = 70;
    lfo.connect(depth).connect(filter.frequency);
    lfo.start();

    return { ctx, master };
  };

  const toggle = useCallback(() => {
    const next = !on;
    hum.current ??= build();
    const { ctx, master } = hum.current;
    if (next) void ctx.resume();
    master.gain.setTargetAtTime(next ? VOLUME : 0, ctx.currentTime, 0.6);
    setOn(next);
  }, [on]);

  useEffect(
    () => () => {
      void hum.current?.ctx.close();
      hum.current = null;
    },
    [],
  );

  return { on, toggle };
}
