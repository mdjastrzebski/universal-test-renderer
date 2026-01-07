import { beforeEach, expect, test } from "@jest/globals";
import { type ReactElement, useRef } from "react";

import { createRoot } from "../renderer";
import { renderWithAct } from "../test-utils/render";

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
});

test("createNodeMock is called when refs are used", async () => {
  const createNodeMock = jest.fn(() => ({}));
  const renderer = createRoot({ createNodeMock });

  const refCallback = jest.fn();
  await renderWithAct(renderer, <div ref={refCallback}>Hello</div>);

  expect(createNodeMock).toHaveBeenCalledTimes(1);
  // @ts-expect-error - jest mock typing
  const callArgs = createNodeMock.mock.calls[0]?.[0] as
    | { type: string; props: Record<string, unknown>; key: string | null }
    | undefined;
  expect(callArgs).toBeDefined();
  if (callArgs) {
    expect(callArgs.type).toBe("div");
    expect(callArgs.props).toMatchObject({ children: "Hello" });
    expect(callArgs.key).toBeNull();
  }
});

test("mock node is what gets exposed as the ref", async () => {
  const mockNode = { customProperty: "test-value" };
  const createNodeMock = jest.fn(() => mockNode);
  const renderer = createRoot({ createNodeMock });

  const refCallback = jest.fn();
  await renderWithAct(renderer, <div ref={refCallback}>Hello</div>);

  expect(refCallback).toHaveBeenCalledTimes(1);
  expect(refCallback).toHaveBeenCalledWith(mockNode);
  expect(refCallback.mock.calls[0]?.[0]).toBe(mockNode);
});

test("different elements get different mock nodes", async () => {
  const mockNodes: object[] = [];
  const createNodeMock = jest.fn((element: ReactElement) => {
    const mockNode = { type: element.type, id: mockNodes.length };
    mockNodes.push(mockNode);
    return mockNode;
  });
  const renderer = createRoot({ createNodeMock });

  const ref1 = jest.fn();
  const ref2 = jest.fn();
  await renderWithAct(
    renderer,
    <div>
      <span ref={ref1}>First</span>
      <div ref={ref2}>Second</div>
    </div>,
  );

  expect(createNodeMock).toHaveBeenCalledTimes(2);
  expect(ref1).toHaveBeenCalledWith(mockNodes[0]);
  expect(ref2).toHaveBeenCalledWith(mockNodes[1]);
  expect(mockNodes[0]).not.toBe(mockNodes[1]);
});

test("default behavior when createNodeMock is not provided", async () => {
  const renderer = createRoot();

  const refCallback = jest.fn();
  await renderWithAct(renderer, <div ref={refCallback}>Hello</div>);

  expect(refCallback).toHaveBeenCalledTimes(1);
  const receivedRef = refCallback.mock.calls[0]?.[0];
  expect(receivedRef).toEqual({});
  expect(typeof receivedRef).toBe("object");
});

test("createNodeMock receives correct element information", async () => {
  const createNodeMock = jest.fn(() => ({}));
  const renderer = createRoot({ createNodeMock });

  const refCallback = jest.fn();
  await renderWithAct(
    renderer,
    <div ref={refCallback} id="test-id" className="test-class" data-testid="test">
      Content
    </div>,
  );

  expect(createNodeMock).toHaveBeenCalledTimes(1);
  // @ts-expect-error - jest mock typing
  const callArgs = createNodeMock.mock.calls[0]?.[0] as
    | { type: string; props: Record<string, unknown>; key: string | null }
    | undefined;
  expect(callArgs).toBeDefined();
  if (callArgs) {
    expect(callArgs.type).toBe("div");
    expect(callArgs.props).toMatchObject({
      id: "test-id",
      className: "test-class",
      "data-testid": "test",
      children: "Content",
    });
    expect(callArgs.key).toBeNull();
  }
});

test("createNodeMock receives key parameter (currently always null)", async () => {
  const createNodeMock = jest.fn(() => ({}));
  const renderer = createRoot({ createNodeMock });

  const refCallback = jest.fn();
  await renderWithAct(
    renderer,
    <div ref={refCallback} key="test-key">
      Content
    </div>,
  );

  expect(createNodeMock).toHaveBeenCalledTimes(1);
  // @ts-expect-error - jest mock typing
  const callArgs = createNodeMock.mock.calls[0]?.[0] as
    | { type: string; props: Record<string, unknown>; key: string | null }
    | undefined;
  expect(callArgs).toBeDefined();
  if (callArgs) {
    // Note: Currently the key is always null in the implementation
    // This test verifies that the key parameter exists in the call signature
    expect(callArgs.key).toBeNull();
  }
});

test("mock node is stored and can be retrieved", async () => {
  const mockNode = { customProperty: "test" };
  const createNodeMock = jest.fn(() => mockNode);
  const renderer = createRoot({ createNodeMock });

  const refCallback = jest.fn();
  await renderWithAct(renderer, <div ref={refCallback}>Hello</div>);

  const receivedRef = refCallback.mock.calls[0]?.[0];
  expect(receivedRef).toBe(mockNode);
  expect(receivedRef).toEqual({ customProperty: "test" });
});

test("createNodeMock is called for each instance with a ref", async () => {
  const createNodeMock = jest.fn(() => ({}));
  const renderer = createRoot({ createNodeMock });

  const ref1 = jest.fn();
  const ref2 = jest.fn();
  const ref3 = jest.fn();
  await renderWithAct(
    renderer,
    <div>
      <span ref={ref1}>First</span>
      <div ref={ref2}>Second</div>
      <p ref={ref3}>Third</p>
    </div>,
  );

  expect(createNodeMock).toHaveBeenCalledTimes(3);
  // @ts-expect-error - jest mock typing
  const call1 = createNodeMock.mock.calls[0]?.[0] as
    | { type: string; props: Record<string, unknown>; key: string | null }
    | undefined;
  // @ts-expect-error - jest mock typing
  const call2 = createNodeMock.mock.calls[1]?.[0] as
    | { type: string; props: Record<string, unknown>; key: string | null }
    | undefined;
  // @ts-expect-error - jest mock typing
  const call3 = createNodeMock.mock.calls[2]?.[0] as
    | { type: string; props: Record<string, unknown>; key: string | null }
    | undefined;

  expect(call1).toBeDefined();
  expect(call2).toBeDefined();
  expect(call3).toBeDefined();

  if (call1) {
    expect(call1.type).toBe("span");
    expect(call1.props).toMatchObject({ children: "First" });
    expect(call1.key).toBeNull();
  }
  if (call2) {
    expect(call2.type).toBe("div");
    expect(call2.props).toMatchObject({ children: "Second" });
    expect(call2.key).toBeNull();
  }
  if (call3) {
    expect(call3.type).toBe("p");
    expect(call3.props).toMatchObject({ children: "Third" });
    expect(call3.key).toBeNull();
  }
});

test("createNodeMock is not called for elements without refs", async () => {
  const createNodeMock = jest.fn(() => ({}));
  const renderer = createRoot({ createNodeMock });

  await renderWithAct(
    renderer,
    <div>
      <span>No ref</span>
      <div>Also no ref</div>
    </div>,
  );

  expect(createNodeMock).not.toHaveBeenCalled();
});

test("createNodeMock works with useRef", async () => {
  const mockNode = { customProperty: "useRef-test" };
  const createNodeMock = jest.fn(() => mockNode);
  const renderer = createRoot({ createNodeMock });

  function ComponentWithRef() {
    const ref = useRef<HTMLDivElement>(null);
    return <div ref={ref}>Content</div>;
  }

  await renderWithAct(renderer, <ComponentWithRef />);

  expect(createNodeMock).toHaveBeenCalledTimes(1);
  // @ts-expect-error - jest mock typing
  const callArgs = createNodeMock.mock.calls[0]?.[0] as
    | { type: string; props: Record<string, unknown>; key: string | null }
    | undefined;
  expect(callArgs).toBeDefined();
  if (callArgs) {
    expect(callArgs.type).toBe("div");
    expect(callArgs.props).toMatchObject({ children: "Content" });
    expect(callArgs.key).toBeNull();
  }
});

test("createNodeMock is called for each element with a ref", async () => {
  const createNodeMock = jest.fn(() => ({}));
  const renderer = createRoot({ createNodeMock });

  const ref1 = jest.fn();
  const ref2 = jest.fn();
  await renderWithAct(
    renderer,
    <div>
      <span ref={ref1}>First</span>
      <span ref={ref2}>Second</span>
    </div>,
  );

  expect(createNodeMock).toHaveBeenCalledTimes(2);
  expect(ref1).toHaveBeenCalledTimes(1);
  expect(ref2).toHaveBeenCalledTimes(1);
});

test("createNodeMock can return different mock nodes for same element type", async () => {
  let callCount = 0;
  const createNodeMock = jest.fn(() => {
    callCount++;
    return { id: callCount };
  });
  const renderer = createRoot({ createNodeMock });

  const ref1 = jest.fn();
  const ref2 = jest.fn();
  await renderWithAct(
    renderer,
    <div>
      <div ref={ref1}>First div</div>
      <div ref={ref2}>Second div</div>
    </div>,
  );

  expect(createNodeMock).toHaveBeenCalledTimes(2);
  expect(ref1).toHaveBeenCalledWith({ id: 1 });
  expect(ref2).toHaveBeenCalledWith({ id: 2 });
});
