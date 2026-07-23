export function normalizeText(value, stopwords = []) {
  const original = String(value || "").trim();
  const normalized = original.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9ñ\s]/g, " ").replace(/\s+/g, " ").trim();
  const ignored = new Set(stopwords.map(word => normalizeText(word).normalized));
  return { original, normalized, tokens: normalized.split(" ").filter(token => token && !ignored.has(token)) };
}
