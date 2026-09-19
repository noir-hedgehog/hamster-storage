import { beforeAll, describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import db from '../../db/database';
import { initializeMoving, listMovingItems } from '../../services/moving';
import { initializeWorkspace, prepareChanges, commitChanges, prepareImport, allEntities, listEntities } from '../../services/workspace';
import { createMcpServer } from '../../mcp/server';
import { mcpRouter } from '../../mcp/http';
import { mcpInfoRouter } from '../../routes/mcpInfo';
import { LocationModel } from '../../models/LocationModel';
import { RoomModel } from '../../models/RoomModel';
import { StorageModel } from '../../models/StorageModel';
import { FurnitureModel } from '../../models/SpaceModel';
import { ItemModel } from '../../models/ItemModel';

beforeAll(()=>{initializeMoving();initializeWorkspace();});
const owner='test-owner';
const createHome=(name:string)=>LocationModel.create({name});
function fixture(name:string) {
  const home=createHome(name),room=RoomModel.create({name:'卧室',locationId:home.id});
  const storage=StorageModel.create({name:'衣柜',roomId:room.id});
  return {home,room,storage};
}
describe('agent workspace transactional boundary',()=>{
  it('preserves zero coordinates and supplied geometry on create and reload',()=>{
    const home=createHome('零坐标');
    const room=RoomModel.create({name:'房间',locationId:home.id,floorplanX:0,floorplanY:0,floorplanWidth:400,floorplanHeight:300,floorplanRotation:0,
      geometry:{unit:'cm',x:0,y:0,width:400,depth:300,rotation:0}});
    const storage=StorageModel.create({name:'柜',roomId:room.id,floorplanX:0,floorplanY:0,floorplanWidth:80,floorplanHeight:50,floorplanRotation:0});
    expect(RoomModel.findById(room.id)).toMatchObject({floorplanX:0,floorplanY:0,geometry:{x:0,width:400}});
    expect(StorageModel.findById(storage.id)).toMatchObject({floorplanX:0,floorplanY:0,floorplanWidth:80});
  });
  it('previews a home/room/furniture/storage/item chain without business writes, commits atomically and replays',()=>{
    const before=allEntities();
    const plan=prepareChanges([
      {entity:'locations',action:'create',ref:'home',data:{name:'MCP 新家'}},
      {entity:'rooms',action:'create',ref:'room',data:{name:'次卧',locationId:'$home',geometry:{unit:'cm',x:0,y:0,width:400,depth:350,height:280,rotation:0}}},
      {entity:'storages',action:'create',ref:'cabinet',data:{name:'衣柜内部',roomId:'$room'}},
      {entity:'storages',action:'create',ref:'drawer',data:{name:'上层抽屉',roomId:'$room',parentStorageId:'$cabinet'}},
      {entity:'furniture',action:'create',ref:'furniture',data:{name:'白色衣柜',roomId:'$room',storageId:'$cabinet',kind:'wardrobe',unit:'cm',width:120,depth:60,height:200,x:80,y:50,rotation:0}},
      {entity:'items',action:'create',data:{name:'袜子',storageId:'$drawer',quantity:3,price:0}},
    ],owner);
    expect(allEntities()).toEqual(before);expect(plan.results).toHaveLength(6);expect(plan.warnings).toEqual([]);
    const result=commitChanges(plan.planId,owner,true);
    expect(RoomModel.findById(result.refs.room)?.geometry?.width).toBe(400);
    expect(FurnitureModel.findById(result.refs.furniture)?.storageId).toBe(result.refs.cabinet);
    expect(listMovingItems().find(i=>i.name==='袜子')).toMatchObject({source:'mcp',quantity:3});
    const after=allEntities();expect(commitChanges(plan.planId,owner,true)).toMatchObject({replayed:true});expect(allEntities()).toEqual(after);
  });
  it('rejects unknown IDs, unknown fields, negative sizes, impossible dates and ambiguous repeat creation',()=>{
    const {room,storage}=fixture('校验');const before=allEntities();
    for(const op of [
      {entity:'items',action:'create',data:{name:'丢失位置',storageId:'missing'}},
      {entity:'rooms',action:'update',id:room.id,data:{unsupported:true}},
      {entity:'rooms',action:'update',id:room.id,data:{geometry:{unit:'cm',x:0,y:0,width:-1,depth:300}}},
      {entity:'items',action:'create',data:{name:'错误日期',storageId:storage.id,purchaseDate:'2026-02-30'}},
      {entity:'storages',action:'create',data:{name:'衣柜',roomId:room.id}},
    ]) expect(()=>prepareChanges([op],owner)).toThrow();
    expect(allEntities()).toEqual(before);
  });
  it('rejects cross-room parents, hierarchy cycles and rebinding a furniture container as nested',()=>{
    const a=fixture('层级 A'),b=fixture('层级 B');
    expect(()=>prepareChanges([{entity:'storages',action:'update',id:a.storage.id,data:{parentStorageId:b.storage.id}}],owner)).toThrow('同一房间');
    const child=StorageModel.create({name:'子层',roomId:a.room.id,parentStorageId:a.storage.id});
    expect(()=>prepareChanges([{entity:'storages',action:'update',id:a.storage.id,data:{parentStorageId:child.id}}],owner)).toThrow('循环');
    RoomModel.update(a.room.id,{geometry:{unit:'cm',x:0,y:0,width:400,depth:400,rotation:0}});
    FurnitureModel.create({name:'衣柜家具',kind:'wardrobe',roomId:a.room.id,storageId:a.storage.id,unit:'cm',width:100,depth:60,height:200,x:100,y:100,rotation:0});
    const sibling=StorageModel.create({name:'其他收纳',roomId:a.room.id});
    expect(()=>prepareChanges([{entity:'storages',action:'update',id:a.storage.id,data:{parentStorageId:sibling.id}}],owner)).toThrow('已关联家具');
    expect(()=>prepareChanges([{entity:'rooms',action:'update',id:a.room.id,data:{geometry:null}}],owner)).toThrow('不能移除');
  });
  it('requires measured rooms for furniture and reports boundary/height warnings without changing data',()=>{
    const {room}=fixture('摆放校验');
    const data={name:'床',roomId:room.id,kind:'bed',unit:'cm',width:150,depth:200,height:100,x:50,y:50,rotation:0};
    expect(()=>prepareChanges([{entity:'furniture',action:'create',data}],owner)).toThrow('厘米尺寸');
    RoomModel.update(room.id,{geometry:{unit:'cm',x:0,y:0,width:300,depth:300,height:90,rotation:0}});
    const plan=prepareChanges([{entity:'furniture',action:'create',data}],owner);
    expect(plan.warnings).toHaveLength(2);
  });
  it('guards confirmation, identity, expiration and edits made through the old web models',()=>{
    const {room}=fixture('并发');
    const plan=prepareChanges([{entity:'rooms',action:'update',id:room.id,data:{name:'新名'}}],owner);
    expect(()=>commitChanges(plan.planId,owner,false)).toThrow('确认');
    expect(()=>commitChanges(plan.planId,'different',true)).toThrow('身份');
    RoomModel.update(room.id,{name:'网页修改'});
    expect(()=>commitChanges(plan.planId,owner,true)).toThrow('数据已变化');
    const next=prepareChanges([{entity:'rooms',action:'update',id:room.id,data:{name:'新名'}}],owner);
    db.prepare('UPDATE agent_plans SET expires_at=0 WHERE id=?').run(next.planId);
    expect(()=>commitChanges(next.planId,owner,true)).toThrow('过期');
  });
  it('shows cascade deletion targets before commit',()=>{
    const {home,storage,room}=fixture('级联');const item=ItemModel.create({name:'级联物品',storageId:storage.id});
    const plan=prepareChanges([{entity:'locations',action:'delete',id:home.id}],owner);
    expect(plan.removed.map((r:any)=>r.id)).toEqual(expect.arrayContaining([home.id,room.id,storage.id,item.id]));
    expect(ItemModel.findById(item.id)).not.toBeNull();
    commitChanges(plan.planId,owner,true);expect(ItemModel.findById(item.id)).toBeNull();
  });
  it('rolls back all operations on failure during commit',()=>{
    const {storage}=fixture('回滚');
    const plan=prepareChanges(['先写入','故意失败'].map(name=>({entity:'items',action:'create',data:{name,storageId:storage.id}})),owner);
    const before=allEntities();
    db.exec("CREATE TRIGGER fail_agent BEFORE INSERT ON items WHEN NEW.name='故意失败' BEGIN SELECT RAISE(ABORT,'simulated failure'); END;");
    try {expect(()=>commitChanges(plan.planId,owner,true)).toThrow();}finally{db.exec('DROP TRIGGER fail_agent');}
    expect(allEntities()).toEqual(before);
    expect(commitChanges(plan.planId,owner,true).results).toHaveLength(2);
  });
  it('deduplicates import against existing and same-batch records; creates no raw chat history',()=>{
    const {storage}=fixture('导入');const data={name:'毛巾',storageId:storage.id,quantity:2};
    const plan=prepareImport([data,data],owner);expect(plan.skipped).toHaveLength(1);
    commitChanges(plan.planId!,owner,true);
    expect(prepareImport([data],owner).planId).toBeNull();
    expect(db.prepare('SELECT COUNT(*) AS n FROM import_batches').get()).toEqual({n:0});
  });
  it('paginates canonical data and invalidates a cursor after another edit',()=>{
    const first=listEntities({entity:'locations',limit:1});expect(first.nextCursor).toBeTruthy();
    const next=listEntities({entity:'locations',limit:1,cursor:first.nextCursor});
    expect(next.records[0].id).not.toBe(first.records[0].id);
    createHome('分页变更');expect(()=>listEntities({entity:'locations',cursor:first.nextCursor})).toThrow('已变化');
  });
  it('includes indirect relationship changes in deletion preview without deleting a linked furniture object',()=>{
    const {room,storage}=fixture('删除关联');
    RoomModel.update(room.id,{geometry:{unit:'cm',x:0,y:0,width:400,depth:400,rotation:0}});
    const furniture=FurnitureModel.create({name:'保留家具',kind:'wardrobe',roomId:room.id,storageId:storage.id,unit:'cm',width:100,depth:60,height:200,x:100,y:100,rotation:0});
    const plan=prepareChanges([{entity:'storages',action:'delete',id:storage.id}],owner);
    expect(plan.changed).toEqual(expect.arrayContaining([expect.objectContaining({entity:'furniture',after:expect.objectContaining({id:furniture.id,storageId:null})})]));
    expect(FurnitureModel.findById(furniture.id)?.storageId).toBe(storage.id);
  });
});

describe('MCP protocol and authorization',()=>{
  it('publishes configuration status and documentation without leaking credentials',async()=>{
    const app=express(),readToken='PRIVATE-READ-'.repeat(4),writeToken='PRIVATE-WRITE-'.repeat(4);
    app.use('/api/mcp',mcpInfoRouter(()=>({readToken,writeToken})));
    const result=await request(app).get('/api/mcp/info');
    expect(result.status).toBe(200);expect(result.body).toMatchObject({configured:true,readEnabled:true,writeEnabled:true,documentationAvailable:true});
    expect(result.text).not.toContain(readToken);expect(result.text).not.toContain(writeToken);
    const doc=await request(app).get('/api/mcp/documentation');expect(doc.status).toBe(200);
    expect(doc.headers['content-type']).toContain('text/markdown');expect(doc.text).toContain('仓鼠收纳 MCP');expect(doc.text).not.toContain(writeToken);
  });
  async function connect(write:boolean) {
    const server=createMcpServer({owner,write}),client=new Client({name:'test-agent',version:'1.0.0'});
    const [a,b]=InMemoryTransport.createLinkedPair();await server.connect(a);await client.connect(b);
    return {client,server};
  }
  it('supports initialize, tools/list, tools/call, resources/read and templates using the official client',async()=>{
    const {client,server}=await connect(true);
    try {
      expect((await client.listTools()).tools.map(t=>t.name)).toEqual(expect.arrayContaining(['list_records','prepare_import','prepare_changes','commit_changes']));
      const result=await client.callTool({name:'get_workspace',arguments:{}});expect(result.isError).not.toBe(true);
      expect((await client.readResource({uri:'hamster://workspace'})).contents.length).toBe(1);
      expect((await client.listResourceTemplates()).resourceTemplates).toHaveLength(1);
      const home=createHome('协议测试');
      const resource=await client.readResource({uri:`hamster://records/locations/${home.id}`});expect(resource.contents[0]).toMatchObject({mimeType:'application/json'});
      const plan:any=await client.callTool({name:'prepare_changes',arguments:{operations:[{entity:'locations',action:'update',id:home.id,data:{name:'协议写入'}}]}});
      expect(plan.isError).not.toBe(true);
      const saved=await client.callTool({name:'commit_changes',arguments:{planId:plan.structuredContent.planId,confirmed:true}});expect(saved.isError).not.toBe(true);
      expect(LocationModel.findById(home.id)?.name).toBe('协议写入');
    } finally {await client.close();await server.close();}
  });
  it('does not expose or execute writes for a read-only agent',async()=>{
    const {client,server}=await connect(false);
    try {
      const tools=await client.listTools();expect(tools.tools).toHaveLength(4);
      const result=await client.callTool({name:'prepare_changes',arguments:{operations:[]}});expect(result.isError).toBe(true);
    }finally{await client.close();await server.close();}
  });
  it('defaults HTTP closed and enforces bearer credentials and Origin before serving MCP',async()=>{
    const app=express();app.use(express.json());
    app.use('/closed',mcpRouter({}));
    app.use('/mcp',mcpRouter({readToken:'r'.repeat(40),writeToken:'w'.repeat(40)}));
    const call={jsonrpc:'2.0',id:1,method:'tools/list',params:{}};
    expect((await request(app).post('/closed').send(call)).status).toBe(503);
    expect((await request(app).post('/mcp').send(call)).status).toBe(401);
    expect((await request(app).post('/mcp').set('Authorization','Bearer invalid').send(call)).status).toBe(401);
    expect((await request(app).post('/mcp').set('Authorization',`Bearer ${'w'.repeat(40)}`).set('Origin','https://evil.example').send(call)).status).toBe(403);
    const read=await request(app).post('/mcp').set('Authorization',`Bearer ${'r'.repeat(40)}`).set('Accept','application/json, text/event-stream').send(call);
    expect(read.status).toBe(200);expect(read.body.result.tools).toHaveLength(4);
    const write=await request(app).post('/mcp').set('Authorization',`Bearer ${'w'.repeat(40)}`).set('Accept','application/json, text/event-stream').send(call);
    expect(write.status).toBe(200);expect(write.body.result.tools).toHaveLength(7);
  });
});
