/**
 * 饮食内容库
 * 包含孕期各阶段的营养建议、食物推荐、禁忌等
 */

// 孕期阶段
export const PREGNANCY_TRIMESTERS = {
  FIRST: "first",      // 孕早期 (1-12周)
  SECOND: "second",    // 孕中期 (13-27周)
  THIRD: "third",      // 孕晚期 (28-40周)
};

// BMI分类
export const BMI_CATEGORIES = {
  UNDERWEIGHT: { min: 0, max: 18.4, label: "偏瘦", weightGainRange: [12.5, 18] },
  NORMAL: { min: 18.5, max: 24.9, label: "正常", weightGainRange: [11.5, 16] },
  OVERWEIGHT: { min: 25, max: 29.9, label: "超重", weightGainRange: [7, 11.5] },
  OBESITY: { min: 30, max: 999, label: "肥胖", weightGainRange: [5, 9] },
};

// 营养素标准（每日推荐摄入量）
export const NUTRITION_STANDARDS = {
  calories: {
    first: { base: 1800, unit: "kcal" },
    second: { base: 2200, unit: "kcal" },
    third: { base: 2250, unit: "kcal" },
  },
  protein: {
    first: { min: 55, max: 70, unit: "g" },
    second: { min: 65, max: 85, unit: "g" },
    third: { min: 70, max: 90, unit: "g" },
  },
  calcium: { min: 1000, max: 1300, unit: "mg" },
  iron: { min: 27, max: 45, unit: "mg" },
  folicAcid: { min: 600, max: 800, unit: "mcg" },
  vitaminD: { min: 600, max: 1000, unit: "IU" },
  omega3: { min: 200, max: 300, unit: "mg" },
  fiber: { min: 25, max: 35, unit: "g" },
};

// 食物类别
export const FOOD_CATEGORIES = {
  PROTEIN: "protein",        // 蛋白质
  CARBOHYDRATES: "carbs",    // 碳水化合物
  VEGETABLES: "vegetables",  // 蔬菜
  FRUITS: "fruits",         // 水果
  DAIRY: "dairy",           // 乳制品
  FATS: "fats",             // 健康脂肪
  LEGUMES: "legumes",       // 豆类
  NUTS_SEEDS: "nuts",       // 坚果种子
};

// 食物库
export const FOOD_DATABASE = {
  // 蛋白质类
  "egg": {
    name: "鸡蛋",
    nameEn: "Egg",
    category: FOOD_CATEGORIES.PROTEIN,
    calories: { unit: "个", value: 70 },
    nutrition: { protein: 6, fat: 5, carbs: 0.6, calcium: 25, iron: 1.2 },
    allergens: ["鸡蛋"],
    pregnancySafe: true,
  },
  "chicken_breast": {
    name: "鸡胸肉",
    nameEn: "Chicken Breast",
    category: FOOD_CATEGORIES.PROTEIN,
    calories: { unit: "100g", value: 165 },
    nutrition: { protein: 31, fat: 3.6, carbs: 0, calcium: 15, iron: 1.5 },
    allergens: [],
    pregnancySafe: true,
    cookingTip: "确保完全煮熟，避免半熟",
  },
  "fish_salmon": {
    name: "三文鱼",
    nameEn: "Salmon",
    category: FOOD_CATEGORIES.PROTEIN,
    calories: { unit: "100g", value: 208 },
    nutrition: { protein: 20, fat: 13, carbs: 0, calcium: 9, iron: 0.3, omega3: 1800 },
    allergens: ["鱼类"],
    pregnancySafe: true,
    cookingTip: "选择深海鱼，避免生食",
  },
  "tofu": {
    name: "豆腐",
    nameEn: "Tofu",
    category: FOOD_CATEGORIES.PROTEIN,
    calories: { unit: "100g", value: 76 },
    nutrition: { protein: 8, fat: 4.8, carbs: 1.9, calcium: 350, iron: 2.7 },
    allergens: ["大豆"],
    pregnancySafe: true,
  },
  "beef_lean": {
    name: "瘦牛肉",
    nameEn: "Lean Beef",
    category: FOOD_CATEGORIES.PROTEIN,
    calories: { unit: "100g", value: 250 },
    nutrition: { protein: 26, fat: 15, carbs: 0, calcium: 19, iron: 3.5 },
    allergens: [],
    pregnancySafe: true,
    cookingTip: "富含铁质，预防贫血",
  },

  // 乳制品
  "milk": {
    name: "牛奶",
    nameEn: "Milk",
    category: FOOD_CATEGORIES.DAIRY,
    calories: { unit: "250ml", value: 125 },
    nutrition: { protein: 8, fat: 4.5, carbs: 12, calcium: 300, iron: 0.1 },
    allergens: ["乳制品"],
    pregnancySafe: true,
  },
  "yogurt": {
    name: "酸奶",
    nameEn: "Yogurt",
    category: FOOD_CATEGORIES.DAIRY,
    calories: { unit: "150g", value: 90 },
    nutrition: { protein: 10, fat: 2.5, carbs: 8, calcium: 180, iron: 0.1 },
    allergens: ["乳制品"],
    pregnancySafe: true,
    tip: "选择低糖、益生菌酸奶",
  },
  "cheese": {
    name: "奶酪",
    nameEn: "Cheese",
    category: FOOD_CATEGORIES.DAIRY,
    calories: { unit: "30g", value: 100 },
    nutrition: { protein: 7, fat: 8, carbs: 0.3, calcium: 200, iron: 0.2 },
    allergens: ["乳制品"],
    pregnancySafe: true,
    cookingTip: "选择巴氏杀菌奶酪，避免软质生食奶酪",
  },

  // 蔬菜类
  "spinach": {
    name: "菠菜",
    nameEn: "Spinach",
    category: FOOD_CATEGORIES.VEGETABLES,
    calories: { unit: "100g", value: 23 },
    nutrition: { protein: 2.9, fat: 0.4, carbs: 3.6, calcium: 99, iron: 2.7, folicAcid: 194 },
    allergens: [],
    pregnancySafe: true,
    tip: "富含叶酸和铁质",
  },
  "broccoli": {
    name: "西兰花",
    nameEn: "Broccoli",
    category: FOOD_CATEGORIES.VEGETABLES,
    calories: { unit: "100g", value: 34 },
    nutrition: { protein: 2.8, fat: 0.4, carbs: 7, calcium: 47, iron: 0.7, folicAcid: 63 },
    allergens: [],
    pregnancySafe: true,
    tip: "维生素C和叶酸含量高",
  },
  "carrot": {
    name: "胡萝卜",
    nameEn: "Carrot",
    category: FOOD_CATEGORIES.VEGETABLES,
    calories: { unit: "100g", value: 41 },
    nutrition: { protein: 0.9, fat: 0.2, carbs: 10, calcium: 33, iron: 0.3 },
    allergens: [],
    pregnancySafe: true,
    tip: "富含β-胡萝卜素",
  },

  // 水果类
  "apple": {
    name: "苹果",
    nameEn: "Apple",
    category: FOOD_CATEGORIES.FRUITS,
    calories: { unit: "1个中等", value: 95 },
    nutrition: { protein: 0.5, fat: 0.3, carbs: 25, calcium: 6, iron: 0.2, fiber: 4.4 },
    allergens: [],
    pregnancySafe: true,
  },
  "banana": {
    name: "香蕉",
    nameEn: "Banana",
    category: FOOD_CATEGORIES.FRUITS,
    calories: { unit: "1根中等", value: 105 },
    nutrition: { protein: 1.3, fat: 0.4, carbs: 27, calcium: 6, iron: 0.3, fiber: 3.1 },
    allergens: [],
    pregnancySafe: true,
    tip: "富含钾，预防孕期抽筋",
  },
  "orange": {
    name: "橙子",
    nameEn: "Orange",
    category: FOOD_CATEGORIES.FRUITS,
    calories: { unit: "1个中等", value: 62 },
    nutrition: { protein: 1.2, fat: 0.2, carbs: 15, calcium: 52, iron: 0.1, fiber: 3.1 },
    allergens: [],
    pregnancySafe: true,
    tip: "富含维生素C",
  },

  // 碳水化合物
  "brown_rice": {
    name: "糙米",
    nameEn: "Brown Rice",
    category: FOOD_CATEGORIES.CARBOHYDRATES,
    calories: { unit: "100g", value: 111 },
    nutrition: { protein: 2.6, fat: 0.9, carbs: 23, calcium: 10, iron: 0.4, fiber: 1.8 },
    allergens: [],
    pregnancySafe: true,
    tip: "低升糖指数，富含B族维生素",
  },
  "whole_wheat_bread": {
    name: "全麦面包",
    nameEn: "Whole Wheat Bread",
    category: FOOD_CATEGORIES.CARBOHYDRATES,
    calories: { unit: "1片", value: 75 },
    nutrition: { protein: 4, fat: 1, carbs: 13, calcium: 28, iron: 0.8, fiber: 2 },
    allergens: ["麸质"],
    pregnancySafe: true,
  },
  "oatmeal": {
    name: "燕麦",
    nameEn: "Oatmeal",
    category: FOOD_CATEGORIES.CARBOHYDRATES,
    calories: { unit: "40g", value: 150 },
    nutrition: { protein: 5, fat: 2.5, carbs: 27, calcium: 18, iron: 1.6, fiber: 4 },
    allergens: ["麸质"],
    pregnancySafe: true,
    tip: "富含膳食纤维，预防便秘",
  },

  // 豆类
  "black_bean": {
    name: "黑豆",
    nameEn: "Black Bean",
    category: FOOD_CATEGORIES.LEGUMES,
    calories: { unit: "100g", value: 339 },
    nutrition: { protein: 21, fat: 0.9, carbs: 63, calcium: 123, iron: 5.0, fiber: 15.5 },
    allergens: [],
    pregnancySafe: true,
    tip: "富含铁和叶酸",
  },
  "lentil": {
    name: "扁豆",
    nameEn: "Lentil",
    category: FOOD_CATEGORIES.LEGUMES,
    calories: { unit: "100g", value: 116 },
    nutrition: { protein: 9, fat: 0.4, carbs: 20, calcium: 19, iron: 3.3, fiber: 7.9 },
    allergens: [],
    pregnancySafe: true,
  },

  // 坚果种子
  "walnut": {
    name: "核桃",
    nameEn: "Walnut",
    category: FOOD_CATEGORIES.NUTS_SEEDS,
    calories: { unit: "30g", value: 185 },
    nutrition: { protein: 4.3, fat: 18, carbs: 3.9, calcium: 28, iron: 0.8, omega3: 2500 },
    allergens: ["坚果"],
    pregnancySafe: true,
    tip: "富含Omega-3脂肪酸，有助于胎儿大脑发育",
  },
  "almond": {
    name: "杏仁",
    nameEn: "Almond",
    category: FOOD_CATEGORIES.NUTS_SEEDS,
    calories: { unit: "30g", value: 164 },
    nutrition: { protein: 6, fat: 14, carbs: 6, calcium: 76, iron: 1.1 },
    allergens: ["坚果"],
    pregnancySafe: true,
    tip: "富含钙和维生素E",
  },
  "chia_seed": {
    name: "奇亚籽",
    nameEn: "Chia Seed",
    category: FOOD_CATEGORIES.NUTS_SEEDS,
    calories: { unit: "15g", value: 73 },
    nutrition: { protein: 2.5, fat: 4.6, carbs: 6.3, calcium: 96, iron: 1.1, omega3: 2400 },
    allergens: [],
    pregnancySafe: true,
    tip: "富含Omega-3和膳食纤维",
  },
};

// 饮食禁忌
export const DIET_RESTRICTIONS = {
  avoid: [
    {
      id: "raw_fish",
      name: "生食海鲜",
      nameEn: "Raw Seafood",
      reason: "可能含有寄生虫或细菌",
      examples: ["生鱼片", "生蚝", "寿司（部分）"],
      trimesters: [PREGNANCY_TRIMESTERS.FIRST, PREGNANCY_TRIMESTERS.SECOND, PREGNANCY_TRIMESTERS.THIRD],
    },
    {
      id: "raw_egg",
      name: "生鸡蛋",
      nameEn: "Raw Eggs",
      reason: "可能含有沙门氏菌",
      examples: ["溏心蛋", "生蛋制作的食物"],
      trimesters: [PREGNANCY_TRIMESTERS.FIRST, PREGNANCY_TRIMESTERS.SECOND, PREGNANCY_TRIMESTERS.THIRD],
    },
    {
      id: "unpasteurized_cheese",
      name: "未消毒奶酪",
      nameEn: "Unpasteurized Cheese",
      reason: "可能含有李斯特菌",
      examples: ["布里奶酪", "卡门培尔奶酪", "蓝纹奶酪"],
      trimesters: [PREGNANCY_TRIMESTERS.FIRST, PREGNANCY_TRIMESTERS.SECOND, PREGNANCY_TRIMESTERS.THIRD],
    },
    {
      id: "high_mercury_fish",
      name: "高汞鱼类",
      nameEn: "High Mercury Fish",
      reason: "汞可能影响胎儿神经系统发育",
      examples: ["鲨鱼", "旗鱼", "金枪鱼（大规格）"],
      trimesters: [PREGNANCY_TRIMESTERS.FIRST, PREGNANCY_TRIMESTERS.SECOND, PREGNANCY_TRIMESTERS.THIRD],
    },
  ],
  limit: [
    {
      id: "caffeine",
      name: "咖啡因",
      nameEn: "Caffeine",
      reason: "过量可能增加流产或低出生体重风险",
      dailyLimit: "每日 < 200mg",
      examples: ["咖啡（1-2杯）", "茶（2-3杯）", "可乐"],
      trimesters: [PREGNANCY_TRIMESTERS.FIRST, PREGNANCY_TRIMESTERS.SECOND, PREGNANCY_TRIMESTERS.THIRD],
    },
    {
      id: "added_sugar",
      name: "添加糖",
      nameEn: "Added Sugar",
      reason: "增加妊娠糖尿病风险",
      dailyLimit: "每日 < 25g",
      examples: ["甜饮料", "甜点", "糖果"],
      trimesters: [PREGNANCY_TRIMESTERS.FIRST, PREGNANCY_TRIMESTERS.SECOND, PREGNANCY_TRIMESTERS.THIRD],
    },
    {
      id: "sodium",
      name: "钠（盐）",
      nameEn: "Sodium",
      reason: "增加水肿和高血压风险",
      dailyLimit: "每日 < 2300mg",
      examples: ["咸菜", "腌制食品", "加工肉类"],
      trimesters: [PREGNANCY_TRIMESTERS.SECOND, PREGNANCY_TRIMESTERS.THIRD],
    },
  ],
};

// 按孕周推荐的食物组合
export const MEAL_SUGGESTIONS = {
  breakfast: [
    {
      id: "breakfast_1",
      name: "营养早餐",
      foods: [
        { foodId: "egg", amount: "1个" },
        { foodId: "whole_wheat_bread", amount: "2片" },
        { foodId: "milk", amount: "250ml" },
        { foodId: "banana", amount: "1根" },
      ],
      calories: 390,
      keyNutrients: ["蛋白质", "钙", "钾"],
      weekRange: [1, 42],
    },
    {
      id: "breakfast_2",
      name: "燕麦早餐",
      foods: [
        { foodId: "oatmeal", amount: "40g" },
        { foodId: "milk", amount: "250ml" },
        { foodId: "banana", amount: "1根" },
        { foodId: "walnut", amount: "15g" },
      ],
      calories: 395,
      keyNutrients: ["膳食纤维", "蛋白质", "Omega-3"],
      weekRange: [1, 42],
    },
    {
      id: "breakfast_nausea",
      name: "缓解孕吐早餐",
      foods: [
        { foodId: "whole_wheat_bread", amount: "1片" },
        { foodId: "apple", amount: "1个" },
        { foodId: "yogurt", amount: "100g" },
      ],
      calories: 220,
      keyNutrients: ["易消化", "温和"],
      weekRange: [1, 12],
      note: "适合孕吐期，少量多餐",
    },
  ],
  lunch: [
    {
      id: "lunch_1",
      name: "均衡午餐",
      foods: [
        { foodId: "brown_rice", amount: "100g" },
        { foodId: "chicken_breast", amount: "100g" },
        { foodId: "broccoli", amount: "100g" },
        { foodId: "tofu", amount: "50g" },
      ],
      calories: 410,
      keyNutrients: ["蛋白质", "维生素B", "叶酸"],
      weekRange: [1, 42],
    },
    {
      id: "lunch_fish",
      name: "鱼类午餐",
      foods: [
        { foodId: "fish_salmon", amount: "100g" },
        { foodId: "brown_rice", amount: "100g" },
        { foodId: "spinach", amount: "100g" },
      ],
      calories: 425,
      keyNutrients: ["Omega-3", "蛋白质", "铁"],
      weekRange: [1, 42],
    },
  ],
  dinner: [
    {
      id: "dinner_1",
      name: "清淡晚餐",
      foods: [
        { foodId: "beef_lean", amount: "80g" },
        { foodId: "spinach", amount: "100g" },
        { foodId: "tofu", amount: "100g" },
        { foodId: "brown_rice", amount: "80g" },
      ],
      calories: 380,
      keyNutrients: ["铁", "蛋白质", "叶酸"],
      weekRange: [1, 42],
      note: "晚餐不宜过饱",
    },
    {
      id: "dinner_vegetarian",
      name: "素食晚餐",
      foods: [
        { foodId: "lentil", amount: "80g" },
        { foodId: "spinach", amount: "100g" },
        { foodId: "tofu", amount: "100g" },
        { foodId: "brown_rice", amount: "80g" },
      ],
      calories: 320,
      keyNutrients: ["铁", "蛋白质", "膳食纤维"],
      weekRange: [1, 42],
    },
  ],
  snack: [
    {
      id: "snack_1",
      name: "健康加餐",
      foods: [
        { foodId: "yogurt", amount: "150g" },
        { foodId: "almond", amount: "15g" },
      ],
      calories: 175,
      keyNutrients: ["蛋白质", "钙"],
      weekRange: [1, 42],
    },
    {
      id: "snack_fruit",
      name: "水果加餐",
      foods: [
        { foodId: "apple", amount: "1个" },
        { foodId: "walnut", amount: "15g" },
      ],
      calories: 185,
      keyNutrients: ["维生素C", "Omega-3"],
      weekRange: [1, 42],
    },
  ],
};

// 症状缓解饮食建议
export const SYMPTOM_RELIEF = {
  nausea: {
    name: "孕吐",
    recommendations: [
      "少量多餐，每日5-6餐",
      "避免空腹，晨起先吃几块饼干",
      "选择清淡、易消化的食物",
      "避免油腻、辛辣、气味刺激的食物",
      "姜茶有助于缓解恶心",
      "补充维生素B6可能有效",
    ],
    recommendedFoods: [
      { foodId: "whole_wheat_bread", reason: "易消化" },
      { foodId: "yogurt", reason: "温和" },
      { foodId: "banana", reason: "含钾，不易引起恶心" },
      { foodId: "apple", reason: "温和" },
    ],
    avoidFoods: ["油腻食物", "辛辣食物", "咖啡因"],
  },
  constipation: {
    name: "便秘",
    recommendations: [
      "增加膳食纤维摄入（每日25-35g）",
      "多喝水，每日至少8杯",
      "适量运动促进肠道蠕动",
      "可加入益生菌酸奶",
      "定时排便，养成习惯",
    ],
    recommendedFoods: [
      { foodId: "oatmeal", reason: "高纤维" },
      { foodId: "spinach", reason: "高纤维" },
      { foodId: "yogurt", reason: "益生菌" },
      { foodId: "banana", reason: "含钾，有助于肠道健康" },
    ],
    avoidFoods: ["加工食品", "精细碳水化合物"],
  },
  edema: {
    name: "水肿",
    recommendations: [
      "控制盐摄入（每日<2300mg钠）",
      "多吃富含钾的食物",
      "适当抬高腿休息",
      "适量运动促进血液循环",
      "避免长时间站立或久坐",
    ],
    recommendedFoods: [
      { foodId: "banana", reason: "富含钾" },
      { foodId: "spinach", reason: "富含钾" },
      { foodId: "tofu", reason: "低钠高蛋白" },
      { foodId: "orange", reason: "富含钾和维生素C" },
    ],
    avoidFoods: ["咸菜", "腌制食品", "加工肉类"],
  },
  heartburn: {
    name: "胃灼热",
    recommendations: [
      "小口慢饮，避免一次喝太多",
      "避免躺卧，饭后至少保持直立2-3小时",
      "避免辛辣、油腻食物",
      "减少咖啡因摄入",
      "睡前2-3小时不进食",
    ],
    recommendedFoods: [
      { foodId: "yogurt", reason: "温和" },
      { foodId: "oatmeal", reason: "易消化" },
      { foodId: "banana", reason: "温和" },
      { foodId: "brown_rice", reason: "低脂" },
    ],
    avoidFoods: ["辛辣食物", "咖啡因", "巧克力", "番茄"],
  },
};

// 导出所有内容
export const nutritionContent = {
  trimesters: PREGNANCY_TRIMESTERS,
  bmiCategories: BMI_CATEGORIES,
  nutritionStandards: NUTRITION_STANDARDS,
  foodCategories: FOOD_CATEGORIES,
  foodDatabase: FOOD_DATABASE,
  dietRestrictions: DIET_RESTRICTIONS,
  mealSuggestions: MEAL_SUGGESTIONS,
  symptomRelief: SYMPTOM_RELIEF,
};
