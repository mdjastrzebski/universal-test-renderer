import type { Fiber } from "react-reconciler";

import { Tag } from "./constants";
import type { QueryOptions } from "./query-all";
import { queryAll } from "./query-all";
import type { Container, Instance, TextInstance } from "./reconciler";
import type { JsonElement } from "./render-to-json";
import { renderContainerToJson, renderInstanceToJson } from "./render-to-json";

export type HostNode = HostElement | string;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HostElementProps = Record<string, any>;

const instanceMap = new WeakMap<Instance | Container, HostElement>();

export class HostElement {
  private instance: Instance | Container;

  private constructor(instance: Instance | Container) {
    this.instance = instance;
  }

  get type(): string {
    return this.instance.tag === Tag.Instance
      ? this.instance.type
      : this.instance.config.containerType;
  }

  get props(): HostElementProps {
    return this.instance.tag === Tag.Instance ? this.instance.props : {};
  }

  get parent(): HostElement | null {
    const parentInstance = this.instance.parent;
    if (parentInstance == null) {
      return null;
    }

    return HostElement.fromInstance(parentInstance);
  }

  get children(): HostNode[] {
    const result = this.instance.children
      .filter((child) => !child.isHidden)
      .map((child) => getHostNodeForInstance(child));
    return result;
  }

  get unstable_fiber(): Fiber | null {
    return this.instance.tag === Tag.Instance ? this.instance.unstable_fiber : null;
  }

  toJSON(): JsonElement | null {
    return this.instance.tag === Tag.Container
      ? renderContainerToJson(this.instance)
      : renderInstanceToJson(this.instance);
  }

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
