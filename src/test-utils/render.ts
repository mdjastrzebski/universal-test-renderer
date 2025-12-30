import type { ReactElement } from "react";
import { act } from "react";

import type { Root } from "../renderer";

export async function renderWithAct(root: Root, element: ReactElement) {
    // eslint-disable-next-line @typescript-eslint/require-await -- intentionally triggering async act variant
    await act(async () => {
      root.render(element);
    });
  }