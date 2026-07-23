type Labels = Record<string, string>;

function labelKey(labels: Labels): string {
  return Object.entries(labels)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join(",");
}

/** Deterministic local metrics for tests (complements OTel meters). */
export class MetricsRegistry {
  readonly counters = new Map<string, number>();
  readonly histograms = new Map<string, number[]>();

  add(name: string, value: number, labels: Labels = {}): void {
    const key = `${name}|${labelKey(labels)}`;
    this.counters.set(key, (this.counters.get(key) ?? 0) + value);
  }

  record(name: string, value: number, labels: Labels = {}): void {
    const key = `${name}|${labelKey(labels)}`;
    const list = this.histograms.get(key) ?? [];
    list.push(value);
    this.histograms.set(key, list);
  }

  counterTotal(name: string, labels: Labels = {}): number {
    return this.counters.get(`${name}|${labelKey(labels)}`) ?? 0;
  }

  histogramValues(name: string, labels: Labels = {}): number[] {
    return [...(this.histograms.get(`${name}|${labelKey(labels)}`) ?? [])];
  }

  reset(): void {
    this.counters.clear();
    this.histograms.clear();
  }
}

export const localMetrics = new MetricsRegistry();
