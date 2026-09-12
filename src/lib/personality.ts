import { ProcrastinationType, PersonalityResult } from "./types";

interface PersonalityTypeInfo {
  name: string;
  emoji: string;
  description: string;
  traits: string[];
  suggestions: string[];
  color: string;
}

export const PERSONALITY_TYPES: Record<ProcrastinationType, PersonalityTypeInfo> = {
  perfectionist: {
    name: "完美主义者",
    emoji: "🎯",
    description:
      "你追求完美，害怕犯错。往往因为事情达不到理想标准而迟迟不敢开始，或者在中途不断修改、推翻重来。",
    traits: [
      "对细节有极高要求",
      "害怕失败和犯错",
      "常常过度准备",
      "难以接受'足够好'",
      "倾向于全有或全无的思维",
    ],
    suggestions: [
      "设定'最低可行标准'，先完成再完美",
      "使用'5分钟启动法'，承诺只做5分钟",
      "把大任务拆成可量化的小步骤",
      "允许自己产出'草稿版'，设定明确截止时间",
      "记录'已完成'而非'待修改'，对抗过度打磨",
      "区分'核心交付'和'锦上添花'，时间不够时先交付核心",
    ],
    color: "#ef4444",
  },
  dreamer: {
    name: "梦想家",
    emoji: "☁️",
    description:
      "你充满创意和想象力，但往往停留在'想'的阶段。计划很宏大，执行很困难，容易沉浸在对结果的美好幻想中。",
    traits: [
      "想法多但行动少",
      "对执行细节缺乏兴趣",
      "容易被新想法分心",
      "计划过于理想化",
      "常常低估所需时间",
    ],
    suggestions: [
      "为每个想法设定'72小时行动窗口'，过期就放下",
      "使用'1-3-5法则'：1件大事+3件中事+5件小事",
      "找一个执行型伙伴互相监督",
      "每天睡前写下3个'已完成'，而不是3个'待办'",
      "把模糊的想法转化为具体的下一步行动",
      "给自己设定'想法冷却期'：新想法先记下，48小时后仍想做再开始",
    ],
    color: "#8b5cf6",
  },
  worrier: {
    name: "焦虑者",
    emoji: "😰",
    description:
      "你容易被焦虑和担忧淹没。面对任务时，脑海中充斥着'万一做不好怎么办'的声音，最终选择逃避来缓解不适。",
    traits: [
      "过度思考可能的负面结果",
      "对不确定性容忍度低",
      "身体常伴随紧张感",
      "寻求反复确认",
      "用逃避来缓解焦虑",
    ],
    suggestions: [
      "练习'最坏情况分析'：写下最坏结果及应对方案",
      "使用4-7-8呼吸法缓解急性焦虑（吸气4秒、憋气7秒、呼气8秒）",
      "把'我必须做好'换成'我可以尝试做'",
      "设定'担忧时间'：每天15分钟集中担忧，其余时间出现担忧就记下来",
      "记录成功经验，建立自信档案，焦虑时翻阅",
      "区分'可控'和'不可控'，只对可控的部分行动",
    ],
    color: "#3b82f6",
  },
  "crisis-maker": {
    name: "危机制造者",
    emoji: "🔥",
    description:
      "你需要压力和紧迫感才能行动。截止日期前的肾上腺素飙升是你最高效的时刻，但这种模式长期会消耗大量精力。",
    traits: [
      "需要压力才能启动",
      "常常在最后关头爆发惊人效率",
      "主动制造紧急情况",
      "对早期开始感到无聊",
      "长期处于高压状态",
    ],
    suggestions: [
      "设置'前置截止日期'，比真实DDL早2-3天",
      "把任务拆解成多个'迷你DDL'，每个都设前置",
      "使用'赌注法'：和朋友打赌提前完成，输了请客",
      "尝试'假装今天是最后一天'练习",
      "逐步培养低压下的工作节奏，从15分钟开始",
      "关注身体健康：高压模式消耗大，注意补充睡眠和运动",
    ],
    color: "#f97316",
  },
  defier: {
    name: "反抗者",
    emoji: "✊",
    description:
      "你抗拒被控制或被要求。当任务感觉像'被强迫'时，你会本能地拖延来表达自主权，即使这些任务其实对你有益。",
    traits: [
      "对权威和规则有天然抗拒",
      "不喜欢被安排或催促",
      "用拖延来维护自主感",
      "对自己选择的事很有动力",
      "可能不自觉地测试他人底线",
    ],
    suggestions: [
      "把'我必须做'改成'我选择做'，找到自己选择做的理由",
      "给自己提供2-3个选项而非单一任务，用选择感替代被安排感",
      "找到任务与个人价值观的连接点，明确'我做这件事是为了什么'",
      "用'自主清单'替代'待办清单'，每项任务标注'我选择做'的原因",
      "允许自己以非传统方式完成任务，路径不重要，完成才重要",
      "区分'真正想反抗的'和'其实对自己有益的'，别为了反抗而伤害自己",
    ],
    color: "#10b981",
  },
  overdoer: {
    name: "过度承担者",
    emoji: "🤹",
    description:
      "你承担了太多责任，导致重要的事情被不断挤后。你不是不想做，而是被无数'紧急但不重要'的事淹没。",
    traits: [
      "难以拒绝他人请求",
      "TODO列表永远太长",
      "优先处理别人的事",
      "经常感到时间不够用",
      "忽略自我照顾",
    ],
    suggestions: [
      "学会说'让我看看日程再回复你'，给自己思考的缓冲时间",
      "每天只选3件'今天必须完成'的事，其余一律说不",
      "使用艾森豪威尔矩阵：重要紧急/重要不紧急/紧急不重要/不重要不紧急",
      "设定'不做什么'清单，明确列出本周拒绝的事",
      "每周留出2小时'不被打扰'的自我时间，雷打不动",
      "记住：帮别人不是义务，你的时间是你最珍贵的资源",
    ],
    color: "#ec4899",
  },
};

export interface Question {
  id: number;
  text: string;
  options: {
    text: string;
    scores: Partial<Record<ProcrastinationType, number>>;
  }[];
}

export const PERSONALITY_QUESTIONS: Question[] = [
  {
    id: 1,
    text: "面对一个新项目时，你的第一反应通常是？",
    options: [
      { text: "开始规划每个细节，确保万无一失", scores: { perfectionist: 2 } },
      { text: "脑中浮现各种可能性，但不知道从哪开始", scores: { dreamer: 2 } },
      { text: "担心自己做不好，开始焦虑", scores: { worrier: 2 } },
      { text: "觉得时间还多，等快到截止再说", scores: { "crisis-maker": 2 } },
      { text: "如果是别人安排的，本能想抗拒", scores: { defier: 2 } },
      { text: "手头事太多了，排不上号", scores: { overdoer: 2 } },
    ],
  },
  {
    id: 2,
    text: "你最常对自己说的一句话是？",
    options: [
      { text: "还不够好，再改改", scores: { perfectionist: 2 } },
      { text: "等我有了灵感就开始", scores: { dreamer: 2 } },
      { text: "万一搞砸了怎么办", scores: { worrier: 2 } },
      { text: "还早呢，最后一天能搞定", scores: { "crisis-maker": 2 } },
      { text: "凭什么又是我来做", scores: { defier: 2 } },
      { text: "等我忙完这些再说", scores: { overdoer: 2 } },
    ],
  },
  {
    id: 3,
    text: "当你拖延时，你通常在做什么？",
    options: [
      { text: "反复修改已经做好的部分", scores: { perfectionist: 2 } },
      { text: "看各种相关资料但不动手", scores: { dreamer: 2 } },
      { text: "胡思乱想各种坏结果", scores: { worrier: 2 } },
      { text: "做其他'更紧急'的事", scores: { "crisis-maker": 1, overdoer: 1 } },
      { text: "故意做点别的来表达不满", scores: { defier: 2 } },
      { text: "帮别人处理他们的任务", scores: { overdoer: 2 } },
    ],
  },
  {
    id: 4,
    text: "什么情况下你会开始行动？",
    options: [
      { text: "当我觉得准备得足够充分了", scores: { perfectionist: 2 } },
      { text: "当灵感突然来了", scores: { dreamer: 2 } },
      { text: "当焦虑感超过逃避的舒适感", scores: { worrier: 2 } },
      { text: "当截止日期近在眼前", scores: { "crisis-maker": 2 } },
      { text: "当我自己决定要做这件事", scores: { defier: 2 } },
      { text: "当所有其他事都处理完了", scores: { overdoer: 2 } },
    ],
  },
  {
    id: 5,
    text: "你完成任务的典型模式是？",
    options: [
      { text: "很早就开始，但反复打磨到最后一刻", scores: { perfectionist: 2 } },
      { text: "想了很久，最后草草完成", scores: { dreamer: 2 } },
      { text: "在焦虑和逃避中反复横跳，勉强完成", scores: { worrier: 2 } },
      { text: "最后24小时爆发式产出", scores: { "crisis-maker": 2 } },
      { text: "看心情，想做的时候一口气做完", scores: { defier: 2 } },
      { text: "见缝插针地做，但总被打断", scores: { overdoer: 2 } },
    ],
  },
  {
    id: 6,
    text: "你对'截止日期'的感受是？",
    options: [
      { text: "压力来源，怕做不够好", scores: { perfectionist: 1, worrier: 1 } },
      { text: "无感，我更关注想法本身", scores: { dreamer: 2 } },
      { text: "巨大的焦虑源", scores: { worrier: 2 } },
      { text: "终于有动力开始了！", scores: { "crisis-maker": 2 } },
      { text: "被限制的不爽感", scores: { defier: 2 } },
      { text: "又一个排不上号的任务", scores: { overdoer: 2 } },
    ],
  },
  {
    id: 7,
    text: "如果朋友观察你一周，他们会说你？",
    options: [
      { text: "太较真，追求完美到累", scores: { perfectionist: 2 } },
      { text: "想法很多但落地很少", scores: { dreamer: 2 } },
      { text: "总在担心这担心那", scores: { worrier: 2 } },
      { text: "不到最后不干活", scores: { "crisis-maker": 2 } },
      { text: "吃软不吃硬，越催越不动", scores: { defier: 2 } },
      { text: "永远在忙，但自己的事没进展", scores: { overdoer: 2 } },
    ],
  },
  {
    id: 8,
    text: "你觉得拖延给你带来的最大代价是？",
    options: [
      { text: "作品质量因时间不足而打折", scores: { perfectionist: 2 } },
      { text: "很多好想法最终都没实现", scores: { dreamer: 2 } },
      { text: "长期的精神内耗和焦虑", scores: { worrier: 2 } },
      { text: "身体吃不消，长期高压", scores: { "crisis-maker": 2 } },
      { text: "错失机会，和他人关系紧张", scores: { defier: 2 } },
      { text: "自己的重要目标永远被搁置", scores: { overdoer: 2 } },
    ],
  },
  {
    id: 9,
    text: "当你试图克服拖延时，什么方法对你最有效？",
    options: [
      { text: "降低标准，先做出一个粗糙版本", scores: { perfectionist: 2 } },
      { text: "把模糊想法变成具体的下一步行动", scores: { dreamer: 2 } },
      { text: "深呼吸缓解焦虑后从小事做起", scores: { worrier: 2 } },
      { text: "设置更早的自我截止日期", scores: { "crisis-maker": 2 } },
      { text: "找到自己做这件事的内在理由", scores: { defier: 2 } },
      { text: "减少不必要的承诺，给重要事留时间", scores: { overdoer: 2 } },
    ],
  },
  {
    id: 10,
    text: "深夜独处时，你最容易陷入什么状态？",
    options: [
      { text: "反复回放白天做得不够好的细节", scores: { perfectionist: 2 } },
      { text: "幻想未来但迟迟不去睡也不行动", scores: { dreamer: 2 } },
      { text: "担心明天会出各种问题", scores: { worrier: 2 } },
      { text: "赶截止日期的活，效率出奇高", scores: { "crisis-maker": 2 } },
      { text: "故意熬夜来感觉一点自由", scores: { defier: 2 } },
      { text: "处理白天没做完的杂事", scores: { overdoer: 2 } },
    ],
  },
];

export function calculatePersonality(
  answers: number[][]
): PersonalityResult {
  const scores: Record<ProcrastinationType, number> = {
    perfectionist: 0,
    dreamer: 0,
    worrier: 0,
    "crisis-maker": 0,
    defier: 0,
    overdoer: 0,
  };
  answers.forEach((answerIndices, qIndex) => {
    const question = PERSONALITY_QUESTIONS[qIndex];
    if (!question) return;
    answerIndices.forEach((idx) => {
      const option = question.options[idx];
      if (!option) return;
      Object.entries(option.scores).forEach(([type, score]) => {
        scores[type as ProcrastinationType] += score || 0;
      });
    });
  });
  const sortedTypes = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const dominantType = sortedTypes[0][0] as ProcrastinationType;
  const info = PERSONALITY_TYPES[dominantType];
  return {
    type: dominantType,
    typeName: info.name,
    description: info.description,
    traits: info.traits,
    suggestions: info.suggestions,
    scores,
    completedAt: new Date().toISOString(),
  };
}
