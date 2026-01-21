let enabled = false;

export function setPerformanceMetricsEnabled(value: boolean): void {
  enabled = value;
}

export function isPerformanceMetricsEnabled(): boolean {
  return enabled;
}

export function mark(name: string, details?: Record<string, unknown>): void {
  if (!enabled) return;
  performance.mark(`test-renderer:${name}`, { detail: details });
}

export function markStart(name: string): string {
  const markName = `test-renderer:${name}:start`;
  if (!enabled) return markName;
  performance.mark(markName);
  return markName;
}

export function measure(name: string, startMark: string, details?: Record<string, unknown>): void {
  if (!enabled) return;
  performance.mark(`test-renderer:${name}:end`);
  performance.measure(`test-renderer:${name}`, { start: startMark, detail: details });
}
