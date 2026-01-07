import { beforeEach, describe, expect, test } from "@jest/globals";
import { createElement } from "react";

import { createRoot } from "../renderer";
import { renderWithAct } from "../test-utils/render";

beforeEach(() => {
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

describe("textComponentTypes", () => {
  test("single allowed text component", async () => {
    const renderer = createRoot({
      textComponentTypes: ["Text"],
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

  test("two allowed text components", async () => {
    const renderer = createRoot({
      textComponentTypes: ["A", "B"],
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

  test("multiple allowed text components", async () => {
    const renderer = createRoot({
      textComponentTypes: ["A", "B", "C"],
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

  test("error message uses textComponentTypes when publicTextComponentTypes is not set", async () => {
    const renderer = createRoot({
      textComponentTypes: ["RCTText", "RCTVirtualText"],
    });

    await expect(() =>
      renderWithAct(renderer, <div>Hello!</div>),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Invariant Violation: Text strings must be rendered within a <RCTText> or <RCTVirtualText> component. Detected attempt to render "Hello!" string within a <div> component."`,
    );
  });

  test("error message uses publicTextComponentTypes when set", async () => {
    const renderer = createRoot({
      textComponentTypes: ["RCTText", "RCTVirtualText"],
      publicTextComponentTypes: ["Text"],
    });

    await renderWithAct(renderer, createElement("RCTText", null, "Hello!"));
    expect(renderer.container).toMatchInlineSnapshot(`
      <>
        <RCTText>
          Hello!
        </RCTText>
      </>
    `);

    await expect(() =>
      renderWithAct(renderer, <div>Hello!</div>),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Invariant Violation: Text strings must be rendered within a <Text> component. Detected attempt to render "Hello!" string within a <div> component."`,
    );
  });
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
