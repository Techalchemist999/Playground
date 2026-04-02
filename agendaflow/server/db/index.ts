import initSqlJs, { Database } from 'sql.js';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '../../data/agendaflow.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const SEED_PATH = path.join(__dirname, 'seed.sql');

let _db: Database | null = null;

export async function initDB(): Promise<Database> {
  const SQL = await initSqlJs();
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // Load existing DB or create new
  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    _db = new SQL.Database(buf);
  } else {
    _db = new SQL.Database();
  }

  _db.run('PRAGMA foreign_keys = ON');

  // Run schema
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  _db.run(schema);

  // Seed if empty
  const result = _db.exec('SELECT COUNT(*) as c FROM meetings');
  const count = result[0]?.values[0]?.[0] ?? 0;
  if (count === 0) {
    const seed = fs.readFileSync(SEED_PATH, 'utf-8');
    _db.run(seed);
    console.log('Database seeded with sample data');
  }

  // Save to disk
  saveDB();
  return _db;
}

export function getDB(): Database {
  if (!_db) throw new Error('Database not initialized. Call initDB() first.');
  return _db;
}

export function saveDB() {
  if (!_db) return;
  const data = _db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// Helper: run a query and return all rows as objects
export function queryAll(sql: string, params: any[] = []): any[] {
  const db = getDB();
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows: any[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// Helper: run a query and return first row as object
export function queryOne(sql: string, params: any[] = []): any | null {
  const rows = queryAll(sql, params);
  return rows[0] || null;
}

// Helper: run an INSERT/UPDATE/DELETE and return changes info
export function execute(sql: string, params: any[] = []): { changes: number; lastId: number } {
  const db = getDB();
  db.run(sql, params);
  const changesResult = db.exec('SELECT changes() as c, last_insert_rowid() as id');
  const changes = Number(changesResult[0]?.values[0]?.[0] ?? 0);
  const lastId = Number(changesResult[0]?.values[0]?.[1] ?? 0);
  saveDB();
  return { changes, lastId };
}
