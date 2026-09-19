import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { environmentMcpConfig, mcpConfigurationStatus, McpConfig } from '../mcp/http';

export function mcpInfoRouter(config:()=>McpConfig=environmentMcpConfig) {
  const router=Router();
  const documentPath=()=>[path.join(__dirname,'../../docs/MCP.md'),path.join(__dirname,'../../../MCP.md')].find(file=>fs.existsSync(file));
  router.get('/info',(_req,res)=>{
    res.setHeader('Cache-Control','no-store');
    res.json({...mcpConfigurationStatus(config()),version:'1.0.0',release:process.env.APP_RELEASE||'development',
      endpoint:'/mcp',transports:['streamable-http','stdio'],documentationAvailable:!!documentPath()});
  });
  router.get('/documentation',(_req,res)=>{
    const file=documentPath();if(!file){res.status(404).json({error:'文档未随此版本打包'});return;}
    res.setHeader('Content-Type','text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition','attachment; filename="hamster-storage-mcp.md"');
    res.sendFile(file);
  });
  return router;
}
