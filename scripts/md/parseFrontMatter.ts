export const parseFrontMatter = (
  source: string
): [data: Record<string, string>, md: string] => {
  const data: Record<string, string> = {};
  source = source.trim();
  let rest = source;

  if (!rest.startsWith("---\n")) {
    return [{}, source];
  }

  rest = rest.slice("---\n".length);

  while (true) {
    const i = rest.indexOf("\n");
    const line = rest.slice(0, i);

    if (line === "---") {
      return [data, rest.slice(line.length + 1)];
    }

    const [key, value] = line.split(": ");

    if (value === undefined || i === -1) {
      return [{}, source];
    }

    data[key] = value;

    rest = rest.slice(line.length + 1);
  }
};
