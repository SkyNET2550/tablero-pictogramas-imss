import { getPictogramImageUrl, searchPictograms } from "../../arasaac-api.js";

export const arasaacProvider = {
  id: "arasaac",
  name: "ARASAAC",
  enabled: true,
  license: "CC BY-NC-SA",
  attribution: "Gobierno de Aragón / Sergio Palao / ARASAAC",
  getProviderInfo() { return { id: this.id, name: this.name, requiresAuth: false, supportedLanguages: ["es", "en", "fr", "de", "it", "pt"], enabled: this.enabled }; },
  normalizeResult(item, query = "") { return { provider: "arasaac", remoteId: item._id, label: item.keywords?.[0]?.keyword || query, imageUrl: getPictogramImageUrl(item._id), license: this.license, author: "Sergio Palao", attribution: this.attribution, raw: item }; },
  async download(symbol) { const response = await fetch(symbol.imageUrl); if (!response.ok) throw new Error(`Descarga ARASAAC ${response.status}`); return response.blob(); },
  getLicense() { return { license: this.license, attribution: this.attribution }; },
  async search(query, language = "es", limit = 12) {
    const results = await searchPictograms(query, language, limit);
    return results.map(item => this.normalizeResult(item, query));
  }
};
