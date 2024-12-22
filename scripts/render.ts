import { mdToHtml } from "./mdToHtml.js";
import { Route } from "./router.js";
import fs from "fs/promises";

export const renderPost = async (r: Route & { type: "post" }) => {
  const html = await fs.readFile("./index.html").then((b) => b.toString());
  const post = await fs.readFile(r.file).then((b) => b.toString());

  return html.replace(
    `<main></main>`,
    `<main>${mdToHtml(post.toString())}</main>`
  );
};
