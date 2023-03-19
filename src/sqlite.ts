import sqlite3 from 'sqlite3';
import 'dotenv/config';
import crypto from 'crypto';

function crypt(s: string): string {
  const key = crypto.createHash('sha256').update(process.env.SQLITE_PASSWORD!).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = cipher.update(s, 'utf8', 'hex') + cipher.final('hex');
  return iv.toString('hex') + encrypted;
}

function decrypt(s: string): string {
  const key = crypto.createHash('sha256').update(process.env.SQLITE_PASSWORD!).digest();
  const iv = Buffer.from(s.slice(0, 32), 'hex');
  const encrypted = s.slice(32);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  const decrypted = decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
  return decrypted;
}

export interface SqliteDatabase {
  insert: (key: string, value: any) => Promise<any>;
  get: (key: string) => Promise<any>;
}

interface DataTable {
  key: string;
  value: string;
}

const createDatabase = (): sqlite3.Database => {
  const db = new sqlite3.Database('db.sqlite', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);
  db.run(`CREATE TABLE IF NOT EXISTS data (key TEXT UNIQUE, value TEXT)`);
  return db;
};
export const sqliteDatabase = (): SqliteDatabase => {
  const db = createDatabase();

  const insert = async (key: string, value: any) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT OR REPLACE INTO data (key, value) VALUES (?, ?)`,
        [key, crypt(value) || ''],
        function (err) {
          if (err) {
            return reject(err);
          }
          resolve(this.lastID);
        },
      );
    });
  };
  const get = async (key: string) => {
    return new Promise((resolve, reject) => {
      db.all(`SELECT value FROM data WHERE key = ?`, [key], function (err, rows: DataTable[]) {
        if (err) {
          return reject(err);
        }
        resolve(rows?.[0]?.value ? decrypt(rows?.[0]?.value) : '');
      });
    });
  };
  return { insert, get };
};
