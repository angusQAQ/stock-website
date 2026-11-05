import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
// Real SQLite executes the same SQL used by D1, including atomic conditional
// inserts and uniqueness constraints. This is not a mocked ledger repository.
export function sqliteD1() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../../migrations/0001_initial.sql',import.meta.url),'utf8'));
  const db = { prepare(sql:string) {
    let values:any[]=[];
    return { bind(...args:any[]){values=args;return this},
      async first(){return sqlite.prepare(sql).get(...values)??null},
      async all(){return {results:sqlite.prepare(sql).all(...values)}},
      async run(){const result=sqlite.prepare(sql).run(...values);return {meta:{changes:Number(result.changes)}}},
    };
  }};
  return db as unknown as D1Database;
}
