import { TypedEventBus } from '../../../../packages/utils/src/eventBus';
import type { AppEvents } from '../../../../packages/types/src/events';

// Application-scoped singleton event bus typed with AppEvents
export const eventBus = new TypedEventBus<AppEvents>();

// Usage:
// import { eventBus } from '@/lib/eventBus';
// const unsub = eventBus.on('point:received', p => { ... });
