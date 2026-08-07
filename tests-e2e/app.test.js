import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

let server;
let browser;
let page;
const baseUrl = "http://127.0.0.1:4173";

before(async () => {
  server = spawn(process.execPath, ["scripts/server.js"], { stdio: "ignore", env: { ...process.env, APP_HOST: "127.0.0.1" } });
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  page = await browser.newPage();
});
after(async () => { await browser?.close(); server?.kill(); });

test("carga la aplicación sin errores de consola", async () => {
  const errors = [];
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  const response = await page.goto(baseUrl, { waitUntil: "networkidle" });
  assert.equal(response.status(), 200);
  assert.equal(await page.locator("#gallery-title").textContent(), "Acervo de pictogramas");
  assert.deepEqual(errors, []);
});

test("permite abrir Servicios API y recuperar el foco", async () => {
  await page.locator(".app-menu summary").click();
  await page.locator("#api-services-button").focus();
  await page.locator("#api-services-button").click();
  await page.locator("#api-services-dialog").waitFor({ state: "visible" });
  await page.locator("#close-api-services").click();
  await page.waitForFunction(() => document.activeElement?.matches(".app-menu summary"));
  assert.equal(await page.evaluate(() => document.activeElement?.matches(".app-menu summary")), true);
});

test("expone salud local sin revelar rutas del equipo", async () => {
  const health = await (await fetch(`${baseUrl}/api/health`)).json();
  assert.equal(health.ok, true);
  const storage = await (await fetch(`${baseUrl}/api/storage`)).json();
  assert.equal(storage.folder, "Guardados");
  assert.equal("path" in storage, false);
});

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try { if ((await fetch(`${baseUrl}/api/health`)).ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error("El servidor local no inició a tiempo");
}
