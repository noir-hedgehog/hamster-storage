# 仓鼠收纳 MCP

本次改造面向 `Backend` + `Frontend` 的 Docker 应用。网页和 MCP 共享同一个 SQLite 数据库，不复制业务数据。仓库根目录 `app/` 是历史 Sites/D1 应用，本次没有重新发布该站点，也没有将 D1 与 Docker 数据库自动合并。

## 能力与使用流程

| 工具 | 用途 |
| --- | --- |
| `get_workspace` | 当前数据量、版本、坐标约定、操作边界 |
| `list_records` | 分页读取和搜索住宅、房间、家具、收纳、物品、分类、标签及标签组 |
| `get_record` | 按准确 ID 读取完整记录 |
| `get_history` | 历史导入、agent 修改批次摘要，不返回原始对话 |
| `prepare_changes` | 预览记录增改删、房间编辑及家具摆放，最多 100 操作 |
| `prepare_import` | 预览结构化物品清单，按同名、同收纳位置、同品牌去重 |
| `commit_changes` | 提交已获用户授权的计划；相同计划重试不会重复录入 |

资源：`hamster://workspace`、`hamster://schema`、`hamster://records/{entity}/{id}`。支持资源发现、资源模板、工具发现和结构化结果。

外部 agent 负责理解用户对话：先读数据和 ID → 不确定信息向用户确认 → 生成结构化变更 → prepare → 展示变更、级联删除和警告 → 获授权后 commit。没有内置大模型调用、自然语言解析器或聊天记录保存。

`confirmed:true` 是客户端传达授权的声明，不是独立的人类身份验证。必须让 agent 的宿主保留写工具审批。持有可写凭证的客户端具有修改整库的能力；不可信客户端只能给只读凭证。

计划有效期 30 分钟，绑定连接身份。网页或其他 agent 修改数据后，旧计划会被拒绝，须重新预览。提交在一个事务内执行，失败全部回滚；已提交结果持久保存供幂等重试。预览中创建的 ID 是临时 ID，真实 ID 以提交结果为准。

## 通用远程连接：Streamable HTTP

端点为 **部署这份新代码的 Docker 服务的 `/mcp`**。需先构建并更新运行容器；不能把旧版本地址视为已提供 MCP。

应用读取以下服务端环境变量，Compose 已提供对应传入位置：

应用导航栏的 **MCP 与文档** 页面提供配置状态、HTTP/SSH 连接模板、权限说明、工具清单和完整文档下载；可用 `/#mcp` 直接打开。状态接口只返回是否配置，不返回凭证。部署到 utopia 时，凭证保存于 `/opt/apps/hamster-storage/.mcp.env`（权限 0600），由服务管理员通过安全渠道分发；发布脚本不把密钥写进日志。

- `MCP_READ_TOKEN`：只读凭证，至少 32 字符。
- `MCP_WRITE_TOKEN`：可读写凭证，至少 32 字符，必须与只读凭证不同。
- `MCP_ALLOWED_ORIGINS`：可选，以逗号分隔的明确浏览器 Origin；默认拒绝所有带 Origin 的请求。普通服务端 agent 不需要配置。

凭证不进入代码、网页、URL 查询参数或聊天。使用密码管理器生成并通过部署环境注入。未设置凭证时 `/mcp` 返回 503，未认证返回 401。

支持自定义请求头的客户端通常接受下面的连接参数；配置文件的包裹结构取决于该客户端：

```json
{
  "type": "streamable-http",
  "url": "https://YOUR_DEPLOYED_HOST/mcp",
  "headers": {
    "Authorization": "Bearer YOUR_PRIVATE_TOKEN"
  }
}
```

优先把 token 存入客户端的 secret/env 功能，不将以上占位符当成实际凭证。不要在公网 HTTP 上发送凭证；正式域名必须先验证 HTTPS。该实现是静态 Bearer 凭证，不是 OAuth 服务；若客户端只接受 OAuth，需另行接入鉴权网关，不能直接使用这份配置。

HTTP 使用无会话 Streamable HTTP + JSON 响应，无旧 SSE 端点；GET/DELETE 返回 405。实现依据 [MCP 官方 TypeScript SDK 文档](https://ts.sdk.modelcontextprotocol.io/server)。

**安全边界：本次鉴权保护 MCP 入口，原有网页 REST API 没有改造成多用户登录系统。** 服务仍须放在可信网络/现有访问网关后；不要因为配置了 MCP token 就认为整站已受保护。各只读客户端可读整库，不提供按用户隔离的数据权限。

## 通用本地连接：stdio

先构建后端，选择**已有数据库的绝对路径**。不设置路径、使用相对路径或指向不存在的文件都会拒绝启动，以免误接到新空库。

```json
{
  "mcpServers": {
    "hamster-storage": {
      "command": "/ABSOLUTE/PATH/TO/node",
      "args": ["/ABSOLUTE/PATH/TO/Backend/dist/mcp/stdio.js"],
      "env": {
        "DATABASE_PATH": "/ABSOLUTE/PATH/TO/existing/storage.db",
        "MCP_ACCESS": "read"
      }
    }
  }
}
```

默认只读，需要写入时设置 `MCP_ACCESS=write`。这个模式信任本机进程权限；stdout 仅输出 MCP 协议，诊断日志走 stderr。

对更新后的 utopia Docker 容器，也可以由支持启动命令的客户端用 SSH + stdio 连接：

```json
{
  "mcpServers": {
    "hamster-storage": {
      "command": "ssh",
      "args": ["-T", "utopia", "sudo", "-n", "docker", "exec", "-i", "-e", "MCP_ACCESS=read", "hamster-storage-app", "node", "dist/mcp/stdio.js"]
    }
  }
}
```

前提：客户端运行环境已有 `utopia` SSH 配置、可登录且可运行 Docker；容器已更新到包含 MCP 的版本。不要使用 `-t`/TTY。数据库路径由容器的 `DATABASE_PATH=/app/data/storage.db` 继承，读的就是网页数据。此示例不代表已替你修改远程服务器或客户端配置。

## 房间、家具与内容示例

`prepare_changes` 支持本批前向依赖：先创建记录并指定 `ref`，后续 ID 字段用 `$ref` 引用。实体名：`locations`、`rooms`、`storages`、`furniture`、`items`、`categories`、`tags`、`tag_groups`。

下面是示例尺寸，不应当作用户家的真实数据导入：

```json
{
  "operations": [
    {"entity":"locations","action":"create","ref":"home","data":{"name":"新家"}},
    {"entity":"rooms","action":"create","ref":"room","data":{"name":"次卧","locationId":"$home","geometry":{"unit":"cm","x":0,"y":0,"width":400,"depth":350,"height":280,"rotation":0}}},
    {"entity":"furniture","action":"create","ref":"bed","data":{"name":"双人床","kind":"bed","roomId":"$room","unit":"cm","width":150,"depth":200,"height":50,"x":200,"y":150,"rotation":0}},
    {"entity":"storages","action":"create","ref":"cabinet","data":{"name":"衣柜内部","roomId":"$room"}},
    {"entity":"items","action":"create","data":{"name":"围巾","storageId":"$cabinet","quantity":2,"unit":"条"}}
  ]
}
```

向 `commit_changes` 传入返回的 `planId` 和 `confirmed:true` 即可提交。柜子家具可用 `storageId` 关联同房间顶层收纳；抽屉/隔层继续用 `parentStorageId`，物品继续绑定 `storageId`。

### 单位和限制

- 旧 `floorplan*` 字段是像素示意坐标，原样保留，不自动换算成真实尺寸。
- 房间 `geometry` 是实测厘米：x/y 为住宅坐标，width/depth 为室内净尺寸，height 为可选净高。
- 家具是独立实体：宽、深、高必填厘米；x/y 为**房间内家具占地中心**，旋转为俯视顺时针角度。
- 3D 优先使用实测房间与家具尺寸；未关联家具的旧收纳仍是示意模型。旧布局编辑器只修改示意布局，不修改实测 geometry。
- 家具创建要求房间已有实测 geometry。支持床、沙发、桌、椅、柜、架、抽屉、家电、箱及其他类型；图形仍是简化模型。
- 当前仅支持矩形实测房间；不包含真实门窗/墙体、多边形户型、户型图识别或现场适配保证。越界和超过房高会在预览中提示，不表示已进行物理验证。
- 修改房间归属、批量搬移收纳子树尚不提供隐式操作；必须明确处理其关联记录。删除住宅/房间/收纳会触发现有级联规则，预览会列出被删除的记录。

网页保留物品管理、位置树、旧布局编辑、3D、手工录入和历史清单。旧 `/api/import`、`/api/import/preview` 返回 410；原始对话输入框已移除。历史业务数据和旧导入批次不删除。

## 验证与发布

```sh
cd Backend
npm ci
npm run build
npm run test:ci
cd ../Frontend
npm ci
VITE_API_BASE_URL=/api/v1 npm run build
npm test -- --run
cd ..
node tests/mcp-smoke.mjs
```

完整浏览器验证可设置 `PLAYWRIGHT_MODULE` 为已安装 Playwright 包路径，并安装 Chrome。`mcp-smoke.mjs` 自动创建临时验证库，启动临时端口，使用官方 MCP 客户端测试 HTTP 和 stdio、预览/提交/重试、重启持久化，以及可选的网页/3D联动；不会连接生产库。测试结束停止临时服务，输出临时库与截图目录供检查。

更新生产环境前，应备份现有数据库及镜像，迁移后检查记录数量、MCP 权限和 3D。新增表：`room_geometry`、`furniture`、`agent_plans`，不清空旧数据。保持旧镜像以便回退，不要通过清空卷来升级。

### 本轮验证（2026-09-19）

- 后端构建通过，38 项测试通过；前端构建、相关文件类型检查及 11 项测试通过。
- 官方 MCP 客户端完成 HTTP / stdio 连接、工具和资源发现、读取、预览、提交、重试及进程重启后的持久化检查。
- 浏览器验证确认站内对话框消失，MCP 家具修改刷新后可见，家具关联下级收纳物品可读；桌面、手机视口及 WebGL 恢复后的画面已检查。
- 数据库驱动固定为支持当前 Node 24 与 Docker Node 20 的 `better-sqlite3@12.10.1`，修复旧驱动在本地运行时的崩溃；未使用生产库进行写入测试。
- 本轮没有发布 utopia 或 Sites，没有替外部 agent 写入配置，也没有配置线上凭证；Docker 容器更新和目标客户端接入仍需执行。
