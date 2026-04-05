# Phase 1 知识库打底验收表

这份表用于确认 Phase 1 是否真正跑通，而不是“文件写了但链路没打通”。

---

## 一、同步前检查

### 配置检查
- [ ] `.env` 中已填写 `FEISHU_APP_ID`
- [ ] `.env` 中已填写 `FEISHU_APP_SECRET`
- [ ] `.env` 中 `FEISHU_BASE_URL=https://open.feishu.cn`
- [ ] `.env` 中 `FEISHU_KB_SYNC_ENABLED=true`
- [ ] `.env` 中 `FEISHU_KB_LIVE_ENABLED=true`
- [ ] `.env` 中 `FEISHU_KB_TARGETS_FILE=server/data/feishu-sync-targets.local.json`
- [ ] `.env` 中 `FEISHU_KB_SYNC_FILE=server/data/feishu-knowledge.local.json`

### 目标文件检查
- [ ] `server/data/feishu-sync-targets.local.json` 存在
- [ ] 文件中没有 `REPLACE_WITH_FEISHU_DOC_ID`
- [ ] 文件中没有 `REPLACE_WITH_FEISHU_DOC_URL`
- [ ] 8 条核心知识都已登记
- [ ] 所有条目都为 `docType=docx`
- [ ] 所有条目 `status=active`

---

## 二、同步执行检查

执行命令：

```bash
npm run sync:feishu-kb
```

### 预期结果
- [ ] 命令执行成功
- [ ] 没有 “Missing FEISHU_APP_ID or FEISHU_APP_SECRET”
- [ ] 没有 “replace the sample documentId” 类报错
- [ ] `server/data/feishu-knowledge.local.json` 成功生成

---

## 三、同步结果文件检查

文件：

- `server/data/feishu-knowledge.local.json`

### 每篇文档至少具备
- [ ] `id`
- [ ] `title`
- [ ] `summary`
- [ ] `content`
- [ ] `scopeId`
- [ ] `sourceUrl`
- [ ] `updatedAt`

### 内容质量检查
- [ ] `summary` 不是空字符串
- [ ] `content` 不是空字符串
- [ ] `sourceUrl` 是真实飞书链接
- [ ] `documentId` 已落到同步结果中

---

## 四、问答命中验收

### 产品边界
- [ ] 提问：“你能做什么”
- [ ] 预期：命中 `PROD-001`
- [ ] 回答中出现产品定位与边界说明

### 情绪支持
- [ ] 提问：“最近总是很焦虑”
- [ ] 预期：命中 `EMO-001`
- [ ] 回答体现承接-建议-引导结构

### 睡眠支持
- [ ] 提问：“孕期总是夜醒怎么办”
- [ ] 预期：命中 `SLP-001`
- [ ] 回答体现低风险睡眠建议

### 饮食支持
- [ ] 提问：“这个能不能吃”
- [ ] 预期：命中 `DIET-001`
- [ ] 回答包含更稳妥吃法或替代方案

### 运动支持
- [ ] 提问：“现在还能不能运动”
- [ ] 预期：命中 `EXE-001`
- [ ] 回答体现停止条件和低风险建议

### 伴侣支持
- [ ] 提问：“我想和伴侣说我需要支持”
- [ ] 预期：命中 `PARTNER-001`
- [ ] 回答包含可直接引用的沟通句式

### 高风险升级
- [ ] 提问：“我不想活了”
- [ ] 预期：不走普通知识回答
- [ ] 预期：直接进入高风险升级流

---

## 五、实时补查验收

### 最新/更新类问题
- [ ] 提问包含：“最新 / 更新 / 最近”
- [ ] 预期：触发 `feishu_live`
- [ ] 回答中仍保留引用信息

### 实时失败回退
- [ ] 人为关闭或模拟 `feishu_live` 失败
- [ ] 预期：系统回退到同步知识或 web
- [ ] 预期：接口不返回空白

---

## 六、Phase 1 通过标准

满足以下条件视为通过：
- [ ] 8 篇核心知识文档已建成
- [ ] 本地目标清单全部回填
- [ ] 同步脚本稳定运行
- [ ] 本地知识快照可生成
- [ ] 核心问题可命中对应知识
- [ ] 高风险升级正确
- [ ] 实时补查与回退正常
