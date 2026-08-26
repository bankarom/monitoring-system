import { prisma } from '../config/prisma';
import { socketService } from './socketService';

export function startHeartbeatSupervisor() {
  setInterval(async () => {
    try {
      const staleThreshold = new Date(Date.now() - 45000); // 45 seconds timeout
      const today = new Date().toISOString().split('T')[0];

      const staleUsers = await prisma.user.findMany({
        where: {
          role: 'EMPLOYEE',
          isActive: true,
          status: { in: ['ONLINE', 'IDLE'] },
          OR: [
            { lastActiveAt: { lt: staleThreshold } },
            { lastActiveAt: null }
          ]
        },
        select: { id: true, name: true, lastActiveAt: true }
      });

      for (const user of staleUsers) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            status: 'OFFLINE',
            currentApp: null,
            currentTitle: null,
            currentDomain: null
          }
        });

        // Set clock out time if not already clocked out
        await prisma.attendance.updateMany({
          where: {
            userId: user.id,
            date: today,
            clockOutAt: null
          },
          data: {
            clockOutAt: user.lastActiveAt || new Date()
          }
        });

        socketService.broadcastUserPresence(user.id, 'OFFLINE', {
          lastActiveAt: user.lastActiveAt || undefined
        });

        console.log(`⏰ [Heartbeat Supervisor] Marked inactive employee OFFLINE: ${user.name}`);
      }
    } catch (e) {
      // Ignore heartbeat errors
    }
  }, 15000);
}