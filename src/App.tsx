/**
 * App.tsx — Main Single Page Application
 * Local AI inference using WebGPU or WASM
 */
import { useCallback, useRef, useState } from "react";
import { useWebGPU } from "./hooks/useWebGPU";
import { useWhisperEngine } from "./hooks/useWhisperEngine";
import { useAudioStream } from "./hooks/useAudioStream";
import { blobToFloat32Array } from "./utils/utils";
import ModelSourceToggle from "./components/ModelSourceToggle";
import type { ModelSource } from "./components/ModelSourceToggle";
import StatusCard from "./components/StatusCard";
import ModelLoader from "./components/ModelLoader";
import Recorder from "./components/Recorder";
import AudioPlayer from "./components/AudioPlayer";
import InferencePanel from "./components/InferencePanel";
import StreamViewer from "./components/StreamViewer";
import TranscriptHistory from "./components/TranscriptHistory";

export default function App() {
  const { gpuInfo } = useWebGPU();
  const { state: ws, loadModel, runInference, clearTranscripts } = useWhisperEngine();
  const [modelSource, setModelSource] = useState<ModelSource>("huggingface");

  const fullBlobRef = useRef<Blob | null>(null);
  const [hasAudio, setHasAudio] = useState(false);
  const [task, setTask] = useState<"transcribe" | "translate">("transcribe");

  const handleChunk = useCallback(async (blob: Blob) => {
    if (ws.modelStatus === "ready" && !ws.isInferring) {
      try {
        const audio = await blobToFloat32Array(blob);
        runInference(audio, task);
      } catch (e) {
        console.error("Chunk decode error:", e);
      }
    }
  }, [ws.modelStatus, ws.isInferring, task, runInference]);

  const handleStop = useCallback((blob: Blob) => {
    fullBlobRef.current = blob;
    setHasAudio(true);
  }, []);

  const recorder = useAudioStream({ onChunk: handleChunk, onStop: handleStop });

  const handleFileUpload = useCallback((blob: Blob) => {
    fullBlobRef.current = blob;
    setHasAudio(true);
    recorder.setAudioURL(URL.createObjectURL(blob));
  }, [recorder]);

  const handleInfer = useCallback(async (inferTask: "transcribe" | "translate") => {
    if (!fullBlobRef.current) return;
    setTask(inferTask);
    try {
      const audio = await blobToFloat32Array(fullBlobRef.current);
      runInference(audio, inferTask);
    } catch (e) {
      console.error("Audio decode error:", e);
    }
  }, [runInference]);

  const latestInferenceTime = ws.transcripts[0]?.inferenceTime ?? null;

  return (
    <div className="min-h-screen bg-app text-white">
      <ModelSourceToggle
        source={modelSource}
        onToggle={() => setModelSource((s) => (s === "huggingface" ? "local" : "huggingface"))}
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
            <StatusCard gpuInfo={gpuInfo} device={ws.device} isOnline={false} />
            <ModelLoader
              status={ws.modelStatus}
              progress={ws.loadProgress}
              loadFile={ws.loadFile}
              device={ws.device}
              loadTime={ws.loadTime}
              error={ws.error}
              onLoad={() => loadModel(modelSource)}
            />
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
              isOnline={false}
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
