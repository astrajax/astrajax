import type { CSSProperties } from 'react';
import { brand } from './brand';

export { brand };

/**
 * Workbench surface matches the AstraJax website mockups (Hyperagent):
 * pale cream page, near-black moss text, terracotta accent.
 */
export const colors = {
    bg: '#F3EDDB',
    bgRaised: '#FAF7ED',
    bgInset: '#EAE2CC',
    bgHover: 'rgba(35, 39, 27, 0.05)',
    border: 'rgba(35, 39, 27, 0.12)',
    borderStrong: 'rgba(35, 39, 27, 0.22)',
    text: '#23271B',
    textMuted: 'rgba(35, 39, 27, 0.66)',
    textDim: 'rgba(35, 39, 27, 0.42)',
    accent: '#6E7B52',
    accentText: '#FAF7ED',
    accentSoft: 'rgba(110, 123, 82, 0.14)',
    accentLine: 'rgba(110, 123, 82, 0.50)',
    glow: 'rgba(110, 123, 82, 0.20)',
    warm: '#A95A2E',
    warmSoft: 'rgba(169, 90, 46, 0.12)',
    clive: '#A95A2E',
    cliveSoft: 'rgba(169, 90, 46, 0.12)',
    success: '#6E7B52',
    warning: '#A95A2E',
    danger: '#A23B26',
    muted: 'rgba(35, 39, 27, 0.50)',
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
            return colors.warning;
        case 'Proposed':
        case 'Needs decision':
            return colors.accent;
        case 'Approved':
            return colors.success;
        case 'Rejected':
        case 'Deprecated':
            return colors.danger;
        default:
            return colors.textDim;
    }
}

export function agentStatusColor(status: string | null): string {
    switch (status) {
        case 'Active':
            return colors.success;
        case 'Planned':
            return colors.warning;
        case 'Deprecated':
            return colors.danger;
        default:
            return colors.textDim;
    }
}
