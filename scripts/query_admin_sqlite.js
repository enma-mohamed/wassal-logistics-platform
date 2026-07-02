const Database = require('better-sqlite3');
try {
  const db = new Database('prisma/dev.db', { readonly: true });
  const row = db.prepare("SELECT passwordHash FROM \"User\" WHERE email = ?").get('admin@wassal.ye');
  if (row && row.passwordHash) console.log(row.passwordHash);
  else console.log('NOT_FOUND');
} catch (e) {
  console.error('ERROR', e && e.message ? e.message : e);
  process.exit(1);
}
