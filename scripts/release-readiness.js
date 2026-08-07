import { readFile, access } from "node:fs/promises";

const checks = [];
await required("package-lock.json", "Instalación reproducible");
await required("api/[...path].js", "API web de Vercel");
await required(".github/workflows/ci.yml", "Integración continua");
await required("docs/PILOTO_PUBLICACION.md", "Plan de piloto");
const missing = JSON.parse(await readFile("data/pictogramas-no-encontrados.json", "utf8"));
checks.push({ name: "Pictogramas configurados", passed: missing.length === 0, blocking: false, detail: `${missing.length} pendientes de validación` });
const legal = JSON.parse(await readFile("metadata/legal_audit.json", "utf8"));
checks.push({ name: "Metadatos legales del acervo", passed: !Object.values(legal.providers || {}).some(provider => provider.missingLicense || provider.missingAttribution), blocking: true });
checks.push({ name: "Validación humana de accesibilidad", passed: false, blocking: true, detail: "Requiere NVDA/JAWS y personas usuarias" });
checks.push({ name: "Autorización institucional", passed: false, blocking: true, detail: "Requiere aprobación del IMSS" });
const blocked = checks.some(check => check.blocking && !check.passed);
console.log(JSON.stringify({ generatedAt: new Date().toISOString(), status: blocked ? "NO-GO" : "GO", checks }, null, 2));
if (blocked && process.argv.includes("--strict")) process.exitCode = 1;
async function required(file, name) { try { await access(file); checks.push({ name, passed: true, blocking: true }); } catch { checks.push({ name, passed: false, blocking: true, detail: `Falta ${file}` }); } }
