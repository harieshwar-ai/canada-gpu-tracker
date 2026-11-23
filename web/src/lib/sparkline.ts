export function sparklineSvg(
  points: number[],
  width = 120,
  height = 28
): string {
  if (points.length === 0) {
    return `<svg class="sparkline" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-hidden="true"></svg>`;
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const pad = 2;
  const xStep = (width - pad * 2) / Math.max(points.length - 1, 1);
  const d = points
    .map((p, i) => {
      const x = pad + i * xStep;
      const y =
        max === min
          ? height / 2
          : height - pad - ((p - min) / (max - min)) * (height - pad * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return `<svg class="sparkline" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
}

export function pricesFromHistory(
  observations: { price: number; t: string }[]
): number[] {
  return observations.map((p) => p.price);
}