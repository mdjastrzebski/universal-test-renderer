import { Tag } from "./constants";
import type { Container, Instance, TextInstance } from "./reconciler";

export type JsonNode = JsonElement | string;

export type JsonElement = {
  type: string;
  props: object;
  children: Array<JsonNode> | null;
  $$typeof: symbol;
};

export function renderToJson(instance: Container | Instance | TextInstance): JsonNode | null {
  if (instance.isHidden) {
    return null;
  }

  switch (instance.tag) {
    case Tag.Text:
      return instance.text;

    case Tag.Instance: {
      // We don't include the `children` prop in JSON.
      // Instead, we will include the actual rendered children.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { children, ...restProps } = instance.props;

      const result = {
        type: instance.type,
        props: restProps,
        children: renderChildrenToJson(instance.children),
        $$typeof: Symbol.for("react.test.json"),
      };
      // This is needed for JEST to format snapshot as JSX.
      Object.defineProperty(result, "$$typeof", {
        value: Symbol.for("react.test.json"),
      });
      return result;
    }

    case Tag.Container: {
      const visibleChildren = instance.children.filter((child) => !child.isHidden);
      if (visibleChildren.length === 0) {
        return null;
      }

      if (visibleChildren.length === 1) {
        return renderToJson(visibleChildren[0]);
      }

      const result = {
        type: instance.config.containerType,
        props: {},
        children: renderChildrenToJson(instance.children),
        $$typeof: Symbol.for("react.test.json"),
      };
      // This is needed for JEST to format snapshot as JSX.
      Object.defineProperty(result, "$$typeof", {
        value: Symbol.for("react.test.json"),
      });
      return result;
    }
  }
}

export function renderChildrenToJson(children: Array<Instance | TextInstance>) {
  const result = [];

  for (let i = 0; i < children.length; i++) {
    const renderedChild = renderToJson(children[i]);
    if (renderedChild !== null) {
      result.push(renderedChild);
    }
  }

  return result;
}
