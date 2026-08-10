import { readFile, access, readdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { join, relative, sep } from "node:path";

const failures = [];
const server = await readFile("scripts/server.js", "utf8");
const vercel = await readFile("vercel.json", "utf8");
const files = await listProjectFiles();

check(!server.includes('server.listen(4173, "0.0.0.0"'), "El servidor no debe escuchar en 0.0.0.0 por defecto");
check(!server.includes('"Access-Control-Allow-Origin": "*"'), "CORS no debe permitir todos los orígenes");
check(!/[A-Z]:\\Users\\/i.test(server), "No debe haber rutas personales en el servidor");
check(server.includes("readJsonBody"), "Las solicitudes JSON deben tener límites de tamaño");
check(server.includes("enforceRateLimit"), "Las rutas API deben tener límite de frecuencia");
check(vercel.includes("Content-Security-Policy"), "Vercel debe publicar una política CSP");
check(!files.some(file => /(^|\/)\.env$/.test(file)), "No debe versionarse .env");
await access("package-lock.json").catch(() => failures.push("Debe existir package-lock.json"));

if (failures.length) {
  console.error(`Auditoría de seguridad: ${failures.length} hallazgo(s)`);
  failures.forEach(item => console.error(`- ${item}`));
  process.exitCode = 1;
} else console.log("Auditoría de seguridad aprobada.");

function check(condition, message) { if (!condition) failures.push(message); }

async function listProjectFiles() {
  try {
    return execFileSync("git", ["ls-files"], { encoding: "utf8" }).split(/\r?\n/).filter(Boolean);
  } catch {
    return walk(".");
  }
}

async function walk(dir) {
  const ignored = new Set([".git", ".vercel", "node_modules", "Guardados", "backups", "cache", "logs", "output", "outputs"]);
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (ignored.has(entry.name)) continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else files.push(relative(".", fullPath).split(sep).join("/"));
  }
  return files;
}
