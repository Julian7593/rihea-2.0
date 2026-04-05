/**
 * 饮食记录弹窗组件
 * 用于快速记录每日饮食，并支持拍照识别后确认保存
 */

import React, { useMemo, useRef, useState } from "react";
import Card from "../ui/Card";
import { analyzeMealPhoto } from "../../api/nutrition";
import { estimateRecognizedFoodNutrition } from "../../utils/nutritionCalculator";

const ANALYSIS_STATUS = {
  IDLE: "idle",
  UPLOADING: "uploading",
  ANALYZING: "analyzing",
  NEEDS_CONFIRMATION: "needs_confirmation",
  CONFIRMED: "confirmed",
  FAILED: "failed",
};

const COMMON_FOODS = [
  { foodId: "egg", name: "鸡蛋", calories: 70 },
  { foodId: "milk", name: "牛奶", calories: 125 },
  { foodId: "whole_wheat_bread", name: "全麦面包", calories: 75 },
  { foodId: "chicken_breast", name: "鸡胸肉", calories: 165 },
  { foodId: "brown_rice", name: "糙米饭", calories: 111 },
  { foodId: "broccoli", name: "西兰花", calories: 34 },
  { foodId: "apple", name: "苹果", calories: 95 },
  { foodId: "tofu", name: "豆腐", calories: 76 },
  { foodId: "fish_salmon", name: "三文鱼", calories: 208 },
  { foodId: "yogurt", name: "酸奶", calories: 90 },
];

function toSelectedFood(food, overrides = {}) {
  return {
    id: overrides.id || food.foodId || food.id || food.name,
    foodId: food.foodId || null,
    name: overrides.name || food.name,
    calories: Number(food.calories || 0),
    count: Number(food.count || 1),
    confidence: Number.isFinite(Number(food.confidence)) ? Number(food.confidence) : null,
    source: overrides.source || food.source || "manual",
    sourceLabel: food.sourceLabel || food.name,
  };
}

function confidenceLabel(confidence) {
  if (!Number.isFinite(confidence)) return "请确认";
  if (confidence >= 0.85) return "较高";
  if (confidence >= 0.7) return "中等";
  return "需确认";
}

export default function MealRecordModal({ isOpen, onClose, onSave, mealType, existingRecord, profile }) {
  const [selectedMealType, setSelectedMealType] = useState(existingRecord?.mealType || mealType || "snack");
  const [selectedFoods, setSelectedFoods] = useState(
    (existingRecord?.foods || []).map((food) => toSelectedFood(food, { source: food.source || "manual" }))
  );
  const [note, setNote] = useState(existingRecord?.note || "");
  const [analysisStatus, setAnalysisStatus] = useState(ANALYSIS_STATUS.IDLE);
  const [analysisFeedback, setAnalysisFeedback] = useState("");
  const [photoFileName, setPhotoFileName] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  const mealTypes = {
    breakfast: "早餐",
    lunch: "午餐",
    dinner: "晚餐",
    snack: "加餐",
  };

  const totalCalories = useMemo(
    () => selectedFoods.reduce((sum, food) => sum + (food.calories || 0) * (food.count || 1), 0),
    [selectedFoods]
  );

  if (!isOpen) return null;

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const addFood = (food) => {
    setSelectedFoods((current) => [...current, toSelectedFood(food)]);
  };

  const removeFood = (index) => {
    setSelectedFoods((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPhotoFileName(file.name);
    setAnalysisFeedback("");
    setAnalysisResult(null);
    setAnalysisStatus(ANALYSIS_STATUS.UPLOADING);

    try {
      setAnalysisStatus(ANALYSIS_STATUS.ANALYZING);
      const result = await analyzeMealPhoto(file, {
        mealType: selectedMealType,
        pregnancyWeek: profile?.pregnancyWeek,
        allergies: profile?.allergies || [],
        medicalContraindications: profile?.medicalContraindications || { diet: [] },
        riskLevel: profile?.riskLevel,
      });

      const detectedFoods = Array.isArray(result?.detectedFoods) ? result.detectedFoods : [];
      if (detectedFoods.length === 0) {
        setAnalysisStatus(ANALYSIS_STATUS.FAILED);
        setAnalysisFeedback(result?.errorMessage || "图片里未识别到明确食物");
        return;
      }

      const nextSelectedFoods = detectedFoods.map((food) =>
        toSelectedFood(
          {
            ...food,
            calories: food.foodId
              ? COMMON_FOODS.find((item) => item.foodId === food.foodId)?.calories || 0
              : 0,
          },
          { source: "photo_ai" }
        )
      );

      setSelectedFoods(nextSelectedFoods);
      setAnalysisResult(result);
      setAnalysisStatus(
        result?.needsUserConfirmation ? ANALYSIS_STATUS.NEEDS_CONFIRMATION : ANALYSIS_STATUS.CONFIRMED
      );
      setAnalysisFeedback(
        result?.needsUserConfirmation
          ? "识别完成，请确认后再保存。"
          : "识别完成，可直接保存。"
      );
    } catch (error) {
      setAnalysisStatus(ANALYSIS_STATUS.FAILED);
      setAnalysisFeedback(error?.message || "识别失败，请重拍或手动添加");
    } finally {
      event.target.value = "";
    }
  };

  const handleSave = () => {
    setIsSaving(true);

    const estimatedNutrition = estimateRecognizedFoodNutrition(selectedFoods);
    const totalCaloriesFromSelection = selectedFoods.reduce(
      (sum, food) => sum + (food.calories || 0) * (food.count || 1),
      0
    );

    const normalizedFoods = selectedFoods.map((food) => ({
      id: food.id,
      foodId: food.foodId || food.id,
      name: food.name,
      sourceLabel: food.sourceLabel || food.name,
      count: Number(food.count || 1),
      confidence: food.confidence,
      source: food.source,
    }));

    onSave({
      mealType: selectedMealType,
      foods: normalizedFoods,
      nutrition: {
        ...estimatedNutrition,
        calories: estimatedNutrition.calories || totalCaloriesFromSelection,
      },
      note,
      timestamp: new Date().toISOString(),
      source: analysisResult ? "photo_ai" : "manual",
      recognizedFoods: analysisResult?.detectedFoods || [],
      photoAnalysisSummary: analysisResult
        ? {
            status: analysisStatus,
            fileName: photoFileName,
            pregnancyAdvice: analysisResult.pregnancyAdvice,
          }
        : null,
      userConfirmed: Boolean(analysisResult),
    });

    setIsSaving(false);
    onClose();
  };

  const renderAdviceList = (title, items, tone) => {
    if (!items || items.length === 0) return null;

    return (
      <div className={`rounded-xl border p-3 ${tone}`}>
        <div className="mb-2 text-sm font-semibold">{title}</div>
        <div className="space-y-2 text-sm">
          {items.map((item, index) => (
            <div key={`${title}-${index}`}>{item}</div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(46,29,17,0.48)] p-4 backdrop-blur-[6px]">
      <Card className="max-h-[85vh] w-full max-w-2xl overflow-y-auto border border-[#e8d8c8] bg-[#fffaf4] shadow-[0_28px_80px_rgba(88,61,43,0.24)]">
        <div className="p-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />

          <div className="mb-6 flex items-start justify-between gap-4 border-b border-[#efe1d3] pb-5">
            <div>
              <div className="mb-2 inline-flex items-center rounded-full bg-[#f4e7da] px-3 py-1 text-xs font-semibold tracking-[0.18em] text-[#9b6a4b]">
                MEAL CHECK-IN
              </div>
              <h2 className="text-xl font-semibold text-[#4f3425]">记录{mealTypes[selectedMealType]}</h2>
              <p className="mt-1 text-sm text-[#7d6557]">支持拍照识别后确认，也可继续手动补充。</p>
            </div>
            <button
              onClick={onClose}
              className="grid h-10 w-10 place-items-center rounded-full border border-[#ead9cb] bg-white text-2xl text-[#8b6a59] transition hover:bg-[#f8efe7] hover:text-[#5d4031]"
              aria-label="关闭"
            >
              ×
            </button>
          </div>

          <div className="mb-6">
            <div className="mb-2 text-sm font-medium text-[#7d6557]">当前餐次</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Object.entries(mealTypes).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedMealType(key)}
                  className={`rounded-2xl border px-3 py-2.5 text-sm font-medium transition ${
                    selectedMealType === key
                      ? "border-[#cb7b51] bg-[#f7e3d3] text-[#8f4f2e] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
                      : "border-[#ead9cb] bg-white text-[#7d6557] hover:bg-[#fbf4ee]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6 rounded-[28px] border border-[#d8bda9] bg-[#f2dcc6] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_18px_30px_rgba(139,93,61,0.12)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-[#72452f]">拍照识别餐食</div>
                <div className="mt-1 text-sm leading-6 text-[#875d45]">
                  识别后会给出孕期友好提醒，你可以删除误识别项后再保存。
                </div>
                {photoFileName ? (
                  <div className="mt-2 inline-flex items-center rounded-full bg-[rgba(255,255,255,0.72)] px-3 py-1 text-xs font-medium text-[#7d5d4b]">
                    最近识别图片：{photoFileName}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={openFilePicker}
                className="rounded-full border border-[#aa5f3d] bg-[#bf6d46] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(149,88,54,0.28)] transition hover:-translate-y-0.5 hover:bg-[#b1613c]"
              >
                {analysisStatus === ANALYSIS_STATUS.ANALYZING ? "识别中..." : "上传照片"}
              </button>
            </div>
            {analysisFeedback ? (
              <div
                className={`mt-4 rounded-2xl border px-4 py-3 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ${
                  analysisStatus === ANALYSIS_STATUS.FAILED
                    ? "border-[#f0c2be] bg-[#fff1ef] text-[#b55249]"
                    : "border-[#d9c8b8] bg-[rgba(255,250,245,0.96)] text-[#7d5a46]"
                }`}
              >
                {analysisFeedback}
              </div>
            ) : null}
          </div>

          {analysisResult ? (
            <div className="mb-6 space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                {renderAdviceList("推荐补充", analysisResult.pregnancyAdvice?.safe, "border-emerald-100 bg-emerald-50 text-emerald-900")}
                {renderAdviceList("需要注意", analysisResult.pregnancyAdvice?.caution, "border-amber-100 bg-amber-50 text-amber-900")}
              </div>
              {renderAdviceList("避免或替换", analysisResult.pregnancyAdvice?.avoid, "border-rose-100 bg-rose-50 text-rose-900")}
              {analysisResult.pregnancyAdvice?.nutrientHighlights?.length > 0 ? (
                <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                  <div className="mb-2 text-sm font-semibold text-sky-900">营养亮点</div>
                  <div className="space-y-2 text-sm leading-6 text-sky-900">
                    {analysisResult.pregnancyAdvice.nutrientHighlights.map((item) => (
                      <div key={item.nutrient}>
                        <span className="font-semibold">{item.label}</span>
                        {" · "}
                        {item.foods.join("、")}
                        {" · "}
                        {item.reason}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {renderAdviceList("本次建议", analysisResult.pregnancyAdvice?.actions, "border-indigo-100 bg-indigo-50 text-indigo-900")}
              <div className="text-xs text-gray-500">{analysisResult.disclaimer}</div>
            </div>
          ) : null}

          <div className="mb-6">
            <h3 className="mb-3 text-sm font-medium text-[#7d6557]">快捷补充食物</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {COMMON_FOODS.map((food) => (
                <button
                  key={food.foodId}
                  type="button"
                  onClick={() => addFood(food)}
                  className="rounded-2xl border border-[#ead9cb] bg-white p-3 text-left transition hover:-translate-y-0.5 hover:bg-[#fdf7f2] hover:shadow-[0_8px_20px_rgba(123,90,67,0.08)]"
                >
                  <div className="font-medium text-[#4f3425]">{food.name}</div>
                  <div className="text-xs text-[#8b7364]">{food.calories} kcal</div>
                </button>
              ))}
            </div>
          </div>

          {selectedFoods.length > 0 ? (
            <div className="mb-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-[#7d6557]">待确认食物</h3>
                {analysisResult ? (
                  <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                    请确认后保存
                  </span>
                ) : null}
              </div>
              <div className="space-y-2">
                {selectedFoods.map((food, index) => (
                  <div
                    key={`${food.id}-${index}`}
                    className="rounded-2xl border border-[#ead9cb] bg-[#fffdfb] p-3 shadow-[0_10px_20px_rgba(123,90,67,0.06)]"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-medium text-[#4f3425]">{food.name}</div>
                          {food.source === "photo_ai" ? (
                            <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              AI识别
                            </span>
                          ) : null}
                          {food.confidence !== null ? (
                            <span className="rounded-full border border-[#efe1d3] bg-white px-2 py-0.5 text-xs text-[#7d6557]">
                              置信度 {confidenceLabel(food.confidence)}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 text-sm text-[#8b7364]">
                          {(food.calories || 0) * (food.count || 1)} kcal
                          {food.sourceLabel && food.sourceLabel !== food.name ? ` · 原始识别：${food.sourceLabel}` : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={food.count || 1}
                          onChange={(event) => {
                            const nextCount = Math.max(1, Math.min(10, parseInt(event.target.value, 10) || 1));
                            setSelectedFoods((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? {
                                      ...item,
                                      count: nextCount,
                                    }
                                  : item
                              )
                            );
                          }}
                          className="w-16 rounded-xl border border-[#ddcbbb] bg-white px-2 py-1 text-center text-[#4f3425]"
                        />
                        <button
                          type="button"
                          onClick={() => removeFood(index)}
                          className="rounded-full bg-[#fff1ef] px-3 py-1 text-sm text-red-500 transition hover:bg-[#ffe4df] hover:text-red-700"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#4f3425]">估算总热量</span>
                  <span className="text-lg font-bold text-blue-600">{totalCalories} kcal</span>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-[#7d6557]">备注（可选）</label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="记录用餐感受或补充说明..."
              className="w-full resize-none rounded-2xl border border-[#ead9cb] bg-white px-4 py-3 text-[#4f3425] placeholder:text-[#b49b8c]"
              rows={3}
              maxLength={160}
            />
            <div className="mt-1 text-right text-xs text-[#b49b8c]">{note.length}/160</div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-[#ead9cb] bg-white px-4 py-3 font-medium text-[#7d6557] transition hover:bg-[#fbf4ee]"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={selectedFoods.length === 0 || isSaving}
              className="flex-1 rounded-2xl border border-[#aa5f3d] bg-[#bf6d46] px-4 py-3 font-semibold text-white shadow-[0_12px_26px_rgba(149,88,54,0.24)] transition hover:bg-[#b1613c] disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-300 disabled:shadow-none"
            >
              {analysisResult ? "确认并保存" : "保存"}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
