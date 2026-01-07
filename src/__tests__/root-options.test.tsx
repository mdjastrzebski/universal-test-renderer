import { beforeEach, expect, jest, test } from "@jest/globals";
import { Component, useEffect, useId } from "react";

import { createRoot } from "../renderer";
import { renderWithAct } from "../test-utils/render";

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
});

test("isStrictMode option enables strict mode", async () => {
  let renderCount = 0;
  let effectCount = 0;

  function Counter() {
    renderCount++;
    useEffect(() => {
      effectCount++;
    }, []);
    return <div>Count: {renderCount}</div>;
  }

  const renderer = createRoot({ isStrictMode: true });
  await renderWithAct(renderer, <Counter />);

  // In strict mode, components render twice and effects run twice
  expect(renderCount).toBe(2);
  expect(effectCount).toBe(2);
});

test("identifierPrefix option prefixes useId values", async () => {
  let capturedId: string | undefined;

  function ComponentWithId() {
    capturedId = useId();
    return <div id={capturedId}>Content</div>;
  }

  const renderer = createRoot({ identifierPrefix: "test-prefix-" });
  await renderWithAct(renderer, <ComponentWithId />);

  expect(capturedId).toBeDefined();
  expect(capturedId).toContain("test-prefix-");
});

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

test("onCaughtError is called when error is caught by Error Boundary", async () => {
  const onCaughtError = jest.fn();

  function ThrowingComponent(): React.ReactNode {
    throw new Error("Test caught error");
  }

  const renderer = createRoot({ onCaughtError });
  await renderWithAct(
    renderer,
    <ErrorBoundary fallback={<div>Error caught</div>}>
      <ThrowingComponent />
    </ErrorBoundary>,
  );

  expect(renderer.container).toMatchInlineSnapshot(`
    <>
      <div>
        Error caught
      </div>
    </>
  `);

  expect(onCaughtError).toHaveBeenCalledTimes(1);
  expect(onCaughtError.mock.calls[0]?.[0]).toBeInstanceOf(Error);
  expect((onCaughtError.mock.calls[0]?.[0] as Error).message).toBe("Test caught error");
});
