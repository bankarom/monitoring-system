import jwt from 'jsonwebtoken';
import { config } from '../config/environment';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as any
  });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
}
