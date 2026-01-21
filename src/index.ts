export { createRoot } from "./renderer";
export { setPerformanceMetricsEnabled } from "./performance";

export type { Root, RootOptions } from "./renderer";
export type { HostElement, HostElementProps, HostNode } from "./host-element";
export type { JsonElement, JsonNode } from "./render-to-json";
export type { QueryOptions } from "./query-all";

/**
 * React Fiber type from react-reconciler. Exported for advanced use cases only.
 * This type represents internal React structures that may change without warning.
 * Prefer using the stable HostElement API instead.
 */
export type { Fiber } from "react-reconciler";
