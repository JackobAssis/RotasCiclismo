import React, { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import { useRideStore } from '../stores/ride.store';
import { useRenderingProfile, useShouldShowMap } from '../stores/runtime.store';
import { sampleRoutePoints, routePointsToLatLngs } from '../utils/geo';
import { createPositionMarker, DEFAULT_CENTER, DEFAULT_ZOOM, POLYLINE_OPTIONS } from '../utils/map';

interface MapProps {
  enableCameraFollow?: boolean;
}

/**
 * Realtime Map Component
 *
 * Responsibilities:
 * - Display OpenStreetMap via Leaflet
 * - Render live route polyline from store
 * - Render live user position marker with heading
 * - Coordinate with HUD (position updates trigger widget updates)
 * - Manage map state isolation (route rendering separate from HUD)
 * - Adapt rendering based on runtime mode
 *
 * Runtime Mode Integration:
 * - Uses route sampling from runtime profile
 * - Respects visibility settings from runtime mode
 * - Scales based on rendering profile
 *
 * Selector Strategy:
 * - Subscribed to: route array, latest position, runtime mode
 * - Memo boundaries: polyline points, marker position
 * - Avoids: HUD widget re-renders (map is isolated layer)
 */
export const Map: React.FC<MapProps> = ({ enableCameraFollow = false }) => {
  const mapRef = useRef<LeafletMap | null>(null);

  // Runtime mode aware - get route sampling from profile
  const profile = useRenderingProfile();
  const shouldShowMap = useShouldShowMap();

  // Selectors: only subscribe to necessary data
  const latestPosition = useRideStore((state) => {
    const route = state.active?.route;
    return route && route.length > 0 ? route[route.length - 1] : null;
  });

  const routePoints = useRideStore((state) => state.active?.route ?? []);

  // Memoize route array conversion to prevent unnecessary polyline updates
  const polylineLatLngs = useMemo(() => {
    const maxPoints = profile.performance.routeSampling;
    return routePointsToLatLngs(sampleRoutePoints(routePoints, maxPoints));
  }, [routePoints, profile.performance.routeSampling]);

  // Memoize marker icon to avoid recreating on each render
  const markerIcon = useMemo(
    () => createPositionMarker(latestPosition?.heading),
    [latestPosition?.heading],
  );

  // Pan-to-follow behavior only (marker position is declarative via JSX)
  useEffect(() => {
    if (!mapRef.current || !latestPosition || !enableCameraFollow) return;
    mapRef.current.panTo([latestPosition.latitude, latestPosition.longitude], {
      animate: false,
      duration: 0,
    });
  }, [latestPosition, enableCameraFollow]);

  // Fit bounds once when route points become available
  const fittedRef = useRef(false);
  useEffect(() => {
    if (fittedRef.current || !mapRef.current || polylineLatLngs.length < 2) return;
    fittedRef.current = true;
    mapRef.current.fitBounds(polylineLatLngs as [[number, number], [number, number]], {
      padding: [50, 50],
      animate: false,
    });
  }, [polylineLatLngs]);

  // Initial center (computed once)
  const initialCenter = useMemo(
    () => (polylineLatLngs.length >= 2 ? polylineLatLngs[0] : DEFAULT_CENTER),
    [],
  );

  return (
    <div className="absolute inset-0 w-full h-full z-0">
      {!shouldShowMap ? (
        <div className="w-full h-full bg-gray-900 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="text-sm font-mono">Map disabled in {profile.mode} mode</div>
          </div>
        </div>
      ) : (
        <MapContainer
          center={initialCenter}
          zoom={DEFAULT_ZOOM}
          style={{ width: '100%', height: '100%' }}
          ref={mapRef}
          zoomControl={true}
          attributionControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            maxZoom={19}
          />

          {polylineLatLngs.length > 1 && (
            <Polyline positions={polylineLatLngs} pathOptions={POLYLINE_OPTIONS} />
          )}

          {latestPosition && (
            <Marker
              position={[latestPosition.latitude, latestPosition.longitude]}
              icon={markerIcon}
            >
              <Popup>
                <div className="text-sm">
                  <p>Speed: {(latestPosition.speed ?? 0).toFixed(1)} km/h</p>
                  <p>Altitude: {(latestPosition.altitude ?? 0).toFixed(0)}m</p>
                  <p>Heading: {(latestPosition.heading ?? 0).toFixed(0)}°</p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      )}

      <div
        className="absolute inset-0 pointer-events-none"
        data-component="camera-overlay-future"
        title="Placeholder for future AR/navigation overlay"
      />
    </div>
  );
};

export default Map;
