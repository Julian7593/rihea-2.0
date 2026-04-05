export const CBT_PROGRAM_VERSION = "2026.03.v2";

const zh = {
  level1: "Level 1 自助巩固",
  level2: "Level 2 结构化自助+临床随访",
  level3: "Level 3 临床优先",
};

const en = {
  level1: "Level 1 Self-guided",
  level2: "Level 2 Structured self-help + follow-up",
  level3: "Level 3 Clinical priority",
};

export const CBT_CARE_LEVEL_CONTENT = {
  level1: {
    label: { zh: zh.level1, en: en.level1 },
    desc: {
      zh: "以日常练习和伴侣支持为主，重点稳住波动并持续追踪。",
      en: "Focus on daily practice and partner support while tracking change.",
    },
    escalationCopy: {
      zh: "如果连续两周分数上升或功能继续受影响，请升级到专业随访。",
      en: "Escalate to professional follow-up if symptoms rise for 2 weeks or functioning worsens.",
    },
  },
  level2: {
    label: { zh: zh.level2, en: en.level2 },
    desc: {
      zh: "除结构化练习外，需要更规律的复评和临床支持衔接。",
      en: "Structured practice plus regular reassessment and clinical follow-up.",
    },
    escalationCopy: {
      zh: "请在 72 小时内完成转介或预约意向，并保持双周复评。",
      en: "Complete referral or booking intent within 72 hours and stay on biweekly reassessment.",
    },
  },
  level3: {
    label: { zh: zh.level3, en: en.level3 },
    desc: {
      zh: "优先处理安全和专业支持，自助内容降为辅助。",
      en: "Prioritize safety and professional care. Self-help becomes secondary.",
    },
    escalationCopy: {
      zh: "请立即联系专业人员，并让伴侣或家人知晓当前状态。",
      en: "Contact a professional immediately and inform partner or family now.",
    },
  },
};

export const CBT_MODULE_LIBRARY = [
  {
    id: "week-1-trigger-map",
    weekNumber: 1,
    version: CBT_PROGRAM_VERSION,
    pregnancyWeekRange: [4, 42],
    contraindications: [],
    escalationCopy: {
      zh: "如果情绪持续恶化或出现伤害想法，请停止自助练习并联系专业支持。",
      en: "Stop self-help and seek professional support if symptoms worsen or safety concerns appear.",
    },
    title: {
      zh: "心理教育与触发识别",
      en: "Psychoeducation and trigger mapping",
    },
    summary: {
      zh: "先知道情绪为什么来，再决定今天怎么接住它。",
      en: "Understand why the emotion shows up before deciding what to do next.",
    },
    microPractice: {
      title: {
        zh: "90秒触发点记录",
        en: "90-sec trigger note",
      },
      desc: {
        zh: "写下今天最明显的触发事件、身体反应和第一反应想法。",
        en: "Log one trigger, one body cue, and the first automatic thought.",
      },
      durationLabel: {
        zh: "90秒",
        en: "90 sec",
      },
    },
    partnerAction: {
      title: {
        zh: "帮她减少一个触发点",
        en: "Remove one trigger today",
      },
      desc: {
        zh: "今晚主动接手一件会放大紧张感的具体事情。",
        en: "Take over one concrete stress-amplifying task tonight.",
      },
    },
    homeworkTemplate: {
      type: "thought_record",
      title: {
        zh: "触发-想法-感受记录",
        en: "Trigger-thought-feeling record",
      },
      prompt: {
        zh: "记录一次明显情绪波动，写下触发事件、自动想法和情绪强度。",
        en: "Capture one mood spike with trigger, automatic thought, and intensity.",
      },
      helper: {
        zh: "先写事实，再写你脑中最先冒出的那句话。",
        en: "Write the facts first, then the first sentence your mind produced.",
      },
    },
  },
  {
    id: "week-2-behavior-activation",
    weekNumber: 2,
    version: CBT_PROGRAM_VERSION,
    pregnancyWeekRange: [4, 42],
    contraindications: ["持续腹痛时不做高强度活动"],
    escalationCopy: {
      zh: "如果活动后明显更疲惫或身体不适，请下调强度并通知医生。",
      en: "Reduce intensity and contact care if activity increases exhaustion or discomfort.",
    },
    title: {
      zh: "行为激活",
      en: "Behavioral activation",
    },
    summary: {
      zh: "用可完成的小行动，把一天从停滞拉回流动。",
      en: "Use tiny doable actions to move the day out of freeze mode.",
    },
    microPractice: {
      title: {
        zh: "10分钟轻行动",
        en: "10-min activation",
      },
      desc: {
        zh: "在散步、晒太阳、整理床边或喝水中选一件，马上开始。",
        en: "Choose one small action like a walk, sunlight, tidying, or hydration.",
      },
      durationLabel: {
        zh: "10分钟",
        en: "10 min",
      },
    },
    partnerAction: {
      title: {
        zh: "陪她完成一个小行动",
        en: "Do one small action together",
      },
      desc: {
        zh: "不要催促，直接陪她把今天最小的行动做完。",
        en: "Do not push. Join her in finishing one small action.",
      },
    },
    homeworkTemplate: {
      type: "activity_plan",
      title: {
        zh: "本周微行动计划",
        en: "Weekly micro-activity plan",
      },
      prompt: {
        zh: "列出 3 个低负担、可重复的小行动，并选 1 个今天完成。",
        en: "List 3 low-burden repeatable actions and finish 1 today.",
      },
      helper: {
        zh: "越小越好，关键是能开始。",
        en: "Smaller is better. The key is getting started.",
      },
    },
  },
  {
    id: "week-3-cognitive-reframe",
    weekNumber: 3,
    version: CBT_PROGRAM_VERSION,
    pregnancyWeekRange: [4, 42],
    contraindications: [],
    escalationCopy: {
      zh: "如果反复出现强烈绝望或失控想法，请优先切换到安全计划。",
      en: "Switch to a safety plan first if hopeless or out-of-control thoughts intensify.",
    },
    title: {
      zh: "思维记录与认知重建",
      en: "Thought record and cognitive restructuring",
    },
    summary: {
      zh: "把灾难化念头拆成证据、可能性和下一步。",
      en: "Break catastrophic thoughts into evidence, likelihood, and the next step.",
    },
    microPractice: {
      title: {
        zh: "三栏改写",
        en: "3-column reframe",
      },
      desc: {
        zh: "写下最糟想法、支持证据和更平衡的一句替代说法。",
        en: "Write the worst thought, evidence for it, and one balanced alternative.",
      },
      durationLabel: {
        zh: "5分钟",
        en: "5 min",
      },
    },
    partnerAction: {
      title: {
        zh: "别急着讲道理",
        en: "Do not argue with the feeling",
      },
      desc: {
        zh: "先复述她的担心，再问她现在最需要你做什么。",
        en: "Reflect the worry first, then ask what support she needs now.",
      },
    },
    homeworkTemplate: {
      type: "thought_record",
      title: {
        zh: "思维重建记录",
        en: "Thought restructuring worksheet",
      },
      prompt: {
        zh: "完成 1 次“最坏结果 - 证据 - 平衡想法 - 下一步行动”练习。",
        en: "Complete one worst-case, evidence, balanced thought, next-step exercise.",
      },
      helper: {
        zh: "替代想法不需要非常积极，只要更贴近事实。",
        en: "The alternative thought does not need to be positive, only more accurate.",
      },
    },
  },
  {
    id: "week-4-problem-solving",
    weekNumber: 4,
    version: CBT_PROGRAM_VERSION,
    pregnancyWeekRange: [4, 42],
    contraindications: [],
    escalationCopy: {
      zh: "如果家庭冲突升级，请优先求助专业人员而不是单独硬扛。",
      en: "Seek professional support if family conflict escalates instead of carrying it alone.",
    },
    title: {
      zh: "问题解决与伴侣沟通",
      en: "Problem solving and partner communication",
    },
    summary: {
      zh: "把模糊的压力变成可分工、可协作的问题。",
      en: "Turn vague stress into concrete, shareable problems.",
    },
    microPractice: {
      title: {
        zh: "一句话支持请求",
        en: "One-sentence support ask",
      },
      desc: {
        zh: "用“我现在感到…，我需要你帮我…”写出一个具体请求。",
        en: "Use “I feel..., I need you to...” to make one specific request.",
      },
      durationLabel: {
        zh: "3分钟",
        en: "3 min",
      },
    },
    partnerAction: {
      title: {
        zh: "先答应一个小请求",
        en: "Say yes to one small request",
      },
      desc: {
        zh: "优先回应她提出的最小支持请求，而不是解释原因。",
        en: "Respond to the smallest support request before explaining anything.",
      },
    },
    homeworkTemplate: {
      type: "problem_solving",
      title: {
        zh: "问题拆解表",
        en: "Problem-solving sheet",
      },
      prompt: {
        zh: "写下一个本周最卡的现实问题，列出 2 个可行方案和本周试行方案。",
        en: "Define one stuck problem, list 2 possible options, and choose one to try this week.",
      },
      helper: {
        zh: "问题尽量具体，例如“谁陪产检”而不是“我压力大”。",
        en: "Keep it specific, like 'who joins the appointment' instead of 'I am stressed'.",
      },
    },
  },
  {
    id: "week-5-sleep-stability",
    weekNumber: 5,
    version: CBT_PROGRAM_VERSION,
    pregnancyWeekRange: [4, 42],
    contraindications: ["医生要求严格卧床时不增加步行活动"],
    escalationCopy: {
      zh: "如果连续 3 晚严重失眠或伴明显躯体不适，请联系临床支持。",
      en: "Contact care if severe insomnia lasts 3 nights or comes with significant physical symptoms.",
    },
    title: {
      zh: "CBT-I Lite 睡眠稳定",
      en: "CBT-I Lite sleep stabilization",
    },
    summary: {
      zh: "优先稳住睡前反刍、夜醒后的应对和白天节律。",
      en: "Stabilize bedtime rumination, middle-of-the-night response, and daytime rhythm.",
    },
    microPractice: {
      title: {
        zh: "睡前缓冲 15 分钟",
        en: "15-min pre-sleep buffer",
      },
      desc: {
        zh: "关掉强刺激内容，做一次呼吸或身体扫描，再上床。",
        en: "Turn off stimulating content and do one breath or body-scan round before bed.",
      },
      durationLabel: {
        zh: "15分钟",
        en: "15 min",
      },
    },
    partnerAction: {
      title: {
        zh: "帮她守住睡前边界",
        en: "Protect the bedtime boundary",
      },
      desc: {
        zh: "晚上减少争论和临睡前决策，把环境调得更柔和。",
        en: "Reduce conflict and last-minute decisions. Make the environment gentler.",
      },
    },
    homeworkTemplate: {
      type: "sleep_plan",
      title: {
        zh: "睡眠稳定计划",
        en: "Sleep stabilization plan",
      },
      prompt: {
        zh: "记录你的睡前流程、夜醒触发和明晚准备做的 1 个调整。",
        en: "Track bedtime routine, night-waking trigger, and one change for tomorrow night.",
      },
      helper: {
        zh: "先追求更稳，不追求立刻睡满。",
        en: "Aim for steadiness first, not perfect sleep immediately.",
      },
    },
  },
  {
    id: "week-6-birth-prep",
    weekNumber: 6,
    version: CBT_PROGRAM_VERSION,
    pregnancyWeekRange: [20, 42],
    contraindications: [],
    escalationCopy: {
      zh: "如果分娩恐惧持续升高并影响功能，请尽快安排专业评估。",
      en: "Arrange professional evaluation if birth fear continues rising and affects function.",
    },
    title: {
      zh: "分娩恐惧暴露与分娩准备",
      en: "Birth fear exposure and labor preparation",
    },
    summary: {
      zh: "把未知变成清单和演练，降低临近分娩时的失控感。",
      en: "Turn the unknown into checklists and rehearsal to lower loss-of-control fear.",
    },
    microPractice: {
      title: {
        zh: "分娩准备清单 1 次",
        en: "One labor prep checklist pass",
      },
      desc: {
        zh: "确认待产包、陪产安排和紧急联系人，减少临近分娩的不确定感。",
        en: "Confirm the hospital bag, support plan, and emergency contacts.",
      },
      durationLabel: {
        zh: "8分钟",
        en: "8 min",
      },
    },
    partnerAction: {
      title: {
        zh: "一起过一遍分娩计划",
        en: "Review the birth plan together",
      },
      desc: {
        zh: "陪她把担心逐条说出来，再把能准备的事情确认掉。",
        en: "Let her name each fear, then lock down what can be prepared now.",
      },
    },
    homeworkTemplate: {
      type: "birth_fear_exposure",
      title: {
        zh: "分娩准备与暴露练习",
        en: "Birth prep and exposure task",
      },
      prompt: {
        zh: "列出最担心的 3 个分娩场景，并写出每个场景的准备动作。",
        en: "List the 3 most feared labor scenarios and one preparation action for each.",
      },
      helper: {
        zh: "准备动作要具体到人和时间。",
        en: "Make each preparation action specific to a person and a time.",
      },
    },
  },
];

