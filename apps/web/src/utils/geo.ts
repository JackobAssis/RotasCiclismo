import type { RoutePoint } from '../../../../packages/types/src';

export function sampleRoutePoints(points: RoutePoint[], maxPoints: number = 500): RoutePoint[] {
  if (points.length <= maxPoints) return points;
  const step = Math.ceil(points.length / maxPoints);
  const sampled: RoutePoint[] = [];
  for (let i = 0; i < points.length; i += step) {
    sampled.push(points[i]);
  }
  if (sampled[sampled.length - 1] !== points[points.length - 1]) {
    sampled.push(points[points.length - 1]);
  }
  return sampled;
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function routePointsToLatLngs(points: RoutePoint[]): [number, number][] {
  return points.map((p) => [p.latitude, p.longitude] as [number, number]);
}
