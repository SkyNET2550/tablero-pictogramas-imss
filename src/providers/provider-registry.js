import { arasaacProvider } from "./providers/arasaac-provider.js";
import { openSymbolsProvider } from "./providers/opensymbols-provider.js";
import { globalSymbolsProvider } from "./providers/globalsymbols-provider.js";
import { symboTalkProvider } from "./providers/symbotalk-provider.js";

export const providers = [arasaacProvider, openSymbolsProvider, globalSymbolsProvider, symboTalkProvider];

export function enabledProviders() {
  let overrides = {};
  try { overrides = JSON.parse(localStorage.getItem("provider-enabled-overrides")) || {}; } catch {}
  return providers.filter(provider => provider.enabled && overrides[provider.id] !== false);
}

export async function searchAllProviders(queries, language = "es", limitPerProvider = 12) {
  const active = enabledProviders();
  const tasks = active.flatMap(provider =>
    queries.map(async query => {
      try {
        return await provider.search(query, language, limitPerProvider);
      } catch (error) {
        console.warn(`${provider.name}: ${error.message}`);
        return [];
      }
    })
  );
  const responses = await Promise.all(tasks);
  const unique = new Map();
  for (const item of responses.flat()) {
    const key = `${item.provider}:${item.remoteId}`;
    if (!unique.has(key)) unique.set(key, item);
  }
  return [...unique.values()];
}
