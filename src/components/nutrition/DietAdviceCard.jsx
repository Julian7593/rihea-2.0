/**
 * 饮食建议卡片组件
 * 在首页展示今日饮食建议
 */

import Card from "../ui/Card";
import { useState } from "react";

export default function DietAdviceCard({ advice, onRecordMeal }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!advice) return null;

  const { pregnancyWeek, meals, nutritionGoals, tips } = advice;

  const mealIcons = {
    breakfast: "🌅",
    lunch: "☀️",
    dinner: "🌙",
    snack: "🍎",
  };

  const mealNames = {
    breakfast: "早餐",
    lunch: "午餐",
    dinner: "晚餐",
    snack: "加餐",
  };

  return (
    <Card className="p-4 sm:p-5">
      {/* 标题 */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">🍽️ 今日饮食建议</h3>
          <p className="text-sm text-gray-500">孕{pregnancyWeek}周</p>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {showDetails ? "收起" : "查看详情"}
        </button>
      </div>

      {/* 营养目标进度 */}
      <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
        <div className="text-sm text-gray-600 mb-2">今日营养目标</div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {nutritionGoals?.calories || 2000}
            </div>
            <div className="text-xs text-gray-500">热量</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {nutritionGoals?.protein || 70}
            </div>
            <div className="text-xs text-gray-500">蛋白质</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {nutritionGoals?.calcium || 1200}
            </div>
            <div className="text-xs text-gray-500">钙</div>
          </div>
        </div>
      </div>

      {/* 餐次建议 */}
      {showDetails && (
        <div className="space-y-3 mb-4">
          {Object.entries(meals).map(([mealType, meal]) => {
            if (!meal) return null;

            return (
              <div
                key={mealType}
                className="p-3 bg-white border border-gray-100 rounded-lg hover:border-blue-200 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{mealIcons[mealType]}</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{mealNames[mealType]}</div>
                    {meal.foods && meal.foods.length > 0 && (
                      <div className="text-sm text-gray-600 mt-1">
                        {meal.foods.map((f, i) => (
                          <span key={i}>
                            {f.name}{i < meal.foods.length - 1 ? " · " : ""}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onRecordMeal(mealType)}
                    className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    记录
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 小贴士 */}
      {!showDetails && tips && tips.length > 0 && (
        <div className="p-3 bg-amber-50 rounded-lg">
          <div className="text-sm font-medium text-amber-800 mb-1">💡 今日提示</div>
          <div className="text-sm text-amber-700">{tips[0]}</div>
        </div>
      )}
    </Card>
  );
}
