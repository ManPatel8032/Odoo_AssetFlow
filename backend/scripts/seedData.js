const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const seed = async () => {
  try {
    console.log('Starting seed process...');

    // 1. Departments (20)
    const departments = [
      'Engineering', 'Sales', 'Marketing', 'Human Resources', 'Finance',
      'IT Support', 'Legal', 'Product Management', 'Customer Success', 'Operations',
      'Logistics', 'Facilities', 'Executive', 'Data Science', 'Security',
      'Quality Assurance', 'Procurement', 'Public Relations', 'Training', 'Administration'
    ];
    
    console.log('Seeding departments...');
    const deptIds = [];
    for (const name of departments) {
      const res = await pool.query(
        'INSERT INTO departments (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
        [name]
      );
      deptIds.push(res.rows[0].id);
    }

    // 2. Categories (20)
    const categories = [
      'Laptops', 'Desktops', 'Monitors', 'Keyboards', 'Mice',
      'Smartphones', 'Tablets', 'Servers', 'Routers', 'Switches',
      'Projectors', 'Printers', 'Scanners', 'Standing Desks', 'Ergonomic Chairs',
      'Webcams', 'Headsets', 'Smart Boards', 'Networking Cables', 'Software Licenses'
    ];
    
    console.log('Seeding categories...');
    const catIds = [];
    for (const name of categories) {
      const res = await pool.query(
        'INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
        [name]
      );
      catIds.push(res.rows[0].id);
    }

    // 3. Profiles / Employees (20)
    console.log('Seeding profiles...');
    const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
    
    const profileIds = [];
    for (let i = 0; i < 20; i++) {
      const email = `${firstNames[i].toLowerCase()}.${lastNames[i].toLowerCase()}@example.com`;
      const deptId = deptIds[i % deptIds.length];
      const fullName = `${firstNames[i]} ${lastNames[i]}`;
      
      let userId;
      try {
        const authRes = await pool.query(`
          INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), $1) ON CONFLICT DO NOTHING RETURNING id
        `, [email]);
        
        if (authRes.rows.length > 0) {
          userId = authRes.rows[0].id;
        } else {
          const u = await pool.query(`SELECT id FROM auth.users WHERE email = $1`, [email]);
          userId = u.rows[0]?.id || '00000000-0000-0000-0000-000000000000'; // fallback
        }
      } catch (e) {
        // If auth schema doesn't exist (local dev without full supabase), we bypass
        console.warn('Could not insert into auth.users, using random UUID for profile', e.message);
        const uRes = await pool.query(`SELECT gen_random_uuid() as id`);
        userId = uRes.rows[0].id;
      }
      
      const res = await pool.query(
        `INSERT INTO profiles (id, email, full_name, role, department_id) 
         VALUES ($1, $2, $3, $4, $5) 
         ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name 
         RETURNING id`,
        [userId, email, fullName, 'employee', deptId]
      );
      profileIds.push(res.rows[0].id);
    }

    // 4. Assets (20)
    console.log('Seeding assets...');
    const assetIds = [];
    for (let i = 0; i < 20; i++) {
      const catId = catIds[i % catIds.length];
      const deptId = deptIds[i % deptIds.length];
      const name = `${categories[i % categories.length]} Model X${i}`;
      const tag = `AST-${10000 + i + Math.floor(Math.random()*1000)}`;
      const serial = `SN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const cost = Math.floor(Math.random() * 2000) + 50;
      
      const res = await pool.query(
        `INSERT INTO assets (name, tag, category_id, department_id, status, serial_number, purchase_date, cost) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (tag) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [name, tag, catId, deptId, 'available', serial, new Date(Date.now() - Math.random() * 100000000000), cost]
      );
      assetIds.push(res.rows[0].id);
    }

    // 5. Allocations (20)
    console.log('Seeding allocations...');
    for (let i = 0; i < 20; i++) {
      const assetId = assetIds[i];
      const profileId = profileIds[i % profileIds.length];
      const isReturned = i % 3 === 0; // 1/3 returned
      
      await pool.query(
        `INSERT INTO allocations (asset_id, employee_id, allocated_at, returned_at, notes) 
         VALUES ($1, $2, $3, $4, $5)`,
        [
          assetId, 
          profileId, 
          new Date(Date.now() - Math.random() * 5000000000), 
          isReturned ? new Date() : null, 
          'Initial provisioning'
        ]
      );
      
      if (!isReturned) {
        await pool.query('UPDATE assets SET status = $1 WHERE id = $2', ['allocated', assetId]);
      }
    }

    // 6. Bookings (20)
    console.log('Seeding bookings...');
    for (let i = 0; i < 20; i++) {
      const assetId = assetIds[(i + 5) % assetIds.length];
      const profileId = profileIds[(i + 7) % profileIds.length];
      const start = new Date(Date.now() + Math.random() * 5000000000);
      const end = new Date(start.getTime() + 86400000 * (Math.floor(Math.random() * 5) + 1));
      
      await pool.query(
        `INSERT INTO bookings (asset_id, employee_id, start_time, end_time, status) 
         VALUES ($1, $2, $3, $4, $5)`,
        [assetId, profileId, start, end, i % 4 === 0 ? 'cancelled' : 'confirmed']
      );
    }

    // 7. Maintenance (20)
    console.log('Seeding maintenance...');
    for (let i = 0; i < 20; i++) {
      const assetId = assetIds[i];
      const status = i % 4 === 0 ? 'completed' : (i % 2 === 0 ? 'scheduled' : 'in_progress');
      const scheduled = new Date(Date.now() + (Math.random() - 0.5) * 5000000000);
      
      await pool.query(
        `INSERT INTO maintenance (asset_id, description, status, scheduled_date, completed_date, cost) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          assetId, 
          'Routine check and firmware update', 
          status, 
          scheduled, 
          status === 'completed' ? new Date(scheduled.getTime() + 86400000) : null,
          status === 'completed' ? Math.floor(Math.random() * 500) : null
        ]
      );
      
      if (status === 'in_progress') {
        await pool.query('UPDATE assets SET status = $1 WHERE id = $2', ['maintenance', assetId]);
      }
    }

    // 8. Audits (2 cycles, 20 items total)
    console.log('Seeding audits...');
    const auditRes = await pool.query(
      `INSERT INTO audit_cycles (name, start_date, end_date, status) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ['Q3 Comprehensive Audit', new Date(Date.now() - 1000000000), null, 'active']
    );
    const cycleId = auditRes.rows[0].id;

    for (let i = 0; i < 20; i++) {
      const assetId = assetIds[i];
      const status = i % 5 === 0 ? 'missing' : (i % 7 === 0 ? 'damaged' : 'verified');
      
      await pool.query(
        `INSERT INTO audit_items (cycle_id, asset_id, status, audited_at, notes, audited_by) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          cycleId, 
          assetId, 
          status, 
          status !== 'pending' ? new Date() : null,
          status === 'missing' ? 'Could not locate at desk' : (status === 'damaged' ? 'Screen cracked' : 'All good'),
          status !== 'pending' ? profileIds[0] : null
        ]
      );
    }

    console.log('Seed process completed successfully!');
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await pool.end();
  }
};

seed();
