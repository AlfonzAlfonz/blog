const wsRegex = /\s+/g;

export const minifyCss = (source: string) => {
  return source.replaceAll(wsRegex, " ");
};
