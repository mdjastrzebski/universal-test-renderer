import type { HostElement } from "./host-element";

export interface FindAllOptions {
  /* Exclude any ancestors of deepest matched elements even if they match the predicate */
  matchDeepestOnly?: boolean;
}

export function findAll(
  element: HostElement,
  predicate: (element: HostElement) => boolean,
  options?: FindAllOptions,
): HostElement[] {
  const matchDeepestOnly = options?.matchDeepestOnly ?? false;
  const results: HostElement[] = [];

  // Match descendants first but do not add them to results yet.
  const matchingDescendants: HostElement[] = [];

  element.children.forEach((child) => {
    if (typeof child === "string") {
      return;
    }

    matchingDescendants.push(...findAll(child, predicate, options));
  });

  const isHostElement = "props" in element;
  if (
    isHostElement &&
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
