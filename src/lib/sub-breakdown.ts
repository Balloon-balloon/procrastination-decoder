// 子步骤重新拆解：当用户觉得某一步太难时，把那一步拆成更细的微步骤

import { IS_STATIC_DEPLOYMENT } from "@/lib/deployment";
import type { ResistanceType } from "@/lib/types";

export interface MicroSubStep {
  title: string;
  description: string;
  resistanceScore: number;
  resistanceType: ResistanceType;
  resistanceReason: string;
  estimatedMinutes: number;
  recommendedOrder: number;
  microStep: string;
}

export interface SubBreakdownResult {
  steps: MicroSubStep[];
  encouragement: string;
}

export function generateSubBreakdown(
  stepTitle: string,
  stepDescription: string,
  userFeedback: string,
  resistanceScore: number,
): SubBreakdownResult {
  const text = stepTitle + " " + stepDescription + " " + userFeedback;
  const encouragement = `把"${stepTitle}"拆成更细的小步骤，每一步都很容易上手，慢慢来。`;

  // 根据原始步骤的类型生成更细的拆解
  const isCoding = /代码|编程|程序|开发|功能|bug|算法|debug|写代码/.test(text);
  const isWriting = /论文|作文|文章|报告|总结|写作|撰写|写一篇|文案/.test(text);
  const isMath = /数学|微积分|公式|定理|做题|题目|习题|考试/.test(text);
  const isDesign = /设计|海报|PPT|幻灯片|UI|界面|原型|视觉/.test(text);
  const isProject = /项目|选题|测试|版本|优化|改善|应用|发布/.test(text);

  if (isCoding) {
    return {
      encouragement: `"${stepTitle}"看起来复杂，但拆成4个小步骤就不难了：`,
      steps: [
        {
          title: `搞清楚"${stepTitle}"要实现什么`,
          description: `不要急着写代码，先在纸上或脑子里想清楚：这一步的输入是什么、输出是什么、中间经过哪些处理。写下3个关键词。`,
          resistanceScore: 3,
          resistanceType: "low-resistance",
          resistanceReason: "只是思考不是编码，心理压力小。",
          estimatedMinutes: 5,
          recommendedOrder: 1,
          microStep: "拿出一张纸，写下这一步要做什么，3句话就行。",
        },
        {
          title: `搜一下别人怎么做的`,
          description: `搜索关键词，找2-3个类似的实现方案。不用看懂全部，先存下来。看看有没有现成的库或工具可以帮你省事。`,
          resistanceScore: 4,
          resistanceType: "low-resistance",
          resistanceReason: "搜索是输入不是输出，比写代码容易。",
          estimatedMinutes: 10,
          recommendedOrder: 2,
          microStep: "打开浏览器，搜索关键词，把第一个结果的链接存下来。",
        },
        {
          title: `写最核心的那1个函数`,
          description: `不要想着写完整个功能，先写最核心的那一个函数。函数签名先写好，里面先return一个假数据，确保能跑。`,
          resistanceScore: 6,
          resistanceType: "overwhelming",
          resistanceReason: "开始写真正的代码了，但只写一个函数，范围缩小了很多。",
          estimatedMinutes: 15,
          recommendedOrder: 3,
          microStep: "先写函数签名和return语句，里面return一个假的正确结果。",
        },
        {
          title: `跑通一次，修bug`,
          description: `运行一下看看报不报错，有错就修。不需要完美，能跑就行。`,
          resistanceScore: 5,
          resistanceType: "aversive",
          resistanceReason: "调试可能烦，但代码已经写出来了，只是修修补补。",
          estimatedMinutes: 10,
          recommendedOrder: 4,
          microStep: "先运行一次，看第一个输出是什么。",
        },
      ],
    };
  }

  if (isWriting) {
    return {
      encouragement: `"${stepTitle}"不难，拆成4步慢慢来：`,
      steps: [
        {
          title: `只写"${stepTitle}"的一句话`,
          description: `别想着写好，先写一句话总结这一步要表达什么。写得烂也没关系，后面再改。`,
          resistanceScore: 2,
          resistanceType: "low-resistance",
          resistanceReason: "只写一句话，几乎没压力。",
          estimatedMinutes: 3,
          recommendedOrder: 1,
          microStep: "打开文档，写一句话总结这一步要说什么。",
        },
        {
          title: `列3个要点`,
          description: `在这一步下面写3个bullet point，每个要点一句话。不用展开，先列出来。`,
          resistanceScore: 3,
          resistanceType: "low-resistance",
          resistanceReason: "列要点比写全文容易得多。",
          estimatedMinutes: 5,
          recommendedOrder: 2,
          microStep: "写出3个bullet point，每个一句话。",
        },
        {
          title: `把第一个要点写成一段`,
          description: `只展开第一个要点，写3-5句话。其他的先不管。`,
          resistanceScore: 6,
          resistanceType: "perfectionist",
          resistanceReason: "真正开始写内容了，但只写一段，范围小。",
          estimatedMinutes: 10,
          recommendedOrder: 3,
          microStep: "先写3句话展开第一个要点，烂也没关系。",
        },
        {
          title: `展开剩下两个要点`,
          description: `按同样的方式展开第二个和第三个要点。每段3-5句话。`,
          resistanceScore: 7,
          resistanceType: "perfectionist",
          resistanceReason: "需要持续输出，但有了第一段的经验会快很多。",
          estimatedMinutes: 15,
          recommendedOrder: 4,
          microStep: "先写第二段的第一句话。",
        },
      ],
    };
  }

  if (isMath) {
    return {
      encouragement: `"${stepTitle}"确实有难度，拆成4步来啃：`,
      steps: [
        {
          title: `找出这题考什么知识点`,
          description: `不要急着做题，先翻书或笔记，找出这道题涉及的知识点。写下知识点名称。`,
          resistanceScore: 3,
          resistanceType: "low-resistance",
          resistanceReason: "查找比做题容易，是输入不是输出。",
          estimatedMinutes: 5,
          recommendedOrder: 1,
          microStep: "翻书找到对应的知识点，抄下公式或定理。",
        },
        {
          title: `看一道类似的例题`,
          description: `书上或网上找一道类似的例题，看一遍解题过程。不用自己做，先看懂。`,
          resistanceScore: 4,
          resistanceType: "low-resistance",
          resistanceReason: "看别人解题比自己做容易，但能学到思路。",
          estimatedMinutes: 8,
          recommendedOrder: 2,
          microStep: "找到一道例题，读完它的解题过程。",
        },
        {
          title: `抄一遍题目，写已知和求`,
          description: `把题目抄一遍，写出已知条件和要求的东西。画图（如果适用）。`,
          resistanceScore: 5,
          resistanceType: "ambiguous",
          resistanceReason: "开始动手了，但只是抄写和整理，不需要解题。",
          estimatedMinutes: 5,
          recommendedOrder: 3,
          microStep: "先抄题目，写出'已知'和'求'。",
        },
        {
          title: `试着套公式`,
          description: `用找到的公式去试，先代入已知条件。做不出来就标记，明天问老师/同学。`,
          resistanceScore: 8,
          resistanceType: "overwhelming",
          resistanceReason: "这是最难的步骤，但前面已经铺垫了知识点和例题。",
          estimatedMinutes: 15,
          recommendedOrder: 4,
          microStep: "先代入第一个已知条件到公式里。",
        },
      ],
    };
  }

  if (isDesign) {
    return {
      encouragement: `"${stepTitle}"不用一步到位，拆成4步来：`,
      steps: [
        {
          title: `找3个参考`,
          description: `搜索类似的优秀设计，存3张图。不用想自己怎么做，先看别人怎么做的。`,
          resistanceScore: 2,
          resistanceType: "low-resistance",
          resistanceReason: "看别人的设计很轻松。",
          estimatedMinutes: 8,
          recommendedOrder: 1,
          microStep: "搜关键词，存第一张觉得不错的参考图。",
        },
        {
          title: `画草稿`,
          description: `用纸笔画出大概的布局，不用好看，能看懂就行。画3个不同的方案。`,
          resistanceScore: 4,
          resistanceType: "ambiguous",
          resistanceReason: "草图允许粗糙，压力小。",
          estimatedMinutes: 10,
          recommendedOrder: 2,
          microStep: "在纸上画3个框，代表主要区域的位置。",
        },
        {
          title: `搭黑白框架`,
          description: `用软件搭出黑白灰的框架，不放图片和细节，只看结构和比例。`,
          resistanceScore: 6,
          resistanceType: "overwhelming",
          resistanceReason: "开始用软件了，但低保真不用追求美观。",
          estimatedMinutes: 15,
          recommendedOrder: 3,
          microStep: "先拉出主框架，放3个占位框。",
        },
        {
          title: `加颜色和内容`,
          description: `在框架基础上加颜色、图片、文字。先确定主色调，其他跟着来。`,
          resistanceScore: 7,
          resistanceType: "perfectionist",
          resistanceReason: "到了视觉阶段完美主义会发作，但框架已经搭好了。",
          estimatedMinutes: 15,
          recommendedOrder: 4,
          microStep: "先确定主色调，只调一个颜色方案。",
        },
      ],
    };
  }

  if (isProject) {
    return {
      encouragement: `"${stepTitle}"看着大，拆成4步就不怕了：`,
      steps: [
        {
          title: `写下"${stepTitle}"的具体目标`,
          description: `这一步到底要产出什么？写下来，一句话。比如"完成本机版本的核心功能"→"实现在终端输入xxx时返回yyy"。`,
          resistanceScore: 3,
          resistanceType: "ambiguous",
          resistanceReason: "只是想清楚要做什么，不用动手。",
          estimatedMinutes: 5,
          recommendedOrder: 1,
          microStep: "写一句话：这一步做完后，我能看到什么结果？",
        },
        {
          title: `列出最小可行方案`,
          description: `不要追求完美，想最简单能跑通的方案。能省的全省，先跑起来再说。`,
          resistanceScore: 5,
          resistanceType: "ambiguous",
          resistanceReason: "需要思考但不用动手做，阻力中等。",
          estimatedMinutes: 10,
          recommendedOrder: 2,
          microStep: "写下最简单方案的3个步骤。",
        },
        {
          title: `做最小版本`,
          description: `按最小可行方案做，只做核心部分，能跑就行。丑也没关系，先跑通。`,
          resistanceScore: 7,
          resistanceType: "overwhelming",
          resistanceReason: "真正动手了，但范围已经缩小到最小。",
          estimatedMinutes: 20,
          recommendedOrder: 3,
          microStep: "先做最核心的那个功能，其他先不管。",
        },
        {
          title: `测试一下，记录问题`,
          description: `跑一遍，看哪里有问题。把问题列出来，不用马上修，先记录。`,
          resistanceScore: 4,
          resistanceType: "low-resistance",
          resistanceReason: "测试比开发轻松，只是记录问题。",
          estimatedMinutes: 8,
          recommendedOrder: 4,
          microStep: "先运行一次，记录第一个发现的问题。",
        },
      ],
    };
  }

  // 通用拆解
  return {
    encouragement: `把"${stepTitle}"拆成更小步骤，一步步来就不难了：`,
    steps: [
      {
        title: `明确"${stepTitle}"到底要做什么`,
        description: `先搞清楚这一步的具体目标。写下做完后能看到什么结果。`,
        resistanceScore: 3,
        resistanceType: "low-resistance",
        resistanceReason: "只是思考不是动手做。",
        estimatedMinutes: 5,
        recommendedOrder: 1,
        microStep: "写一句话：这一步做完后，结果是什么样子？",
      },
      {
        title: `准备做"${stepTitle}"需要的材料`,
        description: `把需要的东西准备好：工具、资料、环境。不用开始做，先摆好。`,
        resistanceScore: 2,
        resistanceType: "low-resistance",
        resistanceReason: "准备工作几乎不需要动脑。",
        estimatedMinutes: 5,
        recommendedOrder: 2,
        microStep: "打开需要的工具，把材料放到手边。",
      },
      {
        title: `做"${stepTitle}"的第一小部分`,
        description: `不要想做完全部，只做最开始的那个小部分。做到哪算哪。`,
        resistanceScore: 6,
        resistanceType: "overwhelming",
        resistanceReason: "开始动手了，但范围缩小了很多。",
        estimatedMinutes: 15,
        recommendedOrder: 3,
        microStep: "先做5分钟，只做最开头那个动作。",
      },
      {
        title: `继续做剩下的部分`,
        description: `在前面做了的基础上继续。如果卡住了就跳过这一小块，做下一块。`,
        resistanceScore: 7,
        resistanceType: "perfectionist",
        resistanceReason: "需要持续推进，但已经有了一个好的开始。",
        estimatedMinutes: 15,
        recommendedOrder: 4,
        microStep: "接着做下一小块，5分钟就行。",
      },
    ],
  };
}

// 调用 AI 或 fallback 来重新拆解一个子步骤
export async function requestSubBreakdown(params: {
  stepTitle: string;
  stepDescription: string;
  userFeedback: string;
  resistanceScore: number;
  taskTitle?: string;
}): Promise<SubBreakdownResult> {
  if (IS_STATIC_DEPLOYMENT) {
    return generateSubBreakdown(params.stepTitle, params.stepDescription, params.userFeedback, params.resistanceScore);
  }

  try {
    const apiKey =
      process.env.NEXT_PUBLIC_AI_API_KEY ||
      process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;

    // 没有 API key 就用 fallback
    if (!apiKey) {
      return generateSubBreakdown(params.stepTitle, params.stepDescription, params.userFeedback, params.resistanceScore);
    }

    // 在静态部署中无法调用服务端 API，使用 fallback
    return generateSubBreakdown(params.stepTitle, params.stepDescription, params.userFeedback, params.resistanceScore);
  } catch {
    return generateSubBreakdown(params.stepTitle, params.stepDescription, params.userFeedback, params.resistanceScore);
  }
}
