import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";

import { createRoot, setPerformanceMetricsEnabled } from "..";
import { renderWithAct, unmountWithAct } from "../test-utils/render";

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

  test("logs marks and measures for render", async () => {
    setPerformanceMetricsEnabled(true);
    const root = createRoot();
    await renderWithAct(root, <div>Hello!</div>);

    const marks = getTestRendererMarks();
    expect(marks.some((m) => m.name === "test-renderer:createRoot:start")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer:createRoot:end")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer:render:start")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer:render:end")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer:react:commit:start")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer:react:commit:end")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer:reconciler:createInstance")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer:reconciler:createTextInstance")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer:reconciler:prepareForCommit")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer:reconciler:resetAfterCommit")).toBe(true);

    const measures = getTestRendererMeasures();
    expect(measures.some((m) => m.name === "test-renderer:createRoot")).toBe(true);
    expect(measures.some((m) => m.name === "test-renderer:render")).toBe(true);
    expect(measures.some((m) => m.name === "test-renderer:react:commit")).toBe(true);
  });

  test("logs marks and measures for unmount", async () => {
    const root = createRoot();
    await renderWithAct(root, <div />);

    setPerformanceMetricsEnabled(true);
    await unmountWithAct(root);

    const marks = getTestRendererMarks();
    expect(marks.some((m) => m.name === "test-renderer:unmount:start")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer:unmount:end")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer:react:commit:start")).toBe(true);
    expect(marks.some((m) => m.name === "test-renderer:react:commit:end")).toBe(true);

    const measures = getTestRendererMeasures();
    expect(measures.some((m) => m.name === "test-renderer:unmount")).toBe(true);
    expect(measures.some((m) => m.name === "test-renderer:react:commit")).toBe(true);
  });
});
