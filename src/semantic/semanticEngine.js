import { seedBoards, mainBoards } from "../data/boards/seedBoards.js";

const normalize = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9ñ\s]/g, " ").replace(/\s+/g, " ").trim();
const includesAny = (text, terms) => terms.some(term => text.includes(normalize(term)));

const urgencyTerms = {
  critical: ["no puedo respirar", "no respiro", "me falta el aire", "dolor de pecho", "sangrado", "convulsion", "desmayo", "ambulancia", "911", "incendio", "sismo", "no puedo moverme", "violencia", "amenaza", "estoy en peligro"],
  high: ["urgente", "emergencia", "ayuda", "peligro", "me cai", "accidente"]
};
const contextRules = {
  administrativo: ["tramite", "documento", "cita", "turno", "requisito", "folio", "pago", "recibo", "comprobante", "queja", "seguimiento", "registro", "firma", "curp"],
  medico: ["dolor", "sintoma", "fiebre", "medicamento", "alergia", "medico", "enfermera", "consulta", "urgencias", "inyeccion", "receta", "respirar", "sangrado", "mareo", "vomito"],
  necesidad_basica: ["agua", "comida", "hambre", "sed", "baño", "descanso", "sueño", "frio", "calor", "postura", "silla de ruedas", "cama", "higiene"],
  seguridad: ["emergencia", "accidente", "caida", "incendio", "sismo", "violencia", "amenaza", "perdido", "peligro", "evacuacion", "policia", "ambulancia", "911"]
};
const intentRules = {
  alertar_emergencia: ["emergencia", "urgente", "peligro", "911", "ambulancia", "no puedo respirar"],
  expresar_dolor: ["dolor", "me duele", "duele"],
  informar_sintoma: ["fiebre", "mareo", "vomito", "tos", "sangrado", "alergia"],
  solicitar_tramite: ["tramite", "folio", "cita", "turno", "documento"],
  pedir_accesibilidad: ["rampa", "interprete", "lectura facil", "elevador", "baño accesible"],
  pedir_ayuda: ["ayuda", "auxilio", "no puedo"],
  pedir_privacidad: ["privacidad", "estar solo", "solo"],
  rechazar: ["no quiero", "no acepto"],
  aceptar: ["si", "acepto"]
};

export function expandSemanticQuery(query) {
  const normalized = normalize(query);
  const urgencyLevel = includesAny(normalized, urgencyTerms.critical) ? "critica" : includesAny(normalized, urgencyTerms.high) ? "alta" : "media";
  const detectedContexts = Object.entries(contextRules).filter(([, terms]) => includesAny(normalized, terms)).map(([context]) => context);
  const detectedIntents = Object.entries(intentRules).filter(([, terms]) => includesAny(normalized, terms)).map(([intent]) => intent);
  const rankedBoards = mainBoards.map(board => {
    let score = 0;
    for (const term of board.semanticKeywords) if (normalized.includes(normalize(term)) || normalize(term).includes(normalized)) score += 20;
    if (detectedContexts.includes("administrativo") && board.slug.includes("tramites")) score += 80;
    if (detectedContexts.includes("medico") && board.slug.includes("dolor")) score += 80;
    if (detectedContexts.includes("necesidad_basica") && board.slug.includes("necesidades")) score += 80;
    if (detectedContexts.includes("seguridad") && board.slug.includes("emergencia")) score += 100;
    return { board, score };
  }).sort((a, b) => b.score - a.score);
  const suggestedBoards = rankedBoards.filter(item => item.score > 0).slice(0, 3).map(item => item.board);
  const suggestedSubboards = seedBoards.filter(board => board.level === "subboard").map(board => ({
    board,
    score: board.semanticKeywords.reduce((score, term) => score + (normalized.includes(normalize(term)) || normalize(term).includes(normalized) ? 25 : 0), 0)
      + (includesAny(normalized, ["no puedo respirar", "me falta el aire", "no respiro"]) && board.slug === "respiracion-signos-alarma" ? 150 : 0)
      + (normalized.includes("folio") && board.slug === "quejas-aclaraciones-seguimiento" ? 100 : 0)
      + (normalized.includes("sismo") && board.slug === "evacuacion-proteccion-civil" ? 100 : 0)
  })).filter(item => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 5).map(item => item.board);
  const expandedTerms = new Set([query]);
  [...suggestedBoards, ...suggestedSubboards].forEach(board => board.semanticKeywords.slice(0, 8).forEach(term => expandedTerms.add(term)));
  return {
    original_query: query, normalized_query: normalized,
    detected_intents: detectedIntents, detected_contexts: detectedContexts,
    urgency_level: urgencyLevel, expanded_terms: [...expandedTerms].slice(0, 24),
    suggested_boards: suggestedBoards, suggested_subboards: suggestedSubboards
  };
}

export function rankSemanticPictograms(items, expansion) {
  return items.map(item => {
    const label = normalize(item.label || item.term);
    const searchable = normalize([item.label, item.term, item.altText, item.group, item.providerName].filter(Boolean).join(" "));
    let score = label === expansion.normalized_query ? 90 : 0;
    const reasons = [];
    if (score) reasons.push("etiqueta exacta");
    for (const term of expansion.expanded_terms) {
      const normalizedTerm = normalize(term);
      if (normalizedTerm && searchable.includes(normalizedTerm)) { score += normalizedTerm === label ? 55 : 45; reasons.push("coincidencia semántica"); }
    }
    if (expansion.urgency_level === "critica" && /emergencia|ambulancia|respirar|sangrado|peligro|evacuar/.test(searchable)) { score += 75; reasons.push("urgencia crítica"); }
    if (item.license === "") score -= 100;
    return { ...item, score, matchReasons: [...new Set(reasons)] };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);
}
