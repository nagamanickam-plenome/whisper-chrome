/**
 * useAudioStream.tsx
 * Manages microphone streaming, chunked recording, pause, and stop.
 * Emits audio blobs at regular intervals for processing.
 */
import { useState, useRef, useCallback } from "react";
import { CHUNK_DURATION_MS } from "../config/config";

export type RecorderStatus = "idle" | "recording" | "paused" | "stopped";

interface UseAudioStreamOptions {
  onChunk: (blob: Blob) => void; // called with each audio chunk
  onStop: (fullBlob: Blob) => void; // called when recording fully stops
}

export function useAudioStream({ onChunk, onStop }: UseAudioStreamOptions) {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [duration, setDuration] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [volume, setVolume] = useState(0); // 0–100 for visualizer

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const allChunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const stopVolumeDetection = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setVolume(0);
  }, []);

  const startVolumeDetection = useCallback((stream: MediaStream) => {
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      setVolume(Math.min(100, avg * 2));
      animFrameRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, []);

  const flushChunk = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.requestData();
    }
  }, []);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      allChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          allChunksRef.current.push(e.data);
          const chunkBlob = new Blob([e.data], { type: mimeType });
          onChunk(chunkBlob);
        }
      };

      recorder.start(CHUNK_DURATION_MS);
      startVolumeDetection(stream);

      // Duration counter
      setDuration(0);
      durationRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);

      setStatus("recording");
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  }, [onChunk, startVolumeDetection]);

  const pause = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      stopVolumeDetection();
      if (durationRef.current) clearInterval(durationRef.current);
      setStatus("paused");
    }
  }, [stopVolumeDetection]);

  const resume = useCallback(() => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      if (streamRef.current) startVolumeDetection(streamRef.current);
      durationRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
      setStatus("recording");
    }
  }, [startVolumeDetection]);

  const stop = useCallback(() => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.onstop = () => {
      const mimeType =
        mediaRecorderRef.current?.mimeType ?? "audio/webm";
      const fullBlob = new Blob(allChunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(fullBlob);
      setAudioURL(url);
      onStop(fullBlob);
    };

    mediaRecorderRef.current.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    stopVolumeDetection();
    if (durationRef.current) clearInterval(durationRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setStatus("stopped");
  }, [onStop, stopVolumeDetection]);

  const reset = useCallback(() => {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    stopVolumeDetection();
    if (durationRef.current) clearInterval(durationRef.current);
    chunksRef.current = [];
    allChunksRef.current = [];
    setAudioURL(null);
    setDuration(0);
    setStatus("idle");
  }, [stopVolumeDetection]);

  return { status, duration, audioURL, setAudioURL, volume, start, pause, resume, stop, reset };
}
