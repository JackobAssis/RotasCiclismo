import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export interface WeeklyData {
  weekStart: string;
  distance: number;
  duration: number;
  rides: number;
  averageSpeed: number;
}

export interface MonthlyData {
  month: string;
  distance: number;
  duration: number;
  rides: number;
  averageSpeed: number;
}

export interface AnalyticsResponseDto {
  totalRides: number;
  totalDistance: number;
  totalDuration: number;
  averageSpeed: number;
  maxSpeed: number;
  averageDistance: number;
  weekly: WeeklyData[];
  monthly: MonthlyData[];
}

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaClient) {}

  async getAnalytics(userId: string): Promise<AnalyticsResponseDto> {
    const rides = await this.prisma.ride.findMany({
      where: { userId, status: 'FINISHED' },
      orderBy: { startedAt: 'asc' },
    });

    if (rides.length === 0) {
      return {
        totalRides: 0,
        totalDistance: 0,
        totalDuration: 0,
        averageSpeed: 0,
        maxSpeed: 0,
        averageDistance: 0,
        weekly: [],
        monthly: [],
      };
    }

    const totalRides = rides.length;
    const totalDistance = rides.reduce((s, r) => s + r.distance, 0);
    const totalDuration = rides.reduce((s, r) => s + r.duration, 0);
    const maxSpeed = Math.max(...rides.map((r) => r.maxSpeed));
    const avgSpeed =
      totalRides > 0
        ? rides.reduce((s, r) => s + r.averageSpeed, 0) / totalRides
        : 0;
    const averageDistance = totalDistance / totalRides;

    const weekly = this.groupByWeek(rides);
    const monthly = this.groupByMonth(rides);

    return {
      totalRides,
      totalDistance,
      totalDuration,
      averageSpeed: Math.round(avgSpeed * 100) / 100,
      maxSpeed,
      averageDistance: Math.round(averageDistance * 100) / 100,
      weekly,
      monthly,
    };
  }

  private groupByWeek(rides: any[]): WeeklyData[] {
    const groups = new Map<string, { distance: number; duration: number; rides: number; speeds: number[] }>();

    for (const ride of rides) {
      const d = new Date(ride.startedAt);
      const startOfWeek = this.getStartOfWeek(d);
      const key = startOfWeek.toISOString().split('T')[0];
      const existing = groups.get(key) || { distance: 0, duration: 0, rides: 0, speeds: [] };
      existing.distance += ride.distance;
      existing.duration += ride.duration;
      existing.rides += 1;
      existing.speeds.push(ride.averageSpeed);
      groups.set(key, existing);
    }

    return Array.from(groups.entries())
      .map(([weekStart, g]) => ({
        weekStart,
        distance: Math.round(g.distance * 100) / 100,
        duration: g.duration,
        rides: g.rides,
        averageSpeed:
          g.speeds.length > 0
            ? Math.round(
                (g.speeds.reduce((a, b) => a + b, 0) / g.speeds.length) * 100,
              ) / 100
            : 0,
      }))
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  }

  private groupByMonth(rides: any[]): MonthlyData[] {
    const groups = new Map<string, { distance: number; duration: number; rides: number; speeds: number[] }>();

    for (const ride of rides) {
      const d = new Date(ride.startedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const existing = groups.get(key) || { distance: 0, duration: 0, rides: 0, speeds: [] };
      existing.distance += ride.distance;
      existing.duration += ride.duration;
      existing.rides += 1;
      existing.speeds.push(ride.averageSpeed);
      groups.set(key, existing);
    }

    return Array.from(groups.entries())
      .map(([month, g]) => ({
        month,
        distance: Math.round(g.distance * 100) / 100,
        duration: g.duration,
        rides: g.rides,
        averageSpeed:
          g.speeds.length > 0
            ? Math.round(
                (g.speeds.reduce((a, b) => a + b, 0) / g.speeds.length) * 100,
              ) / 100
            : 0,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}
