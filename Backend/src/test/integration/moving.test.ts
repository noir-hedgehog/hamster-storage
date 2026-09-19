import { beforeAll, describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import db from '../../db/database';
import movingRoutes from '../../routes/moving';
import { initializeMoving, importMovingItems, normalizeCandidates, previewItems, listMovingItems } from '../../services/moving';
import { ItemModel } from '../../models/ItemModel';

const app=express();app.use(express.json());app.use('/api',movingRoutes);
beforeAll(()=>initializeMoving());
const migrate=(items:unknown)=>importMovingItems(normalizeCandidates(items),'migration','sites');
describe('retired conversation routes and retained data migration/manual entry',()=>{
  it('removes both conversational HTTP endpoints without writes',async()=>{
    for(const path of ['/api/import','/api/import/preview']) {
      const response=await request(app).post(path).send({input:'不应保存',items:[{name:'不应保存'}]});
      expect(response.status).toBe(410);
    }
    expect(ItemModel.findAll()).toHaveLength(0);
  });
  it('keeps preview/dedup migration logic separate from retired chat routes',()=>{
    const items=[{name:'迁移纸巾',quantity:3,location:'测试客厅'},{name:'迁移纸巾',quantity:3,location:'测试客厅'}];
    const before=ItemModel.findAll();
    expect(previewItems(normalizeCandidates(items)).map(row=>row.duplicate)).toEqual([false,true]);
    expect(ItemModel.findAll()).toEqual(before);
    expect(migrate(items)).toMatchObject({importedCount:1,skippedCount:1});
    expect(migrate(items)).toMatchObject({importedCount:0,skippedCount:2});
    const item=listMovingItems().find(row=>row.name==='迁移纸巾')!;
    expect(ItemModel.findById(item.id)).toMatchObject({quantity:3,storageId:item.storageId});
  });
  it('preserves cents, dates, serialized tags and export round trips',()=>{
    expect(migrate([{name:'迁移相机',location:'工作室',brand:'品牌',category:'电子设备',price_cents:399950,tags:'["易碎","贵重"]',purchase_date:'2026-09-01'}]).importedCount).toBe(1);
    const item=listMovingItems().find(row=>row.name==='迁移相机')!;
    expect(item).toMatchObject({price:3999.5,purchase_date:'2026-09-01',source:'sites'});
    expect([...item.tags].sort()).toEqual(['易碎','贵重'].sort());
    expect(migrate([item]).importedCount).toBe(0);
  });
  it('rejects a malformed migration atomically',()=>{
    const before=ItemModel.findAll();
    expect(()=>migrate([{name:'不保存'},{name:'错误',quantity:-1}])).toThrow();
    expect(ItemModel.findAll()).toEqual(before);
  });
  it('rolls back the migration when a write fails midway',()=>{
    const before=ItemModel.findAll();
    db.exec("CREATE TRIGGER fail_migration BEFORE INSERT ON items WHEN NEW.name='故意失败' BEGIN SELECT RAISE(ABORT,'test failure'); END;");
    try{expect(()=>migrate([{name:'需回滚'},{name:'故意失败'}])).toThrow();}finally{db.exec('DROP TRIGGER fail_migration');}
    expect(ItemModel.findAll()).toEqual(before);
  });
  it('retains manual entry and handles duplicates',async()=>{
    const data={name:'测试手动物品',location:'手动测试位置'};
    expect((await request(app).post('/api/items').send(data)).status).toBe(201);
    expect((await request(app).post('/api/items').send(data)).status).toBe(409);
    expect((await request(app).get('/api/items')).body.items.some((row:any)=>row.name===data.name)).toBe(true);
    expect((await request(app).get('/api/import/batches')).status).toBe(200);
  });
});
