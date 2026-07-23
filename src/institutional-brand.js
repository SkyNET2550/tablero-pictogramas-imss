const LOGO_KEY = "arasaac-institutional-logo-v1";
const DEFAULT_LOGO = "./assets/institutional/logotipo-imss.svg";
const HEADER_LOGO = "./assets/institutional/logotipo-imss-blanco.svg";

export function initInstitutionalBrand(onChange) {
  const button = document.querySelector("#logo-upload-button");
  const input = document.querySelector("#logo-file-input");
  button.addEventListener("contextmenu", event => {
    event.preventDefault();
    input.click();
  });
  button.addEventListener("keydown", event => {
    if (event.key === "F2") input.click();
  });
  input.addEventListener("change", event => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      localStorage.setItem(LOGO_KEY, reader.result);
      renderAppLogo(reader.result);
      onChange?.(reader.result);
    });
    reader.readAsDataURL(file);
  });
  renderAppLogo(localStorage.getItem(LOGO_KEY) || HEADER_LOGO);
}

export function getInstitutionalLogo() {
  return localStorage.getItem(LOGO_KEY) || DEFAULT_LOGO;
}

function renderAppLogo(source) {
  const image = document.querySelector("#app-logo");
  image.addEventListener("error", () => {
    localStorage.removeItem(LOGO_KEY);
    if (!image.src.endsWith("/assets/institutional/logotipo-imss-blanco.svg")) {
      image.src = HEADER_LOGO;
    }
  }, { once: true });
  image.src = source;
  image.hidden = false;
  document.querySelector("#logo-placeholder").hidden = true;
}
