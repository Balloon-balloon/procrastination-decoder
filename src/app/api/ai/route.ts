import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `你是一个专业的拖延症分析教练，名为"解码者"。你的任务是帮助用户理解自己的拖延模式，并提供具体、可操作的建议。
你的回答应该：
1. 基于用户的拖延人格类型提供个性化建议
2. 具体可操作，避免空泛的鸡汤
3. 温暖但直接，不回避问题
4. 使用中文回答
5. 适当使用emoji增加亲和力
6. 如果用户提供了任务数据，分析其拖延模式
7. 回答简洁有力，不超过300字`;

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, context } = body as {
      messages: ChatMessage[];
      context?: {
        personalityType?: string;
        personalityName?: string;
        taskStats?: {
          total: number;
          completed: number;
          postponed: number;
          avgPostpone: number;
          completionRate: number;
        };
        focusMin?: number;
        streak?: number;
      };
    };

    const contextStr = context
      ? `用户背景信息：
- 拖延人格类型：${context.personalityName || "未测试"}
${context.taskStats ? `- 任务总数：${context.taskStats.total}
- 已完成：${context.taskStats.completed}
- 推迟次数：${context.taskStats.postponed}
- 平均推迟：${context.taskStats.avgPostpone}
- 完成率：${context.taskStats.completionRate}%` : ""}
${context.focusMin !== undefined ? `- 累计专注时间：${context.focusMin}分钟` : ""}
${context.streak !== undefined ? `- 连续天数：${context.streak}天` : ""}`
      : "";

    // 支持多种 API 提供商配置
    const apiKey =
      process.env.AI_API_KEY ||
      process.env.DEEPSEEK_API_KEY ||
      process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        reply: generateFallbackResponse(context, messages),
      });
    }

    // 根据环境变量判断用哪个 API
    let baseUrl = process.env.AI_API_BASE_URL;
    let model = process.env.AI_MODEL || "gpt-4o-mini";

    if (!baseUrl) {
      if (process.env.DEEPSEEK_API_KEY) {
        baseUrl = "https://api.deepseek.com/v1";
        model = process.env.AI_MODEL || "deepseek-chat";
      } else {
        baseUrl = "https://api.openai.com/v1";
      }
    }

    const fullMessages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(contextStr ? [{ role: "system" as const, content: contextStr }] : []),
      ...messages,
    ];

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: fullMessages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      return NextResponse.json({
        reply: generateFallbackResponse(context, messages),
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "抱歉，我暂时无法回复。";
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("AI route error:", error);
    return NextResponse.json({
      reply: generateFallbackResponse(undefined),
    });
  }
}

function generateFallbackResponse(
  context?: {
    personalityName?: string;
    taskStats?: { total: number; completed: number; postponed: number; completionRate: number };
    focusMin?: number;
    streak?: number;
  },
  messages?: ChatMessage[]
): string {
  const lastMessage = messages?.[messages.length - 1]?.content || "";

  if (context?.personalityName) {
    if (lastMessage.includes("怎么办") || lastMessage.includes("如何") || lastMessage.includes("怎么")) {
      return `基于你是「${context.personalityName}」类型的拖延者，我建议：\n\n1️⃣ 先从一个5分钟的微小行动开始，不求完美\n2️⃣ 把任务拆成"几乎不可能失败"的小步骤\n3️⃣ 设定一个比真实截止日期早2天的"个人DDL"\n\n💡 记住：行动先于动机，不是先有动力才行动，而是行动了才会有动力。`;
    }
    if (context.taskStats && context.taskStats.total > 0) {
      const rate = context.taskStats.completionRate;
      if (rate < 40) {
        return `我看到你的任务完成率是${rate}%，有提升空间 💪\n\n建议：\n• 今天只选1件最重要的事来完成\n• 用"5分钟启动法"——承诺只做5分钟\n• 完成后给自己一个小奖励\n\n你比你想象的更有能力，只是需要一个小小的开始。`;
      }
      return `你的任务完成率是${rate}%，做得不错！🎉\n\n继续保持这个节奏，同时关注：\n• 推迟次数是否在减少\n• 高优先级任务是否优先处理\n• 专注时间是否稳定\n\n每一步都在进步，继续加油！`;
    }
    return `你好！我是你的拖延解码教练 🧠\n\n作为「${context.personalityName}」，你可以尝试：\n• 每天设定3个"今天必须完成"的任务\n• 使用番茄钟（25分钟专注+5分钟休息）\n• 完成后记录成就，建立正反馈循环\n\n有什么具体问题都可以问我！`;
  }

  return `你好！我是你的拖延解码教练 🧠\n\n建议你先完成「人格测试」，了解你的拖延类型，这样我可以给你更精准的建议。\n\n你也可以先试试：\n• 创建一个任务并开始行动\n• 使用专注模式进行一次番茄钟\n• 记录今天的情绪状态\n\n有什么问题随时问我！`;
}
