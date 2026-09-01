import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../config/prisma';
import { resolveAppInfo } from '../config/appCategories';
import { socketService } from '../services/socketService';
import { config } from '../config/environment';
import path from 'path';

export interface ActivityBatchItem {
  appName: string;
  processName?: string;
  windowTitle?: string;
  domain?: string;
  url?: string;
  durationSeconds: number;
  mouseClicks: number;
  keystrokes: number;
  isIdle: boolean;
  recordedAt: string;
}

export async function uploadActivityBatch(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { activities, currentStatus, isPaused, pauseReason, pauseComment, clicksPerMinute, keysPerMinute } = req.body as {
      activities: ActivityBatchItem[];
      currentStatus?: 'ONLINE' | 'IDLE' | 'PAUSED';
      isPaused?: boolean;
      pauseReason?: string;
      pauseComment?: string;
      clicksPerMinute?: number;
      keysPerMinute?: number;
    };

    if (!activities || !Array.isArray(activities) || activities.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or empty activity batch' });
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    let batchActiveSeconds = 0;
    let batchIdleSeconds = 0;
    let batchPauseSeconds = 0;

    const createRecords = activities.map((item) => {
      const { friendlyName, category } = resolveAppInfo(
        item.processName || item.appName,
        item.windowTitle,
        item.domain,
        item.isIdle
      );

      const duration = item.durationSeconds || 5;
      if (isPaused || currentStatus === 'PAUSED') {
        batchPauseSeconds += duration;
      } else if (item.isIdle) {
        batchIdleSeconds += duration;
      } else {
        batchActiveSeconds += duration;
      }

      return {
        userId,
        appName: friendlyName,
        processName: item.processName || item.appName,
        windowTitle: item.windowTitle || '',
        domain: item.domain || null,
        url: item.url || null,
        category,
        durationSeconds: duration,
        mouseClicks: item.mouseClicks || 0,
        keystrokes: item.keystrokes || 0,
        isIdle: !!item.isIdle,
        recordedAt: item.recordedAt ? new Date(item.recordedAt) : now
      };
    });

    await prisma.activityLog.createMany({
      data: createRecords
    });

    const latestItem = activities[activities.length - 1];
    const resolvedLatest = resolveAppInfo(
      latestItem.processName || latestItem.appName,
      latestItem.windowTitle,
      latestItem.domain,
      latestItem.isIdle
    );

    const userStatus = isPaused ? 'PAUSED' : (currentStatus || (latestItem.isIdle ? 'IDLE' : 'ONLINE'));

    await prisma.user.update({
      where: { id: userId },
      data: {
        status: userStatus,
        pauseReason: isPaused ? (pauseReason || 'Break') : null,
        pauseComment: isPaused ? (pauseComment || null) : null,
        lastActiveAt: now,
        currentApp: resolvedLatest.friendlyName,
        currentTitle: latestItem.windowTitle || null,
        currentDomain: latestItem.domain || null
      }
    });

    // Find active open shift (clockOutAt === null) to support cross-midnight shifts (e.g. 6:30 PM to 3:30 AM)
    let activeAtt = await prisma.attendance.findFirst({
      where: { userId, clockOutAt: null },
      orderBy: { createdAt: 'desc' }
    });

    if (!activeAtt) {
      activeAtt = await prisma.attendance.create({
        data: {
          userId,
          date: today,
          clockInAt: now,
          totalActiveSeconds: batchActiveSeconds,
          totalIdleSeconds: batchIdleSeconds,
          manualPauseSeconds: batchPauseSeconds,
          totalWorkSeconds: batchActiveSeconds + batchIdleSeconds + batchPauseSeconds,
          status: 'PRESENT',
          pauseReason: isPaused ? (pauseReason || 'Break') : null
        }
      });
    } else {
      activeAtt = await prisma.attendance.update({
        where: { id: activeAtt.id },
        data: {
          totalActiveSeconds: { increment: batchActiveSeconds },
          totalIdleSeconds: { increment: batchIdleSeconds },
          manualPauseSeconds: { increment: batchPauseSeconds },
          totalWorkSeconds: { increment: batchActiveSeconds + batchIdleSeconds + batchPauseSeconds },
          pauseReason: isPaused ? (pauseReason || 'Break') : undefined
        }
      });
    }

    socketService.broadcastLiveActivity(userId, {
      status: userStatus,
      currentApp: resolvedLatest.friendlyName,
      currentTitle: latestItem.windowTitle,
      currentDomain: latestItem.domain,
      clicksPerMinute: clicksPerMinute || 0,
      keysPerMinute: keysPerMinute || 0,
      lastActiveAt: now
    });

    return res.status(200).json({
      success: true,
      message: 'Processed ' + activities.length + ' activity entries',
      activeSecondsAdded: batchActiveSeconds,
      idleSecondsAdded: batchIdleSeconds
    });
  } catch (error: any) {
    console.error('Activity upload error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process activity batch', error: error.message });
  }
}

export async function clockOutHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const now = new Date();
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'OFFLINE',
        pauseReason: null,
        pauseComment: null,
        currentApp: null,
        currentTitle: null,
        currentDomain: null
      }
    });

    const activeAtt = await prisma.attendance.findFirst({
      where: { userId, clockOutAt: null },
      orderBy: { createdAt: 'desc' }
    });

    if (activeAtt) {
      await prisma.attendance.update({
        where: { id: activeAtt.id },
        data: { clockOutAt: now }
      });
    }

    return res.status(200).json({ success: true, message: 'Clocked out successfully' });
  } catch (error: any) {
    console.error('Clock out error:', error);
    return res.status(500).json({ success: false, message: 'Failed to clock out', error: error.message });
  }
}

export async function uploadScreenshotHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No screenshot file received' });
    }

    const { displayIndex, appName, windowTitle, isIdle, takenAt } = req.body;
    const now = takenAt ? new Date(takenAt) : new Date();

    const relativePath = path.relative(config.uploadDir, req.file.path).replace(/\\/g, '/');
    const screenshotUrl = '/uploads/' + relativePath;

    const screenshot = await prisma.screenshot.create({
      data: {
        userId,
        filePath: screenshotUrl,
        fileSize: req.file.size,
        displayIndex: displayIndex ? parseInt(displayIndex, 10) : 0,
        appName: appName || null,
        windowTitle: windowTitle || null,
        isIdle: isIdle === 'true' || isIdle === true,
        takenAt: now
      }
    });

    socketService.broadcastScreenshotNotification(userId, {
      screenshotId: screenshot.id,
      filePath: screenshotUrl,
      appName: screenshot.appName,
      windowTitle: screenshot.windowTitle,
      isIdle: screenshot.isIdle,
      takenAt: screenshot.takenAt
    });

    return res.status(201).json({
      success: true,
      message: 'Screenshot saved and indexed successfully',
      screenshot
    });
  } catch (error: any) {
    console.error('Screenshot upload error:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload screenshot', error: error.message });
  }
}