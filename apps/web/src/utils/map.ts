import L from 'leaflet';

export const DEFAULT_CENTER: [number, number] = [-23.5505, -46.6333];
export const DEFAULT_ZOOM = 15;

export const POLYLINE_OPTIONS: L.PolylineOptions = {
  color: '#3b82f6',
  weight: 3,
  opacity: 0.8,
  dashArray: '4, 4',
  lineCap: 'round',
  lineJoin: 'round',
};

export function createPositionMarker(heading?: number | null): L.DivIcon {
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
        <circle cx="16" cy="16" r="14" fill="#2563eb" stroke="white" stroke-width="2"/>
        <polygon points="16,6 20,14 12,14" fill="white"/>
        <circle cx="16" cy="16" r="10" fill="none" stroke="#93c5fd" stroke-width="1" opacity="0.6"/>
      </svg>
    </div>`;
  return L.divIcon({
    html: markerHtml,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
    className: 'position-marker',
  });
}
