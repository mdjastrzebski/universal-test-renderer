import type { ReactElement } from "react";
import { act as reactAct } from "react";

import type { HostElement } from "../host-element";
import type { Root } from "../renderer";

export async function act<T>(callback: () => T | Promise<T>): Promise<T> {
  return await reactAct(async () => callback());
}

export async function renderWithAct(root: Root, element: ReactElement) {
  await act(() => {
    root.render(element);
  });
}

export async function unmountWithAct(root: Root) {
  await act(() => {
    root.unmount();
  });
}

export function getRootElement(renderer: Root): HostElement {
  const firstChild = renderer.container.children[0];
  if (typeof firstChild === "string") {
    throw new Error(`Root element shound not be text (got "${firstChild}")`);
  }

  return firstChild;
}
