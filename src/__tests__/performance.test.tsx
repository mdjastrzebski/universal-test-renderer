import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";
import * as React from "react";

import { createRoot, setPerformanceMetricsEnabled } from "..";
import { act, formatPerfEntries, renderWithAct, unmountWithAct } from "../test-utils/render";

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  performance.clearMarks();
  performance.clearMeasures();
  setPerformanceMetricsEnabled(false);
});

afterEach(() => {
  setPerformanceMetricsEnabled(false);
});

function getPerfMarks(): PerformanceMark[] {
  return performance.getEntriesByType("mark") as PerformanceMark[];
}

function getPerfMeasures(): PerformanceMeasure[] {
  return performance.getEntriesByType("measure") as PerformanceMeasure[];
}

describe("performance metrics", () => {
  test("does not log marks when disabled", async () => {
    const root = createRoot();
    await renderWithAct(root, <div />);
    expect(getPerfMeasures().filter((m) => m.name.startsWith("test-renderer/"))).toEqual([]);
  });

  test("logs marks and measures for render", async () => {
    setPerformanceMetricsEnabled(true);
    const root = createRoot();
    await renderWithAct(root, <div>Hello!</div>);

    const marks = getPerfMarks();
    expect(marks.some((m) => m.name === "test-renderer/createRoot:start")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer/createRoot:end")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer/render:start")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer/render:end")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer/react/commit:start")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer/react/commit:end")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer/reconciler/createInstance")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer/reconciler/createTextInstance")).toBe(true);

    const measures = getPerfMeasures();
    expect(measures.some((m) => m.name === "test-renderer/createRoot")).toBe(true);
    expect(measures.some((m) => m.name === "test-renderer/render")).toBe(true);
    expect(measures.some((m) => m.name === "test-renderer/react/commit")).toBe(true);

    performance.clearMarks();
    performance.clearMeasures();

    await renderWithAct(root, <div>Hello World!</div>);
    const marks2 = getPerfMarks();
    expect(marks2.some((m) => m.name === "test-renderer/render:start")).toBe(true);
    expect(marks2.some((m) => m.name === "test-renderer/render:end")).toBe(true);
    expect(marks2.some((m) => m.name === "test-renderer/react/commit:start")).toBe(true);
    expect(marks2.some((m) => m.name === "test-renderer/react/commit:end")).toBe(true);
    expect(marks2.some((m) => m.name === "test-renderer/reconciler/commitTextUpdate")).toBe(true);
    expect(marks2.some((m) => m.name === "test-renderer/reconciler/commitUpdate")).toBe(true);
  });

  function TestComponent() {
    const [count, setCount] = React.useState(0);
    return (
      <div
        onClick={() => {
          setCount(count + 1);
        }}
      >
        Hello! {count}
      </div>
    );
  }

  test("logs marks and measures for events", async () => {
    const root = createRoot();
    await renderWithAct(root, <TestComponent />);

    setPerformanceMetricsEnabled(true);

    await act(() => {
      const child = root.container.children[0];
      if (typeof child !== "string") {
        const onClick = child.props.onClick as () => void;
        onClick();
      }
    });

    const marks = getPerfMarks();
    expect(marks.some((m) => m.name === "test-renderer/render:start")).toBe(false);
    expect(marks.some((m) => m.name === "test-renderer/render:end")).toBe(false);
    expect(marks.some((m) => m.name === "test-renderer/react/commit:start")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer/react/commit:end")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer/reconciler/commitTextUpdate")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer/reconciler/commitUpdate")).toBe(true);
  });

  test("logs marks and measures for unmount", async () => {
    const root = createRoot();
    await renderWithAct(root, <div />);

    setPerformanceMetricsEnabled(true);
    performance.clearMarks();
    performance.clearMeasures();
    await unmountWithAct(root);

    const marks = getPerfMarks();
    expect(marks.some((m) => m.name === "test-renderer/unmount:start")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer/unmount:end")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer/react/commit:start")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer/react/commit:end")).toBe(true);
    expect(formatPerfEntries(marks)).toMatchInlineSnapshot(`
      "0.00ms: ACT:start
      0.01ms: ACT:sync start
      0.06ms: test-renderer/unmount:start
      0.08ms: test-renderer/reconciler/resolveUpdatePriority (priority=32)
      0.11ms: test-renderer/reconciler/scheduleMicrotask (id=12)
      0.12ms: test-renderer/unmount:end
      0.15ms: test-renderer/reconciler/scheduled microtask:start (id=12)
      0.16ms: test-renderer/reconciler/scheduled microtask:end (id=12)
      0.17ms: ACT:sync end
      0.19ms: test-renderer/reconciler/getRootHostContext
      0.24ms: test-renderer/reconciler/setCurrentUpdatePriority (priority=2)
      0.29ms: test-renderer/reconciler/setCurrentUpdatePriority (priority=2)
      0.30ms: test-renderer/reconciler/prepareForCommit
      0.30ms: test-renderer/react/commit:start
      0.51ms: test-renderer/reconciler/removeChildFromContainer (childType="div")
      0.54ms: test-renderer/react/commit:end
      0.56ms: test-renderer/reconciler/resetAfterCommit
      0.56ms: test-renderer/reconciler/setCurrentUpdatePriority (priority=2)
      0.57ms: test-renderer/reconciler/scheduleMicrotask (id=13)
      0.58ms: test-renderer/reconciler/setCurrentUpdatePriority (priority=0)
      0.60ms: test-renderer/reconciler/setCurrentUpdatePriority (priority=32)
      0.76ms: test-renderer/reconciler/detachDeletedInstance
      0.88ms: test-renderer/reconciler/setCurrentUpdatePriority (priority=0)
      0.91ms: test-renderer/reconciler/scheduled microtask:start (id=13)
      0.91ms: test-renderer/reconciler/scheduled microtask:end (id=13)
      0.95ms: ACT:async end
      "
    `);

    const measures = getPerfMeasures();
    expect(measures.some((m) => m.name === "test-renderer/unmount")).toBe(true);
    expect(measures.some((m) => m.name === "test-renderer/react/commit")).toBe(true);
  });
});
