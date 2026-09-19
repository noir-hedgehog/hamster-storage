import { describe, expect, it } from 'vitest';
import { roomLayout, storageKind, storageRoot } from '../../components/preview/layout';
import type { Storage } from '../../types';
describe('3D preview semantics',()=>{
  it('preserves saved zero coordinates, footprint and rotation',()=>{
    expect(roomLayout({id:'r',name:'客厅',type:'room',locationId:'l',floorplanX:0,floorplanY:50,floorplanWidth:500,floorplanHeight:400,floorplanRotation:90},9,100))
      .toEqual({saved:true,x:0,z:.5,width:5,depth:4,rotation:Math.PI/2});
  });
  it('marks inferred layout and identifies boxes independently from drawers',()=>{
    expect(roomLayout({id:'r',name:'客厅',type:'room',locationId:'l'},0,0).saved).toBe(false);
    expect(storageKind({name:'搬家箱',icon:'📦'})).toBe('box');
    expect(storageKind({name:'抽屉',icon:'📦'})).toBe('drawers');
    expect(storageKind({name:'衣柜',icon:'📦'})).toBe('wardrobe');
  });
  it('resolves nested storage without looping on malformed cycles',()=>{
    const base={type:'storage' as const,roomId:'r',name:'收纳'};
    const rows:Storage[]=[{...base,id:'a'},{...base,id:'b',parentStorageId:'a'},{...base,id:'c',parentStorageId:'b'}];
    expect(storageRoot('c',rows)).toBe('a');
    expect(storageRoot('missing',rows)).toBe('missing');
    expect(['a','c','b']).toContain(storageRoot('c',[{...rows[0],parentStorageId:'c'},...rows.slice(1)]));
  });
});
