const WHATSAPP_NUMBER = "5561920056736";
const DEFAULT_MESSAGE = "Olá! Vim pela página do Lava Rápido Planaltina e quero conhecer as condições dos planos de lavagem.";

function whatsappUrl(message = DEFAULT_MESSAGE) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function trackAnalytics(eventName, params = {}) {
  if (eventName === "whatsapp_form_submit" && typeof window.fbq === "function") {
    window.fbq("track", "Lead", {
      content_name: "Formulario WhatsApp",
      content_category: "landing_page",
    });
  }
  if (typeof window.gtag === "function") window.gtag("event", eventName, params);
  else if (typeof window.plausible === "function") window.plausible(eventName, { props: params });
  else if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: eventName, ...params });
}

document.querySelectorAll("[data-whatsapp]").forEach((link) => {
  link.href = whatsappUrl();
  link.addEventListener("click", () => trackAnalytics("whatsapp_click", { source: link.dataset.source || "page" }));
});

const form = document.querySelector("#whatsapp-form");
const nameInput = document.querySelector("#name");
const plateInput = document.querySelector("#plate");
const vehicleInput = document.querySelector("#vehicle");
const planInput = document.querySelector("#plan");
const submitButton = document.querySelector("#form-submit");
const mobileSubmitButton = document.querySelector("#mobile-submit");

function normalizePlate(value) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
}

function setError(fieldName, message = "") {
  const field = document.querySelector(`#${fieldName}-field`);
  const input = document.querySelector(`#${fieldName}`);
  const error = document.querySelector(`#${fieldName}-error`);
  field.classList.toggle("field-error", Boolean(message));
  input.setAttribute("aria-invalid", message ? "true" : "false");
  error.textContent = message;
}

plateInput.addEventListener("input", () => {
  plateInput.value = normalizePlate(plateInput.value);
  setError("plate");
});
nameInput.addEventListener("input", () => setError("name"));
planInput.addEventListener("change", () => setError("plan"));
vehicleInput.addEventListener("change", () => {
  setError("vehicle");
  const category = ["Hatch", "Sedan"].includes(vehicleInput.value) ? "small" : ["SUV", "Caminhonete"].includes(vehicleInput.value) ? "large" : "";
  planInput.querySelectorAll("option[data-category]").forEach((option) => {
    option.disabled = Boolean(category) && option.dataset.category !== category;
  });
  const selectedCategory = planInput.selectedOptions[0]?.dataset.category;
  if (selectedCategory && selectedCategory !== category) planInput.value = "";
  setError("plan");
});

document.querySelectorAll("[data-plan-choice]").forEach((link) => {
  link.addEventListener("click", () => {
    vehicleInput.value = link.dataset.vehicleChoice || "";
    vehicleInput.dispatchEvent(new Event("change"));
    planInput.value = link.dataset.planChoice || "";
    planInput.dispatchEvent(new Event("change"));
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const cleanName = nameInput.value.trim();
  const cleanPlate = normalizePlate(plateInput.value);
  const vehicle = vehicleInput.value;
  const validPlate = /^[A-Z]{3}(?:\d{4}|\d[A-Z]\d{2})$/.test(cleanPlate);

  setError("name", cleanName ? "" : "Informe seu nome.");
  setError("plate", !cleanPlate ? "Informe a placa." : validPlate ? "" : "Use uma placa válida, como ABC1D23 ou ABC1234.");
  setError("vehicle", vehicle ? "" : "Selecione o modelo.");
  setError("plan", planInput.value ? "" : "Selecione o plano.");

  if (!cleanName || !validPlate || !vehicle || !planInput.value) {
    form.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }

  const message = `Olá! Vim pela página do Lava Rápido Planaltina e quero contratar um plano.\n\nNome: ${cleanName}\nPlaca do veículo: ${cleanPlate}\nModelo do veículo: ${vehicle}\nPlano escolhido: ${planInput.value}\n\nGostaria de confirmar as condições, os serviços incluídos e saber como finalizar a contratação.`;
  form.setAttribute("aria-busy", "true");
  submitButton.disabled = true;
  submitButton.innerHTML = '<span class="spinner" aria-hidden="true"></span> Abrindo WhatsApp...';
  trackAnalytics("whatsapp_form_submit", { vehicle, plan: planInput.value });
  window.location.assign(whatsappUrl(message));
  window.setTimeout(() => {
    form.removeAttribute("aria-busy");
    submitButton.disabled = false;
    submitButton.innerHTML = '<span class="button-label">Continuar pelo WhatsApp</span>';
  }, 1600);
});

mobileSubmitButton.addEventListener("click", () => form.requestSubmit());
