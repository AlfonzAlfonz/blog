import { parseMd } from "./parseMd.js";
import fs from "fs/promises";

const md = parseMd(
  await fs.readFile("./posts/codegen1.md").then((b) => b.toString())
);

console.log(md);
