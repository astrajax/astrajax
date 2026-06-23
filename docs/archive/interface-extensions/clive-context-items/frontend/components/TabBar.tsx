import React from 'react';
import { colors, fonts, space } from '../utils/theme';

export interface TabDef {
    id: string;
    label: string;
    count?: number;
}

interface TabBarProps {
    tabs: TabDef[];
    activeId: string;
    onChange: (id: string) => void;
}

export const TabBar = React.memo(function TabBar({ tabs, activeId, onChange }: TabBarProps) {
    return (
        <div
            role="tablist"
            style={{
                display: 'inline-flex',
                gap: space(1),
                fontFamily: fonts.mono,
            }}
        >
            {tabs.map((t, i) => {
                const active = t.id === activeId;
                return (
                    <button
                        key={t.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange(t.id)}
                        className="clive-tab"
                        style={{
                            padding: '7px 13px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            fontWeight: active ? 600 : 500,
                            fontSize: '0.72rem',
                            textTransform: 'uppercase',
                        }}
                    >
                        <span style={{ opacity: 0.5, fontSize: '0.62rem' }}>
                            {String(i + 1).padStart(2, '0')}
                        </span>
                        <span>{t.label}</span>
                        {typeof t.count === 'number' && t.count > 0 ? (
                            <span
                                style={{
                                    minWidth: 18,
                                    padding: '1px 6px',
                                    fontSize: '0.62rem',
                                    fontWeight: 600,
                                    background: active ? colors.accent : 'transparent',
                                    color: active ? colors.accentText : colors.textMuted,
                                    border: active ? 'none' : `1px solid ${colors.border}`,
                                }}
                            >
                                {t.count}
                            </span>
                        ) : null}
                    </button>
                );
            })}
        </div>
    );
});
