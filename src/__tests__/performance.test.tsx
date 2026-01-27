import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";
import * as React from "react";

import { createRoot } from "..";
import { act, renderWithAct, unmountWithAct } from "../test-utils/render";

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  globalThis.TEST_RENDERER_ENABLE_PROFILING = false;
  performance.clearMarks();
  performance.clearMeasures();
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
    globalThis.TEST_RENDERER_ENABLE_PROFILING = true;

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

    globalThis.TEST_RENDERER_ENABLE_PROFILING = true;

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

    globalThis.TEST_RENDERER_ENABLE_PROFILING = true;

    await unmountWithAct(root);

    const marks = getPerfMarks();
    expect(marks.some((m) => m.name === "test-renderer/unmount:start")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer/unmount:end")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer/react/commit:start")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer/react/commit:end")).toBe(true);

    const measures = getPerfMeasures();
    expect(measures.some((m) => m.name === "test-renderer/unmount")).toBe(true);
    expect(measures.some((m) => m.name === "test-renderer/react/commit")).toBe(true);
  });
});
