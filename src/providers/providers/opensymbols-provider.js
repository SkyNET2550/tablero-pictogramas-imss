export const openSymbolsProvider = {
  id: "opensymbols", name: "OpenSymbols", enabled: false,
  reason: "Requiere validar el endpoint o token de la instalación.",
  getProviderInfo() { return { id: this.id, name: this.name, requiresAuth: true, enabled: this.enabled }; },
  normalizeResult(item) { return item; }, getLicense(item) { return item?.license || ""; },
  async download(symbol) { const response = await fetch(symbol.imageUrl); return response.blob(); },
  async search() { return []; }
};
