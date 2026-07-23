import { normalizeText } from "./textNormalizer.js";
export function expandSynonyms(query, dictionary) {
  const target = normalizeText(query).normalized;
  const matches = new Set([query]);
  for (const [concept, aliases] of Object.entries(dictionary)) {
    const family = [concept, ...aliases];
    if (family.some(term => target.includes(normalizeText(term).normalized) || normalizeText(term).normalized.includes(target))) family.forEach(term => matches.add(term));
  }
  return [...matches];
}
