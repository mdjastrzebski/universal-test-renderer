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

function getTestRendererMarks(): PerformanceMark[] {
  return performance
    .getEntriesByType("mark")
    .filter((m) => true || m.name.startsWith("test-renderer/")) as PerformanceMark[];
}

function getTestRendererMeasures(): PerformanceMeasure[] {
  return performance
    .getEntriesByType("measure")
    .filter((m) => true || m.name.startsWith("test-renderer/")) as PerformanceMeasure[];
}

describe("performance metrics", () => {
  test("does not log marks when disabled", async () => {
    const root = createRoot();
    await renderWithAct(root, <div />);

    expect(getTestRendererMarks()).toMatchInlineSnapshot(`
      [
        {
          "detail": null,
          "duration": 0,
          "entryType": "mark",
          "name": "ACT:start",
          "startTime": 3922.953585,
        },
        {
          "detail": null,
          "duration": 0,
          "entryType": "mark",
          "name": "ACT:sync start",
          "startTime": 3922.974903,
        },
        {
          "detail": null,
          "duration": 0,
          "entryType": "mark",
          "name": "ACT:sync end",
          "startTime": 3923.014747,
        },
        {
          "detail": null,
          "duration": 0,
          "entryType": "mark",
          "name": "ACT:async end",
          "startTime": 3923.41037,
        },
      ]
    `);
    expect(getTestRendererMeasures()).toMatchInlineSnapshot(`[]`);
  });

  test("logs marks and measures for render", async () => {
    setPerformanceMetricsEnabled(true);
    const root = createRoot();
    await renderWithAct(root, <div>Hello!</div>);

    const marks = getTestRendererMarks();
    expect(marks.some((m) => m.name === "test-renderer/createRoot:start")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer/createRoot:end")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer/render:start")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer/render:end")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer/react/commit:start")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer/react/commit:end")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer/reconciler/createInstance")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer/reconciler/createTextInstance")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer/reconciler/prepareForCommit")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer/reconciler/resetAfterCommit")).toBe(true);

    expect(formatPerfEntries(marks)).toMatchInlineSnapshot(`
      "0.00ms: test-renderer/createRoot:start
      0.07ms: test-renderer/createRoot:end
      0.33ms: ACT:start
      0.34ms: ACT:sync start
      0.34ms: test-renderer/render:start
      0.36ms: test-renderer/reconciler/resolveUpdatePriority (priority=32)
      0.44ms: test-renderer/reconciler/scheduleMicrotask (id=2)
      0.46ms: test-renderer/render:end
      0.48ms: ACT:sync end
      0.50ms: test-renderer/reconciler/scheduled microtask:start (id=2)
      0.52ms: test-renderer/reconciler/scheduled microtask:end (id=2)
      0.55ms: test-renderer/reconciler/getRootHostContext
      0.57ms: test-renderer/reconciler/getChildHostContext (type="div")
      0.59ms: test-renderer/reconciler/shouldSetTextContent (type="div")
      0.61ms: test-renderer/reconciler/createTextInstance (text="Hello!")
      0.63ms: test-renderer/reconciler/createInstance (type="div")
      0.64ms: test-renderer/reconciler/appendInitialChild (parentType="div", childType="text: \\"Hello!\\"")
      0.67ms: test-renderer/reconciler/finalizeInitialChildren (type="div")
      0.67ms: test-renderer/reconciler/maySuspendCommit (type="div")
      0.69ms: test-renderer/reconciler/setCurrentUpdatePriority (priority=2)
      0.70ms: test-renderer/reconciler/setCurrentUpdatePriority (priority=2)
      0.71ms: test-renderer/reconciler/prepareForCommit
      0.71ms: test-renderer/react/commit:start
      0.71ms: test-renderer/reconciler/clearContainer
      0.72ms: test-renderer/reconciler/appendChildToContainer (childType="div")
      0.73ms: test-renderer/react/commit:end
      0.74ms: test-renderer/reconciler/resetAfterCommit
      0.74ms: test-renderer/reconciler/setCurrentUpdatePriority (priority=2)
      0.76ms: test-renderer/reconciler/scheduleMicrotask (id=3)
      0.76ms: test-renderer/reconciler/setCurrentUpdatePriority (priority=0)
      0.78ms: test-renderer/reconciler/scheduled microtask:start (id=3)
      0.79ms: test-renderer/reconciler/scheduled microtask:end (id=3)
      0.85ms: ACT:async end
      "
    `);

    const measures = getTestRendererMeasures();
    expect(measures.some((m) => m.name === "test-renderer/createRoot")).toBe(true);
    expect(measures.some((m) => m.name === "test-renderer/render")).toBe(true);
    expect(measures.some((m) => m.name === "test-renderer/react/commit")).toBe(true);

    performance.clearMarks();
    performance.clearMeasures();

    await renderWithAct(root, <div>Hello World!</div>);
    const marks2 = getTestRendererMarks();
    expect(formatPerfEntries(marks2)).toMatchInlineSnapshot(`
      "0.00ms: ACT:start
      0.01ms: ACT:sync start
      0.02ms: test-renderer/render:start
      0.03ms: test-renderer/reconciler/resolveUpdatePriority (priority=32)
      0.05ms: test-renderer/reconciler/scheduleMicrotask (id=4)
      0.06ms: test-renderer/render:end
      0.08ms: ACT:sync end
      0.09ms: test-renderer/reconciler/scheduled microtask:start (id=4)
      0.10ms: test-renderer/reconciler/scheduled microtask:end (id=4)
      0.13ms: test-renderer/reconciler/getRootHostContext
      0.17ms: test-renderer/reconciler/getChildHostContext (type="div")
      0.19ms: test-renderer/reconciler/shouldSetTextContent (type="div")
      0.19ms: test-renderer/reconciler/shouldSetTextContent (type="div")
      0.27ms: test-renderer/reconciler/maySuspendCommit (type="div")
      0.28ms: test-renderer/reconciler/setCurrentUpdatePriority (priority=2)
      0.29ms: test-renderer/reconciler/setCurrentUpdatePriority (priority=2)
      0.30ms: test-renderer/reconciler/prepareForCommit
      0.30ms: test-renderer/react/commit:start
      0.34ms: test-renderer/reconciler/commitTextUpdate (oldText="Hello!", newText="Hello World!")
      0.40ms: test-renderer/reconciler/commitUpdate (type="div")
      0.41ms: test-renderer/react/commit:end
      0.43ms: test-renderer/reconciler/resetAfterCommit
      0.43ms: test-renderer/reconciler/setCurrentUpdatePriority (priority=2)
      0.44ms: test-renderer/reconciler/scheduleMicrotask (id=5)
      0.45ms: test-renderer/reconciler/setCurrentUpdatePriority (priority=0)
      0.47ms: test-renderer/reconciler/scheduled microtask:start (id=5)
      0.47ms: test-renderer/reconciler/scheduled microtask:end (id=5)
      0.58ms: ACT:async end
      "
    `);
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
      // @ts-expect-error - Unsafe call of a(n) `error` type typed value.
      // @eslint-disable-next-line @typescript-eslint/no-unsafe-call
      root.container.children[0]?.props.onClick();
    });

    const marks = getTestRendererMarks();
    expect(formatPerfEntries(marks)).toMatchInlineSnapshot(`
      "0.00ms: ACT:start
      0.01ms: ACT:sync start
      0.03ms: ACT:sync end
      0.39ms: ACT:async end
      0.53ms: test-renderer/reconciler/resolveUpdatePriority (priority=32)
      0.65ms: test-renderer/reconciler/scheduleMicrotask (id=8)
      0.71ms: test-renderer/reconciler/scheduled microtask:start (id=8)
      0.72ms: test-renderer/reconciler/scheduled microtask:end (id=8)
      0.85ms: test-renderer/reconciler/getRootHostContext
      1.10ms: test-renderer/reconciler/getChildHostContext (type="div")
      1.12ms: test-renderer/reconciler/shouldSetTextContent (type="div")
      1.12ms: test-renderer/reconciler/shouldSetTextContent (type="div")
      1.30ms: test-renderer/reconciler/maySuspendCommit (type="div")
      1.32ms: test-renderer/reconciler/setCurrentUpdatePriority (priority=2)
      1.33ms: test-renderer/reconciler/setCurrentUpdatePriority (priority=2)
      1.34ms: test-renderer/reconciler/prepareForCommit
      1.34ms: test-renderer/react/commit:start
      1.35ms: test-renderer/reconciler/commitTextUpdate (oldText="0", newText="1")
      1.36ms: test-renderer/reconciler/commitUpdate (type="div")
      1.37ms: test-renderer/react/commit:end
      1.38ms: test-renderer/reconciler/resetAfterCommit
      1.40ms: test-renderer/reconciler/setCurrentUpdatePriority (priority=2)
      1.41ms: test-renderer/reconciler/scheduleMicrotask (id=9)
      1.42ms: test-renderer/reconciler/setCurrentUpdatePriority (priority=0)
      1.44ms: test-renderer/reconciler/scheduled microtask:start (id=9)
      1.45ms: test-renderer/reconciler/scheduled microtask:end (id=9)
      "
    `);
  });

  test("logs marks and measures for unmount", async () => {
    const root = createRoot();
    await renderWithAct(root, <div />);

    setPerformanceMetricsEnabled(true);
    await unmountWithAct(root);

    const marks = getTestRendererMarks();
    expect(marks.some((m) => m.name === "test-renderer/unmount:start")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer/unmount:end")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer/react/commit:start")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer/react/commit:end")).toBe(true);

    const measures = getTestRendererMeasures();
    expect(measures.some((m) => m.name === "test-renderer/unmount")).toBe(true);
    expect(measures.some((m) => m.name === "test-renderer/react/commit")).toBe(true);
  });
});
