# 飞书知识库创建与回填 SOP

这份 SOP 用于把飞书文档接入当前项目的知识库链路，目标是让你能稳定完成：

1. 创建飞书知识文档  
2. 回填本地目标清单  
3. 同步到本地知识快照  
4. 用真实问答验证命中效果

---

## 1. 先准备哪些东西

在 `.env` 中确认这些配置存在且有效：

```env
FEISHU_APP_ID=你的飞书应用 App ID
FEISHU_APP_SECRET=你的飞书应用 App Secret
FEISHU_BASE_URL=https://open.feishu.cn
FEISHU_KB_SYNC_ENABLED=true
FEISHU_KB_LIVE_ENABLED=true
FEISHU_KB_SYNC_FILE=server/data/feishu-knowledge.local.json
FEISHU_KB_TARGETS_FILE=server/data/feishu-sync-targets.local.json
```

同时准备好飞书开放平台应用的最小权限：
- 获取 `tenant_access_token`
- 读取 `docx` 文档正文

本期默认全部使用 `docx` 文档，不先走 `wikiNodeToken`。

---

## 2. 在飞书创建文档

建议按这个顺序建 8 篇核心文档：
- `PROD-001` AI 助手简介与回答边界
- `EMO-001` 孕期情绪支持手册
- `SLP-001` 孕期睡眠支持知识卡
- `DIET-001` 孕期饮食建议
- `EXE-001` 孕期运动建议
- `RISK-001` 高风险识别与升级协议
- `APP-001` App 功能说明与入口导航
- `PARTNER-001` 伴侣沟通与支持建议

建议目录：
- `00_产品边界`
- `01_情绪支持`
- `02_睡眠支持`
- `03_饮食建议`
- `04_运动建议`
- `05_风险升级`
- `06_App功能`
- `07_伴侣支持`

每篇文档建议遵循统一结构：
1. 这篇内容解决什么问题
2. 适用范围
3. 推荐回答要点
4. 禁止越界内容
5. 可引用的固定表述
6. 维护信息

---

## 3. 获取飞书文档 ID

如果链接是：

```text
https://xxx.feishu.cn/docx/AbCdEfGhIjKlMnOpQrStUv
```

那通常最后这一段就是 `documentId`：

```text
AbCdEfGhIjKlMnOpQrStUv
```

把完整链接保存到 `sourceUrl`，把最后那段保存到 `documentId`。

---

## 4. 回填目标清单

编辑：

- `server/data/feishu-sync-targets.local.json`

把每篇文档真实值填进去，至少要替换：
- `documentId`
- `sourceUrl`
- `owner`

不要保留这些占位符：
- `REPLACE_WITH_FEISHU_DOC_ID`
- `REPLACE_WITH_FEISHU_DOC_URL`

---

## 5. 执行同步

在项目根目录运行：

```bash
npm run sync:feishu-kb
```

这个命令会：
- 读取飞书应用配置
- 读取 `feishu-sync-targets.local.json`
- 调飞书 API 拉取文档正文
- 生成本地知识快照

输出文件：

- `server/data/feishu-knowledge.local.json`

---

## 6. 检查同步结果

打开：

- `server/data/feishu-knowledge.local.json`

至少确认每条文档都有：
- `id`
- `title`
- `summary`
- `content`
- `scopeId`
- `sourceUrl`
- `updatedAt`

如果内容为空或不完整，优先检查：
- 飞书权限是否开够
- `documentId` 是否正确
- 文档是否真的是 `docx`
- `.env` 中的 `FEISHU_APP_ID/SECRET` 是否正确

---

## 7. 启动服务并做命中测试

启动后端：

```bash
npm run server
```

启动前端：

```bash
npm run dev
```

建议至少测试这些问法：
- “你能做什么”
- “最近总是很焦虑”
- “孕期总是夜醒怎么办”
- “这个能不能吃”
- “现在还能不能运动”
- “我想和伴侣说我需要支持”
- “我不想活了”

---

## 8. 判断是否命中正确

命中预期：
- “你能做什么” -> `PROD-001`
- “最近总是很焦虑” -> `EMO-001`
- “孕期总是夜醒怎么办” -> `SLP-001`
- “这个能不能吃” -> `DIET-001`
- “现在还能不能运动” -> `EXE-001`
- “我想和伴侣说我需要支持” -> `PARTNER-001`
- “我不想活了” -> 不走普通知识回答，直接高风险升级

如果问“最新/更新/最近”，应触发 `feishu_live` 补查。

---

## 9. 常见问题排查

### 同步脚本直接报错
优先检查：
- `.env` 是否有 `FEISHU_APP_ID`
- `.env` 是否有 `FEISHU_APP_SECRET`
- 本地 targets 文件里是否还存在占位符 ID

### 同步成功但回答不命中
优先检查：
- `tags` 是否太弱
- `scopeId` 是否合理
- 飞书文档正文是否过短或标题不清晰

### 实时补查没触发
优先检查：
- `FEISHU_KB_LIVE_ENABLED=true`
- 用户问题是否属于“最新/更新/最近”类
- 本地同步是否已经直接命中且未判定过旧

### 高风险问题还在走普通回答
优先检查：
- `RISK-001` 是否补齐
- 风险规则是否命中
- 高风险问法是否进入 `RiskEscalationAgent`

---

## 10. Phase 1 完成标准

满足以下条件可视为 Phase 1 基本完成：
- 8 篇飞书文档已建立
- 本地目标清单已全部回填
- `sync:feishu-kb` 可稳定运行
- 本地知识快照生成成功
- 核心问题能命中对应知识
- 高风险问题不走普通知识回答
- “最新/更新/最近”类问题能触发飞书实时补查
