-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create spatial index on route_points
-- (Will be done via Prisma after schema setup)

-- Initialize spatial tables
-- All spatial tables will be created by Prisma migrations
