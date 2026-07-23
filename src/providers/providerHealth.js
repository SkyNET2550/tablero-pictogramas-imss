export async function checkProviderConnection(provider, healthQuery = "ayuda") {
  const start = Date.now();
  if (!provider.enabled) return result(provider.id, "disabled", "Servicio desactivado manualmente", start);
  try {
    const response = await provider.search(healthQuery, "es", 3);
    if (!Array.isArray(response)) return result(provider.id, "invalid_response", "Respuesta no válida", start);
    return { ...result(provider.id, "connected", "Servicio disponible", start), resultsCount: response.length };
  } catch (error) {
    return result(provider.id, mapErrorToStatus(error), error.message, start);
  }
}
export function mapErrorToStatus(error) {
  const message = String(error?.message || "").toLowerCase();
  if (message.includes("401") || message.includes("403")) return "auth_error";
  if (message.includes("429")) return "rate_limited";
  if (message.includes("timeout") || message.includes("timed out")) return "timeout";
  if (message.includes("500") || message.includes("502") || message.includes("503") || message.includes("stopped")) return "disconnected";
  return "unknown";
}
function result(provider, status, message, start) { return { provider, status, responseTimeMs: Date.now() - start, message, checkedAt: new Date().toISOString() }; }
