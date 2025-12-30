import type { HostElement } from "./host-element";

export interface FindAllOptions {
  /* Exclude any ancestors of deepest matched elements even if they match the predicate */
  matchDeepestOnly?: boolean;
}

export function findAll(
  root: HostElement,
  predicate: (element: HostElement) => boolean,
  options?: FindAllOptions,
): HostElement[] {
  const results: HostElement[] = [];

  // Match descendants first but do not add them to results yet.
  const matchingDescendants: HostElement[] = [];

  root.children.forEach((child) => {
    if (typeof child === "string") {
      return;
    }

    matchingDescendants.push(...findAll(child, predicate, options));
  });

  if (
    // When matchDeepestOnly = true: add current element only if no descendants match
    (!options?.matchDeepestOnly || matchingDescendants.length === 0) &&
    predicate(root)
  ) {
    results.push(root);
  }

  // Add matching descendants after element to preserve original tree walk order.
  results.push(...matchingDescendants);

  return results;
}
