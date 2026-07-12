import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function promote() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const { rows } = await pool.query(
    "UPDATE profiles SET role = 'admin' WHERE email = 'admin@assetflow.com' RETURNING id, full_name, role"
  );
  console.log('Promoted:', rows[0]);
  await pool.end();
}

promote();
