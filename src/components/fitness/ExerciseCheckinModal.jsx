/**
 * 运动打卡弹窗组件
 * 用于记录每日运动完成情况
 */

import { useState } from "react";
import Card from "../ui/Card";

export default function ExerciseCheckinModal({ isOpen, onClose, onSave, task, existingRecord }) {
  const [duration, setDuration] = useState(existingRecord?.duration || task?.duration || 0);
  const [feeling, setFeeling] = useState(existingRecord?.feeling || 3);
  const [discomfortLevel, setDiscomfortLevel] = useState(existingRecord?.discomfortLevel || 0);
  const [discomfortSymptoms, setDiscomfortSymptoms] = useState(existingRecord?.discomfortSymptoms || []);
  const [customSymptom, setCustomSymptom] = useState("");
  const [showDangerAlert, setShowDangerAlert] = useState(false);

  if (!isOpen) return null;

  const commonSymptoms = [
    "疲劳",
    "轻微气短",
    "轻微出汗",
    "腰酸",
    "腿酸",
  ];

  const dangerSymptoms = [
    "出血",
    "腹痛",
    "头晕",
    "胸痛",
    "严重呼吸困难",
    "胎动明显减少",
  ];

  const addSymptom = (symptom) => {
    if (!discomfortSymptoms.includes(symptom)) {
      setDiscomfortSymptoms([...discomfortSymptoms, symptom]);
    }
  };

  const removeSymptom = (symptom) => {
    setDiscomfortSymptoms(discomfortSymptoms.filter((s) => s !== symptom));
  };

  const addCustomSymptom = () => {
    if (customSymptom.trim() && !discomfortSymptoms.includes(customSymptom.trim())) {
      setDiscomfortSymptoms([...discomfortSymptoms, customSymptom.trim()]);
      setCustomSymptom("");
    }
  };

  const handleSave = () => {
    // 检查是否有危险症状
    const hasDangerSymptom = discomfortSymptoms.some((symptom) =>
      dangerSymptoms.some((danger) => symptom.includes(danger))
    );

    const record = {
      exerciseId: task?.id,
      exerciseType: task?.type,
      exerciseName: task?.name,
      duration: parseInt(duration),
      intensity: task?.intensity,
      feeling: parseInt(feeling),
      discomfortLevel: parseInt(discomfortLevel),
      discomfortSymptoms,
      calories: task?.estimatedCalories
        ? Math.round((parseInt(duration) / task.duration) * task.estimatedCalories)
        : 0,
      completedAt: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      timestamp: new Date().toISOString(),
    };

    if (hasDangerSymptom) {
      setShowDangerAlert(true);
    }

    onSave(record, hasDangerSymptom);
    onClose();
  };

  if (showDangerAlert) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="max-w-md w-full">
          <div className="p-6 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-red-600 mb-2">重要提醒</h2>
            <p className="text-gray-600 mb-6">
              您记录了需要关注的不适症状。建议您立即停止运动，
              休息观察。如症状持续或加重，请及时联系医生或就医。
            </p>
            <div className="mb-4 p-4 bg-red-50 rounded-lg text-left">
              <p className="font-medium text-red-700 mb-2">记录的症状：</p>
              <ul className="text-sm text-red-600 space-y-1">
                {discomfortSymptoms
                  .filter((s) => dangerSymptoms.some((d) => s.includes(d)))
                  .map((symptom, i) => (
                    <li key={i}>• {symptom}</li>
                  ))}
              </ul>
            </div>
            <button
              onClick={() => setShowDangerAlert(false)}
              className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              我已了解
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">运动打卡</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {/* 运动信息 */}
          {task && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="font-medium text-lg">{task.name}</div>
              <div className="text-sm text-gray-600 mt-1">
                {task.type} · {task.intensity === "low" ? "低强度" : task.intensity === "medium" ? "中等强度" : "高强度"}
              </div>
              <div className="text-sm text-gray-600">
                建议时长：{task.duration} 分钟
              </div>
            </div>
          )}

          {/* 运动时长 */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-600 mb-2 block">实际运动时长（分钟）</label>
            <input
              type="number"
              min="0"
              max="180"
              value={duration}
              onChange={(e) => setDuration(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="0"
            />
          </div>

          {/* 身体感受 */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-600 mb-2 block">运动后感受</label>
            <div className="flex justify-between">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => setFeeling(level)}
                  className={`flex-1 py-3 px-2 text-center border rounded-lg transition-colors ${
                    feeling === level ? "bg-blue-500 text-white border-blue-500" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="text-2xl mb-1">
                    {level === 1 ? "😢" : level === 2 ? "😐" : level === 3 ? "🙂" : level === 4 ? "😊" : "😄"}
                  </div>
                  <div className="text-xs">
                    {level === 1 ? "很累" : level === 2 ? "有点累" : level === 3 ? "一般" : level === 4 ? "舒适" : "很好"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 不适程度 */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-600 mb-2 block">不适程度</label>
            <div className="flex justify-between">
              {[0, 1, 2, 3, 4].map((level) => (
                <button
                  key={level}
                  onClick={() => setDiscomfortLevel(level)}
                  className={`flex-1 py-3 px-2 text-center border rounded-lg transition-colors ${
                    discomfortLevel === level ? "bg-orange-500 text-white border-orange-500" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="text-lg mb-1">
                    {level === 0 ? "😊" : level === 1 ? "🙂" : level === 2 ? "😐" : level === 3 ? "😟" : "😰"}
                  </div>
                  <div className="text-xs">
                    {level === 0 ? "无" : level === 1 ? "轻微" : level === 2 ? "中等" : level === 3 ? "明显" : "严重"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 不适症状 */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-600 mb-2 block">不适症状（可选）</label>

            {/* 常见症状 */}
            <div className="flex flex-wrap gap-2 mb-3">
              {commonSymptoms.map((symptom) => (
                <button
                  key={symptom}
                  onClick={() => addSymptom(symptom)}
                  className={`px-3 py-1.5 text-sm border rounded-full transition-colors ${
                    discomfortSymptoms.includes(symptom)
                      ? "bg-orange-100 border-orange-500 text-orange-700"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {symptom}
                </button>
              ))}
            </div>

            {/* 已选症状 */}
            {discomfortSymptoms.length > 0 && (
              <div className="mb-3 p-3 bg-orange-50 rounded-lg">
                <div className="text-sm text-orange-700 mb-2">已记录的症状：</div>
                <div className="flex flex-wrap gap-2">
                  {discomfortSymptoms.map((symptom) => (
                    <span
                      key={symptom}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-orange-200 rounded-full text-sm"
                    >
                      {symptom}
                      <button
                        onClick={() => removeSymptom(symptom)}
                        className="text-orange-500 hover:text-orange-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 自定义症状 */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customSymptom}
                onChange={(e) => setCustomSymptom(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addCustomSymptom()}
                placeholder="添加其他不适症状..."
                className="flex-1 px-3 py-2 border rounded-lg"
              />
              <button
                onClick={addCustomSymptom}
                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                添加
              </button>
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
              disabled={duration === 0}
              className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              完成打卡
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
