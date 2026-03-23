/**
 * 饮食记录弹窗组件
 * 用于快速记录每日饮食
 */

import { useState } from "react";
import Card from "../ui/Card";

export default function MealRecordModal({ isOpen, onClose, onSave, mealType, existingRecord }) {
  const [selectedFoods, setSelectedFoods] = useState(existingRecord?.foods || []);
  const [note, setNote] = useState(existingRecord?.note || "");

  if (!isOpen) return null;

  const mealTypes = {
    breakfast: "早餐",
    lunch: "午餐",
    dinner: "晚餐",
    snack: "加餐",
  };

  // 常用食物预设
  const commonFoods = [
    { id: "egg", name: "鸡蛋", calories: 70 },
    { id: "milk", name: "牛奶", calories: 125 },
    { id: "bread", name: "全麦面包", calories: 75 },
    { id: "chicken", name: "鸡胸肉", calories: 165 },
    { id: "rice", name: "糙米", calories: 111 },
    { id: "vegetable", name: "蔬菜", calories: 25 },
    { id: "fruit", name: "水果", calories: 80 },
    { id: "tofu", name: "豆腐", calories: 76 },
    { id: "fish", name: "鱼肉", calories: 130 },
    { id: "yogurt", name: "酸奶", calories: 90 },
  ];

  const addFood = (food) => {
    setSelectedFoods([...selectedFoods, { ...food, count: 1 }]);
  };

  const removeFood = (index) => {
    const newFoods = selectedFoods.filter((_, i) => i !== index);
    setSelectedFoods(newFoods);
  };

  const handleSave = () => {
    const totalCalories = selectedFoods.reduce((sum, f) => sum + (f.calories || 0) * (f.count || 1), 0);

    onSave({
      mealType,
      foods: selectedFoods,
      nutrition: {
        calories: totalCalories,
      },
      note,
      timestamp: new Date().toISOString(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">记录{mealTypes[mealType]}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {/* 常用食物 */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-600 mb-3">选择食物</h3>
            <div className="grid grid-cols-2 gap-2">
              {commonFoods.map((food) => (
                <button
                  key={food.id}
                  onClick={() => addFood(food)}
                  className="p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium">{food.name}</div>
                  <div className="text-xs text-gray-500">{food.calories} kcal</div>
                </button>
              ))}
            </div>
          </div>

          {/* 已选食物 */}
          {selectedFoods.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-600 mb-3">已选食物</h3>
              <div className="space-y-2">
                {selectedFoods.map((food, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{food.name}</div>
                      <div className="text-sm text-gray-500">{food.calories * (food.count || 1)} kcal</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={food.count || 1}
                        onChange={(e) => {
                          const newFoods = [...selectedFoods];
                          newFoods[index].count = parseInt(e.target.value) || 1;
                          setSelectedFoods(newFoods);
                        }}
                        className="w-16 px-2 py-1 border rounded text-center"
                      />
                      <button
                        onClick={() => removeFood(index)}
                        className="text-red-500 hover:text-red-700 px-2"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 总热量 */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">总热量</span>
                  <span className="text-lg font-bold text-blue-600">
                    {selectedFoods.reduce((sum, f) => sum + (f.calories || 0) * (f.count || 1), 0)} kcal
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 备注 */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-600 mb-2 block">备注（可选）</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="记录用餐感受或其他信息..."
              className="w-full px-3 py-2 border rounded-lg resize-none"
              rows={2}
              maxLength={100}
            />
            <div className="text-right text-xs text-gray-400 mt-1">
              {note.length}/100
            </div>
          </div>

          {/* 保存按钮 */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={selectedFoods.length === 0}
              className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              保存
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
