/**
 * ModelSourceToggle.tsx
 * Top-right badge showing current model source with a toggle button.
 */
import { Cloud, HardDrive } from "lucide-react";

export type ModelSource = "huggingface" | "local";

interface Props {
  source: ModelSource;
  onToggle: () => void;
}

export default function ModelSourceToggle({ source, onToggle }: Props) {
  const isHF = source === "huggingface";
  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      <button
        onClick={onToggle}
        title={`Currently: ${isHF ? "HuggingFace (Browser Cache)" : "Local Folder"} — click to switch`}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-full
          text-sm font-semibold shadow-lg backdrop-blur-md border
          transition-all duration-300 hover:scale-105 active:scale-95
          ${
            isHF
              ? "bg-violet-500/20 border-violet-400/40 text-violet-300 hover:bg-violet-500/30"
              : "bg-emerald-500/20 border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/30"
          }
        `}
      >
        {isHF ? (
          <>
            <Cloud size={14} />
            <span>HuggingFace Mode</span>
          </>
        ) : (
          <>
            <HardDrive size={14} />
            <span>Local Mode</span>
          </>
        )}

        <span
          className={`w-2 h-2 rounded-full ${
            isHF ? "bg-violet-400" : "bg-emerald-400"
          }`}
        />
      </button>
    </div>
  );
}
