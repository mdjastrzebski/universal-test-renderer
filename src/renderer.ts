import type { ReactElement } from "react";
import type { FiberRoot } from "react-reconciler";
import { ConcurrentRoot } from "react-reconciler/constants";

import { Tag } from "./constants";
import { ContainerElement } from "./container-element";
import { findAll, type FindAllOptions } from "./find-all";
import { HostElement } from "./host-element";
import type { Container } from "./reconciler";
import { TestReconciler } from "./reconciler";

// Refs:
// https://github.com/facebook/react/blob/v18.3.1/packages/react-noop-renderer/src/createReactNoop.js
// https://github.com/facebook/react/blob/v18.3.1/packages/react-native-renderer/src/ReactNativeHostConfig.js
// https://github.com/facebook/react/blob/v18.3.1/packages/react-native-renderer/src/ReactFabricHostConfig.js

const DEFAULT_CONTAINER_TYPE = "Container";
const DEFAULT_CREATE_MOCK_NODE = () => ({});

export type RootOptions = {
  textComponents?: string[];
  containerType?: string;
  createNodeMock?: (element: ReactElement) => object;
};

export type Root = {
  render: (element: ReactElement) => void;
  unmount: () => void;

  container: ContainerElement;
  root: HostElement | null;
  findAll: (
    predicate: (element: HostElement) => boolean,
    options?: FindAllOptions,
  ) => HostElement[];
};

export function createRoot(options?: RootOptions): Root {
  let container: Container | null = {
    tag: Tag.Container,
    children: [],
    isHidden: false,
    config: {
      textComponents: options?.textComponents,
      containerType: options?.containerType ?? DEFAULT_CONTAINER_TYPE,
      createNodeMock: options?.createNodeMock ?? DEFAULT_CREATE_MOCK_NODE,
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
    if (container == null) {
      return;
    }

    TestReconciler.updateContainer(null, containerFiber, null, null);

    containerFiber = null;
    container = null;
  };

  const getContainer = () => {
    if (container == null) {
      throw new Error("Can't access .container on unmounted test renderer");
    }

    return ContainerElement.fromContainer(container);
  };

  return {
    render,
    unmount,
    get container(): ContainerElement {
      return getContainer();
    },
    get root(): HostElement | null {
      if (container == null) {
        throw new Error("Can't access .root on unmounted test renderer");
      }

      if (container.children.length === 0) {
        return null;
      }

      const firstChild = container.children[0];
      if (firstChild.tag === Tag.Text) {
        throw new Error("Cannot render text as root element");
      }

      return HostElement.fromInstance(firstChild);
    },
    findAll: (predicate: (element: HostElement) => boolean, options?: FindAllOptions) => {
      return findAll(getContainer(), predicate, options);
    },
  };
}
