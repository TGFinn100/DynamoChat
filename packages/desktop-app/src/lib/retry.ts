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
