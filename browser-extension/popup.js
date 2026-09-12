const fields = {
  enabled: document.querySelector("#enabled"),
  petEnabled: document.querySelector("#pet-enabled"),
  threshold: document.querySelector("#threshold"),
  taskTitle: document.querySelector("#task-title"),
  microStep: document.querySelector("#micro-step"),
  rescueLadder: document.querySelector("#rescue-ladder"),
  sites: document.querySelector("#sites"),
  appUrl: document.querySelector("#app-url"),
  todayCount: document.querySelector("#today-count"),
  activeHost: document.querySelector("#active-host"),
  status: document.querySelector("#status")
};

let currentSettings = null;

loadStatus();

document.querySelector("#save").addEventListener("click", async () => {
  const settings = {
    ...currentSettings,
    enabled: fields.enabled.checked,
    petEnabled: fields.petEnabled.checked,
    thresholdMinutes: Number(fields.threshold.value),
    taskTitle: fields.taskTitle.value.trim(),
    microStep: fields.microStep.value.trim(),
    rescueLadder: lines(fields.rescueLadder.value),
    sites: lines(fields.sites.value),
    appUrl: fields.appUrl.value.trim()
  };
  const status = await runtimeMessage({ type: "save-settings", settings });
  currentSettings = status.settings;
  fill(status);
  fields.status.textContent = "设置已保存在本地";
});

document.querySelector("#test").addEventListener("click", async () => {
  const result = await runtimeMessage({ type: "test-intervention" });
  fields.status.textContent = result.ok
    ? "测试拦截已发送到当前标签页"
    : result.message || "当前页面无法显示测试";
});

document.querySelector("#open-rescue").addEventListener("click", async () => {
  const task = fields.taskTitle.value.trim();
  const step = fields.microStep.value.trim();
  const base = fields.appUrl.value.trim();
  const url = new URL(base);
  url.searchParams.set("task", task);
  url.searchParams.set("step", step);
  url.searchParams.set("source", "extension-popup");
  chrome.tabs.create({ url: url.toString() });
});

async function loadStatus() {
  const status = await runtimeMessage({ type: "get-status" });
  currentSettings = status.settings;
  fill(status);
  fields.status.textContent = "仅在本机保存网址和设置";
}

function fill(status) {
  const { settings, runtime } = status;
  fields.enabled.checked = settings.enabled;
  fields.petEnabled.checked = settings.petEnabled;
  fields.threshold.value = settings.thresholdMinutes;
  fields.taskTitle.value = settings.taskTitle;
  fields.microStep.value = settings.microStep;
  fields.rescueLadder.value = settings.rescueLadder.join("\n");
  fields.sites.value = settings.sites.join("\n");
  fields.appUrl.value = settings.appUrl;
  fields.todayCount.textContent = runtime.todayCount || 0;
  fields.activeHost.textContent = runtime.activeHost || "未检测";
}

function lines(value) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function runtimeMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => resolve(response || {}));
  });
}
