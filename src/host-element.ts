import type { Fiber } from "react-reconciler";

import { Tag } from "./constants";
import type { Instance, TextInstance } from "./reconciler";
import type { JsonNode } from "./render-to-json";
import { renderToJson } from "./render-to-json";

export type HostNode = HostElement | string;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HostElementProps = Record<string, any>;

const instanceMap = new WeakMap<Instance, HostElement>();

export class HostElement {
  private instance: Instance;

  private constructor(instance: Instance) {
    this.instance = instance;
  }

  get type(): string {
    return this.instance.type;
  }

  get props(): HostElementProps {
    return this.instance.props;
  }

  get children(): HostNode[] {
    const result = this.instance.children
      .filter((child) => !child.isHidden)
      .map((child) => getHostNodeForInstance(child));
    return result;
  }

  get parent(): HostElement | null {
    const parentInstance = this.instance.parent;
    if (parentInstance == null || parentInstance.tag === Tag.Container) {
      return null;
    }

    return HostElement.fromInstance(parentInstance);
  }

  get unstable_fiber(): Fiber {
    return this.instance.unstable_fiber;
  }

  toJSON(): JsonNode | null {
    return renderToJson(this.instance);
  }

  /** @internal */
  static fromInstance(instance: Instance): HostElement {
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
