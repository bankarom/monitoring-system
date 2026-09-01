import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../config/prisma';

export async function getMyProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        shift: true,
        role: true,
        status: true,
        pauseReason: true,
        pauseComment: true,
        currentApp: true
      }
    });

    return res.status(200).json({ success: true, user });
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

    const totalBreaks = (attendance.totalIdleSeconds || 0) + (attendance.manualPauseSeconds || 0);
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
        pauseReason: attendance.pauseReason
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
