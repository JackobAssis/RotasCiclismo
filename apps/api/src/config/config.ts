/**
 * Environment Configuration
 *
 * Central configuration management for the backend.
 * All environment variables are validated via Zod schema.
 */

import { z } from 'zod';

const configSchema = z.object({
  node_env: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  port: z.coerce.number().int().positive().max(65535).default(3000),
  log_level: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  database_url: z.string().url('DATABASE_URL must be a valid connection string'),
  jwt_secret: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  jwt_expires_in: z.string().default('7d'),
  jwt_refresh_secret: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  jwt_refresh_expires_in: z.string().default('30d'),
  cors_origin: z.string().default('https://rotasciclismo.pages.dev,http://localhost:5173'),
  storage_type: z.enum(['local', 's3', 'azure']).default('local'),
  upload_dir: z.string().default('./uploads'),
  redis_url: z.string().optional(),
});

export type AppConfig = z.infer<typeof configSchema>;

export function loadConfig(): AppConfig {
  const result = configSchema.safeParse({
    node_env: process.env.NODE_ENV,
    port: process.env.PORT,
    log_level: process.env.LOG_LEVEL,
    database_url: process.env.DATABASE_URL,
    jwt_secret: process.env.JWT_SECRET,
    jwt_expires_in: process.env.JWT_EXPIRES_IN,
    jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
    jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
    cors_origin: process.env.CORS_ORIGIN,
    storage_type: process.env.STORAGE_TYPE,
    upload_dir: process.env.UPLOAD_DIR,
    redis_url: process.env.REDIS_URL,
  });

  if (!result.success) {
    console.error('❌ Invalid environment configuration:');
    for (const issue of result.error.issues) {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }

  return result.data;
}
