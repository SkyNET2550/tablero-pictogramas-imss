import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const execute = promisify(execFile);

test("genera DOCX, PDF y PNG portables", { timeout: 120_000 }, async () => {
  const directory = await mkdtemp(join(tmpdir(), "pictogramas-export-"));
  const input = join(directory, "board.json");
  const payload = { board: { title: "Prueba portable", cells: Array(16).fill(null) }, headerImage: "./assets/institutional/encabezado-gobierno-imss.jpg", footer: "Prueba de exportación" };
  await writeFile(input, JSON.stringify(payload));
  try {
    for (const [format, signature] of [["docx", "PK"], ["pdf", "%PDF"], ["png", "89504e47"]]) {
      const output = join(directory, `board.${format}`);
      await execute(process.execPath, [resolve(`scripts/export-${format}.cjs`), input, output, process.cwd()], { timeout: 120_000 });
      const bytes = await readFile(output);
      if (format === "png") assert.equal(bytes.subarray(0, 4).toString("hex"), signature);
      else assert.equal(bytes.subarray(0, signature.length).toString(), signature);
    }
  } finally { await rm(directory, { recursive: true, force: true }); }
});
