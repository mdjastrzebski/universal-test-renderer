import { ReactElement } from "react";
import { createRoot, Root } from "../renderer";

export type ReactNativeRootOptions = {
  legacyRoot?: boolean;
  createNodeMock?: (element: ReactElement) => object;
};

const createReactNativeRoot = (options?: ReactNativeRootOptions): Root => {
  return createRoot({
    legacyRoot: options?.legacyRoot,
    createNodeMock: options?.createNodeMock,
    textComponents: ["Text", "RCTText"],
  });
};

export { createReactNativeRoot as createRoot };
