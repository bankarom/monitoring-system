import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';

async function resetAdmin() {
  const adminEmail = 'admin@improx.com';
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        status: 'OFFLINE'
      }
    });
    console.log('✅ Super Admin password reset successfully to: admin123');
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
    console.log('✅ Super Admin account created: admin@improx.com / admin123');
  }

  process.exit(0);
}

resetAdmin().catch((err) => {
  console.error('Failed to reset admin password:', err);
  process.exit(1);
});
