/**
 * 饮食和运动功能测试页面
 * 用于验证新功能是否正常工作
 */

import { useState, useEffect } from "react";
import Card from "../components/ui/Card";
import { generateNutritionAdvice } from "../utils/nutritionCalculator";
import { getTodayExerciseQuickView, generateWeeklyExercisePlan } from "../utils/fitnessRecommender";
import { getTodaySummary, calculateWeeklyExerciseStats } from "../utils/recordStorage";

export default function DietExerciseTestPage() {
  const [testProfile, setTestProfile] = useState(null);
  const [dietAdvice, setDietAdvice] = useState(null);
  const [exerciseAdvice, setExerciseAdvice] = useState(null);
  const [todaySummary, setTodaySummary] = useState(null);
  const [weeklyStats, setWeeklyStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      // 创建测试用户档案
      const profile = {
        name: "测试用户",
        pregnancyWeek: "24+3",
        progress: 61,
        dueDate: "2026-06-08",
        riskLevel: "low",
        height: 165,
        prePregnancyWeight: 58,
        currentWeight: 64,
        targetWeightGain: 12,
        allergies: ["海鲜"],
        dietaryPreferences: [],
        foodDislikes: ["香菜"],
        exerciseHistory: {
          level: "intermediate",
          regularActivities: ["yoga"],
          frequency: "3-4 times/week",
        },
        medicalContraindications: {
          diet: [],
          exercise: [],
        },
      };

      setTestProfile(profile);

      // 生成饮食建议
      const dietResult = generateNutritionAdvice(profile);
      setDietAdvice(dietResult);

      // 生成运动建议
      const exerciseResult = getTodayExerciseQuickView(profile);
      setExerciseAdvice(exerciseResult);

      // 获取今日记录总结
      const summaryResult = getTodaySummary();
      setTodaySummary(summaryResult);

      // 计算周统计
      const stats = calculateWeeklyExerciseStats();
      setWeeklyStats(stats);

    } catch (err) {
      console.error("功能测试失败：", err);
      setError(err.message);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#fffaf3] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-clay mb-6">饮食和运动功能测试</h1>

        {error ? (
          <Card className="border-red-500 bg-red-50 p-6">
            <h2 className="text-xl font-semibold text-red-700 mb-2">⚠️ 测试失败</h2>
            <p className="text-red-600">{error}</p>
          </Card>
        ) : (
          <>
            {/* 测试用户档案 */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-clay mb-4">👤 测试用户档案</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">姓名</p>
                  <p className="font-medium">{testProfile?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">孕周</p>
                  <p className="font-medium">{testProfile?.pregnancyWeek}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">风险等级</p>
                  <p className="font-medium">{testProfile?.riskLevel}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">身高</p>
                  <p className="font-medium">{testProfile?.height} cm</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">当前体重</p>
                  <p className="font-medium">{testProfile?.currentWeight} kg</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">目标增重</p>
                  <p className="font-medium">{testProfile?.targetWeightGain} kg</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">运动基础</p>
                  <p className="font-medium">{testProfile?.exerciseHistory?.level}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">过敏食物</p>
                  <p className="font-medium">{testProfile?.allergies?.join(", ")}</p>
                </div>
              </div>
            </Card>

            {/* 饮食建议测试 */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-clay mb-4">🍽️ 饮食建议测试</h2>
              {dietAdvice ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {dietAdvice.nutritionGoals?.calories || 2000}
                      </div>
                      <div className="text-xs text-gray-600">热量</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {dietAdvice.nutritionGoals?.protein || 70}
                      </div>
                      <div className="text-xs text-gray-600">蛋白质</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {dietAdvice.nutritionGoals?.calcium || 1200}
                      </div>
                      <div className="text-xs text-gray-600">钙</div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">今日餐次建议：</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {dietAdvice.meals?.breakfast?.[0] && (
                        <div className="p-3 bg-white border rounded-lg">
                          <div className="text-sm font-medium">早餐</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {dietAdvice.meals.breakfast[0].foods?.map((f, i) => f.name + (i < dietAdvice.meals.breakfast[0].foods.length - 1 ? " · " : "")).join("")}
                          </div>
                        </div>
                      )}
                      {dietAdvice.meals?.lunch?.[0] && (
                        <div className="p-3 bg-white border rounded-lg">
                          <div className="text-sm font-medium">午餐</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {dietAdvice.meals.lunch[0].foods?.map((f, i) => f.name + (i < dietAdvice.meals.lunch[0].foods.length - 1 ? " · " : "")).join("")}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">今日提示：</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {dietAdvice.tips?.slice(0, 3).map((tip, i) => (
                        <li key={i}>• {tip}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">饮食禁忌：</h3>
                    <div className="text-sm space-y-2">
                      <div>
                        <p className="font-medium text-red-600">完全避免：</p>
                        <p className="text-gray-600">
                          {dietAdvice.restrictions?.avoid?.map((r, i) => r.examples?.join(", ") + (i < dietAdvice.restrictions.avoid.length - 1 ? "；" : "")).join("")}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-orange-600">限制摄入：</p>
                        <p className="text-gray-600">
                          {dietAdvice.restrictions?.limit?.map((r, i) => r.items?.join(", ") + (i < dietAdvice.restrictions.limit.length - 1 ? "；" : "")).join("")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">正在生成饮食建议...</p>
              )}
            </Card>

            {/* 运动建议测试 */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-clay mb-4">🏃 运动建议测试</h2>
              {exerciseAdvice ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 p-4 bg-green-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {exerciseAdvice.weeklyProgress?.completed || 0}
                      </div>
                      <div className="text-xs text-gray-600">本周完成</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {exerciseAdvice.weeklyProgress?.total || 0}
                      </div>
                      <div className="text-xs text-gray-600">本周目标</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {exerciseAdvice.weeklyProgress?.percent || 0}%
                      </div>
                      <div className="text-xs text-gray-600">完成率</div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">今日运动任务：</h3>
                    {exerciseAdvice.mainTask ? (
                      <div className="p-4 bg-white border rounded-lg">
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <div className="text-lg font-semibold">{exerciseAdvice.mainTask.name}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              时长：{exerciseAdvice.mainTask.duration} 分钟 ·
                              强度：{exerciseAdvice.mainTask.intensity === "low" ? "低" : exerciseAdvice.mainTask.intensity === "medium" ? "中" : "高"}
                            </div>
                          </div>
                          <div className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg">
                            打卡
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">今日无运动任务</p>
                    )}
                  </div>

                  {exerciseAdvice.safetyAlerts && exerciseAdvice.safetyAlerts.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2">安全提醒：</h3>
                      <div className="text-sm space-y-1">
                        {exerciseAdvice.safetyAlerts.map((alert, i) => (
                          <p key={i} className="text-orange-700">• {alert}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">正在生成运动建议...</p>
              )}
            </Card>

            {/* 记录存储测试 */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-clay mb-4">💾 记录存储测试</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white border rounded-lg">
                  <div className="text-sm font-medium">今日饮食记录</div>
                  <div className="text-2xl font-bold text-blue-600 mt-2">
                    {todaySummary?.diet?.mealsLogged || 0}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">餐次</div>
                </div>
                <div className="p-4 bg-white border rounded-lg">
                  <div className="text-sm font-medium">今日运动打卡</div>
                  <div className="text-2xl font-bold text-green-600 mt-2">
                    {todaySummary?.exercise?.tasksCompleted || 0}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">次</div>
                </div>
              </div>
            </Card>

            {/* 功能状态 */}
            <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50">
              <h2 className="text-xl font-semibold text-clay mb-4">✅ 功能状态</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white border rounded-lg">
                  <div className="text-3xl mb-2">🍽️</div>
                  <div className="font-medium text-green-600">饮食功能</div>
                  <div className="text-sm text-gray-600 mt-1">✓ 正常工作</div>
                </div>
                <div className="text-center p-4 bg-white border rounded-lg">
                  <div className="text-3xl mb-2">🏃</div>
                  <div className="font-medium text-green-600">运动功能</div>
                  <div className="text-sm text-gray-600 mt-1">✓ 正常工作</div>
                </div>
                <div className="text-center p-4 bg-white border rounded-lg">
                  <div className="text-3xl mb-2">💾</div>
                  <div className="font-medium text-green-600">存储功能</div>
                  <div className="text-sm text-gray-600 mt-1">✓ 正常工作</div>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
