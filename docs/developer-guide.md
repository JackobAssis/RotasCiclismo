# Realtime Visual Experience - Developer Guide

## Quick Start

### Running the App

```bash
# Install dependencies (if not already done)
pnpm install

# Start development server
pnpm dev

# The app will auto-start a ride with mock GPS updates
```

### What You'll See

1. **Map**: OpenStreetMap with your simulated route and current position
2. **Position Marker**: Blue marker with heading indicator showing direction
3. **Route Line**: Blue dashed line showing your route history
4. **HUD Widgets**:
   - Top-left: GPS Status (accuracy indicator)
   - Top-right: Recording Status (shows GPS+Camera or GPS only)
   - Bottom-left: Speed (km/h)
   - Bottom-center: Distance (km)
   - Bottom-right: Duration (HH:MM:SS)
5. **Controls**: Pause/Resume and Finish buttons

## Key Architecture Components

### Data Flow

```
GPS Update (1Hz) 
  → ride.store.addPoint()
  → Calculate metrics (distance, speed, duration)
  → Update store state
  → Widget selectors triggered
  → Map re-renders (via memoization)
  → Widgets re-render (via selectors)
```

### Selector Usage Examples

**Simple selector (single value):**
```typescript
const speed = useRideStore((state) => 
  state.active?.route?.[state.active.route.length - 1]?.speed ?? 0
);
```

**Selector with multiple values:**
```typescript
const [status, mode] = useRideStore((state) => 
  [state.status, state.active?.mode ?? 'GPS_ONLY']
);
```

**Complex selector (filtered/computed):**
```typescript
const latestPosition = useRideStore((state) => {
  const route = state.active?.route;
  return route && route.length > 0 ? route[route.length - 1] : null;
});
```

## Adding a New Widget

### Step 1: Create the Widget Component

```typescript
// In src/components/HudWidgets.tsx

const MyWidgetComponent: HudWidget = memo(({ label = 'My Widget' }) => {
  // Subscribe to only what you need
  const myData = useRideStore((state) => state.active?.myField ?? defaultValue);
  
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg border border-gray-200">
      <div className="text-xs font-semibold text-gray-600 uppercase">{label}</div>
      <div className="text-2xl font-bold text-blue-600 mt-1">{myData}</div>
      <div className="text-xs text-gray-500">unit</div>
    </div>
  );
});

MyWidgetComponent.displayName = 'MyWidget';
```

### Step 2: Create Container Component

```typescript
export const MyWidget = memo(() => {
  const overlay = useOverlay();
  
  useEffect(() => {
    overlay.registerWidget('my-widget', {
      id: 'my-widget',
      label: 'My Widget',
      position: 'bottom-right',  // or any position
      layer: 'base',              // or 'interactive', 'overlay', 'modal'
      visible: true,
      priority: 8                 // 0-15, higher = renders first
    }, MyWidgetComponent);
    
    return () => overlay.unregisterWidget('my-widget');
  }, [overlay]);
  
  return <MyWidgetComponent label="My Widget" />;
});

MyWidget.displayName = 'MyWidget';
```

### Step 3: Add to Ride Page

```typescript
// In src/pages/Ride.tsx

<OverlayManager>
  {/* ... existing widgets ... */}
  <MyWidget />  {/* Add here */}
</OverlayManager>
```

## Customizing the Map

### Change Starting Position

```typescript
// In src/components/Map.tsx

const DEFAULT_CENTER: [number, number] = [-23.5505, -46.6333];  // São Paulo

// Change to your city:
const DEFAULT_CENTER: [number, number] = [40.7128, -74.0060];  // New York
```

### Change Map Tile Provider

```typescript
// From OpenStreetMap to Satellite view:
<TileLayer
  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
  attribution='&copy; Esri'
/>

// Or Stamen Terrain:
<TileLayer
  url="https://tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png"
  attribution='&copy; OpenStreetMap contributors'
/>
```

### Adjust Zoom Level

```typescript
// In src/components/Map.tsx
const DEFAULT_ZOOM = 15;  // 1-19, higher = zoomed in
```

## Replacing Mock GPS with Real GPS

### Step 1: Implement Real GPS Service

```typescript
// In src/services/gps.service.ts

export const startRealGPS = (onPosition: (pos: GPSPosition) => void) => {
  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { coords } = position;
      onPosition({
        latitude: coords.latitude,
        longitude: coords.longitude,
        speed: coords.speed,
        altitude: coords.altitude,
        heading: coords.heading,
        accuracy: coords.accuracy,
        timestamp: new Date().toISOString()
      });
    },
    (error) => console.error('GPS Error:', error),
    {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 10000
    }
  );
  
  return () => navigator.geolocation.clearWatch(watchId);
};
```

### Step 2: Update Ride Page

```typescript
// In src/pages/Ride.tsx

// Replace mock setup:
useEffect(() => {
  if (!enableMockGPS || !active) return;
  // ... remove mock GPS code ...
  
  // Use real GPS instead:
  const cleanup = startRealGPS((position) => {
    addPoint(position);
  });
  
  return cleanup;
}, [active, addPoint]);
```

## Performance Tuning

### Monitor Performance

```typescript
// Add to RidePage for monitoring:
const [fps, setFps] = useState(0);

useEffect(() => {
  let frameCount = 0;
  const interval = setInterval(() => {
    setFps(frameCount);
    frameCount = 0;
  }, 1000);
  
  const measureFrame = () => {
    frameCount++;
    requestAnimationFrame(measureFrame);
  };
  
  measureFrame();
  return () => clearInterval(interval);
}, []);
```

### Adjust Route Sampling

```typescript
// In src/components/Map.tsx
// Reduce max points for slower devices:
const polylineLatLngs = useMemo(() => {
  const maxPoints = 300;  // Default 500, reduce for performance
  const sampled = sampleRoutePoints(routePoints, maxPoints);
  // ...
}, [routePoints]);
```

### Reduce Update Frequency

```typescript
// In src/pages/Ride.tsx
// Increase interval for lower GPS accuracy mode:
mockGPSInterval={2000}  // 2 seconds instead of 1 second
```

## Styling & Customization

### Change Widget Colors

```typescript
// In src/components/HudWidgets.tsx

// Change speed widget color from blue to another:
<div className="text-2xl font-bold text-purple-600 mt-1">  {/* was text-blue-600 */}
  {displaySpeed}
</div>
```

### Adjust Widget Sizes

```typescript
// Larger widgets:
<div className="bg-white/90 backdrop-blur-sm rounded-lg px-6 py-4 shadow-lg border border-gray-200">
  {/* was px-4 py-3 */}
</div>
```

### Change Overlay Transparency

```typescript
// More transparent:
<div className="bg-white/70 backdrop-blur-sm">  {/* was /90 */}
</div>

// Less transparent (more opaque):
<div className="bg-white/95 backdrop-blur-sm">  {/* was /90 */}
</div>
```

## Debugging

### Enable Debug Info

The RidePage shows a debug bar at the bottom with:
- Current ride status
- Number of route points
- Distance traveled
- Recording mode
- Camera follow status

### Console Logging

```typescript
// Add to any widget:
console.log('Widget update:', { speed, distance });

// Add to store:
store.subscribe((state) => {
  console.log('Store updated:', state.active);
});

// Add to overlay manager:
console.log('Registered widgets:', overlay.getActiveWidgets());
```

### React DevTools

```bash
# Install React DevTools browser extension
# Then in browser:
1. Open DevTools
2. Find OverlayManager component
3. Check registry state
4. Monitor re-renders with React Profiler
```

## Common Issues & Solutions

### Widget Not Showing
```typescript
// 1. Check if component is in OverlayManager
// 2. Check if visible property isn't false
// 3. Check z-index isn't blocked
// 4. Check position coordinates

// Debug:
console.log('Active widgets:', overlay.getActiveWidgets());
```

### Map Not Updating
```typescript
// 1. Check if GPS updates are coming in
// 2. Check if route array is being populated
// 3. Check browser console for errors
// 4. Check if map container has height

// Debug:
console.log('Route points:', state.active?.route?.length);
console.log('Latest position:', state.active?.route?.[state.active.route.length - 1]);
```

### Performance Issues (Lag)
```typescript
// 1. Reduce route sampling points
// 2. Increase GPS update interval
// 3. Disable camera follow
// 4. Remove unused widgets
// 5. Check browser hardware acceleration

// Profile in DevTools:
// Performance → Record → Start ride → Stop → Analyze
```

## Testing

### Manual Testing Checklist
- [ ] Start ride - GPS status shows "Searching" then "Connected"
- [ ] Map shows initial center position
- [ ] Speed updates as position changes
- [ ] Distance increases (roughly proportional to time)
- [ ] Duration timer updates every second
- [ ] Recording status shows "Recording"
- [ ] Pause button works - status changes to "Paused"
- [ ] Resume button works - status changes to "Recording"
- [ ] Finish button saves and shows "Finished"
- [ ] Map controls (zoom) work properly
- [ ] Layout is responsive on mobile viewport
- [ ] All widgets are visible and readable

### Unit Test Example

```typescript
import { render, screen } from '@testing-library/react';
import { SpeedWidget } from './HudWidgets';
import { useRideStore } from '../stores/ride.store';

jest.mock('../stores/ride.store');

test('SpeedWidget displays speed', () => {
  (useRideStore as jest.Mock).mockReturnValue({
    active: {
      route: [
        { speed: 15.5, latitude: 0, longitude: 0, timestamp: '' }
      ]
    }
  });
  
  render(<SpeedWidget />);
  expect(screen.getByText('15.5')).toBeInTheDocument();
});
```

## Next Steps

### For Development
1. Integrate real GPS data
2. Add persistence (IndexedDB)
3. Implement sync service
4. Add authentication

### For Enhancement
1. Smooth camera animations
2. Route simplification (Web Worker)
3. Power/HR calculations
4. Live weather overlay
5. Turn-by-turn navigation

### For Production
1. Performance optimization (profiling)
2. Battery impact testing
3. Offline mode validation
4. Network resilience
5. Privacy/security review

## Resources

- **Leaflet Docs**: https://leafletjs.com/
- **React Leaflet**: https://react-leaflet.js.org/
- **Zustand**: https://github.com/pmndrs/zustand
- **Tailwind CSS**: https://tailwindcss.com/
- **Geolocation API**: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
- **Haversine Formula**: https://en.wikipedia.org/wiki/Haversine_formula

## Support

For questions or issues:
1. Check the documentation files in `/docs/`
2. Review component comments in source files
3. Check test files for usage examples
4. Look at the ride store implementation for data structure
