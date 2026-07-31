/**
 * WhisperWorker.ts
 * Runs inside a Web Worker so inference never blocks the UI thread.
 *
 * Device + dtype strategy:
 *  - WebGPU → dtype: "fp32"  (GPU shaders require dense float tensors)
 *  - WASM   → dtype: "q8"   (8-bit quantized, fast + memory-efficient on CPU)
 *
 * If WebGPU fails for any reason, automatically retries on WASM.
 *
 * Model: onnx-community/whisper-tiny
 *   This model ships BOTH fp32 (for WebGPU) and q8 (for WASM) ONNX files.
 *   Xenova/whisper-* only ships 4-bit quantized — incompatible with WebGPU.
 */
import { pipeline, env } from "@huggingface/transformers";
import { MODEL_ID } from "../config/config";

// Use browser Cache API — models are cached after first download (offline-ready)
env.useBrowserCache = true;
env.allowLocalModels = false;

type WorkerMessage =
  | { type: "load" }
  | { type: "transcribe"; audio: Float32Array; task: "transcribe" | "translate" }
  | { type: "stop" };

let transcriber: Awaited<ReturnType<typeof pipeline>> | null = null;

/** Detect WebGPU availability in Worker context */
async function getPreferredDevice(): Promise<"webgpu" | "wasm"> {
  try {
    // @ts-ignore
    if (typeof navigator === "undefined" || !navigator.gpu) return "wasm";
    // @ts-ignore
    const adapter = await navigator.gpu.requestAdapter();
    return adapter ? "webgpu" : "wasm";
  } catch {
    return "wasm";
  }
}

/**
 * Load the pipeline with proper dtype per device.
 * Automatically falls back to WASM if WebGPU fails.
 */
async function loadPipeline(
  onProgress: (p: { progress?: number }) => void
): Promise<{ pipe: Awaited<ReturnType<typeof pipeline>>; device: "webgpu" | "wasm" }> {
  const preferred = await getPreferredDevice();

  if (preferred === "webgpu") {
    try {
      self.postMessage({ type: "log", message: `[Worker] Trying WebGPU with fp32 (${MODEL_ID})…` });

      const pipe = await pipeline("automatic-speech-recognition", MODEL_ID, {
        device: "webgpu",
        // dtype: "fp32", // Full precision for WebGPU to avoid DequantizeLinear bugs
        progress_callback: onProgress,
      });

      return { pipe, device: "webgpu" };
    } catch (err) {
      const msg = String(err).slice(0, 160);
      self.postMessage({ type: "log", message: `[Worker] WebGPU failed: ${msg}` });
      self.postMessage({ type: "log", message: "[Worker] Falling back to CPU (WASM q8)…" });
    }
  }

  // WASM fallback with 8-bit quantization
  self.postMessage({ type: "log", message: `[Worker] Loading on CPU WASM (q8) (${MODEL_ID})…` });

  try {
    const pipe = await pipeline("automatic-speech-recognition", MODEL_ID, {
      device: "wasm",
      dtype: "q8",
      progress_callback: onProgress,
    });
    return { pipe, device: "wasm" };
  } catch (err) {
    const msg = String(err).slice(0, 160);
    self.postMessage({ type: "log", message: `[Worker] WASM q8 failed: ${msg}` });
    self.postMessage({ type: "log", message: "[Worker] Ultimate fallback to WASM fp32…" });

    // Ultimate fallback
    const pipe = await pipeline("automatic-speech-recognition", MODEL_ID, {
      device: "wasm",
      // dtype: "fp32",
      progress_callback: onProgress,
    });
    return { pipe, device: "wasm" };
  }
}

self.addEventListener("message", async (event: MessageEvent<WorkerMessage>) => {
  const msg = event.data;

  if (msg.type === "load") {
    try {
      const startTime = performance.now();
      self.postMessage({ type: "loading", progress: 0 });

      const { pipe, device } = await loadPipeline((progress) => {
        if (typeof progress.progress === "number") {
          self.postMessage({ type: "loading", progress: progress.progress });
        }
      });

      transcriber = pipe;
      const loadTime = performance.now() - startTime;
      self.postMessage({ type: "loaded", device, loadTime });
    } catch (err) {
      self.postMessage({ type: "error", error: `Failed to load model: ${String(err)}` });
    }
  }

  if (msg.type === "transcribe") {
    if (!transcriber) {
      self.postMessage({ type: "error", error: "Model not loaded. Click Load Model first." });
      return;
    }
    try {
      const startTime = performance.now();
      const result = await transcriber(msg.audio, {
        task: msg.task,
        return_timestamps: "word",
        language: msg.task === "translate" ? "en" : undefined,
      });
      const inferenceTime = performance.now() - startTime;

      const output = Array.isArray(result) ? result[0] : result;
      self.postMessage({
        type: "result",
        text: (output as { text: string }).text?.trim() ?? "",
        language: (output as { language?: string }).language ?? "unknown",
        inferenceTime,
        chunks: (output as { chunks?: unknown[] }).chunks ?? [],
      });
    } catch (err) {
      self.postMessage({ type: "error", error: String(err) });
    }
  }
});
