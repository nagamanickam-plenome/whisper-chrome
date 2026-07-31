/**
 * WebGPUService.ts
 * Detects WebGPU support and retrieves GPU adapter information.
 */

export interface GPUInfo {
  supported: boolean;
  adapterName?: string;
  vendor?: string;
  deviceType?: string;
}

export async function detectWebGPU(): Promise<GPUInfo> {
  try {
    // @ts-ignore
    if (!navigator.gpu) return { supported: false };
    // @ts-ignore
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) return { supported: false };
    const info = await adapter.requestAdapterInfo();
    return {
      supported: true,
      adapterName: info?.device || info?.description || "Unknown GPU",
      vendor: info?.vendor || "Unknown",
      deviceType: adapter.isFallbackAdapter ? "CPU Fallback" : "Dedicated GPU",
    };
  } catch {
    return { supported: false };
  }
}
