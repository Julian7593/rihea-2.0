// 医疗知识库内容 - 中文版

export const MEDICAL_CATEGORIES = {
  FIRST_TRIMESTER: "first",    // 早孕期（1-12周）
  SECOND_TRIMESTER: "second",  // 中孕期（13-27周）
  THIRD_TRIMESTER: "third",    // 晚孕期（28-40周）
  POSTPARTUM: "postpartum",    // 产后期
  EMERGENCY: "emergency"       // 紧急情况
};

// 文章类型标识
export const ARTICLE_TYPES = {
  MEDICAL: "medical",      // 医疗知识
  PSYCHOLOGY: "psychology",  // 心理认知
  PRACTICE: "practice",      // 日常练习
  FAQ: "faq",             // 常见问题
};

export const MEDICAL_ARTICLES_ZH = [
  // 早孕期
  {
    id: "first-001",
    category: "first",
    title: "早孕期情绪波动是正常的",
    summary: "激素变化会导致情绪起伏，这是身体的自然反应",
    content: "早孕期（1-12周）体内雌激素和孕激素水平急剧变化，这会影响大脑中调节情绪的神经递质。常见表现包括：突然的情绪变化、易哭、焦虑感增强。\n\n应对建议：\n1. 接纳自己的情绪波动，不要自责\n2. 保持规律作息，充足睡眠\n3. 适度运动，如散步、瑜伽\n4. 与伴侣家人沟通，获得支持",
    tags: ["情绪", "激素", "正常现象"],
    weekRange: [1, 12]
  },
  {
    id: "first-002",
    category: "first",
    title: "孕吐与情绪管理",
    summary: "孕吐不仅影响身体，也可能影响情绪状态",
    content: "约80%的孕妇在早孕期会经历不同程度的孕吐。持续的恶心和不适可能导致疲劳、焦虑和情绪低落。\n\n缓解方法：\n1. 少食多餐，避免空腹\n2. 早晨起床前吃几块饼干\n3. 避免油腻和刺激性食物\n4. 如症状严重，及时就医",
    tags: ["孕吐", "不适", "生理症状"],
    weekRange: [1, 12]
  },
  {
    id: "first-003",
    category: "first",
    title: "早孕期焦虑常见问题",
    summary: "关于胎儿发育和流产风险的焦虑",
    content: "早孕期常见焦虑：担心胎儿发育是否正常、害怕流产。这些担忧是正常的，但过度焦虑会影响母婴健康。\n\n知识普及：\n- 大多数早孕期流产是染色体异常的自然选择，与孕妇行为无关\n- 按时产检，医生会监控胎儿发育\n- 避免过度查阅网络信息，以医生专业建议为准",
    tags: ["焦虑", "担心", "常见问题"],
    weekRange: [1, 12]
  },

  // 中孕期
  {
    id: "second-001",
    category: "second",
    title: "中孕期情绪稳定期",
    summary: "激素水平趋于稳定，情绪相对平和",
    content: "中孕期（13-27周）被称为\"蜜月期\"，激素水平相对稳定，孕吐症状减轻，体力恢复。这是情绪最佳的时期。\n\n建议：\n1. 利用这段时间建立良好的生活习惯\n2. 开始胎教，与宝宝建立情感连接\n3. 准备育儿知识，增强信心\n4. 适度社交，保持积极心态",
    tags: ["蜜月期", "稳定", "良好时机"],
    weekRange: [13, 27]
  },
  {
    id: "second-002",
    category: "second",
    title: "身体变化与自我认同",
    summary: "接纳孕期身体变化，建立积极的自我形象",
    content: "随着腹部隆起，身体形态发生变化。有些女性会对自己的身材变化感到不安，这会影响情绪状态。\n\n应对策略：\n1. 认识到这是孕育生命的正常过程\n2. 穿着舒适孕妇装，提升自信\n3. 关注宝宝健康，而不是身材\n4. 与同样怀孕的朋友交流，获得支持",
    tags: ["身体变化", "自我形象", "接纳"],
    weekRange: [13, 27]
  },
  {
    id: "second-003",
    category: "second",
    title: "胎动与情感连接",
    summary: "感受胎动是建立母子情感的重要时刻",
    content: "通常在18-20周左右开始感受到胎动。初次感受到宝宝在腹中的活动，会让母亲产生强烈的情感连接和幸福感。\n\n建议：\n1. 记录胎动时间，了解宝宝活动规律\n2. 与家人分享这份喜悦\n3. 轻抚腹部，与宝宝对话\n4. 这种连接有助于缓解焦虑",
    tags: ["胎动", "情感连接", "幸福感"],
    weekRange: [13, 27]
  },

  // 晚孕期
  {
    id: "third-001",
    category: "third",
    title: "分娩焦虑的应对",
    summary: "对分娩的恐惧和焦虑在晚孕期非常常见",
    content: "晚孕期（28-40周）接近预产期，对分娩的恐惧、疼痛和未知结果容易产生焦虑。这是完全正常的心理反应。\n\n应对方法：\n1. 参加产前课程，了解分娩过程\n2. 制定分娩计划，增加掌控感\n3. 练习呼吸和放松技巧\n4. 与医生讨论分娩方式和疼痛管理",
    tags: ["分娩", "恐惧", "焦虑"],
    weekRange: [28, 40]
  },
  {
    id: "third-002",
    category: "third",
    title: "身体不适与睡眠困难",
    summary: "晚期身体负担加重，需要更多休息和关怀",
    content: "晚孕期常见不适：尿频、腰背疼痛、呼吸困难、入睡困难。这些身体不适会直接影响情绪。\n\n缓解建议：\n1. 左侧卧位睡眠，改善血液循环\n2. 使用孕妇枕支撑身体\n3. 产前瑜伽缓解腰背痛\n4. 建立睡前放松仪式",
    tags: ["不适", "睡眠", "晚期"],
    weekRange: [28, 40]
  },
  {
    id: "third-003",
    category: "third",
    title: "为宝宝做准备",
    summary: "准备工作可以转移焦虑，增强信心",
    content: "通过实际行动为宝宝做准备，可以缓解焦虑，增强当父母的信心。\n\n准备工作：\n1. 准备婴儿用品和房间\n2. 学习新生儿护理知识\n3. 与伴侣讨论育儿分工\n4. 制定产后支持计划",
    tags: ["准备", "育儿", "信心"],
    weekRange: [28, 40]
  },

  // 产后期
  {
    id: "postpartum-001",
    category: "postpartum",
    title: "产后情绪波动是正常的",
    summary: "产后情绪低落（Baby Blues）很常见，通常自行缓解",
    content: "约50-80%的新妈妈会在产后2-4周内经历情绪低落、易哭、焦虑等。这被称为\"产后情绪低落\"，由激素急剧下降和睡眠不足引起。\n\n特点：\n- 通常在产后3-5天出现\n- 持续时间不超过2周\n- 不影响日常生活和照顾宝宝\n- 不需要特殊治疗，会自行缓解\n\n应对：\n1. 接纳自己的情绪，不要自责\n2. 争取家人帮助，保证休息\n3. 与其他新妈妈交流",
    tags: ["产后", "情绪低落", "正常"],
    weekRange: [0, 6]
  },
  {
    id: "postpartum-002",
    category: "postpartum",
    title: "识别产后抑郁",
    summary: "产后抑郁需要专业帮助，及早识别很重要",
    content: "产后抑郁症比情绪低落更严重，需要专业治疗。\n\n警示信号：\n- 情绪持续低落超过2周\n- 对宝宝没有兴趣或产生伤害想法\n- 无法完成日常照顾\n- 出现自杀想法\n- 幻觉或妄想\n\n应尽快求助：\n1. 告诉家人你的感受\n2. 联系产科医生或心理医生\n3. 不要独自承受",
    tags: ["产后抑郁", "警示", "求助"],
    weekRange: [0, 12]
  },
  {
    id: "postpartum-003",
    category: "postpartum",
    title: "产后身体恢复与自我关怀",
    summary: "照顾好自己，才能更好地照顾宝宝",
    content: "产后6-8周是身体恢复的关键期。忽视自我照顾会影响情绪和育儿能力。\n\n自我关怀要点：\n1. 营养均衡的饮食\n2. 尽量多休息，让家人分担\n3. 产后检查，了解恢复情况\n4. 适度运动，从散步开始\n5. 接受身体变化，给自己时间",
    tags: ["恢复", "自我关怀", "照顾"],
    weekRange: [0, 12]
  },

  // 紧急情况
  {
    id: "emergency-001",
    category: "emergency",
    title: "何时需要紧急就医",
    summary: "孕期出现这些症状应立即就医",
    content: "如果出现以下症状，请立即就医或联系医生：\n\n身体症状：\n- 阴道出血\n- 剧烈腹痛\n- 严重头痛或视觉障碍\n- 手脚面部严重水肿\n- 胎动明显减少\n- 阵痛频繁（37周前）\n\n心理紧急：\n- 持续自杀想法\n- 对宝宝有伤害想法\n- 幻觉或妄想\n\n紧急联系：\n- 产科医生急诊电话\n- 24小时助产士热线\n- 心理危机干预热线",
    tags: ["紧急", "症状", "就医"],
    weekRange: [0, 40],
    isEmergency: true
  },
  {
    id: "emergency-002",
    category: "emergency",
    title: "心理危机求助渠道",
    summary: "遇到心理危机时，这些求助渠道可以帮到你",
    content: "如果你正在经历严重的心理困扰，请立即寻求帮助：\n\n24小时心理热线：\n- 全国心理援助热线：400-161-9995\n- 北京心理援助热线：010-82951332\n- 上海心理援助热线：021-34289888\n\n医疗机构：\n- 当地妇幼保健院心理科\n- 三甲医院精神/心理科\n- 产后抑郁专科门诊\n\n其他资源：\n- 母婴健康指导中心\n- 社区心理健康服务\n\n不要独自承受，寻求帮助是勇敢的表现。",
    tags: ["危机", "求助", "热线"],
    weekRange: [0, 42],
    isEmergency: true
  },

  // ========== 学习板块整合内容 ==========

  // 心理认知
  {
    id: "mind-001",
    category: "first",
    title: "情绪波动不是你脆弱",
    summary: "识别正常波动与预警边界",
    content: "孕期情绪波动是正常的生理反应。激素急剧变化会影响大脑神经递质，导致情绪起伏。\n\n如何区分正常波动与需要关注的问题：\n- 正常波动：情绪变化后能自然恢复\n- 需关注：情绪低落持续超过2周\n\n应对建议：接纳自己的情绪变化，减少自责。",
    tags: ["情绪", "认知"],
    weekRange: [1, 12],
    articleType: ARTICLE_TYPES.PSYCHOLOGY,
    readingTime: "8分钟",
    source: "learn"
  },
  {
    id: "mind-002",
    category: "first",
    title: "灾难化思维拆解",
    summary: "把担心拆成\"证据-可能性-行动\"",
    content: "孕期容易陷入\"最坏结果\"的循环。这是大脑的防御机制，但会加剧焦虑。\n\n三步法拆解灾难化思维：\n1. 证据：担心的结果真的会发生吗？\n2. 可能性：最可能的结果是什么？\n3. 行动：现在可以做什么来准备？\n\n例如：担心胎儿健康 → 证据：产检正常 → 可能性：宝宝可能健康 → 行动：按时下次产检。",
    tags: ["认知", "应对"],
    weekRange: [1, 12],
    articleType: ARTICLE_TYPES.PSYCHOLOGY,
    readingTime: "6分钟",
    source: "learn"
  },
  {
    id: "mind-003",
    category: "second",
    title: "与家人沟通焦虑",
    summary: "表达需求而不是争吵的句式模板",
    content: "伴侣不理解你的焦虑感受时，容易产生冲突。使用清晰的句式可以有效降低沟通成本。\n\n三个沟通模板：\n1. 描述感受：\"我感到焦虑是因为...\"\n2. 提出需求：\"我需要你帮我...\"\n3. 说明原因：\"这样我会感觉更安心\"\n\n示例：\"我感到焦虑是因为担心胎儿健康，需要你多陪我一起看产检，这样我会感觉更安心。\"",
    tags: ["沟通", "关系"],
    weekRange: [13, 27],
    articleType: ARTICLE_TYPES.PSYCHOLOGY,
    readingTime: "5分钟",
    source: "learn"
  },

  // 医学科普
  {
    id: "science-001",
    category: "first",
    title: "心率压力指标怎么看",
    summary: "一个颜色系统快速判断压力区间",
    content: "智能手表和健康应用可以测量心率变异性（HRV）。HRV 反映自主神经系统的平衡状态。\n\n颜色系统：\n- 蓝色：HRV高，压力小，适合学习新知识\n- 黄色：HRV中等，压力适中，可以处理日常事务\n- 橙色：HRV低，压力大，需要优先休息\n\n建议：孕早期尽量保持HRV在黄色以上，为情绪稳定创造生理基础。",
    tags: ["压力指标", "科普"],
    weekRange: [1, 12],
    articleType: ARTICLE_TYPES.PSYCHOLOGY,
    readingTime: "3分钟",
    source: "learn"
  },
  {
    id: "science-002",
    category: "first",
    title: "产检前焦虑准备单",
    summary: "检查前一天如何准备更安心",
    content: "产检前的焦虑往往源于不确定感。提前准备可以增加掌控感。\n\n准备清单：\n1. 写下想问医生的3个问题\n2. 准备好病历和检查报告\n3. 安排伴侣陪同\n4. 计划产检后的活动\n5. 准备一个紧急联系人\n\n准备完成后，焦虑会明显降低。",
    tags: ["产检", "准备"],
    weekRange: [1, 12],
    articleType: ARTICLE_TYPES.PSYCHOLOGY,
    readingTime: "2分钟",
    source: "learn"
  },
  {
    id: "science-003",
    category: "first",
    title: "营养与情绪稳定",
    summary: "饮食如何帮助白天状态更稳",
    content: "营养直接影响神经递质的合成，从而影响情绪。\n\n情绪稳定饮食建议：\n1. 复杂碳水（全谷物）提供稳定的血糖\n2. 蛋白质：为神经递质提供原料\n3. 欧米茄-3：参与情绪调节\n4. 镁锌：缺乏与抑郁相关\n5. 避免过少咖啡因：可能加重焦虑\n\n营养是情绪稳定的基础，从日常饮食入手。",
    tags: ["营养", "科普"],
    weekRange: [1, 12],
    articleType: ARTICLE_TYPES.PSYCHOLOGY,
    readingTime: "4分钟",
    source: "learn"
  },

  // 日常练习
  {
    id: "habit-001",
    category: "first",
    title: "90秒身体扫描",
    summary: "快速把注意力从脑内拉回身体",
    content: "身体扫描是正念的基础练习，帮助你快速回到当下。\n\n90秒身体扫描步骤：\n1- 脚趾：感受脚趾的触感（10秒）\n2. 脚掌：感受温度和接触（10秒）\n3. 小腿：感受肌肉状态（10秒）\n4. 大腿：感受重量和支撑（10秒）\n5. 臀部和背部：感受姿势（10秒）\n6. 肩膀和手臂：感受放松或紧张（10秒）\n7. 胸部和呼吸：感受呼吸节奏（10秒）\n8. 颈部和头部：感受头部状态（10秒）\n9. 全身：感受整体存在（10秒）\n\n每天练习可以显著降低焦虑水平。",
    tags: ["正念", "练习"],
    weekRange: [0, 42],
    articleType: ARTICLE_TYPES.PRACTICE,
    readingTime: "90秒",
    source: "learn"
  },
  {
    id: "habit-002",
    category: "second",
    title: "步行呼吸法",
    summary: "散步时同步呼吸节奏，适合饭后",
    content: "结合散步和呼吸是有效的放松方式。\n\n步行呼吸法：\n1. 节奏：走3步-吸4秒-走3步-呼4秒\n2. 深度：用鼻子深吸，缓慢呼出\n3. 步速：轻松散步，不是锻炼\n4. 感受：每一步感受与地面的接触\n5. 环境：选择有自然的环境\n\n建议孕期每天散步15-20分钟，同时练习呼吸节奏。",
    tags: ["呼吸", "运动"],
    weekRange: [0, 42],
    articleType: ARTICLE_TYPES.PRACTICE,
    readingTime: "5分钟",
    source: "learn"
  },
  {
    id: "habit-003",
    category: "third",
    title: "睡前放松音频",
    summary: "减少入睡前紧绷和反刍思维",
    content: "睡前焦虑会显著影响睡眠质量。身体放松练习可以帮助：\n\n睡前放松练习：\n1. 身体扫描：从脚趾到头部逐一放松\n2. 呼吸练习：4-7-8呼吸法\n3. 渐进放松：想象紧张像温水一样流出身体\n4. 温水泡脚：睡前10分钟温水泡脚\n\n建议睡前15分钟放下手机，专注身体放松。",
    tags: ["睡眠", "放松"],
    weekRange: [28, 40],
    articleType: ARTICLE_TYPES.PRACTICE,
    readingTime: "3分钟",
    source: "learn"
  },

  // 常见问题
  {
    id: "faq-001",
    category: "first",
    title: "何时需要专业帮助",
    summary: "持续影响睡眠和功能就应尽快求助",
    content: "孕期焦虑在什么情况下需要专业帮助？\n\n需要立即求助的情况：\n1. 情绪低落持续超过2周\n2. 严重影响日常生活功能（工作、社交）\n3. 出现自伤或伤害他人的想法\n4. 持续的身体不适（心悸、失眠）\n5. 与现实严重脱节的感觉\n\n何时可以自我调节：\n- 偶尔的低落和焦虑\n- 对特定事件的担忧（如某个检查）\n- 轻度影响日常的情况\n\n专业帮助资源：\n- 产科医院心理科\n- 产后抑郁门诊\n- 心理咨询平台\n- 24小时心理热线\n\n主动求助是勇敢的表现，不是软弱。",
    tags: ["指引", "求助"],
    weekRange: [0, 42],
    articleType: ARTICLE_TYPES.FAQ,
    readingTime: "3分钟",
    source: "learn"
  },
  {
    id: "faq-002",
    category: "second",
    title: "伴侣不理解怎么办",
    summary: "先给对方明确、可执行的请求",
    content: "孕期情绪变化对伴侣来说也可能是新的体验。不理解会导致矛盾和孤立。\n\n给伴侣的建议：\n1. 用事实代替情绪：\"我感到焦虑\"而不是\"你让我好烦\"\n2. 解释原因：说明这是激素变化，不是性格改变\n3. 提供知识：分享可靠的信息来源\n4. 给出具体请求：\"陪我散步\"比\"你应该更理解我\"更有效\n\n寻求外部支持：\n- 医生或咨询师可以在产检时向伴侣解释\n- 推荐伴侣参加产前课程\n- 建议共同学习孕期知识\n\n理解需要时间，但良好的支持关系对你和宝宝都很重要。",
    tags: ["关系", "沟通"],
    weekRange: [13, 27],
    articleType: ARTICLE_TYPES.FAQ,
    readingTime: "4分钟",
    source: "learn"
  },
  {
    id: "faq-003",
    category: "postpartum",
    title: "产后抑郁预警信号",
    summary: "区分产后情绪低落与产后抑郁",
    content: "产后情绪低落和产后抑郁是不同的，需要区分应对。\n\n产后情绪低落特点：\n- 产后3-5天出现\n- 持续不超过2周\n- 不影响照顾宝宝\n- 会自然缓解\n\n产后抑郁预警信号：\n1. 情绪持续低落超过2周\n2. 对宝宝没有兴趣或产生伤害想法\n3. 严重影响日常功能\n4. 出现自伤想法\n5. 幻觉或妄想\n\n如果出现以上信号，请立即：\n- 告诉家人你的感受\n- 联系产科医生或心理医生\n- 不要独自承受\n- 产后抑郁是可以治疗的，及时干预非常重要。",
    tags: ["产后", "预警"],
    weekRange: [0, 12],
    articleType: ARTICLE_TYPES.FAQ,
    readingTime: "5分钟",
    source: "learn"
  }
];

// 获取指定分类的文章
export function getArticlesByCategory(category) {
  return MEDICAL_ARTICLES_ZH.filter(article => article.category === category);
}

// 获取指定孕期的文章
export function getArticlesByWeek(week) {
  return MEDICAL_ARTICLES_ZH.filter(article =>
    week >= article.weekRange[0] && week <= article.weekRange[1]
  );
}

// 搜索文章
export function searchArticles(keyword) {
  const lowerKeyword = keyword.toLowerCase();
  return MEDICAL_ARTICLES_ZH.filter(article =>
    article.title.toLowerCase().includes(lowerKeyword) ||
    article.summary.toLowerCase().includes(lowerKeyword) ||
    article.tags.some(tag => tag.toLowerCase().includes(lowerKeyword))
  );
}

// 获取所有分类（不包含紧急情况）
export function getCategories() {
  return Object.entries(MEDICAL_CATEGORIES)
    .filter(([key, value]) => value !== "emergency")
    .map(([key, value]) => ({ key, value }));
}

export default {
  MEDICAL_CATEGORIES,
  MEDICAL_ARTICLES_ZH,
  getArticlesByCategory,
  getArticlesByWeek,
  searchArticles,
  getCategories
};
