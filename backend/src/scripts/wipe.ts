import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function runFullWipe() {
  console.log('🚨 Starting full database and screenshot files wipe...');

  try {
    // 1. Delete all activity logs (graphs, apps, urls, keyboard/mouse stats)
    const logsRes = await prisma.activityLog.deleteMany({});
    console.log(`✅ Deleted ${logsRes.count} activity logs (cleared all graphs and telemetry)`);

    // 2. Delete all screenshots from database
    const shotsRes = await prisma.screenshot.deleteMany({});
    console.log(`✅ Deleted ${shotsRes.count} screenshot database records`);

    // 3. Delete all attendance records
    const attRes = await prisma.attendance.deleteMany({});
    console.log(`✅ Deleted ${attRes.count} attendance records`);

    // 4. Delete all offline time records (if table exists)
    try {
      const offRes = await prisma.offlineTime.deleteMany({});
      console.log(`✅ Deleted ${offRes.count} offline time records`);
    } catch (e) {
      console.log('ℹ️ Offline time records table not created yet, skipping...');
    }

    // 5. Delete all old employee users
    const empRes = await prisma.user.deleteMany({
      where: { role: 'EMPLOYEE' }
    });
    console.log(`✅ Deleted ${empRes.count} old employee accounts`);

    // 6. Reset Super Admin status
    await prisma.user.updateMany({
      where: { role: 'ADMIN' },
      data: {
        status: 'OFFLINE',
        pauseReason: null,
        pauseComment: null,
        currentApp: null,
        currentTitle: null,
        currentDomain: null
      }
    });
    console.log('✅ Super Admin account status reset to OFFLINE');

    // 7. Clear uploaded screenshot image files on disk
    const uploadDirs = [
      path.join(__dirname, '../../uploads/screenshots'),
      path.join(__dirname, '../../../uploads/screenshots'),
      path.join(process.cwd(), 'uploads/screenshots')
    ];

    for (const dir of uploadDirs) {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          if (file !== '.gitkeep') {
            try {
              fs.unlinkSync(path.join(dir, file));
            } catch (e) {}
          }
        }
        console.log(`✅ Cleaned screenshot files from disk: ${dir}`);
      }
    }

    console.log('\n🎉 ALL OLD DATA, SCREENSHOTS, GRAPHS, AND EMPLOYEES HAVE BEEN DELETED COMPLETELY!');
    console.log('You can now start 100% fresh!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Wipe Error:', error.message);
    process.exit(1);
  }
}

runFullWipe();
