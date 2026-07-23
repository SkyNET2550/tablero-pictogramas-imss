import test from "node:test";
import assert from "node:assert/strict";
import { access, mkdir, readFile } from "node:fs/promises";

test("las copias editables se guardan por defecto en la carpeta Guardados", async () => {
  await mkdir("../Guardados", { recursive: true });
  await access("../Guardados");
  const client = await readFile("src/board-editor.js", "utf8");
  const server = await readFile("scripts/server.js", "utf8");
  assert.match(client, /\/api\/native-dialog\/save/);
  assert.match(client, /\.PICTIMS/);
  assert.match(server, /savedDirectory = normalize\(join\(projectRoot, "Guardados"\)\)/);
  assert.match(server, /Archivo de tablero de pictogramas IMSS \(\*\.PICTIMS\)\|\*\.PICTIMS/);
  assert.match(server, /safeFileName/);
});
