import { NextRequest, NextResponse } from "next/server";
import { generateFallbackAdjustSuggestion } from "@/lib/adjust-plan-fallback";

export async function POST(req: NextRequest) {
  let taskTitle = "";
  let completedSteps: string[] = [];
  let remainingSteps: string[] = [];
  let progressText = "";
  let totalMinutes = 0;

  try {
    const body = await req.json();
    taskTitle = body.taskTitle || "";
    completedSteps = body.completedSteps || [];
    remainingSteps = body.remainingSteps || [];
    progressText = body.progressText || "";
    totalMinutes = body.totalMinutes || 0;

    if (!taskTitle?.trim() || !progressText?.trim()) {
      return NextResponse.json(
        { error: "缺少必要信息" },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.AI_API_KEY ||
      process.env.DEEPSEEK_API_KEY ||
      process.env.OPENAI_API_KEY;

    if (!apiKey) {
      const suggestion = generateFallbackAdjustSuggestion({ taskTitle, completedSteps, remainingSteps, progressText, totalMinutes });
      return NextResponse.json({ suggestion });
    }

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

    const completedList = completedSteps.length > 0
      ? completedSteps.map((s, i) => `${i + 1}. ${s}`).join("\n")
      : "（还没有完成的步骤）";

    const remainingList = remainingSteps.length > 0
      ? remainingSteps.map((s, i) => `${i + 1}. ${s}`).join("\n")
      : "（没有剩余步骤了）";

    const systemPrompt = `你是一个拖延症任务教练。用户正在完成一个任务，告诉你今天的进展，请你根据用户的具体感受调整接下来的计划。

要求：
1. 先肯定用户的进展，给予鼓励
2. 仔细阅读用户说的话，理解他们的情绪状态（卡住了？累了？焦虑？还是进展顺利？）
3. 根据用户的具体情况，调整剩余步骤的执行顺序和建议
4. 如果用户卡在某一步，具体分析那一步为什么难，给出具体的破解方法，不要说空话
5. 引用具体的步骤名称，告诉用户"下一步做XXX"，而不是泛泛地说"继续做"
6. 建议要实际、可操作，不要空泛的鸡汤
7. 考虑用户的精力状态，建议合理的节奏
8. 用中文回答，语气亲切像朋友
9. 控制在 150 字以内，分点列出`;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `任务：${taskTitle}

已完成的步骤：
${completedList}

剩余的步骤：
${remainingList}

用户说：${progressText}

总预估时间：${totalMinutes} 分钟

请根据用户的感受，调整接下来的计划。`,
          },
        ],
        max_tokens: 500,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({
        suggestion: generateFallbackAdjustSuggestion({ taskTitle, completedSteps, remainingSteps, progressText, totalMinutes }),
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({
        suggestion: generateFallbackAdjustSuggestion({ taskTitle, completedSteps, remainingSteps, progressText, totalMinutes }),
      });
    }

    return NextResponse.json({ suggestion: content.trim() });
  } catch (error) {
    console.error("Adjust plan error:", error);
    return NextResponse.json({
      suggestion: generateFallbackAdjustSuggestion({ taskTitle, completedSteps, remainingSteps, progressText, totalMinutes }),
    });
  }
}
