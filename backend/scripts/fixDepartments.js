const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fix() {
  // Get all departments
  const depts = await pool.query('SELECT id, name FROM departments ORDER BY name');
  const deptMap = {};
  depts.rows.forEach(d => { deptMap[d.name] = d.id; });

  // Get all seeded profiles (excluding the real admin users like Jemil, veertest, etc.)
  const profiles = await pool.query(
    "SELECT id, full_name FROM profiles WHERE full_name NOT IN ('Jemil Patel', 'veertest') ORDER BY full_name"
  );

  // Realistic distribution: some departments are bigger than others
  const distribution = [
    { dept: 'Engineering', weight: 5 },
    { dept: 'IT Support', weight: 4 },
    { dept: 'Sales', weight: 3 },
    { dept: 'Operations', weight: 3 },
    { dept: 'Marketing', weight: 2 },
    { dept: 'Human Resources', weight: 2 },
    { dept: 'Finance', weight: 2 },
    { dept: 'Customer Success', weight: 1 },
    { dept: 'Data Science', weight: 1 },
    { dept: 'Product Management', weight: 1 },
  ];

  // Build assignment list
  const assignments = [];
  for (const d of distribution) {
    const id = deptMap[d.dept];
    if (!id) continue;
    for (let i = 0; i < d.weight; i++) assignments.push(id);
  }

  // Assign profiles using weighted distribution
  let i = 0;
  for (const p of profiles.rows) {
    const deptId = assignments[i % assignments.length];
    await pool.query('UPDATE profiles SET department_id = $1 WHERE id = $2', [deptId, p.id]);
    i++;
  }

  console.log(`Reassigned ${profiles.rows.length} profiles with realistic distribution`);

  // Verify
  const result = await pool.query(`
    SELECT d.name as dept, COUNT(al.id)::int as active_allocations
    FROM departments d
    JOIN profiles p ON p.department_id = d.id
    JOIN allocations al ON al.employee_id = p.id AND al.returned_at IS NULL
    GROUP BY d.name
    HAVING COUNT(al.id) > 0
    ORDER BY active_allocations DESC
  `);
  console.log('Active allocations by department:');
  result.rows.forEach(r => console.log(`  ${r.dept}: ${r.active_allocations}`));

  pool.end();
}

fix().catch(e => { console.error(e); pool.end(); });
