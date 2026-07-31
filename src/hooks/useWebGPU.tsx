/**
 * useWebGPU.tsx
 * Detects WebGPU support on mount and returns GPU info.
 */
import { useState, useEffect } from "react";
import { detectWebGPU } from "../services/WebGPUService";
import type { GPUInfo } from "../services/WebGPUService";

export function useWebGPU() {
  const [gpuInfo, setGpuInfo] = useState<GPUInfo>({ supported: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    detectWebGPU().then((info) => {
      setGpuInfo(info);
      setLoading(false);
    });
  }, []);

  return { gpuInfo, loading };
}
