import { seedBoards } from "../boards/seedBoards.js";

export const pictogramSeedRequests = seedBoards.filter(board => board.level === "subboard").map(board => ({
  boardSlug: seedBoards.find(parent => parent.id === board.parentId)?.slug || "",
  subboardSlug: board.slug,
  requiredConcepts: board.semanticKeywords,
  naturalPhrases: board.naturalPhrases,
  preferredSources: ["arasaac", "globalsymbols", "local"],
  fallbackStrategy: "semantic-search",
  requiresManualReview: board.requiresManualReview,
  reviewReason: board.reviewReason
}));
