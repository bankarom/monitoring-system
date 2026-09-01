import { prisma } from '../config/prisma';

async function wipeAllData() {
  console.log('🧹 Starting Complete Database Wipe...');

  // 1. Delete all activity logs
  const logsDeleted = await prisma.activityLog.deleteMany({});
  console.log(`- Wiped ${logsDeleted.count} activity logs.`);

  // 2. Delete all screenshots
  const screenshotsDeleted = await prisma.screenshot.deleteMany({});
  console.log(`- Wiped ${screenshotsDeleted.count} screenshots.`);

  // 3. Delete all attendance records
  const attendancesDeleted = await prisma.attendance.deleteMany({});
  console.log(`- Wiped ${attendancesDeleted.count} attendance records.`);

  // 4. Delete all employee users (keeping only Super Admin)
  const employeesDeleted = await prisma.user.deleteMany({
    where: { role: 'EMPLOYEE' }
  });
  console.log(`- Wiped ${employeesDeleted.count} employee accounts.`);

  // 5. Reset admin status
  await prisma.user.updateMany({
    where: { role: 'ADMIN' },
    data: {
      status: 'OFFLINE',
      currentApp: null,
      currentTitle: null,
      currentDomain: null,
      pauseReason: null,
      pauseComment: null
    }
  });

  console.log('✅ DATABASE FULLY WIPED & RESET TO FRESH STATE!');
  process.exit(0);
}

wipeAllData().catch((err) => {
  console.error('Failed to wipe database:', err);
  process.exit(1);
});
