# Whisper STT — Offline Speech-to-Text

A fully browser-based, offline-first speech-to-text application powered by:

- **[@huggingface/transformers](https://huggingface.co/docs/transformers.js)** — Whisper model running locally
- **WebGPU** — GPU acceleration (auto-detected, falls back to CPU/WASM)
- **React 18 + Vite + TypeScript** — Modern frontend stack
- **TailwindCSS v4** — Utility-first styling

## Quick Start

```bash
npm install
npm run dev
```

Open **http://localhost:5173** in **Chrome 113+** (best WebGPU support).

## Folder Structure

```
src/
├── config/config.ts          ← MODEL_ID: change here to switch models
├── utils/utils.ts             ← Helpers
├── services/
│   ├── WebGPUService.ts       ← GPU detection
│   └── MockServerService.ts   ← Online mode stub (logs to console)
├── workers/WhisperWorker.ts   ← Inference in a Web Worker
├── hooks/
│   ├── useWebGPU.tsx
│   ├── useNetworkStatus.tsx
│   ├── useWhisperEngine.tsx
│   └── useAudioStream.tsx
└── components/
    ├── NetworkStatus.tsx       ← Top-right Online/Offline badge
    ├── StatusCard.tsx
    ├── ModelLoader.tsx
    ├── Recorder.tsx
    ├── AudioPlayer.tsx
    ├── InferencePanel.tsx
    ├── StreamViewer.tsx
    └── TranscriptHistory.tsx
```

## Switching Models

```ts
// src/config/config.ts
export const MODEL_ID = "Xenova/whisper-tiny";
// Change to: "Xenova/whisper-base" | "Xenova/whisper-small"
```

## Online vs Offline Behaviour

| State | Behaviour |
|-------|-----------|
| Online | Audio logged via MockServerService (console only) |
| Offline | Local Whisper runs in Web Worker (WebGPU → WASM fallback) |

Toggle is automatic via `navigator.onLine`.
