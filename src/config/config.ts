// ============================================================
// Central Configuration
// Change MODEL_ID here to switch between Whisper models.
//
// onnx-community models have proper fp32 + q8 variants:
//   "onnx-community/whisper-base"      ← using base to bypass cache and ensure stability
//   "onnx-community/whisper-tiny"
//   "onnx-community/whisper-small"
//
// NOTE: Xenova/whisper-* only ship 4-bit quantized models
//       and CANNOT run on WebGPU. Use onnx-community/* instead.
// ============================================================

// export const MODEL_ID = "onnx-community/whisper-tiny";
// export const MODEL_ID = 'onnx-community/whisper-small';
export const MODEL_ID = 'onnx-community/onnx';

export const CHUNK_DURATION_MS = 4000; // audio chunk size for streaming (ms)

export const SAMPLE_RATE = 16000; // Whisper expects 16kHz

export const LANGUAGES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  hi: "Hindi",
  zh: "Chinese",
  ar: "Arabic",
  ja: "Japanese",
  ko: "Korean",
  pt: "Portuguese",
};
