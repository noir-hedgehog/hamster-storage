import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Download, Package, PlugZap } from 'lucide-react';
import './moving.css';

type MovingItem = { id?: string; name: string; brand: string; category: string; quantity: number; unit: string; location: string; source?: string; price: number; duplicate?: boolean };
type Batch = {id: string; imported_count: number; skipped_count: number; created_at: string};
const apiRoot = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/v1\/?$/, '');
async function request(path: string, body?: unknown) {
  const response = await fetch(`${apiRoot}${path}`, body === undefined ? undefined : {
    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || '暂时无法连接，请重试');
  return result;
}

export function MovingHome({onPreview,onMcp}: {onPreview: () => void;onMcp:()=>void}) {
  const [items, setItems] = useState<MovingItem[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  async function load() {
    setLoading(true);
    try { const [data, history] = await Promise.all([request('/items'), request('/import/batches')]); setItems(data.items); setBatches(history.batches); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify({items}, null, 2)], {type:'application/json'}));
    const a = document.createElement('a'); a.href=url; a.download='仓鼠收纳-物品清单.json'; a.click(); URL.revokeObjectURL(url);
  }
  return <div className="moving-page"><div className="moving-shell">
    <header className="moving-hero"><div><p className="moving-eyebrow">搬家模式 · HAMSTER STORAGE</p>
      <h2>把每件东西，<br/>放回它该在的位置。</h2>
      <p>统一查看家里的物品、空间和 agent 整理结果。</p></div>
      <div className="moving-counter"><strong>{items.length}</strong><span>已记录物品</span><button onClick={onPreview}>在空间里查看 <ArrowUpRight size={16}/></button></div>
    </header>
    <section className="moving-card"><p className="moving-eyebrow"><PlugZap size={16}/> AGENT 接入</p>
      <h3>在 agent 中整理，在这里查看。</h3>
      <p className="moving-muted">通过 MCP 读取现有数据、录入物品、编辑房间和摆放家具。修改前先预览，确认后保存；也可以继续使用「物品管理」手动录入。</p>
      <p className="moving-muted">MCP 接口：<code>/mcp</code> · 需要配置访问凭证。网页不会保存 agent 的聊天内容。</p>
      <div className="moving-actions"><button onClick={onMcp}><PlugZap size={16}/>MCP 接入与使用文档</button></div>
      {error && <p role="alert" className="moving-error">{error}</p>}
    </section>
    <section className="moving-card"><div className="moving-section-title"><div><p className="moving-eyebrow">物品清单</p><h3>你的家，现在有这些东西</h3></div>
      <div className="moving-actions"><button className="moving-ghost" disabled={loading} onClick={load}>刷新</button><button className="moving-ghost" disabled={!items.length || loading} onClick={download}><Download size={16}/> 导出</button></div></div>
      {loading ? <p className="moving-empty" role="status">正在加载…</p> : !items.length ? <div className="moving-empty"><Package size={28}/><p>还没有记录，可在物品管理中添加，或通过 MCP 录入。</p></div> : <ItemTable rows={items}/>}
    </section>
    {!!batches.length && <details className="moving-card moving-history"><summary>最近导入记录 · {batches.length} 批</summary>
      {batches.map(batch => <div key={batch.id}><time>{new Date(batch.created_at).toLocaleString('zh-CN')}</time><span>导入 {batch.imported_count} · 跳过 {batch.skipped_count}</span></div>)}</details>}
  </div></div>;
}
function ItemTable({rows}: {rows: MovingItem[]}) {
  return <div className="moving-table-wrap"><table className="moving-table"><thead><tr><th>商品</th><th>位置</th><th>数量</th><th>单价</th><th>来源 / 状态</th></tr></thead><tbody>
    {rows.map((item, index) => <tr key={item.id || index}><td><b>{item.name}</b><small>{item.brand || item.category || '未分类'}</small></td><td>{item.location}</td>
      <td>{item.quantity} {item.unit}</td><td>¥{item.price.toFixed(2)}</td><td>{item.duplicate ? '重复 · 将跳过' : item.duplicate === false ? '待保存' : item.source === 'mcp' ? 'Agent 录入' : item.source === 'conversation' ? '历史导入' : item.source === 'sites' ? 'Sites 同步' : '手动添加'}</td></tr>)}
  </tbody></table></div>;
}
