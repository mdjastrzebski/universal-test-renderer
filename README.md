# Universal Test Renderer for React

A lightweight, JavaScript-only replacement for the deprecated React Test Renderer.

## Why Use It?

- **Pure JavaScript Testing** - Test React components in Jest or Vitest without browser/native dependencies
- **React Native Compatible** - Works with React Native components without needing native code
- **React 19 Ready** - Modern alternative as React Test Renderer is now deprecated

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

  expect(renderer.root?.toJSON()).toMatchInlineSnapshot(`
    <div>
      Hello!
    </div>
  `);
});
```

## React Native Usage

```tsx
import { act } from "react";
import { Text } from "react-native";
import { createRoot } from "universal-test-renderer/react-native";

test("example", () => {
  const renderer = createRoot();
  act(() => {
    renderer.render(<Text>Hello!</Text>);
  });

  expect(renderer.root?.toJSON()).toMatchInlineSnapshot(`
    <Text>
      Hello!
    </Text>
  `);
});
```

## Key Differences from React Test Renderer

- Works at host component level only (no composite components)
- More flexible reconciler configuration options
- Uses `act` from the React package directly