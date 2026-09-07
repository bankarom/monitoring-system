import fs from 'fs';
import path from 'path';

export function purgeOldBackups() {
  const backupDir = path.join(__dirname, '../../backups/deleted_employees');
  if (!fs.existsSync(backupDir)) return;

  const now = Date.now();
  const maxAgeMs = 60 * 24 * 60 * 60 * 1000; // 60 days retention

  try {
    const files = fs.readdirSync(backupDir);
    let purgedCount = 0;

    files.forEach((file) => {
      if (file.endsWith('.json')) {
        const filePath = path.join(backupDir, file);
        const stat = fs.statSync(filePath);
        if (now - stat.mtimeMs > maxAgeMs) {
          fs.unlinkSync(filePath);
          purgedCount++;
          console.log(`🗑️ Purged 60-day expired VPS backup: ${file}`);
        }
      }
    });

    if (purgedCount > 0) {
      console.log(`✅ Total ${purgedCount} expired backup files purged from VPS.`);
    }
  } catch (e: any) {
    console.error('Failed to purge old backups:', e.message);
  }
}
