// Run after successful release with /opt/ops mounted at /registry.
// Modify only the existing hamster-storage section, preserving other services.
const fs=require('node:fs');
const file='/registry/services.yml',tag='20260919-mcp-docs-v1';
const source=fs.readFileSync(file,'utf8');
const pattern=/^  hamster-storage:\n[\s\S]*?(?=^  [^ \n][^\n]*:\s*$|(?![\s\S]))/m;
const match=source.match(pattern);
if(!match)throw new Error('Existing hamster-storage service section not found');
let section=match[0];
const notes=[
  `MCP release ${tag}; verified HTTP and SSH stdio against the production database`,
  'MCP endpoint https://storage.virtualink.cafe/mcp; in-app guide /#mcp',
  'Separate read and write tokens in /opt/apps/hamster-storage/.mcp.env (root only)',
  'MCP authentication does not protect the existing web and REST API; use a trusted network or access gateway',
  'Public HTTPS remains unverified due to external TCP connection timeout',
];
for(const note of notes)if(!section.includes(note))section=section.trimEnd()+`\n      - ${note}\n`;
if(!match[0].includes('    notes:'))throw new Error('Missing existing notes');
const backup=file+'.before-mcp-docs';
if(!fs.existsSync(backup))fs.copyFileSync(file,backup);
const updated=source.slice(0,match.index)+section+source.slice(match.index+match[0].length);
fs.writeFileSync(file+'.next',updated,{mode:0o644});fs.renameSync(file+'.next',file);
console.log(JSON.stringify({registryUpdated:'hamster-storage',release:tag,otherServices:'preserved'}));
