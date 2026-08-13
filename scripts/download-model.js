import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODEL_ID = 'onnx-community/whisper-tiny';
const BASE_URL = `https://huggingface.co/${MODEL_ID}/resolve/main/`;
const LOCAL_DIR = path.resolve(__dirname, '../public/models', MODEL_ID);

const FILES_TO_DOWNLOAD = [
  'config.json',
  'generation_config.json',
  'special_tokens_map.json',
  'tokenizer_config.json',
  'tokenizer.json',
  'preprocessor_config.json',
  'vocab.json',
  'onnx/encoder_model.onnx',
  'onnx/decoder_model_merged.onnx'
];

async function downloadFile(file, destPath) {
  const url = BASE_URL + file;
  const destDir = path.dirname(destPath);
  
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  if (fs.existsSync(destPath)) {
    console.log(`Skipping ${file} (already exists)`);
    return;
  }

  console.log(`Downloading ${file}...`);
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, url).href;
        https.get(redirectUrl, (res2) => {
          pipeToFile(res2, destPath, resolve, reject);
        }).on('error', reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (${res.statusCode})`));
        return;
      }
      pipeToFile(res, destPath, resolve, reject);
    }).on('error', reject);
  });
}

function pipeToFile(res, destPath, resolve, reject) {
  const fileStream = fs.createWriteStream(destPath);
  res.pipe(fileStream);
  fileStream.on('finish', () => {
    fileStream.close();
    resolve();
  });
  fileStream.on('error', (err) => {
    fs.unlink(destPath, () => {});
    reject(err);
  });
}

async function main() {
  console.log(`Downloading model ${MODEL_ID} to ${LOCAL_DIR}`);
  for (const file of FILES_TO_DOWNLOAD) {
    const destPath = path.join(LOCAL_DIR, file);
    try {
      await downloadFile(file, destPath);
      console.log(`Successfully downloaded ${file}`);
    } catch (err) {
      console.error(`Failed to download ${file}:`, err.message);
    }
  }
  console.log('Download complete!');
}

main();
