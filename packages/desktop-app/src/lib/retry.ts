import { HttpError } from "./backendClient";

export async function retryWithWakeUp<T>(
  attempt: () => Promise<T>,
  options: { onWaking: () => void; retryIntervalMs?: number; maxTotalMs?: number },
): Promise<T> {
  const { onWaking, retryIntervalMs = 3000, maxTotalMs = 90000 } = options;
  const start = Date.now();
  let waking = false;

  for (;;) {
    try {
      return await attempt();
    } catch (err) {
      // A definitive HTTP response (bad code, bad request, ...) means the
      // server is up and has already answered - retrying would just waste
      // time before showing the real error, so only connectivity/timeout
      // failures (a sleeping server, dropped network) get retried.
      if (err instanceof HttpError) {
        throw err;
      }
      if (Date.now() - start >= maxTotalMs) {
        throw err;
      }
      if (!waking) {
        waking = true;
        onWaking();
      }
      await new Promise((resolve) => setTimeout(resolve, retryIntervalMs));
    }
  }
}
