# Test Renderer for React

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
npm install -D test-renderer
```

## Basic Usage

```tsx
import { act } from "react";
import { createRoot } from "test-renderer";

test("renders a component", async () => {
  const renderer = createRoot();

  // Use `act` in async mode to allow resolving all scheduled React updates
  await act(async () => {
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

## API Reference

### `createRoot(options?)`

Creates a new test renderer instance.

```tsx
const renderer = createRoot(options);
```

Returns a `Root` object with:

- `render(element)` - Render a React element. Must be called within `act()`.
- `unmount()` - Unmount and clean up. Must be called within `act()`.
- `container` - A wrapper `HostElement` that contains the rendered element(s). Use this to query and inspect the rendered tree.

### `RootOptions`

| Option               | Type                         | Description                                                       |
| -------------------- | ---------------------------- | ----------------------------------------------------------------- |
| `textComponents`     | `string[]`                   | Element types that can contain text (for React Native simulation) |
| `createNodeMock`     | `(element) => object`        | Create mock objects for refs                                      |
| `identifierPrefix`   | `string`                     | Prefix for `useId()` generated IDs                                |
| `isStrictMode`       | `boolean`                    | Enable React Strict Mode                                          |
| `onCaughtError`      | `(error, errorInfo) => void` | Called when Error Boundary catches an error                       |
| `onUncaughtError`    | `(error, errorInfo) => void` | Called for uncaught errors                                        |
| `onRecoverableError` | `(error, errorInfo) => void` | Called when React recovers from errors                            |

### `HostElement`

The rendered element wrapper with a DOM-like API:

| Property/Method                 | Description                              |
| ------------------------------- | ---------------------------------------- |
| `type`                          | Element type (e.g., `"div"`, `"span"`)   |
| `props`                         | Element props object                     |
| `children`                      | Array of child elements and text strings |
| `parent`                        | Parent element or `null`                 |
| `toJSON()`                      | Convert to JSON for snapshots            |
| `queryAll(predicate, options?)` | Find all matching descendant elements    |

## Querying Elements

Use `queryAll()` to find elements in the rendered tree:

```tsx
const renderer = createRoot();
await act(async () => {
  renderer.render(
    <div>
      <button data-testid="btn-1">First</button>
      <button data-testid="btn-2">Second</button>
    </div>,
  );
});

// Find all buttons
const buttons = renderer.container.queryAll((el) => el.type === "button");
expect(buttons).toHaveLength(2);

// Find by props
const btn1 = renderer.container.queryAll((el) => el.props["data-testid"] === "btn-1");
expect(btn1[0].children).toContain("First");
```

### Query Options

```tsx
queryAll(predicate, {
  includeSelf: false, // Include the element itself in results
  matchDeepestOnly: false, // Only return deepest matches (exclude ancestors)
});
```

## React Native Simulation

Use `textComponents` to simulate React Native's text rendering rules:

```tsx
import { createElement } from "react";

const renderer = createRoot({
  textComponents: ["Text", "RCTText"],
});

// This works - text inside Text component
await act(async () => {
  renderer.render(createElement("Text", null, "Hello!"));
});

// This throws - text outside Text component
await act(async () => {
  renderer.render(<View>Hello!</View>); // Error!
});
```

## Mocking Refs

Use `createNodeMock` to provide mock objects for refs:

```tsx
const renderer = createRoot({
  createNodeMock: (element) => {
    if (element.type === "input") {
      return {
        focus: jest.fn(),
        value: "",
      };
    }
    return {};
  },
});

await act(async () => {
  renderer.render(<input ref={inputRef} />);
});

// inputRef.current is now the mock object
inputRef.current.focus();
```

## Error Handling

Handle React errors with custom callbacks:

```tsx
const renderer = createRoot({
  onCaughtError: (error, errorInfo) => {
    // Called when an Error Boundary catches an error
    console.log("Caught:", error.message);
    console.log("Component stack:", errorInfo.componentStack);
  },
  onUncaughtError: (error, errorInfo) => {
    // Called for uncaught render errors
  },
});
```

## Key Differences from React Test Renderer

- Works at host component level only (no composite components)
- Expost all reconciler configuration options

## License

MIT
