declare global {
  var TEST_RENDERER_ENABLE_PROFILING: boolean | undefined;
}

export function mark(name: string, details?: Record<string, unknown>): void {
  if (!globalThis.TEST_RENDERER_ENABLE_PROFILING) {
    return;
  }

  performance.mark(`test-renderer/${name}`, { detail: details });
}

export function measureStart(name: string): void {
  if (!globalThis.TEST_RENDERER_ENABLE_PROFILING) {
    return;
  }

  performance.mark(`test-renderer/${name}:start`);
}

export function measureEnd(name: string, details?: Record<string, unknown>): void {
  if (!globalThis.TEST_RENDERER_ENABLE_PROFILING) {
    return;
  }

  performance.mark(`test-renderer/${name}:end`);
  performance.measure(`test-renderer/${name}`, {
    start: `test-renderer/${name}:start`,
    end: `test-renderer/${name}:end`,
    detail: details,
  });
}
