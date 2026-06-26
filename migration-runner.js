// Migration runner for Blue Prism Supabase
// This creates a temporary "exec_sql" function using the service_role key
// then runs all migrations through it.
// 
// USAGE: VITE_SUPABASE_URL=https://fdwoezyataxhdtgjlfxt.supabase.co VITE_SUPABASE_ANON_KEY=<key> node migration-runner.js
// 
// But we don't have the service_role key... so instead:
// We'll use a multi-step approach:
// 1. First, use the REST API to verify what exists
// 2. Then attempt to create tables via the PostgreSQL wire protocol tunnel

const fs = require('fs');
const path = require('path');

// Read the SQL migration file
const sqlFile = fs.readFileSync(path.join(__dirname, 'migrations/blue_prism_migration.sql'), 'utf8');

// Split into individual statements
const statements = sqlFile
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log(`Total SQL statements to execute: ${statements.length}`);

// Output as JSON for programmatic use
const output = {
  totalStatements: statements.length,
  statements: statements.map((s, i) => ({
    index: i + 1,
    preview: s.substring(0, 120).replace(/\n/g, ' '),
    full: s
  }))
};

fs.writeFileSync('/tmp/migration_statements.json', JSON.stringify(output, null, 2));
console.log('Written to /tmp/migration_statements.json');
console.log('\nFirst 5 statements:');
statements.slice(0, 5).forEach((s, i) => {
  console.log(`  ${i + 1}. ${s.substring(0, 100).replace(/\n/g, ' ')}...`);
});
