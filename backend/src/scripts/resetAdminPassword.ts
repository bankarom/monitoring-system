import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';

async function resetAdmin() {
  const adminEmail = 'monitoradmin@improxgroup.com1234';
  const adminPass = '#admin0089000#';
  const hashedPassword = await bcrypt.hash(adminPass, 10);

  // First check if an admin account with role ADMIN exists
  const existingAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

  if (existingAdmin) {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        name: 'Super Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        status: 'OFFLINE'
      }
    });
    console.log(`✅ Super Admin account set to: ${adminEmail} / ${adminPass}`);
  } else {
    await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
        department: 'Executive',
        shift: 'General',
        isActive: true,
        status: 'OFFLINE'
      }
    });
    console.log(`✅ Super Admin created: ${adminEmail} / ${adminPass}`);
  }

  process.exit(0);
}

resetAdmin().catch((err) => {
  console.error('Failed to reset admin password:', err);
  process.exit(1);
});
