/**
 * useNetworkStatus.tsx
 * Tracks browser online/offline status with a manual override for testing.
 * manualOverride: null = follow real browser state, true/false = force mode.
 */
import { useState, useEffect } from "react";

export function useNetworkStatus() {
  const [realOnline, setRealOnline] = useState<boolean>(navigator.onLine);
  const [manualOverride, setManualOverride] = useState<boolean | null>(null);

  useEffect(() => {
    const handleOnline = () => setRealOnline(true);
    const handleOffline = () => setRealOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Effective online state: manual override wins, otherwise real browser state
  const isOnline = manualOverride !== null ? manualOverride : realOnline;

  const toggleMode = () => {
    setManualOverride((prev) => {
      // First toggle: lock to opposite of current effective state
      const next = prev !== null ? !prev : !realOnline;
      return next;
    });
  };

  const resetToAuto = () => setManualOverride(null);

  const isManual = manualOverride !== null;

  return { isOnline, isManual, realOnline, toggleMode, resetToAuto };
}
