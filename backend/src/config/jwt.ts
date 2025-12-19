import { env } from './environment';

export const jwtConfig = {
  secret: env.JWT_SECRET,
  expiresIn: env.JWT_EXPIRES_IN,
  algorithm: 'HS256' as const,
  issuer: 'beat-saber-api',
};
