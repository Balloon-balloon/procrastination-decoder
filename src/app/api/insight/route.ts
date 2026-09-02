import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const SYSTEM_PROMPT = `你是一个专业的拖延症数据分析教练。你的任务是根据用户提供的行为数据，生成一段个性化的深度洞察和改进建议。

## 分析原则

1. **基于数据，不要凭空猜测**：所有结论都要基于用户提供的数据
2. **既要指出问题，也要肯定进步**：先肯定做得好的地方，再指出问题
3. **建议要具体、可操作**：不要说"加油"这种空话，要说具体怎么做
4. **结合阻力类型给出针对性建议**：比如完美主义型就建议"降低标准"，畏难型就建议"拆解更小"
5. **语气温暖、像朋友**：不要像老师训学生，要像理解你的朋友
6. **控制在300字以内**：简洁有力，不要长篇大论
7. **使用中文**

## 输出结构

请用JSON格式输出，包含以下字段：
- summary: 一句话总结用户的拖延模式（20字以内）
- strengths: 做得好的地方，数组，2-3条
- issues: 主要问题/需要改进的地方，数组，2-3条
- suggestions: 具体的改进建议，数组，3-4条，每条要非常具体可操作
- encouragement: 一句鼓励的话

严格按照JSON格式输出，不要有任何额外文字。`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      totalTasks,
      completedTasks,
      completionRate,
      totalPostpone,
      avgPostpone,
      streak,
      focusMin,
      personalityType,
      personalityName,
      topResistanceType,
      avgResistance,
      highResistanceCompletionRate,
      lowResistanceCompletionRate,
      recentTaskExamples,
    } = body;

    const apiKey =
      process.env.AI_API_KEY ||
      process.env.DEEPSEEK_API_KEY ||
      process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(generateFallbackInsight({
        completionRate,
        personalityName,
        topResistanceType,
      }));
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

    const userData = `
## 用户数据

- 总任务数：${totalTasks}
- 已完成：${completedTasks}
- 完成率：${completionRate}%
- 平均推迟次数：${avgPostpone}次/任务
- 连续行动天数：${streak}天
- 累计专注时长：${focusMin}分钟
- 拖延人格：${personalityName || "未测试"}（${personalityType || "未知"}）
- 主要阻力类型：${topResistanceType || "暂无数据"}
- 平均阻力分数：${avgResistance}/10
- 低阻力任务完成率：${lowResistanceCompletionRate}%
- 高阻力任务完成率：${highResistanceCompletionRate}%
- 最近的任务例子：${recentTaskExamples?.join("、") || "暂无"}

请基于以上数据，生成个性化的深度洞察和改进建议。`;

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
          { role: "user", content: userData },
        ],
        max_tokens: 800,
        temperature: 0.8,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Insight API error:", errorText);
      return NextResponse.json(generateFallbackInsight({ completionRate, personalityName, topResistanceType }));
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(generateFallbackInsight({ completionRate, personalityName, topResistanceType }));
    }

    try {
      const parsed = JSON.parse(content);
      // 容错补全
      return NextResponse.json({
        summary: parsed.summary || "继续保持，你做得很好！",
        strengths: parsed.strengths || [],
        issues: parsed.issues || [],
        suggestions: parsed.suggestions || [],
        encouragement: parsed.encouragement || "加油！",
      });
    } catch (parseError) {
      console.error("Insight parse error:", parseError);
      return NextResponse.json(generateFallbackInsight({ completionRate, personalityName, topResistanceType }));
    }
  } catch (error) {
    console.error("Insight route error:", error);
    return NextResponse.json(
      { error: "分析失败，请稍后再试" },
      { status: 500 }
    );
  }
}

function generateFallbackInsight({
  completionRate,
  personalityName,
  topResistanceType,
}: {
  completionRate: number;
  personalityName?: string;
  topResistanceType?: string;
}) {
  const strengths: string[] = [];
  const issues: string[] = [];
  const suggestions: string[] = [];
  let summary = "";

  if (completionRate >= 70) {
    summary = "行动力强，保持得很好！";
    strengths.push("任务完成率不错，说明你有不错的执行力");
    strengths.push("能坚持使用工具，这本身就是对抗拖延的好方法");
    if (topResistanceType) {
      suggestions.push(`注意你最常遇到的阻力是「${topResistanceType}」，可以针对性地拆解任务降低阻力`);
    }
    suggestions.push("挑战一下更高难度的任务，把舒适区往外推一点");
    suggestions.push("试试用专注模式提高深度工作的时间");
  } else if (completionRate >= 40) {
    summary = "有进步空间，找对方法会更好";
    strengths.push("已经开始行动了，这是最重要的一步");
    if (personalityName) {
      strengths.push(`你是「${personalityName}」，有自己独特的优势`);
    }
    issues.push("完成率还有提升空间，可能是任务难度或阻力的问题");
    suggestions.push("试试AI拆解功能，把大任务拆成小步骤，降低启动阻力");
    suggestions.push("从阻力最小的子任务开始做，先建立行动动量");
    suggestions.push("用番茄钟专注25分钟，告诉自己'就做25分钟'");
  } else {
    summary = "需要加油，先从小事开始";
    strengths.push("你已经意识到问题并在寻求帮助，这本身就是进步");
    issues.push("任务完成率较低，可能被畏难情绪困住了");
    suggestions.push("不要贪多，先从一个5分钟就能完成的小任务开始");
    suggestions.push("把任务拆得越小越好，小到不可能失败的程度");
    suggestions.push("完成一个小任务就给自己一点奖励，建立正向反馈");
    suggestions.push("不要等状态好才开始，开始了才会有状态");
  }

  return {
    summary,
    strengths,
    issues,
    suggestions,
    encouragement: "每一个小行动都是在对抗拖延，你已经在路上了 💪",
  };
}
