import { pipeline, env } from '@huggingface/transformers';

async function run() {
  try {
    const pipe = await pipeline('automatic-speech-recognition', 'onnx-community/fb/onnx', {
      device: 'wasm',
      dtype: 'fp32'
    });
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
