import type { ReactElement } from "react";
import type { Fiber } from "react-reconciler";
import ReactReconciler from "react-reconciler";
import { DefaultEventPriority, NoEventPriority } from "react-reconciler/constants";

import { Tag } from "./constants";
import { mark, measureEnd, measureStart } from "./performance";
import { formatComponentList } from "./utils";

export type Type = string;
export type Props = Record<string, unknown>;

type ReconcilerConfig = {
  textComponentTypes?: string[];
  publicTextComponentTypes?: string[];
  createNodeMock: (element: ReactElement) => object;
};

export type Container = {
  tag: typeof Tag.Container;
  parent: null;
  children: Array<Instance | TextInstance>;
  isHidden: false;
  config: ReconcilerConfig;
};

export type Instance = {
  tag: typeof Tag.Instance;
  type: string;
  props: Props;
  children: Array<Instance | TextInstance>;
  parent: Container | Instance | null;
  rootContainer: Container;
  isHidden: boolean;
  unstable_fiber: Fiber;
};

export type TextInstance = {
  tag: typeof Tag.Text;
  text: string;
  parent: Container | Instance | null;
  isHidden: boolean;
};

export type SuspenseInstance = object;
export type HydratableInstance = object;
export type PublicInstance = object | TextInstance;
export type UpdatePayload = unknown;
export type ChildSet = unknown;
export type TimeoutHandle = unknown;
export type NoTimeout = unknown;

type HostContext = {
  type: string;
  isInsideText: boolean;
  config: ReconcilerConfig;
};

const nodeToInstanceMap = new WeakMap<object, Instance>();

let currentUpdatePriority: number = NoEventPriority;
let lastMicrotaskId = 0;

const hostConfig: ReactReconciler.HostConfig<
  Type,
  Props,
  Container,
  Instance,
  TextInstance,
  SuspenseInstance,
  HydratableInstance,
  PublicInstance,
  HostContext,
  UpdatePayload,
  ChildSet,
  TimeoutHandle,
  NoTimeout
> = {
  /**
   * The reconciler has two modes: mutation mode and persistent mode. You must specify one of them.
   *
   * If your target platform is similar to the DOM and has methods similar to `appendChild`, `removeChild`,
   * and so on, you'll want to use the **mutation mode**. This is the same mode used by React DOM, React ART,
   * and the classic React Native renderer.
   *
   * ```js
   * const HostConfig = {
   *   // ...
   *   supportsMutation: true,
   *   // ...
   * }
   * ```
   *
   * Depending on the mode, the reconciler will call different methods on your host config.
   * If you're not sure which one you want, you likely need the mutation mode.
   */
  supportsMutation: true,

  /**
   * The reconciler has two modes: mutation mode and persistent mode. You must specify one of them.
   *
   * If your target platform has immutable trees, you'll want the **persistent mode** instead. In that mode,
   * existing nodes are never mutated, and instead every change clones the parent tree and then replaces
   * the whole parent tree at the root. This is the node used by the new React Native renderer, codenamed "Fabric".
   *
   * ```js
   * const HostConfig = {
   *   // ...
   *   supportsPersistence: true,
   *   // ...
   * }
   * ```
   *
   * Depending on the mode, the reconciler will call different methods on your host config.
   * If you're not sure which one you want, you likely need the mutation mode.
   */
  supportsPersistence: false,

  /**
   * #### `createInstance(type, props, rootContainer, hostContext, internalHandle)`
   *
   * This method should return a newly created node. For example, the DOM renderer would call
   * `document.createElement(type)` here and then set the properties from `props`.
   *
   * You can use `rootContainer` to access the root container associated with that tree. For example,
   * in the DOM renderer, this is useful to get the correct `document` reference that the root belongs to.
   *
   * The `hostContext` parameter lets you keep track of some information about your current place in
   * the tree. To learn more about it, see `getChildHostContext` below.
   *
   * The `internalHandle` data structure is meant to be opaque. If you bend the rules and rely on its
   * internal fields, be aware that it may change significantly between versions. You're taking on additional
   * maintenance risk by reading from it, and giving up all guarantees if you write something to it.
   *
   * This method happens **in the render phase**. It can (and usually should) mutate the node it has
   * just created before returning it, but it must not modify any other nodes. It must not register
   * any event handlers on the parent tree. This is because an instance being created doesn't guarantee
   * it would be placed in the tree — it could be left unused and later collected by GC. If you need to do
   * something when an instance is definitely in the tree, look at `commitMount` instead.
   */
  createInstance(
    type: Type,
    props: Props,
    rootContainer: Container,
    _hostContext: HostContext,
    internalHandle: Fiber,
  ) {
    mark("reconciler/createInstance", { type });
    return {
      tag: Tag.Instance,
      type,
      props,
      isHidden: false,
      children: [],
      parent: null,
      rootContainer,
      unstable_fiber: internalHandle,
    };
  },

  /**
   * #### `createTextInstance(text, rootContainer, hostContext, internalHandle)`
   *
   * Same as `createInstance`, but for text nodes. If your renderer doesn't support text nodes, you can
   * throw here.
   */
  createTextInstance(
    text: string,
    rootContainer: Container,
    hostContext: HostContext,
    _internalHandle: Fiber,
  ): TextInstance {
    mark("reconciler/createTextInstance", { text });

    if (rootContainer.config.textComponentTypes && !hostContext.isInsideText) {
      const componentTypes =
        rootContainer.config.publicTextComponentTypes ?? rootContainer.config.textComponentTypes;

      throw new Error(
        `Invariant Violation: Text strings must be rendered within a ${formatComponentList(
          componentTypes,
        )} component. Detected attempt to render "${text}" string within a <${
          hostContext.type
        }> component.`,
      );
    }

    return {
      tag: Tag.Text,
      text,
      parent: null,
      isHidden: false,
    };
  },

  /**
   * #### `appendInitialChild(parentInstance, child)`
   *
   * This method should mutate the `parentInstance` and add the child to its list of children.
   * For example, in the DOM this would translate to a `parentInstance.appendChild(child)` call.
   *
   * This method happens **in the render phase**. It can mutate `parentInstance` and `child`, but it
   * must not modify any other nodes. It's called while the tree is still being built up and not connected
   * to the actual tree on the screen.
   */
  appendInitialChild(parentInstance: Instance, child: Instance | TextInstance): void {
    mark("reconciler/appendInitialChild", {
      parentType: formatInstanceType(parentInstance),
      childType: formatInstanceType(child),
    });

    appendChild(parentInstance, child);
  },

  /**
   * #### `finalizeInitialChildren(instance, type, props, rootContainer, hostContext)`
   *
   * In this method, you can perform some final mutations on the `instance`. Unlike with `createInstance`,
   * by the time `finalizeInitialChildren` is called, all the initial children have already been added to
   * the `instance`, but the instance itself has not yet been connected to the tree on the screen.
   *
   * This method happens **in the render phase**. It can mutate `instance`, but it must not modify any other
   * nodes. It's called while the tree is still being built up and not connected to the actual tree on the screen.
   *
   * There is a second purpose to this method. It lets you specify whether there is some work that needs to
   * happen when the node is connected to the tree on the screen. If you return `true`, the instance will
   * receive a `commitMount` call later. See its documentation below.
   *
   * If you don't want to do anything here, you should return `false`.
   */
  finalizeInitialChildren(
    instance: Instance,
    _type: Type,
    _props: Props,
    _rootContainer: Container,
    _hostContext: HostContext,
  ): boolean {
    mark("reconciler/finalizeInitialChildren", { type: formatInstanceType(instance) });
    return false;
  },

  /**
   * #### `shouldSetTextContent(type, props)`
   *
   * Some target platforms support setting an instance's text content without manually creating a text node.
   * For example, in the DOM, you can set `node.textContent` instead of creating a text node and appending it.
   *
   * If you return `true` from this method, React will assume that this node's children are text, and will
   * not create nodes for them. It will instead rely on you to have filled that text during `createInstance`.
   * This is a performance optimization. For example, the DOM renderer returns `true` only if `type` is a
   * known text-only parent (like `'textarea'`) or if `props.children` has a `'string'` type. If you return `true`,
   *  you will need to implement `resetTextContent` too.
   *
   * If you don't want to do anything here, you should return `false`.
   * This method happens **in the render phase**. Do not mutate the tree from it.
   */
  shouldSetTextContent(type: Type, _props: Props): boolean {
    mark("reconciler/shouldSetTextContent", { type });
    return false;
  },

  setCurrentUpdatePriority(priority: number) {
    mark("reconciler/setCurrentUpdatePriority", { priority });
    currentUpdatePriority = priority;
  },

  getCurrentUpdatePriority() {
    return currentUpdatePriority;
  },

  resolveUpdatePriority(): number {
    const priority = currentUpdatePriority || DefaultEventPriority;
    mark("reconciler/resolveUpdatePriority", { priority });
    return priority;
  },

  shouldAttemptEagerTransition() {
    mark("reconciler/shouldAttemptEagerTransition", { result: false });
    return false;
  },

  /**
   * #### `getRootHostContext(rootContainer)`
   *
   * This method lets you return the initial host context from the root of the tree. See `getChildHostContext`
   * for the explanation of host context.
   *
   * If you don't intend to use host context, you can return `null`.
   * This method happens **in the render phase**. Do not mutate the tree from it.
   */
  getRootHostContext(rootContainer: Container): HostContext | null {
    mark("reconciler/getRootHostContext");
    return {
      type: "ROOT",
      config: rootContainer.config,
      isInsideText: false,
    };
  },

  /**
   * #### `getChildHostContext(parentHostContext, type, rootContainer)`
   *
   * Host context lets you track some information about where you are in the tree so that it's available
   * inside `createInstance` as the `hostContext` parameter. For example, the DOM renderer uses it to track
   * whether it's inside an HTML or an SVG tree, because `createInstance` implementation needs to be
   * different for them.
   *
   * If the node of this `type` does not influence the context you want to pass down, you can return
   * `parentHostContext`. Alternatively, you can return any custom object representing the information
   * you want to pass down.
   *
   * If you don't want to do anything here, return `parentHostContext`.
   *
   * This method happens **in the render phase**. Do not mutate the tree from it.
   */
  getChildHostContext(parentHostContext: HostContext, type: Type): HostContext {
    mark("reconciler/getChildHostContext", { type });
    const isInsideText = Boolean(parentHostContext.config.textComponentTypes?.includes(type));
    return { ...parentHostContext, type: type, isInsideText };
  },

  /**
   * #### `getPublicInstance(instance)`
   *
   * Determines what object gets exposed as a ref. You'll likely want to return the `instance` itself. But
   * in some cases it might make sense to only expose some part of it.
   *
   * If you don't want to do anything here, return `instance`.
   */
  getPublicInstance(instance: Instance | TextInstance): PublicInstance {
    mark("reconciler/getPublicInstance", {
      type: instance.tag === Tag.Instance ? instance.type : "TEXT",
    });

    switch (instance.tag) {
      case Tag.Instance: {
        const createNodeMock = instance.rootContainer.config.createNodeMock;
        const mockNode = createNodeMock({
          type: instance.type,
          props: instance.props,
          key: null,
        });

        nodeToInstanceMap.set(mockNode, instance);

        return mockNode;
      }

      default:
        return instance;
    }
  },

  /**
   * #### `prepareForCommit(containerInfo)`
   *
   * This method lets you store some information before React starts making changes to the tree on
   * the screen. For example, the DOM renderer stores the current text selection so that it can later
   * restore it. This method is mirrored by `resetAfterCommit`.
   *
   * Even if you don't want to do anything here, you need to return `null` from it.
   */
  prepareForCommit(_containerInfo: Container) {
    mark("reconciler/prepareForCommit");
    measureStart("react/commit");
    return null; // noop
  },

  /**
   * #### `resetAfterCommit(containerInfo)`
   *
   * This method is called right after React has performed the tree mutations. You can use it to restore
   * something you've stored in `prepareForCommit` — for example, text selection.
   *
   * You can leave it empty.
   */
  resetAfterCommit(_containerInfo: Container): void {
    measureEnd("react/commit");
    mark("reconciler/resetAfterCommit");
    // noop
  },

  /**
   * #### `preparePortalMount(containerInfo)`
   *
   * This method is called for a container that's used as a portal target. Usually you can leave it empty.
   */
  preparePortalMount(_containerInfo: Container): void {
    mark("reconciler/preparePortalMount");
    // noop
  },

  /**
   * #### `scheduleTimeout(fn, delay)`
   *
   * You can proxy this to `setTimeout` or its equivalent in your environment.
   */
  scheduleTimeout(fn: () => void, delay: number): ReturnType<typeof setTimeout> {
    const id = setTimeout(() => {
      mark("reconciler/scheduled timeout:start");
      fn();
      mark("reconciler/scheduled timeout:end");
    }, delay);
    mark("reconciler/scheduleTimeout", { id });
    return id;
  },

  /**
   * #### `cancelTimeout(id)`
   *
   * You can proxy this to `clearTimeout` or its equivalent in your environment.
   */
  cancelTimeout(id: ReturnType<typeof setTimeout>): void {
    mark("reconciler/cancelTimeout", { id });
    clearTimeout(id);
  },

  /**
   * #### `noTimeout`
   *
   * This is a property (not a function) that should be set to something that can never be a valid timeout ID.
   * For example, you can set it to `-1`.
   */
  noTimeout: -1,

  /**
   * #### `supportsMicrotasks`
   *
   * Set this to `true` to indicate that your renderer supports `scheduleMicrotask`. We use microtasks as part
   * of our discrete event implementation in React DOM. If you're not sure if your renderer should support this,
   * you probably should. The option to not implement `scheduleMicrotask` exists so that platforms with more control
   * over user events, like React Native, can choose to use a different mechanism.
   */
  supportsMicrotasks: true,

  /**
   * #### `scheduleMicrotask(fn)`
   *
   * Optional. You can proxy this to `queueMicrotask` or its equivalent in your environment.
   */
  scheduleMicrotask(fn: () => void): ReturnType<typeof queueMicrotask> {
    const id = lastMicrotaskId++;
    mark("reconciler/scheduleMicrotask", { id });
    queueMicrotask(() => {
      mark("reconciler/scheduled microtask:start", { id });
      fn();
      mark("reconciler/scheduled microtask:end", { id });
    });
  },

  /**
   * #### `isPrimaryRenderer`
   *
   * This is a property (not a function) that should be set to `true` if your renderer is the main one on the
   * page. For example, if you're writing a renderer for the Terminal, it makes sense to set it to `true`, but
   * if your renderer is used *on top of* React DOM or some other existing renderer, set it to `false`.
   */
  isPrimaryRenderer: true,

  /**
   * Whether the renderer shouldn't trigger missing `act()` warnings
   */
  warnsIfNotActing: true,

  getInstanceFromNode(node: object): Fiber | null | undefined {
    mark("reconciler/getInstanceFromNode");
    const instance = nodeToInstanceMap.get(node);
    if (instance !== undefined) {
      return instance.unstable_fiber;
    }

    return null;
  },

  beforeActiveInstanceBlur(): void {
    mark("reconciler/beforeActiveInstanceBlur");
    // noop
  },

  afterActiveInstanceBlur(): void {
    mark("reconciler/afterActiveInstanceBlur");
    // noop
  },

  prepareScopeUpdate(scopeInstance: object, instance: Instance): void {
    mark("reconciler/prepareScopeUpdate");
    nodeToInstanceMap.set(scopeInstance, instance);
  },

  getInstanceFromScope(scopeInstance: object): Instance | null {
    mark("reconciler/getInstanceFromScope");
    return nodeToInstanceMap.get(scopeInstance) ?? null;
  },

  detachDeletedInstance(_node: Instance): void {
    mark("reconciler/detachDeletedInstance");
  },

  /**
   * #### `appendChild(parentInstance, child)`
   *
   * This method should mutate the `parentInstance` and add the child to its list of children. For example,
   * in the DOM this would translate to a `parentInstance.appendChild(child)` call.
   *
   * Although this method currently runs in the commit phase, you still should not mutate any other nodes
   * in it. If you need to do some additional work when a node is definitely connected to the visible tree, look at `commitMount`.
   */
  appendChild(parentInstance: Instance, child: Instance | TextInstance): void {
    mark("reconciler/appendChild", {
      parentType: formatInstanceType(parentInstance),
      childType: formatInstanceType(child),
    });

    appendChild(parentInstance, child);
  },

  /**
   * #### `appendChildToContainer(container, child)`
   *
   * Same as `appendChild`, but for when a node is attached to the root container. This is useful if attaching
   * to the root has a slightly different implementation, or if the root container nodes are of a different
   * type than the rest of the tree.
   */
  appendChildToContainer(container: Container, child: Instance | TextInstance): void {
    mark("reconciler/appendChildToContainer", {
      childType: formatInstanceType(child),
    });

    appendChild(container, child);
  }, 

  /**
   * #### `insertBefore(parentInstance, child, beforeChild)`
   *
   * This method should mutate the `parentInstance` and place the `child` before `beforeChild` in the list of
   * its children. For example, in the DOM this would translate to a `parentInstance.insertBefore(child, beforeChild)` call.
   *
   * Note that React uses this method both for insertions and for reordering nodes. Similar to DOM, it is expected
   * that you can call `insertBefore` to reposition an existing child. Do not mutate any other parts of the tree from it.
   */
   insertBefore(parentInstance: Instance, child: Instance | TextInstance, beforeChild: Instance | TextInstance): void {
    mark("reconciler/insertBefore", {
      parentType: formatInstanceType(parentInstance),
      childType: formatInstanceType(child),
      beforeChildType: formatInstanceType(beforeChild),
    });
    insertBefore(parentInstance, child, beforeChild);
  },

  /**
   * #### `insertInContainerBefore(container, child, beforeChild)
   *
   * Same as `insertBefore`, but for when a node is attached to the root container. This is useful if attaching
   * to the root has a slightly different implementation, or if the root container nodes are of a different type
   * than the rest of the tree.
   */
  insertInContainerBefore(container: Container, child: Instance | TextInstance, beforeChild: Instance | TextInstance): void {
    mark("reconciler/insertInContainerBefore", {
      childType: formatInstanceType(child),
      beforeChildType: formatInstanceType(beforeChild),
    });
    insertBefore(container, child, beforeChild);
  },

  /**
   * #### `removeChild(parentInstance, child)`
   *
   * This method should mutate the `parentInstance` to remove the `child` from the list of its children.
   *
   * React will only call it for the top-level node that is being removed. It is expected that garbage collection
   * would take care of the whole subtree. You are not expected to traverse the child tree in it.
   */
  removeChild(parentInstance: Instance, child: Instance | TextInstance): void {
    mark("reconciler/removeChild", {
      parentType: formatInstanceType(parentInstance),
      childType: formatInstanceType(child),
    });
    removeChild(parentInstance, child);
  },

  /**
   * #### `removeChildFromContainer(container, child)`
   *
   * Same as `removeChild`, but for when a node is detached from the root container. This is useful if attaching
   * to the root has a slightly different implementation, or if the root container nodes are of a different type
   * than the rest of the tree.
   */
  removeChildFromContainer(container: Container, child: Instance | TextInstance): void {
    mark("reconciler/removeChildFromContainer", {
      childType: formatInstanceType(child),
    });
    removeChild(container, child);
  },

  /**
   * #### `resetTextContent(instance)`
   *
   * If you returned `true` from `shouldSetTextContent` for the previous props, but returned `false` from
   * `shouldSetTextContent` for the next props, React will call this method so that you can clear the text
   * content you were managing manually. For example, in the DOM you could set `node.textContent = ''`.
   *
   * If you never return `true` from `shouldSetTextContent`, you can leave it empty.
   */
  resetTextContent(instance: Instance): void {
    mark("reconciler/resetTextContent", { type: instance.type });
    // noop
  },

  /**
   * #### `commitTextUpdate(textInstance, prevText, nextText)`
   *
   * This method should mutate the `textInstance` and update its text content to `nextText`.
   *
   * Here, `textInstance` is a node created by `createTextInstance`.
   */
  commitTextUpdate(textInstance: TextInstance, oldText: string, newText: string): void {
    mark("reconciler/commitTextUpdate", { oldText, newText });
    textInstance.text = newText;
  },

  /**
   * #### `commitMount(instance, type, props, internalHandle)`
   *
   * This method is only called if you returned `true` from `finalizeInitialChildren` for this instance.
   *
   * It lets you do some additional work after the node is actually attached to the tree on the screen for
   * the first time. For example, the DOM renderer uses it to trigger focus on nodes with the `autoFocus` attribute.
   *
   * Note that `commitMount` does not mirror `removeChild` one to one because `removeChild` is only called for
   * the top-level removed node. This is why ideally `commitMount` should not mutate any nodes other than the
   * `instance` itself. For example, if it registers some events on some node above, it will be your responsibility
   * to traverse the tree in `removeChild` and clean them up, which is not ideal.
   *
   * The `internalHandle` data structure is meant to be opaque. If you bend the rules and rely on its internal
   * fields, be aware that it may change significantly between versions. You're taking on additional maintenance
   * risk by reading from it, and giving up all guarantees if you write something to it.
   *
   * If you never return `true` from `finalizeInitialChildren`, you can leave it empty.
   */
  commitMount(_instance: Instance, type: Type, _props: Props, _internalHandle: Fiber): void {
    mark("reconciler/commitMount", { type });
    // noop
  },

  /**
   * #### `commitUpdate(instance, type, prevProps, nextProps, internalHandle)`
   *
   * This method should mutate the `instance` according to the set of changes in `updatePayload`. Here, `updatePayload`
   *  is the object that you've returned from `prepareUpdate` and has an arbitrary structure that makes sense for your
   * renderer. For example, the DOM renderer returns an update payload like `[prop1, value1, prop2, value2, ...]` from
   * `prepareUpdate`, and that structure gets passed into `commitUpdate`. Ideally, all the diffing and calculation
   * should happen inside `prepareUpdate` so that `commitUpdate` can be fast and straightforward.
   *
   * The `internalHandle` data structure is meant to be opaque. If you bend the rules and rely on its internal fields,
   *  be aware that it may change significantly between versions. You're taking on additional maintenance risk by
   * reading from it, and giving up all guarantees if you write something to it.
   */
  // @ts-expect-error @types/react-reconciler types don't fully match react-reconciler's actual Flow types.
  // Correctness is verified through tests.
  commitUpdate(
    instance: Instance,
    type: Type,
    _prevProps: Props,
    nextProps: Props,
    internalHandle: Fiber,
  ): void {
    mark("reconciler/commitUpdate", { type });
    instance.type = type;
    instance.props = nextProps;
    instance.unstable_fiber = internalHandle;
  },

  /**
   * #### `hideInstance(instance)`
   *
   * This method should make the `instance` invisible without removing it from the tree. For example, it can apply
   * visual styling to hide it. It is used by Suspense to hide the tree while the fallback is visible.
   */
  hideInstance(instance: Instance): void {
    mark("reconciler/hideInstance", { type: instance.type });
    instance.isHidden = true;
  },

  /**
   * #### `hideTextInstance(textInstance)`
   *
   * Same as `hideInstance`, but for nodes created by `createTextInstance`.
   */
  hideTextInstance(textInstance: TextInstance): void {
    mark("reconciler/hideTextInstance", { text: textInstance.text });
    textInstance.isHidden = true;
  },

  /**
   * #### `unhideInstance(instance, props)`
   *
   * This method should make the `instance` visible, undoing what `hideInstance` did.
   */
  unhideInstance(instance: Instance, _props: Props): void {
    mark("reconciler/unhideInstance", { type: instance.type });
    instance.isHidden = false;
  },

  /**
   * #### `unhideTextInstance(textInstance, text)`
   *
   * Same as `unhideInstance`, but for nodes created by `createTextInstance`.
   */
  unhideTextInstance(textInstance: TextInstance, _text: string): void {
    mark("reconciler/unhideTextInstance", { text: textInstance.text });
    textInstance.isHidden = false;
  },

  /**
   * #### `clearContainer(container)`
   *
   * This method should mutate the `container` root node and remove all children from it.
   */
  clearContainer(container: Container): void {
    mark("reconciler/clearContainer");
    container.children.forEach((child) => {
      child.parent = null;
    });

    container.children.splice(0);
  },

  /**
   * #### `maySuspendCommit(type, props)`
   *
   * This method is called during render to determine if the Host Component type and props require
   * some kind of loading process to complete before committing an update.
   */
  maySuspendCommit(type: Type, _props: Props): boolean {
    mark("reconciler/maySuspendCommit", { type });
    return false;
  },

  /**
   * #### `preloadInstance(type, props)`
   *
   * This method may be called during render if the Host Component type and props might suspend a commit.
   * It can be used to initiate any work that might shorten the duration of a suspended commit.
   */
  preloadInstance(type: Type, _props: Props): boolean {
    mark("reconciler/preloadInstance", { type });
    return true;
  },

  /**
   * #### `startSuspendingCommit()`
   *
   * This method is called just before the commit phase. Use it to set up any necessary state while any Host
   * Components that might suspend this commit are evaluated to determine if the commit must be suspended.
   */
  startSuspendingCommit() {
    mark("reconciler/startSuspendingCommit");
  },

  /**
   * #### `suspendInstance(type, props)`
   *
   * This method is called after `startSuspendingCommit` for each Host Component that indicated it might
   * suspend a commit.
   */
  suspendInstance(type: Type, _props: Props) {
    mark("reconciler/suspendInstance", { type });
  },

  /**
   * #### `waitForCommitToBeReady()`
   *
   * This method is called after all `suspendInstance` calls are complete.
   *
   * Return `null` if the commit can happen immediately.
   * Return `(initiateCommit: Function) => Function` if the commit must be suspended. The argument to this
   * callback will initiate the commit when called. The return value is a cancellation function that the
   * Reconciler can use to abort the commit.
   */
  waitForCommitToBeReady(type: Type, _props: Props) {
    mark("reconciler/waitForCommitToBeReady", { type });
    return null;
  },

  // -------------------
  // Hydration Methods
  //    (optional)
  // You can optionally implement hydration to "attach" to the existing tree during the initial render instead
  // of creating it from scratch. For example, the DOM renderer uses this to attach to an HTML markup.
  //
  // To support hydration, you need to declare `supportsHydration: true` and then implement the methods in
  // the "Hydration" section [listed in this file](https://github.com/facebook/react/blob/master/packages/react-reconciler/src/forks/ReactFiberHostConfig.custom.js).
  // File an issue if you need help.
  // -------------------
  supportsHydration: false,

  NotPendingTransition: null,

  resetFormInstance(_form: Instance) {
    mark("reconciler/resetFormInstance");
  },

  requestPostPaintCallback(_callback: (endTime: number) => void) {
    mark("reconciler/requestPostPaintCallback");
  },
};

export const TestReconciler = ReactReconciler(hostConfig);

/**
 * This method should mutate the `parentInstance` and add the child to its list of children. For example,
 * in the DOM this would translate to a `parentInstance.appendChild(child)` call.
 *
 * Although this method currently runs in the commit phase, you still should not mutate any other nodes
 * in it. If you need to do some additional work when a node is definitely connected to the visible tree,
 * look at `commitMount`.
 */
function appendChild(parentInstance: Container | Instance, child: Instance | TextInstance): void {
  const index = parentInstance.children.indexOf(child);
  if (index !== -1) {
    parentInstance.children.splice(index, 1);
  }

  child.parent = parentInstance;
  parentInstance.children.push(child);
}

/**
 * This method should mutate the `parentInstance` and place the `child` before `beforeChild` in the list
 * of its children. For example, in the DOM this would translate to a
 * `parentInstance.insertBefore(child, beforeChild)` call.
 *
 * Note that React uses this method both for insertions and for reordering nodes. Similar to DOM, it is
 * expected that you can call `insertBefore` to reposition an existing child. Do not mutate any other parts
 * of the tree from it.
 */
function insertBefore(
  parentInstance: Container | Instance,
  child: Instance | TextInstance,
  beforeChild: Instance | TextInstance,
): void {
  const index = parentInstance.children.indexOf(child);
  if (index !== -1) {
    parentInstance.children.splice(index, 1);
  }

  child.parent = parentInstance;
  const beforeIndex = parentInstance.children.indexOf(beforeChild);
  parentInstance.children.splice(beforeIndex, 0, child);
}

/**
 * This method should mutate the `parentInstance` to remove the `child` from the list of its children.
 *
 * React will only call it for the top-level node that is being removed. It is expected that garbage
 * collection would take care of the whole subtree. You are not expected to traverse the child tree in it.
 */
function removeChild(parentInstance: Container | Instance, child: Instance | TextInstance): void {
  const index = parentInstance.children.indexOf(child);
  parentInstance.children.splice(index, 1);
  child.parent = null;
}

function formatInstanceType(instance: Instance | TextInstance): string {
  return instance.tag === Tag.Text ? `text: "${instance.text}"` : instance.type;
}