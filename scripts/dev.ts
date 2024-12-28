import fs from "fs/promises";
import http from "http";
import { minifyCss } from "./minifyCss.js";
import { renderPost } from "./render.js";
import { getAllRoutes } from "./router.js";

const server = http.createServer(async (req, res) => {
  try {
    const routes = getAllRoutes();

    for await (const r of routes) {
      if (r.path === req.url) {
        switch (r.type) {
          case "static": {
            if (r.file.endsWith(".css")) {
              res.end(
                minifyCss(await fs.readFile(r.file).then((b) => b.toString()))
              );
            } else {
              const handle = await fs.open(r.file);
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
          case "pagination": {
            const html = await fs.readFile("./index.html");
            res.end(html);
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
