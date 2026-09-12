const DEFAULT_SETTINGS = {
  enabled: true,
  petEnabled: true,
  thresholdMinutes: 5,
  snoozeMinutes: 15,
  taskTitle: "论文写作",
  microStep: "打开 Word，输入论文标题",
  rescueLadder: [
    "打开 Word，输入论文标题",
    "关闭其他窗口，只留下论文文档",
    "先写 120 秒，内容可以很糟糕",
    "新建文档并保存为“论文草稿”"
  ],
  sites: [
    "bilibili.com",
    "youtube.com",
    "douyin.com",
    "weibo.com",
    "xiaohongshu.com",
    "zhihu.com"
  ],
  appUrl: "http://localhost:3000/rescue"
};

const DEFAULT_RUNTIME = {
  activeHost: "",
  activeTabId: null,
  startedAt: null,
  lastInterventionAt: null,
  snoozeUntil: null,
  stepIndex: 0,
  todayCount: 0,
  dateKey: new Date().toISOString().slice(0, 10)
};

chrome.runtime.onInstalled.addListener(() => {
  initialize();
});

chrome.runtime.onStartup.addListener(() => {
  initialize();
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, (tab) => {
    if (!chrome.runtime.lastError) updateTracking(tabId, tab.url || "");
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" || changeInfo.url) {
    updateTracking(tabId, changeInfo.url || tab.url || "");
  }
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;
  chrome.tabs.query({ active: true, windowId }, ([tab]) => {
    if (tab?.id) updateTracking(tab.id, tab.url || "");
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "whywait-check-distraction") {
    checkActiveDistraction();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "get-status") {
    getStatus().then(sendResponse);
    return true;
  }

  if (message.type === "save-settings") {
    saveSettings(message.settings)
      .then(async () => {
        const status = await getStatus();
        const tabs = await chrome.tabs.query({});
        await Promise.all(
          tabs.map((tab) =>
            tab.id
              ? chrome.tabs
                  .sendMessage(tab.id, {
                    type: "PET_UPDATE",
                    payload: { enabled: status.settings.petEnabled }
                  })
                  .catch(() => {})
              : Promise.resolve()
          )
        );
        return status;
      })
      .then(sendResponse);
    return true;
  }

  if (message.type === "start-focus") {
    startFocus(message.payload || {}, sender.tab?.id).then(sendResponse);
    return true;
  }

  if (message.type === "rescue-me") {
    rescueMe(sender.tab?.id).then(sendResponse);
    return true;
  }

  if (message.type === "dismiss-intervention") {
    dismissIntervention(sender.tab?.id).then(sendResponse);
    return true;
  }

  if (message.type === "test-intervention") {
    testIntervention().then(sendResponse);
    return true;
  }

  if (message.type === "hide-pet") {
    hidePet().then(sendResponse);
    return true;
  }

  return false;
});

async function initialize() {
  const stored = await chrome.storage.local.get(["settings", "runtime"]);
  const runtime = normalizeRuntime(stored.runtime || {});
  await chrome.storage.local.set({
    settings: { ...DEFAULT_SETTINGS, ...(stored.settings || {}) },
    runtime
  });
  await chrome.alarms.create("whywait-check-distraction", { periodInMinutes: 1 });
}

function normalizeRuntime(runtime) {
  const today = new Date().toISOString().slice(0, 10);
  return {
    ...DEFAULT_RUNTIME,
    ...runtime,
    todayCount: runtime.dateKey === today ? runtime.todayCount || 0 : 0,
    dateKey: today
  };
}

async function getSettings() {
  const stored = await chrome.storage.local.get("settings");
  return { ...DEFAULT_SETTINGS, ...(stored.settings || {}) };
}

async function getRuntime() {
  const stored = await chrome.storage.local.get("runtime");
  return normalizeRuntime(stored.runtime || {});
}

async function saveRuntime(runtime) {
  await chrome.storage.local.set({ runtime: normalizeRuntime(runtime) });
}

async function saveSettings(nextSettings) {
  const settings = {
    ...DEFAULT_SETTINGS,
    ...nextSettings,
    thresholdMinutes: Math.max(
      1,
      Math.min(60, Number(nextSettings.thresholdMinutes) || 5)
    ),
    snoozeMinutes: Math.max(
      1,
      Math.min(120, Number(nextSettings.snoozeMinutes) || 15)
    ),
    petEnabled: nextSettings.petEnabled !== false,
    sites: Array.isArray(nextSettings.sites)
      ? nextSettings.sites.map((site) => site.trim()).filter(Boolean)
      : DEFAULT_SETTINGS.sites
  };
  await chrome.storage.local.set({ settings });
}

async function getStatus() {
  const [settings, runtime] = await Promise.all([getSettings(), getRuntime()]);
  return { settings, runtime };
}

function getHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isDistractingHost(host, sites) {
  return sites.some((site) => host === site || host.endsWith(`.${site}`));
}

async function updateTracking(tabId, url) {
  const settings = await getSettings();
  const runtime = await getRuntime();
  if (!settings.enabled) {
    await saveRuntime({ ...runtime, activeHost: "", activeTabId: null, startedAt: null });
    await sendPetUpdate(tabId, { enabled: false });
    return;
  }

  const host = getHost(url);
  if (!host || !isDistractingHost(host, settings.sites)) {
    if (runtime.activeTabId === tabId) {
      await saveRuntime({
        ...runtime,
        activeHost: "",
        activeTabId: null,
        startedAt: null,
        stepIndex: 0
      });
    }
    await sendPetUpdate(tabId, {
      enabled: settings.petEnabled,
      active: false,
      host,
      elapsedMinutes: 0,
      thresholdMinutes: settings.thresholdMinutes,
      taskTitle: settings.taskTitle,
      microStep: settings.rescueLadder[0]
    });
    return;
  }

  let nextRuntime = runtime;
  if (runtime.activeHost !== host || runtime.activeTabId !== tabId) {
    nextRuntime = {
      ...runtime,
      activeHost: host,
      activeTabId: tabId,
      startedAt: Date.now(),
      stepIndex: 0,
      lastInterventionAt: null
    };
    await saveRuntime(nextRuntime);
  }

  await sendPetUpdate(tabId, {
    enabled: settings.petEnabled,
    active: true,
    host,
    elapsedMinutes: Math.max(
      0,
      Math.round((Date.now() - (nextRuntime.startedAt || Date.now())) / 60000)
    ),
    thresholdMinutes: settings.thresholdMinutes,
    taskTitle: settings.taskTitle,
    microStep: settings.rescueLadder[nextRuntime.stepIndex || 0]
  });
  await chrome.alarms.create("whywait-check-distraction", { periodInMinutes: 1 });
}

async function checkActiveDistraction() {
  const [settings, runtime] = await Promise.all([getSettings(), getRuntime()]);
  if (!settings.enabled || !runtime.activeHost || !runtime.startedAt) return;
  if (runtime.snoozeUntil && Date.now() < runtime.snoozeUntil) {
    if (runtime.activeTabId) {
      await sendPetUpdate(runtime.activeTabId, {
        enabled: settings.petEnabled,
        active: false,
        snoozed: true,
        host: runtime.activeHost,
        thresholdMinutes: settings.thresholdMinutes
      });
    }
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url) return;

  const host = getHost(tab.url);
  if (!isDistractingHost(host, settings.sites) || host !== runtime.activeHost) {
    await saveRuntime({
      ...runtime,
      activeHost: "",
      activeTabId: null,
      startedAt: null,
      stepIndex: 0
    });
    await sendPetUpdate(tab.id, {
      enabled: settings.petEnabled,
      active: false,
      host,
      thresholdMinutes: settings.thresholdMinutes
    });
    return;
  }

  const elapsedMs = Date.now() - runtime.startedAt;
  const thresholdMs = settings.thresholdMinutes * 60 * 1000;
  if (elapsedMs < thresholdMs) {
    await sendPetUpdate(tab.id, {
      enabled: settings.petEnabled,
      active: true,
      host,
      elapsedMinutes: Math.max(0, Math.round(elapsedMs / 60000)),
      thresholdMinutes: settings.thresholdMinutes,
      taskTitle: settings.taskTitle,
      microStep: settings.rescueLadder[runtime.stepIndex || 0]
    });
    return;
  }

  const cooldownMs = Math.max(5, settings.snoozeMinutes) * 60 * 1000;
  if (
    runtime.lastInterventionAt &&
    Date.now() - runtime.lastInterventionAt < cooldownMs
  ) {
    return;
  }

  const stepIndex = Math.min(runtime.stepIndex || 0, settings.rescueLadder.length - 1);
  await chrome.tabs.sendMessage(tab.id, {
    type: "SHOW_INTERVENTION",
    payload: {
      taskTitle: settings.taskTitle,
      microStep: settings.rescueLadder[stepIndex],
      host,
      elapsedMinutes: Math.max(1, Math.round(elapsedMs / 60000)),
      stepIndex,
      totalSteps: settings.rescueLadder.length,
      accent: "#FF6B35"
    }
  });

  const today = new Date().toISOString().slice(0, 10);
  await saveRuntime({
    ...runtime,
    lastInterventionAt: Date.now(),
    todayCount: runtime.dateKey === today ? runtime.todayCount + 1 : 1,
    dateKey: today
  });
  await sendPetUpdate(tab.id, {
    enabled: settings.petEnabled,
    active: true,
    alarmed: true,
    host,
    elapsedMinutes: Math.max(1, Math.round(elapsedMs / 60000)),
    thresholdMinutes: settings.thresholdMinutes,
    taskTitle: settings.taskTitle,
    microStep: settings.rescueLadder[stepIndex]
  });
}

async function startFocus(payload, senderTabId) {
  const [settings, runtime] = await Promise.all([getSettings(), getRuntime()]);
  const stepIndex = Math.min(runtime.stepIndex || 0, settings.rescueLadder.length - 1);
  const taskTitle = payload.taskTitle || settings.taskTitle;
  const microStep = payload.microStep || settings.rescueLadder[stepIndex];

  let url;
  try {
    url = new URL(settings.appUrl);
  } catch {
    url = new URL(DEFAULT_SETTINGS.appUrl);
  }
  url.searchParams.set("task", taskTitle);
  url.searchParams.set("step", microStep);
  url.searchParams.set("source", `interceptor:${payload.host || runtime.activeHost || "browser"}`);

  await chrome.tabs.create({ url: url.toString() });
  if (senderTabId) {
    await chrome.tabs.sendMessage(senderTabId, { type: "HIDE_INTERVENTION" }).catch(() => {});
    await sendPetUpdate(senderTabId, {
      enabled: settings.petEnabled,
      active: false,
      host: runtime.activeHost,
      taskTitle,
      microStep
    });
  }
  await saveRuntime({ ...runtime, snoozeUntil: Date.now() + 10 * 60 * 1000 });
  return { ok: true };
}

async function rescueMe(senderTabId) {
  const [settings, runtime] = await Promise.all([getSettings(), getRuntime()]);
  const nextStepIndex = Math.min(
    (runtime.stepIndex || 0) + 1,
    settings.rescueLadder.length - 1
  );
  await saveRuntime({ ...runtime, stepIndex: nextStepIndex });

  if (senderTabId) {
    await chrome.tabs
      .sendMessage(senderTabId, {
        type: "UPDATE_INTERVENTION",
        payload: {
          microStep: settings.rescueLadder[nextStepIndex],
          stepIndex: nextStepIndex,
          totalSteps: settings.rescueLadder.length,
          accent: "#A78BFA"
        }
      })
      .catch(() => {});
    await sendPetUpdate(senderTabId, {
      enabled: settings.petEnabled,
      active: true,
      alarmed: true,
      host: runtime.activeHost,
      elapsedMinutes: Math.max(
        0,
        Math.round((Date.now() - (runtime.startedAt || Date.now())) / 60000)
      ),
      thresholdMinutes: settings.thresholdMinutes,
      taskTitle: settings.taskTitle,
      microStep: settings.rescueLadder[nextStepIndex]
    });
  }
  return {
    ok: true,
    microStep: settings.rescueLadder[nextStepIndex],
    stepIndex: nextStepIndex
  };
}

async function dismissIntervention(senderTabId) {
  const [settings, runtime] = await Promise.all([getSettings(), getRuntime()]);
  await saveRuntime({
    ...runtime,
    snoozeUntil: Date.now() + settings.snoozeMinutes * 60 * 1000
  });
  if (senderTabId) {
    await chrome.tabs.sendMessage(senderTabId, { type: "HIDE_INTERVENTION" }).catch(() => {});
    await sendPetUpdate(senderTabId, {
      enabled: settings.petEnabled,
      active: false,
      snoozed: true,
      host: runtime.activeHost,
      thresholdMinutes: settings.thresholdMinutes
    });
  }
  return { ok: true };
}

async function testIntervention() {
  const [settings, runtime] = await Promise.all([getSettings(), getRuntime()]);
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return { ok: false, message: "没有可用的活动标签页" };

  const stepIndex = Math.min(runtime.stepIndex || 0, settings.rescueLadder.length - 1);
  await chrome.tabs
    .sendMessage(tab.id, {
      type: "SHOW_INTERVENTION",
      payload: {
        taskTitle: settings.taskTitle,
        microStep: settings.rescueLadder[stepIndex],
        host: getHost(tab.url || "") || "test-page",
        elapsedMinutes: settings.thresholdMinutes,
        stepIndex,
        totalSteps: settings.rescueLadder.length,
        accent: "#FF6B35"
      }
    })
    .catch(() => {});
  return { ok: true };
}

async function hidePet() {
  const settings = await getSettings();
  await saveSettings({ ...settings, petEnabled: false });
  const tabs = await chrome.tabs.query({});
  await Promise.all(
    tabs.map((tab) =>
      tab.id
        ? chrome.tabs.sendMessage(tab.id, { type: "PET_UPDATE", payload: { enabled: false } }).catch(() => {})
        : Promise.resolve()
    )
  );
  return { ok: true };
}

async function sendPetUpdate(tabId, payload) {
  if (!tabId) return;
  await chrome.tabs
    .sendMessage(tabId, {
      type: "PET_UPDATE",
      payload: {
        ...payload,
        updatedAt: Date.now()
      }
    })
    .catch(() => {});
}
