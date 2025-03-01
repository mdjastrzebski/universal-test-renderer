import { ReactElement } from "react";
import { FiberRoot } from "react-reconciler";
import { ConcurrentRoot } from "react-reconciler/constants";

import { HostElement } from "./host-element";
import { Container, TestReconciler } from "./reconciler";

// Refs:
// https://github.com/facebook/react/blob/v18.3.1/packages/react-noop-renderer/src/createReactNoop.js
// https://github.com/facebook/react/blob/v18.3.1/packages/react-native-renderer/src/ReactNativeHostConfig.js
// https://github.com/facebook/react/blob/v18.3.1/packages/react-native-renderer/src/ReactFabricHostConfig.js

export type RootOptions = {
  textComponents?: string[];
  createNodeMock?: (element: ReactElement) => object;
};

export type Root = {
  render: (element: ReactElement) => void;
  unmount: () => void;
  container: HostElement;
  root: HostElement | null;
};

export function createRoot(options?: RootOptions): Root {
  let container: Container | null = {
    tag: "CONTAINER",
    children: [],
    parent: null,
    config: {
      textComponents: options?.textComponents,
      createNodeMock: options?.createNodeMock ?? (() => ({})),
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  let containerFiber: FiberRoot = TestReconciler.createContainer(
    container,
    ConcurrentRoot,
    null, // hydration callbacks
    false, // isStrictMode
    null, // concurrentUpdatesByDefaultOverride
    "id", // identifierPrefix
    () => {}, // onUncaughtError
    () => {}, // onCaughtError
    // @ts-expect-error missing types
    () => {}, // onRecoverableError
    null, // transitionCallbacks
  );

  const render = (element: ReactElement) => {
    TestReconciler.updateContainer(element, containerFiber, null, null);
  };

  const unmount = () => {
    if (containerFiber == null || container == null) {
      return;
    }

    TestReconciler.updateContainer(null, containerFiber, null, null);

    container = null;
    containerFiber = null;
  };

  return {
    render,
    unmount,
    get root(): HostElement | null {
      if (containerFiber == null || container == null) {
        throw new Error("Can't access .root on unmounted test renderer");
      }

      if (container.children.length === 0) {
        return null;
      }

      const root = HostElement.fromInstance(container.children[0]);
      if (typeof root === "string") {
        throw new Error("Cannot render string as root element");
      }

      return root;
    },

    get container(): HostElement {
      if (containerFiber == null || container == null) {
        throw new Error("Can't access .container on unmounted test renderer");
      }

      return HostElement.fromContainer(container);
    },
  };
}
