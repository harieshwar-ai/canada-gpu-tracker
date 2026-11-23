import { MIN_HOST_INTERVAL_MS } from "./constants";

const lastByHost = new Map<string, number>();

export async function waitForHost(host: string): Promise<void> {
  const now = Date.now();
  const last = lastByHost.get(host) ?? 0;
  const wait = MIN_HOST_INTERVAL_MS - (now - last);
  if (wait > 0) {
    await new Promise((r) => setTimeout(r, wait));
  }
  lastByHost.set(host, Date.now());
}