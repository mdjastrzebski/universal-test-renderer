import { beforeEach, expect, jest, test } from "@jest/globals";

import type { HostElement } from "../host-element";
import { ReactWorkTag } from "../test-utils/react-constants";
import { createRoot } from "../renderer";
import { getRootElement, renderWithAct } from "../test-utils/render";

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
});

test("container is root's parent", async () => {
  const renderer = createRoot();
  await renderWithAct(renderer, <div>Hello!</div>);

  const root = getRootElement(renderer);
  expect(root).toBeTruthy();
  expect(root.parent).toBe(renderer.container);
  expect(root.parent!.parent).toBeNull();
});

test("basic parent/child relationships", async () => {
  const renderer = createRoot();
  await renderWithAct(
    renderer,
    <div>
      <div data-testid="item-1">Hello!</div>
      <div data-testid="item-2">World!</div>
    </div>,
  );

  const root = getRootElement(renderer);
  const item1 = root.children[0] as HostElement;
  const item2 = root.children[1] as HostElement;
  expect(item1.props["data-testid"]).toBe("item-1");
  expect(item2.props["data-testid"]).toBe("item-2");
  expect(item1.parent).toBe(root);
  expect(item2.parent).toBe(root);
});

test("host elements exposes fiber instance", async () => {
  const renderer = createRoot();
  await renderWithAct(renderer, <div>Hello!</div>);

  const root = getRootElement(renderer);
  const fiber = root.unstable_fiber!;
  expect(fiber.tag).toBe(ReactWorkTag.HostComponent);
  expect(fiber.return!.tag).toBe(ReactWorkTag.HostRoot);
});

interface TestComponentProps {
  className?: string;
  onChange?: (value: string) => void;
}

function TestComponent(props: TestComponentProps) {
  return <div className={props.className}>Hello!</div>;
}

test("can access composite parent props", async () => {
  const handleChange = jest.fn();
  const renderer = createRoot();
  await renderWithAct(renderer, <TestComponent className="test-class" onChange={handleChange} />);

  const root = getRootElement(renderer);
  expect(root.props).toEqual({ className: "test-class", children: "Hello!" });

  const fiber = root.unstable_fiber!;
  expect(fiber.return!.tag).toBe(ReactWorkTag.FunctionComponent);
  expect(fiber.return!.memoizedProps).toEqual({ className: "test-class", onChange: handleChange });
});

test("queryAll should find all elements that match the predicate", async () => {
  const renderer = createRoot();
  await renderWithAct(
    renderer,
    <body>
      <div>Hello!</div>
      <span>World!</span>
      <div>Foo!</div>
    </body>,
  );

  const elements = renderer.container.queryAll((element) => element.type === "div");
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

test("queryAll should find all elements that match the predicate with matchDeepestOnly option", async () => {
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

  const elements = renderer.container.queryAll((element) => element.type === "div", {
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

test("queryAll should not return self by default", async () => {
  const renderer = createRoot();
  await renderWithAct(
    renderer,
    <body className="yes">
      <div className="yes">Hello!</div>
      <span className="yes">World!</span>
      <div>Foo!</div>
    </body>,
  );

  const elements = getRootElement(renderer).queryAll(
    (element) => element.props.className === "yes",
  );
  expect(elements).toHaveLength(2);
  expect(elements[0].type).toBe("div");
  expect(elements[1].type).toBe("span");
});

test("queryAll should return self if 'includeSelf' is true", async () => {
  const renderer = createRoot();
  await renderWithAct(
    renderer,
    <body className="yes">
      <div className="yes">Hello!</div>
      <span className="yes">World!</span>
      <div>Foo!</div>
    </body>,
  );

  const elements = getRootElement(renderer).queryAll(
    (element) => element.props.className === "yes",
    {
      includeSelf: true,
    },
  );
  expect(elements).toHaveLength(3);
  expect(elements[0].type).toBe("body");
  expect(elements[1].type).toBe("div");
  expect(elements[2].type).toBe("span");
});
