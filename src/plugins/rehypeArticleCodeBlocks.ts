import { formatCodeLanguageLabel } from "../utils/codeLanguage";

interface RehypeNode {
  type: string;
  children?: RehypeNode[];
  tagName?: string;
  properties?: Record<string, unknown>;
}

interface RehypeElement extends RehypeNode {
  tagName: string;
  properties: Record<string, unknown>;
  children?: RehypeNode[];
}

const isElement = (node: RehypeNode): node is RehypeElement =>
  node.type === "element" && typeof node.tagName === "string";

const hasChildren = (
  node: RehypeNode
): node is RehypeNode & {
  children: RehypeNode[];
} => Array.isArray(node.children);

const toClassList = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.filter((token): token is string => typeof token === "string");
  }

  if (typeof value === "string") {
    return value.split(/\s+/).filter(Boolean);
  }

  return [];
};

const getDeclaredLanguage = (node: RehypeElement) => {
  const directLanguage =
    typeof node.properties.dataLanguage === "string"
      ? node.properties.dataLanguage
      : typeof node.properties["data-language"] === "string"
        ? node.properties["data-language"]
        : "";

  if (directLanguage) {
    return directLanguage.trim();
  }

  return (
    toClassList(node.properties.className)
      .find(token => token.startsWith("language-"))
      ?.slice("language-".length) ?? ""
  );
};

const isArticleCodeWrapper = (node: RehypeNode) =>
  isElement(node) &&
  toClassList(node.properties.className).includes("article-code-block");

const isArticleCodeBlock = (node: RehypeNode): node is RehypeElement => {
  if (!isElement(node)) return false;

  return (
    node.tagName === "pre" ||
    toClassList(node.properties.className).includes("astro-code")
  );
};

const createArticleCodeWrapper = (node: RehypeElement): RehypeElement => {
  const label = formatCodeLanguageLabel(getDeclaredLanguage(node));

  return {
    type: "element",
    tagName: "div",
    properties: {
      className: ["article-code-block"],
      dataCopyState: "idle",
      ...(label ? { dataCodeLanguage: label } : {}),
    },
    children: [node],
  };
};

const wrapArticleCodeBlocks = (node: RehypeNode) => {
  if (!hasChildren(node)) return;

  node.children = node.children.flatMap(child => {
    wrapArticleCodeBlocks(child);

    if (isArticleCodeBlock(child) && !isArticleCodeWrapper(node)) {
      return [createArticleCodeWrapper(child)];
    }

    return [child];
  });
};

export const rehypeArticleCodeBlocks = () => {
  return (tree: RehypeNode) => {
    wrapArticleCodeBlocks(tree);
  };
};
