# Whisper WebGPU (Transformers.js)

This project is a local-first, browser-native Speech-to-Text application powered by **Transformers.js (v3)** and **WebGPU**. It runs OpenAI's Whisper model entirely inside your browser—no servers or external APIs required.

## Architecture

The application is built using React, Vite, and TypeScript. To ensure the UI never freezes during heavy AI computation, the model runs entirely inside a dedicated **Web Worker** (`src/workers/WhisperWorker.ts`).

### The Inference Pipeline
1. **Audio Capture/Upload**: Audio is captured via the microphone or uploaded as a file, then converted to a `16kHz Float32Array`.
2. **Web Worker Dispatch**: The audio buffer is sent to `WhisperWorker.ts`.
3. **Hardware Acceleration**: The worker attempts to request a **WebGPU** adapter. 
    - If WebGPU is supported by the browser, it loads the model in `fp32` (full precision) for blazing-fast inference on the GPU.
    - If WebGPU is unsupported, it automatically falls back to **WASM (WebAssembly)** using an 8-bit quantized (`q8`) model to run efficiently on the CPU.
4. **Transcription**: The pipeline streams chunks of transcribed text and language detection back to the main UI.

---

## HuggingFace Mode vs Local Mode

The application supports two distinct ways to load models, controlled by a toggle in the UI:

### 1. HuggingFace Mode (Network / Cache)
- **How it works:** The model is downloaded directly from the `huggingface.co` servers over the internet.
- **Caching:** Transformers.js caches the downloaded model inside the browser's internal **IndexedDB** (`env.useBrowserCache = true`). Subsequent loads bypass the network entirely.
- **Best for:** Trying out new models quickly without downloading massive files manually.

### 2. Local Mode (Offline-First)
- **How it works:** The model is loaded directly from your own project directory (`public/models/`).
- **Caching:** Browser caching is explicitly disabled (`env.useBrowserCache = false`). This prevents "ghost caches" from filling up your browser storage and ensures that if you replace the model files on your hard drive, the browser instantly loads the newest version.
- **Best for:** Offline environments, privacy-strict applications, and testing custom ONNX conversions.

---

## Supported Model Formats

Because WebGPU has specific hardware requirements, you must be careful about which ONNX models you use.

* **✅ Supported (WebGPU):** Unquantized or lightly quantized dense tensors (like `fp32` or `fp16`). You should almost always use models provided by the **`onnx-community`** organization on Hugging Face (e.g., `onnx-community/whisper-tiny`).
* **❌ Unsupported (WebGPU):** 4-bit quantized models (e.g., models from the `Xenova` organization). WebGPU currently lacks native support for 4-bit integer matrix multiplication. If you try to load these on WebGPU, it will fail (though it will work on WASM/CPU).

---

## How to Add Custom or New Models

If you export your own fine-tuned Whisper model to ONNX, or want to use a different model from Hugging Face, follow these steps:

### Option A: Using the Download Script
We provide a script to easily download models directly into your `public/` directory.
1. Open `scripts/download-model.js`.
2. Change the `MODEL_ID` variable to your desired Hugging Face repository (e.g., `onnx-community/whisper-base`).
3. If the model is larger than 2GB, make sure you add the external data files (like `onnx/encoder_model.onnx_data`) to the `FILES_TO_DOWNLOAD` array.
4. Run `node scripts/download-model.js`.

### Option B: Manual Setup
1. Create a folder in `public/models/` matching the name of your model (e.g., `public/models/my-custom-model`).
2. Place all required ONNX files inside this folder:
   - `config.json`
   - `tokenizer.json`
   - `tokenizer_config.json`
   - `onnx/encoder_model.onnx`
   - `onnx/decoder_model_merged.onnx`
3. Update `src/config/config.ts` to point to your new folder:
   ```typescript
   export const MODEL_ID = 'my-custom-model';
   ```

---

## Critical Gotchas When Adding New Models

When adding new or custom models, keep the following in mind to prevent crashes:

### 1. External Data Files (`.onnx_data`)
ONNX has a strict 2GB limit per protobuf file. For large models (like `whisper-large-v3-turbo`), the weights are split into a `.onnx_data` file. If your model has these files, **you must download them too**. If you forget them, you will get an `Out of bounds` or `protobuf parsing failed` error.

### 2. Word-Level Timestamps vs Chunk-Level Timestamps
By default, the worker requests chunk-level timestamps (`return_timestamps: true`). 
If you change this to **word-level timestamps** (`return_timestamps: "word"`), it **will crash** unless your specific ONNX model was explicitly exported with `output_attentions=True`.
> Most WebGPU optimized models (like `onnx-community/*`) intentionally strip out cross-attention weights to save massive amounts of memory and compute time. **Do not use word-level timestamps on these models.**

### 3. Missing `decoder_model_merged.onnx`
Some older models split the decoder into `decoder_model.onnx` and `decoder_with_past_model.onnx`. Transformers.js v3 strongly prefers the **merged** decoder architecture (`decoder_model_merged.onnx`). Ensure your custom exports are using the merged architecture.
