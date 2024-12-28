import { MdLeaf } from "./parseMd.js";

const TOKEN_TYPE_MAP = {
  "**": "bold",
  "*": "italic",
  "`": "code",
} as const;

const INLINE_TOKENS = ["**", "*", "`"] as const;

const LINK_REGEX = /^\[(.+)]\((https?:\/\/.+\..+)\)/;
const IMG_REGEX = /^\!\[(.+)]\((https?:\/\/.+\..+)\)/;

export const parseLeafs = (
  source: string,
  type: MdLeaf["type"]
): [leafs: MdLeaf[], rest: string] => {
  const leafs: MdLeaf[] = [];
  let rest = source;

  while (true) {
    let [pre, token, post] =
      type === "code"
        ? findToken(rest, ["`"])
        : findToken(rest, [...INLINE_TOKENS, "[", "!["]);

    leafs.push({ type: "text", value: pre });

    // handle links
    if (token === "[") {
      const linkMatch = (token + post).match(LINK_REGEX);
      if (linkMatch) {
        const [full, text, href] = linkMatch;
        const innerLeafs = parseLeafs(text, "text");
        leafs.push({ type: "link", href, value: innerLeafs[0] });
        rest = post!.slice(full.length);
        continue;
      }

      leafs.pop();
      [pre, token, post] = findToken(rest, [...INLINE_TOKENS]);
      leafs.push({ type: "text", value: pre });
    }

    // handle images
    if (token === "![") {
      const imageMatch = (token + post).match(IMG_REGEX);
      if (imageMatch) {
        const [full, alt, link] = imageMatch;
        const [src] = link.split(" ");
        leafs.push({ type: "img", src, alt });
        rest = post!.slice(full.length);
        continue;
      }

      leafs.pop();
      [pre, token, post] = findToken(rest, INLINE_TOKENS);
      leafs.push({ type: "text", value: pre });
    }

    // handle closing tokens and end of input
    if (!token || TOKEN_TYPE_MAP[token] === type) {
      rest = post ?? "";
      break;
    }

    const parsed = post
      ? parseLeafs(post, TOKEN_TYPE_MAP[token])
      : ([[], ""] as const);
    leafs.push(...parsed[0]);
    rest = parsed[1];
  }

  switch (type) {
    case "text":
      return [leafs, rest];
    case "link":
    case "img":
      throw new Error("Unreachable");
    default:
      return [[{ type, value: leafs }], rest];
  }
};

const findToken = <TToken extends string>(
  input: string,
  tokens: readonly TToken[]
) => {
  let str = input;

  for (let pos = 0; pos < str.length - 1; pos++) {
    if (str[pos] === "\\") {
      str = str.slice(0, pos) + str.slice(pos + 1);
      continue;
    }

    tokenLoop: for (const t of tokens) {
      for (let i = 0; i < t.length; i++) {
        if (str[pos + i] !== t[i]) continue tokenLoop;
      }

      return [
        str.slice(0, pos),
        str.slice(pos, pos + t.length) as TToken,
        str.slice(pos + t.length),
      ] as const;
    }
  }

  return [str] as const;
};
