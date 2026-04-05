import {
  buildFoodPhotoAnalysisFallback,
  buildPregnancyFoodPhotoAdvice,
  normalizeRecognizedFoods,
  getFoodPhotoAnalysisDisclaimer,
} from "../../src/utils/nutritionCalculator.js";

const VALID_MEAL_TYPES = new Set(["breakfast", "lunch", "dinner", "snack"]);

function normalizeMealType(value) {
  return VALID_MEAL_TYPES.has(value) ? value : "snack";
}

function createBadRequestError(message) {
  const error = new Error(message);
  error.code = "BAD_REQUEST";
  error.statusCode = 400;
  return error;
}

function stripDataUrlPrefix(imageBase64 = "") {
  if (typeof imageBase64 !== "string") return "";
  const match = imageBase64.match(/^data:(.+?);base64,(.+)$/);
  return match ? match[2] : imageBase64;
}

function parseMimeType(imageBase64 = "", fallback = "image/jpeg") {
  if (typeof imageBase64 !== "string") return fallback;
  const match = imageBase64.match(/^data:(.+?);base64,/);
  return match?.[1] || fallback;
}

function computeNeedsUserConfirmation(detectedFoods = []) {
  return true;
}

function collectFoodCandidates(value, results = [], depth = 0) {
  if (!value || depth > 5 || results.length >= 24) return results;

  if (Array.isArray(value)) {
    value.forEach((item) => collectFoodCandidates(item, results, depth + 1));
    return results;
  }

  if (typeof value !== "object") return results;

  const label =
    value.food_name ||
    value.foodName ||
    value.display_name ||
    value.displayName ||
    value.label ||
    value.name ||
    "";

  if (typeof label === "string" && label.trim()) {
    const confidence = Number(value.confidence ?? value.score ?? value.probability ?? value.prob ?? value.value);
    results.push({
      id: typeof value.id === "string" ? value.id : undefined,
      sourceLabel: label.trim(),
      confidence: Number.isFinite(confidence) ? confidence : undefined,
      category: typeof value.category === "string" ? value.category : typeof value.food_group === "string" ? value.food_group : undefined,
    });
  }

  Object.values(value).forEach((child) => collectFoodCandidates(child, results, depth + 1));
  return results;
}

function dedupeCandidates(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${String(item?.sourceLabel || "").trim().toLowerCase()}::${item?.category || ""}`;
    if (!item?.sourceLabel || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function createMockPhotoAnalyzer() {
  return {
    async analyze({ fileName, mealType, profile }) {
      return buildFoodPhotoAnalysisFallback({
        fileName,
        mealType,
        profile,
      });
    },
  };
}

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractJsonObject(text = "") {
  if (typeof text !== "string") return null;
  const trimmed = text.trim();
  const direct = safeParseJson(trimmed);
  if (direct && typeof direct === "object") return direct;

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return safeParseJson(trimmed.slice(start, end + 1));
}

function extractMessageText(payload) {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => item?.text || "")
      .join("")
      .trim();
  }
  return "";
}

function createLogMealPhotoAnalyzer(config = {}) {
  const {
    apiKey = "",
    baseUrl = "https://api.logmeal.com",
    timeoutMs = 10000,
  } = config;

  if (!apiKey) {
    return createMockPhotoAnalyzer();
  }

  return {
    async analyze({ imageBase64, fileName, mimeType, mealType, profile }) {
      const buffer = Buffer.from(stripDataUrlPrefix(imageBase64), "base64");
      const formData = new FormData();
      formData.set("image", new Blob([buffer], { type: mimeType || "image/jpeg" }), fileName || "meal-photo.jpg");

      const response = await fetch(`${String(baseUrl).replace(/\/$/, "")}/v2/image/segmentation/complete`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!response.ok) {
        throw new Error(`Food recognition provider failed: ${response.status}`);
      }

      const payload = await response.json().catch(() => ({}));
      const detectedFoods = normalizeRecognizedFoods(dedupeCandidates(collectFoodCandidates(payload)));

      if (detectedFoods.length === 0) {
        return buildFoodPhotoAnalysisFallback({
          fileName,
          mealType,
          profile,
        });
      }

      return {
        detectedFoods,
        pregnancyAdvice: buildPregnancyFoodPhotoAdvice({
          recognizedFoods: detectedFoods,
          profile,
        }),
        needsUserConfirmation: computeNeedsUserConfirmation(detectedFoods),
        disclaimer: getFoodPhotoAnalysisDisclaimer(),
      };
    },
  };
}

function createZhipuPhotoAnalyzer(config = {}) {
  const {
    apiKey = "",
    baseUrl = "https://open.bigmodel.cn/api/paas/v4",
    model = "glm-5v-turbo",
    timeoutMs = 15000,
  } = config;

  if (!apiKey) {
    return createMockPhotoAnalyzer();
  }

  return {
    async analyze({ imageBase64, fileName, mealType, profile }) {
      const prompt = `
你是孕期饮食识别助手。你的任务只有食物识别，不做医疗诊断。
请严格输出 JSON 对象，格式如下：
{
  "detectedFoods": [
    {
      "sourceLabel": "string",
      "confidence": 0.0,
      "category": "protein|dairy|vegetables|fruits|carbs|legumes|nuts|other"
    }
  ]
}

规则：
1. 只保留图中最可能正在食用的食物或饮品。
2. 如果是复合餐，可以输出 1-6 个候选食物。
3. 如果图中不是明确食物，请返回 {"detectedFoods":[] }。
4. 不要输出 markdown，不要输出解释，不要输出代码块。
5. confidence 取值 0 到 1。

上下文：
- 餐次：${mealType}
- 孕周：${profile?.pregnancyWeek || "unknown"}
- 文件名：${fileName || "unknown"}
      `.trim();

      const response = await fetch(`${String(baseUrl).replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.1,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: prompt,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: imageBase64,
                  },
                },
              ],
            },
          ],
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!response.ok) {
        throw new Error(`Zhipu vision request failed: ${response.status}`);
      }

      const payload = await response.json().catch(() => ({}));
      const parsed = extractJsonObject(extractMessageText(payload));
      const rawDetectedFoods = Array.isArray(parsed?.detectedFoods) ? parsed.detectedFoods : [];
      const detectedFoods = normalizeRecognizedFoods(dedupeCandidates(rawDetectedFoods));

      if (detectedFoods.length === 0) {
        return buildFoodPhotoAnalysisFallback({
          fileName,
          mealType,
          profile,
        });
      }

      return {
        detectedFoods,
        pregnancyAdvice: buildPregnancyFoodPhotoAdvice({
          recognizedFoods: detectedFoods,
          profile,
        }),
        needsUserConfirmation: computeNeedsUserConfirmation(detectedFoods),
        disclaimer: getFoodPhotoAnalysisDisclaimer(),
      };
    },
  };
}

export function createNutritionService({
  photoAnalyzer = createMockPhotoAnalyzer(),
} = {}) {
  return {
    async analyzeMealPhoto(payload = {}) {
      if (typeof payload?.imageBase64 !== "string" || !payload.imageBase64.trim()) {
        throw createBadRequestError("识别失败，请重拍或手动添加");
      }

      const mealType = normalizeMealType(payload?.mealType);
      const imageBase64 = payload.imageBase64.trim();
      const mimeType = parseMimeType(imageBase64, payload?.mimeType || "image/jpeg");

      const profile = {
        pregnancyWeek: payload?.pregnancyWeek || "",
        allergies: Array.isArray(payload?.allergies) ? payload.allergies : [],
        medicalContraindications: {
          diet: Array.isArray(payload?.medicalContraindications?.diet) ? payload.medicalContraindications.diet : [],
        },
        riskLevel: payload?.riskLevel || "low",
      };

      try {
        const analysis = await photoAnalyzer.analyze({
          imageBase64,
          fileName: typeof payload?.fileName === "string" ? payload.fileName : "",
          mimeType,
          mealType,
          profile,
        });
        const detectedFoods = normalizeRecognizedFoods(analysis?.detectedFoods || []);

        return {
          detectedFoods,
          pregnancyAdvice:
            analysis?.pregnancyAdvice ||
            buildPregnancyFoodPhotoAdvice({
              recognizedFoods: detectedFoods,
              profile,
            }),
          needsUserConfirmation:
            typeof analysis?.needsUserConfirmation === "boolean"
              ? analysis.needsUserConfirmation
              : computeNeedsUserConfirmation(detectedFoods),
          disclaimer: analysis?.disclaimer || getFoodPhotoAnalysisDisclaimer(),
        };
      } catch (error) {
        if (error?.statusCode) throw error;

        const fallback = buildFoodPhotoAnalysisFallback({
          fileName: typeof payload?.fileName === "string" ? payload.fileName : "",
          mealType,
          profile,
        });

        return {
          ...fallback,
          errorMessage: "识别结果不够确定，请你确认后再记录",
        };
      }
    },
  };
}

export function createNutritionPhotoAnalyzer(config = {}) {
  if (config.provider === "logmeal") {
    return createLogMealPhotoAnalyzer(config);
  }
  if (config.provider === "zhipu") {
    return createZhipuPhotoAnalyzer({
      apiKey: config.zhipuApiKey || config.apiKey,
      baseUrl: config.zhipuBaseUrl || config.baseUrl,
      model: config.zhipuVisionModel || config.model,
      timeoutMs: config.zhipuVisionTimeoutMs || config.timeoutMs,
    });
  }
  return createMockPhotoAnalyzer();
}
