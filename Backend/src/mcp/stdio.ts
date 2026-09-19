// No implicit database: a wrong cwd must never create a second, empty inventory.
import path from 'path';
import fs from 'fs';
if(!process.env.DATABASE_PATH || !path.isAbsolute(process.env.DATABASE_PATH)) {
  console.error('请设置 DATABASE_PATH 为现有仓鼠收纳数据库的绝对路径');process.exit(1);
}
if(!fs.existsSync(process.env.DATABASE_PATH) || !fs.statSync(process.env.DATABASE_PATH).isFile()) {
  console.error('指定数据库不存在；请先启动仓鼠收纳，或选择现有数据库，避免连接到空库');process.exit(1);
}
// Database migrations and dependencies must not pollute the JSON-RPC stdout stream.
console.log=console.error;
async function main() {
  const {initializeDatabase}=await import('../db/database');
  const {initializeMoving}=await import('../services/moving');
  const {initializeWorkspace}=await import('../services/workspace');
  const {createMcpServer}=await import('./server');
  const {StdioServerTransport}=await import('@modelcontextprotocol/sdk/server/stdio.js');
  initializeDatabase();initializeMoving();initializeWorkspace();
  const server=createMcpServer({owner:'local-stdio',write:process.env.MCP_ACCESS==='write'});
  await server.connect(new StdioServerTransport());
}
main().catch(error=>{console.error(error);process.exit(1);});
