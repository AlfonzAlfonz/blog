import { getAllRoutes } from "./router.js";
import fs from "fs/promises";
import path from "path";
import { renderPost, renderPostList } from "./render.js";

await fs.rm("./dist", { recursive: true });

const routes = getAllRoutes(false);

for await (const route of routes) {
  const targetPath = path.join("dist", route.path.slice(1));

  await fs.mkdir(path.dirname(targetPath), { recursive: true });

  switch (route.type) {
    case "static":
      await fs.copyFile(route.filename, targetPath);
      break;
    case "post":
      await fs.writeFile(targetPath, await renderPost(route));
      break;
    case "post-list":
      const p = route.path === "/" ? "dist/index.html" : route.path;
      await fs.writeFile(p, await renderPostList(route));
  }
}
