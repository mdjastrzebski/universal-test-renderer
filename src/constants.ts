export const Tag = {
  Container: "CONTAINER",
  Instance: "INSTANCE",
  Text: "TEXT",
} as const;

// Container should render as <>{...}</>
export const CONTAINER_TYPE = "";

// Source: https://github.com/facebook/react/blob/main/packages/shared/ReactSymbols.js#L16
export const REACT_CONTEXT_TYPE: symbol = Symbol.for("react.context");
