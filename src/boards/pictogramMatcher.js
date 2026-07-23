const normalize = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export const MATCH_THRESHOLDS = { autoAccept: 80, manualReview: 50, reject: 49 };

export function calculatePictogramMatchScore({ pictogram, board, seedRequest }) {
  const label = normalize(`${pictogram.label} ${pictogram.title || ""} ${(pictogram.semanticKeywords || []).join(" ")}`);
  const exactLabel = normalize(pictogram.label);
  const required = seedRequest?.requiredConcepts || [];
  let score = required.some(term => exactLabel === normalize(term)) ? 40 : 0;
  if (required.some(term => label.includes(normalize(term)) || normalize(term).includes(label))) score += 25;
  if ((board.semanticKeywords || []).some(term => label.includes(normalize(term)))) score += 25;
  if ((pictogram.context || []).some(value => board.context.includes(value))) score += 10;
  if ((pictogram.communicationIntent || []).some(value => board.communicationIntent.includes(value))) score += 10;
  if (!pictogram.license || !pictogram.altText) score -= 30;
  return Math.max(0, Math.min(score, 100));
}

export function matchPictogramsToBoard(pictograms, board, seedRequest) {
  const seen = new Set();
  return pictograms.map(pictogram => ({ pictogram, score: calculatePictogramMatchScore({ pictogram, board, seedRequest }) }))
    .filter(result => result.score >= MATCH_THRESHOLDS.manualReview && result.pictogram.license && result.pictogram.altText)
    .filter(result => {
      const key = `${result.pictogram.source}:${result.pictogram.sourceId || result.pictogram.id}`;
      if (seen.has(key)) return false; seen.add(key); return true;
    })
    .map(result => ({
      ...result,
      needsManualReview: Boolean(board.requiresManualReview || result.score < MATCH_THRESHOLDS.autoAccept),
      reviewReason: board.reviewReason || (result.score < MATCH_THRESHOLDS.autoAccept ? "Coincidencia semántica que requiere revisión." : "")
    }));
}
