import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';

export async function seedInitialAdmin() {
  try {
    const adminEmail = 'admin@improx.com';
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('Admin@123456', 10);
      await prisma.user.create({
        data: {
          name: 'Super Admin',
          email: adminEmail,
          password: hashedPassword,
          role: 'ADMIN',
          department: 'Executive',
          shift: 'General',
          status: 'OFFLINE'
        }
      });
      console.log('✅ Default Admin created: admin@improx.com / Admin@123456');
    }

    // Ensure SystemSetting exists
    const settings = await prisma.systemSetting.findUnique({ where: { id: 'global' } });
    if (!settings) {
      await prisma.systemSetting.create({
        data: {
          id: 'global',
          screenshotInterval: 10,
          idleThreshold: 5,
          retentionDays: 30,
          companyName: 'Improx Group'
        }
      });
      console.log('✅ Global System Settings initialized.');
    }
  } catch (error) {
    console.error('⚠️ Seeding error:', error);
  }
}

if (require.main === module) {
  seedInitialAdmin().then(() => process.exit(0));
}
