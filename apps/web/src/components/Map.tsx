import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useRideStore } from '../stores/ride.store';
import { useRuntimeStore, useShouldShowMap } from '../stores/runtime.store';
import type { RoutePoint } from '../../../../packages/types/src';

/**
 * Map System Architecture
 *
 * Realtime Map Integration:
 * - Leaflet/OpenStreetMap backend
 * - Live user position marker with heading
 * - Live route polyline rendering with optimization
 * - Camera-follow behavior (placeholder for future animations)
 * - Performance optimizations for long routes
 * - Runtime mode aware (responsive to GPS_ONLY, MAP_FOCUS, CAMERA_RECORD modes)
 *
 * Rendering Strategy:
 * - Polyline: Rendered from route array in store
 * - Marker: Rendered from latest GPS position
 * - Route optimization: Use point sampling for very long routes
 * - Memoization: Prevent unnecessary re-renders of polyline
 * - Runtime Mode: Adjusts rendering based on current mode profile
 *
 * Performance Considerations:
 * - Large route arrays (1000+ points) need simplification
 * - Future: Web Worker for route simplification (Douglas-Peucker)
 * - Marker updates are frequent - keep lightweight
 * - GPU-aware rendering for mobile
 * - Runtime mode can reduce sampling for CPU efficiency
 */

/**
 * Sample route points to optimize rendering for very long routes
 * Max points determined by runtime mode profile for adaptive performance
 */
function sampleRoutePoints(points: RoutePoint[], maxPoints: number = 500): RoutePoint[] {
  if (points.length <= maxPoints) return points;

  const step = Math.ceil(points.length / maxPoints);
  const sampled: RoutePoint[] = [];

  for (let i = 0; i < points.length; i += step) {
    sampled.push(points[i]);
  }

  // Always include last point
  if (sampled[sampled.length - 1] !== points[points.length - 1]) {
    sampled.push(points[points.length - 1]);
  }

  return sampled;
}

// Default starting position (São Paulo, Brazil) - can be customized
const DEFAULT_CENTER: [number, number] = [-23.5505, -46.6333];
const DEFAULT_ZOOM = 15;

/**
 * Create a custom marker icon that respects heading/direction
 */
function createPositionMarker(heading?: number | null) {
  const rotationAngle = heading ?? 0;

  const markerHtml = `
    <div style="
      transform: rotate(${rotationAngle}deg);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #2563eb;
    ">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Circle base -->
        <circle cx="16" cy="16" r="14" fill="#2563eb" stroke="white" stroke-width="2"/>
        <!-- Direction pointer (triangle) -->
        <polygon points="16,6 20,14 12,14" fill="white"/>
        <!-- Speed indicator ring (placeholder) -->
        <circle cx="16" cy="16" r="10" fill="none" stroke="#93c5fd" stroke-width="1" opacity="0.6"/>
      </svg>
    </div>
  `;

  return L.divIcon({
    html: markerHtml,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
    className: 'position-marker'
  });
}

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
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  // Runtime mode aware - get route sampling from profile
  const profile = useRuntimeStore((state) => state.getRenderingProfile());
  const shouldShowMap = useShouldShowMap();

  // Selectors: only subscribe to necessary data
  const latestPosition = useRideStore((state) => {
    const route = state.active?.route;
    return route && route.length > 0 ? route[route.length - 1] : null;
  });

  const routePoints = useRideStore((state) => state.active?.route ?? []);

  // Memoize route array conversion to prevent unnecessary polyline updates
  const polylineLatLngs = useMemo(() => {
    // Use route sampling from runtime profile (adaptive performance)
    const maxPoints = profile.performance.routeSampling;
    const sampled = sampleRoutePoints(routePoints, maxPoints);
    return sampled.map((p) => [p.latitude, p.longitude] as [number, number]);
  }, [routePoints, profile.performance.routeSampling]);

  // Memoize center position for map pan
  const mapCenter = useMemo(() => {
    if (latestPosition) {
      return [latestPosition.latitude, latestPosition.longitude] as [number, number];
    }
    return DEFAULT_CENTER;
  }, [latestPosition]);

  // Update marker on position change
  useEffect(() => {
    if (!mapRef.current || !latestPosition) return;

    const position: [number, number] = [latestPosition.latitude, latestPosition.longitude];

    if (!markerRef.current) {
      markerRef.current = L.marker(position, {
        icon: createPositionMarker(latestPosition.heading)
      }).addTo(mapRef.current);

      markerRef.current.bindPopup(
        `Speed: ${(latestPosition.speed ?? 0).toFixed(1)} km/h<br/>
         Altitude: ${(latestPosition.altitude ?? 0).toFixed(0)}m`
      );
    } else {
      markerRef.current.setLatLng(position);
      // Update marker icon with new heading
      markerRef.current.setIcon(createPositionMarker(latestPosition.heading));
    }

    // Camera follow behavior (placeholder - no animation yet)
    if (enableCameraFollow) {
      mapRef.current.panTo(position, { animate: false, duration: 0 });
    }
  }, [latestPosition, enableCameraFollow]);

  // Update polyline on route change
  useEffect(() => {
    if (!mapRef.current) return;

    if (polylineLatLngs.length === 0) {
      if (polylineRef.current) {
        mapRef.current.removeLayer(polylineRef.current);
        polylineRef.current = null;
      }
      return;
    }

    if (!polylineRef.current) {
      polylineRef.current = L.polyline(polylineLatLngs, {
        color: '#3b82f6',
        weight: 3,
        opacity: 0.8,
        dashArray: '4, 4',
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(mapRef.current);
    } else {
      // Update existing polyline
      polylineRef.current.setLatLngs(polylineLatLngs);
    }
  }, [polylineLatLngs]);

  // Fit bounds to show entire route (initial)
  useEffect(() => {
    if (!mapRef.current || polylineLatLngs.length < 2) return;

    const bounds = L.latLngBounds(polylineLatLngs);
    mapRef.current.fitBounds(bounds, { padding: [50, 50], animate: false });
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full z-0">
      {!shouldShowMap ? (
        // Map hidden by runtime mode - show placeholder
        <div className="w-full h-full bg-gray-900 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="text-sm font-mono">Map disabled in {profile.mode} mode</div>
          </div>
        </div>
      ) : (
        // Map visible - render Leaflet
        <MapContainer
          center={mapCenter}
          zoom={DEFAULT_ZOOM}
          style={{ width: '100%', height: '100%' }}
          ref={mapRef}
          zoomControl={true}
          attributionControl={true}
        >
        {/* OpenStreetMap tiles */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />

        {/* Live route polyline (rendered separately via ref updates) */}
        {polylineLatLngs.length > 1 && (
          <Polyline
            positions={polylineLatLngs}
            pathOptions={{
              color: '#3b82f6',
              weight: 3,
              opacity: 0.8,
              dashArray: '4, 4',
              lineCap: 'round',
              lineJoin: 'round'
            }}
            ref={polylineRef}
          />
        )}

        {/* Live position marker (rendered separately via ref updates) */}
        {latestPosition && (
          <Marker
            position={[latestPosition.latitude, latestPosition.longitude]}
            icon={createPositionMarker(latestPosition.heading)}
            ref={markerRef}
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

      {/* Future camera overlay placeholder */}
      <div
        className="absolute inset-0 pointer-events-none"
        data-component="camera-overlay-future"
        title="Placeholder for future AR/navigation overlay"
      />
    </div>
  );
};

export default Map;
