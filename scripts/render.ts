import fs from "fs/promises";
import { parseMd } from "./parseMd.js";
import { renderMd } from "./renderMd.js";
import { Route } from "./router.js";

export const renderPost = async (r: Route & { type: "post" }) => {
  const html = await fs.readFile("./index.html").then((b) => b.toString());
  const post = await fs.readFile(r.file).then((b) => b.toString());

  return html.replace(
    `<main></main>`,
    `<main>${renderMd(parseMd(post.toString()))}</main>`
  );
};
