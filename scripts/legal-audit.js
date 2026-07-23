import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
const root = join(import.meta.dirname, "..");
const items = JSON.parse(await readFile(join(root, "data/metadata/pictograms_master.json"), "utf8"));
const providers = {};
for (const item of items) {
  const key = item.provider || "unknown";
  providers[key] ||= { count: 0, licenses: new Set(), authors: new Set(), missingLicense: 0, missingAttribution: 0 };
  const record = providers[key];
  record.count++;
  if (item.license) record.licenses.add(item.license); else record.missingLicense++;
  if (item.author) record.authors.add(item.author);
  if (!item.attribution) record.missingAttribution++;
}
const normalized = Object.fromEntries(Object.entries(providers).map(([key, value]) => [key, { ...value, licenses: [...value.licenses], authors: [...value.authors] }]));
const risks = [
  "OpenSymbols y Global Symbols no deben activarse sin registrar credenciales, conjunto de símbolos y licencia específica.",
  "SymboTalk debe conservar providerOriginal y licencia del repositorio fuente; su servicio documentado se encuentra detenido.",
  "Las imágenes PNG cargadas manualmente requieren declaración de autoría, permiso o licencia antes de publicación externa.",
  "CC BY-NC-SA de ARASAAC exige atribución, finalidad no comercial y condiciones compatibles para obras derivadas."
];
const report = { generated_at: new Date().toISOString(), total: items.length, providers: normalized, risks, technical_conclusion: items.every(item => item.license && item.author && item.attribution) ? "El acervo maestro registrado cumple los campos técnicos mínimos de licencia y atribución." : "Existen registros incompletos que deben corregirse." };
await writeFile(join(root, "metadata/legal_audit.json"), JSON.stringify(report, null, 2));
const md = `# Informe técnico de licencias y atribución

Fecha: ${report.generated_at}

Este informe es una revisión técnica documental y no sustituye el dictamen de la unidad jurídica competente.

## Acervo registrado

- Total de pictogramas: ${report.total}
${Object.entries(normalized).map(([provider, value]) => `- ${provider}: ${value.count}; licencias: ${value.licenses.join(", ") || "sin registrar"}; autoría: ${value.authors.join(", ") || "sin registrar"}`).join("\n")}

## Conclusión técnica

${report.technical_conclusion}

## Riesgos y acciones obligatorias

${risks.map(risk => `- ${risk}`).join("\n")}

## Validación institucional para publicación externa

Antes de publicación institucional externa, la Dirección Jurídica deberá validar finalidad, compatibilidad de licencias, atribuciones, imágenes manuales y condiciones de redistribución.
`;
await writeFile(join(root, "docs/14_INFORME_TECNICO_LICENCIAS.md"), md);
const headers = "provider,count,licenses,authors,missing_license,missing_attribution\n";
const rows = Object.entries(normalized).map(([provider, value]) => [provider,value.count,value.licenses.join("|"),value.authors.join("|"),value.missingLicense,value.missingAttribution].map(csv).join(",")).join("\n");
await writeFile(join(root, "data/metadata/license_registry.csv"), headers + rows + "\n");
console.log(report.technical_conclusion);
function csv(value){const text=String(value??"");return /[",\n]/.test(text)?`"${text.replaceAll('"','""')}"`:text;}
