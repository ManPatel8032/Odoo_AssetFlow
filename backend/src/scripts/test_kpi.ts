import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function test() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log('1. Testing assets count...');
    const r1 = await pool.query(`SELECT COUNT(*) FILTER (WHERE status = 'available') AS assets_available, COUNT(*) AS assets_total FROM assets`);
    console.log('   OK:', r1.rows[0]);

    console.log('2. Testing bookings count...');
    const r2 = await pool.query(`SELECT COUNT(*) AS active_bookings FROM bookings WHERE status = 'active' AND start_time <= NOW() AND end_time >= NOW()`);
    console.log('   OK:', r2.rows[0]);

    console.log('3. Testing transfers count...');
    const r3 = await pool.query(`SELECT COUNT(*) AS pending_transfers FROM transfers WHERE status = 'pending'`);
    console.log('   OK:', r3.rows[0]);

    console.log('4. Testing overdue allocations...');
    const r4 = await pool.query(`SELECT COUNT(*) AS overdue_returns FROM allocations WHERE returned_at IS NULL AND allocated_at < NOW() - INTERVAL '30 days'`);
    console.log('   OK:', r4.rows[0]);

    console.log('5. Testing upcoming returns...');
    const r5 = await pool.query(`SELECT COUNT(*) AS upcoming_returns FROM allocations WHERE returned_at IS NULL AND allocated_at >= NOW() - INTERVAL '30 days'`);
    console.log('   OK:', r5.rows[0]);

    console.log('6. Testing maintenance today...');
    const r6 = await pool.query(`SELECT COUNT(*) AS maintenance_today FROM maintenance WHERE DATE(created_at) = CURRENT_DATE AND status != 'resolved'`);
    console.log('   OK:', r6.rows[0]);

    console.log('7. Testing activity_logs...');
    const r7 = await pool.query(`SELECT al.id, al.action, al.details, al.created_at, p.full_name as performed_by_name FROM activity_logs al LEFT JOIN profiles p ON al.profile_id = p.id ORDER BY al.created_at DESC LIMIT 10`);
    console.log('   OK:', r7.rows.length, 'rows');

    console.log('\nAll queries passed!');
  } catch (err: any) {
    console.error('FAILED:', err.message);
  }

  await pool.end();
}

test();
