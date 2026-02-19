const STORAGE_KEY = "treinoDiarioData";
const PUBLISHED_URL = "https://simei007.github.io/treino-diario/";
let deferredPrompt = null;

const today = new Date().toISOString().slice(0, 10);
document.getElementById("workoutDate").value = today;
document.getElementById("mealDate").value = today;
const workoutTypeSelect = document.getElementById("workoutType");
const workoutTypeCustomWrap = document.getElementById("workoutTypeCustomWrap");
const workoutTypeCustomInput = document.getElementById("workoutTypeCustom");
const historyModeSelect = document.getElementById("historyMode");
const historyDateWrap = document.getElementById("historyDateWrap");
const historyDateInput = document.getElementById("historyDate");
historyDateInput.value = today;

function toggleWorkoutTypeCustomField() {
  const isOther = workoutTypeSelect.value === "outro";
  workoutTypeCustomWrap.classList.toggle("hidden-field", !isOther);
  workoutTypeCustomInput.required = isOther;
  if (!isOther) workoutTypeCustomInput.value = "";
}

workoutTypeSelect.addEventListener("change", toggleWorkoutTypeCustomField);
toggleWorkoutTypeCustomField();

function toggleHistoryDateField() {
  const isByDate = historyModeSelect.value === "date";
  historyDateWrap.classList.toggle("hidden-field", !isByDate);
}

historyModeSelect.addEventListener("change", () => {
  toggleHistoryDateField();
  render();
});
historyDateInput.addEventListener("change", render);
toggleHistoryDateField();

function normalizeUrl(rawValue) {
  const value = (rawValue || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `http://${value}`;
}

function getDefaultShareUrl() {
  const host = window.location.hostname;
  const isLocalHost = host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
  const isPrivateIp = /^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);
  return isLocalHost || isPrivateIp ? PUBLISHED_URL : window.location.href;
}

function updateQrFromInput() {
  const shareInput = document.getElementById("shareUrl");
  const hint = document.getElementById("networkHint");
  const url = normalizeUrl(shareInput.value);

  if (!url) {
    hint.hidden = false;
    hint.textContent = "Informe uma URL valida para gerar o QR Code.";
    return;
  }

  shareInput.value = url;
  document.getElementById("qrImage").src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}`;

  const host = new URL(url).hostname;
  const invalidForPhone = host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";

  if (invalidForPhone) {
    hint.hidden = false;
    hint.textContent = "Esse endereco nao abre no celular. Use o link publico https://simei007.github.io/treino-diario/";
  } else {
    hint.hidden = false;
    hint.textContent = "QR pronto para abrir no celular. Se nao abrir, confira internet e tente novamente.";
  }
}

const initialUrl = getDefaultShareUrl();
document.getElementById("shareUrl").value = initialUrl;
updateQrFromInput();

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : { workouts: [], meals: [] };
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function formatDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function getWorkoutCategory(type) {
  const label = String(type || "").toLowerCase();
  if (label.includes("cardio")) return { key: "cardio", icon: "cardio", text: "Cardio" };
  if (label.includes("funcional")) return { key: "funcional", icon: "funcional", text: "Funcional" };
  if (label.includes("alongamento")) return { key: "alongamento", icon: "alongamento", text: "Alongamento" };
  if (label.includes("descanso")) return { key: "descanso", icon: "descanso", text: "Descanso ativo" };
  if (
    label.includes("perna") || label.includes("peito") || label.includes("costas") ||
    label.includes("ombro") || label.includes("biceps") || label.includes("bíceps") ||
    label.includes("triceps") || label.includes("tríceps") || label.includes("abd")
  ) {
    return { key: "forca", icon: "forca", text: "Forca" };
  }
  return { key: "outro", icon: "outro", text: "Personalizado" };
}

function getWorkoutIconSvg(iconKey) {
  const icons = {
    forca: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10h3v4H3v-4Zm15 0h3v4h-3v-4ZM8 9h2v6H8V9Zm6 0h2v6h-2V9ZM6 11h2v2H6v-2Zm10 0h2v2h-2v-2Zm-6 0h4v2h-4v-2Z"/></svg>',
    cardio: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.4A4 4 0 0 1 19 11c0 5.6-7 10-7 10Zm-3.2-8.6h2.1l1.2-2.4 1.6 4.1 1.1-1.7h1.4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    funcional: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.2 4.6L19 9l-3.5 3.4.8 4.9L12 15l-4.3 2.3.8-4.9L5 9l4.8-1.4L12 3Z"/></svg>',
    alongamento: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6a2 2 0 1 1 4 0 2 2 0 0 1-4 0Zm4.8 3.4 2.7 1.3-.8 1.6-2.6-1.2-1.5 3.1 2 1 .2 4.8h-2l-.2-3.7-2.2-1.1L7 19H5l2.7-5.3 1.4-2.8-1.7.9-.9-1.6 3-1.8h3.3Z"/></svg>',
    descanso: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3a7 7 0 1 0 7 7c0-.4 0-.8-.1-1.2A8 8 0 1 1 12.2 2c.6 0 1.2.1 1.8.2Z"/></svg>',
    outro: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 17h.01M9.1 9a3 3 0 1 1 5.8 1c-.5 1.6-2.2 2.1-2.9 3.2-.2.3-.3.6-.3 1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>'
  };
  return icons[iconKey] || icons.outro;
}

function render() {
  const data = loadData();
  const workoutList = document.getElementById("workoutList");
  const mealList = document.getElementById("mealList");
  const stats = document.getElementById("stats");
  const isByDate = historyModeSelect.value === "date";
  const selectedDate = historyDateInput.value;

  workoutList.innerHTML = "";
  mealList.innerHTML = "";

  const visibleWorkouts = isByDate ? data.workouts.filter((w) => w.date === selectedDate) : data.workouts;
  const visibleMeals = isByDate ? data.meals.filter((m) => m.date === selectedDate) : data.meals;
  const sortedWorkouts = [...visibleWorkouts].sort((a, b) => b.date.localeCompare(a.date));
  const sortedMeals = [...visibleMeals].sort((a, b) => b.date.localeCompare(a.date));

  sortedWorkouts.forEach((w, index) => {
    const category = getWorkoutCategory(w.type);
    const li = document.createElement("li");
    li.style.setProperty("--i", index);
    li.innerHTML = `<span class="workout-chip workout-${category.key}"><span class="chip-icon">${getWorkoutIconSvg(category.icon)}</span>${category.text}</span><strong>${formatDate(w.date)} - ${escapeHtml(w.type)}</strong><br>${w.duration} min<br>${escapeHtml(w.notes || "Sem observacoes")}`;
    workoutList.appendChild(li);
  });

  sortedMeals.forEach((m, index) => {
    const li = document.createElement("li");
    li.style.setProperty("--i", index);
    li.innerHTML = `<strong>${formatDate(m.date)} - ${m.mealType}</strong><br>${m.desc}<br>Agua: ${m.waterMl || 0} ml`;
    mealList.appendChild(li);
  });

  const baseWorkoutsForStats = isByDate ? visibleWorkouts : data.workouts;
  const baseMealsForStats = isByDate ? visibleMeals : data.meals;
  let firstStatLabel = "Treinos (7 dias)";
  let firstStatValue = 0;
  if (isByDate) {
    firstStatLabel = `Treinos em ${formatDate(selectedDate)}`;
    firstStatValue = baseWorkoutsForStats.length;
  } else {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    firstStatValue = data.workouts.filter((w) => new Date(w.date) >= weekAgo).length;
  }

  const totalMinutes = baseWorkoutsForStats.reduce((sum, w) => sum + Number(w.duration || 0), 0);
  const totalWater = baseMealsForStats.reduce((sum, m) => sum + Number(m.waterMl || 0), 0);

  stats.innerHTML = `
    <div class="stat"><span>${firstStatLabel}</span><strong>${firstStatValue}</strong></div>
    <div class="stat"><span>Minutos treinados</span><strong>${totalMinutes}</strong></div>
    <div class="stat"><span>Refeicoes registradas</span><strong>${baseMealsForStats.length}</strong></div>
    <div class="stat"><span>Agua total (ml)</span><strong>${totalWater}</strong></div>
  `;
}

document.getElementById("workoutForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const selectedWorkoutType = workoutTypeSelect.value.trim();
  const customWorkoutType = workoutTypeCustomInput.value.trim();
  const finalWorkoutType = selectedWorkoutType === "outro" ? customWorkoutType : selectedWorkoutType;
  if (!finalWorkoutType) return;

  const data = loadData();
  data.workouts.push({
    date: document.getElementById("workoutDate").value,
    type: finalWorkoutType,
    duration: document.getElementById("workoutDuration").value,
    notes: document.getElementById("workoutNotes").value.trim(),
  });
  saveData(data);
  e.target.reset();
  document.getElementById("workoutDate").value = today;
  toggleWorkoutTypeCustomField();
  render();
});

document.getElementById("mealForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const data = loadData();
  data.meals.push({
    date: document.getElementById("mealDate").value,
    mealType: document.getElementById("mealType").value,
    desc: document.getElementById("mealDesc").value.trim(),
    waterMl: document.getElementById("waterMl").value,
  });
  saveData(data);
  e.target.reset();
  document.getElementById("mealDate").value = today;
  render();
});

document.getElementById("clearData").addEventListener("click", () => {
  if (!confirm("Tem certeza que deseja apagar todos os dados?")) return;
  localStorage.removeItem(STORAGE_KEY);
  render();
});

document.getElementById("copyUrl").addEventListener("click", async () => {
  const value = document.getElementById("shareUrl").value;
  try {
    await navigator.clipboard.writeText(value);
    alert("URL copiada.");
  } catch {
    alert("Nao foi possivel copiar automaticamente.");
  }
});

document.getElementById("regenQr").addEventListener("click", updateQrFromInput);
document.getElementById("shareUrl").addEventListener("blur", updateQrFromInput);

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById("installBtn").hidden = false;
});

document.getElementById("installBtn").addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  document.getElementById("installBtn").hidden = true;
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
}

render();
