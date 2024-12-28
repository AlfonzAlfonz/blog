import { parseFrontMatter } from "./parseFrontMatter.js";
import { parseLeafs } from "./parseLeafs.js";

export type MdBlock =
  | { type: "text"; value: string }
  | { type: "code"; lang?: string; value: string }
  | { type: "heading"; level: number; value: string }
  | { type: "paragraph"; value: MdLeaf[] };

export type MdLeaf =
  | { type: "text"; value: string }
  | { type: "bold"; value: MdLeaf[] }
  | { type: "italic"; value: MdLeaf[] }
  | { type: "code"; value: MdLeaf[] }
  | { type: "link"; href: string; value: MdLeaf[] }
  | { type: "img"; src: string; alt: string };

export const parseMd = (source: string) => {
  const [data, md] = parseFrontMatter(source);
  let state: MdBlock[] = [{ type: "text", value: md }];

  state = separateCode(state);
  state = separateText(state);
  state = separateHeadings(state);
  state = separateParagraphs(state);

  return [data, state] as const;
};

export const separateCode = (source: MdBlock[]) => {
  return flatMapBlock(source, "text", (p) => {
    const output: MdBlock[] = [];

    output.push({ type: "text", value: "" });

    let code = false;

    for (const line of p.value.split("\n")) {
      if (line.startsWith("```")) {
        if (code) {
          output.push({ type: "text", value: "" });
        } else {
          output.push({ type: "code", lang: line.slice(3), value: "" });
        }

        code = !code;
        continue;
      }

      output.at(-1)!.value += line + "\n";
    }

    return output;
  });
};

export const separateText = (source: MdBlock[]) => {
  return flatMapBlock(source, "text", (p) =>
    p.value
      .split("\n\n")
      .filter((s) => s.length > 0)
      .map((s) => ({ type: "text", value: s }))
  );
};

const HEADER_REGEX = /^#{1,6}/;

export const separateHeadings = (source: MdBlock[]) => {
  return flatMapBlock(source, "text", (p) => {
    const output: MdBlock[] = [];

    output.push({ type: "text", value: "" });

    for (const line of p.value.split("\n")) {
      const match = line.match(HEADER_REGEX);
      if (match) {
        const level = match[0].length;
        output.push({
          type: "heading",
          level: level,
          value: line.slice(match[0].length),
        });
        continue;
      } else if (output.at(-1)?.type !== "text") {
        output.push({ type: "text", value: "" });
      }

      output.at(-1)!.value += line + "\n";
    }

    return output;
  });
};

const separateParagraphs = (source: MdBlock[]) => {
  return flatMapBlock(source, "text", (p) => {
    const [leafs, rest] = parseLeafs(p.value, "text");
    if (rest.length) {
      leafs.push({ type: "text", value: rest });
    }

    return [{ type: "paragraph", value: leafs }];
  });
};

const flatMapBlock = <T extends MdBlock["type"]>(
  value: MdBlock[],
  type: T,
  fn: (b: MdBlock & { type: T }) => MdBlock[]
) =>
  value
    .flatMap((v) => (v.type === type ? fn(v as never) : [v]))
    .filter((x) => x.value.length);
