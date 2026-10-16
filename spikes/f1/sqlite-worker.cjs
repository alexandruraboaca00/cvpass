const { parentPort, workerData } = require('node:worker_threads');
const Database = require('better-sqlite3');
const { createHash } = require('node:crypto');
try {
  const db = new Database(workerData.path);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = FULL');
  db.exec('CREATE TABLE IF NOT EXISTS probe (id INTEGER PRIMARY KEY, text TEXT NOT NULL, image BLOB NOT NULL)');
  if (workerData.create) {
    db.transaction(() => db.prepare('INSERT INTO probe VALUES (1, ?, ?)').run('Entidad sintética Ștefan', Buffer.from(workerData.image)))();
  }
  const row = db.prepare('SELECT * FROM probe WHERE id = 1').get();
  if (!row) throw new Error('Missing committed row');
  parentPort.postMessage({text: row.text, imageHash: createHash('sha256').update(row.image).digest('hex'), integrity: db.pragma('integrity_check', {simple: true})});
  db.close();
} catch (error) { parentPort.postMessage({error: error.stack}); }
