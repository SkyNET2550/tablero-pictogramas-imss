let cache;

export async function loadSemanticData() {
  if (cache) return cache;
  const paths = {
    synonyms: "./data/dictionaries/synonyms_es.json",
    institutional: "./data/dictionaries/institutional_terms_es.json",
    stopwords: "./data/dictionaries/stopwords_es.json",
    intents: "./data/intents/intent_map_es.json",
    categories: "./data/categories/semantic_categories_es.json"
  };
  const entries = await Promise.all(Object.entries(paths).map(async ([key, path]) => {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`No se pudo cargar ${path}`);
    return [key, await response.json()];
  }));
  cache = Object.fromEntries(entries);
  return cache;
}

export function expandQuery(query, data) {
  const normalized = normalize(query);
  const output = new Set([query]);
  for (const [concept, aliases] of Object.entries({ ...data.synonyms, ...data.institutional })) {
    const family = [concept, ...aliases];
    if (family.some(term => normalized.includes(normalize(term)) || normalize(term).includes(normalized))) {
      family.forEach(term => output.add(term));
    }
  }
  for (const [intent, concepts] of Object.entries(data.intents)) {
    if (normalized.includes(normalize(intent)) || normalize(intent).includes(normalized)) concepts.forEach(term => output.add(term));
  }
  for (const category of Object.values(data.categories)) {
    if (normalized.includes(normalize(category.label))) category.terms.forEach(term => output.add(term));
  }
  return [...output].slice(0, 12);
}

function normalize(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
