import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import { prisma } from '../config/prisma';
import { config } from '../config/environment';

// Dashboard Overview Statistics
export async function getDashboardStats(req: Request, res: Response) {
  try {
    const requestedDate = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const targetStart = new Date(requestedDate + 'T00:00:00.000Z');
    const targetEnd = new Date(requestedDate + 'T23:59:59.999Z');

    // Headcount status
    const employees = await prisma.user.findMany({
      where: { role: 'EMPLOYEE', isActive: true },
      select: { id: true, status: true, name: true, department: true }
    });

    const totalHeadcount = employees.length;
    const onlineCount = employees.filter(e => e.status === 'ONLINE').length;
    const idleCount = employees.filter(e => e.status === 'IDLE').length;
    const offlineCount = employees.filter(e => e.status === 'OFFLINE').length;

    // Aggregate work hours for selected date
    const dateAttendances = await prisma.attendance.findMany({
      where: { date: requestedDate }
    });

    const totalActiveSecondsToday = dateAttendances.reduce((sum, a) => sum + a.totalActiveSeconds, 0);
    const totalIdleSecondsToday = dateAttendances.reduce((sum, a) => sum + a.totalIdleSeconds, 0);
    const totalWorkSecondsToday = totalActiveSecondsToday + totalIdleSecondsToday;

    // Top Apps for selected date
    const appLogs = await prisma.activityLog.groupBy({
      by: ['appName', 'category'],
      where: {
        recordedAt: { gte: targetStart, lte: targetEnd },
        isIdle: false
      },
      _sum: { durationSeconds: true },
      orderBy: { _sum: { durationSeconds: 'desc' } },
      take: 6
    });

    const topApps = appLogs.map(item => ({
      name: item.appName,
      category: item.category,
      durationMinutes: Math.round((item._sum.durationSeconds || 0) / 60)
    }));

    // Top Websites for selected date
    const domainLogs = await prisma.activityLog.groupBy({
      by: ['domain'],
      where: {
        recordedAt: { gte: targetStart, lte: targetEnd },
        domain: { not: null },
        isIdle: false
      },
      _sum: { durationSeconds: true },
      orderBy: { _sum: { durationSeconds: 'desc' } },
      take: 6
    });

    const topWebsites = domainLogs.filter(d => d.domain).map(item => ({
      domain: item.domain!,
      durationMinutes: Math.round((item._sum.durationSeconds || 0) / 60)
    }));

    // 7-Day Productivity Trend
    const past7Days: { date: string; activeHours: number; idleHours: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const dayRecords = await prisma.attendance.findMany({
        where: { date: dateStr }
      });

      const dayActiveSec = dayRecords.reduce((sum, r) => sum + r.totalActiveSeconds, 0);
      const dayIdleSec = dayRecords.reduce((sum, r) => sum + r.totalIdleSeconds, 0);

      past7Days.push({
        date: dateStr,
        activeHours: parseFloat((dayActiveSec / 3600).toFixed(1)),
        idleHours: parseFloat((dayIdleSec / 3600).toFixed(1))
      });
    }

    return res.status(200).json({
      success: true,
      stats: {
        headcount: {
          total: totalHeadcount,
          online: onlineCount,
          idle: idleCount,
          offline: offlineCount
        },
        todayHours: {
          activeHours: parseFloat((totalActiveSecondsToday / 3600).toFixed(2)),
          idleHours: parseFloat((totalIdleSecondsToday / 3600).toFixed(2)),
          totalHours: parseFloat((totalWorkSecondsToday / 3600).toFixed(2))
        },
        topApps,
        topWebsites,
        productivityTrend: past7Days
      }
    });
  } catch (error: any) {
    console.error('getDashboardStats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats', error: error.message });
  }
}

// Employee Management CRUD
export async function getEmployees(req: Request, res: Response) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const employees = await prisma.user.findMany({
      where: { role: 'EMPLOYEE', isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        shift: true,
        status: true,
        lastActiveAt: true,
        currentApp: true,
        currentTitle: true,
        currentDomain: true,
        createdAt: true,
        attendances: {
          where: { date: today },
          select: {
            clockInAt: true,
            clockOutAt: true,
            totalActiveSeconds: true,
            totalIdleSeconds: true,
            totalWorkSeconds: true
          }
        }
      },
      orderBy: [{ status: 'asc' }, { name: 'asc' }]
    });

    const formatted = employees.map(emp => {
      const att = emp.attendances[0];
      return {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        department: emp.department,
        shift: emp.shift,
        status: emp.status,
        lastActiveAt: emp.lastActiveAt,
        currentApp: emp.currentApp,
        currentTitle: emp.currentTitle,
        currentDomain: emp.currentDomain,
        clockInAt: att?.clockInAt || null,
        clockOutAt: att?.clockOutAt || null,
        activeHoursToday: att ? parseFloat((att.totalActiveSeconds / 3600).toFixed(2)) : 0,
        idleHoursToday: att ? parseFloat((att.totalIdleSeconds / 3600).toFixed(2)) : 0,
        totalHoursToday: att ? parseFloat((att.totalWorkSeconds / 3600).toFixed(2)) : 0,
        createdAt: emp.createdAt
      };
    });

    return res.status(200).json({ success: true, employees: formatted });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createEmployee(req: Request, res: Response) {
  try {
    const { name, email, password, department, shift } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'An employee with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const employee = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        department: department || 'General',
        shift: shift || '09:00 - 18:00',
        role: 'EMPLOYEE',
        status: 'OFFLINE'
      },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        shift: true,
        role: true,
        status: true,
        createdAt: true
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Employee registered successfully',
      employee
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateEmployee(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, email, department, shift, password, isActive } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase().trim();
    if (department) updateData.department = department;
    if (shift) updateData.shift = shift;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        shift: true,
        role: true,
        status: true,
        isActive: true
      }
    });

    return res.status(200).json({ success: true, message: 'Employee updated', employee: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteEmployee(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Hard delete all dependent logs, screenshots, and attendance records
    await prisma.activityLog.deleteMany({ where: { userId: id } });
    await prisma.screenshot.deleteMany({ where: { userId: id } });
    await prisma.attendance.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });

    return res.status(200).json({ success: true, message: 'Employee permanently deleted from database' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// Real-Time Live Grid Data
export async function getRealtimeGrid(req: Request, res: Response) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const employees = await prisma.user.findMany({
      where: { role: 'EMPLOYEE', isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        status: true,
        lastActiveAt: true,
        currentApp: true,
        currentTitle: true,
        currentDomain: true,
        attendances: {
          where: { date: today },
          select: {
            clockInAt: true,
            totalActiveSeconds: true,
            totalIdleSeconds: true
          }
        },
        screenshots: {
          orderBy: { takenAt: 'desc' },
          take: 1,
          select: {
            id: true,
            filePath: true,
            takenAt: true,
            appName: true,
            windowTitle: true
          }
        }
      },
      orderBy: [{ status: 'asc' }, { name: 'asc' }]
    });

    const grid = employees.map(emp => {
      const att = emp.attendances[0];
      const latestScreen = emp.screenshots[0];
      return {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        department: emp.department,
        status: emp.status,
        lastActiveAt: emp.lastActiveAt,
        currentApp: emp.currentApp || 'None',
        currentTitle: emp.currentTitle || '',
        currentDomain: emp.currentDomain || '',
        clockInAt: att?.clockInAt || null,
        activeHoursToday: att ? parseFloat((att.totalActiveSeconds / 3600).toFixed(2)) : 0,
        idleHoursToday: att ? parseFloat((att.totalIdleSeconds / 3600).toFixed(2)) : 0,
        latestScreenshot: latestScreen || null
      };
    });

    return res.status(200).json({ success: true, grid });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// Screenshots Gallery & Retrieval
export async function getScreenshots(req: Request, res: Response) {
  try {
    const { userId, date } = req.query as { userId?: string; date?: string };
    const queryDate = date || new Date().toISOString().split('T')[0];

    const startOfDay = new Date(queryDate + 'T00:00:00.000Z');
    const endOfDay = new Date(queryDate + 'T23:59:59.999Z');

    const whereClause: any = {
      takenAt: { gte: startOfDay, lte: endOfDay }
    };

    if (userId) {
      whereClause.userId = userId;
    }

    const screenshots = await prisma.screenshot.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, email: true, department: true }
        }
      },
      orderBy: { takenAt: 'desc' }
    });

    return res.status(200).json({
      success: true,
      date: queryDate,
      count: screenshots.length,
      screenshots
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// 1-Click ZIP Export for Screenshots
export async function exportScreenshotsZip(req: Request, res: Response) {
  try {
    const { userId, date } = req.query as { userId?: string; date?: string };
    const queryDate = date || new Date().toISOString().split('T')[0];

    const startOfDay = new Date(queryDate + 'T00:00:00.000Z');
    const endOfDay = new Date(queryDate + 'T23:59:59.999Z');

    const whereClause: any = {
      takenAt: { gte: startOfDay, lte: endOfDay }
    };
    if (userId) whereClause.userId = userId;

    const screenshots = await prisma.screenshot.findMany({
      where: whereClause,
      include: { user: { select: { name: true } } }
    });

    if (screenshots.length === 0) {
      return res.status(404).json({ success: false, message: 'No screenshots found for the selected date.' });
    }

    const archive = archiver('zip', { zlib: { level: 6 } });
    const filename = 'screenshots-' + queryDate + '-' + (userId || 'all') + '.zip';

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');

    archive.pipe(res);

    for (const s of screenshots) {
      const relative = s.filePath.replace(/^\/uploads\//, '');
      const absolutePath = path.join(config.uploadDir, relative);
      if (fs.existsSync(absolutePath)) {
        const entryName = s.user.name.replace(/\s+/g, '_') + '/' + path.basename(absolutePath);
        archive.file(absolutePath, { name: entryName });
      }
    }

    await archive.finalize();
  } catch (error: any) {
    console.error('ZIP export error:', error);
    return res.status(500).json({ success: false, message: 'Error generating ZIP archive', error: error.message });
  }
}

// 24-Hour Visual Activity Timeline
export async function getActivityTimeline(req: Request, res: Response) {
  try {
    const { userId, date } = req.query as { userId: string; date?: string };
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    const queryDate = date || new Date().toISOString().split('T')[0];
    const startOfDay = new Date(queryDate + 'T00:00:00.000Z');
    const endOfDay = new Date(queryDate + 'T23:59:59.999Z');

    const [user, logs, attendance, screenshots] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, department: true }
      }),
      prisma.activityLog.findMany({
        where: {
          userId,
          recordedAt: { gte: startOfDay, lte: endOfDay }
        },
        orderBy: { recordedAt: 'asc' }
      }),
      prisma.attendance.findUnique({
        where: { userId_date: { userId, date: queryDate } }
      }),
      prisma.screenshot.findMany({
        where: {
          userId,
          takenAt: { gte: startOfDay, lte: endOfDay }
        },
        orderBy: { takenAt: 'asc' },
        select: { id: true, filePath: true, appName: true, takenAt: true, isIdle: true }
      })
    ]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      user,
      date: queryDate,
      attendance: attendance || {
        clockInAt: null,
        clockOutAt: null,
        totalActiveSeconds: 0,
        totalIdleSeconds: 0,
        totalWorkSeconds: 0
      },
      activityBlocks: logs,
      screenshots
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// App Usage Analytics
export async function getAppAnalytics(req: Request, res: Response) {
  try {
    const { userId, date } = req.query as { userId?: string; date?: string };
    const queryDate = date || new Date().toISOString().split('T')[0];
    const startOfDay = new Date(queryDate + 'T00:00:00.000Z');
    const endOfDay = new Date(queryDate + 'T23:59:59.999Z');

    const whereClause: any = {
      recordedAt: { gte: startOfDay, lte: endOfDay },
      isIdle: false
    };
    if (userId) whereClause.userId = userId;

    const appUsage = await prisma.activityLog.groupBy({
      by: ['appName', 'category'],
      where: whereClause,
      _sum: { durationSeconds: true, mouseClicks: true, keystrokes: true },
      _count: { id: true },
      orderBy: { _sum: { durationSeconds: 'desc' } }
    });

    const totalSeconds = appUsage.reduce((sum, item) => sum + (item._sum.durationSeconds || 0), 0);

    const formatted = appUsage.map(item => {
      const sec = item._sum.durationSeconds || 0;
      return {
        appName: item.appName,
        category: item.category,
        totalMinutes: Math.round(sec / 60),
        totalHours: parseFloat((sec / 3600).toFixed(2)),
        percentage: totalSeconds > 0 ? parseFloat(((sec / totalSeconds) * 100).toFixed(1)) : 0,
        clicks: item._sum.mouseClicks || 0,
        keystrokes: item._sum.keystrokes || 0,
        sessionCount: item._count.id
      };
    });

    return res.status(200).json({ success: true, date: queryDate, totalSeconds, apps: formatted });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// Web Browsing Analytics
export async function getWebAnalytics(req: Request, res: Response) {
  try {
    const { userId, date } = req.query as { userId?: string; date?: string };
    const queryDate = date || new Date().toISOString().split('T')[0];
    const startOfDay = new Date(queryDate + 'T00:00:00.000Z');
    const endOfDay = new Date(queryDate + 'T23:59:59.999Z');

    const whereClause: any = {
      recordedAt: { gte: startOfDay, lte: endOfDay },
      domain: { not: null },
      isIdle: false
    };
    if (userId) whereClause.userId = userId;

    const webUsage = await prisma.activityLog.groupBy({
      by: ['domain'],
      where: whereClause,
      _sum: { durationSeconds: true },
      _count: { id: true },
      orderBy: { _sum: { durationSeconds: 'desc' } }
    });

    const totalWebSeconds = webUsage.reduce((sum, item) => sum + (item._sum.durationSeconds || 0), 0);

    const formatted = webUsage.filter(w => w.domain).map(item => {
      const sec = item._sum.durationSeconds || 0;
      return {
        domain: item.domain!,
        totalMinutes: Math.round(sec / 60),
        totalHours: parseFloat((sec / 3600).toFixed(2)),
        percentage: totalWebSeconds > 0 ? parseFloat(((sec / totalWebSeconds) * 100).toFixed(1)) : 0,
        visitCount: item._count.id
      };
    });

    return res.status(200).json({ success: true, date: queryDate, websites: formatted });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// Timesheets & Attendance Reports
export async function getTimesheets(req: Request, res: Response) {
  try {
    const { date, startDate, endDate, department } = req.query as {
      date?: string;
      startDate?: string;
      endDate?: string;
      department?: string;
    };

    const queryDate = date || new Date().toISOString().split('T')[0];

    const whereClause: any = {};
    if (startDate && endDate) {
      whereClause.date = { gte: startDate, lte: endDate };
    } else {
      whereClause.date = queryDate;
    }

    if (department) {
      whereClause.user = { department };
    }

    const attendances = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, email: true, department: true, shift: true }
        }
      },
      orderBy: [{ date: 'desc' }, { user: { name: 'asc' } }]
    });

    const formatted = attendances.map(a => {
      const totalBreaks = (a.totalIdleSeconds || 0) + (a.manualPauseSeconds || 0);
      const activeHours = parseFloat((a.totalActiveSeconds / 3600).toFixed(2));
      const idleHours = parseFloat((totalBreaks / 3600).toFixed(2));
      const totalHours = parseFloat((a.totalWorkSeconds / 3600).toFixed(2));
      const productivityScore = totalHours > 0 ? Math.min(100, Math.round((activeHours / totalHours) * 100)) : 0;

      return {
        id: a.id,
        employeeName: a.user.name,
        employeeEmail: a.user.email,
        department: a.user.department,
        shift: a.user.shift,
        date: a.date,
        clockInAt: a.clockInAt,
        clockOutAt: a.clockOutAt,
        activeHours,
        idleHours,
        totalHours,
        productivityScore,
        status: a.status,
        pauseReason: a.pauseReason || null
      };
    });

    return res.status(200).json({ success: true, timesheets: formatted });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function wipeDatabaseData(req: Request, res: Response) {
  try {
    await prisma.activityLog.deleteMany({});
    await prisma.screenshot.deleteMany({});
    await prisma.attendance.deleteMany({});
    await prisma.user.updateMany({
      data: {
        status: 'OFFLINE',
        pauseReason: null,
        pauseComment: null,
        currentApp: null,
        currentTitle: null,
        currentDomain: null
      }
    });

    return res.status(200).json({
      success: true,
      message: 'All past activity logs, screenshots, and attendance data wiped cleanly'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteTimesheet(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.attendance.delete({
      where: { id }
    });
    return res.status(200).json({ success: true, message: 'Timesheet record deleted' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// 1-Click CSV Timesheet Export
export async function exportTimesheetsCSV(req: Request, res: Response) {
  try {
    const { startDate, endDate, date } = req.query as { startDate?: string; endDate?: string; date?: string };
    const queryDate = date || new Date().toISOString().split('T')[0];

    const whereClause: any = {};
    if (startDate && endDate) {
      whereClause.date = { gte: startDate, lte: endDate };
    } else {
      whereClause.date = queryDate;
    }

    const records = await prisma.attendance.findMany({
      where: whereClause,
      include: { user: { select: { name: true, email: true, department: true, shift: true } } },
      orderBy: [{ date: 'desc' }, { user: { name: 'asc' } }]
    });

    const headers = ['Employee Name', 'Email', 'Department', 'Shift', 'Date', 'Clock In', 'Clock Out', 'Active Hours', 'Idle Hours', 'Total Hours', 'Productivity %', 'Status'];
    const rows = records.map(r => {
      const act = (r.totalActiveSeconds / 3600).toFixed(2);
      const idl = (r.totalIdleSeconds / 3600).toFixed(2);
      const tot = (r.totalWorkSeconds / 3600).toFixed(2);
      const score = Number(tot) > 0 ? Math.round((Number(act) / Number(tot)) * 100) : 0;
      const inTime = r.clockInAt ? new Date(r.clockInAt).toLocaleTimeString() : 'N/A';
      const outTime = r.clockOutAt ? new Date(r.clockOutAt).toLocaleTimeString() : 'N/A';

      return [
        '"' + r.user.name + '"',
        '"' + r.user.email + '"',
        '"' + r.user.department + '"',
        '"' + r.user.shift + '"',
        '"' + r.date + '"',
        '"' + inTime + '"',
        '"' + outTime + '"',
        act,
        idl,
        tot,
        score + '%',
        '"' + r.status + '"'
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="timesheet-export-' + queryDate + '.csv"');
    return res.status(200).send(csvContent);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// System Settings
export async function getSettings(req: Request, res: Response) {
  try {
    let settings = await prisma.systemSetting.findUnique({ where: { id: 'global' } });
    if (!settings) {
      settings = await prisma.systemSetting.create({
        data: {
          id: 'global',
          screenshotInterval: 10,
          idleThreshold: 5,
          retentionDays: 30,
          companyName: 'Improx Group'
        }
      });
    }

    return res.status(200).json({ success: true, settings });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateSettings(req: Request, res: Response) {
  try {
    const { screenshotInterval, idleThreshold, retentionDays, allowEmployeePause, trackDomains, companyName } = req.body;

    const updated = await prisma.systemSetting.upsert({
      where: { id: 'global' },
      update: {
        ...(screenshotInterval !== undefined && { screenshotInterval: parseInt(screenshotInterval, 10) }),
        ...(idleThreshold !== undefined && { idleThreshold: parseInt(idleThreshold, 10) }),
        ...(retentionDays !== undefined && { retentionDays: parseInt(retentionDays, 10) }),
        ...(allowEmployeePause !== undefined && { allowEmployeePause: !!allowEmployeePause }),
        ...(trackDomains !== undefined && { trackDomains: !!trackDomains }),
        ...(companyName && { companyName })
      },
      create: {
        id: 'global',
        screenshotInterval: screenshotInterval ? parseInt(screenshotInterval, 10) : 10,
        idleThreshold: idleThreshold ? parseInt(idleThreshold, 10) : 5,
        retentionDays: retentionDays ? parseInt(retentionDays, 10) : 30,
        companyName: companyName || 'Improx Group'
      }
    });

    return res.status(200).json({ success: true, message: 'Settings updated successfully', settings: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}