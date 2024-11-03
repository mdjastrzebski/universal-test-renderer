import { CONTAINER_TYPE } from "./constants";
import { Container, Instance, TextInstance } from "./reconciler";
import { JsonNode, renderToJson } from "./render-to-json";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Props = Record<string, any>;

export type HostNode = HostComponent | string;

const instanceToHostComponentInstanceMap = new WeakMap<
  Container | Instance,
  HostComponent
>();

export class HostComponent {
  private instance: Instance | Container;

  private constructor(instance: Instance | Container) {
    this.instance = instance;
  }

  get type(): string {
    return this.instance.tag === "INSTANCE"
      ? this.instance.type
      : CONTAINER_TYPE;
  }

  get props(): Props {
    if (this.instance.tag === "CONTAINER") {
      return {};
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { children, ...restProps } = this.instance.props;
    return restProps;
  }

  get children(): HostNode[] {
    const result = this.instance.children
      .filter((child) => !child.isHidden)
      .map((child) => HostComponent.fromInstance(child));
    return result;
  }

  get parent(): HostComponent | null {
    const parentInstance = this.instance.parent;
    if (parentInstance == null) {
      return null;
    }

    switch (parentInstance.tag) {
      case "INSTANCE":
        return HostComponent.fromInstance(parentInstance) as HostComponent;

      case "CONTAINER":
        return HostComponent.fromContainer(parentInstance);
    }
  }

  get $$typeof(): symbol {
    return Symbol.for("react.test.json");
  }

  toJSON(): JsonNode | null {
    return renderToJson(this.instance);
  }

  /** @internal */
  static fromContainer(container: Container): HostComponent {
    const hostComponentInstance =
      instanceToHostComponentInstanceMap.get(container);
    if (hostComponentInstance) {
      return hostComponentInstance;
    }

    const result = new HostComponent(container);
    instanceToHostComponentInstanceMap.set(container, result);
    return result;
  }

  /** @internal */
  static fromInstance(instance: Instance | TextInstance): HostNode {
    switch (instance.tag) {
      case "TEXT":
        return instance.text;

      case "INSTANCE": {
        const hostComponentInstance =
          instanceToHostComponentInstanceMap.get(instance);
        if (hostComponentInstance) {
          return hostComponentInstance;
        }

        const result = new HostComponent(instance);
        instanceToHostComponentInstanceMap.set(instance, result);
        return result;
      }
    }
  }
}
