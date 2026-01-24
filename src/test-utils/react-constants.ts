// Source: https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactWorkTags.js#L46
export const ReactWorkTag = {
  FunctionComponent: 0,
  ClassComponent: 1,
  HostRoot: 3,
  HostComponent: 5,
} as const;

// Source: https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactEventPriorities.js
export const NoEventPriority = 0;
export const DiscreteEventPriority = 2;
export const ContinuousEventPriority = 8;
export const DefaultEventPriority = 32;
export const IdleEventPriority = 0b0010000000000000000000000000000;
