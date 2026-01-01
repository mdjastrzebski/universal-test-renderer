import { expect, jest, test } from "@jest/globals";

import type { HostElement } from "../host-element";
import { ReactWorkTag } from "../react-constants";
import { createRoot } from "../renderer";
import { renderWithAct } from "../test-utils/render";

beforeEach(() => {
  // @ts-expect-error global is not typed
  global.IS_REACT_ACT_ENVIRONMENT = true;
});

test("container is root's parent", async () => {
  const renderer = createRoot();
  await renderWithAct(renderer, <div>Hello!</div>);

  expect(renderer.root).toBeTruthy();
  expect(renderer.root!.parent).toBe(renderer.container);
  expect(renderer.root!.parent!.parent).toBeNull();
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

  const item1 = renderer.root!.children[0] as HostElement;
  const item2 = renderer.root!.children[1] as HostElement;
  expect(item1.props["data-testid"]).toBe("item-1");
  expect(item2.props["data-testid"]).toBe("item-2");
  expect(item1.parent).toBe(renderer.root);
  expect(item2.parent).toBe(renderer.root);
});

test("host elements exposes fiber instance", async () => {
  const renderer = createRoot();
  await renderWithAct(renderer, <div>Hello!</div>);

  const fiber = renderer.root!.unstable_fiber!;
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
  expect(renderer.root!.props).toEqual({ className: "test-class", children: "Hello!" });

  const fiber = renderer.root!.unstable_fiber!;
  expect(fiber.return!.tag).toBe(ReactWorkTag.FunctionComponent);
  expect(fiber.return!.memoizedProps).toEqual({ className: "test-class", onChange: handleChange });
});
