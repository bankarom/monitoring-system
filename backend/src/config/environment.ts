import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/improx_monitor?schema=public',
  jwtSecret: process.env.JWT_SECRET || 'improx_super_secure_jwt_secret_key_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
  uploadDir: process.env.UPLOAD_DIR || path.resolve(__dirname, '../../uploads'),
  corsOrigin: process.env.CORS_ORIGIN || '*'
};
