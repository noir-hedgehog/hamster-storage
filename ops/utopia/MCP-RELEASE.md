# utopia MCP 与站内文档发布验收

验收日期：2026-09-19。此记录针对 Docker 正式服务，不代表 Sites 已重新发布，也不代表公网 HTTPS 已恢复。

## 正式版本

- 主机：`utopia` / `43.156.132.51`。
- 发布：`20260919-mcp-docs-v1`。
- 应用源码：`794943f07a0f279c74c0c337120ff2e4a54623b7`；后续同分支提交仅补运维验收记录和验证脚本。
- 镜像：`hamster-storage-app:20260919-mcp-docs-v1`。
- 镜像 ID：`sha256:8d421ece72d028827d2fe3ba03043a626f364fe281c5ffe1a6303a5cbaa234bd`。
- 容器内运行时：Node `v24.21.0`；构建和运行均使用 `node:24-bookworm-slim`。
- 发布目录：`/opt/apps/hamster-storage/releases/20260919-mcp-docs-v1`。
- 正式数据卷：沿用 `hamster-storage_hamster-storage-data`，未替换、清空或写入测试业务数据。

## 功能与验证

- 站内导航增加 **MCP 与文档**，支持 `/#mcp`，显示配置状态、只读/可写模板、HTTP/SSH 连接说明、工具、坐标规则和常见问题；可下载 JSON 模板及完整 Markdown 文档。
- 原生对话入口移除；旧导入接口返回 410；保留手动编辑和数据查看。
- HTTP MCP 已通过官方 SDK 验证：只读 4 个工具、可写 7 个工具、资源读取、无凭证 401、文档下载 200；使用容器内回环地址，真实凭证未离开容器。
- SSH stdio 通过本机官方客户端分别验证只读/可写工具和正式数据读取，没有对正式库执行写入。
- 正式库升级前后，住宅、房间、收纳、物品均为 0；升级后新增家具表为 0，其余分类、标签、标签组也为 0。
- 独立容器和独立卷完成住宅、实测房间、衣柜、收纳、物品录入，确认预览不写库、提交成功、重启后保留、相同计划重试不重复。测试容器 `hamster-mcp-canary-20260919` 及测试卷 `hamster-mcp-canary-20260919-data` 已删除；仅移除了本轮测试数据，不含用户数据。
- 正式容器 healthy；Caddy 容器访问应用 `/health` 正常。同机其他容器继续运行，共享 Caddyfile 哈希前后均为 `71d823fc03451a369e896f467b743f6b388536095d227f7e6b4cef541f8a01fd`。
- 39 项后端测试、11 项前端测试通过；本地端到端验证涵盖 MCP 持久化、家具/物品联动、网页刷新和 WebGL 恢复。
- 正式网页经 SSH 隧道完成 1440px / 390px 验证：配置状态正确、两类权限启用、SSH 模板、文档下载、无横向溢出、无页面运行错误；未写入正式数据。
- 正式页面截图位于本机临时目录 `/var/folders/ds/ln7185hx4s32lmd1sxjn5rx40000gn/T/utopia-mcp-release-uNIZGV/`。

## 备份、凭证与回退

- SQLite 在线备份：容器内 `/app/data/backups/pre-mcp-docs-2026-09-19T14-59-55-361Z.db`，完整性检查 `ok`。
- 旧部署配置和 Caddyfile：服务器 `/opt/apps/hamster-storage/backups/20260919-mcp-docs-v1/`。
- 旧镜像 `hamster-storage-app:20260919-sites-parity-v1` 保留。
- 读写密钥在服务器 `/opt/apps/hamster-storage/.mcp.env`，权限 `0600 root`；通过 Compose env_file 注入。不在站内页面、代码、聊天和本记录中展示。
- 更新服务器 `/opt/ops/services.yml` 时仅修改 hamster-storage，保留其他服务；原登记另存 `/opt/ops/services.yml.before-mcp-docs`。

必要时，由管理员执行以下回退（本次未执行）：

```sh
ssh utopia 'sudo -n docker run --rm --network none \
  -v /opt/apps/hamster-storage:/deployment --entrypoint node \
  hamster-storage-app:20260919-mcp-docs-v1 \
  /deployment/releases/20260919-mcp-docs-v1/ops/utopia/mcp-release.cjs \
  rollback 20260919-mcp-docs-v1 && \
  cd /opt/apps/hamster-storage && \
  sudo -n docker compose up -d --no-deps --no-build app'
```

回退仅切换旧镜像与配置；不会覆盖数据库或删除新增表。若新版本已录入实测房间/家具，旧版本不保证可展示这些新字段；不要直接恢复旧数据库覆盖新增内容。

## 访问与未完成边界

- 目标域名：`https://storage.virtualink.cafe`；MCP：`/mcp`；站内文档：`/#mcp`。
- 公网 443 实测连接超时，之前证书校验也超时。需要检查云平台安全组/防火墙 TCP 80、443 入站规则，再验证证书。未改其他域名、未关闭防火墙。
- 当前支持通过 SSH stdio 使用 MCP；没有替任何外部 agent 写入客户端配置。
- 本机临时预览 `http://127.0.0.1:3849/#mcp` 通过 SSH 读取**正式数据库**，不是本地测试库；隧道中断或闲置关闭后需重新启动。`bash ops/utopia/preview-tunnel.sh` 会重新解析容器地址并以前台方式运行，Ctrl-C 结束。端口已登记到 local-ops，仅监听本机。
- MCP 凭证只保护 MCP 入口，现有网页及 REST API 仍没有登录鉴权。公网开放前应先决定网站访问网关/认证方案。
- 本次依赖审计仍报告后端生产依赖 6 项（2 高、4 中）、前端生产依赖 2 项（1 高、1 中）；开发依赖也有告警。未做跨范围依赖升级或安全完整验收，不能将此次部署称为完成安全加固。
- Uptime Kuma 容器健康，但尚未初始化管理员账户/本应用监控；未擅自修改 Kuma 账户或其他服务网络。

复验脚本：`ops/utopia/verify-mcp.cjs` 默认只读正式数据（只有 `VERIFY_MODE=canary-create` 会写业务记录）；`tests/utopia-smoke.mjs` 验证 SSH stdio，可选设置 `UTOPIA_WEB_URL` 和 `PLAYWRIGHT_MODULE` 验证网页。
