import { beforeEach, expect, test } from "@jest/globals";
import { Suspense, use } from "react";

import { createRoot } from "../renderer";
import { act, renderWithAct } from "../test-utils/render";

beforeEach(() => {
  // @ts-expect-error global is not typed
  global.IS_REACT_ACT_ENVIRONMENT = true;
});

test("Suspense renders content directly when no async operation", async () => {
  const renderer = createRoot();
  await renderWithAct(
    renderer,
    <Suspense fallback={<div>Loading...</div>}>
      <div>Content</div>
    </Suspense>,
  );

  expect(renderer.container).toMatchInlineSnapshot(`
    <>
      <div>
        Content
      </div>
    </>
  `);
});

test("Suspense shows fallback and then content", async () => {
  let resolvePromise: (value: string) => void;
  const promise = new Promise<string>((resolve) => {
    resolvePromise = resolve;
  });

  function AsyncComponent() {
    const data = use(promise);
    return <div>Data: {data}</div>;
  }

  const renderer = createRoot();

  await renderWithAct(
    renderer,
    <Suspense fallback={<div>Loading...</div>}>
      <AsyncComponent />
    </Suspense>,
  );

  expect(renderer.container).toMatchInlineSnapshot(`
    <>
      <div>
        Loading...
      </div>
    </>
  `);

  await act(() => {
    resolvePromise!("Hello World");
  });

  expect(renderer.container).toMatchInlineSnapshot(`
    <>
      <div>
        Data: 
        Hello World
      </div>
    </>
  `);
});

test("Suspense waits for all promises to resolve", async () => {
  let resolvePromise1: (value: string) => void;
  let resolvePromise2: (value: number) => void;

  const promise1 = new Promise<string>((resolve) => {
    resolvePromise1 = resolve;
  });

  const promise2 = new Promise<number>((resolve) => {
    resolvePromise2 = resolve;
  });

  function AsyncComponent1() {
    const data = use(promise1);
    return <span>First: {data}</span>;
  }

  function AsyncComponent2() {
    const data = use(promise2);
    return <span>Second: {data}</span>;
  }

  const renderer = createRoot();

  await renderWithAct(
    renderer,
    <Suspense fallback={<div>Loading...</div>}>
      <AsyncComponent1 />
      <AsyncComponent2 />
    </Suspense>,
  );

  expect(renderer.container).toMatchInlineSnapshot(`
    <>
      <div>
        Loading...
      </div>
    </>
  `);

  await act(() => {
    resolvePromise1!("Alpha");
  });

  expect(renderer.container).toMatchInlineSnapshot(`
    <>
      <div>
        Loading...
      </div>
    </>
  `);

  await act(() => {
    resolvePromise2!(42);
  });

  expect(renderer.container).toMatchInlineSnapshot(`
    <>
      <span>
        First: 
        Alpha
      </span>
      <span>
        Second: 
        42
      </span>
    </>
  `);
});

test("React.use with already resolved promise", async () => {
  const resolvedPromise = Promise.resolve("Resolved");

  function AsyncComponent() {
    const data = use(resolvedPromise);
    return <div>{data}</div>;
  }

  const renderer = createRoot();
  await renderWithAct(
    renderer,
    <Suspense fallback={<div>Loading...</div>}>
      <AsyncComponent />
    </Suspense>,
  );

  expect(renderer.container).toMatchInlineSnapshot(`
    <>
      <div>
        Resolved
      </div>
    </>
  `);
});

test("React.use with rejected promise throws error", async () => {
  const rejectedPromise = Promise.reject(new Error("Test error"));

  function AsyncComponent() {
    // React.use throws a Suspense exception that cannot be caught in try/catch
    // The error will propagate to the nearest error boundary or cause the render to fail
    const data = use(rejectedPromise);
    return <div>{data}</div>;
  }

  const renderer = createRoot();

  await expect(
    renderWithAct(
      renderer,
      <Suspense fallback={<div>Loading...</div>}>
        <AsyncComponent />
      </Suspense>,
    ),
  ).rejects.toThrowErrorMatchingInlineSnapshot(`"Test error"`);
});

test("Suspense with nested boundaries", async () => {
  let resolveOuter: (value: string) => void;
  let resolveInner: (value: string) => void;

  const outerPromise = new Promise<string>((resolve) => {
    resolveOuter = resolve;
  });

  const innerPromise = new Promise<string>((resolve) => {
    resolveInner = resolve;
  });

  function OuterComponent() {
    const data = use(outerPromise);
    return (
      <div>
        Outer: {data}
        <Suspense fallback={<span>Inner loading...</span>}>
          <InnerComponent />
        </Suspense>
      </div>
    );
  }

  function InnerComponent() {
    const data = use(innerPromise);
    return <span>Inner: {data}</span>;
  }

  const renderer = createRoot();

  await renderWithAct(
    renderer,
    <Suspense fallback={<div>Outer loading...</div>}>
      <OuterComponent />
    </Suspense>,
  );

  // Initially should show outer fallback
  expect(renderer.container).toMatchInlineSnapshot(`
    <>
      <div>
        Outer loading...
      </div>
    </>
  `);

  // Resolve outer promise
  await act(async () => {
    resolveOuter!("Outer Data");
    await outerPromise;
  });

  // Should show outer content with inner fallback
  expect(renderer.container).toMatchInlineSnapshot(`
    <>
      <div>
        Outer: 
        Outer Data
        <span>
          Inner loading...
        </span>
      </div>
    </>
  `);

  // Resolve inner promise
  await act(async () => {
    resolveInner!("Inner Data");
    await innerPromise;
  });

  // Should show both resolved
  expect(renderer.container).toMatchInlineSnapshot(`
    <>
      <div>
        Outer: 
        Outer Data
        <span>
          Inner: 
          Inner Data
        </span>
      </div>
    </>
  `);
});
