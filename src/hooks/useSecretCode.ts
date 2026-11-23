import { useEffect, useRef } from "react";

const KONAMI = [
  "arrowup",
  "arrowup",
  "arrowdown",
  "arrowdown",
  "arrowleft",
  "arrowright",
  "arrowleft",
  "arrowright",
  "b",
  "a",
];
const NEO = ["n", "e", "o"];
const CODES = [KONAMI, NEO];

/** Calls `onTrigger` whenever the Konami code or "neo" is typed. */
export function useSecretCode(onTrigger: () => void) {
  const callback = useRef(onTrigger);

  useEffect(() => {
    callback.current = onTrigger;
  });

  useEffect(() => {
    let buffer: string[] = [];

    const onKey = (e: KeyboardEvent) => {
      buffer = [...buffer, e.key.toLowerCase()].slice(-KONAMI.length);
      const hit = CODES.some((code) =>
        code.every((key, i) => buffer[buffer.length - code.length + i] === key),
      );
      if (hit) {
        buffer = [];
        callback.current();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
