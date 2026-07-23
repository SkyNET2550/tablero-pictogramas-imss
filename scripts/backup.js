import { cp, mkdir } from "node:fs/promises";
import { join } from "node:path";
const root = join(import.meta.dirname, "..");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const destination = join(root, "backups", stamp);
await mkdir(destination, { recursive: true });
for (const item of ["metadata", "data/metadata", "pictograms", "outputs"]) {
  await cp(join(root, item), join(destination, item), { recursive: true, force: true });
}
console.log(`Respaldo creado en ${destination}`);
