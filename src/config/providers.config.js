export const providersConfig = {
  arasaac: { id: "arasaac", name: "ARASAAC", enabled: true, requiresAuth: false, authType: null, healthQuery: "dolor", priority: 1 },
  opensymbols: { id: "opensymbols", name: "OpenSymbols", enabled: true, requiresAuth: true, authType: "shared_secret", healthQuery: "help", priority: 2 },
  globalsymbols: { id: "globalsymbols", name: "Global Symbols", enabled: true, requiresAuth: true, authType: "api_key", healthQuery: "help", priority: 3 },
  symbotalk: { id: "symbotalk", name: "SymboTalk", enabled: true, requiresAuth: false, authType: null, healthQuery: "help", priority: 4 }
};
