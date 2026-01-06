import { beforeEach, expect, test } from "@jest/globals";

import { createRoot } from "../renderer";
import { renderWithAct, unmountWithAct } from "../test-utils/render";

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
});

test("unmount clears the rendered content", async () => {
  const renderer = createRoot();
  await renderWithAct(renderer, <div>Hello!</div>);

  const containerElement = renderer.container;
  expect(containerElement.children.length).toBe(1);

  await unmountWithAct(renderer);
  expect(containerElement.children.length).toBe(0);

  expect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    renderer.container;
  }).toThrow("Can't access .container on unmounted test renderer");
});

test("unmount can be called multiple times safely", async () => {
  const renderer = createRoot();
  await renderWithAct(renderer, <div>Hello!</div>);

  const containerElement = renderer.container;
  expect(containerElement.children.length).toBe(1);

  await unmountWithAct(renderer);
  await unmountWithAct(renderer);
  await unmountWithAct(renderer);
  expect(containerElement.children.length).toBe(0);

  expect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    renderer.container;
  }).toThrow("Can't access .container on unmounted test renderer");
});

test("unmount when nothing is rendered", async () => {
  const renderer = createRoot();

  await expect(() => unmountWithAct(renderer)).resolves.not.toThrow();

  expect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    renderer.container;
  }).toThrow("Can't access .container on unmounted test renderer");
});

test("cannot render after unmount", async () => {
  const renderer = createRoot();
  await renderWithAct(renderer, <div>Hello!</div>);

  await unmountWithAct(renderer);

  await expect(
    renderWithAct(renderer, <div>New content</div>),
  ).rejects.toThrowErrorMatchingInlineSnapshot(`"Cannot render after unmount"`);
});
