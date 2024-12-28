import fs from "fs/promises";
import path from "path";
import { MdBlock, parseMd } from "./md/parseMd.js";
import { renderMd } from "./md/renderMd.js";

type Post = {
  title: string;
  published?: string;
  path: string;
  filename: string;
  parsed: MdBlock[];
};

export type Route =
  | { type: "static"; path: string; filename: string }
  | ({ type: "post" } & Post)
  | {
      type: "post-list";
      path: string;
      posts: (Post & { text: string })[];
    };

export async function* getAllRoutes(hidden: boolean): AsyncGenerator<Route> {
  const staticPaths = await fs.readdir("./public", { recursive: true });

  for (const p of staticPaths) {
    yield {
      type: "static",
      path: path.join("/", p),
      filename: path.resolve("public", p),
    };
  }

  const posts = (
    await Promise.all(
      (
        await fs.readdir("./posts", { recursive: true })
      )
        .filter((p) => hidden || !p.startsWith("."))
        .map(async (post) => {
          const basename = post.slice(0, -path.extname(post).length);
          const filename = path.resolve("posts", post);
          const [data, md] = parseMd(
            await fs.readFile(filename).then((b) => b.toString())
          );
          const title =
            data.title ??
            md.find((b) => b.type === "heading" && b.level === 1)?.value ??
            post;
          const text = md.find((x) => x.type === "paragraph");

          return {
            filename,
            title: title as string,
            published: data.published,
            text: text ? renderMd([text]) : "",
            path: path.join("/p", basename) + ".html",
            parsed: md,
          };
        })
    )
  ).sort((a, b) => b.published.localeCompare(a.published));

  for (const post of posts) {
    yield {
      type: "post",
      ...post,
    };
  }

  yield {
    type: "post-list",
    path: "/",
    posts,
  };
}
