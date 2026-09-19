import React, { lazy, Suspense, useMemo, useState } from 'react';
import { ArrowLeft, Box, RotateCcw, Search, Layers, Map as MapIcon } from 'lucide-react';
import { useStorage } from '../contexts/StorageContext';
import { storageRoot } from './preview/layout';
import Scene from './preview/Scene';
import './preview/space.css';

const LayoutEditor=lazy(()=>import('./StorageVisualView').then(module=>({default:module.StorageVisualView})));
export default function StoragePreview({onClose}: {onClose:()=>void}) {
  const {locations,rooms,storages,items,getStoragePath}=useStorage();
  const [home,setHome]=useState(''); const [room,setRoom]=useState('');
  const [selected,setSelected]=useState(''); const [query,setQuery]=useState('');
  const [view,setView]=useState<'perspective'|'top'>('perspective'); const [reset,setReset]=useState(0);
  const [editor,setEditor]=useState(false);
  const visibleRooms=useMemo(()=>rooms.filter(r=>(!home || r.locationId===home)&&(!room || r.id===room)),[rooms,home,room]);
  const visibleStorages=useMemo(()=>storages.filter(s=>visibleRooms.some(r=>r.id===s.roomId)),[storages,visibleRooms]);
  const related=useMemo(()=>{
    const map=new Map<string,typeof items>();
    for(const item of items) {const root=storageRoot(item.storageId,storages);map.set(root,[...(map.get(root)||[]),item]);}
    return map;
  },[items,storages]);
  const filtered=visibleStorages.filter(s=>!query || s.name.includes(query) || items.some(item=>item.storageId===s.id&&item.name.includes(query)));
  const selection=visibleStorages.find(s=>s.id===selected);
  const selectionItems=selection ? (selection.parentStorageId ? items.filter(item=>item.storageId===selected) : related.get(selected)||[]) : [];
  const total=items.filter(item=>visibleStorages.some(s=>s.id===item.storageId));
  const inferred=visibleRooms.some(r=>[r.floorplanX,r.floorplanY,r.floorplanWidth,r.floorplanHeight].some(v=>!Number.isFinite(v))) || visibleStorages.some(s=>[s.floorplanX,s.floorplanY,s.floorplanWidth,s.floorplanHeight].some(v=>!Number.isFinite(v)));
  if(editor) return <Suspense fallback={<p>正在加载布局编辑…</p>}><LayoutEditor onClose={()=>setEditor(false)} onOpen3D={()=>setEditor(false)}/></Suspense>;
  return <section className="space-page"><header className="space-header"><div><p className="space-eyebrow">SPACE EXPLORER</p><h2>让收纳，一目了然。</h2><p>沿着房间找到收纳，再找到你要的那件东西。</p></div>
    <div className="space-toolbar"><button onClick={()=>setEditor(true)}><MapIcon size={16}/>地图与布局编辑</button><button onClick={onClose}><ArrowLeft size={16}/>返回收纳</button></div></header>
    <div className="space-filters"><label>地点<select aria-label="地点" value={home} onChange={e=>{setHome(e.target.value);setRoom('');setSelected('');}}><option value="">全部地点</option>{locations.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></label>
      <label>房间<select aria-label="房间" value={room} onChange={e=>{setRoom(e.target.value);setSelected('');}}><option value="">全部房间</option>{rooms.filter(r=>!home||r.locationId===home).map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
      <span className="space-summary">{visibleRooms.length} 个房间 · {visibleStorages.length} 个收纳 · {total.length} 种物品</span></div>
    <div className="space-workspace"><aside className="space-library"><label className="space-search"><Search size={17}/><input aria-label="搜索收纳或物品" value={query} onChange={e=>setQuery(e.target.value)} placeholder="找收纳或物品…"/></label>
      <h3>收纳目录 <span>{filtered.length}</span></h3><div className="space-storage-list">{filtered.map(s=>{
        const contents=s.parentStorageId?items.filter(i=>i.storageId===s.id):related.get(s.id)||[];
        return <button key={s.id} aria-pressed={selected===s.id} onClick={()=>setSelected(s.id)} className={s.parentStorageId?'space-nested':''}><Box size={18}/><span><strong>{s.name}</strong><small>{rooms.find(r=>r.id===s.roomId)?.name} · {contents.length} 种物品{s.parentStorageId?' · 嵌套收纳':''}</small></span></button>;
      })}{!filtered.length&&<p className="space-empty">{query?'没有匹配的收纳':'还没有收纳位置。先导入清单，或在储物空间中添加。'}</p>}</div></aside>
      <div className="space-stage"><div className="space-stage-tools"><div className="space-segment"><button aria-pressed={view==='perspective'} onClick={()=>setView('perspective')}>立体</button><button aria-pressed={view==='top'} onClick={()=>setView('top')}>俯视</button></div><button onClick={()=>setReset(n=>n+1)}><RotateCcw size={16}/>视角复位</button></div>
        {visibleRooms.length?<Scene rooms={visibleRooms} storages={visibleStorages} selected={selected} onSelect={setSelected} view={view} reset={reset}/>:<div className="space-empty-stage"><Layers size={40}/><h3>给物品一个家</h3><p>添加房间和收纳位置后，就能在这里查看。</p></div>}
        <div className="space-stage-note"><span>拖动旋转 · 滚轮缩放 · 双指缩放 / 平移</span><span>{inferred?'含自动排列的示意布局':'使用已保存的平面布局'} · 模型高度为示意</span></div></div>
      <aside className="space-detail">{selection?<><p className="space-eyebrow">已选收纳</p><h3>{selection.name}</h3><p className="space-path">{getStoragePath(selection.id)}</p><div className="space-detail-count"><strong>{selectionItems.length}</strong><span>种物品{!selection.parentStorageId?'（含下级收纳）':''}</span></div>
        {selection.description&&<p className="space-path">{selection.description}</p>}<h4>里面有什么</h4>{selectionItems.map(item=><article key={item.id}><div><b>{item.name}</b><small>{storages.find(s=>s.id===item.storageId)?.name}</small></div><span>{item.quantity} {item.unit||'件'}</span></article>)}{!selectionItems.length&&<p className="space-empty">这里还没有物品。</p>}</>:<div className="space-detail-placeholder"><Box size={34}/><h3>点选一个收纳</h3><p>点击场景里的模型或左侧目录，查看其中的物品。</p></div>}</aside></div>
  </section>;
}
