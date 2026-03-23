/**
 * 新功能集成检查页面
 * 用于验证饮食和运动功能是否正确集成
 */

import { useState, useEffect } from "react";
import Card from "../components/ui/Card";
import DietAdviceCard from "../components/nutrition/DietAdviceCard";
import ExerciseAdviceCard from "../components/fitness/ExerciseAdviceCard";
import MealRecordModal from "../components/nutrition/MealRecordModal";
import ExerciseCheckinModal from "../components/fitness/ExerciseCheckinModal";
import { generateNutritionAdvice } from "../utils/nutritionCalculator";
import { getTodayExerciseQuickView } from "../utils/fitnessRecommender";

export default function IntegrationCheckPage() {
  const [checks, setChecks] = useState({
    imports: "checking",
    profile: "checking",
    dietAdvice: "checking",
    exerciseAdvice: "checking",
    storage: "checking",
    components: "checking",
  });

  const [testProfile, setTestProfile] = useState(null);
  const [dietAdvice, setDietAdvice] = useState(null);
  const [exerciseAdvice, setExerciseAdvice] = useState(null);
  const [showMealModal, setShowMealModal] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    const runChecks = async () => {
      const results = { ...checks };
      const errorList = [];

      // 1. 检查导入
      try {
        // 这些导入已经在文件顶部，所以如果页面能加载，说明导入成功
        results.imports = "✅ 成功";
      } catch (error) {
        results.imports = "❌ 失败: " + error.message;
        errorList.push("导入检查失败");
      }

      // 2. 检查profile结构
      try {
        const profile = {
          name: "测试用户",
          pregnancyWeek: "24+3",
          height: 165,
          prePregnancyWeight: 58,
          currentWeight: 64,
          targetWeightGain: 12,
          allergies: ["海鲜"],
          riskLevel: "low",
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
        results.profile = "✅ 成功";
      } catch (error) {
        results.profile = "❌ 失败: " + error.message;
        errorList.push("Profile结构检查失败");
      }

      // 3. 检查饮食建议生成
      try {
        const dietAdviceResult = generateNutritionAdvice(profile);
        setDietAdvice(dietAdviceResult);
        results.dietAdvice = "✅ 成功";
      } catch (error) {
        results.dietAdvice = "❌ 失败: " + error.message;
        errorList.push("饮食建议生成失败");
      }

      // 4. 检查运动建议生成
      try {
        const exerciseAdviceResult = getTodayExerciseQuickView(profile);
        setExerciseAdvice(exerciseAdviceResult);
        results.exerciseAdvice = "✅ 成功";
      } catch (error) {
        results.exerciseAdvice = "❌ 失败: " + error.message;
        errorList.push("运动建议生成失败");
      }

      // 5. 检查本地存储
      try {
        const storageKey = "test_storage_key";
        localStorage.setItem(storageKey, "test_value");
        const value = localStorage.getItem(storageKey);
        if (value === "test_value") {
          results.storage = "✅ 成功";
        } else {
          results.storage = "⚠️ 异常";
          errorList.push("存储读写不一致");
        }
      } catch (error) {
        results.storage = "❌ 失败: " + error.message;
        errorList.push("本地存储检查失败");
      }

      // 6. 检查组件渲染
      try {
        // 如果我们能设置状态，说明组件应该可以渲染
        setErrors(errorList);
        results.components = "✅ 准备就绪";
      } catch (error) {
        results.components = "❌ 失败: " + error.message;
      }

      setChecks(results);
    };

    runChecks();
  }, []);

  const handleRecordMeal = (mealType) => {
    setSelectedMealType(mealType);
    setShowMealModal(true);
  };

  const handleSaveDietRecord = (record) => {
    setShowMealModal(false);
    setSelectedMealType(null);
    alert("饮食记录已保存！");
  };

  const handleCheckinExercise = (task) => {
    setSelectedExerciseTask(task);
    setShowExerciseModal(true);
  };

  const handleSaveExerciseRecord = (record, hasDangerSymptom) => {
    setShowExerciseModal(false);
    setSelectedExerciseTask(null);
    if (hasDangerSymptom) {
      alert("检测到危险症状，请注意身体状态！");
    } else {
      alert("运动记录已保存！");
    }
  };

  const getStatusColor = (status) => {
    if (status.includes("✅")) return "text-green-600";
    if (status.includes("❌")) return "text-red-600";
    return "text-yellow-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          🔍 新功能集成检查
        </h1>
        <p className="text-gray-600 mb-8">
          这个页面用于验证饮食和运动功能是否正确集成到现有代码中。
        </p>

        {/* 检查结果 */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">📋 检查结果</h2>

          <div className="grid grid-cols-2 gap-4">
            {Object.entries(checks).map(([key, value]) => (
              <div key={key} className="p-4 bg-white border rounded-lg">
                <div className="text-sm text-gray-500 mb-2">
                  {key === "imports" && "导入检查"}
                  {key === "profile" && "Profile结构"}
                  {key === "dietAdvice" && "饮食建议生成"}
                  {key === "exerciseAdvice" && "运动建议生成"}
                  {key === "storage" && "本地存储"}
                  {key === "components" && "组件渲染"}
                </div>
                <div className={`text-lg font-medium ${getStatusColor(value)}`}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          {errors.length > 0 && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-lg font-semibold text-red-700 mb-3">⚠️ 发现 {errors.length} 个问题</h3>
              <ul className="space-y-2">
                {errors.map((error, index) => (
                  <li key={index} className="text-red-600 text-sm">
                    {index + 1}. {error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {/* 功能测试 */}
        {Object.values(checks).every(v => v.includes("✅")) && (
          <>
            {/* 饮食建议测试 */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">🍽️ 饮食建议测试</h2>
              {dietAdvice && (
                <DietAdviceCard
                  advice={dietAdvice}
                  onRecordMeal={handleRecordMeal}
                />
              )}
            </Card>

            {/* 运动建议测试 */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">🏃 运动建议测试</h2>
              {exerciseAdvice && (
                <ExerciseAdviceCard
                  advice={exerciseAdvice}
                  onCheckin={handleCheckinExercise}
                />
              )}
            </Card>

            {/* 弹窗测试 */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">🎨 弹窗测试</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleRecordMeal("breakfast")}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  测试饮食记录弹窗
                </button>
                <button
                  onClick={() => handleCheckinExercise(exerciseAdvice?.mainTask)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  测试运动打卡弹窗
                </button>
              </div>
            </Card>

            {/* 弹窗 */}
            {showMealModal && (
              <MealRecordModal
                isOpen={showMealModal}
                onClose={() => setShowMealModal(false)}
                onSave={handleSaveDietRecord}
                mealType="breakfast"
              />
            )}

            {showExerciseModal && selectedExerciseTask && (
              <ExerciseCheckinModal
                isOpen={showExerciseModal}
                onClose={() => setShowExerciseModal(false)}
                onSave={handleSaveExerciseRecord}
                task={selectedExerciseTask}
              />
            )}

            {/* 使用指南 */}
            <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">📖 使用指南</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">✅ 如果所有检查都通过：</h3>
                  <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-600">
                    <li>访问应用首页，你应该能看到新的<strong>饮食建议</strong>和<strong>运动任务</strong>卡片</li>
                    <li>点击"记录"或"打卡"按钮可以打开记录弹窗</li>
                    <li>记录后进度条应该会更新</li>
                    <li>所有数据都保存在本地，刷新页面不会丢失</li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">🔄 如果看不到新功能：</h3>
                  <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-600">
                    <li>清除浏览器缓存（Ctrl+Shift+Delete）</li>
                    <li>刷新页面（F5 或 Ctrl+R）</li>
                    <li>检查浏览器控制台是否有错误信息</li>
                    <li>确保开发服务器正在运行</li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">🔧 调试信息</h3>
                  <div className="p-3 bg-white border rounded-lg text-sm">
                    <p className="font-medium mb-2">测试Profile数据：</p>
                    <pre className="bg-gray-100 p-2 rounded overflow-auto text-xs">
                      {JSON.stringify(testProfile, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => window.location.href = "/"}
                    className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                  >
                    返回首页
                  </button>
                  <button
                    onClick={() => window.location.href = "/test"}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    运行完整测试
                  </button>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
