# 界面换新:复古教材笔记本风格 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 TVT 网络架构图绘制工具的整套视觉语言(登录页/项目列表/编辑器工具栏/属性面板/画布与节点/连线/校验面板)从现有冷色调后台风格,换成"复古知识清单/教材笔记本"风格:暖色纸面、装订线、横向内页格线、衬线标题、等宽数据文本、克制的小圆角。

**Architecture:** 现有代码已经普遍用 `var(--xxx)` CSS 变量 + Tailwind 排版类的混合写法。本次改版把改动集中在 `packages/web/src/index.css` 的令牌层(重定义现有变量值 + 新增令牌 + 新增 `.nb-*` 组件类),业务组件只做三类机械替换:①校验错误/警告的硬编码色值换成新语义色变量、②主操作按钮的 `bg-tvt-*` 换成 `var(--accent)`、③圆角类收紧到新的 `--radius-sm`/`--radius-md`,再加少量结构性改动(画布纸感背景、设备图标去照片化、PDF 图例同步)。不改业务逻辑、数据结构、API。

**Tech Stack:** React 19、Tailwind CSS v4(`@theme` CSS-first 配置)、React Flow(`@xyflow/react`)、jsPDF(PDF 导出)

**Spec:** `docs/superpowers/specs/2026-07-12-notebook-style-redesign-design.md`

**Commits:** 本计划的每个 Task 末尾都写了 `git commit` 步骤(每个 Task 独立提交,方便逐任务 review/回滚)。**这需要用户明确同意**——执行前向用户确认是否接受"每个 Task 自动提交一次"这种方式;如果用户要求不自动提交,把每个 Task 最后的 `git add`/`git commit` 步骤跳过,改成只验证不提交,由用户自己决定何时提交。

## Global Constraints

- 平台:macOS(Darwin),`sed -i ''`(BSD sed,空字符串参数是 in-place 无备份的写法)。
- **不改动**:登录鉴权逻辑、`.narch` 导入导出格式、校验规则(IP/NVR/PoE/VLAN)、项目归属过滤等业务逻辑与数据结构;此前代码审查发现的 9 个 bug 一律不顺带修复。
- **不改动** `packages/web/src/components/PropertyPanel.tsx` 里边线/标注的颜色选择器面板(`colorOptions` 数组及其 `#e11d48` 等字面量选项)、`packages/web/src/utils/exportPdf.ts` 的 `CONN_COLORS`(连接类型图例配色)、`packages/web/src/stores/canvasStore.ts`/`packages/server/src/narch.ts`/`packages/web/src/utils/narch.ts`/`AnnotationEdge.tsx`/`CanvasArea.tsx` 里标注/箭头默认色的 `#e11d48` ——这些是用户可选的字面量颜色板或分类图例色,不是"校验错误"语义色,和本次要替换的校验红/橙是两套不同的颜色用途,不要混淆替换。
- 颜色/字号/间距/圆角一律引用 `index.css` 里的 CSS 变量,业务组件里不允许出现新的十六进制颜色字面量(Canvas 2D 绘制的 `exportPdf.ts` 除外,该文件受限于 Canvas API 不支持 `var()`,必须写字面量十六进制值,但要与 `index.css` 里对应变量的值保持一致)。
- 每个 Task 的验证命令都在 `packages/web` 目录下执行(`cd "/Users/nobbylee/Desktop/Claude Code/网络架构图绘制工具/packages/web"`)。

---

### Task 1: 设计令牌 + 全局纸感背景 + notebook 组件类

**Files:**
- Modify: `packages/web/src/index.css`(全量重写,是本次改版所有颜色/字体/间距/圆角的唯一权威定义)

**Interfaces:**
- Produces:新增 CSS 变量供后续所有 Task 引用:`--ink`、`--ink-soft`、`--danger`、`--danger-soft`、`--warning`、`--warning-soft`、`--info`、`--margin-rule`、`--highlight`、`--bg-sunken`、`--bg-rule`、`--bg-margin`、`--border-strong`、`--font-serif`、`--radius-sm`、`--radius-md`、`--radius-lg`、`--radius-full`、`--shadow-card`、`--shadow-pop`、`--sp-1`..`--sp-8`、`--fs-display`..`--fs-xs`;新增组件类 `.nb-sheet`、`.nb-sheet--margin`、`.nb-sheet--ruled`、`.nb-title`、`.nb-kicker`、`.nb-tag`、`.nb-divider`。
- Produces:重定义现有变量值(名字不变,后续组件代码零改动即可换色):`--app-bg`、`--panel-bg`、`--panel-border`、`--text-primary`、`--text-secondary`、`--text-muted`、`--canvas-bg`、`--accent`、`--accent-hover`、`--accent-soft`、`--toolbar-bg`、`--input-bg`、`--input-border`、`--node-bg`、`--node-border`、`--node-selected`、`--hover-bg`。
- Removes:`@theme` 里的 `--color-tvt-50/100/500/600/700`、`--color-brand-third`(确认无其他文件引用,见下方 Step 1);`:root` 里的 `--canvas-grid`(Task 5 改用 `--bg-rule` 直接驱动画布网格线,不再需要这个变量)。

- [ ] **Step 1: 确认 `--color-brand-third` 和 `--canvas-grid` 没有遗漏引用**

```bash
cd "/Users/nobbylee/Desktop/Claude Code/网络架构图绘制工具/packages/web/src"
grep -rn "brand-third" . --include="*.tsx" --include="*.ts"
grep -rn "canvas-grid" . --include="*.tsx" --include="*.ts"
```

Expected: 两条命令都只匹配到 `index.css` 自身(如果用 `--include` 排除 css 则应该零匹配)。确认后再继续。

- [ ] **Step 2: 整体替换 `index.css` 内容**

用下面的完整内容覆盖 `packages/web/src/index.css`(用 Write 工具整份覆盖,不要用 Edit 做局部替换,避免遗漏旧变量):

```css
@import 'tailwindcss';

/* TVT 网络架构图 — 设计令牌(复古教材笔记本风格) */
@theme {
  --font-sans: 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', system-ui, sans-serif;
  --font-serif: 'Source Serif 4', 'Noto Serif SC', 'Songti SC', SimSun, Georgia, serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', ui-monospace, monospace;
}

:root {
  /* 纸面 / 背景 */
  --app-bg: #efebe3;
  --panel-bg: #fbf8f1;
  --bg-sunken: #e7e1d4;
  --hover-bg: #f3eee4;
  --bg-rule: rgba(42, 58, 78, 0.08);
  --bg-margin: #f6edea;

  /* 墨水与强调色 */
  --ink: #1c2838;
  --ink-soft: #3d4a5c;
  --accent: #2f5d50;
  --accent-hover: #244a40;
  --accent-soft: #e2ede8;
  --margin-rule: #c45c4a;
  --highlight: #f3e7b4;

  /* 文字 */
  --text-primary: var(--ink);
  --text-secondary: #5a6574;
  --text-muted: #8a93a0;
  --text-on-accent: var(--panel-bg);

  /* 边框 */
  --panel-border: #d5cfc2;
  --border-strong: #b8b0a0;

  /* 语义色 */
  --success: var(--accent);
  --success-soft: var(--accent-soft);
  --danger: #a3483c;
  --danger-soft: #f6edea;
  --warning: #9a6b2f;
  --warning-soft: #f6ebd4;
  --info: #3f5f7a;

  /* 字号阶梯 */
  --fs-display: 40px;
  --fs-h1: 28px;
  --fs-h2: 20px;
  --fs-h3: 16px;
  --fs-body: 15px;
  --fs-sm: 13px;
  --fs-xs: 12px;

  /* 行高与字重 */
  --lh-tight: 1.25;
  --lh-normal: 1.65;
  --fw-normal: 400;
  --fw-medium: 500;
  --fw-semibold: 600;

  /* 间距(8px 网格) */
  --sp-1: 4px;
  --sp-2: 8px;
  --sp-3: 12px;
  --sp-4: 16px;
  --sp-5: 24px;
  --sp-6: 32px;
  --sp-7: 48px;
  --sp-8: 64px;

  /* 圆角 */
  --radius-sm: 2px;
  --radius-md: 4px;
  --radius-lg: 6px;
  --radius-full: 9999px;

  /* 阴影 */
  --shadow-card: 0 1px 0 rgba(28, 40, 56, 0.04), 0 8px 20px rgba(28, 40, 56, 0.05);
  --shadow-pop: 0 8px 24px rgba(28, 40, 56, 0.08);
  --shadow-none: none;

  /* 动效 */
  --ease: cubic-bezier(0.2, 0, 0, 1);
  --dur-fast: 140ms;
  --dur-base: 220ms;

  /* 兼容既有组件引用的变量名(值已换成新色板) */
  --canvas-bg: var(--panel-bg);
  --toolbar-bg: var(--panel-bg);
  --input-bg: var(--panel-bg);
  --input-border: var(--panel-border);
  --node-bg: var(--panel-bg);
  --node-border: var(--panel-border);
  --node-selected: var(--accent);
}

* {
  box-sizing: border-box;
}

html,
body,
#root {
  height: 100%;
  margin: 0;
}

body {
  font-family: var(--font-sans);
  background-color: var(--app-bg);
  background-image:
    linear-gradient(
      90deg,
      transparent 47px,
      var(--margin-rule) 47px,
      var(--margin-rule) 49px,
      transparent 49px
    ),
    repeating-linear-gradient(
      to bottom,
      transparent 0,
      transparent 31px,
      var(--bg-rule) 31px,
      var(--bg-rule) 32px
    );
  background-attachment: fixed;
  color: var(--text-primary);
  font-size: var(--fs-body);
  line-height: var(--lh-normal);
  -webkit-font-smoothing: antialiased;
}

button {
  font-family: inherit;
}

h1,
h2,
h3 {
  font-family: var(--font-serif);
  line-height: var(--lh-tight);
  font-weight: var(--fw-semibold);
  margin: 0;
}

/* 滚动条 */
.panel-scroll::-webkit-scrollbar {
  width: 6px;
}
.panel-scroll::-webkit-scrollbar-thumb {
  background: var(--panel-border);
  border-radius: 3px;
}

/* React Flow 控件样式微调 */
.react-flow__controls-button {
  background: var(--panel-bg) !important;
  border-bottom-color: var(--panel-border) !important;
  fill: var(--text-secondary) !important;
}

.react-flow__controls-button:hover {
  background: var(--hover-bg) !important;
}

.react-flow__minimap {
  background: var(--panel-bg) !important;
}

.react-flow__edge.selected .react-flow__edge-path {
  stroke: var(--accent) !important;
}

/* 导出截图时隐藏控件与编辑器浮层 */
html.tvt-exporting .react-flow__controls,
html.tvt-exporting .react-flow__minimap,
html.tvt-exporting .react-flow__attribution,
html.tvt-exporting .tvt-canvas-overlay {
  display: none !important;
}

/* ---------- Notebook 组件类 ---------- */

.nb-sheet {
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
}

.nb-sheet--margin {
  border-left: 3px solid var(--margin-rule);
}

.nb-sheet--ruled {
  background-image: repeating-linear-gradient(
    to bottom,
    transparent 0,
    transparent 23px,
    var(--bg-rule) 23px,
    var(--bg-rule) 24px
  );
}

.nb-title {
  font-family: var(--font-serif);
  font-weight: var(--fw-semibold);
  color: var(--text-primary);
  line-height: var(--lh-tight);
}

.nb-kicker {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  letter-spacing: 0.06em;
  color: var(--text-muted);
  text-transform: uppercase;
}

.nb-kicker::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  border: 1.2px solid currentColor;
}

.nb-tag {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  background: var(--highlight);
  color: var(--ink);
  font-size: var(--fs-xs);
}

.nb-divider {
  border: none;
  border-top: 1px dashed var(--border-strong);
  margin: var(--sp-3) 0;
}
```

- [ ] **Step 3: 构建验证**

```bash
cd "/Users/nobbylee/Desktop/Claude Code/网络架构图绘制工具/packages/web"
npm run build
```

Expected: `tsc -b && vite build` 无报错(这一步只改 CSS,不涉及 TS 类型,理论上必过;如果报错说明 `index.css` 语法有误,检查花括号/分号)。

- [ ] **Step 4: 提交**

```bash
cd "/Users/nobbylee/Desktop/Claude Code/网络架构图绘制工具"
git add packages/web/src/index.css
git commit -m "style: 替换设计令牌为复古教材笔记本配色体系"
```

---

### Task 2: 校验语义色替换(danger / warning)

**Files:**
- Modify: `packages/web/src/nodes/DeviceNode.tsx:37-38,52`
- Modify: `packages/web/src/edges/LabeledEdge.tsx:59-60`
- Modify: `packages/web/src/components/Toolbar.tsx:465,473`
- Modify: `packages/web/src/components/ValidationPanel.tsx:11-12,55,60`

**Interfaces:**
- Consumes:Task 1 产出的 `--danger`、`--warning` 变量。

- [ ] **Step 1: `DeviceNode.tsx`**

原文件第 36-38 行:

```tsx
  let borderColor = selected ? 'var(--node-selected)' : 'var(--node-border)'
  if (hasError) borderColor = '#e11d48'
  else if (hasWarning) borderColor = '#ea580c'
```

改为:

```tsx
  let borderColor = selected ? 'var(--node-selected)' : 'var(--node-border)'
  if (hasError) borderColor = 'var(--danger)'
  else if (hasWarning) borderColor = 'var(--warning)'
```

原文件第 49-54 行:

```tsx
      {hasError && (
        <span
          className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full"
          style={{ background: '#e11d48' }}
          title="存在配置错误"
        />
      )}
```

改为:

```tsx
      {hasError && (
        <span
          className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full"
          style={{ background: 'var(--danger)' }}
          title="存在配置错误"
        />
      )}
```

- [ ] **Step 2: `LabeledEdge.tsx`**

原文件第 58-60 行:

```tsx
  let stroke = selected ? 'var(--accent)' : 'rgba(0, 102, 204, 0.55)'
  if (hasError) stroke = '#e11d48'
  else if (hasWarning) stroke = '#ea580c'
```

改为:

```tsx
  let stroke = selected ? 'var(--accent)' : 'rgba(47, 93, 80, 0.55)'
  if (hasError) stroke = 'var(--danger)'
  else if (hasWarning) stroke = 'var(--warning)'
```

(未选中态的默认连线色 `rgba(0, 102, 204, 0.55)` 是旧 TVT 蓝的半透明版本,同步换成新主色 `#2F5D50` 的半透明版本 `rgba(47, 93, 80, 0.55)`。)

- [ ] **Step 3: `Toolbar.tsx`**

原文件第 462-469 行:

```tsx
            {errorCount > 0 && (
              <span
                className="rounded-full px-1.5 py-0.5 text-white"
                style={{ background: '#e11d48' }}
              >
                {errorCount}
              </span>
            )}
```

改为:

```tsx
            {errorCount > 0 && (
              <span
                className="rounded-full px-1.5 py-0.5 text-white"
                style={{ background: 'var(--danger)' }}
              >
                {errorCount}
              </span>
            )}
```

原文件第 470-477 行同理,把 `style={{ background: '#ea580c' }}` 改成 `style={{ background: 'var(--warning)' }}`。

- [ ] **Step 4: `ValidationPanel.tsx`**

原文件第 5-18 行:

```tsx
function SeverityBadge({ severity }: { severity: ValidationIssue['severity'] }) {
  const isError = severity === 'error'
  return (
    <span
      className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium"
      style={{
        background: isError ? 'rgba(225, 29, 72, 0.12)' : 'rgba(234, 88, 12, 0.12)',
        color: isError ? '#e11d48' : '#ea580c',
      }}
    >
      {isError ? '错误' : '警告'}
    </span>
  )
}
```

改为:

```tsx
function SeverityBadge({ severity }: { severity: ValidationIssue['severity'] }) {
  const isError = severity === 'error'
  return (
    <span
      className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium"
      style={{
        background: isError ? 'var(--danger-soft)' : 'var(--warning-soft)',
        color: isError ? 'var(--danger)' : 'var(--warning)',
      }}
    >
      {isError ? '错误' : '警告'}
    </span>
  )
}
```

原文件第 54-58 行(`style={{ background: '#e11d48' }}`)和第 59-63 行(`style={{ background: '#ea580c' }}`)分别改成 `style={{ background: 'var(--danger)' }}` 和 `style={{ background: 'var(--warning)' }}`。

- [ ] **Step 5: 验证没有遗漏,且没有误改标注颜色选择器**

```bash
cd "/Users/nobbylee/Desktop/Claude Code/网络架构图绘制工具/packages/web/src"
grep -rn "#e11d48\|#ea580c" nodes/DeviceNode.tsx edges/LabeledEdge.tsx components/Toolbar.tsx components/ValidationPanel.tsx
```

Expected: 零匹配(全部替换完)。

```bash
grep -n "#e11d48" components/PropertyPanel.tsx components/CanvasArea.tsx edges/AnnotationEdge.tsx stores/canvasStore.ts
```

Expected: 这几个文件里的 `#e11d48` 应该原样保留(标注默认色/颜色选择器,不属于本 Task 范围)——如果这条命令零匹配说明改错了地方,要检查是否误删。

- [ ] **Step 6: 构建验证并提交**

```bash
cd "/Users/nobbylee/Desktop/Claude Code/网络架构图绘制工具/packages/web"
npm run build
```

```bash
cd "/Users/nobbylee/Desktop/Claude Code/网络架构图绘制工具"
git add packages/web/src/nodes/DeviceNode.tsx packages/web/src/edges/LabeledEdge.tsx packages/web/src/components/Toolbar.tsx packages/web/src/components/ValidationPanel.tsx
git commit -m "style: 校验错误/警告高亮改用新语义色 token"
```

---

### Task 3: 主操作按钮配色 + 圆角收紧

**Files:**
- Modify: `packages/web/src/pages/Login.tsx:102`
- Modify: `packages/web/src/pages/ProjectList.tsx:187,415`
- Modify: `packages/web/src/pages/Editor.tsx:100`
- Modify: `packages/web/src/components/DeviceFormModal.tsx:141`
- Modify: `packages/web/src/nodes/TextNode.tsx:36`
- Bulk modify(sed):`packages/web/src/**/*.tsx` 里的 `rounded-lg`、`rounded-md`、`rounded-xl`、`rounded-2xl`

- [ ] **Step 1: 替换 5 处主操作按钮的 `bg-tvt-500`/`hover:bg-tvt-600`**

`packages/web/src/pages/Login.tsx` 第 99-105 行,原:

```tsx
          <button
            type="submit"
            disabled={loading}
            className="mt-1 flex h-10 items-center justify-center rounded-lg bg-tvt-500 text-sm font-medium text-white transition-colors hover:bg-tvt-600 disabled:opacity-60"
          >
            {loading ? '登录中…' : '登录'}
          </button>
```

改为:

```tsx
          <button
            type="submit"
            disabled={loading}
            className="mt-1 flex h-10 items-center justify-center rounded-lg bg-[var(--accent)] text-sm font-medium text-[var(--text-on-accent)] transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-60"
          >
            {loading ? '登录中…' : '登录'}
          </button>
```

`packages/web/src/pages/ProjectList.tsx` 第 184-193 行,原:

```tsx
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="flex h-9 items-center gap-2 rounded-lg bg-tvt-500 px-4 text-sm font-medium text-white transition-colors hover:bg-tvt-600"
            >
```

改为:

```tsx
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="flex h-9 items-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-[var(--text-on-accent)] transition-colors hover:bg-[var(--accent-hover)]"
            >
```

同一文件第 411-417 行,原:

```tsx
              <button
                type="button"
                disabled={creating}
                onClick={() => void handleCreate()}
                className="h-9 rounded-lg bg-tvt-500 px-4 text-sm font-medium text-white hover:bg-tvt-600 disabled:opacity-60"
              >
                {creating ? '创建中…' : '创建并打开'}
              </button>
```

改为:

```tsx
              <button
                type="button"
                disabled={creating}
                onClick={() => void handleCreate()}
                className="h-9 rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-[var(--text-on-accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60"
              >
                {creating ? '创建中…' : '创建并打开'}
              </button>
```

`packages/web/src/pages/Editor.tsx` 第 97-103 行,原:

```tsx
        <button
          type="button"
          onClick={handleBack}
          className="h-9 rounded-lg bg-tvt-500 px-4 text-sm text-white hover:bg-tvt-600"
        >
          返回项目列表
        </button>
```

改为:

```tsx
        <button
          type="button"
          onClick={handleBack}
          className="h-9 rounded-lg bg-[var(--accent)] px-4 text-sm text-[var(--text-on-accent)] hover:bg-[var(--accent-hover)]"
        >
          返回项目列表
        </button>
```

`packages/web/src/components/DeviceFormModal.tsx` 第 138-144 行,原:

```tsx
            <button
              type="submit"
              disabled={!name.trim()}
              className="h-9 flex-1 rounded-lg bg-tvt-500 text-sm font-medium text-white hover:bg-tvt-600 disabled:opacity-40"
            >
              保存
            </button>
```

改为:

```tsx
            <button
              type="submit"
              disabled={!name.trim()}
              className="h-9 flex-1 rounded-lg bg-[var(--accent)] text-sm font-medium text-[var(--text-on-accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40"
            >
              保存
            </button>
```

**统一写法说明:** 上面连同 Login.tsx/ProjectList.tsx 的三处,全部用 Tailwind 的 `hover:bg-[var(--accent-hover)]` 任意值语法(Tailwind v4 方括号任意值支持 `var()`),不使用 `onMouseEnter`/`onMouseLeave` JS 事件 —— 更符合项目现有代码风格。也就是说 Step 1 开头 Login.tsx/ProjectList.tsx 那三处示例代码里出现的 `onMouseEnter`/`onMouseLeave` 写法要去掉,统一改成:

```tsx
className="...原有布局类... bg-[var(--accent)] text-[var(--text-on-accent)] hover:bg-[var(--accent-hover)] ...原有其余类..."
```

不带 `style` 属性,不带鼠标事件。

- [ ] **Step 2: 验证 `bg-tvt-`/`text-white` 配主色按钮已全部替换**

```bash
cd "/Users/nobbylee/Desktop/Claude Code/网络架构图绘制工具/packages/web/src"
grep -rn "bg-tvt-" --include="*.tsx" .
```

Expected: 零匹配。

- [ ] **Step 3: 圆角收紧 —— 容器类(`rounded-xl`/`rounded-2xl`)改 `--radius-md`**

逐一替换以下 9 处(`rounded-xl` → `rounded-[var(--radius-md)]`,`rounded-2xl` → `rounded-[var(--radius-md)]`):

- `components/CanvasArea.tsx:545` 的 `rounded-xl`
- `components/CanvasArea.tsx:557` 的 `rounded-xl`
- `components/DeviceFormModal.tsx:51` 的 `rounded-xl`
- `components/DeviceFormModal.tsx:165` 的 `rounded-xl`
- `pages/Login.tsx:48` 的 `rounded-2xl`
- `pages/ProjectList.tsx:245` 的 `rounded-xl`
- `pages/ProjectList.tsx:266` 的 `rounded-xl`
- `pages/ProjectList.tsx:364` 的 `rounded-xl`

用 sed 批量处理(这两个类名在项目里只用于容器,没有其他语义,可以安全全局替换):

```bash
cd "/Users/nobbylee/Desktop/Claude Code/网络架构图绘制工具/packages/web/src"
grep -rl "rounded-xl\|rounded-2xl" --include="*.tsx" . | while read -r f; do
  sed -i '' 's/rounded-2xl/rounded-[var(--radius-md)]/g; s/rounded-xl/rounded-[var(--radius-md)]/g' "$f"
done
```

- [ ] **Step 4: 圆角收紧 —— 按钮/输入框类(`rounded-lg`/`rounded-md`)改 `--radius-sm`**

```bash
cd "/Users/nobbylee/Desktop/Claude Code/网络架构图绘制工具/packages/web/src"
grep -rl "rounded-lg\|rounded-md" --include="*.tsx" . | while read -r f; do
  sed -i '' 's/rounded-lg/rounded-[var(--radius-sm)]/g; s/rounded-md/rounded-[var(--radius-sm)]/g' "$f"
done
```

- [ ] **Step 5: 修正例外 —— `TextNode.tsx` 的节点卡片圆角应该是容器级(`--radius-md`)不是按钮级**

`packages/web/src/nodes/TextNode.tsx` 第 36 行,Step 4 的批量替换会把它错误地改成 `rounded-[var(--radius-sm)]`,手工改回:

```tsx
      className="min-w-[80px] max-w-[280px] rounded-[var(--radius-md)] border px-2.5 py-1.5 shadow-sm"
```

- [ ] **Step 6: 验证无遗漏**

```bash
cd "/Users/nobbylee/Desktop/Claude Code/网络架构图绘制工具/packages/web/src"
grep -rn "rounded-lg\|rounded-md\|rounded-xl\|rounded-2xl" --include="*.tsx" .
```

Expected: 零匹配(`rounded-full` 不受影响,不用改)。

- [ ] **Step 7: 构建验证并提交**

```bash
cd "/Users/nobbylee/Desktop/Claude Code/网络架构图绘制工具/packages/web"
npm run build
```

```bash
cd "/Users/nobbylee/Desktop/Claude Code/网络架构图绘制工具"
git add -A -- packages/web/src
git commit -m "style: 主操作按钮改新主色,圆角统一收紧到 radius-sm/md"
```

---

### Task 4: 排版 —— 衬线标题 + 等宽数据文本

**Files:**
- Modify: `packages/web/src/pages/Login.tsx:52`
- Modify: `packages/web/src/pages/ProjectList.tsx:141,159,334,293-295,340-347`
- Modify: `packages/web/src/nodes/DeviceNode.tsx:81-86`
- Modify: `packages/web/src/edges/LabeledEdge.tsx:76`
- Modify: `packages/web/src/components/PropertyPanel.tsx:220,286,341`

**Interfaces:**
- Consumes:Task 1 产出的 `--font-serif`、`--font-mono`(已在 `@theme` 里注册,可直接用 Tailwind 的 `font-serif`/`font-mono` 类)。

- [ ] **Step 1: `Login.tsx` 标题衬线化**

第 52 行,原:

```tsx
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">TVT 网络架构图</h1>
```

改为:

```tsx
          <h1 className="nb-title text-lg">TVT 网络架构图</h1>
```

(`.nb-title` 已经包含 `font-family: var(--font-serif)` 和字重,不用再重复写 `font-semibold text-[var(--text-primary)]`。)

- [ ] **Step 2: `ProjectList.tsx` 标题与数据文本**

第 141 行,原:

```tsx
        <div className="text-sm font-semibold text-[var(--text-primary)]">TVT 网络架构图</div>
```

改为:

```tsx
        <div className="nb-title text-sm">TVT 网络架构图</div>
```

第 159 行,原:

```tsx
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">我的项目</h1>
```

改为:

```tsx
            <h1 className="nb-title text-xl">我的项目</h1>
```

第 334 行(项目卡片标题),原:

```tsx
                <div className="mb-1 text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)]">
```

改为:

```tsx
                <div className="nb-title mb-1 text-sm group-hover:text-[var(--accent)]">
```

第 293-295 行(更新时间戳),原:

```tsx
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {formatUpdatedAt(project.updatedAt)}
                    </span>
```

改为:

```tsx
                    <span className="font-mono text-[10px] text-[var(--text-muted)]">
                      {formatUpdatedAt(project.updatedAt)}
                    </span>
```

第 339-348 行(设备/连线计数),原:

```tsx
                <div className="mt-auto flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
                  {typeof project.deviceCount === 'number' && (
                    <span>{project.deviceCount} 设备</span>
                  )}
                  {typeof project.deviceCount === 'number' &&
                    typeof project.edgeCount === 'number' && <span>·</span>}
                  {typeof project.edgeCount === 'number' && (
                    <span>{project.edgeCount} 连线</span>
                  )}
                </div>
```

改为:

```tsx
                <div className="mt-auto flex items-center gap-3 font-mono text-[10px] text-[var(--text-muted)]">
                  {typeof project.deviceCount === 'number' && (
                    <span>{project.deviceCount} 设备</span>
                  )}
                  {typeof project.deviceCount === 'number' &&
                    typeof project.edgeCount === 'number' && <span>·</span>}
                  {typeof project.edgeCount === 'number' && (
                    <span>{project.edgeCount} 连线</span>
                  )}
                </div>
```

- [ ] **Step 3: `DeviceNode.tsx` 设备名衬线化,IP/型号等宽化**

第 80-96 行,原:

```tsx
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium text-[var(--text-primary)]">
              {data.name}
            </div>
            {data.model && (
              <div className="truncate text-[10px] text-[var(--text-muted)]">{data.model}</div>
            )}
          </div>
        </div>
        {data.ip && (
          <div
            className="mt-2 rounded px-2 py-0.5 font-mono text-[10px]"
            style={{ background: 'var(--hover-bg)', color: 'var(--text-secondary)' }}
          >
            {data.ip}
          </div>
        )}
```

改为:

```tsx
          <div className="min-w-0 flex-1">
            <div className="nb-title truncate text-xs">
              {data.name}
            </div>
            {data.model && (
              <div className="truncate font-mono text-[10px] text-[var(--text-muted)]">{data.model}</div>
            )}
          </div>
        </div>
        {data.ip && (
          <div
            className="mt-2 rounded px-2 py-0.5 font-mono text-[10px]"
            style={{ background: 'var(--hover-bg)', color: 'var(--text-secondary)' }}
          >
            {data.ip}
          </div>
        )}
```

(`data.ip` 这一行原本就已经是 `font-mono`,不用改,只是保留在上下文里方便定位。)

- [ ] **Step 4: `LabeledEdge.tsx` 连线标签等宽化**

第 73-90 行里的标签 `<div>`,原:

```tsx
          <div
            className="nodrag nopan pointer-events-none absolute max-w-[160px] truncate rounded border px-1.5 py-0.5 text-[9px] text-[var(--text-secondary)]"
```

改为:

```tsx
          <div
            className="nodrag nopan pointer-events-none absolute max-w-[160px] truncate rounded border px-1.5 py-0.5 font-mono text-[9px] text-[var(--text-secondary)]"
```

- [ ] **Step 5: `PropertyPanel.tsx` 分组小标题改 `.nb-kicker` 风格**

第 220、286、341 行,原(以 220 行为例,286/341 同结构):

```tsx
                <p className="mb-2 text-[10px] font-medium text-[var(--text-muted)]">基本信息</p>
```

改为:

```tsx
                <p className="nb-kicker mb-2">基本信息</p>
```

286 行:

```tsx
                <p className="mb-2 mt-3 text-[10px] font-medium text-[var(--text-muted)]">网络</p>
```

改为:

```tsx
                <p className="nb-kicker mb-2 mt-3">网络</p>
```

341 行左右(先用 Read 确认该行完整文本"容量与供电"所在的 `<p>` 标签,和前两处结构相同),同样替换成 `<p className="nb-kicker mb-2 mt-3">容量与供电</p>`。

- [ ] **Step 6: 构建验证并提交**

```bash
cd "/Users/nobbylee/Desktop/Claude Code/网络架构图绘制工具/packages/web"
npm run build
```

```bash
cd "/Users/nobbylee/Desktop/Claude Code/网络架构图绘制工具"
git add packages/web/src/pages/Login.tsx packages/web/src/pages/ProjectList.tsx packages/web/src/nodes/DeviceNode.tsx packages/web/src/edges/LabeledEdge.tsx packages/web/src/components/PropertyPanel.tsx
git commit -m "style: 标题衬线化,数据类文本等宽化"
```

---

### Task 5: 画布纸感背景(横向内页格线 + 装订红线)

**Files:**
- Modify: `packages/web/src/components/CanvasArea.tsx:409-459`

**Interfaces:**
- Consumes:Task 1 产出的 `--bg-rule`、`--margin-rule`。

- [ ] **Step 1: 把画布背景从点状网格换成横向格线**

第 453-459 行,原:

```tsx
        <Background
          id="dots"
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="var(--canvas-grid)"
        />
```

改为:

```tsx
        <Background
          id="rules"
          variant={BackgroundVariant.Lines}
          gap={[100000, 32]}
          lineWidth={1}
          color="var(--bg-rule)"
        />
```

(`gap` 传 `[横向间距, 纵向间距]`:横向给一个远超画布可视范围的极大值,实际视觉上就看不到竖线,只保留每 32px 一条的横线,模拟"内页格线"。)

- [ ] **Step 2: 加装订红线(固定在画布视口左侧,不随画布内容平移缩放)**

第 408-422 行,原:

```tsx
  return (
    <div
      ref={reactFlowWrapper}
      className="relative h-full w-full"
      onDragLeave={onDragLeave}
      onMouseMove={onPaneMouseMove}
      style={{
        cursor:
          canvasTool === 'text'
            ? 'text'
            : canvasTool === 'arrow'
              ? 'crosshair'
              : undefined,
      }}
    >
      <ReactFlow
```

改为:

```tsx
  return (
    <div
      ref={reactFlowWrapper}
      className="relative h-full w-full"
      onDragLeave={onDragLeave}
      onMouseMove={onPaneMouseMove}
      style={{
        cursor:
          canvasTool === 'text'
            ? 'text'
            : canvasTool === 'arrow'
              ? 'crosshair'
              : undefined,
      }}
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-12 z-10 w-[2px]"
        style={{ background: 'var(--margin-rule)' }}
      />
      <ReactFlow
```

- [ ] **Step 3: 开发服务器视觉验证**

```bash
cd "/Users/nobbylee/Desktop/Claude Code/网络架构图绘制工具/packages/web"
npm run dev &
sleep 2
curl -sf http://localhost:5173/ > /dev/null && echo "dev server up"
```

用 Task 8 统一做的浏览器截图验证画布效果(这里先确认 dev server 能起来、没有运行时报错即可,完整视觉走查放在最后一个 Task)。跑完记得 `kill %1` 或者 `pkill -f "vite"` 停掉,避免占用端口。

- [ ] **Step 4: 构建验证并提交**

```bash
cd "/Users/nobbylee/Desktop/Claude Code/网络架构图绘制工具/packages/web"
npm run build
```

```bash
cd "/Users/nobbylee/Desktop/Claude Code/网络架构图绘制工具"
git add packages/web/src/components/CanvasArea.tsx
git commit -m "style: 画布背景改横向内页格线 + 左侧装订红线"
```

---

### Task 6: 设备图标去照片化,统一矢量线条图标

**Files:**
- Modify: `packages/web/src/components/DeviceIcon.tsx`(删除 `photoIcons`/`hasPhotoIcon`,新增 `mobile-app` 矢量图标,`color` 不再由 `brand` 决定)
- Modify: `packages/web/src/nodes/DeviceNode.tsx:1-20,70-79`
- Modify: `packages/web/src/components/DeviceLibrary.tsx:1-57`
- Delete: `packages/web/src/assets/devices/ipc-bullet.png`、`ipc-dome.png`、`ptz.png`、`nvr.png`、`access.png`、`mobile-app.png`(改完确认没有其他引用后再删)

**Interfaces:**
- Produces:`DeviceIcon(props: { type: string; size?: number }): ReactElement` —— **`brand` 参数整体去掉**,图标不再区分品牌。
- 调用方影响:`DeviceNode.tsx`、`DeviceLibrary.tsx`、`DeviceFormModal.tsx` 三处 `<DeviceIcon .../>` 都要去掉 `brand` 属性传参(`DeviceFormModal.tsx:116` 那处也要改,虽然它本来传的是 `brand`,现在这个 prop 不存在了,TS 会报错提醒漏改)。

- [ ] **Step 1: 重写 `DeviceIcon.tsx`**

用 Read 工具确认当前完整文件(已在本 Task 规划阶段读过,236 行),整份用下面内容覆盖:

```tsx
import type { ReactElement } from 'react'

type DeviceIconProps = {
  type: string
  size?: number
}

function ServerRack({
  size,
  badge,
}: {
  size: number
  badge: string
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="3" width="16" height="5" rx="1.2" stroke="var(--ink)" strokeWidth="1.5" />
      <rect x="4" y="10" width="16" height="5" rx="1.2" stroke="var(--ink)" strokeWidth="1.5" />
      <rect x="4" y="17" width="16" height="4" rx="1.2" stroke="var(--ink)" strokeWidth="1.5" />
      <circle cx="7" cy="5.5" r="0.8" fill="var(--ink)" />
      <circle cx="7" cy="12.5" r="0.8" fill="var(--ink)" />
      <text
        x="16"
        y="13.2"
        textAnchor="middle"
        fontSize="5.5"
        fontWeight="700"
        fill="var(--ink)"
      >
        {badge}
      </text>
    </svg>
  )
}

export function DeviceIcon({ type, size = 24 }: DeviceIconProps) {
  const color = 'var(--ink)'

  const icons: Record<string, ReactElement> = {
    'ipc-turret': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M6 16c0-4 2.5-7 6-7s6 3 6 7"
          stroke={color}
          strokeWidth="1.5"
          fill="none"
        />
        <ellipse cx="12" cy="16" rx="7" ry="3" stroke={color} strokeWidth="1.5" />
        <circle cx="12" cy="14" r="2.2" fill={color} opacity="0.3" />
      </svg>
    ),
    'ipc-fisheye': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="1.5" />
        <circle cx="12" cy="12" r="4.5" stroke={color} strokeWidth="1.5" />
        <circle cx="12" cy="12" r="1.8" fill={color} opacity="0.35" />
      </svg>
    ),
    nvms: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="13" rx="2" stroke={color} strokeWidth="1.5" />
        <line x1="3" y1="20" x2="21" y2="20" stroke={color} strokeWidth="1.5" />
        <line x1="9" y1="17" x2="9" y2="20" stroke={color} strokeWidth="1.5" />
        <line x1="15" y1="17" x2="15" y2="20" stroke={color} strokeWidth="1.5" />
      </svg>
    ),
    server: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="4" y="3" width="16" height="6" rx="1.5" stroke={color} strokeWidth="1.5" />
        <rect x="4" y="11" width="16" height="6" rx="1.5" stroke={color} strokeWidth="1.5" />
        <circle cx="7" cy="6" r="1" fill={color} />
        <circle cx="7" cy="14" r="1" fill={color} />
      </svg>
    ),
    'server-forward': <ServerRack size={size} badge="转" />,
    'server-storage': <ServerRack size={size} badge="存" />,
    'server-manage': <ServerRack size={size} badge="管" />,
    decoder: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="8" width="12" height="8" rx="1.5" stroke={color} strokeWidth="1.5" />
        <path d="M15 10 L20 8 L20 16 L15 14" stroke={color} strokeWidth="1.5" fill="none" />
      </svg>
    ),
    videowall: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="5" width="8" height="6" rx="1" stroke={color} strokeWidth="1.5" />
        <rect x="13" y="5" width="8" height="6" rx="1" stroke={color} strokeWidth="1.5" />
        <rect x="3" y="13" width="8" height="6" rx="1" stroke={color} strokeWidth="1.5" />
        <rect x="13" y="13" width="8" height="6" rx="1" stroke={color} strokeWidth="1.5" />
      </svg>
    ),
    switch: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="8" width="20" height="8" rx="2" stroke={color} strokeWidth="1.5" />
        {[5, 8, 11, 14, 17].map((x) => (
          <rect key={x} x={x} y="10" width="2" height="4" rx="0.5" fill={color} opacity="0.4" />
        ))}
      </svg>
    ),
    router: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="4" y="10" width="16" height="8" rx="2" stroke={color} strokeWidth="1.5" />
        <line x1="8" y1="10" x2="8" y2="6" stroke={color} strokeWidth="1.5" />
        <line x1="12" y1="10" x2="12" y2="5" stroke={color} strokeWidth="1.5" />
        <line x1="16" y1="10" x2="16" y2="6" stroke={color} strokeWidth="1.5" />
      </svg>
    ),
    firewall: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3z"
          stroke={color}
          strokeWidth="1.5"
        />
        <path d="M9 12l2 2 4-4" stroke={color} strokeWidth="1.5" />
      </svg>
    ),
    pc: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="12" rx="1.5" stroke={color} strokeWidth="1.5" />
        <path d="M8 20h8M12 16v4" stroke={color} strokeWidth="1.5" />
      </svg>
    ),
    ap: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="16" r="2" fill={color} opacity="0.35" stroke={color} strokeWidth="1.2" />
        <path d="M8 13a5.5 5.5 0 0 1 8 0" stroke={color} strokeWidth="1.5" />
        <path d="M5.5 10a9 9 0 0 1 13 0" stroke={color} strokeWidth="1.5" />
        <path d="M3.5 7a12 12 0 0 1 17 0" stroke={color} strokeWidth="1.5" />
      </svg>
    ),
    cloud: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M7 18h10a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.6-1.5A3.5 3.5 0 0 0 7 18z"
          stroke={color}
          strokeWidth="1.5"
        />
      </svg>
    ),
    'ipc-bullet': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="4" y="8" width="14" height="8" rx="2" stroke={color} strokeWidth="1.5" />
        <path d="M18 10 L22 8 L22 16 L18 14" stroke={color} strokeWidth="1.5" fill="none" />
        <circle cx="8" cy="12" r="2" fill={color} opacity="0.3" />
      </svg>
    ),
    'ipc-dome': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <ellipse cx="12" cy="14" rx="8" ry="5" stroke={color} strokeWidth="1.5" />
        <path d="M12 9 L12 6" stroke={color} strokeWidth="1.5" />
        <circle cx="12" cy="14" r="2.5" fill={color} opacity="0.3" />
      </svg>
    ),
    ptz: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="8" y="16" width="8" height="4" rx="1" stroke={color} strokeWidth="1.5" />
        <ellipse cx="12" cy="11" rx="6" ry="5" stroke={color} strokeWidth="1.5" />
        <circle cx="12" cy="11" r="2" fill={color} opacity="0.3" />
      </svg>
    ),
    nvr: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="6" width="18" height="12" rx="2" stroke={color} strokeWidth="1.5" />
        <circle cx="7" cy="12" r="1" fill={color} />
        <circle cx="11" cy="12" r="1" fill={color} />
        <line x1="14" y1="10" x2="19" y2="10" stroke={color} strokeWidth="1.5" />
        <line x1="14" y1="14" x2="17" y2="14" stroke={color} strokeWidth="1.5" />
      </svg>
    ),
    dvr: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="7" width="18" height="10" rx="2" stroke={color} strokeWidth="1.5" />
        <rect x="5" y="9" width="3" height="2" rx="0.5" fill={color} opacity="0.4" />
        <rect x="9" y="9" width="3" height="2" rx="0.5" fill={color} opacity="0.4" />
        <rect x="13" y="9" width="3" height="2" rx="0.5" fill={color} opacity="0.4" />
      </svg>
    ),
    access: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="6" y="3" width="12" height="18" rx="2" stroke={color} strokeWidth="1.5" />
        <circle cx="12" cy="12" r="2" stroke={color} strokeWidth="1.5" />
        <line x1="12" y1="16" x2="12" y2="18" stroke={color} strokeWidth="1.5" />
      </svg>
    ),
    'mobile-app': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="7" y="2" width="10" height="20" rx="2" stroke={color} strokeWidth="1.5" />
        <line x1="7" y1="17.5" x2="17" y2="17.5" stroke={color} strokeWidth="1.5" />
        <circle cx="12" cy="19.6" r="0.9" fill={color} />
      </svg>
    ),
  }

  return icons[type] ?? icons['ipc-bullet']
}
```

- [ ] **Step 2: `DeviceNode.tsx` 去掉 `isPhoto`/`isNvr` 尺寸分支**

第 1-20 行,原:

```tsx
import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { DeviceIcon, hasPhotoIcon } from '../components/DeviceIcon'
import { brandColors } from '../data/deviceLibrary'
import { useValidationStore } from '../stores/validationStore'
import type { DeviceNode } from '../types/diagram'

function resolveBrandColor(brand: string) {
  return brand in brandColors
    ? brandColors[brand as keyof typeof brandColors]
    : brandColors.generic
}

function DeviceNodeComponent({ id, data, selected }: NodeProps<DeviceNode>) {
  const brandColor = resolveBrandColor(String(data.brand))
  const hasExtra = Boolean(data.model || data.ip)
  const isPhoto = hasPhotoIcon(String(data.icon), String(data.brand))
  const isNvr = isPhoto && (data.icon === 'nvr' || data.icon === 'dvr')
  const iconBox = isNvr ? 'h-12 w-12' : isPhoto ? 'h-10 w-10' : 'h-8 w-8 rounded-[var(--radius-sm)]'
  const iconSize = isNvr ? 48 : isPhoto ? 36 : 20
```

改为:

```tsx
import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { DeviceIcon } from '../components/DeviceIcon'
import { brandColors } from '../data/deviceLibrary'
import { useValidationStore } from '../stores/validationStore'
import type { DeviceNode } from '../types/diagram'

function resolveBrandColor(brand: string) {
  return brand in brandColors
    ? brandColors[brand as keyof typeof brandColors]
    : brandColors.generic
}

function DeviceNodeComponent({ id, data, selected }: NodeProps<DeviceNode>) {
  const brandColor = resolveBrandColor(String(data.brand))
  const hasExtra = Boolean(data.model || data.ip)
  const iconBox = 'h-8 w-8 rounded-[var(--radius-sm)]'
  const iconSize = 20
```

(注意:这个文件在 Task 3 里已经把 `rounded-md` 批量替换成了 `rounded-[var(--radius-sm)]`,上面 `iconBox` 的原文本要以 Task 3 跑完之后的实际内容为准 —— 用 Read 工具先确认当前这两行的准确文本,再做替换,避免 `old_string` 对不上。)

第 69-79 行,原:

```tsx
          <div
            className={`flex shrink-0 items-center justify-center ${iconBox}`}
            style={isPhoto ? undefined : { background: `${brandColor}14` }}
          >
            <DeviceIcon
              type={String(data.icon)}
              brand={String(data.brand)}
              size={iconSize}
            />
          </div>
```

改为:

```tsx
          <div
            className={`flex shrink-0 items-center justify-center ${iconBox}`}
            style={{ background: `${brandColor}14` }}
          >
            <DeviceIcon type={String(data.icon)} size={iconSize} />
          </div>
```

- [ ] **Step 3: `DeviceLibrary.tsx` 的 `DeviceCard` 同样去掉照片分支**

第 1-57 行(已在规划阶段读过),`DeviceCard` 函数改为:

```tsx
import { useEffect, useState } from 'react'
import {
  brandColors,
  loadDeviceLibrary,
  saveDeviceLibrary,
  type DeviceCategory,
  type DeviceItem,
} from '../data/deviceLibrary'
import { DeviceIcon } from './DeviceIcon'
import {
  ConfirmDeleteModal,
  DeviceFormModal,
  type DeviceFormValues,
} from './DeviceFormModal'
import { useUiStore } from '../stores/uiStore'

function DeviceCard({
  item,
  onEdit,
  onDelete,
}: {
  item: DeviceItem
  onEdit: () => void
  onDelete: () => void
}) {
  const brandColor = brandColors[item.brand]
  const setDraggingDevice = useUiStore((s) => s.setDraggingDevice)

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/tvt-device', JSON.stringify(item))
        e.dataTransfer.effectAllowed = 'move'
        setDraggingDevice(true)
      }}
      onDragEnd={() => setDraggingDevice(false)}
      className="group flex cursor-grab items-center gap-2 rounded-[var(--radius-sm)] border px-2 py-1.5 transition-all hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] active:cursor-grabbing"
      style={{
        borderColor: 'var(--panel-border)',
        background: 'var(--panel-bg)',
      }}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)]"
        style={{ background: `${brandColor}14` }}
      >
        <DeviceIcon type={item.icon} size={20} />
      </div>
      <span className="min-w-0 flex-1 truncate text-xs text-[var(--text-primary)] group-hover:text-[var(--accent)]">
        {item.name}
      </span>
      <div className="flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          title="编辑"
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:text-[var(--accent)]"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M8.5 1.5l2 2L4 10H2V8L8.5 1.5z"
              stroke="currentColor"
              strokeWidth="1.1"
            />
          </svg>
        </button>
        <button
          type="button"
          title="删除"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-muted)] hover:bg-red-50 hover:text-red-500"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
      </div>
    </div>
  )
}
```

(只替换到这里为止 —— 文件后面 `DeviceCard` 之外的部分,以及本文件里已经存在的其余 `hasPhotoIcon`/`DeviceIcon` 用法如果还有,用下一步的 grep 统一检查。)

- [ ] **Step 4: `DeviceFormModal.tsx` 去掉传给 `DeviceIcon` 的 `brand`**

第 116 行,原:

```tsx
                    <DeviceIcon type={opt.value} brand={brand} size={20} />
```

改为:

```tsx
                    <DeviceIcon type={opt.value} size={20} />
```

- [ ] **Step 5: 确认没有遗留引用**

```bash
cd "/Users/nobbylee/Desktop/Claude Code/网络架构图绘制工具/packages/web/src"
grep -rn "hasPhotoIcon\|photoIcons" --include="*.tsx" --include="*.ts" .
```

Expected: 只在 `utils/exportPdf.ts` 里还有(Task 7 处理),其余零匹配。

- [ ] **Step 6: 类型检查(会暴露漏改的 `brand` 传参)**

```bash
cd "/Users/nobbylee/Desktop/Claude Code/网络架构图绘制工具/packages/web"
npx tsc -b --noEmit
```

Expected: 无报错。如果报 `Property 'brand' does not exist on type 'DeviceIconProps'` 之类的错误,说明还有调用点没改,按报错位置补上。

- [ ] **Step 7: 删除不再使用的产品照片资源**

```bash
cd "/Users/nobbylee/Desktop/Claude Code/网络架构图绘制工具/packages/web/src/assets/devices"
grep -rln "ipc-bullet.png\|ipc-dome.png\|ptz.png\|nvr.png\|access.png\|mobile-app.png" ../.. --include="*.tsx" --include="*.ts" 2>/dev/null
```

Expected: 零匹配(确认没有别处 import 这几张图之后再删)。

```bash
cd "/Users/nobbylee/Desktop/Claude Code/网络架构图绘制工具/packages/web/src/assets/devices"
rm -f ipc-bullet.png ipc-dome.png ptz.png nvr.png access.png mobile-app.png
ls .
```

Expected: 目录里这 6 个文件已删除;如果目录里还有其他类型(如 `dvr.png`,虽然 `photoIcons` 里 `dvr` 复用的是 `nvr.png`,理论上没有单独的 `dvr.png`)保持不动。

- [ ] **Step 8: 构建验证并提交**

```bash
cd "/Users/nobbylee/Desktop/Claude Code/网络架构图绘制工具/packages/web"
npm run build
```

```bash
cd "/Users/nobbylee/Desktop/Claude Code/网络架构图绘制工具"
git add -A -- packages/web/src/components/DeviceIcon.tsx packages/web/src/nodes/DeviceNode.tsx packages/web/src/components/DeviceLibrary.tsx packages/web/src/components/DeviceFormModal.tsx packages/web/src/assets/devices
git commit -m "style: 设备图标去照片化,统一为墨色矢量线条图标"
```

---

### Task 7: PDF 导出图例与硬编码配色同步新 token

**Files:**
- Modify: `packages/web/src/utils/exportPdf.ts`

**Interfaces:**
- Consumes:无(Canvas 2D API 不支持 `var()`,本文件继续用字面量十六进制值,但要和 `index.css` 里对应 token 的值一致)。

- [ ] **Step 1: 去掉 `photoIcons` 依赖,图例改成统一色块**

第 1-2 行,原:

```tsx
import { jsPDF } from 'jspdf'
import { photoIcons } from '../components/DeviceIcon'
import { iconOptions } from '../data/deviceLibrary'
```

改为:

```tsx
import { jsPDF } from 'jspdf'
import { iconOptions } from '../data/deviceLibrary'
```

第 133-153 行(图例绘制循环),原:

```tsx
  const icons = collectDeviceIcons(nodes)
  ctx.font = '12px "PingFang SC","Microsoft YaHei",sans-serif'
  for (const icon of icons) {
    const photo = photoIcons[icon]
    if (photo) {
      try {
        const img = await loadImage(photo)
        ctx.drawImage(img, legendX, legendY - 2, 20, 20)
      } catch {
        ctx.fillStyle = '#0066cc'
        ctx.fillRect(legendX, legendY, 16, 16)
      }
    } else {
      ctx.fillStyle = '#64748b'
      ctx.fillRect(legendX, legendY, 16, 16)
    }
    ctx.fillStyle = '#334155'
    ctx.fillText(iconLabel(icon), legendX + 28, legendY + 13)
    legendY += 28
    if (legendY > diagramBottom - 80) break
  }
```

改为:

```tsx
  const icons = collectDeviceIcons(nodes)
  ctx.font = '12px "PingFang SC","Microsoft YaHei",sans-serif'
  for (const icon of icons) {
    ctx.fillStyle = '#2f5d50'
    ctx.fillRect(legendX, legendY, 16, 16)
    ctx.fillStyle = '#1c2838'
    ctx.fillText(iconLabel(icon), legendX + 28, legendY + 13)
    legendY += 28
    if (legendY > diagramBottom - 80) break
  }
```

(所有设备类型统一用主色 `#2f5d50`(= `--accent`)的色块代表,不再区分品牌/照片,和画布上"图标统一墨色线条"的方向一致 —— 图例本来就是示意性质,不需要还原每个图标的具体线条画法。)

- [ ] **Step 2: 顶栏、正文、背景色同步新 token**

第 90-95 行,原:

```tsx
  // 顶栏
  ctx.fillStyle = '#0066cc'
  ctx.fillRect(0, 0, pageW, titleH)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 22px "PingFang SC","Microsoft YaHei",sans-serif'
  ctx.fillText('TVT 网络架构图', margin, 34)
```

改为:

```tsx
  // 顶栏
  ctx.fillStyle = '#2f5d50'
  ctx.fillRect(0, 0, pageW, titleH)
  ctx.fillStyle = '#fbf8f1'
  ctx.font = 'bold 22px "PingFang SC","Microsoft YaHei",sans-serif'
  ctx.fillText('TVT 网络架构图', margin, 34)
```

第 104-115 行,原:

```tsx
  // 项目副标题
  ctx.fillStyle = '#0f172a'
  ctx.font = '14px "PingFang SC","Microsoft YaHei",sans-serif'
  const subtitle = meta.projectName || '未命名项目'
  ctx.fillText(subtitle, margin, titleH + 20)

  // 拓扑图区域底色
  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(diagramLeft, diagramTop, diagramW, diagramH)
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 1
  ctx.strokeRect(diagramLeft, diagramTop, diagramW, diagramH)
```

改为:

```tsx
  // 项目副标题
  ctx.fillStyle = '#1c2838'
  ctx.font = '14px "PingFang SC","Microsoft YaHei",sans-serif'
  const subtitle = meta.projectName || '未命名项目'
  ctx.fillText(subtitle, margin, titleH + 20)

  // 拓扑图区域底色
  ctx.fillStyle = '#fbf8f1'
  ctx.fillRect(diagramLeft, diagramTop, diagramW, diagramH)
  ctx.strokeStyle = '#d5cfc2'
  ctx.lineWidth = 1
  ctx.strokeRect(diagramLeft, diagramTop, diagramW, diagramH)
```

第 128-130 行(图例标题),原:

```tsx
  ctx.fillStyle = '#0f172a'
  ctx.font = 'bold 13px "PingFang SC","Microsoft YaHei",sans-serif'
  ctx.fillText('图例', legendX, legendY + 14)
```

改为:

```tsx
  ctx.fillStyle = '#1c2838'
  ctx.font = 'bold 13px "PingFang SC","Microsoft YaHei",sans-serif'
  ctx.fillText('图例', legendX, legendY + 14)
```

第 156-174 行(连接类型图例标题与文字色,注意 `CONN_COLORS` 本身**不改**,只改标题/正文的墨色):

```tsx
  const connTypes = collectConnectionTypes(edges)
  if (connTypes.length > 0 && legendY < diagramBottom - 40) {
    legendY += 8
    ctx.fillStyle = '#1c2838'
    ctx.font = 'bold 13px "PingFang SC","Microsoft YaHei",sans-serif'
    ctx.fillText('连接类型', legendX, legendY + 14)
    legendY += 28
    ctx.font = '12px "PingFang SC","Microsoft YaHei",sans-serif'
    for (const t of connTypes) {
      ctx.strokeStyle = CONN_COLORS[t] ?? '#64748b'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(legendX, legendY + 8)
      ctx.lineTo(legendX + 22, legendY + 8)
      ctx.stroke()
      ctx.fillStyle = '#1c2838'
      ctx.fillText(t, legendX + 28, legendY + 12)
      legendY += 24
    }
  }
```

第 176-211 行(底栏图签),把其中的墨色/边框/次要文字色同步替换:

```tsx
  // 底栏图签
  const stampY = pageH - stampH
  ctx.fillStyle = '#e7e1d4'
  ctx.fillRect(0, stampY, pageW, stampH)
  ctx.strokeStyle = '#d5cfc2'
  ctx.beginPath()
  ctx.moveTo(0, stampY)
  ctx.lineTo(pageW, stampY)
  ctx.stroke()

  const cells: [string, string][] = [
    ['项目名称', meta.projectName || '未命名项目'],
    ['客户', meta.customer?.trim() || '—'],
    ['编制人', meta.author?.trim() || '—'],
    ['日期', formatDate()],
  ]
  const cellW = pageW / cells.length
  ctx.font = '11px "PingFang SC","Microsoft YaHei",sans-serif'
  cells.forEach(([label, value], i) => {
    const x = i * cellW + 16
    ctx.fillStyle = '#5a6574'
    ctx.fillText(label, x, stampY + 24)
    ctx.fillStyle = '#1c2838'
    ctx.font = 'bold 13px "PingFang SC","Microsoft YaHei",sans-serif'
    const truncated =
      value.length > 22 ? `${value.slice(0, 22)}…` : value
    ctx.fillText(truncated, x, stampY + 48)
    ctx.font = '11px "PingFang SC","Microsoft YaHei",sans-serif'
    if (i > 0) {
      ctx.strokeStyle = '#d5cfc2'
      ctx.beginPath()
      ctx.moveTo(i * cellW, stampY + 8)
      ctx.lineTo(i * cellW, pageH - 8)
      ctx.stroke()
    }
  })
```

- [ ] **Step 2: 类型检查**

```bash
cd "/Users/nobbylee/Desktop/Claude Code/网络架构图绘制工具/packages/web"
npx tsc -b --noEmit
```

Expected: 无报错(`photoIcons` import 删除后如果还有残留引用会在这一步暴露)。

- [ ] **Step 3: 单测验证**

```bash
cd "/Users/nobbylee/Desktop/Claude Code/网络架构图绘制工具/packages/web"
npm test -- exportImage
```

Expected: `exportImage.test.ts` 通过(这个文件没改,但 `exportPdf.ts` 引用了它的 `safeExportFilename`,顺带确认没有被破坏)。

- [ ] **Step 4: 构建验证并提交**

```bash
cd "/Users/nobbylee/Desktop/Claude Code/网络架构图绘制工具/packages/web"
npm run build
```

```bash
cd "/Users/nobbylee/Desktop/Claude Code/网络架构图绘制工具"
git add packages/web/src/utils/exportPdf.ts
git commit -m "style: PDF 导出图例与图签配色同步新设计令牌"
```

---

### Task 8: 全量验证

**Files:** 无代码改动,纯验证。

- [ ] **Step 1: 完整单测 + 构建**

```bash
cd "/Users/nobbylee/Desktop/Claude Code/网络架构图绘制工具/packages/web"
npm test
npm run build
```

Expected: 单测全部通过(改版前是 41 个测试 7 个文件,数量不应减少);`tsc -b && vite build` 无报错。

- [ ] **Step 2: server 端类型检查(exportPdf/DeviceIcon 改动不涉及 server,但按规范照跑一次确认没有连带影响)**

```bash
cd "/Users/nobbylee/Desktop/Claude Code/网络架构图绘制工具/packages/server"
npx tsc --noEmit
```

Expected: 无报错。

- [ ] **Step 3: 启动 server + web dev,浏览器走查登录页 → 项目列表 → 编辑器**

```bash
cd "/Users/nobbylee/Desktop/Claude Code/网络架构图绘制工具/packages/server"
npm run dev > /tmp/tvt-server-dev.log 2>&1 &
echo $! > /tmp/tvt-server.pid
cd "/Users/nobbylee/Desktop/Claude Code/网络架构图绘制工具/packages/web"
npm run dev > /tmp/tvt-web-dev.log 2>&1 &
echo $! > /tmp/tvt-web.pid
timeout 30 bash -c 'until curl -sf http://localhost:5173/ >/dev/null; do sleep 1; done'
```

(如果 3001/5173 端口已经被其他进程占用是正常的——说明之前已经有 dev server 在跑,直接跳过起服务这一步,复用现有实例即可。)

用浏览器自动化工具(headless Chromium,项目里已经装了 `playwright` devDependency 或按 `run` 技能里的模式)依次:

1. `nav http://localhost:5173/` → 截图确认登录页是暖色纸面 + 衬线标题 + 墨绿按钮。
2. 用 `admin`/`admin123` 登录 → 截图项目列表页,确认卡片是纸面风格、圆角收紧、新建按钮墨绿色。
3. 打开任意一个项目 → 截图编辑器整体布局,确认:画布背景是横线内页格线 + 左侧装订红线;左侧元件库设备图标全部是墨色线条(没有照片);工具栏/属性面板配色是新 token。
4. 拖一个设备到画布上,点击选中,确认属性面板分组标题("基本信息"等)是等宽字体小标签样式。
5. 如果画布上能触发一次配置校验错误(比如两个设备填相同 IP),确认节点描边和校验面板徽标是新的赭红/赭黄色,不是旧的玫红/橙色。
6. 触发一次 PDF 导出,确认下载的文件能打开,顶栏/图签配色是新 token,图例是统一墨绿色块。

Expected:以上 6 步都符合预期,浏览器 console 没有报错(`console --errors` 为空)。

- [ ] **Step 4: 停止 dev server**

```bash
kill "$(cat /tmp/tvt-web.pid)" 2>/dev/null
# 只有 Step 3 里实际是本任务新启动 server dev(而不是复用已有实例)时才 kill 它
```

- [ ] **Step 5: 向用户报告完成**

汇总:8 个 Task 全部完成,单测/构建/类型检查通过,浏览器走查确认视觉效果符合设计 spec。之前搁置的 9 个 bug 和登录集成方式仍待后续处理,不在本次改版范围内。

---

## Spec 覆盖自检

| Spec 章节 | Task |
|---|---|
| 二、设计令牌 | 1 |
| 三、组件层落地方式(全局壳) | 2、3、4 |
| 三、组件层落地方式(画布) | 5 |
| 3.2 设备图标 | 6 |
| 3.3 PDF 图例 | 7 |
| 四、不改范围 | Global Constraints 已列出排除项 |
| 五、验证方式 | 8 |
