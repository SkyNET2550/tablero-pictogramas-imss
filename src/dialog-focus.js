const openers = new WeakMap();

export function showAccessibleDialog(dialog, { opener = document.activeElement, focus } = {}) {
  if (!dialog) return;
  if (opener instanceof HTMLElement) openers.set(dialog, opener);
  if (!dialog.open) dialog.showModal();
  requestAnimationFrame(() => {
    const target = typeof focus === "string" ? dialog.querySelector(focus) : focus;
    (target || dialog.querySelector("button, input, textarea, select, [tabindex]:not([tabindex='-1'])"))?.focus();
  });
}

export function closeAccessibleDialog(dialog) {
  if (dialog?.open) dialog.close();
}

export function installDialogFocusManagement(dialog) {
  if (!dialog || dialog.dataset.focusManaged) return;
  dialog.dataset.focusManaged = "true";
  dialog.addEventListener("close", () => {
    const opener = openers.get(dialog);
    if (opener?.isConnected) requestAnimationFrame(() => {
      const collapsedDetails = opener.closest("details:not([open])");
      (collapsedDetails?.querySelector("summary") || opener).focus();
    });
    openers.delete(dialog);
  });
  dialog.addEventListener("click", event => {
    if (event.target === dialog) closeAccessibleDialog(dialog);
  });
}
