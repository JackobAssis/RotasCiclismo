process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.PORT = process.env.PORT ?? '3000';
process.env.LOG_LEVEL = process.env.LOG_LEVEL ?? 'warn';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://cyclist:password@localhost:5432/cycling_routes';
process.env.JWT_SECRET =
  process.env.JWT_SECRET ?? 'test-jwt-secret-0123456789abcdef0123456789abcdef';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret-0123456789abcdef0123456789abcdef';
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? '30d';
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
process.env.STORAGE_TYPE = process.env.STORAGE_TYPE ?? 'local';
process.env.UPLOAD_DIR = process.env.UPLOAD_DIR ?? './uploads';
