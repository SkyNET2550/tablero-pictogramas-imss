import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
const root = join(import.meta.dirname, "..");
const html = await readFile(join(root, "index.html"), "utf8");
const css = await readFile(join(root, "styles/print-letter.css"), "utf8");
const editor = await readFile(join(root, "src/board-editor.js"), "utf8");
const checks = {
  languageDeclared: /<html lang="es">/.test(html),
  skipLink: /class="skip-link"/.test(html),
  mainLandmark: /<main\s+[^>]*id="main-content"[^>]*>/.test(html),
  imageAlternatives: !/<img(?![^>]*\balt=)[^>]*>/i.test(html),
  visibleFocus: /:focus-visible/.test(css),
  printLetter: /@page\s*\{\s*size:\s*letter/i.test(css),
  keyboardCellMovement: /ArrowLeft/.test(editor) && /ArrowRight/.test(editor),
  noColorOnly: /border/.test(css) && /cell-label/.test(css),
  liveRegions: /aria-live/.test(html)
};
const failures = Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name);
const report = { generated_at: new Date().toISOString(), checks, passed: failures.length === 0, failures, manual_review_required: ["Lector de pantalla NVDA/JAWS", "Contraste con herramientas WCAG", "Prueba con usuarios CAA", "Orden de foco en todos los diálogos"] };
await writeFile(join(root, "metadata/accessibility_audit.json"), JSON.stringify(report, null, 2));
await writeFile(join(root, "docs/15_INFORME_ACCESIBILIDAD.md"), `# Informe de accesibilidad

Fecha: ${report.generated_at}

Resultado automatizado: **${report.passed ? "APROBADO" : "CON HALLAZGOS"}**

${Object.entries(checks).map(([name, passed]) => `- [${passed ? "x" : " "}] ${name}`).join("\n")}

## Validaciones manuales complementarias

${report.manual_review_required.map(item => `- ${item}`).join("\n")}
`);
if (!report.passed) process.exitCode = 1;
else console.log("Auditoría automatizada aprobada.");
