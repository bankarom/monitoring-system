const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const BASE_URL = 'http://200.141.2.53:4000';

async function runFullAudit() {
  console.log('====================================================');
  console.log('🧪 RUNNING DEEP END-TO-END AUDIT ON ALL ENDPOINTS');
  console.log('📡 Target Server:', BASE_URL);
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`🔹 Testing: ${name}... `);
      await fn();
      console.log('✅ PASSED');
      passed++;
    } catch (err) {
      console.log('❌ FAILED');
      console.error('   Error:', err.response?.data || err.message);
      failed++;
    }
  }

  let adminToken = '';
  let employeeToken = '';
  let createdEmpId = '';
  const testEmail = `test_audit_${Date.now()}@improx.com`;

  // 1. Health Check
  await test('GET /api/health', async () => {
    const res = await axios.get(`${BASE_URL}/api/health`);
    if (res.data.status !== 'OK') throw new Error('Health check status not OK');
  });

  // 2. Admin Login
  await test('POST /api/auth/login (Admin)', async () => {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@improx.com',
      password: 'Admin@123456'
    });
    if (!res.data.token) throw new Error('No token returned');
    adminToken = res.data.token;
  });

  const adminHeaders = () => ({ headers: { Authorization: `Bearer ${adminToken}` } });

  // 3. Auth Profile
  await test('GET /api/auth/me', async () => {
    const res = await axios.get(`${BASE_URL}/api/auth/me`, adminHeaders());
    if (res.data.user.role !== 'ADMIN') throw new Error('User is not admin');
  });

  // 4. Dashboard Stats
  await test('GET /api/admin/dashboard', async () => {
    const res = await axios.get(`${BASE_URL}/api/admin/dashboard`, adminHeaders());
    if (!res.data.stats || !res.data.stats.headcount) throw new Error('Invalid dashboard payload');
  });

  // 5. Realtime Grid
  await test('GET /api/admin/realtime', async () => {
    const res = await axios.get(`${BASE_URL}/api/admin/realtime`, adminHeaders());
    if (!Array.isArray(res.data.grid)) throw new Error('Grid is not array');
  });

  // 6. Employees List
  await test('GET /api/admin/employees', async () => {
    const res = await axios.get(`${BASE_URL}/api/admin/employees`, adminHeaders());
    if (!Array.isArray(res.data.employees)) throw new Error('Employees is not array');
  });

  // 7. Create Employee
  await test('POST /api/admin/employees', async () => {
    const res = await axios.post(`${BASE_URL}/api/admin/employees`, {
      name: 'Audit Test User',
      email: testEmail,
      password: 'Password@123',
      department: 'Engineering',
      shift: '09:00 - 18:00'
    }, adminHeaders());
    if (!res.data.employee || !res.data.employee.id) throw new Error('Employee creation failed');
    createdEmpId = res.data.employee.id;
  });

  // 8. Update Employee
  await test('PUT /api/admin/employees/:id', async () => {
    const res = await axios.put(`${BASE_URL}/api/admin/employees/${createdEmpId}`, {
      department: 'QA & Security'
    }, adminHeaders());
    if (res.data.employee.department !== 'QA & Security') throw new Error('Update failed');
  });

  // 9. Employee Login
  await test('POST /api/auth/login (Employee)', async () => {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: testEmail,
      password: 'Password@123'
    });
    if (!res.data.token) throw new Error('Employee login failed');
    employeeToken = res.data.token;
  });

  const empHeaders = () => ({ headers: { Authorization: `Bearer ${employeeToken}` } });

  // 10. Upload Activity Telemetry Batch
  await test('POST /api/activity/upload', async () => {
    const res = await axios.post(`${BASE_URL}/api/activity/upload`, {
      activities: [
        {
          appName: 'Google Chrome',
          processName: 'chrome.exe',
          windowTitle: 'GitHub - bankarom/monitoring-system',
          domain: 'github.com',
          durationSeconds: 20,
          mouseClicks: 8,
          keystrokes: 24,
          isIdle: false,
          recordedAt: new Date().toISOString()
        }
      ],
      clicksPerMinute: 24,
      keysPerMinute: 72,
      currentStatus: 'ONLINE'
    }, empHeaders());
    if (!res.data.success) throw new Error('Activity batch upload failed');
  });

  // 11. Upload Screenshot
  await test('POST /api/activity/screenshots/upload', async () => {
    const form = new FormData();
    const dummyBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    form.append('image', dummyBuffer, { filename: 'test-audit.jpg', contentType: 'image/jpeg' });
    form.append('appName', 'Visual Studio Code');
    form.append('windowTitle', 'test.ts');
    form.append('isIdle', 'false');
    form.append('takenAt', new Date().toISOString());

    const res = await axios.post(`${BASE_URL}/api/activity/screenshots/upload`, form, {
      headers: {
        ...empHeaders().headers,
        ...form.getHeaders()
      }
    });
    if (!res.data.screenshot || !res.data.screenshot.filePath) throw new Error('Screenshot upload failed');
  });

  // 12. 24h Timeline
  await test('GET /api/admin/timeline', async () => {
    const res = await axios.get(`${BASE_URL}/api/admin/timeline?userId=${createdEmpId}`, adminHeaders());
    if (!res.data.user || !Array.isArray(res.data.activityBlocks)) throw new Error('Timeline payload invalid');
    if (res.data.activityBlocks.length === 0) throw new Error('Uploaded activity block missing from timeline');
  });

  // 13. App Analytics
  await test('GET /api/admin/analytics/apps', async () => {
    const res = await axios.get(`${BASE_URL}/api/admin/analytics/apps`, adminHeaders());
    if (!Array.isArray(res.data.apps)) throw new Error('App analytics payload invalid');
  });

  // 14. Web Analytics
  await test('GET /api/admin/analytics/websites', async () => {
    const res = await axios.get(`${BASE_URL}/api/admin/analytics/websites`, adminHeaders());
    if (!Array.isArray(res.data.websites)) throw new Error('Web analytics payload invalid');
  });

  // 15. Timesheets
  await test('GET /api/admin/timesheets', async () => {
    const res = await axios.get(`${BASE_URL}/api/admin/timesheets`, adminHeaders());
    if (!Array.isArray(res.data.timesheets)) throw new Error('Timesheets payload invalid');
  });

  // 16. Timesheet CSV Export
  await test('GET /api/admin/timesheets/export-csv', async () => {
    const res = await axios.get(`${BASE_URL}/api/admin/timesheets/export-csv`, adminHeaders());
    if (typeof res.data !== 'string' || !res.data.includes('Employee Name')) throw new Error('CSV export invalid');
  });

  // 17. Screenshots Gallery
  await test('GET /api/admin/screenshots', async () => {
    const res = await axios.get(`${BASE_URL}/api/admin/screenshots`, adminHeaders());
    if (!Array.isArray(res.data.screenshots)) throw new Error('Screenshots gallery payload invalid');
  });

  // 18. Settings
  await test('GET & PUT /api/admin/settings', async () => {
    const getRes = await axios.get(`${BASE_URL}/api/admin/settings`, adminHeaders());
    if (!getRes.data.settings) throw new Error('Get settings failed');

    const putRes = await axios.put(`${BASE_URL}/api/admin/settings`, {
      screenshotInterval: 10,
      idleThreshold: 3,
      retentionDays: 30
    }, adminHeaders());
    if (putRes.data.settings.idleThreshold !== 3) throw new Error('Put settings failed');
  });

  // 19. Employee Logout (Clock-Out)
  await test('POST /api/auth/logout', async () => {
    const res = await axios.post(`${BASE_URL}/api/auth/logout`, {}, empHeaders());
    if (!res.data.success) throw new Error('Logout failed');
  });

  // 20. Delete / Deactivate Employee
  await test('DELETE /api/admin/employees/:id', async () => {
    const res = await axios.delete(`${BASE_URL}/api/admin/employees/${createdEmpId}`, adminHeaders());
    if (!res.data.success) throw new Error('Employee deactivation failed');
  });

  console.log('\n====================================================');
  console.log(`🏁 AUDIT COMPLETE: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================');
}

runFullAudit();