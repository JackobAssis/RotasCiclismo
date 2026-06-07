export function startWatch(
  onSuccess: (position: GeolocationPosition) => void,
  onError: (error: GeolocationPositionError) => void,
  options?: PositionOptions
): number {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('Geolocation not available');
  }

  const id = navigator.geolocation.watchPosition(onSuccess, onError, {
    enableHighAccuracy: options?.enableHighAccuracy ?? true,
    maximumAge: options?.maximumAge ?? 0,
    timeout: options?.timeout ?? 10000,
  });

  return id;
}

export function stopWatch(id: number): void {
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    navigator.geolocation.clearWatch(id);
  }
}
