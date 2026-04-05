# Knowledge Workspace

这个目录是知识库的人工维护入口，后续如果你要查看、编辑、补充知识内容，优先看这里。

## 你最常会改的文件

### `knowledge-documents.local.json`

人工补充的知识文档落这里。

适合放：

- Notion / Confluence 导出的标准化文档
- 帮助中心文章
- FAQ
- 内部 SOP
- 运营手册

如果文件还不存在，可以直接参考 `knowledge-documents.example.json` 新建。

### `knowledge-connectors.local.json`

记录当前接了哪些知识源、同步方式是什么、归谁维护。

适合放：

- `notion_api`
- `confluence_api`
- `feishu_sync_snapshot`
- `local_files`

如果文件还不存在，可以直接参考 `knowledge-connectors.example.json` 新建。

### `feishu-sync-targets.local.json`

飞书同步脚本的目标列表。

适合放：

- 要同步的文档 ID
- 文档标题
- scopeId
- 标签
- 源链接

运行 `npm run sync:feishu` 时会读取这个文件。

### `feishu-knowledge.local.json`

飞书同步后的本地快照文件。

通常不手改，建议让同步脚本生成。

## 当前知识库实际来源

系统会统一读取这几类内容：

1. `src/data/` 下的内置知识
2. `server/kb/feishu-knowledge.local.json`
3. `server/kb/knowledge-documents.local.json`

然后投影成统一的：

- `document`
- `chunk`
- `acl_principal`
- `version_sync_state`

## 推荐编辑方式

如果你只是临时补一篇文档：

1. 复制 `knowledge-documents.example.json`
2. 改成 `knowledge-documents.local.json`
3. 新增或修改条目

如果你准备接一个新的知识源：

1. 先在 `knowledge-connectors.local.json` 里登记
2. 明确 `connector_type`
3. 明确 `sync_mode`
4. 再做对应 connector 脚本

## 字段建议

一篇文档至少保留这些字段：

- `document_id`
- `tenant_id`
- `source_type`
- `source_id`
- `source_url`
- `title`
- `summary`
- `body_text` 或 `body_markdown`
- `tags`
- `section_path`
- `acl_principals`
- `version_id`
- `updated_at`
- `sync_cursor`

## 提醒

- `*.local.json` 已加入忽略，适合放本地运行数据
- `*.example.json` 适合团队共享模板
- 真正的检索底座代码在 `server/services/knowledge/`

