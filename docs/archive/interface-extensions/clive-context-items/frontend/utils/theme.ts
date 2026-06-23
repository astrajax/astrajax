import type { CSSProperties } from 'react';
import { brand } from './brand';

export { brand };

export const colors = {
    bg: brand.deepMoss,
    bgRaised: brand.graphiteInk,
    bgInset: brand.blueberryBlack,
    bgHover: '#1E211D',
    border: 'rgba(231, 209, 173, 0.12)',
    borderStrong: 'rgba(231, 209, 173, 0.28)',
    text: brand.parchmentDim,
    textMuted: 'rgba(231, 209, 173, 0.62)',
    textDim: 'rgba(231, 209, 173, 0.38)',
    accent: brand.sageSignal,
    accentText: brand.deepMoss,
    accentSoft: 'rgba(154, 167, 122, 0.14)',
    accentLine: 'rgba(154, 167, 122, 0.48)',
    glow: 'rgba(154, 167, 122, 0.20)',
    warm: brand.buttermilk,
    warmSoft: 'rgba(228, 211, 163, 0.14)',
    clive: brand.burntApricot,
    cliveSoft: 'rgba(215, 117, 69, 0.14)',
    success: brand.sageSignal,
    warning: brand.buttermilk,
    danger: '#A85A38',
    muted: 'rgba(231, 209, 173, 0.50)',
} as const;

export const fonts = {
    sans: "'Space Grotesk', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
} as const;

export const space = (n: number) => `${n * 4}px`;

export const microLabel: CSSProperties = {
    fontFamily: fonts.mono,
    fontSize: '0.62rem',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: colors.textDim,
};

export function itemStatusColor(status: string | null): string {
    switch (status) {
        case 'Draft':
        case 'Agent proposed':
            return colors.warm;
        case 'Proposed':
        case 'Needs decision':
            return colors.accent;
        case 'Approved':
        case 'Published':
            return colors.success;
        case 'Rejected':
        case 'Deprecated':
            return colors.danger;
        default:
            return colors.textDim;
    }
}
