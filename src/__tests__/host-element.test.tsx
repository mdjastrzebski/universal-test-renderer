/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { afterAll, beforeAll, expect, jest, test } from "@jest/globals";
import type { ReactElement } from "react";
import { act } from "react";

import { findSingle } from "../find";
import type { Root } from "../renderer";
import { createRoot } from "../renderer";

const originalConsoleError = console.error;

beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

async function renderWithAct(root: Root, element: ReactElement) {
  // eslint-disable-next-line @typescript-eslint/require-await -- intentionally triggering async act variant
  await act(async () => {
    root.render(element);
  });
}

test("root parent is null", async() => {
  const renderer = createRoot();
  await renderWithAct(renderer, <div>Hello!</div>);
  expect(renderer.root).toBeTruthy();
  expect(renderer.root?.parent).toBeNull();
});

test("root child parent is root", async() => {
    const renderer = createRoot();
    await renderWithAct(renderer, <div><div data-testid="inner">Hello!</div></div>);
    const firstChild = renderer.root!.children[0];
    expect(firstChild).toBeTruthy();
    // @ts-expect-error -- we know firstChild is a HostElement
    expect(firstChild.parent).toBe(renderer.root);

    const inner = findSingle(renderer.root!, (element) => element.props["data-testid"] === "inner");
    expect(inner).toBe(firstChild);
});

