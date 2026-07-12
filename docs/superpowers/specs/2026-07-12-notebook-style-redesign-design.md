# 界面换新:复古教材笔记本风格(Notebook Infographic)Design Spec

**日期:** 2026-07-12
**参照:** 用户提供的 `设计风格指南.md`(原为另一 Vue + Element Plus 项目编写,本次仅移植其设计语言——配色/字体/间距/圆角/纸感背景,不移植其文件结构或组件库)
**范围:** 纯视觉改版。不改动业务逻辑、数据结构、API、鉴权流程。

---

## 一、背景与目标

当前项目(TVT 网络架构图绘制工具,React 19 + Tailwind v4 + React Flow)是冷色调、圆角较大的常规后台风格。用户希望换成"复古知识清单/教材笔记本"风格:暖色纸面、装订线、横向内页格线、衬线标题、等宽数据文本、克制的小圆角。这是为后续把工具集成进用户自己的网站做准备的第一步(集成方式、登录鉴权保留与否留待以后决定,本次不动)。

改版覆盖全部页面:登录页、项目列表页、编辑器(工具栏、属性面板、画布与节点、连线、校验面板)。

---

## 二、设计令牌(Design Tokens)

替换 `packages/web/src/index.css` 里 Tailwind `@theme` 和 `:root` 中的现有变量。**全部颜色/字体/间距/圆角改动只在这一个文件的令牌层完成**,业务组件不允许写死十六进制颜色或魔数像素值。

### 2.1 颜色

纸面/背景:

| 变量 | 值 | 用途 |
|---|---|---|
| `--bg-app` | `#EFEBE3` | 页面最外层背景 |
| `--bg-surface` | `#FBF8F1` | 卡片/表格/输入框表面 |
| `--bg-sunken` | `#E7E1D4` | 凹陷区域(表头、标签底色) |
| `--bg-hover` | `#F3EEE4` | 悬浮态背景 |
| `--bg-rule` | `rgba(42,58,78,0.08)` | 内页横向格线 |
| `--bg-margin` | `#F6EDEA` | 装订线/边距浅底色 |

墨水与强调色:

| 变量 | 值 | 用途 |
|---|---|---|
| `--ink` | `#1C2838` | 最深正文墨色(= `--text-primary`) |
| `--ink-soft` | `#3D4A5C` | 次深墨色(表头、次级标题) |
| `--accent` | `#2F5D50` | **主色**(原 TVT 蓝 `#0066cc` 完全废弃,不保留为任何 token) |
| `--accent-hover` | `#244A40` | 主色悬浮/激活态 |
| `--accent-soft` | `#E2EDE8` | 主色浅底 |
| `--margin-rule` | `#C45C4A` | 装订红线 |
| `--highlight` | `#F3E7B4` | 荧光笔黄(慎用,不做大面积底色) |

文字:`--text-primary`(=`--ink`)、`--text-secondary`(`#5A6574`)、`--text-muted`(`#8A93A0`)、`--text-on-accent`(=`--bg-surface`)。

边框:`--border`(`#D5CFC2`)、`--border-strong`(`#B8B0A0`)。

语义色(**替换现有校验面板/节点高亮用的红橙色**):

| 变量 | 值 | 用途 |
|---|---|---|
| `--success` / `--success-soft` | `#2F5D50` / `#E2EDE8` | 与主色同色系 |
| `--danger` / `--danger-soft` | `#A3483C` / `#F6EDEA` | 替换现有 `#e11d48`,用于 IP 冲突/PoE 超预算等 error 级校验高亮 |
| `--warning` / `--warning-soft` | `#9A6B2F` / `#F6EBD4` | 替换现有 `#ea580c`,用于 warning 级校验高亮 |
| `--info` | `#3F5F7A` | 中性提示 |

### 2.2 字体

| 变量 | 字体栈 | 用在哪 |
|---|---|---|
| `--font-serif` | Source Serif 4 / Noto Serif SC / 宋体 / Georgia | 标题(`h1/h2/h3`、`.nb-title`) |
| `--font-sans` | 沿用现有 PingFang SC / 微软雅黑 / Noto Sans SC | 正文、按钮、表单 |
| `--font-mono` | 沿用现有 JetBrains Mono / SF Mono | 数据类文本:IP、型号、端口号、时间戳、连线标签 |

字号阶梯(`--fs-display` 40 / `--fs-h1` 28 / `--fs-h2` 20 / `--fs-h3` 16 / `--fs-body` 15 / `--fs-sm` 13 / `--fs-xs` 12),行高(`--lh-tight` 1.25 / `--lh-normal` 1.65),字重上限 `--fw-semibold`(600,不用 700+)。

### 2.3 间距、圆角、阴影、动效

- 间距:8px 网格 `--sp-1`(4px)到 `--sp-8`(64px),组件内边距一律取整数档位,不写魔数像素。
- 圆角:`--radius-sm`(2px,按钮/输入框/标签,绝大多数场景用这个)、`--radius-md`(4px,卡片/表格容器)、`--radius-lg`(6px,极少用)、`--radius-full`(胶囊)。**现有 `rounded-lg`(8px)/`rounded-2xl`(16px)全部收紧到 `--radius-sm`/`--radius-md`**。
- 阴影:`--shadow-card`(卡片浅阴影)、`--shadow-pop`(弹出层阴影)。
- 动效:`--ease: cubic-bezier(0.2, 0, 0, 1)`,`--dur-fast` 140ms / `--dur-base` 220ms,不用弹簧缓动。

### 2.4 全局纸感背景

`body` 背景叠两层渐变(装订红线 + 内页横线),全局唯一一处实现,不在业务组件里重复。

---

## 三、组件层落地方式

项目现状是 Tailwind 布局类 + `style={{ background: 'var(--xxx)' }}` 引用变量的混合写法(如 `Login.tsx`)。延续这个模式,不引入新的样式方案:

1. 在 `index.css` 新增一组全局工具类,对应指南的 `.nb-*` 组件类:
   - `.nb-sheet`:纸面卡片(背景 + 描边 + `--radius-md` + `--shadow-card`)
   - `.nb-sheet--margin`:叠加左侧 3px 装订红线
   - `.nb-sheet--ruled`:叠加横向内页格线背景
   - `.nb-title`:衬线字体标题
   - `.nb-kicker`:等宽小型分类标签
   - `.nb-tag`:荧光黄底小标签
   - `.nb-divider`:虚线分隔线
2. 各组件把现有 `rounded-2xl`/`rounded-lg`/`shadow-sm` 等硬编码 Tailwind 类替换为上述 `.nb-*` 类 + 新 token 变量引用。**只换皮肤,不重写交互逻辑、不改状态管理**。

### 3.1 分页面/分组件改动点

| 文件 | 改动 |
|---|---|
| `pages/Login.tsx` | 卡片改 `.nb-sheet`,标题改衬线字体,圆角收紧,主色改墨绿 |
| `pages/ProjectList.tsx` | 项目卡片改 `.nb-check-card` 交互(hover 上浮 + 左侧红线),页头标题衬线化 |
| `components/Toolbar.tsx` | 按钮/分割线/校验徽标配色与圆角对齐新 token |
| `components/PropertyPanel.tsx` | 面板分组标题、输入框描边风格对齐(参考指南"输入框统一用 inset box-shadow 模拟描边") |
| `components/CanvasArea.tsx` | 背景网格改横线内页格线 + 装订红线,替代现有点状网格 |
| `nodes/DeviceNode.tsx` | 卡片套 `.nb-sheet`,设备名衬线字体,IP/型号等宽字体,error/warning 描边色改用新 `--danger`/`--warning` |
| `edges/LabeledEdge.tsx` | 连线标签切等宽字体,error/warning 配色同步新 token |
| `components/ValidationPanel.tsx` | 问题列表项配色对齐新语义色 |
| `components/DeviceIcon.tsx` | 见 3.2 |

### 3.2 设备图标:去掉产品照片,统一矢量线条图标

现状 `DeviceIcon.tsx` 混合两套体系:TVT 品牌设备(摄像机、NVR 等)用真实产品照片 PNG(`photoIcons`,靠 `brand === 'tvt'` 触发),其余用 `stroke` 矢量图标。本次改版:

- 删除 `photoIcons` 图片引用与 `hasPhotoIcon(type, brand)` 的照片/矢量分支逻辑。
- 所有设备类型统一画成墨色线条矢量图标(参考现有非 TVT 设备图标的画法:20x20 视口、`stroke` 描边),配色统一引用 `--ink` / `--accent`,不再区分品牌。
- `nodes/DeviceNode.tsx` 里原本依据 `isPhoto`/`isNvr` 判断卡片图标尺寸的分支逻辑一并简化为统一尺寸规则(不再有"照片图标更大"的特殊处理)。
- **连带效果**:此前代码审查发现的"PDF 图例把非 TVT 品牌设备也画成 TVT 产品照片"的 bug,随着照片体系整体移除而自然解决,不需要单独修。

### 3.3 PDF 导出图例重绘

`utils/exportPdf.ts` 现在的图例(legend)绘制逻辑是加载 `photoIcons` 的 PNG 并画进 PDF。照片体系移除后,图例需要改成绘制新的矢量线条图标:用 canvas 离屏渲染对应 SVG 图标为图片再画入 PDF(与现有 `loadImage` 流程类似,只是图片源从 PNG 换成离屏渲染的 SVG),或者直接用 PDF 库的路径绘制 API 画简化线条。两种方式选型留给实现阶段判断,以"图例视觉上与画布图标一致"为准。

---

## 四、明确不改的范围

- 登录鉴权逻辑、`.narch` 导入导出格式、校验规则(IP/NVR/PoE/VLAN)、项目归属过滤等业务逻辑与数据结构——全部不动。
- 此前代码审查(2026-07-12)发现的 9 个 bug(resetDiagram 脏标记、跨项目校验忽略状态泄漏、前后端 narch 解析器行为不一致等)按用户要求暂缓,本次改版不顺带修复(3.2 提到的 PDF 品牌错配除外,那是改版的自然副产品,不是专门去修的)。

---

## 五、验证方式

1. 现有单测(`npm test`,覆盖 narch / validation / exportImage 逻辑,不涉及样式)继续跑通;`npm run build`(web)+ server `tsc` 无报错。
2. 启动 dev server,手工过一遍:登录页 → 项目列表页 → 编辑器(工具栏、属性面板、画布拖拽设备卡片、连线、校验面板报错/警告高亮、"定位"按钮)→ 触发一次 PDF 导出确认图例正常。
3. 重点检查画布新增的格线背景是否影响可读性/是否与节点卡片、连线颜色打架,必要时调整格线透明度(`--bg-rule` 的 alpha 值可在实现阶段微调,不算偏离本设计)。

---

## 六、风险与待确认项

- 字体加载:`--font-serif`(Source Serif 4 / Noto Serif SC)、`--font-mono` 里部分字体可能需要从 Google Fonts 或本地字体文件引入,若未安装则会 fallback 到系统宋体/衬线字体,视觉效果打折扣但不影响功能——实现阶段需确认是否要额外引入 web font 文件。
- 全部矢量图标从零绘制的工作量取决于当前设备类型数量(`DeviceIconType` 共 22 种),部分图标已有矢量版本可直接复用配色,只有原先用照片的几种(ipc-bullet/ipc-dome/nvr/dvr/ptz 等,具体以 `brandColors`/`photoIcons` 现有映射为准)需要新画。
