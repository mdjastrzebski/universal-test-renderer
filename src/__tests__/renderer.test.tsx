import { beforeEach, expect, test } from "@jest/globals";
import { createElement } from "react";

import { createRoot } from "../renderer";
import { renderWithAct } from "../test-utils/render";

beforeEach(() => {
  // @ts-expect-error global is not typed
  global.IS_REACT_ACT_ENVIRONMENT = true;
});

test("basic renderer usage", async () => {
  const renderer = createRoot();
  await renderWithAct(renderer, <div>Hello!</div>);
  expect(renderer.container).toMatchInlineSnapshot(`
    <>
      <div>
        Hello!
      </div>
    </>
  `);
});

test("render with single allowed text component", async () => {
  const renderer = createRoot({
    textComponents: ["Text"],
  });
  await renderWithAct(renderer, createElement("Text", null, "Hello!"));
  expect(renderer.container).toMatchInlineSnapshot(`
    <>
      <Text>
        Hello!
      </Text>
    </>
  `);

  await renderWithAct(
    renderer,
    <div>
      <hr />
    </div>,
  );
  expect(renderer.container).toMatchInlineSnapshot(`
    <>
      <div>
        <hr />
      </div>
    </>
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
  expect(renderer.container).toMatchInlineSnapshot(`
    <>
      <div>
        <A>
          Hello!
        </A>
        <B>
          Hi!
        </B>
      </div>
    </>
  `);

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
  expect(renderer.container).toMatchInlineSnapshot(`
    <>
      <div>
        <A>
          Hello!
        </A>
        <B>
          Hi!
        </B>
        <C>
          Hola!
        </C>
      </div>
    </>
  `);

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
  expect(renderer.container).toMatchInlineSnapshot(`< />`);
});

test("container with fragment", async () => {
  const renderer = createRoot();
  await renderWithAct(
    renderer,
    <>
      <div>Hello!</div>
      <span>World!</span>
    </>,
  );

  expect(renderer.container).toMatchInlineSnapshot(`
    <>
      <div>
        Hello!
      </div>
      <span>
        World!
      </span>
    </>
  `);

  expect(renderer.container.toJSON()).toMatchInlineSnapshot(`
    <>
      <div>
        Hello!
      </div>
      <span>
        World!
      </span>
    </>
  `);
});
