import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { Card, CardContent } from "./components/ui/card";
import { socialLinks } from "./data/socialLinks";
import { useSecretCode } from "./hooks/useSecretCode";
import Typewriter from "./components/Typewriter";
import ParticleBackground from "./components/ParticleBackground";
import BootSequence from "./components/BootSequence";
import CrtOverlay from "./components/CrtOverlay";
import TiltCard from "./components/TiltCard";
import SoundToggle from "./components/SoundToggle";
import profileImage from "./assets/f-3-bandcamp.jpg";

const BOOT_KEY = "djd3o:booted";

// "boot": terminal text -> "card": card fades in -> "ready": everything on.
type Phase = "boot" | "card" | "ready";

const THEMES = {
  green: { hex: "#00ff46", rgb: "0, 255, 70" },
  red: { hex: "#ff2a3d", rgb: "255, 42, 61" },
};

function shouldSkipBoot() {
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return true;
    }
    return sessionStorage.getItem(BOOT_KEY) === "1";
  } catch {
    return false;
  }
}

export default function App() {
  const [phase, setPhase] = useState<Phase>(() =>
    shouldSkipBoot() ? "ready" : "boot",
  );
  const [redPill, setRedPill] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const onBootDone = useCallback(() => {
    try {
      sessionStorage.setItem(BOOT_KEY, "1");
    } catch {
      // storage unavailable (private mode); the boot just plays again next visit
    }
    setPhase("card");
  }, []);

  useEffect(() => {
    if (phase !== "card") return;
    const timer = window.setTimeout(() => setPhase("ready"), 900);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Konami code or typing "neo" flips the theme.
  const togglePill = useCallback(() => {
    const next = !redPill;
    setRedPill(next);
    setToast(
      next
        ? "> you took the red pill. follow the white rabbit."
        : "> you took the blue pill. the story ends.",
    );
  }, [redPill]);
  useSecretCode(togglePill);

  const theme = redPill ? THEMES.red : THEMES.green;
  const ready = phase === "ready";

  return (
    <main
      style={{ "--accent": theme.hex } as CSSProperties}
      className="relative flex min-h-screen items-center justify-center bg-black px-6 text-white"
    >
      <ParticleBackground color={theme.rgb} boosted={ready} />
      {phase === "boot" && <BootSequence onDone={onBootDone} />}

      <TiltCard
        className={`transition-all duration-700 ${
          phase === "boot" ? "translate-y-3 opacity-0" : "opacity-100"
        }`}
      >
        <Card className="relative w-full rounded-3xl border-zinc-800 bg-zinc-950/40 shadow-2xl backdrop-blur-md">
          <CardContent className="flex flex-col items-center p-6 sm:p-10">
            <img
              src={profileImage}
              alt="Amadeo"
              className="h-40 w-40 rounded-full border-4 border-zinc-800 object-cover shadow-xl"
            />
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-white [font-family:'Inter']">
              <Typewriter text="Amadeo" active={phase !== "boot"} />
            </h1>
            <p className="mt-2 text-sm font-medium tracking-[0.2em] text-zinc-400 [font-family:'Inter']">
              @amad3o
            </p>

            <div className="mt-8 flex w-full items-center justify-center gap-2 px-4 sm:gap-4 sm:px-0">
              {socialLinks.map((link, i) => {
                const Icon = link.icon;

                return (
                  <div
                    key={link.label}
                    className={`group relative transition-all duration-500 ${
                      ready
                        ? "translate-y-0 opacity-100"
                        : "translate-y-2 opacity-0"
                    }`}
                    style={{ transitionDelay: ready ? `${i * 90}ms` : "0ms" }}
                  >
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={link.label}
                      className="
                        glitch-icon
                        block
                        rounded-full
                        bg-zinc-900
                        p-2
                        text-zinc-400
                        transition-all
                        duration-300
                        hover:scale-110
                        hover:text-white
                        sm:p-3
                      "
                    >
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </a>
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 text-xs whitespace-nowrap text-(--accent) opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100"
                    >
                      {`> ${link.label.toLowerCase()}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </TiltCard>

      <SoundToggle visible={ready} />

      {toast && (
        <div
          role="status"
          className="animate-in fade-in slide-in-from-bottom-2 fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded border border-(--accent) bg-black/80 px-4 py-2 text-sm whitespace-nowrap text-(--accent) duration-300"
        >
          {toast}
        </div>
      )}

      <CrtOverlay />
    </main>
  );
}
