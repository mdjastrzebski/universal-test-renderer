import { beforeEach, expect, test } from "@jest/globals";
import { Activity } from "react";
import React from "react";

import { createRoot } from "../renderer";
import { act, renderWithAct } from "../test-utils/render";

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
});

test("Activity renders content with default mode", async () => {
  const renderer = createRoot();
  await renderWithAct(
    renderer,
    <Activity>
      <div>Content</div>
    </Activity>,
  );

  expect(renderer.container).toMatchInlineSnapshot(`
    <>
      <div>
        Content
      </div>
    </>
  `);
});

test("Activity renders content with visible mode", async () => {
  const renderer = createRoot();
  await renderWithAct(
    renderer,
    <Activity mode="visible">
      <div>Visible Content</div>
    </Activity>,
  );

  expect(renderer.container).toMatchInlineSnapshot(`
    <>
      <div>
        Visible Content
      </div>
    </>
  `);
});

test("Activity with hidden mode", async () => {
  const renderer = createRoot();
  await renderWithAct(
    renderer,
    <Activity mode="hidden">
      <div>Hidden Content</div>
    </Activity>,
  );

  expect(renderer.container).toMatchInlineSnapshot(`< />`);
});

test("Activity with name prop", async () => {
  const renderer = createRoot();
  await renderWithAct(
    renderer,
    <Activity name="TestActivity">
      <div>Named Content</div>
    </Activity>,
  );

  expect(renderer.container).toMatchInlineSnapshot(`
    <>
      <div>
        Named Content
      </div>
    </>
  `);
});

function ComponentWithState() {
  const [count, setCount] = React.useState(0);
  const incrementCount = () => {
    setCount(count + 1);
  };

  return (
    <div>
      <button onClick={incrementCount}>Increment</button>
      <span>Count: {count}</span>
    </div>
  );
}

test("Activity preserves state when mode changes", async () => {
  const renderer = createRoot();

  await renderWithAct(
    renderer,
    <Activity mode="visible">
      <ComponentWithState />
    </Activity>,
  );
  const span = renderer.container.queryAll((element) => element.type === "span")[0];
  expect(span.props.children).toEqual(["Count: ", 0]);

  const button = renderer.container.queryAll((element) => element.type === "button")[0];
  await act(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    button.props.onClick();
  });
  expect(span.props.children).toEqual(["Count: ", 1]);

  await renderWithAct(
    renderer,
    <Activity mode="hidden">
      <ComponentWithState />
    </Activity>,
  );
  expect(renderer.container).toMatchInlineSnapshot(`< />`);

  await renderWithAct(
    renderer,
    <Activity mode="visible">
      <ComponentWithState />
    </Activity>,
  );
  expect(span.props.children).toEqual(["Count: ", 1]);
  expect(renderer.container).toMatchInlineSnapshot(`
    <>
      <div>
        <button
          onClick={[Function]}
        >
          Increment
        </button>
        <span>
          Count: 
          1
        </span>
      </div>
    </>
  `);
});
