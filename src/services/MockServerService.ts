/**
 * MockServerService.ts
 * When the app is Online, audio is "sent to a server".
 * Currently this just logs — replace with a real fetch() call later.
 */

export interface ServerResponse {
  text: string;
  language: string;
  inferenceTime: number;
}

export async function sendAudioToServer(
  audioBlob: Blob,
  task: "transcribe" | "translate"
): Promise<ServerResponse> {
  console.log(
    `[SERVER] Sending ${(audioBlob.size / 1024).toFixed(1)} KB audio blob for task: ${task}`
  );

  // TODO: Replace with real server endpoint
  // const formData = new FormData();
  // formData.append("audio", audioBlob, "chunk.webm");
  // formData.append("task", task);
  // const res = await fetch("/api/transcribe", { method: "POST", body: formData });
  // return res.json();

  // Simulate latency
  await new Promise((r) => setTimeout(r, 300));

  console.log(`[SERVER] Response received (simulated)`);
  return {
    text: "[Server response – not yet implemented. Running simulation.]",
    language: "en",
    inferenceTime: 300,
  };
}
