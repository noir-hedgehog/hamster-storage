import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Check, Download, Package, Sparkles } from 'lucide-react';
import { useStorage } from '../contexts/StorageContext';
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

export function MovingHome({onPreview}: {onPreview: () => void}) {
  const { refreshData } = useStorage();
  const [items, setItems] = useState<MovingItem[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [input, setInput] = useState('');
  const [preview, setPreview] = useState<MovingItem[] | null>(null);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function load() {
    setLoading(true);
    try { const [data, history] = await Promise.all([request('/items'), request('/import/batches')]); setItems(data.items); setBatches(history.batches); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  async function prepare() {
    setPending(true); setError(''); setMessage('');
    try { setPreview((await request('/import/preview', {input})).items); }
    catch (e) { setError((e as Error).message); }
    finally { setPending(false); }
  }
  async function save() {
    if (!preview || pending) return;
    setPending(true); setError('');
    try {
      const result = await request('/import', {items: preview, input});
      setMessage(`已导入 ${result.importedCount} 件，跳过重复 ${result.skippedCount} 件`);
      setInput(''); setPreview(null); await Promise.all([load(), refreshData(true)]);
    } catch (e) { setError((e as Error).message); }
    finally { setPending(false); }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify({items}, null, 2)], {type:'application/json'}));
    const a = document.createElement('a'); a.href=url; a.download='仓鼠收纳-物品清单.json'; a.click(); URL.revokeObjectURL(url);
  }
  return <div className="moving-page"><div className="moving-shell">
    <header className="moving-hero"><div><p className="moving-eyebrow">搬家模式 · HAMSTER STORAGE</p>
      <h2>把每件东西，<br/>放回它该在的位置。</h2>
      <p>先把脑中的清单倒出来，再慢慢安顿你的家。</p></div>
      <div className="moving-counter"><strong>{items.length}</strong><span>已记录物品</span><button onClick={onPreview}>在空间里查看 <ArrowUpRight size={16}/></button></div>
    </header>
    <section className="moving-card"><p className="moving-eyebrow"><Sparkles size={16}/> 对话式导入</p>
      <h3>这次搬家，带了哪些东西？</h3>
      <p className="moving-muted">每行或每个分号写一件物品。也可以粘贴 GPT 整理好的 JSON 清单。</p>
      <label className="moving-sr" htmlFor="moving-input">待导入物品清单</label>
      <textarea id="moving-input" value={input} disabled={pending} onChange={e => {setInput(e.target.value); setPreview(null);}}
        placeholder={'黑色雨伞，放在玄关；洗衣凝珠 2 袋，放在阳台，价格 39.9\n宜家收纳盒，数量 2，位置衣柜'} />
      <div className="moving-actions"><span className="moving-muted">先预览，再保存。同名、同位置、同品牌自动去重。</span>
        <button disabled={pending || !input.trim()} onClick={prepare}>{pending ? '正在整理…' : '整理清单'}</button></div>
      {error && <p role="alert" className="moving-error">{error}</p>}
      {message && <p role="status" className="moving-success"><Check size={16}/>{message}</p>}
      {preview && <div className="moving-preview"><h4>确认这 {preview.length} 条记录</h4><ItemTable rows={preview}/>
        <div className="moving-actions"><button className="moving-ghost" disabled={pending} onClick={() => setPreview(null)}>返回修改</button>
        <button disabled={pending} onClick={save}>确认并保存</button></div></div>}
      <details className="moving-help"><summary>与 GPT 整理清单时，怎样描述？</summary>
        <p>请把我的物品整理为 JSON 数组，每件包含 name（名称）、quantity（正整数数量）、unit（单位）、location（位置）、brand（品牌）、price（非负单价）、tags（标签数组）。不确定的信息先向我确认，可选字段没有信息时省略。日期使用 YYYY-MM-DD。</p>
        <p>这里按清单格式提取信息，不会自行调用 GPT。确认预览后，记录才会写入物品库。</p></details>
    </section>
    <section className="moving-card"><div className="moving-section-title"><div><p className="moving-eyebrow">物品清单</p><h3>你的家，现在有这些东西</h3></div>
      <div className="moving-actions"><button className="moving-ghost" disabled={loading} onClick={load}>刷新</button><button className="moving-ghost" disabled={!items.length || loading} onClick={download}><Download size={16}/> 导出</button></div></div>
      {loading ? <p className="moving-empty" role="status">正在加载…</p> : !items.length ? <div className="moving-empty"><Package size={28}/><p>还没有记录，从上面的清单开始。</p></div> : <ItemTable rows={items}/>}
    </section>
    {!!batches.length && <details className="moving-card moving-history"><summary>最近导入记录 · {batches.length} 批</summary>
      {batches.map(batch => <div key={batch.id}><time>{new Date(batch.created_at).toLocaleString('zh-CN')}</time><span>导入 {batch.imported_count} · 跳过 {batch.skipped_count}</span></div>)}</details>}
  </div></div>;
}
function ItemTable({rows}: {rows: MovingItem[]}) {
  return <div className="moving-table-wrap"><table className="moving-table"><thead><tr><th>商品</th><th>位置</th><th>数量</th><th>单价</th><th>来源 / 状态</th></tr></thead><tbody>
    {rows.map((item, index) => <tr key={item.id || index}><td><b>{item.name}</b><small>{item.brand || item.category || '未分类'}</small></td><td>{item.location}</td>
      <td>{item.quantity} {item.unit}</td><td>¥{item.price.toFixed(2)}</td><td>{item.duplicate ? '重复 · 将跳过' : item.duplicate === false ? '待保存' : item.source === 'conversation' ? '对话导入' : item.source === 'sites' ? 'Sites 同步' : '手动添加'}</td></tr>)}
  </tbody></table></div>;
}
