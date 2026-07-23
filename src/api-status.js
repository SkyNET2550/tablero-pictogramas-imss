import { statusLabels } from "./config/connectionStatus.schema.js";

const dialog = document.querySelector("#api-services-dialog");
const body = document.querySelector("#api-status-body");
const globalStatus = document.querySelector("#api-global-status");
const linkDialog = document.querySelector("#api-link-dialog");

export function initApiStatus() {
  document.querySelector("#api-services-button").addEventListener("click", async () => { dialog.showModal(); await loadStatus(); });
  document.querySelector("#close-api-services").addEventListener("click", () => dialog.close());
  document.querySelector("#verify-all-providers").addEventListener("click", verifyAll);
  document.querySelector("#close-api-link").addEventListener("click", () => linkDialog.close());
  document.querySelector("#api-link-form").addEventListener("submit", connectProvider);
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    if (linkDialog.open) linkDialog.close();
    else if (dialog.open) dialog.close();
  });
}
async function loadStatus() {
  const response = await fetch("/api/providers/status");
  render(await response.json());
}
async function verifyAll() {
  globalStatus.textContent = "Verificando servicios…";
  const response = await fetch("/api/providers/check-all", { method: "POST" });
  const status = await response.json();
  render(status);
  globalStatus.textContent = "Verificación terminada";
}
function render(status) {
  body.replaceChildren();
  const overrides = {};
  Object.values(status).forEach(item => {
    overrides[item.id] = item.enabled && (item.status === "connected" || item.status === "unknown");
    const row = document.createElement("tr");
    row.innerHTML = `<td>${item.name}</td><td><span class="api-status" data-status="${item.status}">${statusLabels[item.status] || item.status}</span><br><small>${item.message || ""}</small></td><td>${item.authLabel}</td><td>${item.checkedAt ? new Date(item.checkedAt).toLocaleString("es-MX") : "Sin verificar"}</td><td>${item.responseTimeMs == null ? "—" : `${item.responseTimeMs} ms`}</td><td><input type="checkbox" ${item.enabled ? "checked" : ""} aria-label="Activar ${item.name}"></td><td><div class="api-row-actions"><button type="button" data-action="check">Verificar</button><button type="button" data-action="link">Vincular</button></div></td>`;
    const checkbox = row.querySelector("input");
    checkbox.addEventListener("change", async () => {
      const current = JSON.parse(localStorage.getItem("provider-enabled-overrides") || "{}");
      current[item.id] = checkbox.checked;
      localStorage.setItem("provider-enabled-overrides", JSON.stringify(current));
      await fetch(`/api/providers/${item.id}/enabled`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: checkbox.checked }) });
      await loadStatus();
    });
    row.querySelector('[data-action="check"]').addEventListener("click", async () => {
      const response = await fetch(`/api/providers/${item.id}/check`, { method: "POST" });
      render(await response.json());
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
  linkDialog.showModal();
  document.querySelector("#api-link-key").focus();
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
  const response = await fetch(`/api/providers/${id}/connect`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const result = await response.json();
  status.textContent = result.message || (response.ok ? "Conexión configurada" : "No fue posible conectar");
  if (response.ok) {
    await loadStatus();
    setTimeout(() => linkDialog.close(), 700);
  }
}
