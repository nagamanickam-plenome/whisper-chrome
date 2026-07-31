/**
 * StreamViewer.tsx
 * Shows the live/latest transcription chunk as it arrives in real time.
 */
import { MessageSquare } from "lucide-react";
import { wordCount } from "../utils/utils";

interface Props {
  text: string;
  language: string;
  isInferring: boolean;
}

export default function StreamViewer({ text, language, isInferring }: Props) {
  return (
    <div className="glass-card p-6 space-y-3 min-h-[120px]">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-lg flex items-center gap-2">
          <MessageSquare size={16} className="text-violet-400" />
          Live Output
        </h2>
        {text && (
          <div className="flex gap-3 text-xs text-slate-500">
            <span>{wordCount(text)} words</span>
            <span>{text.length} chars</span>
            {language !== "unknown" && (
              <span className="text-violet-300 uppercase font-mono">{language}</span>
            )}
          </div>
        )}
      </div>
      <div className="relative">
        {isInferring && !text && (
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </span>
            Processing…
          </div>
        )}
        {text ? (
          <p className="text-white text-base leading-relaxed">{text}</p>
        ) : !isInferring ? (
          <p className="text-slate-600 text-sm italic">Output will appear here…</p>
        ) : null}
      </div>
    </div>
  );
}
