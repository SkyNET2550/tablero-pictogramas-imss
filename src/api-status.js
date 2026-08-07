import { statusLabels } from "./config/connectionStatus.schema.js";
import { closeAccessibleDialog, installDialogFocusManagement, showAccessibleDialog } from "./dialog-focus.js";
import { safeIdentifier } from "./security.js";

const dialog = document.querySelector("#api-services-dialog");
const body = document.querySelector("#api-status-body");
const globalStatus = document.querySelector("#api-global-status");
const linkDialog = document.querySelector("#api-link-dialog");

export function initApiStatus() {
  installDialogFocusManagement(dialog);
  installDialogFocusManagement(linkDialog);
  document.querySelector("#api-services-button").addEventListener("click", async event => {
    showAccessibleDialog(dialog, { opener: event.currentTarget, focus: "#verify-all-providers" });
    await loadStatus();
  });
  document.querySelector("#close-api-services").addEventListener("click", () => closeAccessibleDialog(dialog));
  document.querySelector("#verify-all-providers").addEventListener("click", verifyAll);
  document.querySelector("#close-api-link").addEventListener("click", () => closeAccessibleDialog(linkDialog));
  document.querySelector("#api-link-form").addEventListener("submit", connectProvider);
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    if (linkDialog.open) closeAccessibleDialog(linkDialog);
    else if (dialog.open) closeAccessibleDialog(dialog);
  });
}
async function loadStatus() {
  globalStatus.textContent = "Consultando servicios…";
  try {
    const response = await fetch("/api/providers/status", { headers: { Accept: "application/json" } });
    if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) throw new Error("API no disponible");
    render(await response.json());
    globalStatus.textContent = "";
  } catch {
    body.replaceChildren();
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 7;
    cell.textContent = "Los servicios de servidor no están disponibles en esta edición. El acervo local y ARASAAC continúan funcionando.";
    row.append(cell); body.append(row);
    globalStatus.textContent = "Modo web sin servicios de servidor";
  }
}
async function verifyAll() {
  globalStatus.textContent = "Verificando servicios…";
  try {
    const response = await fetch("/api/providers/check-all", { method: "POST", headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Error ${response.status}`);
    render(await response.json());
    globalStatus.textContent = "Verificación terminada";
  } catch { globalStatus.textContent = "No fue posible verificar los servicios en esta edición"; }
}
function render(status) {
  body.replaceChildren();
  const overrides = {};
  let savedOverrides = {};
  try { savedOverrides = JSON.parse(localStorage.getItem("provider-enabled-overrides") || "{}"); } catch {}
  Object.values(status).forEach(item => {
    if (typeof savedOverrides[item.id] === "boolean") item.enabled = savedOverrides[item.id];
    overrides[item.id] = item.enabled && (item.status === "connected" || item.status === "unknown");
    const row = document.createElement("tr");
    const cells = Array.from({ length: 7 }, () => document.createElement("td"));
    cells[0].textContent = String(item.name || item.id || "Proveedor");
    const badge = document.createElement("span"); badge.className = "api-status"; badge.dataset.status = safeIdentifier(item.status); badge.textContent = statusLabels[item.status] || String(item.status || "unknown");
    const message = document.createElement("small"); message.textContent = String(item.message || "");
    cells[1].append(badge, document.createElement("br"), message);
    cells[2].textContent = String(item.authLabel || "");
    cells[3].textContent = item.checkedAt ? new Date(item.checkedAt).toLocaleString("es-MX") : "Sin verificar";
    cells[4].textContent = item.responseTimeMs == null ? "—" : `${Number(item.responseTimeMs)} ms`;
    const checkbox = document.createElement("input"); checkbox.type = "checkbox"; checkbox.checked = Boolean(item.enabled); checkbox.setAttribute("aria-label", `Activar ${item.name || "proveedor"}`); cells[5].append(checkbox);
    const actions = document.createElement("div"); actions.className = "api-row-actions";
    const check = document.createElement("button"); check.type = "button"; check.dataset.action = "check"; check.textContent = "Verificar";
    const link = document.createElement("button"); link.type = "button"; link.dataset.action = "link"; link.textContent = "Vincular";
    actions.append(check, link); cells[6].append(actions); row.append(...cells);
    checkbox.addEventListener("change", async () => {
      const current = JSON.parse(localStorage.getItem("provider-enabled-overrides") || "{}");
      current[item.id] = checkbox.checked;
      localStorage.setItem("provider-enabled-overrides", JSON.stringify(current));
      try {
        const response = await fetch(`/api/providers/${item.id}/enabled`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: checkbox.checked }) });
        if (!response.ok) throw new Error(`Error ${response.status}`);
        await loadStatus();
      } catch { globalStatus.textContent = "No se pudo actualizar el proveedor"; }
    });
    row.querySelector('[data-action="check"]').addEventListener("click", async () => {
      try {
        const response = await fetch(`/api/providers/${item.id}/check`, { method: "POST" });
        if (!response.ok) throw new Error(`Error ${response.status}`);
        render(await response.json());
      } catch { globalStatus.textContent = "No se pudo verificar el proveedor"; }
    });
    row.querySelector('[data-action="link"]').addEventListener("click", () => openLinkDialog(item));
    body.append(row);
  });
  localStorage.setItem("provider-enabled-overrides", JSON.stringify(overrides));
}
function openLinkDialog(item) {
  document.querySelector("#api-link-provider-id").value = item.id;
  document.querySelector("#api-link-provider-name").textContent = item.name;
  document.querySelector("#api-link-key").value = "";
  document.querySelector("#api-link-username").value = "";
  document.querySelector("#api-link-password").value = "";
  document.querySelector("#api-link-status").textContent = "";
  showAccessibleDialog(linkDialog, { opener: document.activeElement, focus: "#api-link-key" });
}
async function connectProvider(event) {
  event.preventDefault();
  const id = document.querySelector("#api-link-provider-id").value;
  const payload = {
    apiKey: document.querySelector("#api-link-key").value,
    username: document.querySelector("#api-link-username").value,
    password: document.querySelector("#api-link-password").value
  };
  const status = document.querySelector("#api-link-status");
  status.textContent = "Conectando…";
  try {
    const response = await fetch(`/api/providers/${id}/connect`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = response.headers.get("content-type")?.includes("application/json") ? await response.json() : {};
    status.textContent = result.message || (response.ok ? "Conexión configurada" : "No fue posible conectar");
    if (response.ok) {
      await loadStatus();
      setTimeout(() => closeAccessibleDialog(linkDialog), 700);
    }
  } catch { status.textContent = "El servicio de conexión no está disponible"; }
}
