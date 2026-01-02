import type { HostElement } from "./host-element";

export interface QueryOptions {
  /** Include the element itself in the results if it matches the predicate. Defaults to false. */
  includeSelf?: boolean;

  /** Exclude any ancestors of deepest matched elements even if they match the predicate. Defaults to false. */
  matchDeepestOnly?: boolean;
}

export function queryAll(
  element: HostElement,
  predicate: (element: HostElement) => boolean,
  options?: QueryOptions,
): HostElement[] {
  const includeSelf = options?.includeSelf ?? false;
  const matchDeepestOnly = options?.matchDeepestOnly ?? false;

  const results: HostElement[] = [];

  // Match descendants first but do not add them to results yet.
  const matchingDescendants: HostElement[] = [];

  element.children.forEach((child) => {
    if (typeof child === "string") {
      return;
    }

    matchingDescendants.push(...queryAll(child, predicate, { ...options, includeSelf: true }));
  });

  if (
    includeSelf &&
    // When matchDeepestOnly = true: add current element only if no descendants match
    (matchingDescendants.length === 0 || !matchDeepestOnly) &&
    predicate(element)
  ) {
    results.push(element);
  }

  // Add matching descendants after element to preserve original tree walk order.
  results.push(...matchingDescendants);

  return results;
}
