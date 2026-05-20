// HUD module entrypoint
// Architectural intent:
// - The HUD module owns overlay widgets and reusable HUD components
// - Components are exported through a centralized module boundary
// - Types are exported for consistent widget props and overlay contracts
export * from './components';
export * from './types';
