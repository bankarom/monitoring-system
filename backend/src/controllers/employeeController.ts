import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../config/prisma';

export async function getMyProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department,
        shift: user.shift,
        role: user.role,
        status: user.status,
        pauseReason: (user as any).pauseReason || null,
        pauseComment: (user as any).pauseComment || null,
        currentApp: user.currentApp
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getMyScreenshots(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
    const endOfDay = new Date(dateStr + 'T23:59:59.999Z');

    const screenshots = await prisma.screenshot.findMany({
      where: {
        userId,
        takenAt: { gte: startOfDay, lte: endOfDay }
      },
      orderBy: { takenAt: 'desc' }
    });

    return res.status(200).json({ success: true, date: dateStr, screenshots });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getMyTimeline(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
    const endOfDay = new Date(dateStr + 'T23:59:59.999Z');

    const logs = await prisma.activityLog.findMany({
      where: {
        userId,
        recordedAt: { gte: startOfDay, lte: endOfDay }
      },
      orderBy: { recordedAt: 'asc' }
    });

    return res.status(200).json({ success: true, date: dateStr, logs });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getMyTimesheet(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];

    const attendance = await prisma.attendance.findUnique({
      where: { userId_date: { userId, date: dateStr } }
    });

    if (!attendance) {
      return res.status(200).json({
        success: true,
        timesheet: {
          activeHours: 0,
          idleHours: 0,
          totalHours: 0,
          productivityScore: 0,
          status: 'OFFLINE'
        }
      });
    }

    const totalBreaks = (attendance.totalIdleSeconds || 0) + ((attendance as any).manualPauseSeconds || 0);
    const activeHours = parseFloat((attendance.totalActiveSeconds / 3600).toFixed(2));
    const idleHours = parseFloat((totalBreaks / 3600).toFixed(2));
    const totalHours = parseFloat((attendance.totalWorkSeconds / 3600).toFixed(2));
    const productivityScore = totalHours > 0 ? Math.min(100, Math.round((activeHours / totalHours) * 100)) : 0;

    return res.status(200).json({
      success: true,
      timesheet: {
        clockInAt: attendance.clockInAt,
        clockOutAt: attendance.clockOutAt,
        activeHours,
        idleHours,
        totalHours,
        productivityScore,
        status: attendance.status,
        pauseReason: (attendance as any).pauseReason || null
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getMyAnalytics(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
    const endOfDay = new Date(dateStr + 'T23:59:59.999Z');

    const appUsage = await prisma.activityLog.groupBy({
      by: ['appName', 'category'],
      where: {
        userId,
        recordedAt: { gte: startOfDay, lte: endOfDay }
      },
      _sum: { durationSeconds: true, mouseClicks: true, keystrokes: true },
      orderBy: { _sum: { durationSeconds: 'desc' } },
      take: 10
    });

    const apps = appUsage.map(item => ({
      appName: item.appName,
      category: item.category,
      minutes: Math.round((item._sum.durationSeconds || 0) / 60),
      clicks: item._sum.mouseClicks || 0,
      keystrokes: item._sum.keystrokes || 0
    }));

    return res.status(200).json({ success: true, date: dateStr, apps });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
