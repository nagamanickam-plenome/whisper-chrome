/**
 * TranscriptHistory.tsx
 * Full history of all transcribed/translated segments with accuracy preview.
 */
import { Copy, Download, Trash2, Clock, CheckCircle } from "lucide-react";
import type { TranscriptChunk } from "../hooks/useWhisperEngine";
import { formatMs, exportAsTxt } from "../utils/utils";
import { useState } from "react";

interface Props {
  transcripts: TranscriptChunk[];
  onClear: () => void;
}

export default function TranscriptHistory({ transcripts, onClear }: Props) {
  const [copied, setCopied] = useState(false);

  const fullText = transcripts
    .slice().reverse()
    .map((t) => `[${t.timestamp}] (${t.task}) ${t.text}`)
    .join("\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-white font-semibold text-lg">
          Transcript History
          {transcripts.length > 0 && (
            <span className="ml-2 text-xs text-slate-500 font-normal">
              {transcripts.length} segment{transcripts.length !== 1 ? "s" : ""}
            </span>
          )}
        </h2>
        {transcripts.length > 0 && (
          <div className="flex gap-2">
            <button onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition-all">
              {copied ? <CheckCircle size={13} className="text-emerald-400" /> : <Copy size={13} />}
              {copied ? "Copied!" : "Copy All"}
            </button>
            <button onClick={() => exportAsTxt(fullText, `transcript-${Date.now()}.txt`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 hover:text-white text-xs transition-all">
              <Download size={13} />Export
            </button>
            <button onClick={onClear}
              className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all" title="Clear history">
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {transcripts.length === 0 ? (
        <div className="text-center py-8 text-slate-600 text-sm">
          <p>No transcripts yet.</p>
          <p className="text-xs mt-1">Record or upload audio and click Transcribe.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
          {transcripts.map((chunk) => (
            <div key={chunk.id}
              className="rounded-xl p-4 bg-slate-800/50 border border-slate-700/40 hover:border-violet-500/30 transition-all">
              <div className="flex items-center gap-3 mb-2 text-xs text-slate-500">
                <Clock size={11} />
                <span>{chunk.timestamp}</span>
                <span className={`px-2 py-0.5 rounded-full font-medium uppercase tracking-wide
                  ${chunk.task === "translate" ? "bg-blue-500/20 text-blue-300" : "bg-violet-500/20 text-violet-300"}`}>
                  {chunk.task}
                </span>
                {chunk.language !== "unknown" && (
                  <span className="text-slate-400 font-mono uppercase">{chunk.language}</span>
                )}
                <span className="ml-auto font-mono">{formatMs(chunk.inferenceTime)}</span>
              </div>
              <p className="text-white text-sm leading-relaxed">{chunk.text}</p>
            </div>
          ))}
        </div>
      )}

      {transcripts.some((t) => t.task === "transcribe") &&
        transcripts.some((t) => t.task === "translate") && (
          <div className="pt-3 border-t border-slate-700/50">
            <p className="text-xs text-slate-500 text-center">
              💡 Compare Transcribe vs Translate segments above to evaluate accuracy
            </p>
          </div>
        )}
    </div>
  );
}
