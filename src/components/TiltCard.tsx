import { useEffect, useRef, type ReactNode } from "react";

const MAX_TILT_X = 6; // degrees
const MAX_TILT_Y = 8;

type TiltCardProps = { children: ReactNode; className?: string };

/** Tilts its contents in 3D toward the cursor. */
export default function TiltCard({ children, className }: TiltCardProps) {
  const inner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = inner.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      el.style.transform = `rotateX(${-ny * MAX_TILT_X}deg) rotateY(${nx * MAX_TILT_Y}deg)`;
    };
    const reset = () => {
      el.style.transform = "";
    };

    window.addEventListener("pointermove", onMove);
    document.documentElement.addEventListener("pointerleave", reset);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", reset);
    };
  }, []);

  return (
    <div
      data-rain-target
      className={`w-full max-w-md [perspective:1000px] ${className ?? ""}`}
    >
      <div
        ref={inner}
        className="transition-transform duration-200 ease-out will-change-transform"
      >
        {children}
      </div>
    </div>
  );
}
