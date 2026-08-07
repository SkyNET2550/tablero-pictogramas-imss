import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const html = await readFile(join(root, "index.html"), "utf8");
const css = await readFile(join(root, "styles/print-letter.css"), "utf8");
const editor = await readFile(join(root, "src/board-editor.js"), "utf8");
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
const dialogs = [...html.matchAll(/<dialog\b([^>]*)>/gi)].map(match => match[1]);
const checks = {
  languageDeclared: /<html\s+lang="es">/.test(html),
  viewportDeclared: /name="viewport"/.test(html),
  skipLinkTargetsMain: /class="skip-link"\s+href="#main-content"/.test(html) && /id="main-content"/.test(html),
  uniqueIds: duplicateIds.length === 0,
  imageAlternatives: !/<img(?![^>]*\balt=)[^>]*>/i.test(html),
  labelledDialogs: dialogs.length > 0 && dialogs.every(attributes => /aria-labelledby=/.test(attributes)),
  liveRegions: /aria-live="polite"/.test(html),
  visibleFocus: /:focus-visible/.test(css),
  reducedMotion: /prefers-reduced-motion/.test(css),
  forcedColors: /forced-colors/.test(css),
  dialogFocusRestoration: /installDialogFocusManagement/.test(editor),
  keyboardCellMovement: /ArrowLeft/.test(editor) && /ArrowRight/.test(editor),
  noMojibake: !/[\u00c3\u00c2]/.test(html + css)
};
const failures = Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name);
const report = { generated_at: new Date().toISOString(), checks, passed: failures.length === 0, failures, duplicateIds, manual_review_required: ["NVDA y JAWS", "Contraste WCAG medido", "Zoom 200 % y 400 %", "Prueba táctil", "Prueba con personas usuarias de CAA"] };

if (process.argv.includes("--write")) {
  await writeFile(join(root, "metadata/accessibility_audit.json"), JSON.stringify(report, null, 2));
  await writeFile(join(root, "docs/15_INFORME_ACCESIBILIDAD.md"), `# Informe de accesibilidad\n\nFecha: ${report.generated_at}\n\nResultado automatizado: **${report.passed ? "APROBADO" : "CON HALLAZGOS"}**\n\n${Object.entries(checks).map(([name, passed]) => `- [${passed ? "x" : " "}] ${name}`).join("\n")}\n\n## Validaciones manuales pendientes\n\n${report.manual_review_required.map(item => `- ${item}`).join("\n")}\n`);
}
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
