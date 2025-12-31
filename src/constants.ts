export const Tag = {
  Container: "CONTAINER",
  Instance: "INSTANCE",
  Text: "TEXT",
} as const;

// Source: https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactWorkTags.js#L46
export const FiberTag = {
  FunctionComponent: 0,
  Root: 3,
  HostComponent: 5,
} as const;
