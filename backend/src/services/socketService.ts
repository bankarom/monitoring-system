import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../config/prisma';

export interface LiveEmployeeState {
  userId: string;
  name: string;
  status: 'ONLINE' | 'IDLE' | 'OFFLINE';
  currentApp?: string;
  currentTitle?: string;
  currentDomain?: string;
  clicksPerMinute?: number;
  keysPerMinute?: number;
  lastActiveAt: Date;
  latestScreenshotUrl?: string;
}

class SocketService {
  private io: SocketIOServer | null = null;
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  public initialize(server: HTTPServer, corsOrigin: string) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
        if (!token) {
          return next(new Error('Authentication token missing'));
        }
        const decoded = verifyToken(token);
        (socket as any).user = decoded;
        next();
      } catch (err) {
        next(new Error('Invalid socket authentication'));
      }
    });

    this.io.on('connection', (socket: Socket) => {
      const user = (socket as any).user;
      if (!user) return;

      const userId = user.userId;

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(socket.id);

      if (user.role === 'ADMIN' || user.role === 'MANAGER') {
        socket.join('room:admin');
      } else {
        socket.join(`room:user:${userId}`);
        this.broadcastUserPresence(userId, 'ONLINE');
      }

      socket.on('disconnect', async () => {
        const sockets = this.userSockets.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            this.userSockets.delete(userId);
            if (user.role === 'EMPLOYEE') {
              await prisma.user.update({
                where: { id: userId },
                data: { status: 'OFFLINE' }
              }).catch(() => {});

              this.broadcastUserPresence(userId, 'OFFLINE');
            }
          }
        }
      });
    });
  }

  public broadcastUserPresence(userId: string, status: 'ONLINE' | 'IDLE' | 'OFFLINE', extraData?: Partial<LiveEmployeeState>) {
    if (!this.io) return;
    this.io.to('room:admin').emit('employee:presence', {
      userId,
      status,
      timestamp: new Date().toISOString(),
      ...extraData
    });
  }

  public broadcastLiveActivity(userId: string, activityData: any) {
    if (!this.io) return;
    this.io.to('room:admin').emit('employee:activity', {
      userId,
      ...activityData,
      timestamp: new Date().toISOString()
    });
  }

  public broadcastScreenshotNotification(userId: string, screenshotData: any) {
    if (!this.io) return;
    this.io.to('room:admin').emit('employee:screenshot', {
      userId,
      ...screenshotData,
      timestamp: new Date().toISOString()
    });
  }

  public emitToUser(userId: string, event: string, data: any) {
    if (!this.io) return;
    this.io.to(`room:user:${userId}`).emit(event, data);
  }
}

export const socketService = new SocketService();