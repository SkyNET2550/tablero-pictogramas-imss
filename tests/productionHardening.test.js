import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vercelApi from "../api/[...path].js";

test("la API web expone salud y degrada almacenamiento sin credenciales", async () => {
  const health = await vercelApi.fetch(new Request("https://example.test/api/health"));
  assert.equal(health.status, 200);
  assert.equal((await health.json()).runtime, "vercel");
  const cloud = await vercelApi.fetch(new Request("https://example.test/api/cloud/boards", {
    method: "POST",
    headers: { "X-Board-Key": "a".repeat(40), "Content-Type": "application/json" },
    body: JSON.stringify({ board: { title: "Prueba" } }),
  }));
  assert.equal(cloud.status, 503);
  const preference = await vercelApi.fetch(new Request("https://example.test/api/providers/arasaac/enabled", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled: false }),
  }));
  assert.equal(preference.status, 200);
  assert.equal((await preference.json()).arasaac.enabled, false);
});

test("el servidor local limita exposición, tamaño y frecuencia", async () => {
  const server = await readFile("scripts/server.js", "utf8");
  const security = await readFile("src/server/http-security.js", "utf8");
  assert.match(server, /APP_HOST \|\| "127\.0\.0\.1"/);
  assert.doesNotMatch(server, /server\.listen\(4173, "0\.0\.0\.0"/);
  assert.doesNotMatch(server, /Access-Control-Allow-Origin[^\n]+\*/);
  assert.match(security, /DEFAULT_LIMIT_BYTES/);
  assert.match(security, /enforceRateLimit/);
  assert.match(server, /process\.execPath/);
  assert.match(server, /Promise\.allSettled/);
});

test("la edición web conserva tableros en IndexedDB y documenta metadatos de imágenes", async () => {
  const storage = await readFile("src/browser-storage.js", "utf8");
  const editor = await readFile("src/board-editor.js", "utf8");
  const html = await readFile("index.html", "utf8");
  assert.match(storage, /indexedDB\.open/);
  assert.match(editor, /saveBoardsToBrowser/);
  assert.match(html, /id="picker-author"/);
  assert.match(html, /id="picker-license"/);
  assert.match(editor, /Imagen proporcionada por la persona usuaria/);
  assert.match(editor, /Uso autorizado para este tablero/);
  assert.match(editor, /No fue posible leer la imagen PNG/);
  assert.match(editor, /No fue posible cargar el archivo PNG/);
});

test("Vercel publica encabezados defensivos", async () => {
  const config = JSON.parse(await readFile("vercel.json", "utf8"));
  const serialized = JSON.stringify(config);
  for (const header of ["Content-Security-Policy", "X-Content-Type-Options", "X-Frame-Options", "Permissions-Policy"]) {
    assert.match(serialized, new RegExp(header));
  }
});
