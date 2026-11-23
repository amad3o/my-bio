import { useEffect, useState } from "react";

type TypewriterProps = {
  text: string;
  /** Milliseconds per character. */
  speed?: number;
  /** Milliseconds to wait before typing starts. */
  delay?: number;
};

export default function Typewriter({
  text,
  speed = 130,
  delay = 400,
}: TypewriterProps) {
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [count, setCount] = useState(reduceMotion ? text.length : 0);

  useEffect(() => {
    if (reduceMotion) return;

    let interval: number | undefined;
    const start = window.setTimeout(() => {
      let i = 0;
      interval = window.setInterval(() => {
        i += 1;
        setCount(i);
        if (i >= text.length) window.clearInterval(interval);
      }, speed);
    }, delay);

    return () => {
      window.clearTimeout(start);
      window.clearInterval(interval);
    };
  }, [text, speed, delay, reduceMotion]);

  // Spread so multi-byte characters like Ð and ø are never split.
  const chars = Array.from(text);

  return (
    <span aria-label={text}>
      <span aria-hidden="true">
        {chars.slice(0, count).join("")}
        {/* Invisible remainder keeps the heading width stable while typing. */}
        <span className="invisible">{chars.slice(count).join("")}</span>
        <span className="typewriter-cursor" />
      </span>
    </span>
  );
}
