import { highlightTs } from "../highlighTs.js";
import { MdBlock, MdLeaf } from "./parseMd.js";

const tsLang = ["ts", "tsx", "js"];

export const renderMd = (blocks: MdBlock[]) => {
  let str = "";

  for (const block of blocks) {
    switch (block.type) {
      case "text":
        str += `<pre style="color:red">${block.value}</pre>`;
        break;
      case "code":
        const isTypescript = tsLang.includes(block.lang!);
        str += `<pre ${isTypescript ? `class="ts"` : ""}><code>${
          isTypescript ? highlightTs(block.value) : block.value
        }</code></pre>`;
        break;
      case "heading":
        str += `<h${block.level}>${block.value}</h${block.level}>`;
        break;
      case "paragraph":
        str += `<p>${renderLeafs(block.value)}</p>`;
        break;
      default:
        block satisfies never;
    }
  }

  return str;
};

const renderLeafs = (source: MdLeaf[]): string => {
  let str = "";
  for (const leaf of source) {
    if (leaf.type === "text") {
      str += leaf.value;
    } else {
      const inner = "value" in leaf ? renderLeafs(leaf.value) : "";

      switch (leaf.type) {
        case "bold":
          str += `<strong>${inner}</strong>`;
          break;
        case "italic":
          str += `<em>${inner}</em>`;
          break;
        case "code":
          str += `<code>${inner}</code>`;
          break;
        case "link":
          str += `<a href="${leaf.href}">${inner}</a>`;
          break;
        case "img":
          str += `<img src="${leaf.src}" alt="${leaf.alt}" />`;
          break;
        default:
          leaf satisfies never;
      }
    }
  }
  return str;
};
