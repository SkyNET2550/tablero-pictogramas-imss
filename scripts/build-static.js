import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const config = JSON.parse(await readFile(join(root, "data/grupos-semanticos.json"), "utf8"));
const selections = JSON.parse(await readFile(join(root, "data/pictogramas-seleccionados.json"), "utf8"));
const metadata = {};
const missing = [];
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const slug = text => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

for (const group of config.grupos) {
  const directory = join(root, "assets/pictograms", group.id);
  await mkdir(directory, { recursive: true });
  for (const term of group.conceptos) {
    try {
      const manual = selections[term.toLocaleLowerCase("es")];
      let id = manual?.id;
      if (!id) {
        const search = await fetch(`https://api.arasaac.org/api/pictograms/${config.documento.idioma}/search/${encodeURIComponent(term)}`);
        if (!search.ok) throw new Error(`HTTP ${search.status}`);
        const results = await search.json();
        id = results[0]?._id;
      }
      if (!id) { missing.push({ group: group.id, term }); continue; }
      const url = `https://api.arasaac.org/api/pictograms/${id}?download=false`;
      const image = await fetch(url);
      if (!image.ok) throw new Error(`Imagen HTTP ${image.status}`);
      await writeFile(join(directory, `${slug(term)}.png`), Buffer.from(await image.arrayBuffer()));
      metadata[`${group.id}/${term}`] = { term, group: group.id, id, source: "ARASAAC", author: "Sergio Palao", license: "CC BY-NC-SA", url, date: new Date().toISOString(), manual: Boolean(manual) };
      process.stdout.write(`✓ ${group.titulo}: ${term}\n`);
      await delay(80);
    } catch (error) {
      missing.push({ group: group.id, term, error: error.message });
      process.stderr.write(`✗ ${term}: ${error.message}\n`);
    }
  }
}
await writeFile(join(root, "data/pictogramas-metadata.json"), JSON.stringify(metadata, null, 2));
await writeFile(join(root, "data/pictogramas-no-encontrados.json"), JSON.stringify(missing, null, 2));
await mkdir(join(root, "output"), { recursive: true });
await writeFile(join(root, "output/tablero-institucional.html"), (await readFile(join(root, "index.html"), "utf8")).replaceAll("./", "../"));
console.log(`Construcción terminada: ${Object.keys(metadata).length} pictogramas; ${missing.length} faltantes.`);
