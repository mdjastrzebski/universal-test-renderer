# Universal Test Renderer for React

## The problem

Many React renderers require additional setup in order to work properly. For example, React Native requires a native code to run setup, and React DOM requires a DOM environment. While it's feasible to run a React DOM in simulated JS DOM environment, it is not possible for React Native.

Traditionally, in such case developers used React Test Renderer, but it has been deprecated with React 18.3.1, in it will be removed in the future.

## The solution

This is a universal test renderer that can be used to test React components in pure JavaScript environments like Jest or Vitest. It's build on top of React Reconciler and renders React components on host component level, exposing the resulting host component tree for various types of inspection: tree structure, props checking, etc.

This renderer is created to be used as replacement for React Test Renderer.

## Installation

```bash
npm install -D universal-test-renderer
```

Note: this package is now compatible with React 18.3. In the near future I will add React 19 support, as well.

## Usage

```tsx
import { act } from "react";
import { createRenderer } from "universal-test-renderer";

test("basic renderer usage", () => {
  const renderer = createRenderer();
  act(() => {
    renderer.render(<div>Hello!</div>);
  });

  expect(renderer.root?.toJSON()).toMatchInlineSnapshot(`
<div>
  Hello!
</div>
`);
});
```

## Differences from React Test Renderer

- This renderer operates on host components level, it does not expose composite components unlike React Test Renderer, which exposed both host components and composite components.
- This renderer offers more flexible renderer setup, allowing for passing various options to the underlying React Reconciler, like concurrent mode, specifying allowed text components, etc.
- This renderer does not re-export `act` function, you should use one provided by `react` package instead.
