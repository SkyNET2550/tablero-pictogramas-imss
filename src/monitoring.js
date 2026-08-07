const ENDPOINT = "/api/monitoring/events";

export function installMonitoring() {
  window.addEventListener("error", event => report("error", event.message));
  window.addEventListener("unhandledrejection", event => report("unhandledrejection", event.reason?.message || String(event.reason || "Error no identificado")));
}

function report(type, message) {
  const payload = JSON.stringify({ type, message: String(message).slice(0, 500), path: location.pathname });
  try {
    if (navigator.sendBeacon) navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: "application/json" }));
    else void fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true });
  } catch {}
}
