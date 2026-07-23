export const symboTalkProvider = {
  id: "symbotalk", name: "SymboTalk", enabled: true,
  baseUrl: "https://symbotalkapiv1.azurewebsites.net",
  getProviderInfo() { return { id: this.id, name: this.name, requiresAuth: false, enabled: this.enabled }; },
  normalizeResult(item, query = "", language = "es") {
    const repository = item.repo_key || "unknown";
    const translated = item.translations?.find(value => value.tLang === language)?.tName;
    return { provider: "symbotalk", providerOriginal: repository, remoteId: item.id ?? item._id, label: translated || item.name || query, imageUrl: item.image_url || item.alt_url, license: item.license || "Licencia no indicada", author: item.author || repository, attribution: `${item.author || repository} / ${repository} / SymboTalk`, raw: item };
  },
  async download(symbol) { const response = await fetch(symbol.imageUrl); return response.blob(); },
  getLicense(symbol) { return { license: symbol.license, attribution: symbol.attribution }; },
  async search(query, language = "es", limit = 12) {
    const parameters = new URLSearchParams({ name: query, lang: language, repo: "all", limit: String(Math.min(limit, 49)) });
    const response = await fetch(`${this.baseUrl}/search/?${parameters}`);
    if (!response.ok) throw new Error(`SymboTalk respondió ${response.status}`);
    const payload = await response.json();
    const results = Array.isArray(payload) ? payload : payload.results || payload.symbols || [];
    return results.map(item => this.normalizeResult(item, query, language)).filter(item => item.imageUrl);
  }
};
