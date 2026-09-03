import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { generateToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../middleware/auth';
import { socketService } from '../services/socketService';

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: `Invalid email or password. No account found for '${cleanEmail}'.` });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: `Account '${cleanEmail}' is deactivated. Please contact Super Admin.` });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: `Incorrect password for '${cleanEmail}'. Please enter the exact password created in Super Admin.` });
    }

    // Update status to ONLINE and record lastActiveAt
    const now = new Date();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: 'ONLINE',
        lastActiveAt: now
      }
    });

    // Handle Attendance Clock-In for today
    const today = now.toISOString().split('T')[0];
    const existingAttendance = await prisma.attendance.findUnique({
      where: { userId_date: { userId: user.id, date: today } }
    });

    if (!existingAttendance) {
      await prisma.attendance.create({
        data: {
          userId: user.id,
          date: today,
          clockInAt: now,
          status: 'PRESENT'
        }
      });
    }

    // Fetch system settings
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

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });

    socketService.broadcastUserPresence(user.id, 'ONLINE', {
      name: user.name,
      lastActiveAt: now
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        shift: user.shift,
        status: 'ONLINE'
      },
      settings: {
        screenshotInterval: settings.screenshotInterval,
        idleThreshold: settings.idleThreshold,
        companyName: settings.companyName
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error during login', error: error.message });
  }
}

export async function logout(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID missing' });
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Mark user offline
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'OFFLINE',
        lastActiveAt: now,
        currentApp: null,
        currentTitle: null,
        currentDomain: null
      }
    });

    // Record Clock-Out time
    await prisma.attendance.updateMany({
      where: { userId, date: today },
      data: { clockOutAt: now }
    });

    socketService.broadcastUserPresence(userId, 'OFFLINE');

    return res.status(200).json({ success: true, message: 'Clocked out and logged out successfully' });
  } catch (error: any) {
    console.error('Logout error:', error);
    return res.status(500).json({ success: false, message: 'Error during logout', error: error.message });
  }
}

export async function getProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        shift: true,
        status: true,
        lastActiveAt: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, user });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
