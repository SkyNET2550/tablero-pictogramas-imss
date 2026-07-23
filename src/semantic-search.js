const normalize = text => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9ñ]+/g, " ").trim();

export async function loadSemanticCatalog() {
  const response = await fetch("./data/catalogo-semantico.json");
  if (!response.ok) throw new Error("No se pudo cargar el catálogo semántico");
  return response.json();
}

export function findSemanticTopic(query, catalog) {
  const sought = normalize(query);
  if (!sought) return null;
  let best = null;
  for (const topic of catalog.temas) {
    const phrases = [topic.titulo, ...topic.aliases, ...topic.secciones.flatMap(section => section.conceptos)];
    let score = 0;
    for (const phrase of phrases) {
      const candidate = normalize(phrase);
      if (candidate === sought) score = Math.max(score, 100);
      else if (sought.includes(candidate) || candidate.includes(sought)) score = Math.max(score, 70);
      const queryWords = sought.split(" ").filter(word => word.length > 2);
      const candidateWords = new Set(candidate.split(" "));
      score = Math.max(score, queryWords.filter(word => candidateWords.has(word)).length * 15);
    }
    if (!best || score > best.score) best = { topic, score };
  }
  return best?.score > 0 ? best.topic : null;
}

export function topicToGroups(topic) {
  return topic.secciones.map((section, index) => ({
    id: `semantic-${topic.id}-${index + 1}`,
    titulo: section.titulo,
    descripcion: `${topic.titulo}: ${topic.descripcion}`,
    conceptos: section.conceptos
  }));
}
