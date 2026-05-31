/**
 * Environment Configuration
 *
 * Central configuration management for the backend.
 * All environment variables are validated here.
 */

export interface AppConfig {
  node_env: string;
  port: number;
  log_level: string;
  database_url: string;
  jwt_secret: string;
  jwt_expires_in: string;
  jwt_refresh_secret: string;
  jwt_refresh_expires_in: string;
  cors_origin: string;
  storage_type: 'local' | 's3' | 'azure';
  upload_dir: string;
  redis_url?: string;
}

export function loadConfig(): AppConfig {
  return {
    node_env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    log_level: process.env.LOG_LEVEL || 'debug',
    database_url: process.env.DATABASE_URL || '',
    jwt_secret: process.env.JWT_SECRET || 'dev-secret-change-in-prod',
    jwt_expires_in: process.env.JWT_EXPIRES_IN || '7d',
    jwt_refresh_secret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-prod',
    jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    cors_origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    storage_type: (process.env.STORAGE_TYPE as any) || 'local',
    upload_dir: process.env.UPLOAD_DIR || './uploads',
    redis_url: process.env.REDIS_URL,
  };
}
