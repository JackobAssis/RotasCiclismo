# HUD Widget Architecture & Registration System

## Overview

The HUD (Heads-Up Display) widget system provides a scalable, modular approach to managing realtime cycling metrics and status information. The system uses a registry-based pattern with context-driven dependency injection and Zustand selectors for optimal performance.

## Core Concepts

### 1. Widget Composition Model

Widgets follow a two-tier component structure:

**Tier 1: Pure Widget Component**
```typescript
const SpeedWidgetComponent: HudWidget = memo(({ label = 'Speed' }) => {
  // Pure presentation logic
  // Uses selectors to subscribe to store
  // Memoized to prevent unnecessary renders
  return <div>...</div>;
});
```

**Tier 2: Container/Registration Component**
```typescript
export const SpeedWidget = memo(() => {
  const overlay = useOverlay();
  
  useEffect(() => {
    // Register this widget on mount
    overlay.registerWidget('speed', config, SpeedWidgetComponent);
    
    // Unregister on unmount
    return () => overlay.unregisterWidget('speed');
  }, [overlay]);
  
  // Render the pure component
  return <SpeedWidgetComponent label="Speed" />;
});
```

**Benefits:**
- Pure components are easily testable
- Registration is automatic (no manual wiring)
- Lifecycle is managed by React hooks
- Composable and reusable

### 2. Widget Configuration

Each widget has a configuration object defining its behavior:

```typescript
export type HudWidgetConfig = {
  id: string;                    // Unique identifier
  label: string;                 // Display label
  position: WidgetPosition;      // Layout position
  layer: WidgetLayer;            // Z-index layer
  visible?: boolean;             // Visibility toggle
  priority?: number;             // Render priority (higher = first)
};
```

**Position Types:**
- `top-left`, `top-center`, `top-right`
- `center-left`, `center-right`
- `bottom-left`, `bottom-center`, `bottom-right`

**Layer Types:**
- `base`: Non-interactive status widgets (z: 100)
- `interactive`: Widgets that may receive input (z: 200)
- `overlay`: Important UI elements (z: 300)
- `modal`: Dialogs and overlays (z: 400)

### 3. Widget Registry Pattern

The registry maintains a collection of all registered widgets:

```typescript
type HudWidgetRegistry = {
  [key: string]: {
    config: HudWidgetConfig;
    component: HudWidget;
    selector?: (state: any) => any;
  };
};
```

**Registry Operations:**
```typescript
// Register a widget
overlay.registerWidget('speed', config, SpeedWidgetComponent, selector?);

// Unregister a widget
overlay.unregisterWidget('speed');

// Get active widgets
const active = overlay.getActiveWidgets(); // Returns: HudWidgetConfig[]

// Update visibility
overlay.updateWidgetVisibility('speed', false);

// Update position
overlay.updateWidgetPosition('speed', 'top-right');
```

### 4. Selector-Based Subscriptions

Each widget can define a custom selector for granular subscriptions:

```typescript
// Widget subscribes only to what it needs
const speed = useRideStore((state) => {
  const route = state.active?.route;
  return route?.[route.length - 1]?.speed ?? 0;
});

// Alternative: simpler selector
const distance = useRideStore((state) => state.active?.distance ?? 0);

// Multiple values
const [status, mode] = useRideStore((state) => 
  [state.status, state.active?.mode ?? 'GPS_ONLY']
);
```

**Performance Impact:**
- Zustand uses shallow equality checking
- Selector returns new object = re-render
- Selector returns same reference = no re-render
- Fine-grained selectors minimize re-renders

## Widget Implementations

### Speed Widget

**Data Source:** Latest position speed
**Update Frequency:** Every GPS update
**Calculation:** Direct from route[-1].speed

```typescript
const speed = useRideStore((state) => {
  const route = state.active?.route;
  return route && route.length > 0 ? route[route.length - 1].speed ?? 0 : 0;
});
```

**Visual:** Bold blue text with unit indicator (km/h)
**Position:** Bottom-left
**Layer:** Base

### Distance Widget

**Data Source:** Cumulative distance in RideSession
**Update Frequency:** Every GPS update
**Calculation:** Haversine formula per point in store

```typescript
const distance = useRideStore((state) => {
  return state.active?.distance ?? 0;
});
```

**Visual:** Bold green text with unit indicator (km)
**Position:** Bottom-center
**Layer:** Base

### Duration Widget

**Data Source:** startedAt timestamp
**Update Frequency:** 1Hz via setInterval
**Calculation:** Time elapsed in HH:MM:SS format

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    const elapsed = Math.floor(
      (new Date().getTime() - new Date(startedAt).getTime()) / 1000
    );
    const formatted = formatDuration(elapsed); // HH:MM:SS
    setDisplayDuration(formatted);
  }, 1000);
  
  return () => clearInterval(interval);
}, [startedAt]);
```

**Visual:** Monospace font with time display
**Position:** Bottom-right
**Layer:** Base

**Optimization:** Independent timer prevents interference with other updates

### GPS Status Widget

**Data Source:** Latest position accuracy
**Update Frequency:** Every GPS update
**Status Levels:**
- "Searching" (no position)
- "Fair" (accuracy > 50m)
- "Good" (accuracy 20-50m)
- "Excellent" (accuracy < 20m)

```typescript
const accuracy = useRideStore((state) => {
  const route = state.active?.route;
  return route?.[route.length - 1]?.accuracy ?? null;
});
```

**Visual:** Color-coded status badge
- Yellow: Searching
- Orange: Fair accuracy
- Blue: Good accuracy
- Green: Excellent accuracy

**Position:** Top-left
**Layer:** Base
**Priority:** 15 (high - important for user awareness)

### Recording Status Widget

**Data Source:** ride.status and active?.mode
**Update Frequency:** On status/mode change only
**Visual Indicators:**
- ⊘ Ready (idle)
- ● Recording (active)
- ⏸ Paused (paused)
- ✓ Finished (finished)

```typescript
const [status, mode] = useRideStore((state) => 
  [state.status, state.active?.mode ?? 'GPS_ONLY']
);
```

**Visual:** Animated indicator with mode display
**Position:** Top-right
**Layer:** Base
**Priority:** 15 (high - critical status)

## Overlay Manager Responsibilities

### 1. Registry Management
```typescript
// Maintain registry of all widgets
const [registry, setRegistry] = useState<HudWidgetRegistry>({});

// Add/remove widgets dynamically
registerWidget(key, config, component, selector);
unregisterWidget(key);
```

### 2. Visibility Control
```typescript
// Track which widgets are visible
const [visibility, setVisibility] = useState<Record<string, boolean>>({});

// Update visibility at runtime
updateWidgetVisibility(key, visible);
```

### 3. Position Management
```typescript
// Allow position overrides for future customization
const [positionOverrides, setPositionOverrides] = 
  useState<Record<string, WidgetPosition>>({});

// Update position dynamically
updateWidgetPosition(key, newPosition);
```

### 4. Rendering Coordination
```typescript
// Group widgets by layer
const widgetsByLayer = useMemo(() => {
  const grouped: Record<WidgetLayer, Array<[string, config, component]>> = {
    base: [],
    interactive: [],
    overlay: [],
    modal: []
  };
  
  // Filter by visibility, group by layer, sort by priority
  // ...
  
  return grouped;
}, [registry, visibility, positionOverrides]);
```

### 5. Layout System
```typescript
// CSS-based positioning
const getPositionClasses = (position: WidgetPosition): string => {
  const positionMap: Record<WidgetPosition, string> = {
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'top-right': 'top-4 right-4',
    // ...
  };
  return positionMap[position];
};
```

## Context-Driven API

Widgets access the overlay system via React Context:

```typescript
import { useOverlay } from './OverlayManager';

export const MyWidget = () => {
  const overlay = useOverlay();
  
  // Use the overlay API
  overlay.registerWidget(...);
  overlay.unregisterWidget(...);
  overlay.updateWidgetVisibility(...);
};
```

**Benefits:**
- No prop drilling
- Automatic dependency tracking
- Memoized context prevents re-renders
- Clean separation of concerns

## Memoization Strategy

### Component Memoization
```typescript
const SpeedWidgetComponent: HudWidget = memo(({ label = 'Speed' }) => {
  // Only re-render if label prop changes
  // Or if useRideStore selector returns new value
});
```

### Container Memoization
```typescript
export const SpeedWidget = memo(() => {
  // Re-renders only if overlay context changes
  // Which is rare (memoized in OverlayManager)
});
```

### Context Memoization
```typescript
const contextValue = useMemo<HudOverlayContext>(
  () => ({
    registerWidget,
    unregisterWidget,
    // ...
  }),
  [registerWidget, unregisterWidget, /* ... */]
);
```

**Result:** Minimal re-renders, optimal performance

## Widget Lifecycle

### Mount Phase
```
1. Widget component mounts
   ↓
2. useEffect hook fires
   ↓
3. Widget calls overlay.registerWidget()
   ↓
4. OverlayManager adds to registry
   ↓
5. HudOverlayLayer renders widget
   ↓
6. Widget displayed on screen
```

### Update Phase
```
1. GPS update → store.addPoint()
   ↓
2. Store state changes
   ↓
3. Widget selector evaluated
   ↓
4. If selector returns new value:
   ├─ Component re-renders
   └─ Display updates
   
5. If selector returns same reference:
   └─ No re-render (memoization wins)
```

### Unmount Phase
```
1. Widget component unmounts
   ↓
2. useEffect cleanup fires
   ↓
3. Widget calls overlay.unregisterWidget()
   ↓
4. OverlayManager removes from registry
   ↓
5. Widget removed from screen
   ↓
6. Resources cleaned up
```

## Best Practices

### 1. Use Granular Selectors
```typescript
// Good - only subscribe to what you need
const speed = useRideStore((state) => state.active?.route[-1]?.speed ?? 0);

// Bad - subscribes to entire route array
const route = useRideStore((state) => state.active?.route);
const speed = route?.[route.length - 1]?.speed ?? 0;
```

### 2. Memoize Containers
```typescript
// Good
export const SpeedWidget = memo(() => { ... });

// Bad (re-creates on every parent render)
export const SpeedWidget = () => { ... };
```

### 3. Consistent Positioning
```typescript
// Establish a layout convention
const WIDGET_LAYOUT = {
  status: { top: ['top-left', 'top-right'], priority: 15 },
  metrics: { bottom: ['bottom-left', 'bottom-center', 'bottom-right'], priority: 8-10 },
  actions: { center: ['center-left', 'center-right'], priority: 5 }
};
```

### 4. Clear Configuration
```typescript
// Good - self-documenting
const config = {
  id: 'speed',
  label: 'Speed',
  position: 'bottom-left' as const,
  layer: 'base' as const,
  visible: true,
  priority: 10
};

// Bad - unclear
const config = { position: 'bl', priority: 10 };
```

### 5. Independent State Management
```typescript
// Good - Duration manages its own timer
const DurationWidget = () => {
  const [displayDuration, setDisplayDuration] = useState('00:00:00');
  
  useEffect(() => {
    const interval = setInterval(() => {
      // Update independently
    }, 1000);
    return () => clearInterval(interval);
  }, []);
};

// Bad - relying on store for everything
// (would cause unnecessary updates)
```

## Mobile Optimization

### Touch-Friendly Sizing
```css
.hud-widget {
  min-width: 60px;     /* Readable on small screens */
  padding: 0.75rem;    /* Touch target */
  font-size: 1rem;     /* Readable without zoom */
}
```

### Responsive Layout
```typescript
const getPositionClasses = (position: WidgetPosition): string => {
  // Base classes for all screens
  const base = 'absolute transition-all';
  
  // Position-specific classes
  const positionMap = {
    'top-left': `${base} top-4 left-4 sm:top-2 sm:left-2`,
    // Adjust for small screens
  };
};
```

### Battery Awareness
```typescript
// Reduce update frequency on low battery
const updateInterval = navigator.getBattery?.() 
  ? LOW_BATTERY_INTERVAL 
  : NORMAL_INTERVAL;
```

## Testing Strategies

### Unit Tests
```typescript
describe('SpeedWidget', () => {
  it('displays speed from store', () => {
    const { getByText } = render(<SpeedWidget />);
    expect(getByText('15.5')).toBeInTheDocument();
  });
  
  it('updates when speed changes', () => {
    // Mock store, verify updates
  });
});
```

### Integration Tests
```typescript
describe('OverlayManager', () => {
  it('registers and renders widgets', () => {
    // Render OverlayManager with widgets
    // Verify all widgets present
  });
  
  it('handles visibility toggling', () => {
    // Toggle visibility
    // Verify widget appears/disappears
  });
});
```

### Performance Tests
```typescript
describe('Widget Performance', () => {
  it('prevents unnecessary re-renders', () => {
    // Mock selector returning same reference
    // Verify component doesn't re-render
  });
});
```

## Future Enhancement Ideas

### 1. Customizable Widget Layout
```typescript
// Allow users to drag/reposition widgets
// Save layout to localStorage
// Restore on app load
```

### 2. Widget Templates
```typescript
// Create template sets for different modes:
// - Racing mode (speed-focused)
// - Casual mode (all metrics)
// - Training mode (power-focused)
```

### 3. Conditional Widget Display
```typescript
// Show/hide widgets based on conditions:
// - Hide navigation widgets when no route
// - Hide power widget if no sensor
// - Show weather when available
```

### 4. Widget Animations
```typescript
// Smooth transitions when widgets appear/disappear
// Pulse effects for important status changes
// Number animations (0 → 15.5)
```

### 5. Accessibility Features
```typescript
// Keyboard shortcuts for widget control
// Screen reader support
// High contrast mode
// Adjustable font sizes
```

## Summary

The HUD widget system provides:
- ✅ Modular, composable widget architecture
- ✅ Registry-based registration pattern
- ✅ Context-driven API
- ✅ Selector-based subscriptions
- ✅ Comprehensive memoization
- ✅ Mobile-first responsive design
- ✅ Clear lifecycle management
- ✅ Z-index layering strategy
- ✅ Performance optimized
- ✅ Extensible for future features
