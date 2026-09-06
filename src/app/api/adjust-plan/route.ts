import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskTitle, completedSteps, remainingSteps, progressText, totalMinutes } = body as {
      taskTitle: string;
      completedSteps: string[];
      remainingSteps: string[];
      progressText: string;
      totalMinutes: number;
    };

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
      // 无 API Key 时使用内置建议
      const completedCount = completedSteps.length;
      const totalCount = completedCount + remainingSteps.length;
      const progress = Math.round((completedCount / totalCount) * 100);
      
      return NextResponse.json({
        suggestion: `目前完成了 ${completedCount}/${totalCount} 步（${progress}%）。\n\n建议：\n1. 先回顾一下已经完成的部分，确保质量过关\n2. 接下来从阻力最小的剩余步骤开始，保持节奏\n3. 如果今天已经学了很久，建议休息一下，明天效率更高\n4. 卡住的步骤可以先放一放，做别的换换脑子`,
      });
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

    const systemPrompt = `你是一个拖延症任务教练。用户正在完成一个任务，告诉你今天的进展，请你给出个性化的后续建议。

要求：
1. 先肯定用户的进展，给予鼓励
2. 根据剩余步骤和当前进度，给出接下来的具体建议
3. 如果用户提到卡住了，给出具体的破解方法
4. 建议要实际、可操作，不要空泛的鸡汤
5. 考虑用户的精力状态，建议合理的节奏
6. 用中文回答，语气亲切像朋友
7. 控制在 150 字以内，分点列出`;

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

请给出接下来的建议。`,
          },
        ],
        max_tokens: 500,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({
        suggestion: "进度已记录！继续加油，一步一步来就好 💪",
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({
        suggestion: "进度已记录！继续加油，一步一步来就好 💪",
      });
    }

    return NextResponse.json({ suggestion: content.trim() });
  } catch (error) {
    console.error("Adjust plan error:", error);
    return NextResponse.json({
      suggestion: "进度已记录！继续加油，一步一步来就好 💪",
    });
  }
}
