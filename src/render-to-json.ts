import { CONTAINER_TYPE, Tag } from "./constants";
import type { Container, Instance, TextInstance } from "./reconciler";

export type JsonNode = JsonElement | string;

export type JsonElement = {
  type: string;
  props: object;
  children: Array<JsonNode> | null;
  $$typeof: symbol;
};

export function renderContainerToJson(instance: Container): JsonElement {
  return {
    type: CONTAINER_TYPE,
    props: {},
    children: renderChildrenToJson(instance.children),
    $$typeof: Symbol.for("react.test.json"),
  };
}

export function renderInstanceToJson(instance: Instance): JsonElement | null {
  if (instance.isHidden) {
    return null;
  }

  // We don't include the `children` prop in JSON.
  // Instead, we will include the actual rendered children.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { children, ...restProps } = instance.props;

  return {
    type: instance.type,
    props: restProps,
    children: renderChildrenToJson(instance.children),
    $$typeof: Symbol.for("react.test.json"),
  };
}

export function renderTextInstanceToJson(instance: TextInstance): string | null {
  if (instance.isHidden) {
    return null;
  }

  return instance.text;
}

export function renderChildrenToJson(children: Array<Instance | TextInstance>): JsonNode[] {
  const result = [];

  for (const child of children) {
    if (child.tag === Tag.Instance) {
      const renderedChild = renderInstanceToJson(child);
      if (renderedChild !== null) {
        result.push(renderedChild);
      }
    } else {
      const renderedChild = renderTextInstanceToJson(child);
      if (renderedChild !== null) {
        result.push(renderedChild);
      }
    }
  }

  return result;
}
