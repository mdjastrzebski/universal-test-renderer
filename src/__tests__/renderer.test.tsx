import { afterAll, beforeAll, expect, jest, test } from "@jest/globals";
import { createElement } from "react";

import { createRoot } from "../renderer";
import { renderWithAct } from "../test-utils/render";

const originalConsoleError = console.error;

beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

test("basic renderer usage", async () => {
  const renderer = createRoot();
  await renderWithAct(renderer, <div>Hello!</div>);
  expect(renderer.root).toMatchInlineSnapshot(`
    <div>
      Hello!
    </div>
  `);
});

test("render with single allowed text component", async () => {
  const renderer = createRoot({
    textComponents: ["Text"],
  });
  await renderWithAct(renderer, createElement("Text", null, "Hello!"));
  expect(renderer.root).toMatchInlineSnapshot(`
    <Text>
      Hello!
    </Text>
  `);

  await renderWithAct(
    renderer,
    <div>
      <hr />
    </div>,
  );
  expect(renderer.root).toMatchInlineSnapshot(`
    <div>
      <hr />
    </div>
  `);

  await expect(() =>
    renderWithAct(renderer, <div>Hello!</div>),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"Invariant Violation: Text strings must be rendered within a <Text> component. Detected attempt to render "Hello!" string within a <div> component."`,
  );
});

test("render with two allowed text components", async () => {
  const renderer = createRoot({
    textComponents: ["A", "B"],
  });
  await renderWithAct(
    renderer,
    <div>
      {createElement("A", null, "Hello!")}
      {createElement("B", null, "Hi!")}
    </div>,
  );

  await expect(() =>
    renderWithAct(renderer, createElement("X", null, "Hello!")),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"Invariant Violation: Text strings must be rendered within a <A> or <B> component. Detected attempt to render "Hello!" string within a <X> component."`,
  );
});

test("render with multiple allowed text components", async () => {
  const renderer = createRoot({
    textComponents: ["A", "B", "C"],
  });
  await renderWithAct(
    renderer,
    <div>
      {createElement("A", null, "Hello!")}
      {createElement("B", null, "Hi!")}
      {createElement("C", null, "Hola!")}
    </div>,
  );

  await expect(() =>
    renderWithAct(renderer, createElement("X", null, "Hello!")),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"Invariant Violation: Text strings must be rendered within a <A>, <B>, or <C> component. Detected attempt to render "Hello!" string within a <X> component."`,
  );
});

function NullComponent() {
  return null;
}

test("handles component rendering null", async () => {
  const renderer = createRoot();
  await renderWithAct(renderer, <NullComponent />);
  expect(renderer.root).toMatchInlineSnapshot(`null`);
});

test("findAll should find all elements that match the predicate", async () => {
  const renderer = createRoot();
  await renderWithAct(
    renderer,
    <body>
      <div>Hello!</div>
      <span>World!</span>
      <div>Foo!</div>
    </body>,
  );

  const elements = renderer.findAll((element) => element.type === "div");
  expect(elements).toHaveLength(2);
  expect(elements[0]).toMatchInlineSnapshot(`
    <div>
      Hello!
    </div>
  `);
  expect(elements[1]).toMatchInlineSnapshot(`
    <div>
      Foo!
    </div>
  `);
});

test("findAll should find all elements that match the predicate with matchDeepestOnly option", async () => {
  const renderer = createRoot();
  await renderWithAct(
    renderer,
    <body>
      <div>
        Hello!
        <div>Bar!</div>
        <div>Baz!</div>
      </div>
      <span>World!</span>
    </body>,
  );

  const elements = renderer.findAll((element) => element.type === "div", {
    matchDeepestOnly: true,
  });
  expect(elements).toHaveLength(2);
  expect(elements[0]).toMatchInlineSnapshot(`
    <div>
      Bar!
    </div>
  `);
  expect(elements[1]).toMatchInlineSnapshot(`
    <div>
      Baz!
    </div>
  `);
});
