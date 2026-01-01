import type { ReactElement } from "react";
import { act } from "react";

import type { HostElement } from "../host-element";
import type { Root } from "../renderer";

export async function renderWithAct(root: Root, element: ReactElement) {
  // eslint-disable-next-line @typescript-eslint/require-await -- intentionally triggering async act variant
  await act(async () => {
    root.render(element);
  });
}

export function getRootElement(renderer: Root): HostElement {
  const firstChild = renderer.container.children[0];
  if (typeof firstChild === "string") {
    throw new Error(`Root element shound not be text (got "${firstChild}")`);
  }

  return firstChild;
}
