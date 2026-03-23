/**
 * 基础知识库
 * 孕期饮食和运动相关的知识文章
 */

export const KNOWLEDGE_CATEGORIES = {
  NUTRITION: "nutrition",      // 饮食营养
  EXERCISE: "exercise",        // 运动健身
  SYMPTOMS: "symptoms",        // 症状缓解
  SAFETY: "safety",            // 安全指南
};

export const ARTICLE_TYPES = {
  GUIDE: "guide",              // 指南
  FAQ: "faq",                  // 常见问题
  TIPS: "tips",                // 小贴士
  WARNING: "warning",           // 警告
};

/**
 * 饮食营养文章
 */
const nutritionArticles = [
  {
    id: "nutr-first-trimester",
    category: KNOWLEDGE_CATEGORIES.NUTRITION,
    type: ARTICLE_TYPES.GUIDE,
    title: "孕早期营养指南（1-12周）",
    summary: "孕早期是胚胎发育的关键期，需要特别注意营养补充和缓解孕吐。",
    content: `孕早期营养重点：

1. 叶酸补充
   - 每日补充400-800微克叶酸
   - 有助于预防神经管缺陷
   - 推荐食物：菠菜、西兰花、豆类、强化谷物

2. 缓解孕吐
   - 少食多餐，每日5-6餐
   - 晨起先吃几块饼干
   - 选择清淡、易消化的食物
   - 姜茶有助于缓解恶心

3. 蛋白质摄入
   - 每日55-70克优质蛋白
   - 推荐食物：鸡蛋、瘦肉、鱼类、豆制品

4. 补充维生素B6
   - 有助于缓解孕吐
   - 推荐食物：香蕉、鸡肉、土豆、鳄梨

注意事项：
- 如果严重孕吐导致无法进食，请及时就医
- 避免生食、未消毒奶制品、高汞鱼类
- 保持充足的水分摄入`,
    weekRange: [1, 12],
    readingTime: "5分钟",
    tags: ["营养", "孕早期", "叶酸"],
    isImportant: true,
  },
  {
    id: "nutr-second-trimester",
    category: KNOWLEDGE_CATEGORIES.NUTRITION,
    type: ARTICLE_TYPES.GUIDE,
    title: "孕中期营养指南（13-27周）",
    summary: "孕中期胎儿快速发育，营养需求增加，需要特别关注蛋白质和钙的摄入。",
    content: `孕中期营养重点：

1. 蛋白质需求增加
   - 每日65-85克蛋白质
   - 支持胎儿器官发育
   - 推荐食物：瘦肉、鱼类、鸡蛋、豆制品

2. 钙质补充
   - 每日1000-1300毫克钙
   - 促进胎儿骨骼和牙齿发育
   - 推荐食物：牛奶、酸奶、奶酪、豆腐、绿叶蔬菜

3. 铁质补充
   - 每日27毫克铁
   - 预防孕期贫血
   - 推荐食物：红肉、菠菜、豆类、强化谷物
   - 搭配维生素C丰富的食物促进吸收

4. 控制体重增长
   - 正常BMI孕妇每周增重0.4-0.5公斤
   - 超重孕妇每周增重0.2-0.3公斤
   - 避免过量摄入糖分和油脂

注意事项：
- 继续补充叶酸
- 控制咖啡因摄入（每日<200mg）
- 避免生食和高汞鱼类`,
    weekRange: [13, 27],
    readingTime: "5分钟",
    tags: ["营养", "孕中期", "蛋白质", "钙"],
    isImportant: true,
  },
  {
    id: "nutr-third-trimester",
    category: KNOWLEDGE_CATEGORIES.NUTRITION,
    type: ARTICLE_TYPES.GUIDE,
    title: "孕晚期营养指南（28-40周）",
    summary: "孕晚期胎儿生长最快，需要充足的能量和营养，同时要注意控制体重。",
    content: `孕晚期营养重点：

1. 适当增加热量
   - 每日2250-2500千卡
   - 支持胎儿快速生长
   - 注意不要过量增重

2. 膳食纤维
   - 每日25-35克膳食纤维
   - 预防孕期便秘
   - 推荐食物：全谷物、蔬菜、水果、豆类

3. Omega-3脂肪酸
   - 每日200-300毫克
   - 促进胎儿大脑发育
   - 推荐食物：深海鱼、核桃、亚麻籽、奇亚籽

4. 维生素D
   - 每日600-1000 IU
   - 促进钙吸收和骨骼发育
   - 适当晒太阳，补充富含VD的食物

注意事项：
- 避免过量增重
- 少食多餐，避免胃灼热
- 继续补充铁和钙
- 为分娩储备能量`,
    weekRange: [28, 40],
    readingTime: "5分钟",
    tags: ["营养", "孕晚期", "Omega-3"],
    isImportant: true,
  },
  {
    id: "nutr-foods-to-avoid",
    category: KNOWLEDGE_CATEGORIES.NUTRITION,
    type: ARTICLE_TYPES.WARNING,
    title: "孕期应避免的食物",
    summary: "为了宝宝的健康，孕期需要避免一些可能带来风险的食物。",
    content: `孕期应完全避免的食物：

1. 生食和未煮熟的食物
   - 生鱼片、生蚝等海鲜
   - 溏心蛋
   - 未煮熟的肉类
   原因：可能含有寄生虫或细菌

2. 未消毒的奶制品
   - 软质奶酪（布里、卡门培尔）
   - 生牛奶
   原因：可能含有李斯特菌

3. 高汞鱼类
   - 鲨鱼、旗鱼、大规格金枪鱼
   原因：汞可能影响胎儿神经系统

4. 过量咖啡因
   - 每日咖啡因<200毫克
   - 约1-2杯咖啡或2-3杯茶
   原因：增加流产或低出生体重风险

5. 酒精
   - 完全禁酒
   原因：酒精对胎儿发育有害

6. 过量糖和盐
   - 控制甜食和加工食品
   原因：增加妊娠糖尿病和高血压风险`,
    weekRange: [1, 42],
    readingTime: "4分钟",
    tags: ["营养", "安全", "禁忌"],
    isImportant: true,
  },
  {
    id: "nutr-symptom-relief",
    category: KNOWLEDGE_CATEGORIES.NUTRITION,
    type: ARTICLE_TYPES.TIPS,
    title: "通过饮食缓解孕期不适",
    summary: "正确的饮食可以帮助缓解孕吐、水肿、便秘等常见孕期症状。",
    content: `饮食缓解孕期不适：

缓解孕吐：
- 生姜：姜茶、生姜饼干
- 维生素B6：香蕉、鸡肉、土豆
- 少食多餐，避免空腹
- 清淡饮食，避免油腻

缓解水肿：
- 低盐饮食，每日<2300mg钠
- 富含钾的食物：香蕉、菠菜、土豆
- 多喝水，促进代谢
- 避免久站

缓解便秘：
- 高纤维食物：燕麦、全麦、蔬菜、水果
- 充足水分：每日8杯以上
- 益生菌：酸奶、发酵食品
- 适量运动促进肠道蠕动

缓解胃灼热：
- 小口慢饮，避免一次喝太多
- 避免平躺，饭后保持直立
- 避免辛辣、油腻食物
- 睡前2-3小时不进食`,
    weekRange: [1, 42],
    readingTime: "4分钟",
    tags: ["营养", "症状", "缓解"],
  },
];

/**
 * 运动健身文章
 */
const exerciseArticles = [
  {
    id: "exer-first-trimester",
    category: KNOWLEDGE_CATEGORIES.EXERCISE,
    type: ARTICLE_TYPES.GUIDE,
    title: "孕早期运动指南（1-12周）",
    summary: "孕早期需要温和运动，避免高强度和可能对腹部造成压力的活动。",
    content: `孕早期运动建议：

推荐运动：
1. 散步
   - 每日20-30分钟
   - 保持轻松的步伐
   - 穿舒适的运动鞋

2. 瑜伽（温和版）
   - 选择专门的孕妇瑜伽
   - 避免倒立和过度扭转
   - 注意呼吸和放松

3. 拉伸运动
   - 每日10-15分钟
   - 重点在颈部、肩部、背部
   - 动作缓慢温和

注意事项：
- 避免高强度运动
- 如有出血或腹痛，立即停止
- 严重孕吐时可暂停运动
- 保持充足的水分摄入
- 避免在炎热环境下运动`,
    weekRange: [1, 12],
    readingTime: "4分钟",
    tags: ["运动", "孕早期", "安全"],
    isImportant: true,
  },
  {
    id: "exer-second-trimester",
    category: KNOWLEDGE_CATEGORIES.EXERCISE,
    type: ARTICLE_TYPES.GUIDE,
    title: "孕中期运动指南（13-27周）",
    summary: "孕中期是运动的黄金期，可以适当增加运动强度，但要注意安全。",
    content: `孕中期运动建议：

推荐运动：
1. 散步
   - 每日30-40分钟
   - 可以适当增加速度
   - 注意监测心率

2. 游泳
   - 每周2-3次，每次30分钟
   - 选择蛙泳或自由泳
   - 水温控制在26-28℃

3. 孕妇瑜伽
   - 每周2-3次，每次30分钟
   - 适合孕中期的体式
   - 增强核心和柔韧性

4. 普拉提（改良版）
   - 每周1-2次，每次25分钟
   - 适合孕中期的动作
   - 注意避免平躺位

注意事项：
- 运动时可以正常对话的强度
- 孕24周后避免平躺仰卧位
- 监测心率，保持在安全范围
- 如有不适立即停止
- 注意保持水分`,
    weekRange: [13, 27],
    readingTime: "5分钟",
    tags: ["运动", "孕中期", "瑜伽"],
    isImportant: true,
  },
  {
    id: "exer-third-trimester",
    category: KNOWLEDGE_CATEGORIES.EXERCISE,
    type: ARTICLE_TYPES.GUIDE,
    title: "孕晚期运动指南（28-40周）",
    summary: "孕晚期需要降低运动强度，重点在呼吸训练和为分娩做准备。",
    content: `孕晚期运动建议：

推荐运动：
1. 散步
   - 每日20-30分钟
   - 保持轻松的步伐
   - 避免不平路面

2. 呼吸训练
   - 每日10-15分钟
   - 学习不同的呼吸节奏
   - 为分娩做准备

3. 盆底肌训练（凯格尔运动）
   - 每日多次
   - 收缩盆底肌5秒，放松10秒
   - 重复10-15次

4. 温和拉伸
   - 每日10-15分钟
   - 侧重背部、腿部和骨盆
   - 避免过度拉伸

注意事项：
- 重心变化，避免容易摔倒的运动
- 避免平躺仰卧位
- 运动时最好有人陪同
- 如有宫缩或胎动异常立即停止
- 为分娩储备体力，不要过度疲劳`,
    weekRange: [28, 40],
    readingTime: "5分钟",
    tags: ["运动", "孕晚期", "呼吸"],
    isImportant: true,
  },
  {
    id: "exer-danger-signals",
    category: KNOWLEDGE_CATEGORIES.SAFETY,
    type: ARTICLE_TYPES.WARNING,
    title: "运动时需要立即停止的危险信号",
    summary: "了解运动时哪些信号意味着需要立即停止并寻求医疗帮助。",
    content: `运动时必须立即停止的信号：

紧急信号（立即就医）：
1. 阴道出血
   - 立即停止运动
   - 立即就医

2. 持续性腹痛
   - 立即停止运动
   - 立即就医

3. 胸痛
   - 立即停止运动
   - 立即就医

4. 规律宫缩
   - 立即停止运动
   - 立即就医（可能早产）

5. 阴道流出液体
   - 立即停止运动
   - 立即就医（可能破水）

高危信号（停止并观察）：
1. 头晕或昏厥
   - 立即停止运动，坐下休息
   - 如不缓解就医

2. 严重呼吸困难
   - 立即停止运动，坐下休息
   - 如不缓解就医

3. 胎动明显减少
   - 停止运动，监测胎动
   - 如不改善就医

4. 严重头痛
   - 停止运动，监测血压
   - 必要时就医

5. 视力模糊或出现光斑
   - 停止运动，监测血压
   - 必要时就医`,
    weekRange: [1, 42],
    readingTime: "4分钟",
    tags: ["运动", "安全", "危险信号"],
    isImportant: true,
  },
  {
    id: "exer-kegel",
    category: KNOWLEDGE_CATEGORIES.EXERCISE,
    type: ARTICLE_TYPES.TIPS,
    title: "凯格尔运动：孕期必备的训练",
    summary: "凯格尔运动可以增强盆底肌，预防产后漏尿，促进分娩。",
    content: `凯格尔运动指南：

什么是凯格尔运动？
- 锻炼盆底肌的运动
- 盆底肌位于骨盆底部，支撑膀胱、子宫和直肠

如何找到盆底肌？
- 尿尿时尝试停止尿流（不要经常这样做）
- 使用的肌肉就是盆底肌

运动方法：
1. 收缩盆底肌
   - 保持5秒钟
   - 想象在憋尿或憋气

2. 放松盆底肌
   - 保持10秒钟
   - 完全放松

3. 重复
   - 每组10-15次
   - 每日做3-4组

注意事项：
- 不要收缩腹部、大腿或臀部
- 排空膀胱后再做
- 坚持练习，效果会逐渐显现
- 可以在任何时间、任何地点做
- 分娩后继续练习，有助于恢复

孕期能做吗？
- 可以，而且非常推荐
- 有助于预防产后漏尿
- 促进分娩，减少撕裂
- 改善性生活`,
    weekRange: [1, 42],
    readingTime: "4分钟",
    tags: ["运动", "凯格尔", "盆底肌"],
  },
];

/**
 * 安全指南文章
 */
const safetyArticles = [
  {
    id: "safety-general",
    category: KNOWLEDGE_CATEGORIES.SAFETY,
    type: ARTICLE_TYPES.GUIDE,
    title: "孕期运动安全指南",
    summary: "孕期运动安全的基本原则和注意事项。",
    content: `孕期运动安全原则：

运动前：
1. 咨询医生
   - 获得医生的运动许可
   - 了解需要避免的运动类型

2. 穿着装备
   - 宽松透气的服装
   - 舒适的运动鞋
   - 必要时佩戴支撑带

运动中：
1. 监测心率
   - 保持可以正常对话的强度
   - 避免过度喘气
   - 孕期最大心率约为140-150次/分

2. 补充水分
   - 运动前后都要喝水
   - 每15-20分钟喝几口水
   - 避免脱水

3. 倾听身体
   - 如有不适立即停止
   - 不要强迫自己
   - 注意胎动变化

运动后：
1. 适当休息
   - 不要立即躺下
   - 缓慢降温
   - 拉伸放松

2. 记录感受
   - 记录运动时长和强度
   - 记录身体感受
   - 根据感受调整下期运动

应避免的运动：
- 接触性运动（篮球、足球）
- 高冲击运动（跑步、跳跃）
- 需要平衡的运动（滑雪、骑马）
- 仰卧位运动（孕24周后）
- 热瑜伽等高温运动`,
    weekRange: [1, 42],
    readingTime: "5分钟",
    tags: ["安全", "运动", "指南"],
    isImportant: true,
  },
];

// 合并所有文章
export const knowledgeBase = {
  ...nutritionArticles,
  ...exerciseArticles,
  ...safetyArticles,
};

/**
 * 根据孕周获取推荐文章
 */
export function getRecommendedArticles(pregnancyWeek) {
  const weekNum = parseInt(pregnancyWeek?.split("+")[0]) || 1;
  const trimester = weekNum <= 12 ? "first" : weekNum <= 27 ? "second" : "third";

  // 按孕周筛选
  const weekArticles = Object.values(knowledgeBase).filter(article => {
    return weekNum >= article.weekRange[0] && weekNum <= article.weekRange[1];
  });

  // 优先返回重要文章
  const importantArticles = weekArticles.filter(a => a.isImportant);

  return {
    trimester,
    articles: importantArticles.length > 0 ? importantArticles : weekArticles.slice(0, 5),
  };
}

/**
 * 根据分类获取文章
 */
export function getArticlesByCategory(category) {
  return Object.values(knowledgeBase).filter(article => article.category === category);
}

/**
 * 搜索文章
 */
export function searchArticles(keyword) {
  const lowerKeyword = keyword.toLowerCase();
  return Object.values(knowledgeBase).filter(article => {
    return (
      article.title.toLowerCase().includes(lowerKeyword) ||
      article.summary.toLowerCase().includes(lowerKeyword) ||
      article.tags.some(tag => tag.toLowerCase().includes(lowerKeyword))
    );
  });
}

/**
 * 获取分类统计
 */
export function getCategoryStats() {
  return {
    [KNOWLEDGE_CATEGORIES.NUTRITION]: nutritionArticles.length,
    [KNOWLEDGE_CATEGORIES.EXERCISE]: exerciseArticles.length,
    [KNOWLEDGE_CATEGORIES.SYMPTOMS]: 0,
    [KNOWLEDGE_CATEGORIES.SAFETY]: safetyArticles.length,
  };
}
