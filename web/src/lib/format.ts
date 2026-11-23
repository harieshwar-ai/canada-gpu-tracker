export function formatCad(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  }).format(amount);
}

import type { Card } from "../../../types/db";

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