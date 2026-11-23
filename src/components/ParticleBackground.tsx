import { useEffect, useRef } from "react";

type Glyph = {
  x: number;
  y: number;
  char: string;
  size: number;
  speed: number;
  alpha: number;
  phase: number;
};
type Burst = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  char: string;
  born: number;
};
type Ring = { x: number; y: number; born: number };

// Characters from the name, plus binary and code symbols for texture.
const CHARS = Array.from("Amadeo Amadeo Amadeo 0 1 { } < > /").filter(
  (c) => c !== " ",
);
const FONT_FAMILY = "'JetBrains Mono Variable', monospace";
const MOUSE_RADIUS = 160;
const HALO = 90; // px around the card where glyphs glow
const BURST_COUNT = 18;
const BURST_LIFE = 800; // ms
const RING_MAX = 260; // px
const DIM = 0.35; // rain intensity before the page is "ready"

const randomChar = () => CHARS[Math.floor(Math.random() * CHARS.length)];
const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);
// "0, 255, 70" -> a near-white tint of the same hue.
const lighten = (rgb: string) =>
  rgb
    .split(",")
    .map((n) => Math.round(+n + (255 - +n) * 0.8))
    .join(", ");

type ParticleBackgroundProps = {
  /** "R, G, B" */
  color: string;
  /** Rain starts dim and intensifies when this becomes true. */
  boosted: boolean;
};

export default function ParticleBackground({
  color,
  boosted,
}: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorRef = useRef(color);
  const boostRef = useRef(boosted);
  const redrawRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    colorRef.current = color;
    boostRef.current = boosted;
    redrawRef.current?.(); // repaint the static frame (reduced motion)
  }, [color, boosted]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const card = document.querySelector<HTMLElement>("[data-rain-target]");

    let width = 0;
    let height = 0;
    let glyphs: Glyph[] = [];
    let bursts: Burst[] = [];
    let rings: Ring[] = [];
    let frame = 0;
    let last = 0;
    let intensity = boostRef.current ? 1 : DIM;
    const mouse = { x: -9999, y: -9999 };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(110, Math.floor((width * height) / 12000));
      glyphs = Array.from({ length: count }, () => {
        // "depth": bigger glyphs are closer, so faster and brighter.
        const depth = Math.random();
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          char: randomChar(),
          size: 10 + depth * 12,
          speed: 2 + depth * 4.5, // px per 60fps frame
          alpha: 0.1 + depth * 0.35,
          phase: Math.random() * Math.PI * 2,
        };
      });
    };

    const draw = (time: number) => {
      // Normalize to 60fps so speed is the same on 120Hz displays.
      const step = last ? Math.min((time - last) / 16.67, 3) : 1;
      last = time;

      intensity +=
        ((boostRef.current ? 1 : DIM) - intensity) * Math.min(0.03 * step, 1);
      const speedMul = 0.5 + 0.5 * intensity;
      const alphaMul = 0.45 + 0.55 * intensity;
      const rgb = colorRef.current;
      const rect = card?.getBoundingClientRect();

      // Fade the previous frame instead of clearing it, which leaves
      // each falling glyph with a streaky trail.
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = `rgba(0, 0, 0, ${reduceMotion ? 1 : 0.22})`;
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "source-over";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (const g of glyphs) {
        if (!reduceMotion) {
          g.y += g.speed * speedMul * step;
          g.x += Math.sin(time / 1500 + g.phase) * 0.15 * step;

          // Occasionally flip to a new character, matrix-style.
          if (Math.random() < 0.03 * step) g.char = randomChar();

          // Wrap around, respawning above the top at a new x.
          if (g.y > height + g.size) {
            g.y = -g.size;
            g.x = Math.random() * width;
          }

          // Push glyphs away from the cursor / finger.
          const dx = g.x - mouse.x;
          const dy = g.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < MOUSE_RADIUS && dist > 0) {
            const force = (1 - dist / MOUSE_RADIUS) * 1.2;
            g.x += (dx / dist) * force;
            g.y += (dy / dist) * force;
          }
        }

        let alpha = Math.min(g.alpha * 1.6, 1) * alphaMul;

        // Glyphs glow brighter near the card's edges (not behind it, so the
        // text stays readable) and drift gently away from its sides.
        if (rect) {
          const vx = g.x - clamp(g.x, rect.left, rect.right);
          const vy = g.y - clamp(g.y, rect.top, rect.bottom);
          const d = Math.hypot(vx, vy);
          if (d > 0 && d < HALO) {
            const k = 1 - d / HALO;
            alpha = Math.min(alpha * (1 + k * 1.6), 1);
            if (!reduceMotion) g.x += Math.sign(vx) * k * 0.8 * step;
          }
        }

        ctx.font = `${g.size}px ${FONT_FAMILY}`;
        ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
        ctx.fillText(g.char, g.x, g.y);
      }

      // Click bursts: characters fly outward, plus an expanding ring.
      if (bursts.length || rings.length) {
        const head = lighten(rgb);
        ctx.font = `16px ${FONT_FAMILY}`;
        bursts = bursts.filter((b) => time - b.born < BURST_LIFE);
        for (const b of bursts) {
          b.x += b.vx * step;
          b.y += b.vy * step;
          b.vx *= Math.pow(0.95, step);
          b.vy *= Math.pow(0.95, step);
          const life = 1 - (time - b.born) / BURST_LIFE;
          ctx.fillStyle = `rgba(${head}, ${life})`;
          ctx.fillText(b.char, b.x, b.y);
        }

        rings = rings.filter((r) => time - r.born < BURST_LIFE);
        for (const r of rings) {
          const t = (time - r.born) / BURST_LIFE;
          ctx.beginPath();
          ctx.arc(r.x, r.y, t * RING_MAX, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${rgb}, ${0.5 * (1 - t)})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      if (!reduceMotion) frame = requestAnimationFrame(draw);
    };

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const onLeave = () => {
      mouse.x = mouse.y = -9999;
    };
    const onDown = (e: PointerEvent) => {
      onMove(e); // a touch or tap disturbs the rain too
      if (reduceMotion) return;
      const now = performance.now();
      for (let i = 0; i < BURST_COUNT; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 5;
        bursts.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          char: randomChar(),
          born: now,
        });
      }
      rings.push({ x: e.clientX, y: e.clientY, born: now });
    };
    const onUp = (e: PointerEvent) => {
      // Mouse keeps hovering; a lifted finger is gone.
      if (e.pointerType !== "mouse") onLeave();
    };
    const onVisibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden && !reduceMotion) frame = requestAnimationFrame(draw);
    };

    resize();
    requestAnimationFrame(draw);
    redrawRef.current = reduceMotion
      ? () => requestAnimationFrame(draw)
      : null;
    // Redraw once the mono font arrives so the static (reduced-motion) frame
    // doesn't stay in the fallback font.
    document.fonts?.ready.then(() => {
      if (reduceMotion) requestAnimationFrame(draw);
    });

    const root = document.documentElement;
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onLeave);
    root.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(frame);
      redrawRef.current = null;
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onLeave);
      root.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 h-full w-full"
    />
  );
}
