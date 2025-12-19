import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';
import { JwtPayload } from '../types';

export const generateToken = (userId: string, email: string): string => {
  const payload: JwtPayload = {
    userId,
    email
  };

  const token = jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn as jwt.SignOptions['expiresIn'],
    issuer: jwtConfig.issuer
  });

  return token;
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.verify(token, jwtConfig.secret, {
      issuer: jwtConfig.issuer,
      algorithms: [jwtConfig.algorithm]
    }) as JwtPayload;

    return decoded;
  } catch (error) {
    return null;
  }
};
