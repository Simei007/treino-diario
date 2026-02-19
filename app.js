const STORAGE_KEY = "treinoDiarioData";
const PUBLISHED_URL = "https://simei007.github.io/treino-diario/";
let deferredPrompt = null;

const today = new Date().toISOString().slice(0, 10);
document.getElementById("workoutDate").value = today;
document.getElementById("mealDate").value = today;

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

function render() {
  const data = loadData();
  const workoutList = document.getElementById("workoutList");
  const mealList = document.getElementById("mealList");
  const stats = document.getElementById("stats");

  workoutList.innerHTML = "";
  mealList.innerHTML = "";

  const sortedWorkouts = [...data.workouts].sort((a, b) => b.date.localeCompare(a.date));
  const sortedMeals = [...data.meals].sort((a, b) => b.date.localeCompare(a.date));

  sortedWorkouts.forEach((w) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${formatDate(w.date)} - ${w.type}</strong><br>${w.duration} min<br>${w.notes || "Sem observacoes"}`;
    workoutList.appendChild(li);
  });

  sortedMeals.forEach((m) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${formatDate(m.date)} - ${m.mealType}</strong><br>${m.desc}<br>Agua: ${m.waterMl || 0} ml`;
    mealList.appendChild(li);
  });

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weeklyWorkouts = data.workouts.filter((w) => new Date(w.date) >= weekAgo).length;
  const totalMinutes = data.workouts.reduce((sum, w) => sum + Number(w.duration || 0), 0);
  const totalWater = data.meals.reduce((sum, m) => sum + Number(m.waterMl || 0), 0);

  stats.innerHTML = `
    <div class="stat"><span>Treinos (7 dias)</span><strong>${weeklyWorkouts}</strong></div>
    <div class="stat"><span>Minutos treinados</span><strong>${totalMinutes}</strong></div>
    <div class="stat"><span>Refeicoes registradas</span><strong>${data.meals.length}</strong></div>
    <div class="stat"><span>Agua total (ml)</span><strong>${totalWater}</strong></div>
  `;
}

document.getElementById("workoutForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const data = loadData();
  data.workouts.push({
    date: document.getElementById("workoutDate").value,
    type: document.getElementById("workoutType").value.trim(),
    duration: document.getElementById("workoutDuration").value,
    notes: document.getElementById("workoutNotes").value.trim(),
  });
  saveData(data);
  e.target.reset();
  document.getElementById("workoutDate").value = today;
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
