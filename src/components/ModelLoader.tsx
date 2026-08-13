/**
 * ModelLoader.tsx
 * Shows model loading progress, status, and execution device.
 * Triggered when the model needs to be downloaded / initialized.
 */
import { Cpu, Zap, Download, CheckCircle, AlertCircle } from "lucide-react";
import type { ModelStatus, ExecutionDevice } from "../hooks/useWhisperEngine";
import { MODEL_ID } from "../config/config";
import { formatMs } from "../utils/utils";

interface Props {
  status: ModelStatus;
  progress: number;
  loadFile: string | null;
  device: ExecutionDevice;
  loadTime: number | null;
  error: string | null;
  onLoad: () => void;
}

export default function ModelLoader({ status, progress, loadFile, device, loadTime, error, onLoad }: Props) {
  const DeviceIcon = device === "webgpu" ? Zap : Cpu;

  return (
    <div className="glass-card p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold text-lg">AI Model</h2>
          <p className="text-slate-400 text-sm font-mono">{MODEL_ID}</p>
        </div>
        {status === "ready" && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30">
            <DeviceIcon size={13} className="text-emerald-400" />
            <span className="text-emerald-300 text-xs font-semibold uppercase tracking-wide">
              {device === "webgpu" ? "WebGPU" : "CPU·WASM"}
            </span>
          </div>
        )}
      </div>

      {/* Status */}
      {status === "idle" && (
        <button
          onClick={onLoad}
          className="w-full btn-primary flex items-center justify-center gap-2"
        >
          <Download size={16} />
          Load Model
        </button>
      )}

      {status === "loading" && (
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400 flex items-center gap-1">
              <Download size={13} className="animate-bounce" />
              <span className="truncate max-w-[150px]">
                {loadFile ? `Loading ${loadFile}` : 'Downloading model…'}
              </span>
            </span>
            <span className="text-violet-300 font-mono">{progress.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-slate-700/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-slate-500 text-xs text-center">
            Model will be cached in your browser for offline use
          </p>
        </div>
      )}

      {status === "ready" && (
        <div className="flex items-center gap-3 text-sm">
          <CheckCircle size={16} className="text-emerald-400 shrink-0" />
          <span className="text-slate-300">
            Model ready{loadTime ? ` · loaded in ${formatMs(loadTime)}` : ""}
          </span>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-3">
          <div className="flex items-start gap-3 text-sm">
            <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <span className="text-red-300 break-all">{error}</span>
          </div>
          <button onClick={onLoad} className="w-full btn-secondary">
            Retry Load
          </button>
        </div>
      )}
    </div>
  );
}
