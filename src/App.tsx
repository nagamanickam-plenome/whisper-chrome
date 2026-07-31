/**
 * App.tsx — Main Single Page Application
 * Online  → audio sent to MockServerService (logs only)
 * Offline → audio processed by local Whisper model (WebGPU or WASM)
 */
import { useCallback, useRef, useState } from "react";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import { useWebGPU } from "./hooks/useWebGPU";
import { useWhisperEngine } from "./hooks/useWhisperEngine";
import { useAudioStream } from "./hooks/useAudioStream";
import { blobToFloat32Array } from "./utils/utils";
import { sendAudioToServer } from "./services/MockServerService";
import NetworkStatus from "./components/NetworkStatus";
import StatusCard from "./components/StatusCard";
import ModelLoader from "./components/ModelLoader";
import Recorder from "./components/Recorder";
import AudioPlayer from "./components/AudioPlayer";
import InferencePanel from "./components/InferencePanel";
import StreamViewer from "./components/StreamViewer";
import TranscriptHistory from "./components/TranscriptHistory";

export default function App() {
  const { isOnline, isManual, realOnline, toggleMode, resetToAuto } = useNetworkStatus();
  const { gpuInfo } = useWebGPU();
  const { state: ws, loadModel, runInference, clearTranscripts } = useWhisperEngine();

  const fullBlobRef = useRef<Blob | null>(null);
  const [hasAudio, setHasAudio] = useState(false);
  const [inferenceTime, setInferenceTime] = useState<number | null>(null);
  const [task, setTask] = useState<"transcribe" | "translate">("transcribe");

  const handleChunk = useCallback(async (blob: Blob) => {
    if (isOnline) {
      await sendAudioToServer(blob, task);
    }
    if (!isOnline && ws.modelStatus === "ready" && !ws.isInferring) {
      try {
        const audio = await blobToFloat32Array(blob);
        runInference(audio, task);
      } catch (e) {
        console.error("Chunk decode error:", e);
      }
    }
  }, [isOnline, ws.modelStatus, ws.isInferring, task, runInference]);

  const handleStop = useCallback((blob: Blob) => {
    fullBlobRef.current = blob;
    setHasAudio(true);
  }, []);

  const handleFileUpload = useCallback((blob: Blob) => {
    fullBlobRef.current = blob;
    setHasAudio(true);
  }, []);

  const handleInfer = useCallback(async (inferTask: "transcribe" | "translate") => {
    if (!fullBlobRef.current) return;
    setTask(inferTask);
    if (isOnline) {
      const t0 = performance.now();
      await sendAudioToServer(fullBlobRef.current, inferTask);
      setInferenceTime(performance.now() - t0);
      return;
    }
    try {
      const audio = await blobToFloat32Array(fullBlobRef.current);
      runInference(audio, inferTask);
    } catch (e) {
      console.error("Audio decode error:", e);
    }
  }, [isOnline, runInference]);

  const recorder = useAudioStream({ onChunk: handleChunk, onStop: handleStop });
  const latestInferenceTime = ws.transcripts[0]?.inferenceTime ?? inferenceTime ?? null;

  return (
    <div className="min-h-screen bg-app text-white">
      <NetworkStatus
        isOnline={isOnline}
        isManual={isManual}
        realOnline={realOnline}
        onToggle={toggleMode}
        onReset={resetToAuto}
      />
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        <header className="text-center space-y-2 pb-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
            bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold
            uppercase tracking-widest mb-3">
            Browser-Native AI
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-violet-200 to-fuchsia-300
            bg-clip-text text-transparent">
            Whisper Speech-to-Text
          </h1>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Offline-first speech recognition powered by{" "}
            <span className="text-violet-300">@huggingface/transformers</span>.
            Works entirely inside your browser — no server required.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="space-y-5">
            <StatusCard gpuInfo={gpuInfo} device={ws.device} isOnline={isOnline} />
            {!isOnline && (
              <ModelLoader
                status={ws.modelStatus}
                progress={ws.loadProgress}
                device={ws.device}
                loadTime={ws.loadTime}
                error={ws.error}
                onLoad={loadModel}
              />
            )}
          </div>
          <div className="space-y-5">
            <Recorder
              status={recorder.status}
              duration={recorder.duration}
              volume={recorder.volume}
              onStart={recorder.start}
              onPause={recorder.pause}
              onResume={recorder.resume}
              onStop={recorder.stop}
              onReset={() => {
                recorder.reset();
                setHasAudio(false);
                fullBlobRef.current = null;
              }}
              onFileUpload={handleFileUpload}
            />
            <AudioPlayer audioURL={recorder.audioURL} />
            <InferencePanel
              modelStatus={ws.modelStatus}
              isInferring={ws.isInferring}
              inferenceTime={latestInferenceTime}
              hasAudio={hasAudio}
              isOnline={isOnline}
              onTranscribe={() => handleInfer("transcribe")}
              onTranslate={() => handleInfer("translate")}
            />
          </div>
          <div className="space-y-5">
            <StreamViewer
              text={ws.currentText}
              language={ws.transcripts[0]?.language ?? "unknown"}
              isInferring={ws.isInferring}
            />
          </div>
        </div>

        <TranscriptHistory transcripts={ws.transcripts} onClear={clearTranscripts} />
      </div>
    </div>
  );
}
