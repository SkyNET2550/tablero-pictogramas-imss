import { normalizeText } from "./textNormalizer.js";
export function mapIntents(query, intents) {
  const target = normalizeText(query).normalized;
  return Object.entries(intents).filter(([intent]) => target.includes(normalizeText(intent).normalized) || normalizeText(intent).normalized.includes(target)).flatMap(([, concepts]) => concepts);
}
