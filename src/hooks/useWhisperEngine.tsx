/**
 * useWhisperEngine.tsx
 * Manages the Whisper Web Worker lifecycle.
 * Handles model loading, inference requests, and progress reporting.
 */
import { useState, useRef, useCallback, useEffect } from "react";
import type { ModelSource } from "../components/ModelSourceToggle";

export type ModelStatus = "idle" | "loading" | "ready" | "error";
export type ExecutionDevice = "webgpu" | "wasm" | "unknown";

export interface TranscriptChunk {
  id: string;
  text: string;
  language: string;
  task: "transcribe" | "translate";
  inferenceTime: number;
  timestamp: string;
}

export interface WhisperEngineState {
  modelStatus: ModelStatus;
  loadProgress: number;
  loadFile: string | null;
  loadTime: number | null;
  device: ExecutionDevice;
  error: string | null;
  isInferring: boolean;
  transcripts: TranscriptChunk[];
  currentText: string;
}

export function useWhisperEngine() {
  const workerRef = useRef<Worker | null>(null);
  const [state, setState] = useState<WhisperEngineState>({
    modelStatus: "idle",
    loadProgress: 0,
    loadFile: null,
    loadTime: null,
    device: "unknown",
    error: null,
    isInferring: false,
    transcripts: [],
    currentText: "",
  });

  // Initialize and load model
  const loadModel = useCallback((source: ModelSource) => {
    if (workerRef.current) {
      workerRef.current.terminate();
    }

    const worker = new Worker(
      new URL("../workers/WhisperWorker.ts", import.meta.url),
      { type: "module" }
    );
    workerRef.current = worker;

    setState((s) => ({ ...s, modelStatus: "loading", loadProgress: 0, error: null }));

    worker.onmessage = (event) => {
      const msg = event.data;

      switch (msg.type) {
        case "loading":
          setState((s) => ({
            ...s, 
            loadProgress: msg.progress ?? s.loadProgress,
            loadFile: msg.file ?? s.loadFile
          }));
          break;
        case "loaded":
          setState((s) => ({
            ...s,
            modelStatus: "ready",
            device: msg.device as ExecutionDevice,
            loadTime: msg.loadTime,
            loadProgress: 100,
          }));
          break;
        case "result":
          setState((s) => ({
            ...s,
            isInferring: false,
            currentText: msg.text,
            transcripts: [
              {
                id: crypto.randomUUID(),
                text: msg.text,
                language: msg.language,
                task: msg.task ?? "transcribe",
                inferenceTime: msg.inferenceTime,
                timestamp: new Date().toLocaleTimeString(),
              },
              ...s.transcripts,
            ],
          }));
          break;
        case "log":
          console.info("[WhisperWorker]", msg.message);
          break;
        case "error":
          setState((s) => ({
            ...s,
            modelStatus: "error",
            isInferring: false,
            error: msg.error,
          }));
          break;
      }
    };

    worker.onerror = (err) => {
      setState((s) => ({
        ...s,
        modelStatus: "error",
        error: err.message,
      }));
    };

    worker.postMessage({ type: "load", source });
  }, []);

  // Run transcription or translation on a Float32Array
  const runInference = useCallback(
    (audio: Float32Array, task: "transcribe" | "translate") => {
      if (!workerRef.current || state.modelStatus !== "ready") return;
      setState((s) => ({ ...s, isInferring: true, error: null }));
      workerRef.current.postMessage({ type: "transcribe", audio, task }, [audio.buffer]);
    },
    [state.modelStatus]
  );

  const clearTranscripts = useCallback(() => {
    setState((s) => ({ ...s, transcripts: [], currentText: "" }));
  }, []);

  // Cleanup worker on unmount
  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  return { state, loadModel, runInference, clearTranscripts };
}
