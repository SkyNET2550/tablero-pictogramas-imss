import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("la interfaz y configuración no anuncian integraciones o exportadores pendientes", async () => {
  const files = await Promise.all([
    readFile("index.html", "utf8"),
    readFile("package.json", "utf8"),
    readFile("scripts/server.js", "utf8"),
    readFile("docs/06_exportacion_documentos.md", "utf8")
  ]);
  const content = files.join("\n").toLowerCase();
  assert.doesNotMatch(content, /falta de integrar|pendiente de integrar|dependencia pendiente|forma parte de etapas posteriores|exportador preparado/);
});
