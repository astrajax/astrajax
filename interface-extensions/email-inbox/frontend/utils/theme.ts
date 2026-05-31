import type { CSSProperties } from 'react';
import { brand } from './brand';

export { brand };

export const colors = {
    bg: '#F3EDDB',
    bgRaised: '#FAF7ED',
    bgInset: '#EAE2CC',
    bgHover: 'rgba(35, 39, 27, 0.05)',
    messageBg: '#FFFDF7',
    border: 'rgba(35, 39, 27, 0.12)',
    borderStrong: 'rgba(35, 39, 27, 0.22)',
    text: '#23271B',
    textMuted: 'rgba(35, 39, 27, 0.68)',
    textDim: 'rgba(35, 39, 27, 0.44)',
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

export function emailCategoryColor(category: string | null): string {
    switch (category) {
        case 'Hyperagent Release':
            return colors.clive;
        case 'Platform / SaaS Update':
            return colors.accent;
        case 'Customer / Sales':
            return colors.warm;
        case 'Finance / Billing':
            return '#8C6A2E';
        case 'Newsletter / Marketing':
            return '#567085';
        case 'Personal':
            return '#8D5D76';
        case 'Internal / Team':
            return colors.success;
        case 'Notification / System':
            return colors.textMuted;
        case 'Other':
            return colors.textDim;
        case 'Uncategorised':
            return colors.danger;
        default:
            return colors.textDim;
    }
}

export function scannerStatusColor(status: string | null): string {
    switch (status) {
        case 'New':
            return colors.warm;
        case 'Synced to repo':
            return colors.accent;
        case 'Promoted':
            return colors.success;
        case 'Ignored':
            return colors.textDim;
        default:
            return colors.textDim;
    }
}
