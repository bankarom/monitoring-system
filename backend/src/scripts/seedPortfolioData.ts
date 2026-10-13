import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';

// Curated high-resolution portfolio screenshots for software engineers & designers
const DEMO_SCREENSHOTS = [
  {
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1280&q=80',
    appName: 'Visual Studio Code',
    processName: 'Code.exe',
    windowTitle: 'App.tsx — monitoring-system — Visual Studio Code',
    category: 'WORK' as const
  },
  {
    url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1280&q=80',
    appName: 'Google Chrome',
    processName: 'chrome.exe',
    windowTitle: 'Pull Requests · github.com/enterprise/monitoring — Google Chrome',
    category: 'WORK' as const
  },
  {
    url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=1280&q=80',
    appName: 'Figma Desktop',
    processName: 'Figma.exe',
    windowTitle: 'PulseTrack Design System v2.4 (Component Library) — Figma',
    category: 'WORK' as const
  },
  {
    url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1280&q=80',
    appName: 'Google Chrome',
    processName: 'chrome.exe',
    windowTitle: 'Live Telemetry & Workforce Analytics Console — Google Chrome',
    category: 'WORK' as const
  },
  {
    url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1280&q=80',
    appName: 'Windows Terminal',
    processName: 'WindowsTerminal.exe',
    windowTitle: 'bash: npm run test:e2e — Docker Container Cluster Active',
    category: 'WORK' as const
  },
  {
    url: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=1280&q=80',
    appName: 'GitHub Desktop',
    processName: 'GitHubDesktop.exe',
    windowTitle: 'Comparing branches: feature/telemetry-agent -> main',
    category: 'WORK' as const
  },
  {
    url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1280&q=80',
    appName: 'Slack',
    processName: 'slack.exe',
    windowTitle: '#engineering-standup | Improx Core Team',
    category: 'COMMUNICATION' as const
  },
  {
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1280&q=80',
    appName: 'Postman',
    processName: 'Postman.exe',
    windowTitle: 'POST /api/activity/batch — 200 OK (18ms)',
    category: 'WORK' as const
  }
];

const EMPLOYEES = [
  {
    name: 'Alex Rivers',
    email: 'alex.rivers@demo.com',
    role: 'EMPLOYEE' as const,
    department: 'Frontend Engineering',
    shift: '09:00 - 18:00',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
    tasks: ['Refactoring Live Activity Heatmap', 'Optimizing React Virtualized Grid', 'Component Library Updates']
  },
  {
    name: 'Maya Patel',
    email: 'maya.patel@demo.com',
    role: 'EMPLOYEE' as const,
    department: 'Product & UI/UX',
    shift: '09:30 - 18:30',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&q=80',
    tasks: ['Figma High-Fidelity Prototypes', 'Accessibility & Color Contrast Review', 'User Flow Wireframing']
  },
  {
    name: 'Rohan Sharma',
    email: 'rohan.sharma@demo.com',
    role: 'EMPLOYEE' as const,
    department: 'Backend & Data',
    shift: '09:00 - 18:00',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
    tasks: ['Telemetry Batching & Compression', 'PostgreSQL Index Tuning', 'Prisma Schema Migrations']
  },
  {
    name: 'Emily Zhao',
    email: 'emily.zhao@demo.com',
    role: 'EMPLOYEE' as const,
    department: 'Quality Assurance',
    shift: '10:00 - 19:00',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&q=80',
    tasks: ['Playwright E2E Test Suite', 'Agent Offline Queue Testing', 'Security Penetration Audit']
  },
  {
    name: 'Carlos Diaz',
    email: 'carlos.diaz@demo.com',
    role: 'EMPLOYEE' as const,
    department: 'DevOps & Cloud',
    shift: '09:00 - 18:00',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80',
    tasks: ['CI/CD Pipeline Optimization', 'Nginx Rate Limiting Rules', 'Database Backup Automation']
  }
];

export async function seedPortfolioData() {
  console.log('====================================================');
  console.log('🚀 SEEDING 15-DAY PORTFOLIO & RECRUITER DEMO DATA...');
  console.log('====================================================');

  const hashedPassword = await bcrypt.hash('demo123', 10);

  // 1. Ensure Super Admin Account
  const adminUsers = [
    { email: 'admin@demo.com', pass: 'demo123', name: 'Portfolio Super Admin' },
    { email: 'monitoradmin@improxgroup.com1234', pass: '#admin0089000#', name: 'Master Super Admin' }
  ];

  for (const a of adminUsers) {
    const adminHashed = await bcrypt.hash(a.pass, 10);
    const existing = await prisma.user.findUnique({ where: { email: a.email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          name: a.name,
          email: a.email,
          password: adminHashed,
          role: 'ADMIN',
          department: 'Executive Management',
          shift: 'Flexible',
          status: 'ONLINE',
          isActive: true
        }
      });
      console.log(`✅ Admin Account Initialized: ${a.email} (${a.pass})`);
    }
  }

  // Ensure Global System Settings
  await prisma.systemSetting.upsert({
    where: { id: 'global' },
    update: { companyName: 'Improx Pro Enterprise' },
    create: {
      id: 'global',
      screenshotInterval: 10,
      idleThreshold: 5,
      retentionDays: 30,
      companyName: 'Improx Pro Enterprise'
    }
  });

  // 2. Upsert 5 Employees
  const createdEmployees: any[] = [];
  for (const emp of EMPLOYEES) {
    let user = await prisma.user.findUnique({ where: { email: emp.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: emp.name,
          email: emp.email,
          password: hashedPassword,
          role: emp.role,
          department: emp.department,
          shift: emp.shift,
          avatar: emp.avatar,
          status: 'ONLINE',
          currentApp: 'Visual Studio Code',
          currentTitle: `${emp.tasks[0]} — Active Workspace`,
          currentTask: emp.tasks[0],
          lastActiveAt: new Date(),
          isActive: true
        }
      });
      console.log(`👤 Created Demo Employee: ${emp.name} (${emp.email})`);
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          status: 'ONLINE',
          currentApp: 'Visual Studio Code',
          currentTitle: `${emp.tasks[0]} — Active Workspace`,
          currentTask: emp.tasks[0],
          lastActiveAt: new Date()
        }
      });
    }
    createdEmployees.push({ ...user, tasks: emp.tasks });
  }

  // 3. Generate 15 Days of Historical Data (including today)
  const today = new Date();
  const daysToGenerate = 15;

  console.log(`📅 Generating historical data for past ${daysToGenerate} days...`);

  for (let d = daysToGenerate - 1; d >= 0; d--) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - d);
    const dateStr = targetDate.toISOString().split('T')[0];
    const isToday = d === 0;

    for (const emp of createdEmployees) {
      // Check if attendance already exists for this date
      const existingAtt = await prisma.attendance.findUnique({
        where: {
          userId_date: {
            userId: emp.id,
            date: dateStr
          }
        }
      });

      // Shift: 9 hours total (09:15 AM to 06:15 PM)
      const clockIn = new Date(targetDate);
      clockIn.setHours(9, 15, 0, 0);

      const clockOut = new Date(targetDate);
      clockOut.setHours(18, 15, 0, 0);

      // Active ~7 hours (25,200s), Idle/Lunch ~1 hour (3,600s), Pause ~30 min (1,800s)
      const activeSeconds = Math.floor(24000 + Math.random() * 2000);
      const idleSeconds = Math.floor(3200 + Math.random() * 800);
      const pauseSeconds = Math.floor(1200 + Math.random() * 600);
      const totalWorkSeconds = activeSeconds + idleSeconds + pauseSeconds;

      if (!existingAtt) {
        await prisma.attendance.create({
          data: {
            userId: emp.id,
            date: dateStr,
            clockInAt: clockIn,
            clockOutAt: isToday ? null : clockOut,
            totalActiveSeconds: activeSeconds,
            totalIdleSeconds: idleSeconds,
            manualPauseSeconds: pauseSeconds,
            totalWorkSeconds: totalWorkSeconds,
            status: 'PRESENT',
            pauseReason: null
          }
        });
      }

      // Check existing screenshots for this day
      const existingShots = await prisma.screenshot.count({
        where: {
          userId: emp.id,
          takenAt: {
            gte: new Date(`${dateStr}T00:00:00.000Z`),
            lte: new Date(`${dateStr}T23:59:59.999Z`)
          }
        }
      });

      // Generate 6 to 10 realistic screenshots per day if none exist
      if (existingShots === 0) {
        const shotHours = [9, 10, 11, 12, 14, 15, 16, 17]; // skips 1 PM (lunch)
        const shotRecords: any[] = [];
        const activityRecords: any[] = [];

        for (let i = 0; i < shotHours.length; i++) {
          const hour = shotHours[i];
          const shotTime = new Date(targetDate);
          shotTime.setHours(hour, Math.floor(10 + Math.random() * 40), 0, 0);

          if (isToday && shotTime > today) continue; // Don't generate future today times

          const template = DEMO_SCREENSHOTS[(i + emp.name.length) % DEMO_SCREENSHOTS.length];
          const task = emp.tasks[i % emp.tasks.length];

          // Screenshot record
          shotRecords.push({
            userId: emp.id,
            filePath: template.url,
            fileSize: 185420 + Math.floor(Math.random() * 45000),
            displayIndex: 0,
            appName: template.appName,
            windowTitle: template.windowTitle,
            taskName: task,
            isIdle: false,
            takenAt: shotTime
          });

          // Corresponding Activity Logs
          activityRecords.push({
            userId: emp.id,
            appName: template.appName,
            processName: template.processName,
            windowTitle: template.windowTitle,
            category: template.category,
            taskName: task,
            durationSeconds: 300,
            mouseClicks: Math.floor(25 + Math.random() * 45),
            keystrokes: Math.floor(60 + Math.random() * 120),
            isIdle: false,
            recordedAt: shotTime
          });
        }

        // Add 1 Lunch break activity log (1:15 PM)
        const lunchTime = new Date(targetDate);
        lunchTime.setHours(13, 15, 0, 0);
        if (!isToday || lunchTime < today) {
          activityRecords.push({
            userId: emp.id,
            appName: 'Lunch Break / Idle',
            processName: 'System Idle',
            windowTitle: 'Away from Keyboard',
            category: 'IDLE' as const,
            taskName: 'Lunch Break',
            durationSeconds: 3600,
            mouseClicks: 0,
            keystrokes: 0,
            isIdle: true,
            recordedAt: lunchTime
          });
        }

        if (shotRecords.length > 0) {
          await prisma.screenshot.createMany({ data: shotRecords });
        }
        if (activityRecords.length > 0) {
          await prisma.activityLog.createMany({ data: activityRecords });
        }
      }
    }
  }

  console.log('====================================================');
  console.log('🎉 15-DAY PORTFOLIO SEEDING COMPLETE!');
  console.log('👉 Super Admin Login: admin@demo.com / demo123');
  console.log('👉 5 Demo Employees with 15 Days of Shifts & Screenshots Ready!');
  console.log('====================================================');
}

if (require.main === module) {
  seedPortfolioData()
    .catch((err) => {
      console.error('❌ Seeding error:', err);
    })
    .finally(() => prisma.$disconnect());
}
