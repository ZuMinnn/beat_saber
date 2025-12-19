import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface EnvironmentConfig {
  NODE_ENV: string;
  PORT: number;
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  CORS_ORIGIN: string;
  MAX_FILE_SIZE: number;
  UPLOAD_DESTINATION: string;
}

const getEnvironment = (): EnvironmentConfig => {
  const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'CORS_ORIGIN'
  ];

  // Check for missing environment variables
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingEnvVars.join(', ')}\n` +
      'Please create a .env file based on .env.example'
    );
  }

  // Validate JWT_SECRET strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('WARNING: JWT_SECRET is too short. Use at least 32 characters for production.');
  }

  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '5000', 10),
    MONGODB_URI: process.env.MONGODB_URI!,
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    CORS_ORIGIN: process.env.CORS_ORIGIN!,
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '20971520', 10), // 20MB
    UPLOAD_DESTINATION: process.env.UPLOAD_DESTINATION || './uploads'
  };
};

export const env = getEnvironment();
