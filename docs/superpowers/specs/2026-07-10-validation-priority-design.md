# 配置校验优先（v1.5）— 设计规格

> 日期：2026-07-10  
> 状态：待用户审阅  
> 产品方向：技术支持 / 现场排障复现（用户选择 B）  
> 呈现方式：画布高亮 + 问题列表面板（用户选择 C）  
> 校验顺序：IP 打底 → NVR 通道 → PoE 预算（用户选择 D）  
> 授权：其余细节按推荐方案自行补全

---

## 1. 目标与成功标准

### 1.1 目标

让技术支持在还原客户拓扑后，**一键发现配置问题**，点击即可定位到出错设备/连线，减少口头对 IP、通道、PoE 的反复确认。

### 1.2 成功标准

| 标准 | 可验证表现 |
|------|------------|
| IP 冲突可发现 | 两台设备填相同 IP → 错误级问题，双方高亮 |
| 同网段提示 | 有掩码时，同交换机下跨网段设备 → 警告 |
| NVR 通道可发现 | 接入 IPC 数 > NVR `maxChannels` → 错误 |
| PoE 预算可发现 | 接入 PoE 设备功耗合计 > 交换机预算 → 错误/警告 |
| 可定位 | 点击问题列表项 → 选中并居中对应节点/边 |
| 不打断绘图 | 未填字段不报错；校验可随时开关；空字段跳过 |
| 数据可带走 | 扩展字段写入 `.narch`，导入导出不丢 |

### 1.3 非目标（本规格不做）

- 实时协同编辑
- PDF / PNG 正式出图（仍属后续交付线）
- 网络仿真 / Docker 环境生成（v2.0）
- 子网/VLAN 全图路由可达性证明（仅做轻量一致性警告）
- 自动从型号库查功耗/通道（第一版靠用户填写 + 合理默认值）

---

## 2. 方案选择

### 2.1 备选

| 方案 | 做法 | 优点 | 缺点 |
|------|------|------|------|
| A. 后端校验 API | 保存时服务端跑规则 | 规则集中、可审计 | 离线 `.narch` 无法用；延迟高 |
| **B. 前端纯函数引擎（推荐）** | `validateDiagram(nodes, edges)` 纯函数，编辑时防抖重算 | 离线可用、即时反馈、易单测 | 规则在前端，后续若多端需抽共享包 |
| C. 保存时一次性报告 | 点「校验」才跑 | 实现简单 | 排障节奏差，易漏看 |

**选定 B**：与「出差带 `.narch`」场景一致；规则纯函数便于单测；UI 用防抖（约 300ms）避免拖拽卡顿。

### 2.2 呈现

- **问题面板**：编辑器底部可折叠条，按 错误 / 警告 分组，显示数量徽章
- **画布高亮**：问题涉及的设备节点描边变红/橙；相关连线加粗或变色
- **点击联动**：列表项 → `fitView`/`setCenter` + 选中节点或边；选中后属性面板可直接改字段

---

## 3. 范围分层

本规格覆盖 **一个可交付的 v1.5 里程碑**，内含三层，按依赖顺序实现：

| 层 | 名称 | 内容 |
|----|------|------|
| **L0** | 地基 | 扩展属性字段、`.narch` 对齐、未保存提示、Ctrl/⌘+S、默认库补全 |
| **L1** | 校验核心 | IP → NVR 通道 → PoE；问题面板 + 画布高亮 |
| **L2** | 排障体验 | 工具栏「校验」开关、一键跳转、忽略单条（会话级）、轻量同网段警告 |

L0 是 L1 的前置；L2 可与 L1 同迭代收尾。权限隔离（项目归属）**建议同迭代做最小版**（见 §8），避免多人共用时误删，但不阻塞校验主路径。

---

## 4. 数据模型扩展

### 4.1 设备节点 `DeviceNodeData`（增量）

现有：`name`, `brand`, `icon`, `model?`, `ip?`, `notes?`

新增（全部选填，空则跳过相关规则）：

| 字段 | 类型 | 用途 | 适用图标提示 |
|------|------|------|--------------|
| `subnetMask` | `string?` | IP/同网段检查，如 `255.255.255.0` 或 `/24` | 有 IP 的设备 |
| `gateway` | `string?` | 展示与后续扩展；本版仅格式校验 | 有 IP 的设备 |
| `maxChannels` | `number?` | NVR/DVR 最大通道 | `nvr`, `dvr` |
| `poeBudgetW` | `number?` | 交换机 PoE 总预算（瓦） | `switch` |
| `poePortCount` | `number?` | PoE 口数（可选，超口数警告） | `switch` |
| `powerDrawW` | `number?` | 本设备功耗（瓦），PoE 受电端 | IPC/球机/门禁等 |
| `mac` | `string?` | 排障记录，本版不做冲突规则 | 任意 |
| `location` | `string?` | 安装位置备注 | 任意 |

**属性面板分组：**

1. 基本信息（名称/品牌/型号/备注）
2. 网络（IP / 掩码 / 网关 / MAC）
3. 容量与供电（按 `icon` 条件显示：NVR 显示通道；交换机显示 PoE 预算/口数；摄像机等显示功耗）

### 4.2 连线 `ConnectionEdgeData`（增量）

| 字段 | 类型 | 用途 |
|------|------|------|
| `vlan` | `string?` | 轻量一致性：同一交换机下多 VLAN 仅提示，不阻断 |
| `bandwidthMbps` | `number?` | 本版仅存储，不做校验 |

`connectionType === 'PoE'` 的边计入 PoE 受电路径。

### 4.3 `.narch` 版本

- 前端导出升为 **`1.2`**（向后兼容读 `1.0` / `1.1`）
- 新增字段原样写入节点/边 JSON；未知字段导入时保留到 `data`
- **服务端** `packages/server/src/narch.ts` 必须与前端同构，支持 text/anchor/annotation + 新字段，禁止导出时丢标注

### 4.4 默认值策略（降低填写成本）

| 场景 | 默认 |
|------|------|
| 拖入 `nvr`/`dvr` 且未填通道 | 不默认数字（避免假阴性）；占位提示「如 8/16/32」 |
| 拖入 IPC/球机/门禁且未填 `powerDrawW` | PoE 校验时用 **图标级默认功耗表**（可配置常量），并在问题文案标注「按默认功耗估算」 |
| 交换机未填 `poeBudgetW` | 跳过该交换机的 PoE 规则（不报错） |
| IP 为空 | 跳过该节点的 IP 规则 |

**默认功耗表示例（实现时落在 `validation/defaults.ts`）：**

| icon | 默认 W |
|------|--------|
| ipc-bullet / ipc-dome / ipc-turret | 7 |
| ipc-fisheye | 10 |
| ptz | 18 |
| access | 8 |
| 其他 | 不估算（跳过） |

---

## 5. 校验规则引擎

### 5.1 模块结构

```
packages/web/src/validation/
  types.ts          # ValidationIssue, Severity, RuleId
  ip.ts             # IP 解析、冲突、格式、同网段
  nvrChannels.ts    # NVR 通道
  poe.ts            # PoE 预算与口数
  subnet.ts         # 轻量同网段/VLAN 警告
  defaults.ts       # 默认功耗等
  validateDiagram.ts # 汇总入口
  index.ts
```

纯函数，**零 UI 依赖**，便于单测。

### 5.2 问题结构

```ts
type Severity = 'error' | 'warning'

type ValidationIssue = {
  id: string              // 稳定 id，便于忽略：rule + 实体 key
  rule: RuleId
  severity: Severity
  message: string         // 中文短句
  nodeIds?: string[]
  edgeIds?: string[]
  /** 是否使用了默认功耗等估算 */
  estimated?: boolean
}
```

### 5.3 规则明细（实现顺序）

#### R1 — IP 格式（warning）

- 非空且无法解析为 IPv4 → 警告，定位该节点
- 支持常见写法；本版不做 IPv6

#### R2 — IP 冲突（error）【打底，优先做】

- 规范化后相同 IP 出现在 ≥2 个设备 → 错误
- `nodeIds` 含所有冲突方；文案：`IP 192.168.1.10 被「IPC-1」「IPC-2」重复使用`

#### R3 — 同网段一致性（warning，需双方有 IP+掩码）

- 若两设备通过「交换机/路由器路径上的直接连线」相连（简化：**同一条 connection 边的两端**，或 **都直连同一台 switch**），且网络号不同 → 警告
- 无掩码则跳过（不强迫填写）

#### R4 — NVR 通道（error）

- 对每个 `icon ∈ {nvr,dvr}` 且填写了 `maxChannels` 的节点：
  - 统计与其直接相连、且对端为摄像机类（`ipc-*`, `ptz`）的 **connection** 边数量（双向）
  - `count > maxChannels` → 错误
- 未填 `maxChannels` → 跳过（可另给 info 级「建议填写通道数」，本版用 warning 且可在设置里关；**默认开启「建议填写」类警告**）

#### R5 — PoE 预算（error / warning）

- 对每个填写了 `poeBudgetW` 的 `switch`：
  - 找出 `connectionType === 'PoE'` 且一端为该交换机的边
  - 对端功耗：`powerDrawW` 或默认表；无法估算则该边不计入瓦数，但计入「未估算」警告
  - `sum > poeBudgetW` → error
  - `sum > poeBudgetW * 0.8` 且未超 → warning（余量不足）
- 若填写了 `poePortCount` 且 PoE 边数 > 口数 → error

#### R6 — VLAN 混用（warning，轻量）

- 同一交换机上多条边填写了不同 `vlan` → 警告（仅提示，不做隔离证明）

### 5.4 运行时机

| 时机 | 行为 |
|------|------|
| 节点/边 data 变更 | 防抖 300ms 重算 |
| 增删节点/边、连线完成 | 防抖重算 |
| 拖拽位置 | **不**触发（位置与校验无关） |
| 工具栏关闭「实时校验」 | 清空高亮，保留上次结果可选；再次打开立即重算 |
| 手动「立即校验」 | 立刻重算并展开问题面板 |

---

## 6. UI / 交互设计

### 6.1 布局变化

```
┌─ Toolbar（增加：校验开关 | 问题数徽章 | 立即校验）─────────────┐
├─ Library ─┬─ Canvas（问题节点红/橙描边）─┬─ Properties ─┤
│           │                              │  分组字段     │
│           ├─ ValidationPanel（可折叠底栏）─┤              │
└───────────┴──────────────────────────────┴──────────────┘
```

- 问题面板默认：**有 error 时自动展开**；仅 warning 时显示徽章不强制展开
- 高度约 160px，可拖拽调整（可选，第一版固定高度即可）
- 与属性面板并存；窄屏仍保持 `min-w-[1280px]`（不做移动端）

### 6.2 问题列表面板

每行：`[错误|警告] 文案  ·  涉及设备名` ；右侧「定位」「忽略」

- **定位**：选中首个 `nodeId` 或 `edgeId`，画布居中，缩放不低于 0.8
- **忽略**：会话级 `Set<issue.id>`，刷新页面后恢复；不写入服务器（避免误藏现场问题）

### 6.3 画布高亮

- error：节点边框 `#e11d48`，边 stroke 同色加粗
- warning：`#ea580c`
- 与选中态叠加时：选中环保留，问题色作为外描边
- MiniMap 不强制变色（降低实现量）

### 6.4 设备节点展示

- 仍显示名称 + IP（若有）
- 有未忽略 error 时，节点右上角小圆点徽章（红）

### 6.5 工具栏

- Toggle「校验」默认 **开**
- 徽章：`3` 错误 / `2` 警告（有错误用红，仅警告用橙）
- `Ctrl/⌘+S`：保存项目（与校验无关，属 L0）
- 离开编辑器有未保存变更：`beforeunload` + 返回列表确认框

---

## 7. 状态管理

在 `canvasStore` 旁新增 `validationStore`（或同 store 切片，推荐独立避免 `canvasStore` 继续膨胀）：

```ts
{
  enabled: boolean
  issues: ValidationIssue[]
  ignoredIds: Set<string> | string[]
  runToken: number
  setEnabled, setIssues, ignoreIssue, clearIgnored, selectIssueTarget
}
```

`Editor` 或小型 `ValidationController` 组件：`useEffect` 订阅 `nodes/edges` + `enabled`，调用 `validateDiagram`。

高亮：`DeviceNode` / `LabeledEdge` 读取「当前节点是否在可见 issues 的 nodeIds/edgeIds 中」。

---

## 8. 同迭代建议的地基与安全（L0 + 最小权限）

不阻塞校验，但强烈建议同版本带上：

| 项 | 做法 |
|----|------|
| 未保存 dirty | `canvasStore` 记 `dirty`；保存成功清零；返回拦截 |
| Ctrl/⌘+S | Toolbar / Editor 快捷键调保存 |
| `.narch` 前后端对齐 | 服务端复用与前端一致的字段映射；版本 1.2 |
| 默认元件库补全 | 将 `nvms`、`decoder`、`videowall`、`ipc-turret`、`ipc-fisheye` 等挂入默认 TVT 库 |
| 项目归属（最小） | API 列表/读写/删除过滤 `author_id === 当前用户`；admin 可看全部（若已有 admin 角色则用；否则所有人仅见自己的，迁移：旧数据 `author_id` 空则仅 admin 可见或一次性归 admin） |

**明确仍不做：** 改密 UI 可列为同迭代可选；LDAP、实时协同、PDF 不做。

---

## 9. 架构与数据流

```
用户改属性 / 连线
        │
        ▼
  canvasStore.nodes/edges
        │  debounce 300ms
        ▼
  validateDiagram() ──► validationStore.issues
        │
        ├────────────► ValidationPanel（列表）
        └────────────► DeviceNode / LabeledEdge（高亮）

用户点击问题
        │
        ▼
  选中 node/edge + setCenter
        │
        ▼
  PropertyPanel 编辑字段 ──► 重算 ──► 问题消失或更新
```

---

## 10. 错误处理与边界

| 情况 | 处理 |
|------|------|
| IP 含空格/全角点 | trim + 替换常见全角后再解析；仍失败 → 格式警告 |
| 自环边 | 通道/PoE 统计忽略自环 |
| 标注箭头 | 不参与任何校验 |
| 文本/锚点节点 | 不参与 |
| 超大图（>500 节点） | 仍全量跑；规则为 O(n²) 最坏在 IP 冲突（用 Map 降为 O(n)） |
| 忽略后字段已改 | issue id 含实体与规则；内容变则新 id，旧忽略不匹配（问题会再出现） |

---

## 11. 测试计划

### 11.1 单元测试（优先）

- `ip.ts`：冲突、格式、掩码网络号
- `nvrChannels.ts`：刚好满、超 1、未填通道跳过、非 IPC 连线不计
- `poe.ts`：超预算、80% 警告、默认功耗、口数超限
- `validateDiagram`：混合图快照

### 11.2 手工验收

1. 两台 IPC 同 IP → 红灯 + 列表 1 条错误，点击定位
2. 改其中一个 IP → 问题消失
3. NVR maxChannels=4，接 5 路 IPC → 错误
4. 交换机预算 30W，3 路 PoE 默认功耗合计超 → 错误且文案含「默认功耗」
5. 关闭校验 → 高亮与面板清空
6. 导出 `.narch` 再导入 → 新字段仍在
7. 服务端 export/import 含文本与标注不丢失

---

## 12. 实现分期（单里程碑内）

| 顺序 | 交付物 | 预估 |
|------|--------|------|
| 1 | 数据字段 + 属性面板分组 + narch 1.2 + 服务端对齐 | 2–3 天 |
| 2 | `validateDiagram` + IP 规则 + 单测 | 1–2 天 |
| 3 | 问题面板 + 高亮 + 联动 | 2 天 |
| 4 | NVR + PoE 规则 + 默认功耗表 | 2 天 |
| 5 | 同网段/VLAN 轻量警告 + 忽略 | 1 天 |
| 6 | dirty/Ctrl+S + 默认库补全 + 最小项目归属 | 1–2 天 |
| 7 | 说明书更新 + 验收 | 0.5 天 |

---

## 13. 文档同步

实现完成后更新：

- `docs/开发说明.md`：v1.5 清单勾选；属性表改为已实现
- `docs/使用说明书.md`：新增「配置校验」章节
- `README.md`：v1.5 已完成项

---

## 14. 开放决策（已按推荐拍板）

| 决策点 | 选择 |
|--------|------|
| 引擎位置 | 前端纯函数 |
| UI | 底栏列表 + 画布高亮 |
| 规则顺序 | IP → NVR → PoE |
| 未填容量 | 跳过硬错误；可选「建议填写」警告默认开 |
| 功耗缺省 | 图标默认表 + 文案标明估算 |
| 忽略 | 仅会话级 |
| PDF/仿真 | 本规格不做 |
| 项目归属 | 同迭代最小隔离 |

---

## 15. 自检记录

- [x] 无 TBD/TODO 占位
- [x] 与现有 `DeviceNodeData` / `.narch` / 开发说明 v1.5 方向一致
- [x] 范围可落在单一实现计划（L0–L2 一个里程碑）
- [x] 规则跳过条件明确，避免空字段误报
- [x] 前后端 narch 对齐已写入，避免标注丢失回归
