const SAFE_DATA_IMAGE = /^data:image\/(?:png|jpeg|gif|webp);base64,/i;

export function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[character]);
}

export function safeImageUrl(value = "") {
  const candidate = String(value).trim();
  if (!candidate) return "";
  if (SAFE_DATA_IMAGE.test(candidate) || candidate.startsWith("blob:")) return candidate;
  try {
    const url = new URL(candidate, document.baseURI);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

export function setSafeImage(image, source, alternative = "") {
  image.alt = String(alternative);
  const safe = safeImageUrl(source);
  if (safe) image.src = safe;
  else image.removeAttribute("src");
  return Boolean(safe);
}

export function safeIdentifier(value = "") {
  return String(value).toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 64);
}
