// 客户端 fallback 计划调整逻辑，用于静态部署（GitHub Pages）或 API 不可用时

import { IS_STATIC_DEPLOYMENT } from "@/lib/deployment";

export interface AdjustPlanParams {
  taskTitle: string;
  completedSteps: string[];
  remainingSteps: string[];
  progressText: string;
  totalMinutes: number;
}

export function generateFallbackAdjustSuggestion(params: AdjustPlanParams): string {
  const { taskTitle, completedSteps, remainingSteps, progressText, totalMinutes } = params;
  const completedCount = completedSteps.length;
  const totalCount = completedCount + remainingSteps.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  const isStuck = /卡|不会|没思路|做不出|做不下去|不知道/.test(progressText);
  const isTired = /累|困|没精力|不想|疲惫|撑不住/.test(progressText);
  const isGoingWell = /完成|做完|搞定|顺利|没问题/.test(progressText);

  let suggestion = `📊 当前进度：${completedCount}/${totalCount} 步（${progress}%）\n\n`;

  if (progress === 100) {
    suggestion += `🎉 全部完成了！太厉害了！\n\n接下来可以：\n• 回顾一下整体过程，总结经验\n• 如果有余力可以优化细节\n• 给自己一个奖励，休息一下`;
  } else if (isStuck) {
    suggestion += `💪 你已经完成了 ${completedCount} 步，很棒！卡住是正常的，说明到了真正的难点。\n\n建议：\n• 先跳过卡住的这一步，做下一个阻力更小的步骤\n• 换个环境（去外面走走、喝杯水）再回来看\n• 把卡住的问题具体化：到底是不懂什么？是哪个环节卡住了？\n• 试试找人帮忙或搜索类似问题的解法\n• 今天如果实在做不动了就停下来，明天脑子清醒了再啃`;
  } else if (isTired) {
    suggestion += `🙏 已经完成 ${completedCount} 步了，精力不够就别硬撑。\n\n建议：\n• 今天先到这里，剩下的明天做\n• 睡个好觉，睡眠期间大脑会帮你整理思路\n• 明天从最简单的剩余步骤开始，不要直接啃硬骨头\n• 剩余约 ${Math.round(totalMinutes * (1 - progress / 100))} 分钟的工作量，分 1-2 天完成没问题`;
  } else if (isGoingWell) {
    suggestion += `🔥 状态不错！趁热打铁继续推进。\n\n建议：\n• 保持当前节奏，从下一个阻力最小的步骤开始\n• 每完成一步休息 5 分钟，别一口气做完\n• 剩余约 ${Math.round(totalMinutes * (1 - progress / 100))} 分钟，如果状态好今天就能做完\n• 做完后给自己一个小奖励`;
  } else {
    suggestion += `✅ 进度已记录，继续加油！\n\n建议：\n• 从剩余步骤中阻力最低的那个开始\n• 每完成一步就打勾，积累成就感\n• 如果今天已经做了很多，可以适当休息\n• 剩余约 ${Math.round(totalMinutes * (1 - progress / 100))} 分钟，合理安排时间`;
  }

  return suggestion;
}

export async function requestAdjustPlan(params: AdjustPlanParams): Promise<string> {
  if (IS_STATIC_DEPLOYMENT) {
    return generateFallbackAdjustSuggestion(params);
  }

  try {
    const res = await fetch("/api/adjust-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (data.suggestion) {
      return data.suggestion;
    }
    return generateFallbackAdjustSuggestion(params);
  } catch {
    return generateFallbackAdjustSuggestion(params);
  }
}
