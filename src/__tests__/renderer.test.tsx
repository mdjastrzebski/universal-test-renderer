import { act, createElement, ReactElement } from "react";
import { expect, test } from "@jest/globals";
import { createRoot, RootOptions } from "../renderer";

const originalConsoleError = console.error;

beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

function renderWithAct(element: ReactElement, options?: RootOptions) {
  const renderer = createRoot(options);
  act(() => {
    renderer.render(element);
  });
  return renderer;
}

test("basic renderer usage", () => {
  const renderer = renderWithAct(<div>Hello!</div>, {});
  expect(renderer.root?.toJSON()).toMatchInlineSnapshot(`
<div>
  Hello!
</div>
`);
});

test("renderer supports legacyRoot: true option", () => {
  const renderer = renderWithAct(<div>Hello!</div>, { legacyRoot: true });
  expect(renderer.root?.toJSON()).toMatchInlineSnapshot(`
<div>
  Hello!
</div>
`);
});

test("renderer supports legacyRoot: false  option", () => {
  const renderer = renderWithAct(<div>Hello!</div>, { legacyRoot: false });
  expect(renderer.root?.toJSON()).toMatchInlineSnapshot(`
<div>
  Hello!
</div>
`);
});

test("render with single allowed text component", () => {
  let renderer = renderWithAct(createElement("Text", null, "Hello!"), {
    textComponents: ["Text"],
  });
  expect(renderer.root?.toJSON()).toMatchInlineSnapshot(`
<Text>
  Hello!
</Text>
`);

  renderer = renderWithAct(
    <div>
      <hr />
    </div>,
    { textComponents: ["Text"] }
  );
  expect(renderer.root?.toJSON()).toMatchInlineSnapshot(`
<div>
  <hr />
</div>
`);

  expect(() => {
    act(() => {
      renderer.render(<div>Hello!</div>);
    });
  }).toThrowErrorMatchingInlineSnapshot(
    `"Invariant Violation: Text strings must be rendered within a <Text> component. Detected attempt to render "Hello!" string within a <div> component."`
  );
});

test("render with two allowed text components", () => {
  const renderer = renderWithAct(
    <div>
      {createElement("A", null, "Hello!")}
      {createElement("B", null, "Hi!")}
    </div>,
    { textComponents: ["A", "B"] }
  );
  expect(renderer.root?.toJSON()).toMatchInlineSnapshot(`
<div>
  <A>
    Hello!
  </A>
  <B>
    Hi!
  </B>
</div>
`);

  expect(() => {
    act(() => {
      renderer.render(createElement("X", null, "Hello!"));
    });
  }).toThrowErrorMatchingInlineSnapshot(
    `"Invariant Violation: Text strings must be rendered within a <A> or <B> component. Detected attempt to render "Hello!" string within a <X> component."`
  );
});

test("render with multiple allowed text components", () => {
  const renderer = renderWithAct(
    <div>
      {createElement("A", null, "Hello!")}
      {createElement("B", null, "Hi!")}
      {createElement("C", null, "Hola!")}
    </div>,
    { textComponents: ["A", "B", "C"] }
  );

  expect(() => {
    act(() => {
      renderer.render(createElement("X", null, "Hello!"));
    });
  }).toThrowErrorMatchingInlineSnapshot(
    `"Invariant Violation: Text strings must be rendered within a <A>, <B>, or <C> component. Detected attempt to render "Hello!" string within a <X> component."`
  );
});
