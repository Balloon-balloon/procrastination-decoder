import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// 子任务的阻力类型
const ResistanceTypeSchema = z.enum([
  "perfectionist",
  "ambiguous",
  "overwhelming",
  "aversive",
  "instant-gratification",
  "low-resistance",
]);

const SubTaskSchema = z.object({
  title: z.string(),
  description: z.string(),
  resistanceScore: z.number().min(1).max(10),
  resistanceType: ResistanceTypeSchema,
  resistanceReason: z.string(),
  estimatedMinutes: z.number().min(5),
  recommendedOrder: z.number().int().min(1),
  microStep: z.string(),
});

const BreakdownResponseSchema = z.object({
  subTasks: z.array(SubTaskSchema).min(3).max(8),
  overallStrategy: z.string(),
  taskUnderstanding: z.string().optional(),
  painPointResponse: z.string().optional(),
  executionPlan: z.string().optional(),
});

const SYSTEM_PROMPT = `你是一个专业的拖延症任务拆解专家。你的核心方法论是：
**拖延不是时间管理问题，是情绪管理问题。** 任务拆解的目的不是"更高效地完成任务"，而是"降低每个子任务的情绪阻力，让人愿意迈出第一步"。

你输出的内容必须高度个性化，绝对不能使用模板化的套话。要真正读懂用户输入的任务细节，给出针对性的拆解。

## 阻力类型定义

1. **perfectionist（完美主义型）**：害怕做不好、怕出错、过度准备、追求一步到位。阻力来自"怕不够好"。
2. **ambiguous（模糊型）**：不知道从哪开始、任务太抽象、缺乏明确的第一步。阻力来自"不知道怎么做"。
3. **overwhelming（畏难型）**：任务看起来太大、觉得自己做不完、被规模吓住。阻力来自"任务太可怕"。
4. **aversive（抵触型）**：对任务本身反感、觉得无聊或无意义、内心抗拒。阻力来自"不想做"。
5. **instant-gratification（即时满足型）**：有更爽的替代选择（刷手机、打游戏），任务的回报太远。阻力来自"有更好玩的"。
6. **low-resistance（低阻力）**：机械操作、简单明确、几乎不需要意志力。

## 拆解原则

1. **真正理解任务**：在拆解之前，你必须先仔细阅读用户提供的所有信息——任务标题、描述、卡点、目标、参考资料摘要等。你的拆解必须反映出你真的理解了这个任务的具体内容，而不是套模板。
2. **阻力优先排序**：不按逻辑顺序，按阻力从低到高排序。先做阻力最小的子任务，建立动量和信心。
3. **第一子任务必须极低阻力**：第一个子任务的阻力分数必须≤3，让人"不可能失败"。比如"写毕业论文"的第一步不是"写引言"，而是"打开Word新建一个文档，输入论文标题"。
4. **每个子任务都有详细说明**：description 不是一两句话的空话，要具体说明这一步要做什么、怎么做、为什么要先做这一步、做完会有什么产出。
5. **每个子任务都有5分钟极小目标（microStep）**：哪怕这个子任务需要1小时，也设计一个5分钟能完成的启动动作。原理是：人一旦开始，就容易继续下去。microStep 必须极其具体，不能是"先做5分钟"这种废话。
6. **阻力评估要诚实**：不要为了"好看"而降低阻力分数。如果子任务真的很难，就给9-10分，并解释为什么难。
7. **引用用户的具体信息**：在描述和策略中，要提到用户提供的具体细节（比如用户提到的卡点、目标、时间限制等），让用户觉得"AI 真的看了我的内容"。

## 输出要求

- 生成 5-7 个子任务
- 每个子任务**必须包含以下所有字段**，缺一不可：
  - title: 子任务标题（字符串，要具体，包含任务主题）
  - description: 子任务详细描述（字符串，3-5句话，具体说明做什么、怎么做、产出是什么）
  - resistanceScore: 阻力分数，1-10的整数（数字）
  - resistanceType: 阻力类型（字符串）
  - resistanceReason: 为什么这个子任务有阻力，结合任务内容具体解释（字符串）
  - estimatedMinutes: 预估耗时，单位分钟，至少5分钟（整数）
  - recommendedOrder: 推荐执行顺序，按阻力从低到高排列，从1开始（整数）
  - microStep: 5分钟极小目标，一个非常具体的5分钟就能完成的启动动作（字符串）
- overallStrategy: 整体破解策略（字符串，2-3句话，结合任务具体内容和用户卡点给出针对性策略）
- taskUnderstanding: 一句话说明你对这个任务的理解（字符串，要让用户觉得你真的读懂了）
- painPointResponse: 针对用户提到的困难/卡点的回应和建议（字符串，2-3句话）
- executionPlan: 执行节奏建议（字符串，根据预估总时间给出建议，比如"建议分3天完成，每天1-2小时"）
- 使用中文回答
- **严格按照JSON格式输出**，不要有任何额外的解释文字、markdown标记或代码块包裹
- 正确的JSON结构示例：
  {
    "overallStrategy": "...",
    "taskUnderstanding": "...",
    "painPointResponse": "...",
    "executionPlan": "...",
    "subTasks": [
      {
        "title": "...",
        "description": "...",
        "resistanceScore": 2,
        "resistanceType": "low-resistance",
        "resistanceReason": "...",
        "estimatedMinutes": 10,
        "recommendedOrder": 1,
        "microStep": "..."
      }
    ]
  }`;

export async function POST(req: NextRequest) {
  let taskTitle = "";
  let taskDescription: string | undefined;
  try {
    const body = await req.json();
    taskTitle = body.taskTitle || "";
    taskDescription = body.taskDescription;
    const { personalityType, personalityName, painPoints, goal, fileSummary, dueDate, desiredSteps } = body as {
      taskTitle: string;
      taskDescription?: string;
      personalityType?: string;
      personalityName?: string;
      painPoints?: string;
      goal?: string;
      fileSummary?: string;
      dueDate?: string;
      desiredSteps?: number;
    };

    if (!taskTitle?.trim()) {
      return NextResponse.json(
        { error: "任务标题不能为空" },
        { status: 400 }
      );
    }

    // 支持多种 API 提供商配置
    // 优先级：自定义 > DeepSeek > OpenAI
    const apiKey =
      process.env.AI_API_KEY ||
      process.env.DEEPSEEK_API_KEY ||
      process.env.OPENAI_API_KEY;

    if (!apiKey) {
      // 无 API Key 时使用内置 fallback
      const fallbackResult = generateFallbackBreakdown(taskTitle, taskDescription);
      return NextResponse.json(fallbackResult);
    }

    // 根据环境变量判断用哪个 API
    let baseUrl = process.env.AI_API_BASE_URL;
    let model = process.env.AI_MODEL || "gpt-4o-mini";

    if (!baseUrl) {
      if (process.env.DEEPSEEK_API_KEY) {
        // DeepSeek 兼容 OpenAI API 格式
        baseUrl = "https://api.deepseek.com/v1";
        model = process.env.AI_MODEL || "deepseek-chat";
      } else {
        // 默认 OpenAI
        baseUrl = "https://api.openai.com/v1";
      }
    }

    const userContext = personalityType
      ? `用户的拖延人格类型是「${personalityName || personalityType}」。请结合这个人格类型的特点进行阻力评估。`
      : "用户还没有完成人格测试，请基于一般情况评估。";

    const taskContext = taskDescription
      ? `任务详细描述：${taskDescription}`
      : "";

    const painContext = painPoints
      ? `用户提到的困难/卡点：${painPoints}`
      : "";

    const goalContext = goal
      ? `用户的目标/期望：${goal}`
      : "";

    const fileContext = fileSummary
      ? `用户上传的参考资料摘要：${fileSummary}`
      : "";

    const dueContext = dueDate
      ? `截止日期：${dueDate}`
      : "";

    const stepsContext = desiredSteps
      ? `用户希望拆成约 ${desiredSteps} 个步骤。`
      : "请拆成 5-7 个步骤。";

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `请认真拆解以下任务。在拆解之前，请先仔细阅读所有信息，确保你的拆解是个性化的、针对性的。

【任务】${taskTitle}
${taskContext}
${painContext}
${goalContext}
${fileContext}
${dueContext}

${userContext}
${stepsContext}

请务必：
1. 先在 taskUnderstanding 中用一句话说明你理解了这个任务是什么
2. 在 painPointResponse 中专门回应用户提到的卡点
3. 在 executionPlan 中给出整体时间安排建议
4. 子任务描述要详细，不能是空话
5. microStep 要极其具体，是 5 分钟真的能做完的事

请输出JSON格式的拆解结果。`,
          },
        ],
        max_tokens: 2500,
        temperature: 0.8,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Breakdown API error (${baseUrl}):`, errorText);
      return NextResponse.json(generateFallbackBreakdown(taskTitle, taskDescription));
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(generateFallbackBreakdown(taskTitle, taskDescription));
    }

    try {
      const parsed = JSON.parse(content);
      
      // 容错：补全缺失的字段，避免 Zod 验证失败直接 fallback
      if (parsed.subTasks && Array.isArray(parsed.subTasks)) {
        parsed.subTasks = parsed.subTasks.map((st: any, idx: number) => ({
          title: st.title || `子任务 ${idx + 1}`,
          description: st.description || st.title || "",
          resistanceScore: Math.min(10, Math.max(1, st.resistanceScore || 5)),
          resistanceType: st.resistanceType || "ambiguous",
          resistanceReason: st.resistanceReason || "需要一定的时间和精力投入。",
          estimatedMinutes: Math.max(5, st.estimatedMinutes || 20),
          recommendedOrder: st.recommendedOrder || idx + 1,
          microStep: st.microStep || `先做5分钟，看看感觉如何。`,
        }));
      }
      if (!parsed.overallStrategy) {
        parsed.overallStrategy = "从最简单的那一步开始，建立行动动量。";
      }
      if (!parsed.taskUnderstanding) {
        parsed.taskUnderstanding = `这是一个关于「${taskTitle}」的任务，需要认真规划和执行。`;
      }
      if (!parsed.painPointResponse) {
        parsed.painPointResponse = "每个大任务看起来都吓人，但拆成小步骤后就没那么可怕了。关键是迈出第一步。";
      }
      if (!parsed.executionPlan) {
        parsed.executionPlan = "建议按阻力从低到高逐步完成，每完成一步休息一下，保持节奏。";
      }

      const validated = BreakdownResponseSchema.parse(parsed);
      return NextResponse.json(validated);
    } catch (parseError) {
      console.error("Breakdown response parse error. Raw content:", content);
      console.error("Parse error:", parseError);
      return NextResponse.json(generateFallbackBreakdown(taskTitle, taskDescription));
    }
  } catch (error) {
    console.error("Breakdown route error:", error);
    return NextResponse.json(generateFallbackBreakdown(taskTitle || "任务", taskDescription));
  }
}

// Fallback：无 API Key 或 API 失败时使用内置规则生成
function generateFallbackBreakdown(
  title: string,
  description?: string
): z.infer<typeof BreakdownResponseSchema> {
  const text = title + " " + (description || "");
  const taskUnderstanding = `关于「${title}」的任务，${description ? "用户提到：" + description.slice(0, 50) : "需要拆解成可执行的小步骤"}。`;
  const painPointResponse = "拖延的核心不是懒，是情绪阻力。把大任务拆小、从最简单的开始，一旦启动就容易继续下去。";
  const executionPlan = "建议按阻力从低到高逐步完成，每完成1-2步休息一下。总耗时约2-3小时，可以分1-2天做。";

  // 注意：判断顺序很重要！更具体的类型放前面
  // 数学/理科作业（注意：要在"写作类"之前判断，因为"写作业"也含"写"字）
  const isMathHomework =
    /数学|微积分|积分|导数|高数|线代|代数|几何|概率|统计|物理|化学|生物|作业|习题|做题|刷题|题目|考试|期末考|期中/.test(text);
  const isWriting =
    /论文|作文|文章|报告|总结|写作|撰写|写一篇|文案|博客/.test(text) ||
    /writing|essay|paper|report/i.test(text);
  const isCoding = /代码|编程|程序|开发|功能|bug|项目|前端|后端|算法|debug/i.test(text);
  const isStudy = /学习|复习|备考|看书|阅读|预习|自学/.test(text);
  const isDesign = /设计|海报|PPT|幻灯片|UI|界面|原型|视觉/i.test(text);

  if (isMathHomework) {
    return {
      overallStrategy:
        "理科作业的最大阻力是畏难+模糊（不知道从哪下手）+即时满足诱惑。策略是：先看题+翻书找对应知识点（降低模糊），从最简单的题开始做（建立动量），不会的先跳过，最后再啃硬骨头。",
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
