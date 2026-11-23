import { FaVolumeMute, FaVolumeUp } from "react-icons/fa";
import { useAmbientHum } from "../hooks/useAmbientHum";

/** Opt-in ambient drone. Off by default. */
export default function SoundToggle({ visible }: { visible: boolean }) {
  const { on, toggle } = useAmbientHum();
  const Icon = on ? FaVolumeUp : FaVolumeMute;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Turn ambient sound off" : "Turn ambient sound on"}
      className={`fixed right-4 bottom-4 z-[60] rounded-full bg-zinc-900/70 p-3 backdrop-blur-sm transition-all duration-500 hover:text-white ${
        on ? "text-(--accent)" : "text-zinc-400"
      } ${visible ? "opacity-100" : "pointer-events-none opacity-0"}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
