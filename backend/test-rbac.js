const { Client } = require('pg');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'assetflow-dev-secret-key-change-in-production';
const DB_URL = "postgresql://postgres:%24t%2AQ9UeW%2BWAGQS%26@db.zepeorcbfapzabrqqytu.supabase.co:5432/postgres";

async function main() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  console.log("Connected to DB, fetching users...");
  
  // 1. Get one Admin, one Dept Head, one Employee
  const res = await client.query(`
    SELECT * FROM profiles WHERE role = 'admin' LIMIT 1;
  `);
  let admin = res.rows[0];

  const dhRes = await client.query(`
    SELECT * FROM profiles WHERE role = 'department_head' LIMIT 1;
  `);
  let deptHead = dhRes.rows[0];

  const empRes = await client.query(`
    SELECT * FROM profiles WHERE role = 'employee' AND department_id = $1 LIMIT 1;
  `, [deptHead ? deptHead.department_id : null]);
  let employee = empRes.rows[0];

  console.log("Admin:", admin?.full_name);
  console.log("Dept Head:", deptHead?.full_name, "Dept ID:", deptHead?.department_id);
  console.log("Employee:", employee?.full_name, "Dept ID:", employee?.department_id);

  if (!admin || !deptHead || !employee) {
    console.log("Missing test users! Cannot fully test.");
  }

  // Generate tokens
  const generateToken = (user) => {
    return jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
  };

  const adminToken = admin ? generateToken(admin) : null;
  const deptHeadToken = deptHead ? generateToken(deptHead) : null;
  const empToken = employee ? generateToken(employee) : null;

  async function fetchWithToken(endpoint, token, method = 'GET') {
    const response = await fetch(`http://localhost:5000/api${endpoint}`, {
      method,
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return { status: response.status, data: await response.json() };
  }

  if (adminToken) {
    console.log("\n--- TEST: Admin (getProfiles) ---");
    const adminProfiles = await fetchWithToken('/profiles', adminToken);
    console.log("Admin /profiles count:", adminProfiles.data.length);
  }

  if (deptHeadToken) {
    console.log("\n--- TEST: Department Head (getProfiles) ---");
    const dhProfiles = await fetchWithToken('/profiles', deptHeadToken);
    if (dhProfiles.status === 200) {
      console.log("Dept Head /profiles count:", dhProfiles.data.length);
      console.log("Are they all in the same department?", dhProfiles.data.every(p => p.department_id === deptHead.department_id));
    } else {
      console.log("FAILED /profiles:", dhProfiles.status, dhProfiles.data);
    }
    
    console.log("\n--- TEST: Department Head (getDashboardKPIs) ---");
    const dhDashboard = await fetchWithToken('/dashboard/kpis', deptHeadToken);
    console.log("DH Dashboard Status:", dhDashboard.status);
    console.log("DH Dashboard KPIs:", dhDashboard.data?.kpis);
  }

  if (empToken) {
    console.log("\n--- TEST: Employee (getDashboardKPIs) ---");
    const empDashboard = await fetchWithToken('/dashboard/kpis', empToken);
    console.log("Emp Dashboard Status:", empDashboard.status);
    console.log("Emp Dashboard KPIs:", empDashboard.data?.kpis);

    console.log("\n--- TEST: Employee (getProfiles) ---");
    const empProfiles = await fetchWithToken('/profiles', empToken);
    if (empProfiles.status === 200) {
      console.log("Employee /profiles count:", empProfiles.data.length);
    } else {
      console.log("FAILED /profiles:", empProfiles.status, empProfiles.data);
    }
  }

  if (empToken) {
    console.log("\n--- TEST: Employee (deactivateUser) ---");
    const empDeact = await fetchWithToken(`/profiles/${employee.id}/deactivate`, empToken, 'PUT');
    console.log("Employee Deactivate Status (should be 403):", empDeact.status);
  }

  if (deptHeadToken && employee) {
    console.log("\n--- TEST: Department Head (deactivateUser) ---");
    const dhDeact = await fetchWithToken(`/profiles/${employee.id}/deactivate`, deptHeadToken, 'PUT');
    console.log("DH Deactivate Status (should be 200):", dhDeact.status);
    
    // Test reactivating with admin so we don't break the DB for user
    if (dhDeact.status === 200 && adminToken) {
       await client.query(`UPDATE profiles SET status = 'active' WHERE id = $1`, [employee.id]);
       console.log("Restored employee status to active via DB.");
    }
  }

  await client.end();
}

main().catch(console.error);
