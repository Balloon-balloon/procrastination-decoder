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
  const remainingMinutes = Math.round(totalMinutes * (1 - progress / 100));

  // 检测用户情绪和状态
  const isStuck = /难|卡|不会|没思路|做不出|做不下去|不知道|搞不定|看不懂|想不通|头大|崩溃|放弃/.test(progressText);
  const isTired = /累|困|没精力|不想|疲惫|撑不住|犯困|没劲|耗尽/.test(progressText);
  const isGoingWell = /完成|做完|搞定|顺利|没问题|轻松|很快|效率/.test(progressText);
  const isAnxious = /急|焦虑|来不及|赶|deadline|截止|来不及了/.test(progressText);
  const isMotivated = /有信心|可以|没问题|冲|加油|干|继续/.test(progressText);

  // 提取用户提到的具体步骤
  const stepMatch = progressText.match(/第([一二三四五六七八九十\d]+)步/);
  const stepNum = stepMatch ? stepMatch[1] : null;

  // 分析剩余步骤中的阻力关键词
  const hardSteps = remainingSteps.filter(s => /难|复杂|核心|关键|攻克|调试|写核心|啃/.test(s));
  const easySteps = remainingSteps.filter(s => !/难|复杂|核心|关键|攻克|调试|写核心|啃/.test(s));

  let suggestion = `📊 当前进度：${completedCount}/${totalCount} 步（${progress}%）\n\n`;

  if (progress === 100) {
    return suggestion + `🎉 全部完成了！太厉害了！\n\n接下来可以：\n• 回顾一下整体过程，总结经验\n• 如果有余力可以优化细节\n• 给自己一个奖励，休息一下`;
  }

  // 根据用户情绪和剩余步骤给出针对性建议
  if (isStuck) {
    suggestion += `💪 你说"${progressText}"，我理解你的感受。`;

    if (stepNum && remainingSteps.length > 0) {
      // 用户提到了具体步骤
      const stuckStep = remainingSteps[Math.min(parseInt(stepNum) - completedCount - 1, remainingSteps.length - 1)];
      suggestion += `"${stuckStep}" 这一步确实是个坎，很多人会卡在这里。\n\n`;
      suggestion += `📌 针对性调整：\n`;
      suggestion += `• 先跳过"${stuckStep}"，别和它死磕\n`;
      if (easySteps.length > 0) {
        suggestion += `• 先做"${easySteps[0]}"，这个阻力小，做完找找感觉\n`;
      }
      suggestion += `• 把卡住的问题拆得更细：到底是不懂哪个概念？还是不知道怎么开始？\n`;
      suggestion += `• 试试搜索类似问题的解法，或者找人问问\n`;
      suggestion += `• 今天如果实在啃不动，就放一晚上，明天脑子清醒了再看\n`;
      suggestion += `• 剩余 ${remainingMinutes} 分钟，可以分到明天做`;
    } else if (remainingSteps.length > 0) {
      suggestion += `卡住是正常的，说明到了真正的难点。\n\n`;
      suggestion += `📌 针对性调整：\n`;
      if (easySteps.length > 0 && hardSteps.length > 0) {
        suggestion += `• 把剩余步骤分成两组：\n  简单的：${easySteps.map(s => `"${s}"`).join("、")}\n  难的：${hardSteps.map(s => `"${s}"`).join("、")}\n`;
        suggestion += `• 先从简单的开始做，建立信心和动量\n`;
        suggestion += `• 难的那几个先放着，换个时间精力好的时候再啃\n`;
      } else {
        suggestion += `• 先跳过当前卡住的步骤，做下一个\n`;
        suggestion += `• 把卡住的问题具体化：到底是不懂什么？是哪个环节？\n`;
        suggestion += `• 试试找人帮忙或搜索解法\n`;
      }
      suggestion += `• 实在做不动了就停下来，别硬撑到崩溃\n`;
      suggestion += `• 剩余约 ${remainingMinutes} 分钟，不急`;
    }
  } else if (isAnxious) {
    suggestion += `😰 你说"${progressText}"，时间紧迫感我感受到了。\n\n`;
    suggestion += `📌 针对性调整：\n`;
    suggestion += `• 已完成 ${completedCount} 步，还剩 ${remainingSteps.length} 步，剩余约 ${remainingMinutes} 分钟\n`;
    if (remainingMinutes > 120) {
      suggestion += `• 时间确实紧，但不是不可能。建议分今天+明天两天完成\n`;
      suggestion += `• 今天先做最重要的 1-2 步，不求做完，求有进展\n`;
    } else {
      suggestion += `• 时间够用，集中精力一口气做完\n`;
      suggestion += `• 关掉手机，用番茄钟，25分钟一段\n`;
    }
    suggestion += `• 优先做对最终结果影响最大的步骤\n`;
    suggestion += `• 实在来不及，就降低完成标准，先"做完"再"做好"`;
  } else if (isTired) {
    suggestion += `🙏 你说"${progressText}"，精力不够就别硬撑。\n\n`;
    suggestion += `📌 针对性调整：\n`;
    suggestion += `• 已完成 ${completedCount} 步，干得不错\n`;
    suggestion += `• 今天先到这里，硬撑效率低还容易出错\n`;
    suggestion += `• 剩余 ${remainingSteps.length} 步约 ${remainingMinutes} 分钟，分到明天\n`;
    suggestion += `• 明天从最简单的步骤开始：`;
    if (easySteps.length > 0) {
      suggestion += `"${easySteps[0]}"\n`;
    } else {
      suggestion += `挑你觉得最容易下手的那个\n`;
    }
    suggestion += `• 睡一觉，明天脑子会帮你整理思路`;
  } else if (isGoingWell || isMotivated) {
    suggestion += `🔥 状态不错！\n\n`;
    suggestion += `📌 针对性调整：\n`;
    suggestion += `• 已完成 ${completedCount}/${totalCount}，趁热打铁\n`;
    suggestion += `• 下一步做：`;
    if (easySteps.length > 0) {
      suggestion += `"${easySteps[0]}"，阻力小，快速推进\n`;
    } else if (remainingSteps.length > 0) {
      suggestion += `"${remainingSteps[0]}"\n`;
    }
    suggestion += `• 每做完一步休息5分钟，别一口气做完\n`;
    suggestion += `• 剩余约 ${remainingMinutes} 分钟`;
    if (remainingMinutes < 60) {
      suggestion += `，今天就能搞定！`;
    } else {
      suggestion += `，今天做一半，明天收尾。`;
    }
  } else {
    // 通用但仍然引用具体步骤
    suggestion += `📝 你说"${progressText}"，已记录。\n\n`;
    suggestion += `📌 接下来的建议：\n`;
    suggestion += `• 已完成：${completedSteps.length > 0 ? completedSteps.map(s => `"${s}"`).join("、") : "暂无"}\n`;
    suggestion += `• 剩余：${remainingSteps.map(s => `"${s}"`).join("、")}\n`;
    if (easySteps.length > 0 && hardSteps.length > 0) {
      suggestion += `• 建议顺序：先做"${easySteps[0]}"`;
      if (easySteps.length > 1) {
        suggestion += `，再做"${easySteps[1] || easySteps[0]}"`;
      }
      suggestion += `，最后啃"${hardSteps[0]}"\n`;
    } else if (remainingSteps.length > 0) {
      suggestion += `• 从"${remainingSteps[0]}"开始\n`;
    }
    suggestion += `• 剩余约 ${remainingMinutes} 分钟`;
    if (remainingMinutes > 90) {
      suggestion += `，建议分2天完成`;
    } else if (remainingMinutes > 30) {
      suggestion += `，集中精力可以今天做完`;
    } else {
      suggestion += `，很快就能搞完`;
    }
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
