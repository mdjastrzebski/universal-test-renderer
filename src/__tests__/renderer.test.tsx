import { afterAll, beforeAll, expect, jest, test } from "@jest/globals";
import type { ReactElement } from "react";
import { act, createElement } from "react";

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

test("basic renderer usage", async() => {
  const renderer = createRoot();
  await renderWithAct(renderer, <div>Hello!</div>);
  expect(renderer.root?.toJSON()).toMatchInlineSnapshot(`
    <div>
      Hello!
    </div>
  `);
});

test("render with single allowed text component", async() => {
  const renderer = createRoot({
    textComponents: ["Text"],
  });
  await renderWithAct(renderer, createElement("Text", null, "Hello!"));
  expect(renderer.root?.toJSON()).toMatchInlineSnapshot(`
<Text>
  Hello!
</Text>
`);

  await renderWithAct(renderer,
    <div>
      <hr />
    </div>
  );
  expect(renderer.root?.toJSON()).toMatchInlineSnapshot(`
<div>
  <hr />
</div>
`);

  await expect(() =>
    renderWithAct(renderer, <div>Hello!</div>)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"Invariant Violation: Text strings must be rendered within a <Text> component. Detected attempt to render "Hello!" string within a <div> component."`,
  );
});

test("render with multiple allowed text components", async () => {
  const renderer = createRoot({
    textComponents: ["A", "B", "C"],
  });
  await renderWithAct(renderer,
    <div>
      {createElement("A", null, "Hello!")}
      {createElement("B", null, "Hi!")} 
      {createElement("C", null, "Hola!")}
    </div>
  );

  await expect(() => 
    renderWithAct(renderer, createElement("X", null, "Hello!"))
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"Invariant Violation: Text strings must be rendered within a <A>, <B>, or <C> component. Detected attempt to render "Hello!" string within a <X> component."`,
  );
});
