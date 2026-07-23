import { normalizeText } from "./textNormalizer.js";
export function rankResults(results, context) {
  return results.map(result => {
    const label = normalizeText(result.label).normalized;
    const types = [];
    let score = 0;
    if (label === context.normalized) { score += 35; types.push("exacta"); }
    if (context.synonyms.some(term => label.includes(normalizeText(term).normalized))) { score += 20; types.push("sinonimo"); }
    if (context.intents.some(term => label.includes(normalizeText(term).normalized))) { score += 20; types.push("intencion"); }
    if (context.categories.some(category => result.semanticCategory === category)) { score += 10; types.push("categoria"); }
    if ((result.provider || "").toLowerCase() === "arasaac") score += 5;
    if (result.validated) score += 5;
    if (result.localPath) score += 5;
    return { ...result, score, match_type: [...new Set(types)] };
  }).sort((a, b) => b.score - a.score);
}
