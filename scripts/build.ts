import { getAllRoutes } from "./router.js";
import fs from "fs/promises";
import path from "path";
import { renderPost } from "./render.js";

await fs.rm("./dist", { recursive: true });

const routes = getAllRoutes();

for await (const route of routes) {
  const targetPath = path.join("dist", route.path.slice(1));

  if (path.basename(targetPath).startsWith(".")) {
    continue;
  }

  await fs.mkdir(path.dirname(targetPath), { recursive: true });

  switch (route.type) {
    case "static":
      await fs.copyFile(route.file, targetPath);
      break;
    case "post":
      await fs.writeFile(targetPath, await renderPost(route));
      break;
    case "pagination":
      await fs.copyFile("./index.html", targetPath + "/index.html");
  }
}
