import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const runSingle = async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    const filePath = path.join(__dirname, '../../db/migrations/0010_auth_rbac.sql');
    const sql = fs.readFileSync(filePath, 'utf-8');
    console.log('Running 0010_auth_rbac.sql...');
    await client.query(sql);
    console.log('✓ Migration 0010 completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
};

runSingle();
