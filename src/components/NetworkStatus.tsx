/**
 * NetworkStatus.tsx
 * Top-right badge showing current mode (Online/Offline) with a toggle button for testing.
 * Manual overrides are shown with a distinct "manual" indicator.
 */
import { Wifi, WifiOff, RotateCcw } from "lucide-react";

interface Props {
  isOnline: boolean;
  isManual: boolean;
  realOnline: boolean;
  onToggle: () => void;
  onReset: () => void;
}

export default function NetworkStatus({
  isOnline,
  isManual,
  realOnline,
  onToggle,
  onReset,
}: Props) {
  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">

      {/* Auto/Manual reset pill — only shown when overridden */}
      {isManual && (
        <button
          onClick={onReset}
          title={`Real network: ${realOnline ? "Online" : "Offline"} — click to auto-detect`}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium
            bg-slate-800/80 border border-slate-600/50 text-slate-400 hover:text-white
            hover:border-slate-400 backdrop-blur-md transition-all"
        >
          <RotateCcw size={11} />
          Auto
        </button>
      )}

      {/* Mode toggle badge */}
      <button
        onClick={onToggle}
        title={`Currently: ${isOnline ? "Server Mode" : "Offline / Local AI"} — click to switch`}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-full
          text-sm font-semibold shadow-lg backdrop-blur-md border
          transition-all duration-300 hover:scale-105 active:scale-95
          ${
            isOnline
              ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/30"
              : "bg-amber-500/20 border-amber-400/40 text-amber-300 hover:bg-amber-500/30"
          }
          ${isManual ? "ring-2 ring-offset-1 ring-offset-transparent ring-violet-500/40" : ""}
        `}
      >
        {isOnline ? (
          <>
            <Wifi size={14} className="animate-pulse" />
            <span>Server Mode</span>
          </>
        ) : (
          <>
            <WifiOff size={14} />
            <span>Offline · Local AI</span>
          </>
        )}

        {/* Status dot */}
        <span
          className={`w-2 h-2 rounded-full ${
            isOnline ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
          }`}
        />

        {/* Manual override indicator */}
        {isManual && (
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-70 ml-0.5">
            TEST
          </span>
        )}
      </button>
    </div>
  );
}
