import fs from "fs/promises";
import path from "path";

export type Route =
  | { type: "static"; path: string; file: string }
  | { type: "post"; path: string; file: string }
  | { type: "pagination"; path: string };

export async function* getAllRoutes(): AsyncGenerator<Route> {
  const staticPaths = await fs.readdir("./public", { recursive: true });

  for (const p of staticPaths) {
    yield {
      type: "static",
      path: path.join("/", p),
      file: path.resolve("public", p),
    };
  }

  const posts = await fs.readdir("./posts", { recursive: true });

  for (const post of posts) {
    const p =
      path.join("/p", post).slice(0, -path.extname(post).length) + ".html";
    yield {
      type: "post",
      path: p,
      file: path.resolve("posts", post),
    };
  }

  yield { type: "pagination", path: "/" };
}
