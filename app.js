import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (fs.existsSync(path.join(__dirname, "dist", "server.cjs"))) {
  // Production environment: run the compiled CommonJS server bundle
  import("./dist/server.cjs");
} else {
  // Development environment: run the live TypeScript server
  import("./server.ts");
}
