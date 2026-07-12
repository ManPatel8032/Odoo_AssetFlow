require('dotenv').config({path: './.env'});
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function seedUsers() {
  try {
    await client.connect();
    const passwordHash = await bcrypt.hash('password123', 10);
    
    // Create Asset Manager
    await client.query(`
      INSERT INTO profiles (id, email, full_name, role, password_hash, status)
      VALUES ($1, $2, $3, $4, $5, 'active')
      ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, password_hash = EXCLUDED.password_hash;
    `, [crypto.randomUUID(), 'manager@assetflow.com', 'Asset Manager User', 'asset_manager', passwordHash]);

    // Create Department Head
    await client.query(`
      INSERT INTO profiles (id, email, full_name, role, password_hash, status)
      VALUES ($1, $2, $3, $4, $5, 'active')
      ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, password_hash = EXCLUDED.password_hash;
    `, [crypto.randomUUID(), 'head@assetflow.com', 'Department Head User', 'department_head', passwordHash]);

    // Create Employee
    await client.query(`
      INSERT INTO profiles (id, email, full_name, role, password_hash, status)
      VALUES ($1, $2, $3, $4, $5, 'active')
      ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, password_hash = EXCLUDED.password_hash;
    `, [crypto.randomUUID(), 'employee@assetflow.com', 'Standard Employee', 'employee', passwordHash]);

    console.log('Seeded alternative users successfully!');
  } catch (err) {
    console.error('Failed to seed users:', err);
  } finally {
    await client.end();
  }
}

seedUsers();
