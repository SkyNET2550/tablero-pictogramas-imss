export const globalSymbolsProvider = {
  id: "globalsymbols", name: "Global Symbols", enabled: true,
  reason: "La credencial se administra exclusivamente en el servidor.",
  getProviderInfo() { return { id: this.id, name: this.name, requiresAuth: true, enabled: this.enabled }; },
  normalizeResult(item) { return item; }, getLicense(item) { return item?.license || ""; },
  async download(symbol) { const response = await fetch(symbol.imageUrl); return response.blob(); },
  async search(query, language = "es", limit = 24) {
    const params = new URLSearchParams({ q: query, language, page: "1", limit: String(limit), provider: "globalsymbols" });
    const response = await fetch(`/api/pictograms/search?${params}`);
    if (response.status === 503) return [];
    if (!response.ok) throw new Error(`Global Symbols: HTTP ${response.status}`);
    return (await response.json()).items || [];
  }
};
