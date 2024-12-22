export const mdToHtml = (source: string) => {
  const chunks = source.split("\n\n");
  let output = "";

  let mode: "text" | "code" = "text";

  for (let chunk of chunks) {
    while (chunk.startsWith("#")) {
      const [line, rest] = divide(chunk, chunk.indexOf("\n"));
      chunk = rest;

      if (line.startsWith("### ")) {
        output += `<h3>${line.slice(4)}</h3>\n `;
        continue;
      }
      if (line.startsWith("## ")) {
        output += `<h2>${line.slice(3)}</h2>\n `;
        continue;
      }
      if (line.startsWith("# ")) {
        output += `<h1>${line.slice(2)}</h1>\n `;
      }
    }

    while (chunk.startsWith("```")) {
      const [, rest] = divide(chunk, chunk.indexOf("\n"));
      chunk = rest;
      if (mode === "text") {
        mode = "code";
        output += `<pre><code class="language-ts">`;
      } else {
        mode = "text";
        output += "</code></pre>";
      }
    }

    if (mode === "text") {
      output += `<p>${chunk}</p>\n`;
    } else {
      const [text] = divide(chunk, chunk.indexOf("```"));
      output += "\n\n" + text;
      if (chunk.indexOf("```") !== -1) {
        output += "</code></pre>";
        mode = "text";
      }
    }
  }
  return output;
};

const divide = (s: string, index: number): [string, string] =>
  index === -1 ? [s, ""] : [s.slice(0, index), s.slice(index)];
