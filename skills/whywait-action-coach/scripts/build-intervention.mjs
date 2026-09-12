#!/usr/bin/env node

const RESISTANCE_TYPES = new Set([
  "perfectionist",
  "ambiguous",
  "overwhelming",
  "aversive",
  "instant-gratification",
  "low-resistance"
]);

const args = parseArgs(process.argv.slice(2));
const taskTitle = args.task?.trim() || "当前任务";
const microStep =
  args.step?.trim() || `打开与“${taskTitle}”有关的文件，写下第一行`;
const resistanceType = RESISTANCE_TYPES.has(args.type)
  ? args.type
  : "ambiguous";
const resistanceScore = clamp(Number(args.score) || 5, 1, 10);
const site = args.site?.trim() || "browser";
const appUrl = args["app-url"]?.trim() || "http://localhost:3000/rescue";

const rescueLadder = [
  microStep,
  `关闭其他窗口，只留下完成“${taskTitle}”需要的那一个页面`,
  "先做 120 秒，允许产出很糟糕的版本",
  `新建文档并保存为“${taskTitle}草稿”`,
  "只查询一个关键词，把资料放进草稿"
];

let deepLink;
try {
  const url = new URL(appUrl);
  url.searchParams.set("task", taskTitle);
  url.searchParams.set("step", microStep);
  url.searchParams.set("source", `skill:${site}`);
  deepLink = url.toString();
} catch {
  deepLink = appUrl;
}

const result = {
  taskTitle,
  resistanceType,
  resistanceScore,
  microStep,
  twoMinuteFloor:
    resistanceScore >= 7
      ? "打开来源文件，用计时器只做 120 秒"
      : microStep,
  rescueLadder,
  deepLink,
  deviceCommand: {
    type: "prompt",
    state: "prompted",
    display: microStep,
    accent: "#FF6B35",
    allowImmediateStart: resistanceScore < 8
  }
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const key = values[index];
    if (!key.startsWith("--")) continue;
    const value = values[index + 1];
    if (!value || value.startsWith("--")) {
      parsed[key.slice(2)] = "true";
      continue;
    }
    parsed[key.slice(2)] = value;
    index += 1;
  }
  return parsed;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
