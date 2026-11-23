export function formatCad(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  }).format(amount);
}

import type { Card, Store } from "../../../types/db";

const STORE_NAME_PREFIXES = [
  "Canada Computers ",
  "Memory Express ",
  "Best Buy ",
];

/** Display label for offer location rows (e.g. Edmonton Northgate, AB). */
export function formatOfferLocation(
  store: Store | null | undefined,
): string {
  if (!store) return "Online";
  let label = store.name.trim();
  for (const prefix of STORE_NAME_PREFIXES) {
    if (label.startsWith(prefix)) {
      label = label.slice(prefix.length).trim();
      break;
    }
  }
  if (!label) label = store.city;
  return `${label}, ${store.provinceCode}`;
}

export function formatCardSpec(card: Card): string | null {
  const parts: string[] = [];
  if (card.lengthMm != null) parts.push(`${card.lengthMm}mm`);
  if (card.slotWidth != null) parts.push(`${card.slotWidth}-slot`);
  if (card.cooling) parts.push(card.cooling);
  if (card.powerConnector) parts.push(card.powerConnector);
  if (card.psuWatts != null) parts.push(`${card.psuWatts}W PSU`);
  return parts.length ? parts.join(" · ") : null;
}

export function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}