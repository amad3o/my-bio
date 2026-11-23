import { useCallback, useEffect, useRef, useState } from "react";

const NOISE = Array.from("Amadeo01#$%&@");
const TICK = 40; // ms between scramble updates
const randomNoise = () => NOISE[Math.floor(Math.random() * NOISE.length)];

type TypewriterProps = {
  text: string;
  /** Milliseconds each character takes to lock in. */
  speed?: number;
  /** Milliseconds to wait before decoding starts. */
  delay?: number;
  /** Decoding waits until this is true. */
  active?: boolean;
};

/**
 * Types text out one character at a time. The characters about to appear
 * flicker through random glyphs before locking in. Hovering replays the
 * decode (with a glitch effect from CSS).
 */
export default function Typewriter({
  text,
  speed = 140,
  delay = 300,
  active = true,
}: TypewriterProps) {
  const chars = Array.from(text);
  const total = chars.length;

  const [reduceMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [state, setState] = useState({
    locked: reduceMotion ? total : 0,
    noise: "",
  });
  const timers = useRef<{ start?: number; tick?: number }>({});

  const stop = useCallback(() => {
    window.clearTimeout(timers.current.start);
    window.clearInterval(timers.current.tick);
  }, []);

  const run = useCallback(
    (perChar: number, startDelay: number) => {
      stop();
      timers.current.start = window.setTimeout(() => {
        let progress = 0;
        timers.current.tick = window.setInterval(() => {
          progress += TICK / perChar;
          const locked = Math.min(Math.floor(progress), total);
          const noise =
            locked >= total
              ? ""
              : Array.from(
                  { length: Math.min(2, total - locked) },
                  randomNoise,
                ).join("");
          setState({ locked, noise });
          if (locked >= total) window.clearInterval(timers.current.tick);
        }, TICK);
      }, startDelay);
    },
    [stop, total],
  );

  useEffect(() => {
    if (!active || reduceMotion) return;
    run(speed, delay);
    return stop;
  }, [active, reduceMotion, run, stop, speed, delay]);

  const done = state.locked >= total;
  const noiseLength = Array.from(state.noise).length;

  return (
    <span
      aria-label={text}
      className="glitch-hover inline-block cursor-default"
      onMouseEnter={() => {
        if (done && !reduceMotion) run(45, 0);
      }}
    >
      <span aria-hidden="true">
        {chars.slice(0, state.locked).join("")}
        {state.noise}
        {/* Invisible remainder keeps the heading width stable while decoding. */}
        <span className="invisible">
          {chars.slice(state.locked + noiseLength).join("")}
        </span>
        {!done && <span className="typewriter-cursor" />}
      </span>
    </span>
  );
}
