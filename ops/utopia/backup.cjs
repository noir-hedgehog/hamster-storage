// Run inside the application container before switching releases.
const fs = require('node:fs');
const Database = require('better-sqlite3');
const db = new Database(process.env.DATABASE_PATH || '/app/data/storage.db', {readonly:true});
fs.mkdirSync('/app/data/backups', {recursive:true});
const stamp = new Date().toISOString().replace(/[:.]/g,'-');
db.backup(`/app/data/backups/pre-parity-${stamp}.db`).then(()=>{
  console.log(JSON.stringify({backup:`/app/data/backups/pre-parity-${stamp}.db`,items:db.prepare('SELECT COUNT(*) AS count FROM items').get().count}));
  db.close();
}).catch(error=>{console.error(error.message);process.exitCode=1;});
