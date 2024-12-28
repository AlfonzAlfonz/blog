import fs from "fs/promises";
import { renderMd } from "./md/renderMd.js";
import { Route } from "./router.js";

export const renderPost = async (r: Route & { type: "post" }) => {
  return await renderHtml(
    r.title,
    `
      <main>
        <h1>${r.title}</h1>
        ${r.published ? `<time>${r.published}</time>` : ""}
        ${renderMd(r.parsed)}
      </main>`
  );
};

export const renderPostList = async (r: Route & { type: "post-list" }) => {
  return await renderHtml(
    undefined,
    `<main class="post-list">
      ${r.posts
        .map(
          (p) => `
            <article>
              <h2><a href="${p.path}">${p.title}</a></h2>
              ${p.published ? `<time>${p.published}</time>` : ""}
              <p>${p.text}</p>
            </article>`
        )
        .join("\n")}
    </main>`
  );
};

const renderHtml = async (title: string | undefined, main: string) => {
  const html = await fs.readFile("./index.html").then((b) => b.toString());

  return html
    .replace(
      "<title></title>",
      `<title>${title ?? "Blog"} | Denis Homolík</title>`
    )
    .replace(`<main></main>`, `<main>${main}</main>`);
};
