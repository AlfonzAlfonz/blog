import { MdLeaf } from "./parseMd.js";

const TOKEN_TYPE_MAP = {
  "**": "bold",
  "*": "italic",
  "`": "code",
} as const;

const INLINE_TOKENS = Object.keys(
  TOKEN_TYPE_MAP
) as (keyof typeof TOKEN_TYPE_MAP)[];

export const parseLeafs = (
  source: string,
  type: MdLeaf["type"]
): [leafs: MdLeaf[], rest: string] => {
  const leafs: MdLeaf[] = [];
  let rest = source;

  while (true) {
    const [pre, token, post] =
      type === "code" ? findToken(rest, ["`"]) : findToken(rest, INLINE_TOKENS);

    leafs.push({ type: "text", value: pre });

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

  if (type === "text") {
    return [leafs, rest];
  } else {
    return [[{ type, value: leafs }], rest];
  }
};

const findToken = <TToken extends string>(
  str: string,
  tokens: readonly TToken[]
) => {
  const index = tokens
    .map((t) => [t, str.indexOf(t)] as [token: string, index: number])
    .filter((t) => t[1] !== -1)
    .sort((a, b) => (a[1] === b[1] ? b[0].length - a[0].length : a[1] - b[1]));

  const token = index[0];

  if (!token) {
    return [str] as const;
  }

  return [
    str.slice(0, token[1]),
    token[0] as TToken,
    str.slice(token[1] + token[0].length),
  ] as const;
};
