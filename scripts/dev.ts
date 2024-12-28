import fs from "fs/promises";
import http from "http";
import { minifyCss } from "./minifyCss.js";
import { renderPost, renderPostList } from "./render.js";
import { getAllRoutes } from "./router.js";

const server = http.createServer(async (req, res) => {
  try {
    const routes = getAllRoutes(true);

    for await (const r of routes) {
      if (r.path === req.url) {
        switch (r.type) {
          case "static": {
            if (r.filename.endsWith(".css")) {
              res.end(
                minifyCss(
                  await fs.readFile(r.filename).then((b) => b.toString())
                )
              );
            } else {
              const handle = await fs.open(r.filename);
              const buffer = await handle.readFile();
              res.end(buffer);
              await handle.close();
            }
            return;
          }
          case "post": {
            res.setHeader("Content-type", "text/html");
            res.end(await renderPost(r));
            return;
          }
          case "post-list": {
            res.setHeader("Content-type", "text/html");
            res.end(await renderPostList(r));
            return;
          }
        }
      }
    }

    res.statusCode = 404;
    res.end("404:(");
  } catch (e) {
    res.statusCode = 500;
    res.end(String(e));
  }
});

server.listen(3000);

process.on("SIGINT", () => {
  server.close();
});
