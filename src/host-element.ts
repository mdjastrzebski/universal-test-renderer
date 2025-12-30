import type { Instance, TextInstance } from "./reconciler";
import type { JsonNode} from "./render-to-json";
import { renderToJson } from "./render-to-json";

export type HostNode = HostElement | string;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HostElementProps = Record<string, any>;

const instanceToHostElementMap = new WeakMap<Instance, HostElement>();

export class HostElement {
  private instance: Instance;

  private constructor(instance: Instance) {
    this.instance = instance;
  }

  get type(): string {
    return this.instance.type;
  }

  get props(): HostElementProps {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { children, ...restProps } = this.instance.props;
    return restProps;
  }

  get children(): HostNode[] {
    const result = this.instance.children
      .filter((child) => !child.isHidden)
      .map((child) => HostElement.fromInstance(child));
    return result;
  }

  get parent(): HostElement | null {
    const parentInstance = this.instance.parent;
    if (parentInstance == null) {
      return null;
    }

    switch (parentInstance.tag) {
      case "INSTANCE":
        return HostElement.fromInstance(parentInstance) as HostElement;

      case "CONTAINER":
        return null;
    }
  }

  get $$typeof(): symbol {
    return Symbol.for("react.test.json");
  }

  toJSON(): JsonNode | null {
    return renderToJson(this.instance);
  }

  /** @internal */
  static fromInstance(instance: Instance | TextInstance): HostNode {
    switch (instance.tag) {
      case "TEXT":
        return instance.text;

      case "INSTANCE": {
        const hostElement = instanceToHostElementMap.get(instance);
        if (hostElement) {
          return hostElement;
        }

        const result = new HostElement(instance);
        instanceToHostElementMap.set(instance, result);
        return result;
      }
    }
  }
}

