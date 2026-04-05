# 错误处理与 Toast 通知使用指南

## 概述

项目已集成全局错误处理 (ErrorBoundary) 和 Toast 通知系统，用于优雅地处理错误和向用户显示反馈信息。

## 文件结构

```
src/
├── components/ui/
│   ├── ErrorBoundary.jsx    # 全局错误边界组件
│   └── Toast.jsx           # Toast 通知组件
└── contexts/
    └── ToastContext.jsx     # Toast 状态管理 Context
```

---

## ErrorBoundary 使用

### 自动集成

ErrorBoundary 已在 [main.jsx](src/main.jsx) 中自动包裹整个应用，无需额外配置。

### 自定义回退 UI

如果需要为特定部分提供自定义错误回退 UI：

```jsx
import ErrorBoundary from "./components/ui/ErrorBoundary";

function MyComponent() {
  return (
    <ErrorBoundary
      lang="zh"
      fallback={({ error, errorInfo, reload, goHome }) => (
        <div>
          <h2>自定义错误页面</h2>
          <button onClick={reload}>重试</button>
          <button onClick={goHome}>返回首页</button>
        </div>
      )}
    >
      {/* 你的组件内容 */}
    </ErrorBoundary>
  );
}
```

---

## Toast 通知使用

### 基本用法

在任何组件中使用 `useToast` hook：

```jsx
import { useToast } from "../contexts/ToastContext";

function MyComponent() {
  const { success, error, warning, info } = useToast();

  const handleSave = async () => {
    try {
      // 显示加载提示（手动）
      info("正在保存...", 0); // duration: 0 表示不自动关闭

      await api.saveData();

      // 保存成功
      success("保存成功！");
    } catch (err) {
      // 保存失败
      error("保存失败，请重试");
    }
  };

  return <button onClick={handleSave}>保存</button>;
}
```

### 可用方法

| 方法 | 参数 | 说明 |
|------|------|------|
| `success(message, duration?)` | 消息文本, 持续时间(ms) | 显示成功提示 |
| `error(message, duration?)` | 消息文本, 持续时间(ms) | 显示错误提示 |
| `warning(message, duration?)` | 消息文本, 持续时间(ms) | 显示警告提示 |
| `info(message, duration?)` | 消息文本, 持续时间(ms) | 显示信息提示 |
| `showToast({ message, type, duration })` | 对象配置 | 自定义 Toast |
| `promise(promise, options)` | Promise + 配置 | Promise 异步操作 |

### Promise 模式

自动处理异步操作的状态：

```jsx
const { promise } = useToast();

const handleSubmit = async () => {
  try {
    await promise(
      api.submitData(),
      {
        loading: "正在提交...",
        success: "提交成功！",
        error: "提交失败，请重试"
      }
    );
  } catch {
    // 错误已自动显示
  }
};
```

### 自定义位置

修改 [App.jsx](src/App.jsx) 中的 ToastContainer 位置：

```jsx
<ToastContainer position="top-right" />
```

可用位置：
- `top-right` (默认)
- `top-left`
- `top-center`
- `bottom-right`
- `bottom-left`
- `bottom-center`

---

## 实际应用示例

### 1. API 调用错误处理

```jsx
import { useToast } from "../contexts/ToastContext";
import { patchProfileBasic } from "../api/profile";

function ProfileForm({ profile }) {
  const { promise } = useToast();

  const handleSave = async (formData) => {
    await promise(
      patchProfileBasic(formData),
      {
        loading: "正在更新个人资料...",
        success: "个人资料已更新",
        error: "更新失败，请稍后重试"
      }
    );
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### 2. 表单验证错误

```jsx
const { error, success } = useToast();

const validateForm = (data) => {
  if (!data.name?.trim()) {
    error("请输入您的姓名");
    return false;
  }
  if (!data.dueDate) {
    error("请选择预产期");
    return false;
  }
  return true;
};

const handleSubmit = (e) => {
  e.preventDefault();
  if (!validateForm(formData)) return;

  success("验证通过，正在提交...");
};
```

### 3. 网络重试逻辑

```jsx
const { info, error } = useToast();

const fetchData = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      info(i === 0 ? "正在加载数据..." : `重试中 (${i + 1}/${retries})...`, 0);
      const data = await api.fetchData();
      return data;
    } catch (err) {
      if (i === retries - 1) {
        error("数据加载失败，请检查网络连接");
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};
```

---

## 样式自定义

Toast 样式使用 Tailwind CSS 和玻璃质感设计，与项目整体风格保持一致。如需修改样式，编辑 [Toast.jsx](src/components/ui/Toast.jsx) 中的 `toastStyles` 和 `toastIcons` 配置。

---

## 测试 ErrorBoundary

在开发环境中测试错误边界：

```jsx
function TestError() {
  const { error: showError } = useToast();

  const triggerError = () => {
    throw new Error("这是一个测试错误");
  };

  return (
    <button onClick={triggerError}>
      触发错误边界
    </button>
  );
}
```

---

## 注意事项

1. **Toast 持续时间**：默认 4000ms，设置为 0 表示不自动关闭
2. **错误日志**：所有错误会自动记录到控制台
3. **开发环境**：开发模式下会显示详细的错误堆栈
4. **多语言**：Toast 消息文本需要手动处理多语言
5. **性能**：Toast 最多同时显示 5 条，超过会自动移除最早的
