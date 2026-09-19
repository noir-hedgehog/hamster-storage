import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {Client}=require('../Backend/node_modules/@modelcontextprotocol/sdk/dist/cjs/client/index.js');
const {StreamableHTTPClientTransport}=require('../Backend/node_modules/@modelcontextprotocol/sdk/dist/cjs/client/streamableHttp.js');
const {StdioClientTransport}=require('../Backend/node_modules/@modelcontextprotocol/sdk/dist/cjs/client/stdio.js');
const root=resolve(import.meta.dirname,'..'),directory=mkdtempSync(join(tmpdir(),'hamster-mcp-qa-'));
const database=join(directory,'storage.db'),token=randomBytes(32).toString('hex');
const env={...process.env,DATABASE_PATH:database,PORT:'0',PUBLIC_DIR:join(root,'Frontend/build'),MCP_WRITE_TOKEN:token,MCP_READ_TOKEN:''};
let processHandle,browser,client,stdio,page;
async function start() {
  processHandle=spawn(process.execPath,[join(root,'Backend/dist/index.js')],{env,stdio:['ignore','pipe','pipe']});
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error('App did not start')),15000);let output='',errors='';
    processHandle.stderr.on('data',data=>{errors+=data;});
    processHandle.stdout.on('data',data=>{output+=data;const match=output.match(/http:\/\/localhost:(\d+)/);if(match){clearTimeout(timer);resolve(`http://127.0.0.1:${match[1]}`);}});
    processHandle.on('exit',code=>{clearTimeout(timer);reject(new Error(`App exited: ${code}; ${errors}`));});
  });
}
async function stop() {
  if(processHandle?.exitCode===null && processHandle?.signalCode===null) await new Promise(resolve=>{processHandle.once('exit',resolve);processHandle.kill('SIGTERM');});
}
async function connect(base) {
  const agent=new Client({name:'qa-agent',version:'1.0.0'});
  await agent.connect(new StreamableHTTPClientTransport(new URL(`${base}/mcp`),{requestInit:{headers:{Authorization:`Bearer ${token}`}}}));
  return agent;
}
async function call(agent,name,args={}) {
  const result=await agent.callTool({name,arguments:args});assert(!result.isError,JSON.stringify(result));return result.structuredContent;
}
try {
  let base=await start();client=await connect(base);
  const initial=await call(client,'get_workspace');assert.equal(initial.counts.items,0);
  const plan=await call(client,'prepare_changes',{operations:[
    {entity:'locations',action:'create',ref:'home',data:{name:'MCP 验证公寓'}},
    {entity:'rooms',action:'create',ref:'room',data:{name:'卧室',locationId:'$home',geometry:{unit:'cm',x:0,y:0,width:500,depth:400,height:280,rotation:0}}},
    {entity:'storages',action:'create',ref:'cabinet',data:{name:'衣柜内部',roomId:'$room'}},
    {entity:'storages',action:'create',ref:'drawer',data:{name:'上层抽屉',roomId:'$room',parentStorageId:'$cabinet'}},
    {entity:'furniture',action:'create',ref:'wardrobe',data:{name:'白橡木衣柜',roomId:'$room',storageId:'$cabinet',kind:'wardrobe',unit:'cm',width:120,depth:60,height:200,x:80,y:60,rotation:0}},
    {entity:'furniture',action:'create',ref:'bed',data:{name:'双人床',roomId:'$room',kind:'bed',unit:'cm',width:150,depth:200,height:50,x:290,y:210,rotation:0}},
    {entity:'items',action:'create',data:{name:'围巾',storageId:'$drawer',quantity:2,unit:'条'}},
  ]});
  assert.equal((await call(client,'get_workspace')).counts.items,0);
  const saved=await call(client,'commit_changes',{planId:plan.planId,confirmed:true});
  assert.equal((await call(client,'commit_changes',{planId:plan.planId,confirmed:true})).replayed,true);
  const items=await(await fetch(`${base}/api/items`)).json();assert.equal(items.items[0].name,'围巾');
  assert.equal((await fetch(`${base}/api/import`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({input:'不应保存'})})).status,410);
  await client.close();client=null;await stop();base=await start();client=await connect(base);
  assert.equal((await call(client,'get_workspace')).counts.furniture,2);
  assert.equal((await call(client,'commit_changes',{planId:plan.planId,confirmed:true})).replayed,true);
  stdio=new Client({name:'stdio-qa',version:'1.0.0'});
  await stdio.connect(new StdioClientTransport({command:process.execPath,args:[join(root,'Backend/dist/mcp/stdio.js')],env:{...process.env,DATABASE_PATH:database,MCP_ACCESS:'read'},stderr:'pipe'}));
  assert.equal((await call(stdio,'get_workspace')).counts.items,1);
  assert.equal((await stdio.listTools()).tools.length,4);
  await stdio.close();stdio=null;
  if(process.env.PLAYWRIGHT_MODULE) {
    const {chromium}=require(process.env.PLAYWRIGHT_MODULE);
    browser=await chromium.launch({headless:true,channel:'chrome',args:['--enable-unsafe-swiftshader']});
    page=await browser.newPage({viewport:{width:1440,height:1080}});const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('console',message=>{if(message.type()==='error'||message.type()==='warning')console.error('Browser:',message.text());});
    await page.goto(base);
    await page.getByRole('heading',{name:'在 agent 中整理，在这里查看。'}).waitFor();
    assert.equal(await page.locator('#moving-input').count(),0);
    await page.getByRole('cell',{name:'围巾 未分类'}).waitFor();
    await page.getByRole('button',{name:'MCP 与文档',exact:true}).click();
    await page.getByRole('heading',{name:'MCP 与文档',exact:true}).waitFor();
    await page.getByText('凭证已配置',{exact:true}).waitFor();
    assert.equal((await page.request.get(`${base}/api/mcp/documentation`)).status(),200);
    assert(!(await page.locator('body').innerText()).includes(token));
    await page.getByRole('button',{name:'SSH / stdio',exact:true}).click();
    assert((await page.locator('.mcp-code pre').innerText()).includes('"sudo"'));
    await page.reload();await page.getByRole('heading',{name:'MCP 与文档',exact:true}).waitFor();
    await page.screenshot({path:join(directory,'mcp-docs-desktop.png'),fullPage:true});
    await page.setViewportSize({width:390,height:844});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.screenshot({path:join(directory,'mcp-docs-mobile.png'),fullPage:true});
    await page.setViewportSize({width:1440,height:1080});
    await page.getByRole('button',{name:'3D 收纳预览',exact:true}).click();
    await page.locator('.space-canvas canvas').waitFor();
    await page.getByRole('button',{name:/白橡木衣柜/}).click();
    await page.locator('.space-detail').getByText('围巾',{exact:true}).waitFor();
    await page.screenshot({path:join(directory,'desktop.png'),fullPage:true});
    const update=await call(client,'prepare_changes',{operations:[{entity:'furniture',action:'update',id:saved.refs.bed,data:{name:'已调整的双人床',x:300,rotation:90}}]});
    await call(client,'commit_changes',{planId:update.planId,confirmed:true});
    await page.getByRole('button',{name:'刷新 Agent 修改'}).click();
    await page.getByRole('button',{name:/已调整的双人床/}).click();
    await page.locator('.space-detail').getByText('中心位置 300, 210 · 旋转 90°',{exact:true}).waitFor();
    await page.getByRole('button',{name:'俯视',exact:true}).click();
    await page.screenshot({path:join(directory,'top-before-recovery.png'),fullPage:true});
    await page.locator('.space-canvas canvas').evaluate(canvas=>canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
    await page.getByText('3D 显示已暂停。',{exact:false}).waitFor();
    await page.getByRole('button',{name:'重新加载 3D'}).click();
    await page.locator('.space-fallback').waitFor({state:'detached'});
    await page.locator('.space-canvas canvas').waitFor({state:'visible'});
    assert.equal(await page.locator('.space-canvas canvas').count(),1);
    await page.getByRole('button',{name:'视角复位',exact:true}).click();
    await page.screenshot({path:join(directory,'after-recovery.png'),fullPage:true});
    await page.setViewportSize({width:390,height:844});
    await page.getByRole('button',{name:'视角复位',exact:true}).click();
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await page.screenshot({path:join(directory,'mobile.png'),fullPage:true});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    assert.deepEqual(errors,[]);
    await browser.close();browser=null;
  }
  console.log(JSON.stringify({passed:true,directory,checks:['HTTP MCP official client','preview without writes','atomic commit and retry','restart persistence','stdio reads same database','read-only tool visibility','retired chat API',...(process.env.PLAYWRIGHT_MODULE?['3D furniture with linked inventory','agent edit refresh','WebGL recovery','mobile layout','no browser runtime errors']:[])]}));
} catch(error) {
  if(page) {await page.screenshot({path:join(directory,'failure.png'),fullPage:true});console.error((await page.locator('body').innerText()).slice(0,1800));}
  console.error('QA artifacts:',directory);throw error;
} finally {await client?.close();await stdio?.close();await browser?.close();await stop();}
