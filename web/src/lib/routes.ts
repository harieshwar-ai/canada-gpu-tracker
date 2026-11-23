/** Public URL slugs aligned with rtx.live patterns (internal store slugs unchanged). */

export function toPublicGpuSlug(internalSlug: string): string {
  if (internalSlug.startsWith("geforce-") || internalSlug.startsWith("rtx-pro")) {
    return internalSlug;
  }
  return `geforce-${internalSlug}`;
}

export function fromPublicGpuSlug(publicSlug: string): string {
  if (publicSlug.startsWith("geforce-")) {
    return publicSlug.slice("geforce-".length);
  }
  return publicSlug;
}

export function cardUrl(cardSlug: string): string {
  return `/cards/${cardSlug}/`;
}

export function gpuUrl(internalSlug: string): string {
  return `/gpus/${toPublicGpuSlug(internalSlug)}/`;
}