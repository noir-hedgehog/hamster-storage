import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Room, Storage } from '../../types';
import { roomLayout, storageKind, storageRoot } from './layout';

type Props = { rooms: Room[]; storages: Storage[]; selected: string; onSelect: (id: string) => void; view: 'perspective'|'top'; reset: number };
type SceneHandle = {select: (id: string) => void; fit: () => void; top: (value: boolean) => void};

export default function Scene({rooms, storages, selected, onSelect, view, reset}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<SceneHandle>();
  const selectCallback = useRef(onSelect);
  selectCallback.current = onSelect;
  const selectedRef = useRef(selected); selectedRef.current = selected;
  const viewRef = useRef(view); viewRef.current = view;
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const container = host.current!;
    setError('');
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'low-power'}); }
    catch { setError('此设备暂时无法显示 3D，仍可从收纳列表查看全部物品。'); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor('#f0f2eb');
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute('aria-label', '房间与收纳空间三维预览，点击收纳查看物品');
    renderer.domElement.setAttribute('role', 'img');
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8b9c87, 1.7));
    const sunlight = new THREE.DirectionalLight(0xfff4df, 1.8); sunlight.position.set(8, 14, 6); scene.add(sunlight);
    const camera = new THREE.PerspectiveCamera(38, 1, .01, 10000);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.maxPolarAngle = Math.PI / 2 - .04;
    controls.minDistance = .2;
    controls.screenSpacePanning = true;
    const render = () => { if (!document.hidden) renderer.render(scene, camera); };
    controls.addEventListener('change', render);
    const models = new Map<string, THREE.Group>();
    const selectable: THREE.Object3D[] = [];
    const content = new THREE.Group(); scene.add(content);
    const material = (color: THREE.ColorRepresentation) => new THREE.MeshStandardMaterial({color, roughness:.8});
    const box = (parent: THREE.Group, w: number, h: number, d: number, x: number, y: number, z: number, color: THREE.ColorRepresentation) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material(color)); mesh.position.set(x,y,z); parent.add(mesh); return mesh;
    };
    const label = (parent: THREE.Group, text: string, x: number, y: number, z: number, width: number) => {
      const canvas = document.createElement('canvas'); canvas.width=Math.min(512,Math.max(160,text.length*40+40)); canvas.height=72;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle='#fbfaf5'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#314c3e';
      ctx.font='600 36px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(text,canvas.width/2,36,canvas.width-24);
      const texture = new THREE.CanvasTexture(canvas); texture.colorSpace=THREE.SRGBColorSpace;
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({map:texture, depthTest:false}));
      sprite.scale.set(width,width*72/canvas.width,1); sprite.position.set(x,y,z); parent.add(sprite); return sprite;
    };
    let fallbackX = 0;
    rooms.forEach((room, index) => {
      const rootStorages = storages.filter(s => s.roomId===room.id && (!s.parentStorageId || !storages.some(parent => parent.id===s.parentStorageId)));
      const layout = roomLayout(room,index,rootStorages.length);
      if (!layout.saved) { layout.x = fallbackX; layout.z = 0; }
      fallbackX = Math.max(fallbackX, layout.x+layout.width+1.5);
      const group = new THREE.Group(); group.position.set(layout.x,0,layout.z); group.rotation.y=-layout.rotation; content.add(group);
      const {width:w,depth:d} = layout;
      box(group,w,.06,d,w/2,-.035,d/2,'#e0e5d8');
      box(group,w,.6,.06,w/2,.27,0,'#d5decc');
      box(group,.06,.6,d,0,.27,d/2,'#d5decc');
      label(group, room.name,w/2,.12,d+.25,Math.min(w,1.2));
      rootStorages.forEach((storage, i) => {
        const kind = storageKind(storage);
        const sw = Math.max(.06,(storage.floorplanWidth ?? 70)/100);
        const sd = Math.max(.06,(storage.floorplanHeight ?? 50)/100);
        const sh = kind==='wardrobe' ? 1.5 : kind==='shelf' ? 1.25 : kind==='drawers' ? .85 : .4;
        const columns = Math.max(1,Math.floor((w-.4)/1.2));
        const x = Number.isFinite(storage.floorplanX) ? storage.floorplanX!/100-layout.x : .3+(i%columns)*1.2;
        const z = Number.isFinite(storage.floorplanY) ? storage.floorplanY!/100-layout.z : .3+Math.floor(i/columns)*1.1;
        const model = new THREE.Group(); model.position.set(x+sw/2,0,z+sd/2); model.rotation.y=-(storage.floorplanRotation || 0)*Math.PI/180;
        model.userData.storageId=storage.id; group.add(model); models.set(storage.id,model);
        if (kind==='shelf') {
          box(model,.035,sh,sd,-sw/2,sh/2,0,'#b7b598'); box(model,.035,sh,sd,sw/2,sh/2,0,'#b7b598');
          for(let level=0;level<=3;level++) box(model,sw,.035,sd,0,level*sh/3+.025,0,'#c7c5a6');
          box(model,sw,sh,.025,0,sh/2,-sd/2,'#d6d6bd');
        } else {
          box(model,sw,sh,sd,0,sh/2,0,kind==='box'?'#d1b489':'#98b29a');
          if(kind==='box') box(model,sw+.035,.045,sd+.035,0,sh+.02,0,'#e2cba7');
          else if(kind==='wardrobe') {
            box(model,.012,sh*.92,.015,0,sh/2,sd/2+.01,'#45634e');
            [-1,1].forEach(sign => box(model,.025,.17,.025,sign*.07,sh*.5,sd/2+.025,'#e9ead5'));
          } else {
            for(let level=1;level<3;level++) box(model,sw,.008,.015,0,level*sh/3,sd/2+.012,'#45634e');
            for(let level=0;level<3;level++) box(model,sw*.25,.025,.025,0,(level+.5)*sh/3,sd/2+.025,'#e9ead5');
          }
        }
        model.traverse(object => {if (object instanceof THREE.Mesh) {object.userData.storageId=storage.id; selectable.push(object);}});
        const nameLabel=label(model,storage.name,0,sh+.24,0,Math.max(.9,Math.min(1.8,sw)));
        nameLabel.visible=false;
      });
    });
    const bounds = new THREE.Box3().setFromObject(content);
    if(bounds.isEmpty()) bounds.set(new THREE.Vector3(-2,0,-2),new THREE.Vector3(2,1,2));
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    let isTop = viewRef.current==='top';
    function fit() {
      const halfFov=THREE.MathUtils.degToRad(camera.fov/2);
      const limitingFov=Math.min(halfFov,Math.atan(Math.tan(halfFov)*camera.aspect));
      const distance = Math.max(size.length()/2,1)/Math.sin(limitingFov)*1.15;
      controls.target.copy(center);
      camera.position.copy(center).add(new THREE.Vector3(isTop ? 0 : 1,isTop ? 1 : 1.1,isTop ? .001 : 1.3).normalize().multiplyScalar(distance));
      camera.near=Math.max(.001,distance/1000); camera.far=distance*100; camera.updateProjectionMatrix();
      controls.maxDistance=distance*6; controls.update(); render();
    }
    function select(id: string) {
      const root = storageRoot(id,storages);
      models.forEach((model,key) => model.traverse(object => {
        if(object instanceof THREE.Sprite) object.visible=key===root;
        if(object instanceof THREE.Mesh) { const mat=object.material as THREE.MeshStandardMaterial; mat.emissive.set(key===root?'#62874b':'#000000'); mat.emissiveIntensity=key===root?.35:0; }
      })); render();
    }
    api.current = {select, fit, top(value) {isTop=value; fit();}};
    const resize = () => {
      const width=Math.max(container.clientWidth,1), height=Math.max(container.clientHeight,1);
      camera.aspect=width/height; camera.updateProjectionMatrix(); renderer.setSize(width,height); fit();
    };
    const observer = new ResizeObserver(resize); observer.observe(container); resize(); select(selectedRef.current);
    const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2();
    let down: {x:number;y:number}|null=null;
    const onDown = (e: PointerEvent) => {down={x:e.clientX,y:e.clientY};};
    const hit = (e: PointerEvent) => {
      const rect=renderer.domElement.getBoundingClientRect(); pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
      raycaster.setFromCamera(pointer,camera); return raycaster.intersectObjects(selectable,false)[0]?.object.userData.storageId;
    };
    const onUp = (e: PointerEvent) => {if(down && Math.hypot(e.clientX-down.x,e.clientY-down.y)<6) {const id=hit(e); if(id) selectCallback.current(id);} down=null;};
    const onMove = (e: PointerEvent) => {renderer.domElement.style.cursor=hit(e)?'pointer':'grab';};
    const onLost = (e: Event) => {e.preventDefault();setError('3D 显示已暂停。可继续使用收纳列表，或重新加载预览。');};
    const onVisibility = () => {if(!document.hidden)render();};
    renderer.domElement.addEventListener('pointerdown',onDown);
    renderer.domElement.addEventListener('pointerup',onUp);
    renderer.domElement.addEventListener('pointermove',onMove);
    renderer.domElement.addEventListener('webglcontextlost',onLost);
    document.addEventListener('visibilitychange',onVisibility);
    return () => {
      api.current=undefined; observer.disconnect(); controls.removeEventListener('change',render); controls.dispose();
      document.removeEventListener('visibilitychange',onVisibility);
      renderer.domElement.removeEventListener('pointerdown',onDown);renderer.domElement.removeEventListener('pointerup',onUp);renderer.domElement.removeEventListener('pointermove',onMove);renderer.domElement.removeEventListener('webglcontextlost',onLost);
      const geometries=new Set<THREE.BufferGeometry>(), materials=new Set<THREE.Material>(), textures=new Set<THREE.Texture>();
      scene.traverse(object=>{if(object instanceof THREE.Mesh || object instanceof THREE.Sprite){if(object instanceof THREE.Mesh)geometries.add(object.geometry);for(const mat of Array.isArray(object.material)?object.material:[object.material]){materials.add(mat);if(mat.map)textures.add(mat.map);}}});
      geometries.forEach(g=>g.dispose()); textures.forEach(t=>t.dispose()); materials.forEach(m=>m.dispose());
      renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();
    };
  },[rooms,storages,retry]);
  useEffect(()=>api.current?.select(selected),[selected]);
  useEffect(()=>api.current?.top(view==='top'),[view]);
  useEffect(()=>api.current?.fit(),[reset]);
  return <div className="space-canvas" ref={host}>{error && <div className="space-fallback" role="alert"><p>{error}</p><button onClick={()=>setRetry(n=>n+1)}>重新加载 3D</button></div>}</div>;
}
