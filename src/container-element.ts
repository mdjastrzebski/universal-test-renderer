import type { HostNode } from "./host-element";
import { getHostNodeForInstance } from "./host-element";
import type { Container } from "./reconciler";
import type { JsonNode } from "./render-to-json";
import { renderToJson } from "./render-to-json";

const containerMap = new WeakMap<Container, ContainerElement>();

export class ContainerElement {
  private container: Container;

  private constructor(container: Container) {
    this.container = container;
  }

  get children(): HostNode[] {
    return this.container.children
      .filter((child) => !child.isHidden)
      .map((child) => getHostNodeForInstance(child));
  }

  toJSON(): JsonNode | null {
    return renderToJson(this.container);
  }

  /** @internal */
  static fromContainer(container: Container): ContainerElement {
    const existingElement = containerMap.get(container);
    if (existingElement) {
      return existingElement;
    }

    const newElement = new ContainerElement(container);
    containerMap.set(container, newElement);
    return newElement;
  }
}
