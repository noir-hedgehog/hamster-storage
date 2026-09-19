# Docker / Sites parity — 2026-09-19

Docker 保留原有地点、房间、嵌套收纳、物品、分类、标签和提醒功能，并增加 Sites 搬家首页的等价能力。

| Sites | Docker |
| --- | --- |
| 搬家文案、对话导入、物品数量与清单 | 默认「搬家清单」，沿用相同主题和核心内容 |
| `GET /api/items` | 同路径、同物品字段，从原有 SQLite 物品库读取 |
| `POST /api/items` | 同路径，新增物品写入原有管理库；重复返回 409 |
| `POST /api/import` | 同路径，支持 input 文本或 items 数组，返回 importedCount / skippedCount |
| name + location + brand 去重 | 同规则，并识别唯一收纳的简称与完整路径 |
| D1 cents、日期、序列化 tags | 支持导入，转换为原有价格、分类与标签关联 |
| import_batches | SQLite 中事务性记录整批导入 |

新增 `POST /api/import/preview` 不写库；确认后原子导入，失败整批回滚。`GET /api/import/batches` 提供最近 50 批记录。JSON 导出可重新导入，重复项跳过。

Sites 线上 DB 的 items 与 import_batches 在本次读取时均为零行，没有真实数据需要迁移。Sites 页面和数据库未修改；这不是双向实时同步。解析沿用规则，不调用 GPT，也不需要模型密钥。

## 3D

- 新入口按需加载 Three.js，旧地图和平面编辑仍保留。
- 保存的平面坐标、宽深和旋转映射到场景；缺失部分使用明确标注的示意排列。模型高度为示意，不表达真实容量。
- 目录和模型选择联动；顶级收纳统计包含下级物品。鼠标旋转、触控、缩放、俯视、复位、房间筛选可用。
- OrbitControls 按变化重绘，没有持续动画循环；ResizeObserver 随容器调整，像素比最多 1.5。卸载释放纹理、模型、材质、监听器和 WebGL 上下文。
- 无 WebGL 或上下文丢失时保留目录和物品面板，可重试渲染。

## 验证

后端用 `DATABASE_PATH=:memory:` 运行 Vitest，避免触碰已有数据库。浏览器测试脚本 `tests/docker-browser-smoke.mjs` 只能指向独立的空测试库，会写入示例内容。测试数据不进入正式服务器。

## 发布 / 回滚

发布内容来自当前工作区的 Frontend、Backend、Dockerfile 和部署配置，保留工作区已有品牌改动；私密环境文件、数据库、依赖目录和测试数据不入镜像。

新版本目录：`/opt/apps/hamster-storage/releases/20260919-sites-parity-v1`。compose 通过 `release.env` 选择版本。更新前使用 SQLite backup API 留存数据库备份，同时保存旧 compose 和旧镜像标签。应用的命名卷继续使用原卷。

部署后通过 Caddy 容器内的 `/health` 和 `/api/items` 验证，额外使用隔离临时容器验证真实 Docker 运行与重启持久化。域名 HTTPS 是否可用须单独验证，不能以容器健康代替。
