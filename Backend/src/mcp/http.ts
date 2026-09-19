import { createHash, timingSafeEqual } from 'crypto';
import { Router } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpServer } from './server';

export type McpConfig = {readToken?:string;writeToken?:string;allowedOrigins?:string};
export function environmentMcpConfig(): McpConfig {return {readToken:process.env.MCP_READ_TOKEN,writeToken:process.env.MCP_WRITE_TOKEN,allowedOrigins:process.env.MCP_ALLOWED_ORIGINS};}
export function mcpConfigurationStatus(config:McpConfig) {
  const invalid=!!((config.readToken && config.readToken.length<32) || (config.writeToken && config.writeToken.length<32) || (config.readToken && config.readToken===config.writeToken));
  return {configured:!invalid&&!!(config.readToken||config.writeToken),readEnabled:!invalid&&!!config.readToken,writeEnabled:!invalid&&!!config.writeToken};
}
export function mcpRouter(config:McpConfig=environmentMcpConfig()) {
  const router=Router();
  const match=(input:string,token?:string)=>!!token&&token.length>=32&&timingSafeEqual(createHash('sha256').update(input).digest(),createHash('sha256').update(token).digest());
  router.use((req,res,next)=>{
    res.setHeader('Cache-Control','no-store');
    if(!mcpConfigurationStatus(config).configured) {res.status(503).json({error:'MCP 凭证未配置或配置无效（至少32字符，读写凭证须不同）'});return;}
    if(req.headers.origin && !(config.allowedOrigins||'').split(',').map(value=>value.trim()).filter(Boolean).includes(req.headers.origin)) {res.status(403).json({error:'不允许的 Origin'});return;}
    const auth=req.headers.authorization||'';
    if(!auth.startsWith('Bearer ')){res.setHeader('WWW-Authenticate','Bearer realm="hamster-mcp"');res.status(401).json({error:'需要 MCP Bearer 凭证'});return;}
    const token=auth.slice(7),write=match(token,config.writeToken);
    if(!write&&!match(token,config.readToken)){res.status(401).json({error:'凭证无效'});return;}
    res.locals.access={write,owner:createHash('sha256').update(token).digest('hex')};
    next();
  });
  router.post('/',async(req,res)=>{
    const server=createMcpServer(res.locals.access);
    const transport=new StreamableHTTPServerTransport({sessionIdGenerator:undefined,enableJsonResponse:true});
    res.on('close',()=>{void transport.close();void server.close();});
    try {await server.connect(transport);await transport.handleRequest(req,res,req.body);}
    catch {if(!res.headersSent)res.status(500).json({jsonrpc:'2.0',id:null,error:{code:-32603,message:'MCP 请求处理失败'}});}
  });
  router.all('/',(_req,res)=>{res.setHeader('Allow','POST');res.status(405).end();});
  return router;
}
