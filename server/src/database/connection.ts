import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../ride.sqlite');

let db: DatabaseSync;

export function getDatabase(): DatabaseSync {
  if (!db) {
    // Ensure parent directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    db = new DatabaseSync(dbPath);
    
    // Concurrency and integrity settings
    db.exec('PRAGMA foreign_keys = ON;');
    db.exec('PRAGMA journal_mode = WAL;');
    db.exec('PRAGMA synchronous = NORMAL;');
    db.exec('PRAGMA busy_timeout = 5000;');

    // Initialize schema if not present
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      db.exec(schemaSql);
    }
  }
  return db;
}

export function runTransaction<T>(fn: () => T): T {
  const d = getDatabase();
  d.exec('BEGIN IMMEDIATE;');
  try {
    const result = fn();
    d.exec('COMMIT;');
    return result;
  } catch (err) {
    try {
      d.exec('ROLLBACK;');
    } catch {
      // Ignore rollback errors if transaction was already terminated
    }
    throw err;
  }
}

export default getDatabase;
