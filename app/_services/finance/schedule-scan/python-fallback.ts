import { SCAN_SERVICE_API_KEY, SCAN_SERVICE_URL } from "./config";

/**
 * Forward the uploaded file to the external Python scan-service as a
 * fallback when Gemini is unavailable or unconfigured.
 *
 * @param file - The uploaded schedule file.
 * @returns `{ data, status }` from the Python service, or `null` when
 * the service is not configured.
 */
export async function scanWithPythonService(file: File) {
  if (!SCAN_SERVICE_URL || !SCAN_SERVICE_API_KEY) return null;

  const proxyForm = new FormData();
  proxyForm.append("schedule", file, file.name);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55_000);

  try {
    const res = await fetch(`${SCAN_SERVICE_URL}/scan-schedule`, {
      method: "POST",
      headers: { Authorization: `Bearer ${SCAN_SERVICE_API_KEY}` },
      body: proxyForm,
      signal: controller.signal,
    });
    const data = await res.json();
    return { data, status: res.status };
  } finally {
    clearTimeout(timeout);
  }
}
