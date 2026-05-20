export type GPSPosition = {
  latitude: number;
  longitude: number;
  speed?: number | null;
  altitude?: number | null;
  heading?: number | null;
  timestamp: string;
};
