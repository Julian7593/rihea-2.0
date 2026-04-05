import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MealRecordModal from "../../src/components/nutrition/MealRecordModal.jsx";

vi.mock("../../src/api/nutrition", () => ({
  analyzeMealPhoto: vi.fn(async () => ({
    detectedFoods: [
      { id: "milk", foodId: "milk", name: "牛奶", sourceLabel: "牛奶", confidence: 0.93, category: "dairy" },
      { id: "spinach", foodId: "spinach", name: "菠菜", sourceLabel: "菠菜", confidence: 0.78, category: "vegetables" },
    ],
    pregnancyAdvice: {
      safe: ["牛奶可帮助补充钙。"],
      caution: [],
      avoid: [],
      nutrientHighlights: [
        { nutrient: "calcium", label: "钙", foods: ["牛奶"], reason: "有助于支持骨骼健康与钙摄入。" },
      ],
      actions: ["这餐蛋白质来源偏少，可补充鸡蛋、豆腐、酸奶或熟肉类。"],
      disclaimer: "拍照识别结果仅用于孕期饮食记录与科普提醒，不能替代医生或营养师建议。",
    },
    needsUserConfirmation: true,
    disclaimer: "拍照识别结果仅用于孕期饮食记录与科普提醒，不能替代医生或营养师建议。",
  })),
}));

vi.mock("../../src/components/ui/Card.jsx", () => ({
  default: ({ children, className = "" }) => <div className={className}>{children}</div>,
}));

describe("MealRecordModal", () => {
  it("supports photo analysis and saves confirmed foods", async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();

    const { container } = render(
      <MealRecordModal
        isOpen
        onClose={onClose}
        onSave={onSave}
        mealType="breakfast"
        profile={{
          pregnancyWeek: "24+3",
          allergies: [],
          medicalContraindications: { diet: [] },
        }}
      />
    );

    const fileInput = container.querySelector('input[type="file"]');
    const file = new File(["fake-image"], "milk-spinach.jpg", { type: "image/jpeg" });

    fireEvent.change(fileInput, {
      target: {
        files: [file],
      },
    });

    await screen.findByText("牛奶");
    expect(screen.getByText("请确认后保存")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "确认并保存" }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
    });

    expect(onSave.mock.calls[0][0].source).toBe("photo_ai");
    expect(onSave.mock.calls[0][0].recognizedFoods).toHaveLength(2);
  });
});
