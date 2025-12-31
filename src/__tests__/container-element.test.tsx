import { expect, test } from "@jest/globals";

import { createRoot } from "../renderer";
import { renderWithAct } from "../test-utils/render";

beforeEach(() => {
  // @ts-expect-error global is not typed
  global.IS_REACT_ACT_ENVIRONMENT = true;
});

test("toJSON", async () => {
  const renderer = createRoot();
  await renderWithAct(renderer, <div>Hello!</div>);

  expect(renderer.container).toMatchInlineSnapshot(`
    <Container>
      <div>
        Hello!
      </div>
    </Container>
  `);

  expect(renderer.container.toJSON()).toMatchInlineSnapshot(`
    <Container>
      <div>
        Hello!
      </div>
    </Container>
  `);
});

test("toJSON with fragment", async () => {
  const renderer = createRoot();
  await renderWithAct(
    renderer,
    <>
      <div>Hello!</div>
      <span>World!</span>
    </>,
  );

  expect(renderer.container).toMatchInlineSnapshot(`
    <Container>
      <div>
        Hello!
      </div>
      <span>
        World!
      </span>
    </Container>
  `);

  expect(renderer.container.toJSON()).toMatchInlineSnapshot(`
    <Container>
      <div>
        Hello!
      </div>
      <span>
        World!
      </span>
    </Container>
  `);
});
