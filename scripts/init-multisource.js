import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

const root = join(import.meta.dirname, "..");
const providers = ["arasaac", "opensymbols", "globalsymbols", "symbotalk"];
const categories = ["comunicacion_basica", "atencion_medica", "urgencias", "orientacion_institucional", "higiene_y_cuidado", "alimentacion", "emociones"];
const directories = [
  "data/metadata", "data/semantic_groups", "data/boards",
  "cache/thumbnails", "output/html", "output/pdf", "output/png", "output/print", "logs"
];
for (const provider of providers) {
  directories.push(`pictograms/${provider}/raw`, `pictograms/${provider}/normalized`, `pictograms/${provider}/metadata`, `cache/api_responses/${provider}`);
  for (const category of categories) directories.push(`pictograms/${provider}/by_category/${category}`);
}
for (const directory of directories) await mkdir(join(root, directory), { recursive: true });

const oldMetadata = JSON.parse(await readFile(join(root, "data/pictogramas-metadata.json"), "utf8"));
const master = [];
let sequence = 1;
for (const item of Object.values(oldMetadata)) {
  if (!item.id || !item.term || !item.group) continue;
  const concept = normalize(item.term);
  const filename = `${concept}__arasaac__${item.id}.png`;
  const source = join(root, "assets/pictograms", item.group, `${slug(item.term)}.png`);
  const raw = join(root, "pictograms/arasaac/raw", filename);
  const normalized = join(root, "pictograms/arasaac/normalized", filename);
  const category = mapCategory(item.group);
  const categoryPath = join(root, "pictograms/arasaac/by_category", category, filename);
  if (existsSync(source)) {
    await copyFile(source, raw); await copyFile(source, normalized); await copyFile(source, categoryPath);
  }
  master.push({
    local_id: `picto_${String(sequence++).padStart(6, "0")}`, provider: "arasaac", remote_id: item.id,
    concept: item.term, label: sentenceCase(item.term), language: "es", semantic_category: category,
    source_url: "https://arasaac.org", image_url: item.url,
    local_raw_path: relative(raw), local_normalized_path: relative(normalized), local_category_path: relative(categoryPath),
    file_format: "png", license: "CC BY-NC-SA", author: "Sergio Palao",
    attribution: "Gobierno de Aragón / Sergio Palao / ARASAAC",
    download_date: item.date || "", last_checked: new Date().toISOString(), status: existsSync(source) ? "active" : "missing"
  });
}
await writeFile(join(root, "data/metadata/pictograms_master.json"), JSON.stringify(master, null, 2));
await writeFile(join(root, "data/metadata/pictograms_master.csv"), toCsv(master));
for (const provider of providers) {
  const records = master.filter(item => item.provider === provider);
  await writeFile(join(root, `pictograms/${provider}/metadata/${provider}_metadata.json`), JSON.stringify(records, null, 2));
  await writeFile(join(root, `pictograms/${provider}/metadata/${provider}_metadata.csv`), toCsv(records));
}
for (const file of ["download_log.csv", "license_registry.csv"]) {
  const path = join(root, "data/metadata", file);
  if (!existsSync(path)) await writeFile(path, "");
}
for (const file of ["app.log", "downloads.log", "errors.log"]) {
  const path = join(root, "logs", file);
  if (!existsSync(path)) await writeFile(path, "");
}
console.log(`Estructura multifuente creada. ${master.length} pictogramas incorporados al catálogo maestro.`);

function normalize(value) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""); }
function slug(value) { return normalize(value).replaceAll("_", "-"); }
function sentenceCase(value) { return value.charAt(0).toLocaleUpperCase("es") + value.slice(1); }
function relative(path) { return path.slice(root.length + 1).replaceAll("\\", "/"); }
function mapCategory(group) {
  return ({ "comunicacion-basica": "comunicacion_basica", "atencion-medica": "atencion_medica", "proteccion-civil": "urgencias", "orientacion-institucional": "orientacion_institucional" })[group] || "comunicacion_basica";
}
function toCsv(records) {
  if (!records.length) return "";
  const headers = Object.keys(records[0]);
  return `${headers.join(",")}\n${records.map(record => headers.map(header => csv(record[header])).join(",")).join("\n")}\n`;
}
function csv(value) { const text = String(value ?? ""); return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; }
