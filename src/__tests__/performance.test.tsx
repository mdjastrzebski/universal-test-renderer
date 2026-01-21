import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";
import { useState } from "react";

import { createRoot, setPerformanceMetricsEnabled } from "..";
import { act, renderWithAct, unmountWithAct } from "../test-utils/render";

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
    .filter((m) => m.name.startsWith("test-renderer:")) as PerformanceMark[];
}

function getTestRendererMeasures(): PerformanceMeasure[] {
  return performance
    .getEntriesByType("measure")
    .filter((m) => m.name.startsWith("test-renderer:")) as PerformanceMeasure[];
}

describe("performance metrics", () => {
  test("does not log marks when disabled", async () => {
    const root = createRoot();
    await renderWithAct(root, <div />);

    expect(getTestRendererMarks()).toHaveLength(0);
    expect(getTestRendererMeasures()).toHaveLength(0);
  });

  test("logs marks when enabled", async () => {
    setPerformanceMetricsEnabled(true);
    const root = createRoot();
    await renderWithAct(root, <div />);

    const marks = getTestRendererMarks();
    expect(marks.length).toBeGreaterThan(0);
    expect(marks.some((m) => m.name === "test-renderer:createInstance")).toBe(true);
  });

  test("logs measures for createRoot", async () => {
    setPerformanceMetricsEnabled(true);
    createRoot();

    const measures = getTestRendererMeasures();
    expect(measures.some((m) => m.name === "test-renderer:createRoot")).toBe(true);
  });

  test("logs measures for render", async () => {
    setPerformanceMetricsEnabled(true);
    const root = createRoot();
    await renderWithAct(root, <div />);

    const measures = getTestRendererMeasures();
    expect(measures.some((m) => m.name === "test-renderer:render")).toBe(true);
  });

  test("logs measures for unmount", async () => {
    setPerformanceMetricsEnabled(true);
    const root = createRoot();
    await renderWithAct(root, <div />);
    await unmountWithAct(root);

    const measures = getTestRendererMeasures();
    expect(measures.some((m) => m.name === "test-renderer:unmount")).toBe(true);
  });

  test("captures details in createInstance mark", async () => {
    setPerformanceMetricsEnabled(true);
    const root = createRoot();
    await renderWithAct(root, <div data-testid="hello" />);

    const marks = getTestRendererMarks();
    const createMark = marks.find((m) => m.name === "test-renderer:createInstance");

    expect(createMark?.detail).toEqual({ type: "div", propKeys: ["data-testid"] });
  });

  test("captures details in createTextInstance mark", async () => {
    setPerformanceMetricsEnabled(true);
    const root = createRoot();
    await renderWithAct(root, <div>Hello World</div>);

    const marks = getTestRendererMarks();
    const textMark = marks.find((m) => m.name === "test-renderer:createTextInstance");

    expect(textMark?.detail).toEqual({ text: "Hello World" });
  });

  test("captures details in render measure", async () => {
    setPerformanceMetricsEnabled(true);
    const root = createRoot();
    await renderWithAct(root, <div />);

    const measures = getTestRendererMeasures();
    const renderMeasure = measures.find((m) => m.name === "test-renderer:render");

    expect(renderMeasure?.detail).toEqual({ elementType: "div" });
  });

  test("captures details in appendChild mark", async () => {
    setPerformanceMetricsEnabled(true);
    const root = createRoot();
    await renderWithAct(
      root,
      <div>
        <span />
      </div>,
    );

    const marks = getTestRendererMarks();
    const appendMarks = marks.filter((m) => m.name === "test-renderer:appendChild");

    expect(
      appendMarks.some((m) => m.detail.parentType === "div" && m.detail.childType === "span"),
    ).toBe(true);
  });

  test("logs commitUpdate mark on re-render with prop changes", async () => {
    setPerformanceMetricsEnabled(true);
    const root = createRoot();

    function Component() {
      const [count, setCount] = useState(0);
      return (
        <button onClick={() => setCount((c) => c + 1)} data-count={count}>
          Click
        </button>
      );
    }

    await renderWithAct(root, <Component />);
    performance.clearMarks();

    const button = root.container.children[0];
    if (typeof button === "string") {
      throw new Error("Expected button element");
    }
    await act(() => {
      (button.props.onClick as () => void)();
    });

    const marks = getTestRendererMarks();
    const updateMark = marks.find((m) => m.name === "test-renderer:commitUpdate");

    expect(updateMark).toBeDefined();
    expect(updateMark?.detail.type).toBe("button");
  });

  test("logs removeChild mark when element is removed", async () => {
    setPerformanceMetricsEnabled(true);
    const root = createRoot();

    await renderWithAct(
      root,
      <div>
        <span />
      </div>,
    );
    performance.clearMarks();

    await renderWithAct(root, <div />);

    const marks = getTestRendererMarks();
    const removeMark = marks.find((m) => m.name === "test-renderer:removeChild");

    expect(removeMark).toBeDefined();
    expect(removeMark?.detail).toEqual({ parentType: "div", childType: "span" });
  });
});
