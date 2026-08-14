import { execFileSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

function listJavaScriptFiles(directory) {
  return readdirSync(directory).flatMap(entry => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? listJavaScriptFiles(path) : path.endsWith(".js") ? [path] : [];
  });
}

test("todos los módulos JavaScript del sitio tienen sintaxis válida", () => {
  for (const file of listJavaScriptFiles("src")) {
    execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
  }
});
