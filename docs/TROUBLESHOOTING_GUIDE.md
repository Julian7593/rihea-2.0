# 饮食和运动功能 - 集成问题解决指南

## 🔍 可能的问题原因

### 1. 浏览器缓存问题（最可能）
**症状**：在浏览器中看不到新的饮食和运动卡片
**原因**：浏览器缓存了旧版本的JavaScript文件

**解决方案**：
1. 硬刷新页面：`Ctrl + Shift + R`（Windows）或 `Cmd + Shift + R`（Mac）
2. 或者清除浏览器缓存：
   - Chrome: F12 → Application → Clear storage → Clear site data
   - Firefox: 设置 → 隐私与安全 → 清除网站数据
3. 重启浏览器

### 2. 用户档案字段缺失
**症状**：提示错误或建议不生成
**原因**：mock数据中的某些字段可能不完整

**检查方法**：
1. 打开浏览器控制台（F12）
2. 查看是否有关于height、weight、allergies等字段的错误
3. 确认profile对象包含所有必要字段

**临时解决方案**：
- 如果有错误，可以清除localStorage中的profile数据
- 在浏览器控制台运行：`localStorage.clear()`

### 3. 开发服务器未重启
**症状**：代码更改未生效
**原因**：修改代码后开发服务器没有自动重启

**解决方案**：
1. 停止当前的开发服务器：`Ctrl + C`
2. 重新启动：`npm run dev`
3. 等待编译完成

### 4. 组件路径错误
**症状**：编译错误，找不到模块
**原因**：文件路径或导入路径不正确

**检查方法**：
1. 确认以下文件存在且路径正确：
   - `src/components/nutrition/DietAdviceCard.jsx`
   - `src/components/nutrition/MealRecordModal.jsx`
   - `src/components/fitness/ExerciseAdviceCard.jsx`
   - `src/components/fitness/ExerciseCheckinModal.jsx`
   - `src/utils/nutritionCalculator.js`
   - `src/utils/fitnessRecommender.js`
   - `src/utils/recordStorage.js`
   - `src/utils/dangerSignalDetector.js`

2. 确认所有import语句路径正确（相对路径使用`../`）

### 5. API契约未更新
**症状**：API调用失败
**原因**：`src/api/contracts.js`中可能缺少nutrition和fitness模块

**解决方案**：
- 确认`contracts.js`文件中包含nutrition和fitness模块
- 如果没有，手动添加（已完成）

## 🔧 分步解决步骤

### 步骤1：清除缓存并重启
1. 在浏览器中按`Ctrl + Shift + R`强制刷新
2. 等待页面完全加载
3. 查看首页是否有新的卡片

### 步骤2：检查控制台错误
1. 按`F12`打开开发者工具
2. 查看Console标签页
3. 查找红色的错误信息

### 步骤3：验证数据结构
1. 在浏览器控制台运行：
   ```javascript
   console.log(localStorage.getItem('rihea_profile_v1'));
   ```
2. 检查输出的JSON是否包含以下字段：
   - `height: 165`
   - `prePregnancyWeight: 58`
   - `currentWeight: 64`
   - `targetWeightGain: 12`
   - `allergies: []`
   - `exerciseHistory: { level: "intermediate", ... }`

### 步骤4：测试单个功能
1. 测试饮食建议生成：
   ```javascript
   // 在控制台运行
   const profile = JSON.parse(localStorage.getItem('rihea_profile_v1'));
   // 然后在控制台运行：
   console.log(generateNutritionAdvice(profile));
   ```

2. 测试运动建议生成：
   ```javascript
   // 在控制台运行
   const profile = JSON.parse(localStorage.getItem('rihea_profile_v1'));
   // 然后在控制台运行：
   console.log(getTodayExerciseQuickView(profile));
   ```

3. 测试危险信号检测：
   ```javascript
   // 在控制台运行
   console.log(detectAllDangerSignals([], []));
   ```

## 🚨 常见错误信息及解决

### 错误1：`Module not found: Can't resolve '../nutrition/DietAdviceCard'`
**原因**：组件文件路径错误
**解决**：
- 检查文件是否存在于正确位置
- 确认文件名大小写正确
- 重新启动开发服务器

### 错误2：`Uncaught ReferenceError: getTodayExerciseQuickView is not defined`
**原因**：函数导入失败
**解决**：
- 检查`src/utils/fitnessRecommender.js`文件
- 确认函数确实被export
- 清除浏览器缓存并刷新

### 错误3：`Cannot read properties of undefined (reading 'height')`
**原因**：profile对象缺少某些字段
**解决**：
- 清除localStorage：`localStorage.clear()`
- 刷新页面重新初始化数据

### 错误4：`dietAdvice is null`或`exerciseAdvice is null`
**原因**：建议生成函数执行失败
**解决**：
- 检查控制台详细错误信息
- 确认profile数据完整
- 检查相关依赖函数是否正确导入

## 🎯 预期行为

### 正常工作时应该看到：
1. **首页新增两个卡片**：
   - 🍽️ 今日饮食建议卡片（显示营养目标、餐次建议）
   - 🏃 今日运动任务卡片（显示本周进度、今日任务）

2. **点击记录/打卡按钮时**：
   - 饮食记录弹窗打开
   - 运动打卡弹窗打开

3. **记录后**：
   - 进度条实时更新
   - Toast提示记录成功

4. **有危险信号时**：
   - 记录弹窗显示红色警告
   - 提示用户注意身体状态

## 📞 需要帮助？

如果以上步骤都无法解决问题，请提供以下信息：

1. **浏览器控制台错误信息**：
   - 按F12打开控制台
   - 复制所有红色的错误信息

2. **具体症状**：
   - 能否看到其他卡片（情绪、胎动等）？
   - 整个页面是否正常加载？
   - 是否有任何部分显示异常？

3. **操作系统和浏览器**：
   - 操作系统版本
   - 浏览器名称和版本

4. **截图**：
   - 如果可能的话，提供问题界面的截图

## 🔧 快速修复命令

### 清除所有数据重新开始：
```javascript
// 在浏览器控制台运行
localStorage.clear();
location.reload();
```

### 仅清除profile数据：
```javascript
// 在浏览器控制台运行
localStorage.removeItem('rihea_profile_v1');
location.reload();
```

## 📊 验证清单

使用以下清单验证功能是否正常：

- [ ] 首页能看到两个新卡片（饮食建议+运动任务）
- [ ] 点击"记录"按钮能打开弹窗
- [ ] 饮食记录后能看到成功提示
- [ ] 运动打卡后能看到成功提示
- [ ] 进度条会根据记录实时更新
- [ ] 浏览器控制台没有红色错误
- [ ] 刷新页面后新功能依然存在

---

**下一步**：按照上述步骤逐一排查问题，如果仍有疑问，请提供详细的错误信息。
