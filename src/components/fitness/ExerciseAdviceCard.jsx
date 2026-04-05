/**
 * 运动建议卡片组件
 * 在首页展示今日运动建议
 */

import Card from "../ui/Card";
import { useState } from "react";

export default function ExerciseAdviceCard({ advice, onCheckin }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!advice) return null;

  const { pregnancyWeek, todayTasks, weeklyProgress, target, safetyAlerts } = advice;

  const mainTask = todayTasks?.[0];

  const intensityColors = {
    low: "bg-green-500",
    medium: "bg-yellow-500",
    high: "bg-orange-500",
  };

  const intensityLabels = {
    low: "低强度",
    medium: "中等强度",
    high: "高强度",
  };

  return (
    <Card className="p-4 sm:p-5">
      {/* 标题 */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">🏃 今日运动任务</h3>
          <p className="text-sm text-gray-500">孕{pregnancyWeek}周</p>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {showDetails ? "收起" : "查看详情"}
        </button>
      </div>

      {/* 本周进度 */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>本周完成度</span>
          <span className="font-medium">
            {weeklyProgress?.completed || 0}/{weeklyProgress?.total || 0}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${weeklyProgress?.percent || 0}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>累计时长：{weeklyProgress?.duration || 0} 分钟</span>
          <span>消耗：{weeklyProgress?.calories || 0} kcal</span>
        </div>
      </div>

      {/* 今日任务 */}
      {showDetails && todayTasks && todayTasks.length > 0 && (
        <div className="space-y-3 mb-4">
          {todayTasks.map((task, index) => (
            <div
              key={task.id}
              className={`p-3 rounded-lg border-2 transition-all ${
                index === 0
                  ? "bg-gradient-to-r from-blue-50 to-green-50 border-blue-200"
                  : "bg-white border-gray-100"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`px-2 py-0.5 text-white text-xs rounded ${intensityColors[task.intensity]}`}>
                      {intensityLabels[task.intensity]}
                    </div>
                    <div className="text-xs text-gray-500">{task.type}</div>
                  </div>
                  <div className="font-semibold text-gray-800">{task.name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    时长：{task.duration} 分钟 · 预计消耗：{task.estimatedCalories} kcal
                  </div>
                </div>
                <button
                  onClick={() => onCheckin(task)}
                  className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors self-center"
                >
                  打卡
                </button>
              </div>
              {task.instructions && (
                <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                  💡 {task.instructions}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 精简显示 */}
      {!showDetails && mainTask && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg mb-4">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className={`px-2 py-0.5 text-white text-xs rounded ${intensityColors[mainTask.intensity]}`}>
                  {intensityLabels[mainTask.intensity]}
                </div>
                <div className="text-xs text-gray-500">{mainTask.type}</div>
              </div>
              <div className="font-semibold text-gray-800">{mainTask.name}</div>
              <div className="text-sm text-gray-600 mt-1">
                {mainTask.duration} 分钟 · 消耗 {mainTask.estimatedCalories} kcal
              </div>
            </div>
            <button
              onClick={() => onCheckin(mainTask)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors self-center"
            >
              开始打卡
            </button>
          </div>
        </div>
      )}

      {/* 安全提醒 */}
      {safetyAlerts && safetyAlerts.length > 0 && (
        <div className={`p-3 rounded-lg ${showDetails ? "bg-amber-50" : "bg-blue-50"}`}>
          <div className="text-sm font-medium text-amber-800 mb-1">⚠️ 安全提醒</div>
          <div className="text-sm text-amber-700 space-y-1">
            {safetyAlerts.map((alert, i) => (
              <div key={i}>• {alert}</div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
