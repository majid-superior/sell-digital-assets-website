import type React from 'react';

/**
 * Props accepted by all icon components in the application.
 * Mirrors the subset of icon props that consumers actually use,
 * without leaking any underlying icon library types.
 */
export interface IconProps extends React.SVGAttributes<SVGElement> {
    size?: number | string;
    strokeWidth?: number | string;
    className?: string;
    'aria-hidden'?: boolean | 'true' | 'false';
}

/**
 * A React component that renders an SVG icon.
 * Used as the type for icon props in component interfaces
 * (e.g., NavLinkItem.icon, FeatureItem.icon).
 */
export type IconComponent = React.ComponentType<IconProps>;
