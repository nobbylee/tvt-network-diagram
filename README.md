# TVT 网络架构图绘制工具

面向 TVT 安防产品的专用网络架构图绘制工具（v1.0）。

## 文档

| 文档 | 说明 |
|------|------|
| [使用说明书](docs/使用说明书.md) | **给使用者**：登录、绘图、保存、导入导出、Docker 部署 |
| [开发说明](docs/开发说明.md) | 需求、架构、分阶段路线图 |
| [UI 设计规范](docs/UI设计规范.md) | 视觉与交互规范 |

## 快速启动（开发）

```bash
# 终端 1 — 后端
cd packages/server && npm install && npm run dev

# 终端 2 — 前端
cd packages/web && npm install && npm run dev
```

- 前端：http://localhost:5173  
- 后端：http://localhost:3001/api/health  

默认账号：`admin` / `admin123`

## Docker 部署

```bash
docker compose up -d --build
# 访问 http://服务器:8080
```

## v1.0 已完成

- [x] Sprint 1：React Flow 画布、节点、连线、撤销/重做  
- [x] Sprint 2：元件库、全套图标、属性面板、自定义增删改  
- [x] Sprint 3：登录、项目 CRUD、`.narch` 导入导出、Docker  

## v1.5 已完成（配置校验）

- [x] IP 冲突 / 格式 / 同网段提示  
- [x] NVR 通道数、PoE 预算与口数校验  
- [x] 问题列表面板 + 画布高亮定位  
- [x] 扩展网络/容量字段、`.narch` 1.2、未保存提示、项目归属隔离  

## v1.6 已完成（正式出图）

- [x] PNG 整图导出  
- [x] PDF 导出（图签：项目/客户/编制人/日期 + 设备与连接类型图例）  

后续（未做）：网络仿真、项目模板、BOM、改密。
