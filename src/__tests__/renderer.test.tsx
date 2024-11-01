import { act, createElement, ReactElement } from "react";
import { expect, test } from "@jest/globals";
import { createRenderer, RendererOptions } from "../renderer";

const originalConsoleError = console.error;

beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

function renderWithAct(element: ReactElement, options?: RendererOptions) {
  const renderer = createRenderer(options);
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

test("renderer supports isConcurrent: true option", () => {
  const renderer = renderWithAct(<div>Hello!</div>, { isConcurrent: true });
  expect(renderer.root?.toJSON()).toMatchInlineSnapshot(`
<div>
  Hello!
</div>
`);
});

test("renderer supports isConcurrent: false  option", () => {
  const renderer = renderWithAct(<div>Hello!</div>, { isConcurrent: false });
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

  expect(() =>
    { act(() => { renderer.render(<div>Hello!</div>); }); }
  ).toThrowErrorMatchingInlineSnapshot(
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

  expect(() =>
    { renderer.render(createElement("X", null, "Hello!")); }
  ).toThrowErrorMatchingInlineSnapshot(
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

  expect(() =>
    { renderer.render(createElement("X", null, "Hello!")); }
  ).toThrowErrorMatchingInlineSnapshot(
    `"Invariant Violation: Text strings must be rendered within a <A>, <B>, or <C> component. Detected attempt to render "Hello!" string within a <X> component."`
  );
});
