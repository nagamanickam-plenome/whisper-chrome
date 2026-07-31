/**
 * StatusCard.tsx
 * Shows system info: WebGPU support, GPU name, browser, memory, execution provider.
 */
import { Cpu, Zap, Globe, MemoryStick, Activity } from "lucide-react";
import type { GPUInfo } from "../services/WebGPUService";
import type { ExecutionDevice } from "../hooks/useWhisperEngine";

interface Props {
  gpuInfo: GPUInfo;
  device: ExecutionDevice;
  isOnline: boolean;
}

function Row({ icon: Icon, label, value, highlight }: {
  icon: React.ElementType;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-700/40 last:border-0">
      <div className="flex items-center gap-2 text-slate-400 text-sm">
        <Icon size={13} />
        {label}
      </div>
      <span className={`text-sm font-medium ${highlight ? "text-violet-300" : "text-slate-200"}`}>
        {value}
      </span>
    </div>
  );
}

export default function StatusCard({ gpuInfo, device, isOnline }: Props) {
  // @ts-ignore
  const memory = navigator.deviceMemory ? `${navigator.deviceMemory} GB` : "Unknown";
  const browser = navigator.userAgent.includes("Chrome")
    ? "Chrome"
    : navigator.userAgent.includes("Firefox")
    ? "Firefox"
    : navigator.userAgent.includes("Safari")
    ? "Safari"
    : "Unknown";

  return (
    <div className="glass-card p-6">
      <h2 className="text-white font-semibold text-lg mb-3">System Status</h2>
      <Row
        icon={gpuInfo.supported ? Zap : Cpu}
        label="WebGPU"
        value={gpuInfo.supported ? "Supported ✓" : "Not Available"}
        highlight={gpuInfo.supported}
      />
      {gpuInfo.supported && gpuInfo.adapterName && (
        <Row icon={Activity} label="GPU" value={gpuInfo.adapterName} />
      )}
      <Row
        icon={Cpu}
        label="Execution"
        value={
          !isOnline
            ? device === "webgpu"
              ? "WebGPU"
              : device === "wasm"
              ? "CPU · WASM"
              : "Not loaded"
            : "Server"
        }
        highlight
      />
      <Row icon={Globe} label="Browser" value={browser} />
      <Row icon={MemoryStick} label="Device Memory" value={memory} />
    </div>
  );
}
