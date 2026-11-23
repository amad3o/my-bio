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

// Characters from the name, plus binary for texture.
const CHARS = Array.from("djÐ3ø djÐ3ø djÐ3ø 0 1").filter((c) => c !== " ");
const FONT_FAMILY = "'JetBrains Mono Variable', monospace";
const COLOR = "0, 255, 70"; // classic Matrix green (R, G, B)
const MOUSE_RADIUS = 160;

const randomChar = () => CHARS[Math.floor(Math.random() * CHARS.length)];

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let width = 0;
    let height = 0;
    let glyphs: Glyph[] = [];
    let frame = 0;
    let last = 0;
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
          g.y += g.speed * step;
          g.x += Math.sin(time / 1500 + g.phase) * 0.15 * step;

          // Occasionally flip to a new character, matrix-style.
          if (Math.random() < 0.03 * step) g.char = randomChar();

          // Wrap around, respawning above the top at a new x.
          if (g.y > height + g.size) {
            g.y = -g.size;
            g.x = Math.random() * width;
          }

          // Push glyphs away from the cursor.
          const dx = g.x - mouse.x;
          const dy = g.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < MOUSE_RADIUS && dist > 0) {
            const force = (1 - dist / MOUSE_RADIUS) * 1.2;
            g.x += (dx / dist) * force;
            g.y += (dy / dist) * force;
          }
        }

        ctx.font = `${g.size}px ${FONT_FAMILY}`;
        ctx.fillStyle = `rgba(${COLOR}, ${Math.min(g.alpha * 1.6, 1)})`;
        ctx.fillText(g.char, g.x, g.y);
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
    const onVisibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden && !reduceMotion) frame = requestAnimationFrame(draw);
    };

    resize();
    requestAnimationFrame(draw);
    // Redraw once the mono font arrives so the static (reduced-motion) frame
    // doesn't stay in the fallback font.
    document.fonts?.ready.then(() => {
      if (reduceMotion) requestAnimationFrame(draw);
    });

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
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
