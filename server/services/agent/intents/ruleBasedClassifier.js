import { INTENT_ID, getIntentConfig } from "./taxonomy.js";

const RULE_KEYWORDS = {
  [INTENT_ID.EMOTIONAL_SUPPORT]: [
    "焦虑",
    "压力",
    "难受",
    "崩溃",
    "烦",
    "心慌",
    "担心",
    "anxious",
    "anxiety",
    "stress",
    "overwhelmed",
    "panic",
  ],
  [INTENT_ID.DIETARY_ADVICE]: [
    "饮食",
    "吃什么",
    "能不能吃",
    "营养",
    "补充",
    "diet",
    "nutrition",
    "food",
    "meal",
  ],
  [INTENT_ID.EXERCISE_ADVICE]: [
    "运动",
    "锻炼",
    "跑步",
    "瑜伽",
    "拉伸",
    "exercise",
    "workout",
    "training",
    "steps",
  ],
  [INTENT_ID.SLEEP_ADVICE]: [
    "睡眠",
    "失眠",
    "睡不好",
    "夜醒",
    "入睡",
    "sleep",
    "insomnia",
    "wake up",
  ],
  [INTENT_ID.APP_FEATURE_EXPLANATION]: [
    "功能",
    "介绍",
    "简介",
    "边界",
    "能做什么",
    "助手",
    "ai",
    "怎么用",
    "如何用",
    "在哪里",
    "在哪",
    "页面",
    "设置",
    "打卡",
    "记录",
    "入口",
    "app",
    "feature",
    "settings",
    "how to use",
  ],
  [INTENT_ID.CONTENT_RECOMMENDATION]: [
    "推荐",
    "内容",
    "文章",
    "课程",
    "看什么",
    "recommend",
    "content",
    "article",
    "course",
  ],
  [INTENT_ID.DAILY_COMPANIONSHIP]: [
    "你好",
    "在吗",
    "聊聊",
    "陪我",
    "晚安",
    "早安",
    "hello",
    "hi",
    "chat",
    "talk",
    "you there",
  ],
};

const QUESTION_HINTS = ["怎么办", "怎么", "如何", "what should i do", "how", "?"];

function includesAny(text, keywords) {
  return keywords.some((keyword) => text.includes(String(keyword).toLowerCase()));
}

function scoreByKeywords(text, keywords) {
  let score = 0;
  for (const keyword of keywords) {
    if (text.includes(String(keyword).toLowerCase())) {
      score += keyword.length >= 4 ? 1.2 : 1;
    }
  }
  return score;
}

function computeConfidence(topScore, secondScore, primaryIntent, secondaryCount) {
  if (primaryIntent === INTENT_ID.UNRECOGNIZED_AMBIGUOUS) return 0.38;
  const delta = Math.max(0, topScore - secondScore);
  const base = 0.52 + Math.min(topScore, 4.5) * 0.08 + Math.min(delta, 3) * 0.06;
  const adjusted = secondaryCount >= 2 ? base - 0.06 : base;
  return Math.max(0.4, Math.min(0.96, Number(adjusted.toFixed(2))));
}

function buildClassification({
  primaryIntent,
  secondaryIntents = [],
  confidence,
  reason,
  scoreBoard,
  needsLlmSecondary,
  needsClarification,
}) {
  const config = getIntentConfig(primaryIntent);
  return {
    primary_intent: primaryIntent,
    secondary_intents: secondaryIntents,
    confidence,
    reason,
    score_board: scoreBoard,
    needs_llm_secondary: Boolean(needsLlmSecondary),
    needs_clarification: Boolean(needsClarification),
    preferred_route: config.preferredRoute,
    mvp_route: config.mvpRoute,
    topic: config.topic,
    requires: {
      kb: config.requiresKb,
      profile: config.requiresProfile,
      safety: config.requiresSafety,
    },
    response_strategy: config.strategySummary,
    l2_sub_intents: config.l2,
    stage: "rule",
  };
}

export function classifyIntentByRules({ message, precheck }) {
  if (precheck?.stopNormalFlow) {
    return buildClassification({
      primaryIntent: INTENT_ID.HIGH_RISK_EXPRESSIONS,
      secondaryIntents: [],
      confidence: 1,
      reason: "Risk override by safety precheck.",
      scoreBoard: {
        [INTENT_ID.HIGH_RISK_EXPRESSIONS]: 100,
      },
      needsLlmSecondary: false,
      needsClarification: false,
    });
  }

  const text = String(message || "").trim().toLowerCase();
  const scoreBoard = {
    [INTENT_ID.EMOTIONAL_SUPPORT]: scoreByKeywords(text, RULE_KEYWORDS[INTENT_ID.EMOTIONAL_SUPPORT]),
    [INTENT_ID.DIETARY_ADVICE]: scoreByKeywords(text, RULE_KEYWORDS[INTENT_ID.DIETARY_ADVICE]),
    [INTENT_ID.EXERCISE_ADVICE]: scoreByKeywords(text, RULE_KEYWORDS[INTENT_ID.EXERCISE_ADVICE]),
    [INTENT_ID.SLEEP_ADVICE]: scoreByKeywords(text, RULE_KEYWORDS[INTENT_ID.SLEEP_ADVICE]),
    [INTENT_ID.APP_FEATURE_EXPLANATION]: scoreByKeywords(text, RULE_KEYWORDS[INTENT_ID.APP_FEATURE_EXPLANATION]),
    [INTENT_ID.CONTENT_RECOMMENDATION]: scoreByKeywords(text, RULE_KEYWORDS[INTENT_ID.CONTENT_RECOMMENDATION]),
    [INTENT_ID.DAILY_COMPANIONSHIP]: scoreByKeywords(text, RULE_KEYWORDS[INTENT_ID.DAILY_COMPANIONSHIP]),
  };

  if (text.length <= 6) {
    scoreBoard[INTENT_ID.DAILY_COMPANIONSHIP] += 0.8;
    scoreBoard[INTENT_ID.UNRECOGNIZED_AMBIGUOUS] = (scoreBoard[INTENT_ID.UNRECOGNIZED_AMBIGUOUS] || 0) + 0.6;
  }
  if (includesAny(text, QUESTION_HINTS) && Object.values(scoreBoard).every((score) => score < 1)) {
    scoreBoard[INTENT_ID.UNRECOGNIZED_AMBIGUOUS] = (scoreBoard[INTENT_ID.UNRECOGNIZED_AMBIGUOUS] || 0) + 1.1;
  }

  const sorted = Object.entries(scoreBoard).sort((a, b) => b[1] - a[1]);
  const [topIntentRaw, topScore] = sorted[0] || [INTENT_ID.UNRECOGNIZED_AMBIGUOUS, 0];
  const [, secondScore = 0] = sorted[1] || [];
  const primaryIntent = topScore > 0 ? topIntentRaw : INTENT_ID.UNRECOGNIZED_AMBIGUOUS;
  const secondaryIntents = sorted
    .slice(1)
    .filter(
      ([intent, score]) =>
        intent !== INTENT_ID.UNRECOGNIZED_AMBIGUOUS &&
        score >= 1 &&
        topScore - score <= 1.2
    )
    .map(([intent]) => intent)
    .slice(0, 3);
  const confidence = computeConfidence(topScore, secondScore, primaryIntent, secondaryIntents.length);

  const needsLlmSecondary =
    primaryIntent === INTENT_ID.UNRECOGNIZED_AMBIGUOUS ||
    confidence < 0.65 ||
    (secondaryIntents.length > 0 && topScore - secondScore < 0.35);

  const needsClarification =
    primaryIntent === INTENT_ID.UNRECOGNIZED_AMBIGUOUS ||
    confidence < 0.6 ||
    secondaryIntents.length >= 2;

  const reason =
    primaryIntent === INTENT_ID.UNRECOGNIZED_AMBIGUOUS
      ? "Insufficient or ambiguous intent cues in rule pass."
      : `Rule pass matched primary intent "${primaryIntent}" with score ${topScore.toFixed(2)}.`;

  return buildClassification({
    primaryIntent,
    secondaryIntents,
    confidence,
    reason,
    scoreBoard,
    needsLlmSecondary,
    needsClarification,
  });
}
