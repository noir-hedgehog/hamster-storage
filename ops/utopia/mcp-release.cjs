// Run with Node in a container mounting /opt/apps/hamster-storage at /deployment.
// Never prints credentials, never modifies the shared Caddy configuration.
const fs=require('node:fs');
const path=require('node:path');
const {randomBytes}=require('node:crypto');
const [phase,tag]=process.argv.slice(2),base='/deployment';
if(!['prepare','activate','rollback'].includes(phase)||!/^\d{8}-[a-z0-9-]+$/.test(tag||''))throw new Error('Expected phase and a bounded release tag');
const release=path.join(base,'releases',tag),backup=path.join(base,'backups',tag);
const template=path.join(release,'ops/utopia/docker-compose.yml');
if(!fs.existsSync(template))throw new Error('Release source is missing');
function atomic(file,content,mode=0o600){const temp=file+'.next';fs.writeFileSync(temp,content,{mode});fs.chmodSync(temp,mode);fs.renameSync(temp,file);}
if(phase==='prepare') {
  fs.mkdirSync(backup,{recursive:true,mode:0o700});
  for(const name of ['docker-compose.yml','release.env','Caddyfile','.mcp.env']) {
    const source=path.join(base,name),target=path.join(backup,name);
    if(fs.existsSync(source)&&!fs.existsSync(target)){fs.copyFileSync(source,target);fs.chmodSync(target,0o600);}
  }
  const secret=path.join(base,'.mcp.env');
  if(!fs.existsSync(secret))atomic(secret,`MCP_READ_TOKEN=${randomBytes(32).toString('hex')}\nMCP_WRITE_TOKEN=${randomBytes(32).toString('hex')}\n`);
  const values=Object.fromEntries(fs.readFileSync(secret,'utf8').split('\n').filter(line=>line.includes('=')).map(line=>{const at=line.indexOf('=');return [line.slice(0,at),line.slice(at+1)];}));
  if((values.MCP_READ_TOKEN||'').length<32||(values.MCP_WRITE_TOKEN||'').length<32||values.MCP_READ_TOKEN===values.MCP_WRITE_TOKEN)throw new Error('Existing MCP credentials are invalid; refusing to replace them silently');
  fs.chmodSync(secret,0o600);
  console.log(JSON.stringify({prepared:tag,backup,credentials:'present; values not logged'}));
} else if(phase==='activate') {
  if(!fs.existsSync(path.join(backup,'release.env'))||!fs.existsSync(path.join(base,'.mcp.env')))throw new Error('Prepare must complete first');
  atomic(path.join(base,'docker-compose.yml'),fs.readFileSync(template),0o644);
  atomic(path.join(base,'release.env'),`HAMSTER_RELEASE_TAG=${tag}\nHAMSTER_RELEASE_PATH=./releases/${tag}\n`);
  console.log(JSON.stringify({activatedConfiguration:tag}));
} else {
  for(const name of ['docker-compose.yml','release.env']) {
    const source=path.join(backup,name);if(!fs.existsSync(source))throw new Error('Rollback snapshot missing');
    atomic(path.join(base,name),fs.readFileSync(source));
  }
  console.log(JSON.stringify({restoredConfigurationFrom:backup,database:'untouched; additive migration retained'}));
}
