import { MdBlock } from "./parseMd.js";

export const renderMd = (blocks: MdBlock[]) => {
  let str = "";

  for (const block of blocks) {
    switch (block.type) {
      case "text":
        str += `<p>${block.value}</p>`;
        break;
      case "code":
        str += `<pre><code class="language-ts">${block.value}</code></pre>`;
        break;
      case "heading":
        str += `<h${block.level}>${block.value}</h${block.level}>`;
        break;
      default:
        block satisfies never;
    }
  }

  return str;
};
