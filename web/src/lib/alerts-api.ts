import type { AlertScope, ProductLine } from "../../../types/db";

/** Server/API contract (stub — no email, no secrets). */
export interface CreateAlertRequest {
  alertScope: AlertScope;
  cardSlug?: string;
  gpuSlug?: string;
  productLine?: ProductLine;
  targetPriceCad: number;
  maxDistanceKm?: number;
  postalCode?: string;
  contactEmail?: string;
}

export interface CreateAlertResponse {
  ok: boolean;
  id?: string;
  message: string;
}

export function validateAlertRequest(
  body: Partial<CreateAlertRequest>
): { ok: true; data: CreateAlertRequest } | { ok: false; message: string } {
  if (!body.alertScope) {
    return { ok: false, message: "alertScope is required" };
  }
  if (!body.targetPriceCad || body.targetPriceCad <= 0) {
    return { ok: false, message: "targetPriceCad must be positive" };
  }
  if (body.alertScope === "card" && !body.cardSlug) {
    return { ok: false, message: "cardSlug required for card alerts" };
  }
  if (body.alertScope === "gpu" && !body.gpuSlug) {
    return { ok: false, message: "gpuSlug required for GPU alerts" };
  }
  if (body.alertScope === "product_line" && !body.productLine) {
    return { ok: false, message: "productLine required for line alerts" };
  }
  if (body.maxDistanceKm != null && body.maxDistanceKm < 0) {
    return { ok: false, message: "maxDistanceKm must be non-negative" };
  }
  return { ok: true, data: body as CreateAlertRequest };
}

/** Client stub: pretends to POST /api/alerts (static site has no backend). */
export async function stubCreateAlert(
  req: CreateAlertRequest
): Promise<CreateAlertResponse> {
  const v = validateAlertRequest(req);
  if (!v.ok) return { ok: false, message: v.message };
  const id = `alert-stub-${Date.now()}`;
  const key = "cgt-alerts";
  const existing =
    typeof localStorage !== "undefined"
      ? JSON.parse(localStorage.getItem(key) ?? "[]")
      : [];
  existing.push({ id, ...v.data, createdAt: new Date().toISOString() });
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(key, JSON.stringify(existing));
  }
  return {
    ok: true,
    id,
    message:
      "Placeholder alert saved locally only (no email). Wire to API after compliance review.",
  };
}