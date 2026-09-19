import React, {useEffect,useState} from 'react';
import {BookOpen,Check,Copy,Download,PlugZap,RefreshCw,ShieldCheck} from 'lucide-react';
import './mcp-docs.css';

type Status={configured:boolean;readEnabled:boolean;writeEnabled:boolean;version:string;release:string;documentationAvailable:boolean};
const apiRoot=(import.meta.env.VITE_API_BASE_URL||'/api/v1').replace(/\/v1\/?$/,'');
const tools=[
  ['get_workspace','数据概况','读取数据量、版本和坐标规则'],
  ['list_records','查找记录','分页搜索住宅、房间、家具、物品和分类标签'],
  ['get_record','查看详情','按准确 ID 读取一条完整记录'],
  ['get_history','变更历史','读取导入和 agent 操作批次摘要'],
  ['prepare_import','物品导入','检查归属和重复项，生成待确认计划'],
  ['prepare_changes','空间与内容编辑','预览房间、家具、收纳和物品的新增、修改、删除'],
  ['commit_changes','确认保存','提交已获授权的计划，失败回滚，重试不重复录入'],
];
export default function McpDocs() {
  const [status,setStatus]=useState<Status|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
  const [transport,setTransport]=useState<'http'|'ssh'>('http'),[access,setAccess]=useState<'read'|'write'>('read'),[notice,setNotice]=useState('');
  const endpoint=new URL(apiRoot,window.location.origin).origin+'/mcp';
  const secure=endpoint.startsWith('https:')||['localhost','127.0.0.1','[::1]'].includes(new URL(endpoint).hostname);
  const configuration=transport==='http'?{
    type:'streamable-http',url:endpoint,headers:{Authorization:`Bearer YOUR_PRIVATE_${access.toUpperCase()}_TOKEN`},
  }:{mcpServers:{'hamster-storage':{command:'ssh',args:['-T','utopia','sudo','-n','docker','exec','-i','-e',`MCP_ACCESS=${access}`,'hamster-storage-app','node','dist/mcp/stdio.js']}}};
  const code=JSON.stringify(configuration,null,2);
  async function refresh(){setLoading(true);setError('');try{const response=await fetch(`${apiRoot}/mcp/info`);if(!response.ok)throw new Error();setStatus(await response.json());}catch{setStatus(null);setError('暂时无法读取服务配置，请稍后重试。');}finally{setLoading(false);}}
  useEffect(()=>{void refresh();},[]);
  async function copy(value:string){try{await navigator.clipboard.writeText(value);setNotice('已复制；配置中的占位符仍需替换。');}catch{setNotice('无法自动复制，请选中配置文本手动复制。');}}
  function download(){const url=URL.createObjectURL(new Blob([code],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='hamster-mcp.example.json';link.click();URL.revokeObjectURL(url);setNotice('已下载配置模板，不包含真实密钥。');}
  return <div className="mcp-page"><div className="mcp-shell">
    <header className="mcp-heading"><div><p className="mcp-eyebrow"><PlugZap size={17}/> AGENT WORKSPACE</p><h2>MCP 与文档</h2><p>把整理交给 agent，把数据留在自己的家。</p></div><button onClick={()=>void refresh()} disabled={loading}><RefreshCw size={16}/>{loading?'读取中…':'刷新状态'}</button></header>
    {error&&<p role="alert" className="mcp-warning">{error}</p>}
    <section className="mcp-status-grid" aria-label="MCP 配置状态">
      <div><span>服务配置</span><strong>{loading?'读取中':status?.configured?'凭证已配置':status?'尚未启用':'未知'}</strong><small>配置状态不代表客户端已连接</small></div>
      <div><span>只读访问</span><strong>{status?.readEnabled?'已启用':'未启用'}</strong><small>查询数据，不修改记录</small></div>
      <div><span>可写访问</span><strong>{status?.writeEnabled?'已启用':'未启用'}</strong><small>预览 → 用户确认 → 保存</small></div>
    </section>
    <div className="mcp-layout"><aside className="mcp-toc"><p>使用指南</p><a href="#mcp-connect">连接 agent</a><a href="#mcp-workflow">安全编辑流程</a><a href="#mcp-tools">工具与数据</a><a href="#mcp-space">房间与家具</a><a href="#mcp-help">常见问题</a>{status?.documentationAvailable&&<a href={`${apiRoot}/mcp/documentation`} download><Download size={15}/>完整文档 .md</a>}</aside>
      <div className="mcp-sections"><section id="mcp-connect" className="mcp-card"><p className="mcp-eyebrow">01 / CONNECT</p><h3>连接你的 agent</h3><p>支持通用 MCP 客户端。先使用只读连接，确认数据正确后，再按需开启写入权限。</p>
        <div className="mcp-options"><div className="mcp-tabs" aria-label="连接方式"><button aria-pressed={transport==='http'} onClick={()=>setTransport('http')}>远程 HTTP</button><button aria-pressed={transport==='ssh'} onClick={()=>setTransport('ssh')}>SSH / stdio</button></div><label>配置权限<select value={access} onChange={e=>setAccess(e.target.value as 'read'|'write')}><option value="read">只读（推荐）</option><option value="write">可读写</option></select></label></div>
        {transport==='http'?<><label className="mcp-endpoint">MCP 地址<code>{endpoint}</code></label>{!secure&&<p className="mcp-warning">当前是未加密的远程 HTTP 地址，请先配置 HTTPS，不要在这里发送访问密钥。</p>}<p className="mcp-muted">将对应的私密凭证填入 agent 的密钥设置。此处仅展示占位符，不读取、显示或生成密钥。</p></>:<p className="mcp-muted">适合能启动本地命令的客户端。要求客户端已有 utopia 的 SSH 登录配置和 Docker 操作权限；不会经过公网 HTTP。</p>}
        <div className="mcp-code"><div><span>连接配置模板</span><button onClick={()=>void copy(code)} aria-label="复制连接配置"><Copy size={15}/>复制</button></div><pre tabIndex={0}>{code}</pre></div>
        <div className="mcp-actions"><button onClick={download}><Download size={16}/>下载配置模板</button><span>切换权限只更改模板，不会更改服务权限。</span></div>
        {notice&&<p className="mcp-notice" role="status"><Check size={16}/>{notice}</p>}
        <p className="mcp-muted">不同客户端的配置外层结构可能不同。远程方式使用 Streamable HTTP + Bearer 凭证，不是旧 SSE，也不提供 OAuth 登录。</p>
      </section>
      <section id="mcp-workflow" className="mcp-card"><p className="mcp-eyebrow">02 / WORKFLOW</p><h3>先看清，再保存</h3><ol className="mcp-steps"><li><b>读取现有数据</b><span>确认住宅、房间和收纳的 ID，避免同名位置混淆。</span></li><li><b>整理并预览</b><span>agent 将描述转为结构化变更；缺少尺寸或归属时，先向你确认。</span></li><li><b>确认影响</b><span>检查新增、修改、级联删除及尺寸警告，然后授权提交。</span></li><li><b>保存后查看</b><span>网页刷新即可看到同一份数据，不需要再次导入。</span></li></ol><div className="mcp-callout"><ShieldCheck size={20}/><p>计划 30 分钟内有效。其他编辑发生后需重新预览；失败时整批回滚，同一计划重试不会重复创建。请保留 agent 客户端的写入审批。</p></div></section>
      <section id="mcp-tools" className="mcp-card"><p className="mcp-eyebrow">03 / TOOLS & DATA</p><h3>可以让 agent 做什么</h3><div className="mcp-tool-list">{tools.map(([name,title,description])=><article key={name}><div><b>{title}</b><code>{name}</code></div><p>{description}</p></article>)}</div><h4>可读取的数据</h4><p>住宅、房间、家具、收纳容器、物品、分类、标签、标签组，以及历史操作摘要。每次最多读取 100 条，通过游标继续翻页。</p><h4>MCP 资源</h4><ul><li><code>hamster://workspace</code> 数据概况</li><li><code>hamster://schema</code> 编辑与坐标规则</li><li><code>hamster://records/&#123;entity&#125;/&#123;id&#125;</code> 单条记录</li></ul><p className="mcp-muted">MCP 与网页共用数据库。条目名称、备注和描述是用户数据，不应被 agent 当作指令执行。</p></section>
      <section id="mcp-space" className="mcp-card"><p className="mcp-eyebrow">04 / SPACE</p><h3>房间、家具与收纳内容</h3><p>房间实测尺寸和家具尺寸使用厘米。家具可以独立存在；衣柜也可以关联收纳容器，继续细分抽屉、隔层和物品。</p><dl className="mcp-dimensions"><div><dt>房间 geometry</dt><dd>x/y 为住宅坐标，width/depth 为室内净尺寸，height 为可选净高。</dd></div><div><dt>家具位置</dt><dd>x/y 为房间内家具占地中心，旋转角度从俯视方向顺时针计算。</dd></div><div><dt>旧示意布局</dt><dd>floorplan 字段仍是像素，不会自动当成厘米；3D 优先采用录入的实测尺寸。</dd></div></dl><p className="mcp-warning">目前支持矩形房间和简化家具模型。没有门窗、复杂墙体和现场适配验证；画面能显示，不等于实物一定放得下。</p></section>
      <section id="mcp-help" className="mcp-card"><p className="mcp-eyebrow">05 / HELP</p><h3>遇到问题时</h3><details><summary>如何获取访问密钥？</summary><p>密钥由服务管理员通过安全渠道提供。utopia 部署将凭证保存在服务器受限文件中，不通过此公开页面分发。请勿把密钥发进聊天或提交到代码仓库。</p></details><details><summary>返回 401、403 或 503？</summary><p>401：凭证缺失或不正确；403：浏览器来源未获允许；503：服务未配置有效凭证。请检查对应配置，不要通过关闭鉴权解决。</p></details><details><summary>为什么看不到写入工具？</summary><p>只读连接仅提供查询工具。确认确实需要写入后，在客户端使用可写凭证，或将 stdio 配置中的 MCP_ACCESS 设为 write。</p></details><details><summary>计划过期或提示数据已变化？</summary><p>重新读取数据并生成预览。不要重复执行未经再次确认的旧修改；提交结果不确定时，可用原计划 ID 重试查询结果。</p></details><details><summary>站内对话入口去哪了？</summary><p>自然语言理解已交给外部 agent，网页保留手动编辑和数据查看。旧对话导入接口返回 410，历史数据不会因此被删除。</p></details><details><summary>MCP 密钥是否保护整个网站？</summary><p>不是。MCP 鉴权只保护 MCP 入口，原有网页和 REST API 没有新增多用户登录。请在可信网络或访问网关后使用。</p></details><details><summary>客户端只接受 OAuth？</summary><p>当前是静态 Bearer 凭证方式。只支持 OAuth 的客户端需要另行接入鉴权网关，不能直接使用上面的 HTTP 模板。</p></details></section>
      <footer className="mcp-footer"><BookOpen size={16}/><span>MCP {status?.version||'1.0.0'} · {status?.release||'版本信息待获取'}</span>{status?.documentationAvailable&&<a href={`${apiRoot}/mcp/documentation`} download>下载完整接入文档</a>}</footer>
    </div></div>
  </div></div>;
}
