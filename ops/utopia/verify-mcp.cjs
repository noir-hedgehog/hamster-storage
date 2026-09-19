// Execute via `docker exec -i ... node < verify-mcp.cjs`; credentials stay inside
// the container. Only VERIFY_MODE=canary-create writes business records.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {Client}=require('@modelcontextprotocol/sdk/client/index.js');
const {StreamableHTTPClientTransport}=require('@modelcontextprotocol/sdk/client/streamableHttp.js');
async function connect(token){const client=new Client({name:'release-verifier',version:'1.0.0'});await client.connect(new StreamableHTTPClientTransport(new URL('http://127.0.0.1:3847/mcp'),{requestInit:{headers:{Authorization:`Bearer ${token}`}}}));return client;}
async function call(client,name,args={}){const result=await client.callTool({name,arguments:args});assert(!result.isError,JSON.stringify(result));return result.structuredContent;}
(async()=>{
  const mode=process.env.VERIFY_MODE||'live',read=await connect(process.env.MCP_READ_TOKEN),write=await connect(process.env.MCP_WRITE_TOKEN);
  try {
    const info=await(await fetch('http://127.0.0.1:3847/api/mcp/info')).json();
    assert(info.configured&&info.readEnabled&&info.writeEnabled&&info.documentationAvailable);
    assert(!JSON.stringify(info).includes(process.env.MCP_WRITE_TOKEN));
    const document=await fetch('http://127.0.0.1:3847/api/mcp/documentation');assert.equal(document.status,200);assert((await document.text()).includes('仓鼠收纳 MCP'));
    assert.equal((await read.listTools()).tools.length,4);assert.equal((await write.listTools()).tools.length,7);
    assert.equal((await read.readResource({uri:'hamster://workspace'})).contents.length,1);
    const unauthorized=await fetch('http://127.0.0.1:3847/mcp',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});assert.equal(unauthorized.status,401);
    assert.equal((await fetch('http://127.0.0.1:3847/api/import',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,410);
    if(mode==='canary-create') {
      assert.equal((await call(read,'get_workspace')).counts.items,0);
      const plan=await call(write,'prepare_changes',{operations:[
        {entity:'locations',action:'create',ref:'home',data:{name:'隔离发布验证'}},
        {entity:'rooms',action:'create',ref:'room',data:{name:'验证房间',locationId:'$home',geometry:{unit:'cm',x:0,y:0,width:400,depth:350,height:280,rotation:0}}},
        {entity:'storages',action:'create',ref:'storage',data:{name:'验证收纳',roomId:'$room'}},
        {entity:'furniture',action:'create',data:{name:'验证衣柜',kind:'wardrobe',roomId:'$room',storageId:'$storage',unit:'cm',width:100,depth:60,height:200,x:100,y:100,rotation:0}},
        {entity:'items',action:'create',data:{name:'验证围巾',storageId:'$storage',quantity:2}},
      ]});
      assert.equal((await call(read,'get_workspace')).counts.items,0);
      const result=await call(write,'commit_changes',{planId:plan.planId,confirmed:true});
      assert.equal(result.results.length,5);
      fs.writeFileSync('/app/data/canary-plan.json',JSON.stringify({planId:plan.planId}));
    }
    if(mode==='canary-restart') {
      const {planId}=JSON.parse(fs.readFileSync('/app/data/canary-plan.json','utf8'));
      assert.equal((await call(write,'commit_changes',{planId,confirmed:true})).replayed,true);
      const counts=(await call(read,'get_workspace')).counts;assert.equal(counts.items,1);assert.equal(counts.furniture,1);
    }
    console.log(JSON.stringify({verified:true,mode,release:info.release,counts:(await call(read,'get_workspace')).counts,readTools:4,writeTools:7,documentation:true,credentials:'redacted'}));
  }finally{await read.close();await write.close();}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
