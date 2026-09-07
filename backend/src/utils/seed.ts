import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';

export async function seedInitialAdmin() {
  try {
    const adminEmail = 'monitoradmin@improxgroup.com1234';
    const adminPass = '#admin0089000#';
    const hashedPassword = await bcrypt.hash(adminPass, 10);

    const existingTargetAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!existingTargetAdmin) {
      // Find any old admin account and update it, or create a new one
      const oldAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

      if (oldAdmin) {
        await prisma.user.update({
          where: { id: oldAdmin.id },
          data: {
            name: 'Super Admin',
            email: adminEmail,
            password: hashedPassword,
            isActive: true,
            status: 'OFFLINE'
          }
        });
        console.log(`✅ Super Admin updated: ${adminEmail} / ${adminPass}`);
      } else {
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
        console.log(`✅ Super Admin created: ${adminEmail} / ${adminPass}`);
      }
    } else {
      // Always ensure the password matches #admin0089000#
      await prisma.user.update({
        where: { id: existingTargetAdmin.id },
        data: {
          password: hashedPassword,
          isActive: true
        }
      });
      console.log(`✅ Super Admin verified & active: ${adminEmail}`);
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
