import test from "node:test";
import assert from "node:assert/strict";
import { providers, enabledProviders } from "../src/providers/provider-registry.js";
test("existen cuatro adaptadores", () => assert.deepEqual(providers.map(item => item.id).sort(), ["arasaac", "globalsymbols", "opensymbols", "symbotalk"]));
test("ARASAAC está habilitado", () => assert.ok(enabledProviders().some(item => item.id === "arasaac")));
