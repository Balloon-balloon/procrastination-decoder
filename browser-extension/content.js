let overlayHost = null;
let overlayShadow = null;
let petHost = null;
let petShadow = null;
let petPayload = {};

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "SHOW_INTERVENTION") {
    showIntervention(message.payload);
  }
  if (message.type === "UPDATE_INTERVENTION") {
    updateIntervention(message.payload);
  }
  if (message.type === "HIDE_INTERVENTION") {
    hideIntervention();
  }
  if (message.type === "PET_UPDATE") {
    updatePet(message.payload || {});
  }
});

if (location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
  chrome.runtime.sendMessage({ type: "get-status" }, (status) => {
    if (chrome.runtime.lastError || !status?.settings) return;
    updatePet({
      enabled: status.settings.petEnabled,
      active: false,
      host: location.hostname.replace(/^www\./, ""),
      thresholdMinutes: status.settings.thresholdMinutes,
      taskTitle: status.settings.taskTitle,
      microStep: status.settings.rescueLadder?.[0]
    });
  });
}

function ensureOverlay() {
  if (overlayHost?.isConnected) return;

  overlayHost = document.createElement("div");
  overlayHost.id = "whywait-intervention-host";
  overlayHost.style.position = "fixed";
  overlayHost.style.inset = "0";
  overlayHost.style.zIndex = "2147483647";
  overlayHost.style.pointerEvents = "none";
  overlayShadow = overlayHost.attachShadow({ mode: "closed" });
  overlayShadow.innerHTML = `
    <style>
      :host { all: initial; }
      .backdrop {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background:
          radial-gradient(circle at 20% 20%, rgba(255,107,53,.2), transparent 30%),
          rgba(13,18,36,.78);
        backdrop-filter: blur(12px);
        pointer-events: auto;
        font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
      }
      .card {
        position: relative;
        width: min(620px, 100%);
        overflow: hidden;
        border-radius: 24px;
        padding: 30px;
        color: #2B3A67;
        background: #FFF9E8;
        border: 1px solid rgba(255,255,255,.72);
        box-shadow: 0 30px 90px rgba(0,0,0,.36);
      }
      .card::before {
        content: "";
        position: absolute;
        inset: 0 0 auto;
        height: 6px;
        background: var(--accent, #FF6B35);
      }
      .topline {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 26px;
      }
      .brand {
        color: #FF6B35;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: .14em;
      }
      .close {
        width: 34px;
        height: 34px;
        border: 0;
        border-radius: 50%;
        cursor: pointer;
        color: #5A6480;
        background: rgba(43,58,103,.08);
        font-size: 20px;
      }
      .eyebrow {
        color: #8B93A8;
        font-size: 13px;
        margin-bottom: 8px;
      }
      h1 {
        margin: 0;
        max-width: 540px;
        color: #2B3A67;
        font-size: clamp(24px, 4vw, 38px);
        line-height: 1.32;
      }
      .hint {
        margin-top: 14px;
        color: #747E98;
        font-size: 14px;
        line-height: 1.7;
      }
      .steps {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 24px;
      }
      .dot {
        width: 24px;
        height: 4px;
        border-radius: 99px;
        background: rgba(43,58,103,.12);
      }
      .dot.active { background: var(--accent, #FF6B35); }
      .actions {
        display: grid;
        grid-template-columns: 1.4fr 1fr 1fr;
        gap: 10px;
        margin-top: 28px;
      }
      button.action {
        min-height: 48px;
        border: 0;
        border-radius: 13px;
        padding: 10px 14px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 800;
      }
      .primary {
        color: #fff;
        background: #FF6B35;
        box-shadow: 0 5px 0 #C04A1E;
      }
      .rescue {
        color: #2B3A67;
        background: rgba(167,139,250,.18);
        border: 1px solid rgba(167,139,250,.42) !important;
      }
      .back {
        color: #5A6480;
        background: rgba(43,58,103,.08);
      }
      @media (max-width: 560px) {
        .card { padding: 24px 20px; }
        .actions { grid-template-columns: 1fr; }
      }
    </style>
    <div class="backdrop">
      <section class="card" role="dialog" aria-modal="true" aria-label="WhyWait 拖延拦截">
        <div class="topline">
          <span class="brand">WHYWAIT · 拖延拦截</span>
          <button class="close" type="button" aria-label="关闭">×</button>
        </div>
        <p class="eyebrow" id="eyebrow">你已经在视频网站停留了 5 分钟</p>
        <h1 id="micro-step">打开 Word，输入论文标题</h1>
        <p class="hint" id="hint">任务已经缩小到 5 分钟。现在不需要完成它，只需要让这一步发生。</p>
        <div class="steps" id="steps"></div>
        <div class="actions">
          <button class="action primary" id="start" type="button">开始 5 分钟</button>
          <button class="action rescue" id="rescue" type="button">我卡住了</button>
          <button class="action back" id="later" type="button">15 分钟后提醒</button>
        </div>
      </section>
    </div>
  `;

  overlayShadow.querySelector(".close").addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "dismiss-intervention" });
  });
  overlayShadow.querySelector("#later").addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "dismiss-intervention" });
  });
  overlayShadow.querySelector("#start").addEventListener("click", () => {
    const taskTitle = overlayShadow.querySelector("#eyebrow").dataset.task || "";
    const microStep = overlayShadow.querySelector("#micro-step").textContent || "";
    chrome.runtime.sendMessage({
      type: "start-focus",
      payload: { taskTitle, microStep }
    });
  });
  overlayShadow.querySelector("#rescue").addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "rescue-me" });
  });

  document.documentElement.appendChild(overlayHost);
}

function showIntervention(payload) {
  ensureOverlay();
  overlayHost.style.display = "block";
  updateIntervention(payload);
}

function updateIntervention(payload = {}) {
  if (!overlayShadow) return;
  const accent = payload.accent || "#FF6B35";
  const card = overlayShadow.querySelector(".card");
  card?.style.setProperty("--accent", accent);

  const eyebrow = overlayShadow.querySelector("#eyebrow");
  if (eyebrow && payload.taskTitle) {
    eyebrow.textContent = `你已经在 ${payload.host || "这里"} 停留了 ${payload.elapsedMinutes || 5} 分钟 · ${payload.taskTitle}`;
    eyebrow.dataset.task = payload.taskTitle;
  }
  if (payload.microStep) {
    overlayShadow.querySelector("#micro-step").textContent = payload.microStep;
  }

  const total = payload.totalSteps || 1;
  const current = payload.stepIndex || 0;
  const steps = overlayShadow.querySelector("#steps");
  if (steps) {
    steps.innerHTML = Array.from({ length: total })
      .map((_, index) => `<span class="dot${index <= current ? " active" : ""}"></span>`)
      .join("");
  }
}

function hideIntervention() {
  if (overlayHost) overlayHost.style.display = "none";
}

function ensurePet() {
  if (petHost?.isConnected) return;

  petHost = document.createElement("div");
  petHost.id = "whywait-pet-host";
  petHost.style.position = "fixed";
  petHost.style.zIndex = "2147483646";
  petHost.style.pointerEvents = "none";
  petShadow = petHost.attachShadow({ mode: "closed" });
  petShadow.innerHTML = `
    <style>
      :host { all: initial; }
      .pet-wrap {
        position: fixed;
        right: 18px;
        bottom: 18px;
        width: 230px;
        height: 220px;
        pointer-events: none;
        font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
      }
      .bubble {
        position: absolute;
        right: 4px;
        bottom: 76px;
        width: 210px;
        padding: 13px;
        display: none;
        color: #2B3A67;
        background: #FFF9CF;
        border: 2px solid rgba(43,58,103,.24);
        border-radius: 16px 11px 18px 10px / 11px 17px 9px 16px;
        box-shadow: 4px 6px 0 rgba(43,58,103,.12);
        transform: rotate(-1.2deg);
        pointer-events: auto;
      }
      .pet-wrap.open .bubble { display: block; }
      .bubble::after {
        content: "";
        position: absolute;
        right: 28px;
        bottom: -10px;
        width: 17px;
        height: 17px;
        background: inherit;
        border-right: 2px solid rgba(43,58,103,.24);
        border-bottom: 2px solid rgba(43,58,103,.24);
        transform: rotate(45deg);
      }
      .bubble-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
        color: #FF6B35;
        font-size: 10px;
        font-weight: 900;
        letter-spacing: .08em;
      }
      .bubble-copy {
        font-size: 12px;
        line-height: 1.55;
      }
      .bubble-action {
        margin-top: 10px;
        font-size: 11px;
        color: #5A6480;
        word-break: break-word;
      }
      .bubble-buttons {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 7px;
        margin-top: 11px;
      }
      .bubble-buttons button {
        min-height: 34px;
        border: 0;
        border-radius: 10px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 800;
      }
      .start { color: #fff; background: #FF6B35; box-shadow: 0 3px 0 #C04A1E; }
      .quiet { color: #5A6480; background: rgba(43,58,103,.09); }
      .hide { color: #8B93A8; background: transparent; box-shadow: none; }
      .pet {
        position: absolute;
        right: 2px;
        bottom: 0;
        width: 68px;
        height: 68px;
        cursor: grab;
        pointer-events: auto;
        touch-action: none;
        filter: drop-shadow(0 8px 8px rgba(0,0,0,.16));
        transform-origin: 50% 90%;
        animation: petFloat 2.8s ease-in-out infinite;
      }
      .pet:active { cursor: grabbing; }
      .body {
        position: absolute;
        left: 12px;
        top: 15px;
        width: 44px;
        height: 44px;
        border: 2.5px solid #2B3A67;
        border-radius: 48% 52% 45% 55%;
        background: #FAD6A5;
        transition: background .25s ease;
      }
      .ear {
        position: absolute;
        top: 7px;
        width: 16px;
        height: 19px;
        border: 2.5px solid #2B3A67;
        background: #FAD6A5;
        z-index: -1;
      }
      .ear.left { left: 9px; transform: rotate(-24deg); border-radius: 70% 30% 50% 50%; }
      .ear.right { right: 9px; transform: rotate(24deg); border-radius: 30% 70% 50% 50%; }
      .antenna {
        position: absolute;
        left: 33px;
        top: 0;
        width: 2px;
        height: 17px;
        background: #2B3A67;
      }
      .antenna::after {
        content: "";
        position: absolute;
        left: -4px;
        top: -5px;
        width: 10px;
        height: 10px;
        border: 2px solid #2B3A67;
        border-radius: 50%;
        background: #4ECDC4;
      }
      .eye {
        position: absolute;
        top: 29px;
        width: 8px;
        height: 10px;
        border-radius: 50%;
        background: #2B3A67;
        animation: petBlink 4s ease-in-out infinite;
      }
      .eye.left { left: 23px; }
      .eye.right { left: 40px; }
      .mouth {
        position: absolute;
        left: 31px;
        top: 44px;
        width: 10px;
        height: 5px;
        border-bottom: 2px solid #2B3A67;
        border-radius: 50%;
      }
      .badge {
        position: absolute;
        right: 0;
        bottom: 0;
        min-width: 28px;
        height: 24px;
        padding: 0 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #2B3A67;
        border-radius: 99px;
        color: #2B3A67;
        background: #FFF5A8;
        font-size: 10px;
        font-weight: 900;
      }
      .pet-wrap.watching .body,
      .pet-wrap.watching .ear { background: #FFE18B; }
      .pet-wrap.watching .badge { background: #F5B942; }
      .pet-wrap.alarmed .body,
      .pet-wrap.alarmed .ear { background: #FF9B72; }
      .pet-wrap.alarmed .badge { color: #fff; background: #FF6B35; }
      .pet-wrap.alarmed .pet { animation-duration: .7s; }
      .pet-wrap.snoozed .body,
      .pet-wrap.snoozed .ear { background: #D7D9E2; }
      .pet-wrap.snoozed .eye { height: 2px; top: 34px; animation: none; }
      @keyframes petFloat {
        0%, 100% { transform: translateY(0) rotate(-1deg); }
        50% { transform: translateY(-5px) rotate(1deg); }
      }
      @keyframes petBlink {
        0%, 45%, 100% { transform: scaleY(1); }
        48%, 52% { transform: scaleY(.15); }
      }
    </style>
    <div class="pet-wrap">
      <div class="bubble">
        <div class="bubble-title">
          <span>WHYWAIT 小精灵</span>
          <button class="hide" id="pet-hide" type="button">隐藏</button>
        </div>
        <div class="bubble-copy" id="pet-copy">我在这里，不催你。</div>
        <div class="bubble-action" id="pet-action"></div>
        <div class="bubble-buttons">
          <button class="start" id="pet-start" type="button">开始 5 分钟</button>
          <button class="quiet" id="pet-close" type="button">先不管我</button>
        </div>
      </div>
      <div class="pet" role="button" aria-label="WhyWait 小精灵">
        <span class="antenna"></span>
        <span class="ear left"></span>
        <span class="ear right"></span>
        <span class="body"></span>
        <span class="eye left"></span>
        <span class="eye right"></span>
        <span class="mouth"></span>
        <span class="badge" id="pet-badge">•</span>
      </div>
    </div>
  `;

  const pet = petShadow.querySelector(".pet");
  const wrap = petShadow.querySelector(".pet-wrap");
  let dragStart = null;
  let moved = false;

  pet.addEventListener("pointerdown", (event) => {
    dragStart = {
      x: event.clientX,
      y: event.clientY,
      right: parseFloat(wrap.style.right || "18") || 18,
      bottom: parseFloat(wrap.style.bottom || "18") || 18
    };
    moved = false;
    pet.setPointerCapture(event.pointerId);
  });

  pet.addEventListener("pointermove", (event) => {
    if (!dragStart) return;
    const dx = event.clientX - dragStart.x;
    const dy = event.clientY - dragStart.y;
    if (Math.abs(dx) + Math.abs(dy) > 5) moved = true;
    wrap.style.right = `${Math.max(4, dragStart.right - dx)}px`;
    wrap.style.bottom = `${Math.max(4, dragStart.bottom - dy)}px`;
  });

  pet.addEventListener("pointerup", (event) => {
    if (dragStart && !moved) wrap.classList.toggle("open");
    dragStart = null;
    pet.releasePointerCapture(event.pointerId);
  });

  petShadow.querySelector("#pet-start").addEventListener("click", () => {
    chrome.runtime.sendMessage({
      type: "start-focus",
      payload: {
        taskTitle: petPayload.taskTitle || "",
        microStep: petPayload.microStep || "",
        host: petPayload.host || location.hostname
      }
    });
  });
  petShadow.querySelector("#pet-close").addEventListener("click", () => {
    wrap.classList.remove("open");
  });
  petShadow.querySelector("#pet-hide").addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "hide-pet" });
  });

  document.documentElement.appendChild(petHost);
}

function updatePet(payload = {}) {
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") return;
  petPayload = { ...petPayload, ...payload };
  if (payload.enabled === false) {
    if (petHost) petHost.style.display = "none";
    return;
  }

  ensurePet();
  petHost.style.display = "block";
  const wrap = petShadow.querySelector(".pet-wrap");
  const copy = petShadow.querySelector("#pet-copy");
  const action = petShadow.querySelector("#pet-action");
  const badge = petShadow.querySelector("#pet-badge");
  const state = payload.alarmed
    ? "alarmed"
    : payload.snoozed
      ? "snoozed"
      : payload.active
        ? "watching"
        : "idle";

  wrap.classList.remove("idle", "watching", "alarmed", "snoozed");
  wrap.classList.add(state);

  if (state === "alarmed") {
    copy.textContent = `你在 ${petPayload.host || "这里"} 停留太久了，该换一个动作啦。`;
    action.textContent = petPayload.microStep
      ? `只做：${petPayload.microStep}`
      : "只做 5 分钟，不要求完成。";
    badge.textContent = "!";
  } else if (state === "watching") {
    copy.textContent = `我盯着呢。已经停留 ${petPayload.elapsedMinutes || 0} / ${petPayload.thresholdMinutes || 5} 分钟。`;
    action.textContent = petPayload.taskTitle
      ? `等一下要拯救：${petPayload.taskTitle}`
      : "";
    badge.textContent = `${petPayload.elapsedMinutes || 0}m`;
  } else if (state === "snoozed") {
    copy.textContent = "好吧，我暂时躲起来，晚一点再来。";
    action.textContent = "你可以继续，也可以点开始先做 5 分钟。";
    badge.textContent = "z";
  } else {
    copy.textContent = "我在这里陪你，不催你。";
    action.textContent = petPayload.taskTitle
      ? `当前任务：${petPayload.taskTitle}`
      : "遇到视频网站我会提醒你。";
    badge.textContent = "•";
  }
}
