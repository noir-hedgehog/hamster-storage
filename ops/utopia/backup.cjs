// Run inside the application container before switching releases.
const fs = require('node:fs');
const Database = require('better-sqlite3');
const db = new Database(process.env.DATABASE_PATH || '/app/data/storage.db', {readonly:true});
fs.mkdirSync('/app/data/backups', {recursive:true});
const stamp = new Date().toISOString().replace(/[:.]/g,'-');
const label = process.env.BACKUP_LABEL || 'pre-parity';
if(!/^[a-z0-9-]+$/.test(label))throw new Error('Invalid backup label');
db.backup(`/app/data/backups/${label}-${stamp}.db`).then(()=>{
  console.log(JSON.stringify({backup:`/app/data/backups/${label}-${stamp}.db`,items:db.prepare('SELECT COUNT(*) AS count FROM items').get().count,integrity:db.pragma('integrity_check',{simple:true})}));
  db.close();
}).catch(error=>{console.error(error.message);process.exitCode=1;});
