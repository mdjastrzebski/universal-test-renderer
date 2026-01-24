import type { ReactElement } from "react";
import { act as reactAct } from "react";

import type { HostElement } from "../host-element";
import type { Root } from "../renderer";

/** @internal */
export async function act<T>(callback: () => T | Promise<T>): Promise<T> {
  performance.mark("ACT:start");
  const result = await reactAct(async () => {
    performance.mark("ACT:sync start");
    const result = await callback();
    performance.mark("ACT:sync end");
    return result;
  });
  performance.mark("ACT:async end");
  return result;
}

/** @internal */
export async function renderWithAct(root: Root, element: ReactElement) {
  await act(() => {
    root.render(element);
  });
}

/** @internal */
export async function unmountWithAct(root: Root) {
  await act(() => {
    root.unmount();
  });
}

/** @internal */
export function getRootElement(renderer: Root): HostElement {
  const firstChild = renderer.container.children[0];
  if (typeof firstChild === "string") {
    throw new Error(`Root element should not be text (got "${firstChild}")`);
  }

  return firstChild;
}

/** @internal */
export function formatPerfEntries(entries: PerformanceEntry[]): string {
  const referenceTime = entries[0]?.startTime ?? 0;

  let result = "";
  for (const entry of entries) {
    const relativeTime = entry.startTime - referenceTime;
    if (entry.duration === 0) {
      result += `${relativeTime.toFixed(2)}ms: ${entry.name}${getEntryData(entry)}\n`;
    } else {
      result += `${relativeTime.toFixed(2)}ms (${entry.duration.toFixed(2)}ms): ${entry.name}${getEntryData(entry)}\n`;
    }
  }

  return result;
}

function getEntryData(entry: PerformanceEntry): string {
  if (!(entry instanceof PerformanceMark) && !(entry instanceof PerformanceMeasure)) {
    return "";
  }

  if (entry.detail == null) {
    return "";
  }

  if (typeof entry.detail !== "object") {
    return " " + JSON.stringify(entry.detail);
  }

  const entries = [];
  for (const [key, value] of Object.entries(entry.detail as Record<string, unknown>)) {
    entries.push(`${key}=${JSON.stringify(value)}`);
  }

  return ` (${entries.join(", ")})`;
}
