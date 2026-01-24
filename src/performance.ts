let _enableMetrics = false;

export function setPerformanceMetricsEnabled(enabled: boolean): void {
  _enableMetrics = enabled;
}

export function mark(name: string, details?: Record<string, unknown>): void {
  if (!_enableMetrics) {
    return;
  }

  performance.mark(`test-renderer/${name}`, { detail: details });
}

export function measureStart(name: string): void {
  if (!_enableMetrics) {
    return;
  }

  performance.mark(`test-renderer/${name}:start`);
}

export function measureEnd(name: string, details?: Record<string, unknown>): void {
  if (!_enableMetrics) {
    return;
  }

  performance.mark(`test-renderer/${name}:end`);
  performance.measure(`test-renderer/${name}`, {
    start: `test-renderer/${name}:start`,
    end: `test-renderer/${name}:end`,
    detail: details,
  });
}
