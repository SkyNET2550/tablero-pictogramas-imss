export function pictogramKey(item = {}) {
  const provider = normalize(item.provider || item.source || "");
  const remoteId = normalize(item.remoteId || item.id || item._id || "");
  const image = normalizeUrl(item.imageData || item.imageUrl || item.image || item.url || "");
  if (image) return `image:${image}`;
  if (remoteId) return `provider:${provider}|id:${remoteId}`;
  return `label:${normalize(item.label || item.term || "")}`;
}

export function deduplicatePictograms(items = []) {
  const seen = new Set();
  return items.filter(item => {
    if (!item) return false;
    const key = pictogramKey(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function hasPictogramDuplicate(cells = [], candidate, ignoredIndex = -1) {
  const key = pictogramKey(candidate);
  return cells.some((cell, index) => index !== ignoredIndex && cell && pictogramKey(cell) === key);
}

export function removeBoardDuplicates(cells = [], size = 16) {
  const unique = deduplicatePictograms(cells.filter(Boolean));
  return [...unique.slice(0, size), ...Array(Math.max(0, size - unique.length)).fill(null)];
}

function normalize(value = "") {
  return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizeUrl(value = "") {
  return String(value).trim().replace(/^https?:\/\/[^/]+/i, "").replace(/[?#].*$/, "").replace(/\\/g, "/").toLowerCase();
}
