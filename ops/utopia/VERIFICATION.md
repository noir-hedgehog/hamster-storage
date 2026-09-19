# 2026-09-19 发布验收

## 已完成

- 应用源码快照：`a380446601410a0b2430418250f10e4b8823e0ef`，发布分支 `codex/docker-sites-parity-3d`；后续该分支的代理配置修复不改变应用镜像内容。
- utopia 正式运行镜像：`hamster-storage-app:20260919-sites-parity-v1`，构建 manifest `sha256:98312c9f8df6f4de532b2a05a9ca913cf49c6e2200546a36df32211dbb0615a8`。
- 正式容器健康；由 Caddy 容器访问唯一上游的 `/health` 返回正常，`/api/items` 返回 `{"items":[]}`。
- 正式数据卷沿用 `hamster-storage_hamster-storage-data`。升级前物品为 0，升级后仍为 0。
- SQLite 备份：容器内 `/app/data/backups/pre-parity-2026-09-19T13-35-15-789Z.db`。
- 原 compose、原 Caddy 配置和原服务登记保存于 `/opt/apps/hamster-storage/backups/20260919-sites-parity-v1/`。
- 旧镜像另保留 `hamster-storage-app:before-sites-parity`。
- 独立 Docker 测试容器验证：预览不写库、导入、重复跳过、旧接口联动、静态资源、非法输入拒绝、容器重启后记录仍在。测试容器和测试卷已删除，不含用户数据。
- 后端 25 项测试通过（Node 24 本地使用 forks）；前端 10 项测试通过；新界面及其依赖的 TypeScript 检查通过。
- 1440px / 390px 浏览器验证：导入、页面刷新、嵌套收纳、点击模型、WebGL 丢失与恢复、俯视/复位、旧布局往返、反复挂载、无页面横向溢出、无运行时异常。
- Sites 线上 items / import_batches 的实际读取均为零行，无待迁移内容；未修改 Sites 线上数据。
- SSH 已支持 `utopia` 别名，服务器登记已标记 `utopia`。

## 代理修复

同网络出现另一个名为 app 的 Compose 服务，DNS `app` 轮询到两个地址，造成间歇性连接拒绝。已将仓鼠收纳的上游改为唯一名称 `hamster-storage-app:3847`；配置已验证并平滑加载，其他域名块保持原样。

## 公网访问未通过

DNS 已返回 `storage.virtualink.cafe A 43.156.132.51`。主机 80 / 443 已监听，UFW 不启用，本机 HTTP 返回 308 HTTPS 跳转。但公网 TCP / TLS 连接超时，证书机构的 HTTP-01 和 TLS-ALPN-01 校验也都返回连接超时、疑似防火墙拦截。HTTPS 证书尚未完成签发，不能声称域名已可访问。

下一步需检查云平台该实例的安全组 / 轻量服务器防火墙，允许入站 TCP 80 和 443，然后重新验证证书与公网页面。当前没有可用的云平台管理连接；没有擅自替换其他服务或关闭防火墙。

本地浏览器预览使用独立内存数据库；其中公寓和物品为测试示例，不是正式数据。
