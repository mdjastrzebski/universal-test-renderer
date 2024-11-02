import { ReactElement } from "react";
import { Container, TestReconciler } from "./reconciler";
import { HostComponent } from "./host-component";
import { FiberRoot } from "react-reconciler";
import { ConcurrentRoot, LegacyRoot } from "react-reconciler/constants";

// Refs:
// https://github.com/facebook/react/blob/v18.3.1/packages/react-noop-renderer/src/createReactNoop.js
// https://github.com/facebook/react/blob/v18.3.1/packages/react-native-renderer/src/ReactNativeHostConfig.js
// https://github.com/facebook/react/blob/v18.3.1/packages/react-native-renderer/src/ReactFabricHostConfig.js

export type RendererOptions = {
  textComponents?: string[];
  isConcurrent?: boolean;
  createNodeMock?: (element: ReactElement) => object;
};

export type Renderer = {
  render: (element: ReactElement) => void;
  unmount: () => void;
  container: HostComponent;
  root: HostComponent | null;
};

export function createRenderer(options?: RendererOptions): Renderer {
  let container: Container | null = {
    tag: "CONTAINER",
    children: [],
    parent: null,
    textComponents: options?.textComponents,
    createNodeMock: options?.createNodeMock ?? (() => ({})),
  };

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  let containerFiber: FiberRoot = TestReconciler.createContainer(
    container,
    options?.isConcurrent ? ConcurrentRoot : LegacyRoot,
    null, // no hydration callback
    false, // isStrictMode
    null, // concurrentUpdatesByDefaultOverride
    "id", // identifierPrefix
    () => {}, // onRecoverableError
    null // transitionCallbacks
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
    get root(): HostComponent | null {
      if (containerFiber == null || container == null) {
        throw new Error("Can't access .root on unmounted test renderer");
      }

      if (container.children.length === 0) {
        return null;
      }

      const root = HostComponent.fromInstance(container.children[0]);
      if (typeof root === "string") {
        throw new Error("Cannot render string as root element");
      }

      return root;
    },

    get container(): HostComponent {
      if (containerFiber == null || container == null) {
        throw new Error("Can't access .container on unmounted test renderer");
      }

      return HostComponent.fromContainer(container);
    },
  };
}