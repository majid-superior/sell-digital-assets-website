import { lucideRegistry } from './registry.ts';
import * as brandIcons from './brands.tsx';

export * from './types.ts';
export * from './brands.tsx';

/**
 * Unified Icons namespace exposing semantic icons for the application.
 * All UI components should consume icons via this namespace.
 */
export const Icons = {
    ...lucideRegistry,
    ...brandIcons,
} as const;

export type IconName = keyof typeof Icons;
