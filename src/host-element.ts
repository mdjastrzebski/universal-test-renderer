import type { Fiber } from "react-reconciler";

import { CONTAINER_TYPE, Tag } from "./constants";
import type { QueryOptions } from "./query-all";
import { queryAll } from "./query-all";
import type { Container, Instance, TextInstance } from "./reconciler";
import type { JsonElement } from "./render-to-json";
import { renderContainerToJson, renderInstanceToJson } from "./render-to-json";

/** A node in the rendered tree - either a HostElement or a text string. */
export type HostNode = HostElement | string;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
/** Props object for a host element. */
export type HostElementProps = Record<string, any>;

const instanceMap = new WeakMap<Instance | Container, HostElement>();

/**
 * Represents a rendered host element in the test renderer tree.
 * Provides a DOM-like API for querying and inspecting rendered components.
 */
export class HostElement {
  private instance: Instance | Container;

  private constructor(instance: Instance | Container) {
    this.instance = instance;
  }

  /** The element type (e.g., "div", "span"). Empty string for container. */
  get type(): string {
    return this.instance.tag === Tag.Instance ? this.instance.type : CONTAINER_TYPE;
  }

  /** The element's props object. */
  get props(): HostElementProps {
    return this.instance.tag === Tag.Instance ? this.instance.props : {};
  }

  /** The parent element, or null if this is the root container. */
  get parent(): HostElement | null {
    const parentInstance = this.instance.parent;
    if (parentInstance == null) {
      return null;
    }

    return HostElement.fromInstance(parentInstance);
  }

  /** Array of child nodes (elements and text strings). Hidden children are excluded. */
  get children(): HostNode[] {
    const result = this.instance.children
      .filter((child) => !child.isHidden)
      .map((child) => getHostNodeForInstance(child));
    return result;
  }

  /**
   * Access to the underlying React Fiber node. This is an unstable API that exposes
   * internal react-reconciler structures which may change without warning in future
   * React versions. Use with caution and only when absolutely necessary.
   *
   * @returns The Fiber node for this instance, or null if this is a container.
   */
  get unstable_fiber(): Fiber | null {
    return this.instance.tag === Tag.Instance ? this.instance.unstable_fiber : null;
  }

  /**
   * Convert this element to a JSON representation suitable for snapshots.
   *
   * @returns JSON element or null if the element is hidden.
   */
  toJSON(): JsonElement | null {
    return this.instance.tag === Tag.Container
      ? renderContainerToJson(this.instance)
      : renderInstanceToJson(this.instance);
  }

  /**
   * Find all descendant elements matching the predicate.
   *
   * @param predicate - Function that returns true for matching elements.
   * @param options - Optional query configuration.
   * @returns Array of matching elements.
   */
  queryAll(
    predicate: (element: HostElement, options?: QueryOptions) => boolean,
    options?: QueryOptions,
  ): HostElement[] {
    return queryAll(this, predicate, options);
  }

  /** @internal */
  static fromInstance(instance: Instance | Container): HostElement {
    const hostElement = instanceMap.get(instance);
    if (hostElement) {
      return hostElement;
    }

    const result = new HostElement(instance);
    instanceMap.set(instance, result);
    return result;
  }
}

export function getHostNodeForInstance(instance: Instance | TextInstance): HostNode {
  switch (instance.tag) {
    case Tag.Text:
      return instance.text;

    case Tag.Instance:
      return HostElement.fromInstance(instance);
  }
}
