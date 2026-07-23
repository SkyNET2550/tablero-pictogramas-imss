import { normalizeText } from "./textNormalizer.js";
export function mapCategories(query, categories) {
  const target = normalizeText(query).normalized;
  return Object.entries(categories).filter(([, value]) => target.includes(normalizeText(value.label).normalized) || value.terms.some(term => target.includes(normalizeText(term).normalized))).map(([id]) => id);
}
