import React, { useMemo, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';
import { useRideStore } from '../stores/ride.store';
import { useRenderingProfile, useRuntimeStore } from '../stores/runtime.store';
import { RuntimeMode } from '../modules/runtime/types';
import useMinimapStore from '../stores/minimap.store';
import { sampleRoutePoints, routePointsToLatLngs } from '../utils/geo';
import { DEFAULT_CENTER } from '../utils/map';

/**
 * MapInner: small helper to invalidate map size when expanded changes
 */
const MapInner: React.FC<{ center: [number, number]; zoom: number; expanded: boolean }> = ({ center, zoom, expanded }) => {
  const map = useMap();

  useEffect(() => {
    // When container size changes, ensure map redraws tiles and recenters
    setTimeout(() => {
      try {
        map.invalidateSize();
        map.setView(center, zoom, { animate: false });
      } catch (e) {
        // ignore
      }
    }, 120);
  }, [expanded, center, zoom, map]);

  return null;
};

/**
 * MinimapOverlay: small floating map used during CAMERA_RECORD mode
 * - Isolated from main Map instance
 * - Read-only: no interactive controls
 * - Lightweight: reduced sampling, minimal tile updates
 * - Tap to expand/collapse; uses `useMinimapStore` for state so other UI can observe
 */
const MinimapOverlay: React.FC = () => {
  const profile = useRenderingProfile();
  const currentMode = useRuntimeStore((s) => s.currentMode);
  const isCameraMode = currentMode === RuntimeMode.CAMERA_RECORD;

  const route = useRideStore((s) => s.active?.route ?? []);
  const latest = useRideStore((s) => {
    const r = s.active?.route;
    return r && r.length > 0 ? r[r.length - 1] : null;
  });

  const expanded = useMinimapStore((s) => s.expanded);
  const setExpanded = useMinimapStore((s) => s.setExpanded);
  const toggleExpanded = useMinimapStore((s) => s.toggleExpanded);

  // Determine size from profile.minimap.scale; force small in camera mode
  const { sizeClass, expandedClass, mapZoom, maxPoints } = useMemo(() => {
    const scale = isCameraMode ? 'small' : profile.minimap.scale;
    if (scale === 'large') return { sizeClass: 'w-44 h-32', expandedClass: 'w-80 h-64', mapZoom: 14, maxPoints: 90 };
    if (scale === 'medium') return { sizeClass: 'w-36 h-28', expandedClass: 'w-72 h-56', mapZoom: 14, maxPoints: 70 };
    return { sizeClass: 'w-28 h-20', expandedClass: 'w-64 h-48', mapZoom: 13, maxPoints: 50 };
  }, [profile.minimap.scale, isCameraMode]);

  const polyline = useMemo(() => routePointsToLatLngs(sampleRoutePoints(route, maxPoints)), [route, maxPoints]);

  const center: [number, number] = latest ? [latest.latitude, latest.longitude] : DEFAULT_CENTER;

  // Position classes based on profile.minimap.position; override in camera mode to avoid button collision
  const posClass = (() => {
    if (isCameraMode) return 'top-4 right-4';
    const pos = profile.minimap.position;
    switch (pos) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
      default:
        return 'bottom-4 right-4';
    }
  })();

  // Auto-collapse after timeout when expanded (placeholder behavior)
  const autoCollapseTimeoutRef = useRef<number | null>(null as any);

  useEffect(() => {
    if (expanded) {
      // auto-collapse after 8 seconds as placeholder
      if (autoCollapseTimeoutRef.current) window.clearTimeout(autoCollapseTimeoutRef.current);
      autoCollapseTimeoutRef.current = window.setTimeout(() => setExpanded(false), 8000);
    } else {
      if (autoCollapseTimeoutRef.current) {
        window.clearTimeout(autoCollapseTimeoutRef.current);
        autoCollapseTimeoutRef.current = null;
      }
    }

    return () => {
      if (autoCollapseTimeoutRef.current) {
        window.clearTimeout(autoCollapseTimeoutRef.current);
        autoCollapseTimeoutRef.current = null;
      }
    };
  }, [expanded, setExpanded]);

  // Handle tap to expand/collapse; ensure quick toggle and minimal re-renders
  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleExpanded();
  }, [toggleExpanded]);

  return (
    <div
      className={`absolute ${posClass} ${expanded ? expandedClass : sizeClass} z-[150] pointer-events-auto p-1 transition-all duration-300 ease-out`}
      style={{ touchAction: 'manipulation' }}
      onClick={handleToggle}
      role="button"
      aria-label={expanded ? 'Collapse minimap' : 'Expand minimap'}
    >
      <div className={`w-full h-full rounded-lg overflow-hidden ${isCameraMode ? 'bg-black/20' : 'bg-black/30'} backdrop-blur border border-white/10 shadow-lg ${expanded ? 'ring-2 ring-cyan-400/30' : ''}`}>
        <div className="relative w-full h-full">
          <MapContainer
            center={center}
            zoom={mapZoom}
            zoomControl={false}
            attributionControl={false}
            dragging={false}
            doubleClickZoom={false}
            scrollWheelZoom={false}
            style={{ width: '100%', height: '100%' }}
          >
            <MapInner center={center} zoom={mapZoom} expanded={expanded} />

            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {polyline.length > 0 && (
              <Polyline positions={polyline} pathOptions={{ color: '#60a5fa', weight: 2, opacity: 0.9 }} />
            )}

            {latest && (
              <CircleMarker center={[latest.latitude, latest.longitude]} radius={expanded ? 6 : 4} pathOptions={{ color: '#f472b6', fillColor: '#f472b6' }} />
            )}
          </MapContainer>

          {/* Minimap status pill and expand hint */}
          <div className="absolute left-2 top-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-md flex items-center gap-2">
            <span>Minimap</span>
            <span className="text-[9px] text-gray-300">{expanded ? 'Expanded' : 'Live'}</span>
          </div>

          {/* When expanded show a small close hint */}
          {expanded && (
            <div className="absolute right-2 top-2 flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
                className="bg-black/50 text-white px-2 py-1 rounded text-xs"
                aria-label="Close minimap"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MinimapOverlay;
