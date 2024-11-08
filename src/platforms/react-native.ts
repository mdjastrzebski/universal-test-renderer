import { ReactElement } from "react";
import { createRoot, Root } from "../renderer";

export type ReactNativeRootOptions = {
  legacyRoot?: boolean;
  createNodeMock: (element: ReactElement) => object;
};

const createReactNativeRoot = ({
  legacyRoot,
  createNodeMock,
}: ReactNativeRootOptions): Root => {
  return createRoot({
    legacyRoot,
    createNodeMock,
    textComponents: ["Text", "RCTText"],
  });
};

export { createReactNativeRoot as createRoot };
