/**
 * Recorder.tsx
 * Microphone recording control panel with:
 *   - Start / Pause / Resume / Stop buttons
 *   - Live volume visualizer bars
 *   - Duration counter
 *   - File upload support
 */
import { Mic, Pause, Play, Square, Upload, Trash2 } from "lucide-react";
import type { RecorderStatus } from "../hooks/useAudioStream";
import { useRef } from "react";

interface Props {
  status: RecorderStatus;
  duration: number;
  volume: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onReset: () => void;
  onFileUpload: (blob: Blob) => void;
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function Recorder({
  status,
  duration,
  volume,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
  onFileUpload,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileUpload(file);
    e.target.value = "";
  };

  // Build 20 bars for the volume visualizer
  const bars = Array.from({ length: 20 }, (_, i) => {
    const threshold = (i / 20) * 100;
    const active = volume > threshold;
    return active;
  });

  const isRecording = status === "recording";
  const isPaused = status === "paused";
  const isActive = isRecording || isPaused;

  return (
    <div className="glass-card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-lg flex items-center gap-2">
          <Mic size={18} className={isRecording ? "text-red-400 animate-pulse" : "text-slate-400"} />
          Recorder
        </h2>
        {isActive && (
          <span className="text-red-400 font-mono text-sm tabular-nums">
            {formatDuration(duration)}
          </span>
        )}
      </div>

      {/* Volume Visualizer */}
      <div className="flex items-end gap-[2px] h-10 px-1">
        {bars.map((active, i) => (
          <div
            key={i}
            className={`flex-1 rounded-sm transition-all duration-75 ${
              active
                ? "bg-gradient-to-t from-violet-500 to-fuchsia-400"
                : "bg-slate-700/40"
            }`}
            style={{
              height: active
                ? `${20 + Math.random() * 80}%`
                : `${10 + (i % 5) * 5}%`,
            }}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {status === "idle" || status === "stopped" ? (
          <button
            onClick={onStart}
            className="btn-primary flex items-center gap-2 flex-1"
          >
            <Mic size={16} />
            Start Recording
          </button>
        ) : null}

        {isRecording && (
          <>
            <button
              onClick={onPause}
              className="btn-secondary flex items-center gap-2 flex-1"
            >
              <Pause size={16} />
              Pause
            </button>
            <button
              onClick={onStop}
              className="btn-danger flex items-center gap-2 flex-1"
            >
              <Square size={16} />
              Stop
            </button>
          </>
        )}

        {isPaused && (
          <>
            <button
              onClick={onResume}
              className="btn-primary flex items-center gap-2 flex-1"
            >
              <Play size={16} />
              Resume
            </button>
            <button
              onClick={onStop}
              className="btn-danger flex items-center gap-2 flex-1"
            >
              <Square size={16} />
              Stop
            </button>
          </>
        )}

        {isActive && (
          <button
            onClick={onReset}
            className="p-2 rounded-lg bg-slate-700/40 hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-all"
            title="Delete recording"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* File upload */}
      <div className="border-t border-slate-700/50 pt-4">
        <input
          ref={fileRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleFile}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
            border border-dashed border-slate-600 text-slate-400 hover:text-white
            hover:border-violet-500/50 hover:bg-violet-500/5 transition-all text-sm"
        >
          <Upload size={15} />
          Upload Audio File
        </button>
      </div>
    </div>
  );
}
