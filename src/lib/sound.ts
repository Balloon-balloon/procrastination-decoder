let audioCtx: AudioContext | null = null;
let muted = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

export function setMuted(value: boolean) {
  muted = value;
}

export function isMuted() {
  return muted;
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = "square",
  volume = 0.06,
  startTime = 0
) {
  const ctx = getAudioContext();
  if (!ctx || muted) return;
  if (ctx.state === "suspended") ctx.resume();

  const t = ctx.currentTime + startTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(t);
  osc.stop(t + duration);
}

function playSlide(
  freqStart: number,
  freqEnd: number,
  duration: number,
  type: OscillatorType = "square",
  volume = 0.06
) {
  const ctx = getAudioContext();
  if (!ctx || muted) return;
  if (ctx.state === "suspended") ctx.resume();

  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, t);
  osc.frequency.exponentialRampToValueAtTime(freqEnd, t + duration);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(t);
  osc.stop(t + duration);
}

// 清脆"嘀"声
export function playClickSound() {
  playTone(1000, 0.04, "square", 0.05);
  playTone(1500, 0.02, "square", 0.03, 0.01);
}

// 起飞上扬音调
export function playLaunchSound() {
  playSlide(400, 1600, 0.3, "square", 0.07);
  setTimeout(() => playTone(2000, 0.1, "square", 0.04), 200);
}

// 胜利和弦
export function playCompleteSound() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    playTone(freq, 0.15, "square", 0.06, i * 0.08);
  });
  setTimeout(() => playTone(1568, 0.2, "square", 0.05), 350);
}

// 像素狗叫
export function playDogBarkSound() {
  playSlide(300, 800, 0.06, "square", 0.08);
  setTimeout(() => playSlide(300, 600, 0.06, "sawtooth", 0.06), 80);
  setTimeout(() => playTone(500, 0.04, "square", 0.04), 160);
}

// 低沉"啵"声（删除）
export function playDeleteSound() {
  playSlide(400, 80, 0.15, "sawtooth", 0.07);
}

// 打字声
export function playTypeSound() {
  playTone(1200, 0.02, "square", 0.03);
}

// 切换 Tab
export function playTabSwitchSound() {
  playTone(800, 0.03, "square", 0.04);
  setTimeout(() => playTone(1000, 0.03, "square", 0.03), 30);
}

// 错误提示
export function playErrorSound() {
  playTone(200, 0.1, "sawtooth", 0.06);
  setTimeout(() => playTone(150, 0.15, "sawtooth", 0.05), 100);
}
