import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("el menú contiene solo las cuatro acciones principales además de Inicio", async () => {
  const html = await readFile("index.html", "utf8");
  assert.match(html, /Construir tablero/);
  assert.match(html, /Tableros temáticos/);
  assert.match(html, /Tableros predefinidos/);
  assert.match(html, /Servicios API/);
  assert.doesNotMatch(html, /Imprimir \/ Guardar PDF/);
  assert.doesNotMatch(html, /Ver tableros generales/);
});

test("Servicios API permite vincular sin guardar credenciales en el navegador", async () => {
  const html = await readFile("index.html", "utf8");
  const client = await readFile("src/api-status.js", "utf8");
  const server = await readFile("scripts/server.js", "utf8");
  assert.match(html, /id="api-link-dialog"/);
  assert.match(client, />Vincular</);
  assert.match(client, /api\/providers\/\$\{id\}\/connect/);
  assert.doesNotMatch(client, /localStorage.*apiKey|localStorage.*password/);
  assert.match(server, /\/api\\\/providers\\\/\[\^\/\]\+\\\/connect\$/);
});
