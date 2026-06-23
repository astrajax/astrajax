import React from 'react';
import { colors, fonts, microLabel, space } from '../utils/theme';

interface DetailFieldProps {
    label: string;
    value: string;
    mono?: boolean;
    multiline?: boolean;
}

export function DetailField({ label, value, mono, multiline }: DetailFieldProps) {
    const display = value.trim() || '—';
    return (
        <div style={{ minWidth: 0 }}>
            <div style={microLabel}>{label}</div>
            <div
                style={{
                    marginTop: 4,
                    fontSize: '0.8rem',
                    color: display === '—' ? colors.textDim : colors.textMuted,
                    fontFamily: mono ? fonts.mono : fonts.sans,
                    lineHeight: multiline ? 1.55 : 1.4,
                    whiteSpace: multiline ? 'pre-wrap' : 'normal',
                    wordBreak: 'break-word',
                }}
            >
                {display}
            </div>
        </div>
    );
}

interface DetailSectionProps {
    title: string;
    children: React.ReactNode;
}

export function DetailSection({ title, children }: DetailSectionProps) {
    return (
        <div
            style={{
                marginTop: space(3),
                paddingTop: space(3),
                borderTop: `1px solid ${colors.border}`,
            }}
        >
            <div style={{ ...microLabel, color: colors.clive, marginBottom: space(2) }}>{title}</div>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: space(3),
                }}
            >
                {children}
            </div>
        </div>
    );
}
