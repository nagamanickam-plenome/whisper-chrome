/**
 * AudioPlayer.tsx
 * Plays back recorded or uploaded audio with a native HTML5 audio element.
 */
import { Play } from "lucide-react";

interface Props {
  audioURL: string | null;
}

export default function AudioPlayer({ audioURL }: Props) {
  if (!audioURL) return null;

  return (
    <div className="glass-card p-4 space-y-2">
      <p className="text-slate-400 text-sm flex items-center gap-2">
        <Play size={13} className="text-violet-400" />
        Playback
      </p>
      <audio
        controls
        src={audioURL}
        className="w-full rounded-lg"
        style={{ colorScheme: "dark" }}
      />
    </div>
  );
}
