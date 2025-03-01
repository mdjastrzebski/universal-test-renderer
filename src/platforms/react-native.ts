import type { ReactElement } from "react";

import type { Root } from "../renderer";
import { createRoot } from "../renderer";

export type ReactNativeRootOptions = {
  createNodeMock?: (element: ReactElement) => object;
};

const createReactNativeRoot = (options?: ReactNativeRootOptions): Root => {
  return createRoot({
    createNodeMock: options?.createNodeMock,
    textComponents: ["Text", "RCTText"],
  });
};

export { createReactNativeRoot as createRoot };
