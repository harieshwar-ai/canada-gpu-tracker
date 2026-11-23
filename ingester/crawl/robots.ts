export interface RobotsRules {
  allows: string[];
  disallows: string[];
}

function parseRobotsTxt(text: string, userAgent: string): RobotsRules {
  const blocks: { agents: string[]; allows: string[]; disallows: string[] }[] =
    [];
  let current: { agents: string[]; allows: string[]; disallows: string[] } | null =
    null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.split("#")[0]?.trim() ?? "";
    if (!line) continue;
    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const key = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();

    if (key === "user-agent") {
      current = { agents: [value.toLowerCase()], allows: [], disallows: [] };
      blocks.push(current);
    } else if (current && key === "allow") {
      current.allows.push(value);
    } else if (current && key === "disallow") {
      current.disallows.push(value);
    }
  }

  const botUa = userAgent.toLowerCase();
  const botName = botUa.includes("canadagputrackerbot")
    ? "canadagputrackerbot"
    : botUa.split("/")[0]?.toLowerCase() ?? botUa;

  let rules: RobotsRules = { allows: [], disallows: [] };
  let starRules: RobotsRules = { allows: [], disallows: [] };

  for (const block of blocks) {
    const match = block.agents.some(
      (a) => a === "*" || a === botName || botUa.includes(a)
    );
    if (!match) continue;
    if (block.agents.includes("*")) {
      starRules = {
        allows: [...starRules.allows, ...block.allows],
        disallows: [...starRules.disallows, ...block.disallows],
      };
    } else {
      rules = {
        allows: [...rules.allows, ...block.allows],
        disallows: [...rules.disallows, ...block.disallows],
      };
    }
  }

  if (rules.disallows.length === 0 && rules.allows.length === 0) {
    return starRules;
  }
  return {
    allows: [...rules.allows, ...starRules.allows],
    disallows: [...rules.disallows, ...starRules.disallows],
  };
}

function pathMatches(rule: string, path: string): boolean {
  if (!rule) return false;
  if (rule === "/") return path.startsWith("/");
  const pattern = rule.replace(/\*/g, ".*");
  try {
    return new RegExp(`^${pattern}`).test(path);
  } catch {
    return path.startsWith(rule);
  }
}

export function isPathAllowed(rules: RobotsRules, path: string): boolean {
  let bestAllow: string | null = null;
  let bestDisallow: string | null = null;

  for (const a of rules.allows) {
    if (pathMatches(a, path) && (!bestAllow || a.length > bestAllow.length)) {
      bestAllow = a;
    }
  }
  for (const d of rules.disallows) {
    if (pathMatches(d, path) && (!bestDisallow || d.length > bestDisallow.length)) {
      bestDisallow = d;
    }
  }

  if (bestAllow && !bestDisallow) return true;
  if (!bestAllow && bestDisallow) return false;
  if (bestAllow && bestDisallow) {
    return bestAllow.length >= bestDisallow.length;
  }
  return true;
}

export function parseRobotsForBot(text: string, userAgent: string): RobotsRules {
  if (text.trim().startsWith("<!") || text.toLowerCase().includes("<html")) {
    throw new Error("robots.txt returned HTML (likely bot challenge)");
  }
  return parseRobotsTxt(text, userAgent);
}