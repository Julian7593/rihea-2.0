const BOUNDARY_PATTERNS = [
  /我已[经]?确诊/i,
  /你(已经)?患有/i,
  /明确诊断/i,
  /i diagnose/i,
  /definitive diagnosis/i,
];

const GUARANTEE_PATTERNS = [/100%/i, /保证治愈/i, /一定会治好/i, /guaranteed cure/i];

function splitSentences(text = "") {
  return String(text || "")
    .split(/(?<=[。！？!?\.])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function hasPattern(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function fallbackAnswer(lang) {
  if (lang === "en") {
    return "I can provide supportive guidance, but I cannot diagnose conditions or guarantee treatment outcomes. If risk is rising, please seek in-person professional support.";
  }
  return "我可以提供支持性建议，但不能做医学诊断或保证疗效。如果风险在上升，请尽快寻求线下专业支持。";
}

function rewriteWithSafeSentences(text, lang) {
  const safeSentences = splitSentences(text).filter(
    (sentence) => !hasPattern(sentence, BOUNDARY_PATTERNS) && !hasPattern(sentence, GUARANTEE_PATTERNS)
  );
  if (safeSentences.length > 0) {
    return safeSentences.join(lang === "en" ? " " : "");
  }
  return fallbackAnswer(lang);
}

function safeDisclaimer(lang, originalDisclaimer) {
  const base =
    lang === "en"
      ? "This assistant is for educational and supportive use only and does not replace licensed medical or mental health professionals."
      : "本助手仅用于健康教育与支持，不替代执业医生或心理专业人士。";
  if (!originalDisclaimer) return base;
  if (String(originalDisclaimer).includes(base)) return originalDisclaimer;
  return `${originalDisclaimer} ${base}`.trim();
}

export function runSafetyPostcheck({ answer, disclaimer, lang = "zh" }) {
  const text = String(answer || "").trim();
  if (!text) {
    return {
      answer: fallbackAnswer(lang),
      disclaimer: safeDisclaimer(lang, disclaimer),
      flags: ["empty_answer_rewritten"],
      rewritten: true,
    };
  }

  const hasBoundaryViolation = hasPattern(text, BOUNDARY_PATTERNS);
  const hasGuaranteeViolation = hasPattern(text, GUARANTEE_PATTERNS);
  if (!hasBoundaryViolation && !hasGuaranteeViolation) {
    return {
      answer: text,
      disclaimer: safeDisclaimer(lang, disclaimer),
      flags: [],
      rewritten: false,
    };
  }

  const flags = [];
  if (hasBoundaryViolation) flags.push("boundary_violation");
  if (hasGuaranteeViolation) flags.push("guarantee_violation");
  const rewrittenAnswer = rewriteWithSafeSentences(text, lang);

  return {
    answer: rewrittenAnswer,
    disclaimer: safeDisclaimer(lang, disclaimer),
    flags,
    rewritten: true,
  };
}
