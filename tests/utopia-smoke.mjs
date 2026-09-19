// Read-only verification of the deployed service. Requires the user's SSH alias.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const require=createRequire(import.meta.url);
const {Client}=require('../Backend/node_modules/@modelcontextprotocol/sdk/dist/cjs/client/index.js');
const {StdioClientTransport}=require('../Backend/node_modules/@modelcontextprotocol/sdk/dist/cjs/client/stdio.js');
const connection=process.env.UTOPIA_SSH_CONTROL?['-S',process.env.UTOPIA_SSH_CONTROL]:[];
for(const access of ['read','write']) {
  const client=new Client({name:'utopia-read-only-verifier',version:'1.0.0'});
  try {
    await client.connect(new StdioClientTransport({command:'ssh',args:['-T',...connection,'-o','BatchMode=yes','-o','ConnectTimeout=10','utopia','sudo','-n','docker','exec','-i','-e',`MCP_ACCESS=${access}`,'hamster-storage-app','node','dist/mcp/stdio.js'],stderr:'pipe'}));
    assert.equal((await client.listTools()).tools.length,access==='read'?4:7);
    const workspace=await client.callTool({name:'get_workspace',arguments:{}});assert(!workspace.isError);
    assert.equal((await client.readResource({uri:'hamster://schema'})).contents.length,1);
    console.log(JSON.stringify({transport:'SSH stdio',access,counts:workspace.structuredContent.counts,businessWrites:0}));
  } finally {await client.close();}
}
if(process.env.UTOPIA_WEB_URL&&process.env.PLAYWRIGHT_MODULE) {
  const base=process.env.UTOPIA_WEB_URL;
  assert(['127.0.0.1','storage.virtualink.cafe'].includes(new URL(base).hostname));
  const directory=mkdtempSync(join(tmpdir(),'utopia-mcp-release-'));
  const {chromium}=require(process.env.PLAYWRIGHT_MODULE),browser=await chromium.launch({channel:'chrome',headless:true});
  try {
    const page=await browser.newPage({viewport:{width:1440,height:1080}}),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`${base}/#mcp`);
    await page.getByRole('heading',{name:'MCP 与文档',exact:true}).waitFor();
    await page.getByText('凭证已配置',{exact:true}).waitFor();
    assert.equal(await page.getByText('已启用',{exact:true}).count(),2);
    assert.equal((await page.request.get(`${base}/api/mcp/documentation`)).status(),200);
    await page.getByRole('button',{name:'SSH / stdio',exact:true}).click();
    assert((await page.locator('.mcp-code pre').innerText()).includes('"sudo"'));
    await page.screenshot({path:join(directory,'desktop.png'),fullPage:true});
    await page.setViewportSize({width:390,height:844});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.screenshot({path:join(directory,'mobile.png'),fullPage:true});
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({browserVerified:true,directory,businessWrites:0}));
  } finally {await browser.close();}
}
