/**
 * InferencePanel.tsx
 * Transcribe / Translate buttons and inference status.
 * Fires when the model is ready and audio is available.
 */
import { FileText, Languages, Loader2, Clock } from "lucide-react";
import type { ModelStatus } from "../hooks/useWhisperEngine";
import { formatMs } from "../utils/utils";

interface Props {
  modelStatus: ModelStatus;
  isInferring: boolean;
  inferenceTime: number | null;
  hasAudio: boolean;
  isOnline: boolean;
  onTranscribe: () => void;
  onTranslate: () => void;
}

export default function InferencePanel({
  modelStatus,
  isInferring,
  inferenceTime,
  hasAudio,
  isOnline,
  onTranscribe,
  onTranslate,
}: Props) {
  const ready = modelStatus === "ready" && !isOnline; // local inference only when offline
  const disabled = !ready || isInferring || !hasAudio;

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-lg">Inference</h2>
        {isOnline && (
          <span className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-full">
            Server mode active
          </span>
        )}
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onTranscribe}
          disabled={disabled}
          className="flex items-center justify-center gap-2 btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isInferring ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <FileText size={16} />
          )}
          Transcribe
        </button>
        <button
          onClick={onTranslate}
          disabled={disabled}
          className="flex items-center justify-center gap-2 btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isInferring ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Languages size={16} />
          )}
          Translate → EN
        </button>
      </div>

      {/* Status hints */}
      {!hasAudio && (
        <p className="text-slate-500 text-xs text-center">
          Record or upload audio first
        </p>
      )}
      {modelStatus !== "ready" && !isOnline && (
        <p className="text-slate-500 text-xs text-center">
          Load the model to enable local inference
        </p>
      )}
      {isOnline && (
        <p className="text-slate-500 text-xs text-center">
          Go offline or disable network to use local AI
        </p>
      )}

      {/* Inference time */}
      {inferenceTime !== null && (
        <div className="flex items-center gap-2 pt-1 border-t border-slate-700/50">
          <Clock size={13} className="text-slate-500" />
          <span className="text-slate-400 text-xs">
            Inference: <span className="text-violet-300 font-mono">{formatMs(inferenceTime)}</span>
          </span>
        </div>
      )}
    </div>
  );
}
