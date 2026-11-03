const http = require('http');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
process.env.NODE_ENV = 'test';

const { app, readyPromise } = require('../server');

const makeRequest = (server, method, path, headers = {}, body = null) => {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const port = address.port;

    const postData = body ? JSON.stringify(body) : '';
    const reqHeaders = {
      ...headers,
      'Content-Type': 'application/json'
    };
    if (body) {
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const options = {
      hostname: '127.0.0.1',
      port,
      path,
      method,
      headers: reqHeaders
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
};

(async () => {
  console.log('========================================================');
  console.log('🧪 RUNNING COMPLETE ASSETFLOW PRO INTEGRATION TEST SUITE');
  console.log('========================================================');

  console.log('[TEST SUITE] Awaiting database connection and seeding readiness...');
  await readyPromise;
  console.log('[TEST SUITE] Database connection verified & ready!');

  const testServer = http.createServer(app);
  await new Promise((r) => testServer.listen(0, '127.0.0.1', r));
  console.log(`[TEST SERVER] Bound on internal port ${testServer.address().port}`);

  try {
    // 1. Health check
    console.log('\n[1/10] Testing Health Endpoint...');
    const health = await makeRequest(testServer, 'GET', '/api/health');
    console.log('Health Response Status:', health.status, health.body.service);
    if (health.status !== 200) throw new Error('Health check failed');

    // 2. Auth Login Admin
    console.log('\n[2/10] Testing Admin Authentication & JWT Generation...');
    const adminLogin = await makeRequest(testServer, 'POST', '/api/auth/login', {}, {
      email: 'admin@assetflow.com',
      password: 'Admin@123'
    });
    console.log('Admin Login:', adminLogin.status, 'Role:', adminLogin.body.user?.role);
    if (adminLogin.status !== 200) throw new Error('Admin login failed: ' + JSON.stringify(adminLogin.body));
    const adminToken = adminLogin.body.token;

    // 3. Auth Login Employee
    console.log('\n[3/10] Testing Employee Authentication...');
    const empLogin = await makeRequest(testServer, 'POST', '/api/auth/login', {}, {
      email: 'employee1@assetflow.com',
      password: 'Employee@123'
    });
    console.log('Employee Login:', empLogin.status, 'Role:', empLogin.body.user?.role);
    const empToken = empLogin.body.token;

    // 4. Role Authorization Check: Employee attempting to access Admin Audit Logs
    console.log('\n[4/10] Verifying Server-Side Role Authorization Enforcement...');
    const unauthorizedAudit = await makeRequest(testServer, 'GET', '/api/audit-logs', {
      Authorization: `Bearer ${empToken}`
    });
    console.log('Employee accessing /api/audit-logs status:', unauthorizedAudit.status);
    if (unauthorizedAudit.status !== 403) throw new Error('Expected 403 Forbidden for Employee accessing Audit Logs');
    console.log('✓ Access correctly forbidden with message:', unauthorizedAudit.body.message);

    // 5. Admin fetching Dashboard Stats
    console.log('\n[5/10] Testing Dashboard Telemetry Aggregations...');
    const dash = await makeRequest(testServer, 'GET', '/api/dashboard/stats', {
      Authorization: `Bearer ${adminToken}`
    });
    console.log('Dashboard Stats Status:', dash.status);
    console.log('Total Assets:', dash.body.stats?.totalAssets);
    console.log('Available Assets:', dash.body.stats?.availableAssets);
    console.log('Total Valuation:', '$' + dash.body.stats?.totalInventoryValue);
    console.log('Categories Count:', dash.body.charts?.categoryDistribution?.length);
    if (!dash.body.stats || dash.body.stats.totalAssets < 15) throw new Error('Dashboard stats invalid');

    // 6. Asset CRUD
    console.log('\n[6/10] Testing Asset Management CRUD & QR Code Generation...');
    const newAssetId = `AST-TEST-${Date.now().toString().slice(-4)}`;
    const createAssetRes = await makeRequest(testServer, 'POST', '/api/assets', {
      Authorization: `Bearer ${adminToken}`
    }, {
      name: 'Sony WH-1000XM5 Studio Headphones',
      assetId: newAssetId,
      category: 'Other',
      brand: 'Sony',
      model: 'WH-1000XM5',
      serialNumber: `SN-TEST-${Date.now()}`,
      purchasePrice: 399,
      location: 'HQ - Floor 3 Studio',
      department: 'Product & Design',
      warrantyExpiryDate: new Date('2026-12-31')
    });
    console.log('Create Asset Status:', createAssetRes.status, 'Asset ID:', createAssetRes.body.asset?.assetId);
    if (createAssetRes.status !== 201) throw new Error('Asset creation failed: ' + JSON.stringify(createAssetRes.body));
    const createdAssetMongoId = createAssetRes.body.asset._id;

    // 7. Get QR Code for Asset
    const qrRes = await makeRequest(testServer, 'GET', `/api/assets/${createdAssetMongoId}/qrcode`, {
      Authorization: `Bearer ${adminToken}`
    });
    console.log('QR Code Status:', qrRes.status, 'Has Data URL:', qrRes.body.qrCode?.startsWith('data:image/png;base64'));

    // 8. Asset Assignment Flow
    console.log('\n[7/10] Testing Asset Allocation & Check-in Returns...');
    const employeesRes = await makeRequest(testServer, 'GET', '/api/employees', {
      Authorization: `Bearer ${adminToken}`
    });
    const targetEmployeeId = employeesRes.body.employees[0]._id;

    const assignRes = await makeRequest(testServer, 'POST', '/api/assignments', {
      Authorization: `Bearer ${adminToken}`
    }, {
      assetId: createdAssetMongoId,
      employeeId: targetEmployeeId,
      notes: 'Testing automated assignment workflow'
    });
    console.log('Assign Asset Status:', assignRes.status, assignRes.body.message);
    if (assignRes.status !== 201) throw new Error('Assignment failed');

    // Return the assignment
    const assignmentId = assignRes.body.assignment._id;
    const returnRes = await makeRequest(testServer, 'POST', `/api/assignments/${assignmentId}/return`, {
      Authorization: `Bearer ${adminToken}`
    }, {
      returnNotes: 'Inspection check passed.'
    });
    console.log('Return Asset Status:', returnRes.status, returnRes.body.message);
    if (returnRes.status !== 200) throw new Error('Return failed');

    // 9. Resource Booking & Overlapping Check
    console.log('\n[8/10] Testing Resource Booking & Overlap Prevention...');
    const start = new Date(Date.now() + 86400000 * 2);
    const end = new Date(start.getTime() + 7200000);

    const bookingRes = await makeRequest(testServer, 'POST', '/api/bookings', {
      Authorization: `Bearer ${empToken}`
    }, {
      assetId: createdAssetMongoId,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      purpose: 'Audio podcast interview'
    });
    console.log('Create Booking Status:', bookingRes.status, bookingRes.body.message);
    const bookingId = bookingRes.body.booking._id;

    // Approve booking as Admin
    const approveBooking = await makeRequest(testServer, 'PUT', `/api/bookings/${bookingId}/status`, {
      Authorization: `Bearer ${adminToken}`
    }, {
      status: 'Approved',
      reviewNotes: 'Audio equipment approved for podcasting.'
    });
    console.log('Approve Booking Status:', approveBooking.status, approveBooking.body.message);

    // Overlapping booking test: attempt to book same asset during same window
    const overlapBooking = await makeRequest(testServer, 'POST', '/api/bookings', {
      Authorization: `Bearer ${empToken}`
    }, {
      assetId: createdAssetMongoId,
      startDate: new Date(start.getTime() + 1800000).toISOString(),
      endDate: new Date(end.getTime() + 1800000).toISOString(),
      purpose: 'Conflicting booking test'
    });
    console.log('Overlapping Booking Attempt Status:', overlapBooking.status);
    if (overlapBooking.status !== 400) throw new Error('Expected 400 Bad Request for overlapping booking!');
    console.log('✓ Overlap prevention successfully blocked conflict:', overlapBooking.body.message);

    // 10. Maintenance Request & State Transitions
    console.log('\n[9/10] Testing Maintenance Workflow & Asset Status Synchronization...');
    const maintRes = await makeRequest(testServer, 'POST', '/api/maintenance', {
      Authorization: `Bearer ${empToken}`
    }, {
      assetId: createdAssetMongoId,
      issueDescription: 'Left ear cup audio balance test issue',
      priority: 'Low'
    });
    console.log('Create Maintenance Status:', maintRes.status);
    const maintId = maintRes.body.record._id;

    // Manager updates to In Progress -> Asset should become Under Maintenance
    const progressMaint = await makeRequest(testServer, 'PUT', `/api/maintenance/${maintId}`, {
      Authorization: `Bearer ${adminToken}`
    }, {
      status: 'In Progress',
      assignedTechnician: 'Sony Lab Diagnostics'
    });
    console.log('Update to In Progress Status:', progressMaint.status);

    const checkAssetStatus = await makeRequest(testServer, 'GET', `/api/assets/${createdAssetMongoId}`, {
      Authorization: `Bearer ${adminToken}`
    });
    console.log('Asset status after In Progress:', checkAssetStatus.body.asset.status);
    if (checkAssetStatus.body.asset.status !== 'Under Maintenance') {
      throw new Error("Asset status was not updated to 'Under Maintenance'");
    }

    // Complete Maintenance -> Asset returns to Available
    const completeMaint = await makeRequest(testServer, 'PUT', `/api/maintenance/${maintId}`, {
      Authorization: `Bearer ${adminToken}`
    }, {
      status: 'Completed',
      maintenanceCost: 45,
      resolutionNotes: 'Audio driver recalibrated.'
    });
    console.log('Complete Maintenance Status:', completeMaint.status);

    const checkAssetAvailable = await makeRequest(testServer, 'GET', `/api/assets/${createdAssetMongoId}`, {
      Authorization: `Bearer ${adminToken}`
    });
    console.log('Asset status after Completed:', checkAssetAvailable.body.asset.status);
    if (checkAssetAvailable.body.asset.status !== 'Available') {
      throw new Error("Asset status was not restored to 'Available'");
    }

    // 11. Audit Logs Verification
    console.log('\n[10/10] Verifying Audit Trail Generation...');
    const auditRes = await makeRequest(testServer, 'GET', '/api/audit-logs', {
      Authorization: `Bearer ${adminToken}`
    });
    console.log('Audit Logs Count:', auditRes.body.logs?.length);
    console.log('Latest 3 Actions:');
    auditRes.body.logs.slice(0, 3).forEach((l) => {
      console.log(` - [${l.module}] ${l.action} on ${l.targetName} by ${l.userName}`);
    });

    console.log('\n========================================================');
    console.log('🎉 ALL INTEGRATION TESTS PASSED 100% SUCCESSFULLY!');
    console.log('========================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ INTEGRATION TEST FAILED:', err.message);
    process.exit(1);
  } finally {
    testServer.close();
  }
})();
