# Phase 2：Prompt + Skill 强化实施文档

这份文档基于：

- [agent-iteration-roadmap.md](D:\资料\程序开发\妊安3.0（2）\docs\agent-iteration-roadmap.md)

目标是把系统从“能回答”提升到“更像产品、风格更稳、动作更清楚、证据利用更自然”。

---

## 1. 当前仓库状态判断

结合当前代码，Phase 2 不是从零开始，而是在已有底座上做强化。

当前已经存在的基础：

1. Prompt 基础
- `server/services/agent/prompts/promptPacks.js`
- `server/services/agent/prompts/subAgentPrompts.js`
- 已有 `router_prompt_pack_v1`
- 已有 `emotional_prompt_pack_v1`
- 已有情绪回复 JSON 输出协议

2. Skill 基础
- `server/services/agent/skills/analysisSkills.js`
- `server/services/agent/skills/workflowSkills.js`
- `server/services/agent/skills/index.js`
- 已有检索类、分析类、草稿类、workflow 类 skill 雏形

3. Agent 基础
- `server/services/agent/subAgents/emotionalSupportAgent.js`
- 已支持：
  - LLM 生成结构化回复
  - grounded retrieval
  - fallback 兜底
  - feature recommendation
  - 风险移交

4. 知识文档基础
- `PROD-001`、`EMO-001`、`SLP-001`、`DIET-001`、`EXE-001`、`PARTNER-001` 模板已完成
- `APP-001`、`RISK-001` 模板也已补齐

所以，Phase 2 的重点不再是“有没有”，而是“怎么把已有能力做稳、做得更像产品”。

---

## 2. Phase 2 目标

### 主目标

让回答同时满足 4 个要求：

1. 风格稳定  
2. 证据利用更自然  
3. 建议更具体  
4. 降级更可控

### 不做的事

本阶段不做：

- 多模态统一协议
- Planner 任务规划层
- 向量库 / rerank
- 全量运营后台

---

## 3. 本阶段建议拆成 4 个工作包

## 工作包 A：Prompt Pack v2

### 目标
把现有“角色 + 语气 + 禁止项”的轻量 Prompt Pack，升级为真正可控的结构化模板。

### 当前问题
- `promptPacks.js` 目前信息量偏少
- 约束有，但不够细
- 对 grounded answer 的利用规则还不够明确
- 对“什么时候降结论强度”描述不够强

### 建议新增

#### A1. `router_prompt_pack_v2`
新增内容：
- 安全优先说明
- 多意图处理规则
- 澄清优先规则
- retrieval 决策规则
- fallback 触发规则

#### A2. `emotional_prompt_pack_v2`
新增内容：
- 情绪支持语气边界
- 证据优先规则
- 微动作建议约束
- 鸡汤/空话/说教黑名单扩充
- 当没有证据时的低确定性表达模板

#### A3. `feature_prompt_pack_v1`
新增内容：
- 只解释产品功能与路径
- 不混入医学解释
- 使用“入口 + 用途 + 下一步”三段式

#### A4. `risk_prompt_pack_v1`
新增内容：
- R2/R3 不继续普通安抚
- 语言短、直接、动作优先
- 不输出“会好起来的”式泛安慰

### 文件建议
- `server/services/agent/prompts/promptPacks.js`
- `server/services/agent/prompts/subAgentPrompts.js`

### 验收标准
- 不同模型下回答风格更接近
- 情绪回答更少“空话感”
- 未命中知识时不再装懂

---

## 工作包 B：Grounded Answer 强化

### 目标
让模型更自然地使用已命中的知识，而不是“检索到了，但回答里没真正用上”。

### 当前问题
- Prompt 里虽然写了 “Use evidence pack first”
- 但证据如何进入回答，还缺少更强的输出约束
- 对“证据不足”的保守表达缺少模板化控制

### 建议新增

#### B1. 回答证据使用规则
在情绪生成 prompt 中明确：

1. 如果有知识命中：
- 优先用命中知识中的核心结论
- 不要完全复述原文
- 要把证据自然融合进建议

2. 如果只有弱证据：
- 使用“基于当前已收录资料”类表达
- 明确降低确定性

3. 如果没有证据：
- 不伪造知识来源
- 转为支持性、低风险、低确定性回答

#### B2. grounded summary 注入格式统一
把 evidence pack 统一整理成：

- `evidence_strength`
- `used_sources`
- `key_points`
- `citation_titles`
- `kb_miss`

这样模型更容易读懂。

#### B3. 回答输出协议增加可审计字段
建议在生成后内部保留：

- `evidence_used`
- `evidence_strength`
- `certainty_level`

即使前端不直接展示，也可以用于后续评估。

### 文件建议
- `server/services/agent/prompts/subAgentPrompts.js`
- `server/services/agent/grounding/groundedRetrievalService.js`
- `server/services/agent/subAgents/emotionalSupportAgent.js`

### 验收标准
- 命中知识时，回答能自然体现知识结论
- 没命中时，回答不会冒充“查到了”
- 来源与正文一致性更高

---

## 工作包 C：Analysis Skill 接入回答链路

### 目标
把已有 analysis skill 从“有定义”变成“真参与回答质量提升”。

### 当前问题
- `analysisSkills.js` 里已经有：
  - `analyze_emotional_trends`
  - `analyze_sleep_pattern`
  - `search_content_recommendations`
  - `explain_risk_level`
- 但这些 skill 还没有系统性接入 `EmotionalSupportAgent`

### 建议接入策略

#### C1. 情绪场景
当满足以下任一条件时，调用：
- `analyze_emotional_trends`

触发条件：
- 用户有 `checkIns`
- 近 7 天有情绪记录
- 用户在问“最近怎么总是...”这类趋势问题

#### C2. 睡眠相关情绪场景
当 `topic=sleep` 或命中睡眠关键词时，调用：
- `analyze_sleep_pattern`

用途：
- 给回答增加“最近睡眠模式”的上下文摘要
- 但不做诊断化结论

#### C3. 内容推荐场景
当用户问：
- “还能做什么”
- “有没有内容推荐”
- “下一步看什么”

调用：
- `search_content_recommendations`

#### C4. 风险说明场景
当系统已有 `riskLevel` 且需要解释时，调用：
- `explain_risk_level`

### 接入原则
- skill 输出只做“结构化输入信号”
- 不能直接原样拼到用户答案里
- 最终仍由 prompt 驱动 LLM 生成自然表达

### 文件建议
- `server/services/agent/subAgents/emotionalSupportAgent.js`
- `server/services/agent/skills/analysisSkills.js`

### 验收标准
- 回答更贴近用户近期状态
- 睡眠/情绪问题不再完全“单轮盲答”
- 推荐内容更像“顺着上下文给出”

---

## 工作包 D：Fallback 与风格稳定强化

### 目标
降低“模板感、突然变笨、突然像报错提示”的体验断层。

### 当前问题
- LLM 超时或解析失败时，模板 fallback 可能风格突变
- postcheck 过严时，可能把有温度的回答改得很硬

### 建议新增

#### D1. 模板降级分层
不要只保留一种 fallback。

建议分 3 层：

1. `llm_retry_short_prompt`
- 先用更短 prompt 重试一次

2. `soft_template_fallback`
- 仍保持“承接 -> 建议 -> 引导”
- 但不调用复杂知识

3. `hard_safe_fallback`
- 仅在安全或异常场景使用

#### D2. banned phrase 重写优化
当前若命中“鸡汤词”，建议改成句级重写，而不是整段重置。

#### D3. Prompt version 审计统一
每次回答应记录：
- `prompt_version`
- `generation_source`
- `fallback_reason`

便于后续做 Prompt A/B 和问题回放。

### 文件建议
- `server/services/agent/subAgents/emotionalSupportAgent.js`
- `server/services/agent/safety/postcheck.js`
- `server/services/agent/responseComposer.js`

### 验收标准
- fallback 发生时，用户感受不突然跳变
- 回答风格更稳定
- 审计更可追踪

---

## 4. 建议的最小落地顺序

按 ROI 和风险控制，建议严格按这个顺序：

### Step 1
升级 Prompt Pack：
- `router_prompt_pack_v2`
- `emotional_prompt_pack_v2`
- `feature_prompt_pack_v1`
- `risk_prompt_pack_v1`

### Step 2
改 `subAgentPrompts.js`
- 把 grounded 约束写细
- 增加证据强弱与低确定性表达规则

### Step 3
在 `EmotionalSupportAgent` 接入 2-3 个 analysis skill
- `analyze_emotional_trends`
- `analyze_sleep_pattern`
- `search_content_recommendations`

### Step 4
做 fallback 分层与审计字段补齐

### Step 5
补单测和回归用例

---

## 5. 建议本阶段新增的测试用例

### Prompt / 风格
- 相似情绪问题回答风格稳定
- 不出现明显鸡汤化句子
- 不出现诊断、药物、疗效保证

### Knowledge grounding
- 命中知识时回答自然引用知识结论
- `kb_miss=true` 时降低结论强度

### Skill integration
- 有 check-in 时会引入趋势摘要
- 睡眠问题会引入睡眠模式分析
- 内容推荐场景会引入推荐 skill

### Fallback
- LLM 超时后不直接变成生硬系统话术
- fallback 仍保留三段式结构

---

## 6. 本阶段默认范围（MVP）

为了避免过度工程，Phase 2 默认只动：

1. `EmotionalSupportAgent`
2. `Prompt Packs`
3. `subAgentPrompts`
4. `analysis skill` 接入
5. `fallback` 风格优化

暂不扩展：

1. Planner
2. 多模态统一协议
3. 向量检索
4. 运营后台
5. 全子 Agent 同步升级

---

## 7. 本阶段交付物

如果按这个文档执行完，Phase 2 应交付：

1. 更强的 Prompt Pack 体系
2. 更稳定的 grounded answer 生成策略
3. 真正参与回答的 analysis skills
4. 更自然的 fallback 机制
5. 对应测试样例和审计字段

---

## 8. 下一步建议

如果继续推进，最适合直接开始的是：

### Phase 2A
先只做 Prompt Pack v2 + grounded answer 强化

这是最小、最稳、对体验提升最明显的一步。

### Phase 2B
再接 analysis skill 到 `EmotionalSupportAgent`

这样不会一次改太多，便于排查风格和质量变化。
