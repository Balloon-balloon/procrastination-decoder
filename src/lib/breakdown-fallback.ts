// 客户端 fallback 拆解逻辑，用于静态部署（GitHub Pages）或 API 不可用时

import { IS_STATIC_DEPLOYMENT } from "@/lib/deployment";
import type { ResistanceType, SubTask } from "@/lib/types";

export interface FallbackSubTask {
  title: string;
  description: string;
  resistanceScore: number;
  resistanceType: ResistanceType;
  resistanceReason: string;
  estimatedMinutes: number;
  recommendedOrder: number;
  microStep: string;
}

export interface FallbackBreakdownResult {
  subTasks: FallbackSubTask[];
  overallStrategy: string;
  taskUnderstanding: string;
  painPointResponse: string;
  executionPlan: string;
}

export function generateFallbackBreakdown(
  title: string,
  description?: string
): FallbackBreakdownResult {
  const text = title + " " + (description || "");
  const taskUnderstanding = `关于「${title}」的任务，${description ? "用户提到：" + description.slice(0, 50) : "需要拆解成可执行的小步骤"}。`;
  const painPointResponse = "拖延的核心不是懒，是情绪阻力。把大任务拆小、从最简单的开始，一旦启动就容易继续下去。";
  const executionPlan = "建议按阻力从低到高逐步完成，每完成1-2步休息一下。总耗时约2-3小时，可以分1-2天做。";

  const isMathHomework =
    /数学|微积分|积分|导数|高数|线代|代数|几何|概率|统计|物理|化学|生物|作业|习题|做题|刷题|题目|考试|期末考|期中/.test(text);
  const isWriting =
    /论文|作文|文章|报告|总结|写作|撰写|写一篇|文案|博客/.test(text) ||
    /writing|essay|paper|report/i.test(text);
  const isCoding = /代码|编程|程序|开发|功能|bug|项目|前端|后端|算法|debug/i.test(text);
  const isStudy = /学习|复习|备考|看书|阅读|预习|自学/.test(text);
  const isDesign = /设计|海报|PPT|幻灯片|UI|界面|原型|视觉/i.test(text);
  const isProject = /项目|选题|测试|版本|优化|改善|应用|app|电脑|通行版/.test(text);

  if (isProject) {
    return {
      overallStrategy:
        "项目类任务的最大阻力是畏难+模糊（不知道从哪下手）。策略是：先明确选题方向（降低模糊），从最小可行版本开始（降低畏难），逐步迭代优化。",
      taskUnderstanding,
      painPointResponse,
      executionPlan: "建议分3-5天完成，每天1-2小时。先跑通核心功能再优化细节。",
      subTasks: [
        {
          title: "明确选题方向",
          description: "写下你想做的项目核心是什么，解决什么问题，目标用户是谁。不用很详细，3-5句话即可。",
          resistanceScore: 3,
          resistanceType: "ambiguous",
          resistanceReason: "需要思考但不需要动手做，阻力主要来自'不知道选什么好'的犹豫。",
          estimatedMinutes: 15,
          recommendedOrder: 1,
          microStep: "打开一个文档，写下'我想做一个___'这句话并填空。",
        },
        {
          title: "调研已有产品",
          description: "搜索网上已有的类似产品或app，记录3-5个竞品的优缺点。重点关注用户评价中的痛点。",
          resistanceScore: 4,
          resistanceType: "low-resistance",
          resistanceReason: "看别人的东西比较轻松，是输入不是输出，但需要一定专注力。",
          estimatedMinutes: 30,
          recommendedOrder: 2,
          microStep: "打开浏览器搜索关键词，把第一个竞品的名字和1个优点记下来。",
        },
        {
          title: "列出核心功能清单",
          description: "基于调研结果，列出你的产品需要有3-5个核心功能。不用很详细，每个功能一句话描述即可。",
          resistanceScore: 5,
          resistanceType: "ambiguous",
          resistanceReason: "需要做决策和取舍，但不需要写代码，阻力中等。",
          estimatedMinutes: 20,
          recommendedOrder: 3,
          microStep: "先写出第一个也是最重要的那个功能，一句话描述它。",
        },
        {
          title: "搭建本机测试版本",
          description: "用你熟悉的技术栈搭建项目骨架，实现最基本的那个功能。先不追求完美，能跑起来就行。",
          resistanceScore: 7,
          resistanceType: "overwhelming",
          resistanceReason: "开始真正动手了，可能会遇到技术问题，畏难情绪会冒出来。",
          estimatedMinutes: 60,
          recommendedOrder: 4,
          microStep: "创建项目文件夹，初始化项目，写一个hello world跑起来。",
        },
        {
          title: "测试并优化",
          description: "在本机测试功能是否正常，记录发现的问题。根据测试结果和竞品调研，优化1-2个细节。",
          resistanceScore: 6,
          resistanceType: "perfectionist",
          resistanceReason: "优化是无底洞，完美主义会想改太多。需要设定边界，先改最明显的。",
          estimatedMinutes: 40,
          recommendedOrder: 5,
          microStep: "先运行一次，记录第一个发现的问题，其他的先放着。",
        },
        {
          title: "规划通行版方向",
          description: "思考本机版本稳定后，如何扩展到更多电脑上使用。列出需要解决的技术问题（如打包、跨平台等），不用立刻做。",
          resistanceScore: 8,
          resistanceType: "overwhelming",
          resistanceReason: "想到要适配所有电脑，范围一下子变大，容易产生畏难情绪。",
          estimatedMinutes: 20,
          recommendedOrder: 6,
          microStep: "先写下'要让更多电脑用，我需要解决___问题'这句话。",
        },
      ],
    };
  }

  if (isMathHomework) {
    return {
      overallStrategy:
        "理科作业的最大阻力是畏难+模糊（不知道从哪下手）+即时满足诱惑。策略是：先看题+翻书找对应知识点（降低模糊），从最简单的题开始做（建立动量），不会的先跳过，最后再啃硬骨头。",
      taskUnderstanding,
      painPointResponse,
      executionPlan,
      subTasks: [
        {
          title: "准备好书本+作业纸",
          description: "把课本、笔记本、作业题都摊开在桌上，手机放远。找到这一章对应的页码。",
          resistanceScore: 2,
          resistanceType: "low-resistance",
          resistanceReason: "纯粹的准备工作，不需要动脑，几乎没阻力。",
          estimatedMinutes: 5,
          recommendedOrder: 1,
          microStep: "翻开书到对应的章节，把作业题放在旁边，手机静音放远。",
        },
        {
          title: "快速浏览所有题目",
          description: "把所有作业题快速过一遍，在心里分个类：哪几道会做、哪几道有点印象、哪几道完全不会。不用动笔。",
          resistanceScore: 3,
          resistanceType: "low-resistance",
          resistanceReason: "只是看看，不需要解出来，心理压力小。但这一步能消除'不知道有多难'的模糊恐惧。",
          estimatedMinutes: 10,
          recommendedOrder: 2,
          microStep: "先看第一题和最后一题，心里有数就行。",
        },
        {
          title: "翻书看对应知识点",
          description: "找到作业对应的章节，快速翻一遍公式、定理、例题。不用背，有个印象就行。",
          resistanceScore: 4,
          resistanceType: "ambiguous",
          resistanceReason: "复习比做题容易，是输入不是输出。看完再做题就没那么怕了。",
          estimatedMinutes: 15,
          recommendedOrder: 3,
          microStep: "先找到3个最相关的公式，抄在草稿纸上。",
        },
        {
          title: "做最简单的那几道题",
          description: "挑2-3道你觉得最有把握的题先做。不用按顺序。",
          resistanceScore: 5,
          resistanceType: "overwhelming",
          resistanceReason: "开始动笔做题了，但选最简单的，确保能做出来，建立信心和动量。",
          estimatedMinutes: 20,
          recommendedOrder: 4,
          microStep: "先写第一题的'已知'和'求'，画个图也行。",
        },
        {
          title: "做中等难度的题",
          description: "做那些有点印象但不确定的题。不会的翻书找类似的例题。",
          resistanceScore: 7,
          resistanceType: "overwhelming",
          resistanceReason: "需要动脑子了，可能会卡壳。但有了前面简单题的动量，没那么容易放弃。",
          estimatedMinutes: 40,
          recommendedOrder: 5,
          microStep: "先把题目抄一遍，写下已知条件，想想这题考哪个知识点。",
        },
        {
          title: "啃难题+检查",
          description: "最后做最难的题，实在不会就先放着。做完的题快速检查一遍。",
          resistanceScore: 8,
          resistanceType: "perfectionist",
          resistanceReason: "难题是畏难情绪的重灾区，可能做不出来会有挫败感。但放在最后做，前面已经有成就感了。",
          estimatedMinutes: 30,
          recommendedOrder: 6,
          microStep: "先看5分钟难题，有思路就写，没思路就标记一下明天问同学/老师。",
        },
      ],
    };
  }

  if (isWriting) {
    return {
      overallStrategy:
        "写作类任务的最大阻力是完美主义+开头难。策略是：先打开文档写一个烂初稿的标题，从机械操作（整理资料）入手建立动量，最后再写最难的开头。",
      taskUnderstanding,
      painPointResponse,
      executionPlan,
      subTasks: [
        {
          title: "新建文档+写标题",
          description: "打开文字处理软件，新建文档，输入任务标题。仅此而已。",
          resistanceScore: 2,
          resistanceType: "low-resistance",
          resistanceReason: "纯粹的机械操作，不需要思考，几乎没有阻力。",
          estimatedMinutes: 5,
          recommendedOrder: 1,
          microStep: "打开Word/Notion，新建一个文档，输入标题。",
        },
        {
          title: "收集参考资料",
          description: "找3-5篇相关的文章/资料，复制粘贴到文档里，不用读，先放着。",
          resistanceScore: 3,
          resistanceType: "low-resistance",
          resistanceReason: "收集资料是低门槛的'准备工作'，不需要产出自己的东西。",
          estimatedMinutes: 20,
          recommendedOrder: 2,
          microStep: "打开浏览器，搜索关键词，把第一个结果的链接存下来。",
        },
        {
          title: "列大纲",
          description: "列出3-5个主要部分，每个部分写1-2句话说明要写什么。不用很详细。",
          resistanceScore: 5,
          resistanceType: "ambiguous",
          resistanceReason: "需要一定的思考和结构规划，但比写全文简单得多。",
          estimatedMinutes: 25,
          recommendedOrder: 3,
          microStep: "先写出3个一级标题，哪怕是'第一部分''第二部分''第三部分'也行。",
        },
        {
          title: "写中间部分（不是开头）",
          description: "跳过开头和结尾，先写中间你最熟悉的那个部分。不用追求文笔。",
          resistanceScore: 7,
          resistanceType: "perfectionist",
          resistanceReason: "真正开始写内容了，完美主义会开始作祟。但写中间部分比写开头容易。",
          estimatedMinutes: 40,
          recommendedOrder: 4,
          microStep: "找到你最熟悉的那一小节，先写3句话，哪怕写得很烂。",
        },
        {
          title: "补开头和结尾",
          description: "中间写完了再回头写开头和结尾。开头可以最后写。",
          resistanceScore: 8,
          resistanceType: "perfectionist",
          resistanceReason: "开头最难，因为要'吸引人'，完美主义会卡在第一句话。",
          estimatedMinutes: 30,
          recommendedOrder: 5,
          microStep: "开头先随便写一句'本文旨在探讨...'，后面再改。",
        },
        {
          title: "通读修改",
          description: "从头到尾读一遍，修改明显的问题。不要改太多遍，设定只读2遍的上限。",
          resistanceScore: 6,
          resistanceType: "perfectionist",
          resistanceReason: "修改是完美主义者的无底洞。需要设定明确边界。",
          estimatedMinutes: 20,
          recommendedOrder: 6,
          microStep: "先快速扫一遍，只改错别字和不通顺的句子。",
        },
      ],
    };
  }

  if (isCoding) {
    return {
      overallStrategy:
        "编程任务的最大阻力是畏难+模糊。策略是：先跑起来（hello world），再逐步加功能。从最确定的部分开始，建立代码动量。",
      taskUnderstanding,
      painPointResponse,
      executionPlan,
      subTasks: [
        {
          title: "搭项目骨架",
          description: "创建项目文件夹，初始化项目，确保能运行一个hello world。",
          resistanceScore: 2,
          resistanceType: "low-resistance",
          resistanceReason: "机械操作，照着模板来就行，不需要思考。",
          estimatedMinutes: 15,
          recommendedOrder: 1,
          microStep: "打开终端，创建项目目录，运行初始化命令。",
        },
        {
          title: "写数据结构/类型定义",
          description: "定义核心数据模型和类型。这是编程中最'确定'的部分。",
          resistanceScore: 4,
          resistanceType: "low-resistance",
          resistanceReason: "写类型定义不需要算法思考，是机械+简单设计的组合。",
          estimatedMinutes: 20,
          recommendedOrder: 2,
          microStep: "先写出最核心的那个数据结构的3个字段。",
        },
        {
          title: "写最简单的那个功能",
          description: "挑一个你最确定怎么做的功能先写。不是最重要的，是最确定的。",
          resistanceScore: 6,
          resistanceType: "overwhelming",
          resistanceReason: "开始写真正的逻辑了，但选最简单的那个可以降低畏难感。",
          estimatedMinutes: 40,
          recommendedOrder: 3,
          microStep: "先写函数签名和输入输出，里面先return一个假数据。",
        },
        {
          title: "写核心逻辑",
          description: "实现最核心的那个功能/算法。",
          resistanceScore: 8,
          resistanceType: "overwhelming",
          resistanceReason: "这是最难的部分，可能会卡住，不确定性能不能做出来。",
          estimatedMinutes: 60,
          recommendedOrder: 4,
          microStep: "先用伪代码写出步骤，再逐行翻译成真实代码。",
        },
        {
          title: "调试和测试",
          description: "跑起来，测试，修bug。",
          resistanceScore: 5,
          resistanceType: "aversive",
          resistanceReason: "调试可能很烦，但至少代码已经写出来了，只是修修补补。",
          estimatedMinutes: 30,
          recommendedOrder: 5,
          microStep: "先运行一下，看看第一个报错是什么。",
        },
      ],
    };
  }

  if (isStudy) {
    return {
      overallStrategy:
        "学习任务的最大阻力是模糊+即时满足诱惑。策略是：把'学习'这个模糊的大目标拆成具体的小动作，用番茄钟分段，从最感兴趣的部分切入。",
      taskUnderstanding,
      painPointResponse,
      executionPlan,
      subTasks: [
        {
          title: "准备学习环境",
          description: "找好学习资料，打开书/视频，准备好笔记本。手机放远一点。",
          resistanceScore: 2,
          resistanceType: "low-resistance",
          resistanceReason: "只是'准备'，还没开始学，心理压力小。",
          estimatedMinutes: 5,
          recommendedOrder: 1,
          microStep: "把书翻到今天要学的那一页，手机放到另一个房间。",
        },
        {
          title: "读第一小节",
          description: "只读一个小节（5-10页），读完就可以停。",
          resistanceScore: 4,
          resistanceType: "instant-gratification",
          resistanceReason: "刚开始学，注意力还能集中，但手机的诱惑已经开始了。",
          estimatedMinutes: 20,
          recommendedOrder: 2,
          microStep: "只读前3页，读完就可以休息。",
        },
        {
          title: "做笔记/划重点",
          description: "把刚才读的内容整理成笔记，或者在书上划出重点。",
          resistanceScore: 5,
          resistanceType: "aversive",
          resistanceReason: "做笔记需要主动加工，比被动阅读累。",
          estimatedMinutes: 15,
          recommendedOrder: 3,
          microStep: "先抄3个最重要的概念的定义。",
        },
        {
          title: "做练习题",
          description: "做课后习题或练习题，检验理解程度。",
          resistanceScore: 7,
          resistanceType: "overwhelming",
          resistanceReason: "做题需要主动回忆和应用，比阅读难得多，容易产生挫败感。",
          estimatedMinutes: 30,
          recommendedOrder: 4,
          microStep: "先看第一道题，想想思路，不用写出来。",
        },
        {
          title: "复习+总结",
          description: "回顾今天学的内容，用自己的话总结3个要点。",
          resistanceScore: 6,
          resistanceType: "aversive",
          resistanceReason: "总结需要主动回忆，但量不大，是巩固记忆的关键一步。",
          estimatedMinutes: 10,
          recommendedOrder: 5,
          microStep: "在心里默想今天学了什么，想不起来再翻书。",
        },
      ],
    };
  }

  if (isDesign) {
    return {
      overallStrategy:
        "设计类任务的最大阻力是完美主义+模糊（不知道好不好）。策略是：先找参考定方向（降低模糊），再快速出低保真原型（降低完美主义），最后再打磨。",
      taskUnderstanding,
      painPointResponse,
      executionPlan,
      subTasks: [
        {
          title: "收集参考",
          description: "找5-10个相关的设计参考，保存到一个文件夹里。不用想自己怎么设计。",
          resistanceScore: 2,
          resistanceType: "low-resistance",
          resistanceReason: "看别人的设计很轻松，是收集不是创造，阻力低。",
          estimatedMinutes: 20,
          recommendedOrder: 1,
          microStep: "打开设计网站，搜关键词，保存第一个觉得不错的参考。",
        },
        {
          title: "画草图/线框图",
          description: "用纸笔画出大概的布局和结构。不用好看，能看懂就行。",
          resistanceScore: 4,
          resistanceType: "ambiguous",
          resistanceReason: "草图阶段允许粗糙，完美主义还没开始发作。",
          estimatedMinutes: 15,
          recommendedOrder: 2,
          microStep: "先在纸上画出3个主要区块的位置。",
        },
        {
          title: "搭框架（低保真）",
          description: "用设计软件搭出黑白灰的框架，不放图片和细节，只看结构。",
          resistanceScore: 6,
          resistanceType: "overwhelming",
          resistanceReason: "开始真正做设计了，但低保真阶段不用追求美观，压力较小。",
          estimatedMinutes: 40,
          recommendedOrder: 3,
          microStep: "先拉出页面的主布局框架，放3个占位框就行。",
        },
        {
          title: "加视觉元素",
          description: "添加颜色、图片、图标、文字等视觉元素。",
          resistanceScore: 7,
          resistanceType: "perfectionist",
          resistanceReason: "到了视觉阶段，完美主义开始作祟，总觉得不够好看。",
          estimatedMinutes: 45,
          recommendedOrder: 4,
          microStep: "先确定主色调，只调一个颜色方案。",
        },
        {
          title: "细节打磨",
          description: "调整间距、对齐、动效等细节。设定时间上限，不要无限打磨。",
          resistanceScore: 8,
          resistanceType: "perfectionist",
          resistanceReason: "细节是完美主义者的无底洞，总觉得还可以更好。",
          estimatedMinutes: 30,
          recommendedOrder: 5,
          microStep: "先检查3处最明显的对齐问题，改完就停。",
        },
      ],
    };
  }

  // 通用 fallback
  return {
    overallStrategy:
      "通用策略：从最简单、最机械的那一步开始，建立行动动量。动量一旦建立，后面的高阻力任务就没那么可怕了。",
    taskUnderstanding,
    painPointResponse,
    executionPlan,
    subTasks: [
      {
        title: "了解任务+准备",
        description: "搞清楚任务具体要做什么，准备好需要的工具和材料。",
        resistanceScore: 2,
        resistanceType: "low-resistance",
        resistanceReason: "只是准备和了解，还没开始真正做，心理压力小。",
        estimatedMinutes: 10,
        recommendedOrder: 1,
        microStep: "打开任务相关的文档/工具，看5分钟就行。",
      },
      {
        title: "列计划/拆分",
        description: "把大任务拆成几个小步骤，列出大概的顺序。不用太详细。",
        resistanceScore: 4,
        resistanceType: "ambiguous",
        resistanceReason: "思考结构比实际执行容易，但需要一定脑力。",
        estimatedMinutes: 15,
        recommendedOrder: 2,
        microStep: "先写出3个主要步骤，哪怕很粗略。",
      },
      {
        title: "做最简单的部分",
        description: "挑整个任务中最简单、最确定的那部分先做。",
        resistanceScore: 5,
        resistanceType: "low-resistance",
        resistanceReason: "最简单的部分阻力最低，用来建立行动动量。",
        estimatedMinutes: 30,
        recommendedOrder: 3,
        microStep: "先做这个部分的第一个小步骤，5分钟就行。",
      },
      {
        title: "攻克核心难点",
        description: "处理任务中最困难、最耗时的核心部分。",
        resistanceScore: 8,
        resistanceType: "overwhelming",
        resistanceReason: "核心难点通常是畏难情绪的主要来源。",
        estimatedMinutes: 60,
        recommendedOrder: 4,
        microStep: "先想清楚大概思路，不用马上写出来。",
      },
      {
        title: "收尾+检查",
        description: "完成剩余部分，整体检查一遍。",
        resistanceScore: 5,
        resistanceType: "aversive",
        resistanceReason: "收尾工作比较琐碎，但主要部分已经完成了。",
        estimatedMinutes: 20,
        recommendedOrder: 5,
        microStep: "先快速过一遍，看看有没有明显的问题。",
      },
    ],
  };
}

// 统一的 AI 拆解调用函数，自动处理静态部署 fallback
export async function requestBreakdown(params: {
  taskTitle: string;
  taskDescription?: string;
  personalityType?: string;
  personalityName?: string;
  painPoints?: string;
  goal?: string;
  fileSummary?: string;
  dueDate?: string;
}): Promise<FallbackBreakdownResult> {
  // 静态部署直接使用 fallback
  if (IS_STATIC_DEPLOYMENT) {
    return generateFallbackBreakdown(params.taskTitle, params.taskDescription);
  }

  try {
    const res = await fetch("/api/breakdown", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const result = await res.json();
    if (result.subTasks && Array.isArray(result.subTasks)) {
      return result;
    }
    return generateFallbackBreakdown(params.taskTitle, params.taskDescription);
  } catch {
    return generateFallbackBreakdown(params.taskTitle, params.taskDescription);
  }
}
