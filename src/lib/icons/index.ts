import * as themeIcons from '@majid-superior/sell-digital-assets-theme/icons';

export type { IconProps, IconComponent } from '@majid-superior/sell-digital-assets-theme/icons';
export * from '@majid-superior/sell-digital-assets-theme/icons';

/**
 * Unified Icons namespace exposing semantic and brand icons for the application.
 * All icons are sourced directly from @majid-superior/sell-digital-assets-theme/icons.
 */
export const Icons = themeIcons;

export type IconName = keyof typeof Icons;
