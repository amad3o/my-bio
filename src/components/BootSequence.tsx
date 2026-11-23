import { useEffect, useState } from "react";

const LINES = [
  "> establishing connection...",
  "> authenticating amadeo",
  "> access granted",
];

/** Terminal boot text shown on first load. Click or press any key to skip. */
export default function BootSequence({ onDone }: { onDone: () => void }) {
  const [shown, setShown] = useState("");
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const full = LINES.join("\n");
    let timer = 0;
    let finished = false;
    let i = 0;

    const finish = () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timer);
      setLeaving(true);
      timer = window.setTimeout(onDone, 350);
    };

    const step = () => {
      i += 1;
      setShown(full.slice(0, i));
      if (i >= full.length) {
        timer = window.setTimeout(finish, 600);
        return;
      }
      timer = window.setTimeout(step, full[i - 1] === "\n" ? 260 : 24);
    };

    timer = window.setTimeout(step, 250);
    window.addEventListener("pointerdown", finish);
    window.addEventListener("keydown", finish);

    return () => {
      finished = true;
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", finish);
      window.removeEventListener("keydown", finish);
    };
  }, [onDone]);

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-6 transition-opacity duration-300 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
      <pre
        aria-hidden="true"
        className="min-h-[4.5rem] text-sm leading-6 whitespace-pre-wrap text-(--accent)"
      >
        {shown}
        <span className="typewriter-cursor" />
      </pre>
    </div>
  );
}
