import { FETCH_TIMEOUT_MS, MIN_HOST_INTERVAL_MS, USER_AGENT } from "./constants.ts";
import { isBotChallenge } from "./challenge.ts";
import { isPathAllowed, parseRobotsForBot, type RobotsRules } from "./robots.ts";
import { waitForHost } from "./rate-limit.ts";

export class CrawlStoppedError extends Error {
  constructor(
    message: string,
    readonly host: string
  ) {
    super(message);
    this.name = "CrawlStoppedError";
  }
}

const robotsCache = new Map<string, RobotsRules>();

async function loadRobots(origin: string): Promise<RobotsRules> {
  const cached = robotsCache.get(origin);
  if (cached) return cached;
  const robotsUrl = `${origin}/robots.txt`;
  await waitForHost(new URL(origin).host);
  const res = await fetch(robotsUrl, {
    headers: { "User-Agent": USER_AGENT, Accept: "text/plain,*/*" },
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  const text = await res.text();
  if (isBotChallenge(text, res.status)) {
    throw new CrawlStoppedError(
      `robots.txt challenge on ${origin} (${res.status})`,
      new URL(origin).host
    );
  }
  const rules = parseRobotsForBot(text, USER_AGENT);
  robotsCache.set(origin, rules);
  return rules;
}

export interface PoliteFetchResult {
  html: string;
  status: number;
  finalUrl: string;
}

export async function politeFetch(url: string): Promise<PoliteFetchResult> {
  const u = new URL(url);
  const origin = u.origin;
  const rules = await loadRobots(origin);
  if (!isPathAllowed(rules, u.pathname + u.search)) {
    throw new Error(`robots.txt disallows ${u.pathname}`);
  }

  await waitForHost(u.host);

  let attempt = 0;
  let backoff = MIN_HOST_INTERVAL_MS;
  while (attempt < 3) {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const html = await res.text();
    if (isBotChallenge(html, res.status)) {
      throw new CrawlStoppedError(
        `Bot challenge on ${u.host} for ${u.pathname} (${res.status})`,
        u.host
      );
    }
    if (res.status === 403 || res.status === 429) {
      attempt++;
      if (attempt >= 3) {
        throw new CrawlStoppedError(
          `HTTP ${res.status} from ${u.host}; stopping crawls for this host`,
          u.host
        );
      }
      await new Promise((r) => setTimeout(r, backoff));
      backoff *= 2;
      continue;
    }
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }
    return { html, status: res.status, finalUrl: res.url };
  }
  throw new Error(`unreachable fetch loop for ${url}`);
}