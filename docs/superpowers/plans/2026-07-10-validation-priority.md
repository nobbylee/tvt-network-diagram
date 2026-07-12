# 配置校验优先（v1.5）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为技术支持排障提供前端配置校验：IP 冲突 → NVR 通道 → PoE 预算，配合问题列表 + 画布高亮；并补齐扩展字段、`.narch` 1.2、未保存提示与最小项目归属。

**Architecture:** 纯函数校验引擎 `packages/web/src/validation/`（零 UI 依赖）+ `validationStore`；`Editor` 内防抖订阅画布变更；问题底栏 + 节点/边高亮。服务端对齐 `.narch` 1.2 与按 `author_id` 过滤。

**Tech Stack:** React 19、Zustand、React Flow、Vitest（新建）、Fastify、SQLite、TypeScript

**Spec:** `docs/superpowers/specs/2026-07-10-validation-priority-design.md`

**Commits:** 用户未要求自动提交时，各 Task 完成验证即可，**不要** `git commit`，除非用户明确要求。

---

## 文件结构

| 路径 | 职责 |
|------|------|
| `packages/web/src/types/diagram.ts` | 扩展 DeviceNodeData / ConnectionEdgeData |
| `packages/web/src/validation/types.ts` | ValidationIssue、RuleId、Severity |
| `packages/web/src/validation/defaults.ts` | 默认功耗表 |
| `packages/web/src/validation/ip.ts` | IP 解析、格式、冲突、同网段 |
| `packages/web/src/validation/nvrChannels.ts` | NVR 通道规则 |
| `packages/web/src/validation/poe.ts` | PoE 预算/口数 |
| `packages/web/src/validation/subnet.ts` | VLAN 混用警告 |
| `packages/web/src/validation/validateDiagram.ts` | 汇总入口 |
| `packages/web/src/validation/index.ts` | 导出 |
| `packages/web/src/stores/validationStore.ts` | 校验 UI 状态 |
| `packages/web/src/components/ValidationPanel.tsx` | 底栏问题列表 |
| `packages/web/src/components/ValidationController.tsx` | 防抖重算 |
| `packages/web/src/utils/narch.ts` | 升 1.2，读写新字段 |
| `packages/server/src/narch.ts` | 与前端同构（text/anchor/annotation + 新字段） |
| `packages/web/vitest.config.ts` + `package.json` scripts | 单测 |
| 修改：PropertyPanel、DeviceNode、LabeledEdge、Toolbar、Editor、canvasStore、deviceLibrary、projects 路由 | UI/地基 |

---

### Task 1: Vitest + 类型扩展 + IP 校验（TDD）

**Files:**
- Create: `packages/web/vitest.config.ts`
- Create: `packages/web/src/validation/types.ts`
- Create: `packages/web/src/validation/ip.ts`
- Create: `packages/web/src/validation/ip.test.ts`
- Modify: `packages/web/package.json`（加 vitest、`test` script）
- Modify: `packages/web/src/types/diagram.ts`

- [ ] **Step 1: 安装 vitest 并配置**

在 `packages/web`：

```bash
npm install -D vitest
```

`vitest.config.ts`：

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
```

`package.json` scripts 增加：`"test": "vitest run"`, `"test:watch": "vitest"`

- [ ] **Step 2: 扩展 diagram 类型**

`DeviceNodeData` 增加：`subnetMask?`, `gateway?`, `maxChannels?`, `poeBudgetW?`, `poePortCount?`, `powerDrawW?`, `mac?`, `location?`

`ConnectionEdgeData` 增加：`vlan?`, `bandwidthMbps?`

- [ ] **Step 3: 写失败的 IP 测试**

`ip.test.ts` 覆盖：相同 IP 冲突（error）、空 IP 跳过、非法格式 warning、`normalizeIp` 去空格。

- [ ] **Step 4: 实现 `types.ts` + `ip.ts` 使测试通过**

导出：`parseIPv4`, `normalizeIp`, `checkIpIssues(nodes) => ValidationIssue[]`

RuleId：`'ip-format' | 'ip-conflict' | 'ip-subnet' | 'nvr-channels' | 'nvr-channels-missing' | 'poe-budget' | 'poe-headroom' | 'poe-ports' | 'poe-unestimated' | 'vlan-mix'`

- [ ] **Step 5: 运行 `npm test`，全部 PASS**

---

### Task 2: NVR + PoE + subnet + validateDiagram（TDD）

**Files:**
- Create: `defaults.ts`, `nvrChannels.ts`, `poe.ts`, `subnet.ts`, `validateDiagram.ts`, `index.ts`
- Create: 对应 `*.test.ts`

- [ ] **Step 1: NVR 测试** — 满通道不报错；超 1 报 error；未填 maxChannels 出 `nvr-channels-missing` warning；非 IPC 不计

- [ ] **Step 2: 实现 nvrChannels.ts**

摄像机 icon：`ipc-bullet|ipc-dome|ipc-turret|ipc-fisheye|ptz`；录像机：`nvr|dvr`；只统计 `type!=='annotation'` 的直连边。

- [ ] **Step 3: PoE 测试** — 超预算 error；>80% warning；默认功耗 `estimated:true`；口数超限；未填预算跳过

- [ ] **Step 4: 实现 defaults.ts + poe.ts**

- [ ] **Step 5: subnet VLAN 混用 warning + validateDiagram 汇总**

`validateDiagram(nodes, edges)` 按顺序 concat：ip → nvr → poe → subnet

- [ ] **Step 6: `npm test` PASS**

---

### Task 3: `.narch` 1.2 前后端对齐

**Files:**
- Modify: `packages/web/src/utils/narch.ts`
- Modify: `packages/server/src/narch.ts`
- Create: `packages/web/src/utils/narch.test.ts`（往返：设备新字段 + text + annotation）

- [ ] **Step 1: 前端导出 version `'1.2'`，节点/边写入全部新字段；导入读回**

- [ ] **Step 2: 服务端 `diagramToNarch` / `narchToDiagram` 支持 text/anchor/annotation 与新字段（对齐前端逻辑，勿再只导出设备）**

- [ ] **Step 3: 往返测试 PASS**

---

### Task 4: validationStore + ValidationController + ValidationPanel

**Files:**
- Create: `stores/validationStore.ts`
- Create: `components/ValidationController.tsx`
- Create: `components/ValidationPanel.tsx`
- Modify: `pages/Editor.tsx`

- [ ] **Step 1: validationStore** — `enabled`(默认 true), `issues`, `ignoredIds: string[]`, `setEnabled`, `setIssues`, `ignoreIssue`, `clearIgnored`, `visibleIssues` getter 或 selector

- [ ] **Step 2: ValidationController** — 订阅 nodes/edges/enabled，debounce 300ms 调 `validateDiagram` → `setIssues`

- [ ] **Step 3: ValidationPanel** — 底栏；错误/警告分组；定位（`useReactFlow` 需在 ReactFlowProvider 内——若 CanvasArea 已有 Provider，面板放其内或通过 store 存 `focusRequest` 由 CanvasArea 执行居中）；忽略按钮

**定位实现建议：** `validationStore.focusTarget: { nodeId?, edgeId? } | null`；`CanvasArea` 监听后 `setCenter` + `selectNode`/`selectEdge`。

- [ ] **Step 4: Editor 布局加入 Controller + Panel**

---

### Task 5: 画布高亮 + 属性面板分组 + Toolbar 校验控件

**Files:**
- Modify: `DeviceNode.tsx`, `LabeledEdge.tsx`（或 edges 组件）
- Modify: `PropertyPanel.tsx`
- Modify: `Toolbar.tsx`
- Modify: `CanvasArea.tsx`（响应 focusTarget）

- [ ] **Step 1: DeviceNode** 读 visible issues；error 红描边 / warning 橙；右上角红点

- [ ] **Step 2: LabeledEdge** 问题边加粗变色

- [ ] **Step 3: PropertyPanel** 分组：基本 / 网络 / 容量与供电（按 icon 条件显示字段）

- [ ] **Step 4: Toolbar** 校验开关、错误/警告徽章、「立即校验」；`Ctrl/⌘+S` 触发保存（抽 `save` 回调或自定义事件）

---

### Task 6: dirty 未保存提示 + 默认库补全 + 最小项目归属

**Files:**
- Modify: `canvasStore.ts` — `dirty` 标志；结构性变更与 `updateNodeData`/`updateEdgeData` 置 true；`resetDiagram`/保存成功清 false（保存清零在 Toolbar 保存成功后 `markClean()`）
- Modify: `Editor.tsx` / `Toolbar.tsx` — 返回确认；`beforeunload`
- Modify: `deviceLibrary.ts` — 默认 TVT 增加 turret/fisheye/nvms/decoder/videowall 等
- Modify: `packages/server/src/routes/projects.ts` — 非 admin 仅 `author_id = 当前用户`；admin（username===`admin`）看全部；创建时写 `author_id`；旧 `author_id` 为空的项目仅 admin 可见
- Modify: `auth.ts` 如需导出判断 admin 的辅助函数

- [ ] **Step 1–4: 实现并手工/接口级验证列表隔离**

---

### Task 7: 文档更新 + 全量验证

**Files:**
- Modify: `docs/使用说明书.md`, `docs/开发说明.md`, `README.md`

- [ ] **Step 1: 说明书增加「配置校验」**
- [ ] **Step 2: 开发说明 v1.5 勾选**
- [ ] **Step 3: `npm test` + `npm run build`（web）+ server `tsc` 如有**

---

## Spec 覆盖自检

| Spec 项 | Task |
|---------|------|
| IP/NVR/PoE/VLAN 规则 | 1–2 |
| 面板+高亮+定位 | 4–5 |
| 扩展字段+narch 1.2 | 1,3,5 |
| dirty/Ctrl+S/默认库/归属 | 5–6 |
| 文档 | 7 |
| 不做 PDF/仿真 | 无任务 ✓ |
