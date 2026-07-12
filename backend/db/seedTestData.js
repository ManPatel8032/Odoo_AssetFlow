require('dotenv').config({path: './.env'});
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function seedData() {
  try {
    await client.connect();
    
    // 1. Get an asset and an employee
    const assetRes = await client.query('SELECT id FROM assets LIMIT 1');
    const employeeRes = await client.query('SELECT id FROM profiles LIMIT 1');
    
    if (assetRes.rows.length === 0 || employeeRes.rows.length === 0) {
      console.log('Ensure you have at least one asset and one employee (profile) in the DB!');
      return;
    }
    
    const assetId = assetRes.rows[0].id;
    const empId = employeeRes.rows[0].id;

    // 2. Insert Bookings
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    await client.query(`
      INSERT INTO bookings (asset_id, employee_id, start_time, end_time, status)
      VALUES ($1, $2, $3, $4, 'confirmed')
    `, [assetId, empId, today.toISOString(), tomorrow.toISOString()]);
    console.log('Inserted test booking.');

    // 3. Insert Maintenance
    await client.query(`
      INSERT INTO maintenance (asset_id, description, cost, scheduled_date, status)
      VALUES ($1, 'Annual hardware inspection and cleaning', 150.00, $2, 'scheduled')
    `, [assetId, tomorrow.toISOString()]);
    console.log('Inserted test maintenance record.');
    
    console.log('Seed completed successfully!');
  } catch (err) {
    console.error('Failed to seed:', err);
  } finally {
    await client.end();
  }
}

seedData();
