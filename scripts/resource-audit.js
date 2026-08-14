import { readFile, access, readdir } from "node:fs/promises";
import { dirname, join, normalize, relative, sep } from "node:path";
import { execFileSync } from "node:child_process";

const failures = [];
const tracked = await listProjectFiles();
for (const file of tracked) {
  const text = await readFile(file, "utf8").catch(error => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (text === null) continue;
  if (/[\u00c3\u00c2]/.test(text)) failures.push(`${file}: posible texto mal codificado`);
  if (file.endsWith(".js")) {
    for (const match of text.matchAll(/(?:from\s+|import\s*)["'](\.{1,2}\/[^"']+)["']/g)) {
      const target = normalize(join(dirname(file), match[1]));
      await access(target).catch(() => failures.push(`${file}: importación inexistente ${match[1]}`));
    }
  }
}
const metadata = JSON.parse(await readFile("data/metadata/pictograms_master.json", "utf8"));
metadata.forEach((item, index) => {
  if (!item.license || !item.author || !(item.altText || item.alt_text || item.label || item.term)) failures.push(`pictograms_master[${index}]: faltan licencia, autoría o texto alternativo`);
});
if (failures.length) {
  console.error(`Auditoría de recursos: ${failures.length} hallazgo(s)`);
  failures.slice(0, 50).forEach(item => console.error(`- ${item}`));
  process.exitCode = 1;
} else console.log(`Auditoría de recursos aprobada: ${metadata.length} pictogramas con metadatos.`);

async function listProjectFiles() {
  try {
    return execFileSync("git", ["ls-files", "*.html", "*.css", "*.js", "*.json", "*.md"], { encoding: "utf8" }).split(/\r?\n/).filter(Boolean);
  } catch {
    const all = await walk(".");
    return all.filter(file => /\.(html|css|js|json|md)$/i.test(file));
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
