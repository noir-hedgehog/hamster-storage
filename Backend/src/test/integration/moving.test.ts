import { beforeAll, describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import db from '../../db/database';
import movingRoutes from '../../routes/moving';
import { initializeMoving, parseInput } from '../../services/moving';
import { ItemModel } from '../../models/ItemModel';

const app = express(); app.use(express.json()); app.use('/api', movingRoutes);
beforeAll(() => initializeMoving());
describe('Sites-compatible moving workflow on existing storage database', () => {
  it('parses the exact examples from Sites without losing names, unit or price', () => {
    const rows=parseInput('黑色雨伞，放在玄关；洗衣凝珠 2 袋，放在阳台，价格 39.9\n宜家收纳盒，数量 2，位置衣柜');
    expect(rows.map(r=>[r.name,r.quantity,r.unit,r.location,r.price])).toEqual([
      ['黑色雨伞',1,'件','玄关',0],['洗衣凝珠',2,'袋','阳台',39.9],['宜家收纳盒',2,'件','衣柜',0],
    ]);
  });
  it('previews without writes, commits once and exposes identical records to legacy management', async () => {
    const input='测试纸巾 3 包，放在测试客厅；测试纸巾 3 包，放在测试客厅';
    const before=db.prepare('SELECT COUNT(*) AS n FROM items').get();
    const preview=await request(app).post('/api/import/preview').send({input});
    expect(preview.status).toBe(200);expect(preview.body.items.map((r:any)=>r.duplicate)).toEqual([false,true]);
    expect(db.prepare('SELECT COUNT(*) AS n FROM items').get()).toEqual(before);
    const saved=await request(app).post('/api/import').send({input});
    expect(saved.body).toMatchObject({importedCount:1,skippedCount:1});
    const again=await request(app).post('/api/import').send({input});
    expect(again.body).toMatchObject({importedCount:0,skippedCount:2});
    const list=await request(app).get('/api/items');
    const item=list.body.items.find((row:any)=>row.name==='测试纸巾');
    expect(item).toMatchObject({quantity:3,location:'测试客厅',source:'conversation'});
    expect(ItemModel.findById(item.id)).toMatchObject({quantity:3,storageId:item.storageId});
  });
  it('accepts D1 rows with cents, dates and serialized tags; exports round-trip without duplicates', async () => {
    const result=await request(app).post('/api/import').send({items:[{name:'测试相机',location:'工作室',brand:'相机品牌',category:'电子设备',quantity:1,unit:'台',price_cents:399950,tags:'["易碎","贵重"]',purchase_date:'2026-09-01'}]});
    expect(result.body.importedCount).toBe(1);
    const list=await request(app).get('/api/items');const item=list.body.items.find((r:any)=>r.name==='测试相机');
    expect(item).toMatchObject({price:3999.5,price_cents:399950,purchase_date:'2026-09-01',category:'电子设备'});
    expect([...item.tags].sort()).toEqual(['易碎','贵重'].sort());
    const again=await request(app).post('/api/import').send({input:JSON.stringify({items:[item]})});
    expect(again.body).toMatchObject({importedCount:0,skippedCount:1});
  });
  it('rejects an invalid batch entirely and does not create locations or batches', async () => {
    const count=()=>db.prepare('SELECT (SELECT COUNT(*) FROM items) items,(SELECT COUNT(*) FROM rooms) rooms,(SELECT COUNT(*) FROM import_batches) batches').get();
    const before=count();
    for(const body of [{items:[{name:'应该不保存'},{name:'错误',quantity:-1}]},{items:[{name:'错误价格',price:'NaN'}]},{items:[{name:'空小数',quantity:1.5}]},{input:'{bad json}'},{items:[]}]) {
      expect((await request(app).post('/api/import').send(body)).status).toBe(400);
    }
    expect(count()).toEqual(before);
  });
  it('rolls back the entire batch when a database write fails halfway', async () => {
    db.exec("CREATE TRIGGER reject_moving_test BEFORE INSERT ON items WHEN NEW.name='故意失败' BEGIN SELECT RAISE(ABORT,'test failure'); END;");
    const before=db.prepare('SELECT COUNT(*) AS n FROM items').get();
    try { expect((await request(app).post('/api/import').send({items:[{name:'需回滚',location:'临时回滚房间'},{name:'故意失败'}]})).status).toBe(500); }
    finally {db.exec('DROP TRIGGER reject_moving_test');}
    expect(db.prepare('SELECT COUNT(*) AS n FROM items').get()).toEqual(before);
    expect(db.prepare("SELECT id FROM rooms WHERE name='临时回滚房间'").get()).toBeUndefined();
  });
  it('offers Sites manual create and reports duplicates without a server error', async () => {
    const payload={name:'测试手动物品',location:'手动测试位置'};
    expect((await request(app).post('/api/items').send(payload)).status).toBe(201);
    expect((await request(app).post('/api/items').send(payload)).status).toBe(409);
  });
  it('deduplicates a legacy item when its storage is entered by short name',async()=>{
    db.prepare("INSERT INTO locations(id,name) VALUES ('legacy-l','旧家')").run();
    db.prepare("INSERT INTO rooms(id,name,location_id) VALUES ('legacy-r','书房','legacy-l')").run();
    db.prepare("INSERT INTO storages(id,name,room_id) VALUES ('legacy-s','唯一书架','legacy-r')").run();
    ItemModel.create({name:'旧书',storageId:'legacy-s',quantity:1});
    const result=await request(app).post('/api/import').send({items:[{name:'旧书',location:'唯一书架'}]});
    expect(result.body).toMatchObject({importedCount:0,skippedCount:1});
  });
});
