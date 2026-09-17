// 子任务完成后的 AI 反馈：评语 + 判断是否需要调整后续步骤 + 生成调整方案

import { IS_STATIC_DEPLOYMENT } from "@/lib/deployment";
import { generateSubBreakdown, MicroSubStep } from "@/lib/sub-breakdown";
import type { ResistanceType, SubTask } from "@/lib/types";

export interface CompletionFeedback {
  praise: string;            // 肯定/评语
  reflection: string;        // 反思/点评
  needsAdjustment: boolean;  // 是否需要调整后续计划
  adjustmentReason?: string; // 为什么要调整
  adjustmentType?: "rebreakdown" | "reorder" | "add-rest" | "merge"; // 调整类型
  targetStepIndex?: number;  // 需要调整的步骤索引（相对于剩余步骤）
  newSteps?: MicroSubStep[]; // 如果是重新拆解，新的步骤
  reorderNote?: string;      // 如果是调整顺序，说明怎么调
}

export interface CompletionFeedbackParams {
  stepTitle: string;
  stepDescription: string;
  userFeedback: string;
  completedCount: number;
  totalCount: number;
  remainingSteps: SubTask[];
  taskTitle?: string;
}

export function generateCompletionFeedback(params: CompletionFeedbackParams): CompletionFeedback {
  const { stepTitle, userFeedback, completedCount, totalCount, remainingSteps, stepDescription } = params;
  const progress = Math.round((completedCount / totalCount) * 100);

  // 分析用户输入
  const isEasy = /简单|容易|轻松|很快|顺利|没问题|小菜|搞定|秒/.test(userFeedback);
  const isHard = /难|累|卡|费劲|吃力|不容易|差点|好不容易|撑/.test(userFeedback);
  const learnedSomething = /学到|学会|掌握|理解|明白了|原来|收获/.test(userFeedback);
  const foundIssue = /发现|问题|bug|不对|有问题|错了/.test(userFeedback);
  const isTired = /累|困|疲惫|没精力|不想|撑不住/.test(userFeedback);
  const isMotivated = /有信心|继续|冲|加油|状态好/.test(userFeedback);

  // 生成评语
  let praise = "";
  let reflection = "";

  if (isEasy && learnedSomething) {
    praise = `👏 完成了"${stepTitle}"！你说很顺利还有收获，这就是最好的状态。`;
    reflection = "保持这个节奏，每一步都扎扎实实的，比囫囵吞枣强多了。";
  } else if (isEasy) {
    praise = `✅ " ${stepTitle}"搞定了，还挺顺利的嘛！`;
    reflection = "这一步阻力比预期低，说明你的能力比想象中强。接下来的步骤可能难度会上升，做好心理准备。";
  } else if (isHard && !isTired) {
    praise = `💪 硬啃下了"${stepTitle}"，不容易！你坚持下来了。`;
    reflection = "难的步骤都做完了，接下来的应该会轻松一些。如果下一题也很难，别硬撑，可以让 AI 帮你拆成更细的步骤。";
  } else if (isHard && isTired) {
    praise = `😮‍💨 " ${stepTitle}"终于搞定了，又难又累，你真的辛苦了。`;
    reflection = "这一步消耗了你不少精力。建议接下来做阻力小的步骤，或者直接休息一下，明天效率会更高。";
  } else if (isTired) {
    praise = `🙏 完成了"${stepTitle}"，但感觉累了对吧？正常的。`;
    reflection = "别硬撑。精力不足的时候效率低还容易出错，休息一下再继续效果更好。";
  } else if (foundIssue) {
    praise = `🔍 完成了"${stepTitle}"，还发现了问题，这很有价值！`;
    reflection = "能发现问题说明你真的在认真做。这些问题记下来，最后统一修的时候一起处理。";
  } else if (isMotivated) {
    praise = `🔥 " ${stepTitle}"完成，状态在线！`;
    reflection = "趁热打铁，但也别一口气冲太猛。保持节奏比速度重要。";
  } else {
    praise = `🎉 " ${stepTitle}"完成了！已完成 ${completedCount}/${totalCount} 步（${progress}%）。`;
    reflection = "每完成一步就离终点近一步。继续保持这个势头。";
  }

  // 判断是否需要调整
  let needsAdjustment = false;
  let adjustmentType: CompletionFeedback["adjustmentType"];
  let adjustmentReason = "";
  let targetStepIndex = 0;
  let newSteps: MicroSubStep[] | undefined;
  let reorderNote = "";

  // 规则1：用户说难 + 下一步也难 → 建议把下一步拆细
  if (isHard && remainingSteps.length > 0) {
    const nextHardStep = remainingSteps.findIndex(s => s.resistanceScore >= 7);
    if (nextHardStep >= 0) {
      needsAdjustment = true;
      adjustmentType = "rebreakdown";
      targetStepIndex = nextHardStep;
      adjustmentReason = `你说这步很难，我看下一步"${remainingSteps[nextHardStep].title}"阻力也有${remainingSteps[nextHardStep].resistanceScore}分，可能也会卡住。建议把它拆成更细的小步骤。`;
      newSteps = generateSubBreakdown(
        remainingSteps[nextHardStep].title,
        remainingSteps[nextHardStep].description,
        userFeedback,
        remainingSteps[nextHardStep].resistanceScore,
      ).steps;
    }
  }

  // 规则2：用户累了 + 还有高阻力步骤 → 建议先做简单的，难的往后排
  if (!needsAdjustment && isTired && remainingSteps.length > 1) {
    const easySteps = remainingSteps.filter(s => s.resistanceScore <= 4);
    const hardSteps = remainingSteps.filter(s => s.resistanceScore >= 7);
    if (easySteps.length > 0 && hardSteps.length > 0 && remainingSteps[0].resistanceScore >= 7) {
      needsAdjustment = true;
      adjustmentType = "reorder";
      adjustmentReason = "你看起来累了，但下一步是个高阻力的硬骨头。建议把简单的步骤先做了，难的留到精力好的时候再啃。";
      reorderNote = `先做"${easySteps[0].title}"（阻力${easySteps[0].resistanceScore}分），把"${remainingSteps[0].title}"（阻力${remainingSteps[0].resistanceScore}分）往后排。`;
    }
  }

  // 规则3：用户说简单 + 进展快 + 剩余步骤多 → 建议合并一些简单步骤加速
  if (!needsAdjustment && isEasy && progress < 50 && remainingSteps.length > 4) {
    const easyRemaining = remainingSteps.filter(s => s.resistanceScore <= 3);
    if (easyRemaining.length >= 2) {
      needsAdjustment = true;
      adjustmentType = "merge";
      adjustmentReason = "你状态不错，推进得很快。后面有几步阻力都很低，可以合并在一起做，节省时间。";
      reorderNote = `"${easyRemaining[0].title}"和"${easyRemaining[1].title}"都比较简单，可以连起来一口气做完。`;
    }
  }

  // 规则4：用户说累了 + 只剩几步 → 建议休息，明天做
  if (!needsAdjustment && isTired && remainingSteps.length > 0 && progress >= 50) {
    needsAdjustment = true;
    adjustmentType = "add-rest";
    adjustmentReason = "已经过半了，而且你说累了。建议今天就到这里，明天精力好的时候收尾效率更高。";
  }

  return {
    praise,
    reflection,
    needsAdjustment,
    adjustmentReason,
    adjustmentType,
    targetStepIndex,
    newSteps,
    reorderNote,
  };
}

// 调用 AI 或 fallback 生成完成反馈
export async function requestCompletionFeedback(params: CompletionFeedbackParams): Promise<CompletionFeedback> {
  if (IS_STATIC_DEPLOYMENT) {
    return generateCompletionFeedback(params);
  }

  // 本地开发如果有 API key 可以调用 AI，否则 fallback
  try {
    // 尝试调用服务端 API
    const res = await fetch("/api/completion-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.praise) return data;
    }
  } catch {
    // API 不存在或失败，走 fallback
  }

  return generateCompletionFeedback(params);
}
