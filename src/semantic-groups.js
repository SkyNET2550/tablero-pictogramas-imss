export async function loadSemanticGroups() {
  const response = await fetch("./data/grupos-semanticos.json");
  if (!response.ok) throw new Error("No se pudo leer data/grupos-semanticos.json");
  return response.json();
}

export async function loadManualSelections() {
  try {
    const response = await fetch("./data/pictogramas-seleccionados.json");
    return response.ok ? response.json() : {};
  } catch {
    return {};
  }
}
