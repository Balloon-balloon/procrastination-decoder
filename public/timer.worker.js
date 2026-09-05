// Web Worker: 独立线程计时器，不受主线程挂起影响
let timerInterval = null;
let remainingSeconds = 0;
let startTimestamp = null;
let mode = "focus"; // "focus" | "break"
let focusDuration = 25 * 60;
let breakDuration = 5 * 60;
let cycleCount = 0;
let isPaused = false;

self.onmessage = function (e) {
  const { type, payload } = e.data;

  switch (type) {
    case "start":
      remainingSeconds = payload.seconds;
      startTimestamp = Date.now();
      mode = payload.mode || "focus";
      isPaused = false;
      startTicking();
      break;

    case "pause":
      isPaused = true;
      if (timerInterval) clearInterval(timerInterval);
      self.postMessage({ type: "paused", remainingSeconds });
      break;

    case "resume":
      isPaused = false;
      startTimestamp = Date.now();
      startTicking();
      break;

    case "stop":
      stopTicking();
      remainingSeconds = 0;
      startTimestamp = null;
      self.postMessage({ type: "stopped" });
      break;

    case "sync":
      // 时间戳差值法兜底：页面重新激活时修正
      if (startTimestamp && !isPaused) {
        const elapsed = Math.floor((Date.now() - startTimestamp) / 1000);
        const corrected = Math.max(0, remainingSeconds - elapsed);
        if (corrected !== remainingSeconds) {
          remainingSeconds = corrected;
          startTimestamp = Date.now();
          self.postMessage({ type: "tick", remainingSeconds, corrected: true });
        }
      }
      break;

    case "getRemaining":
      self.postMessage({ type: "remaining", remainingSeconds, startTimestamp });
      break;

    case "setDurations":
      if (payload.focusDuration) focusDuration = payload.focusDuration;
      if (payload.breakDuration) breakDuration = payload.breakDuration;
      break;

    default:
      break;
  }
};

function startTicking() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (isPaused) return;
    remainingSeconds--;
    startTimestamp = Date.now(); // 更新时间戳

    if (remainingSeconds <= 0) {
      stopTicking();
      cycleCount++;
      self.postMessage({ type: "complete", cycleCount, mode });
    } else {
      self.postMessage({ type: "tick", remainingSeconds });
    }
  }, 1000);

  // 立即发一次
  self.postMessage({ type: "tick", remainingSeconds });
}

function stopTicking() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}
