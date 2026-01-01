# Universal Test Renderer for React

A lightweight, JavaScript-only replacement for the deprecated React Test Renderer.

## Why Use It?

- **Pure JavaScript Testing** - Test React components in Jest or Vitest without browser or native dependencies
- **Universal** - Can be used to simulate React Native or any other React renderer
- **React 19 Ready** - Modern alternative as React Test Renderer is now deprecated
- **Lightweight** - Minimal dependencies and small bundle size
- **Type-safe** - Written in TypeScript with full type definitions
- **Flexible Configuration** - Customizable reconciler options for different use cases

## Installation

```bash
npm install -D universal-test-renderer
```

## Basic Usage

```tsx
import { act } from "react";
import { createRoot } from "universal-test-renderer";

test("example", () => {
  const renderer = createRoot();
  act(() => {
    renderer.render(<div>Hello!</div>);
  });

  expect(renderer.container).toMatchInlineSnapshot(`
    <>
      <div>
        Hello!
      </div>
    </>
  `);
});
```

## Key Differences from React Test Renderer

- Works at host component level only (no composite components)
- More flexible reconciler configuration options
- Uses `act` from the React package directly
