import React from 'react';
import type { OnboardingModule } from '../hooks/useOnboardingModules';
import type { ProgressByModuleId } from '../hooks/useOnboardingProgress';
import { colors, fonts, space } from '../utils/theme';

interface SidebarProps {
    modules: OnboardingModule[];
    progressByModule: ProgressByModuleId;
    activeId: string | null;
    onSelect: (id: string) => void;
    totalReadMin: number;
    completedCount: number;
    openQuestions: number;
}

export function Sidebar({
    modules,
    progressByModule,
    activeId,
    onSelect,
    totalReadMin,
    completedCount,
    openQuestions,
}: SidebarProps) {
    const bySection = modules.reduce<Record<string, OnboardingModule[]>>((acc, mod) => {
        if (!acc[mod.section]) acc[mod.section] = [];
        acc[mod.section].push(mod);
        return acc;
    }, {});

    const sections = Object.keys(bySection);
    const total = modules.length;
    const pct = total ? Math.round((completedCount / total) * 100) : 0;

    return (
        <aside
            className="tl-sidebar"
            style={{
                width: 280,
                minWidth: 280,
                borderRight: `1px solid ${colors.border}`,
                background: colors.graphiteInk,
                padding: space(4),
                overflowY: 'auto',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <div style={{ marginBottom: space(5) }}>
                <p style={{
                    margin: 0,
                    fontFamily: fonts.sans,
                    fontSize: '0.68rem',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: colors.sageSignal,
                }}
                >
                    TL Onboarding
                </p>
                <h1 style={{
                    margin: `${space(1)} 0 0`,
                    fontFamily: fonts.sans,
                    fontSize: '1.15rem',
                    fontWeight: 600,
                    color: colors.parchment,
                    lineHeight: 1.3,
                }}
                >
                    AstraJax reference
                </h1>
                <p style={{
                    margin: `${space(2)} 0 0`,
                    fontSize: '0.82rem',
                    color: colors.textMuted,
                    lineHeight: 1.45,
                }}
                >
                    ~{totalReadMin} min read · {completedCount}/{total} complete ({pct}%)
                </p>
                <div className="tl-progress-bar" aria-hidden>
                    <div className="tl-progress-bar-fill" style={{ width: `${pct}%` }} />
                </div>
            </div>

            <div style={{ flex: 1 }}>
                {sections.map(section => (
                    <div key={section} style={{ marginBottom: space(4) }}>
                        <p style={{
                            margin: `0 0 ${space(2)}`,
                            fontSize: '0.65rem',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: colors.textDim,
                            fontFamily: fonts.sans,
                        }}
                        >
                            {section}
                        </p>
                        <nav style={{ display: 'flex', flexDirection: 'column', gap: space(1) }}>
                            {bySection[section].map(mod => {
                                const active = mod.id === activeId;
                                const prog = progressByModule.get(mod.id);
                                const done = prog?.completed;
                                const hasOpenQ = prog?.questionStatus === 'Open';
                                return (
                                    <button
                                        key={mod.id}
                                        type="button"
                                        onClick={() => onSelect(mod.id)}
                                        className={`tl-nav-item${active ? ' is-active' : ''}${done ? ' is-complete' : ''}`}
                                        style={{
                                            textAlign: 'left',
                                            border: `1px solid ${active ? colors.borderStrong : 'transparent'}`,
                                            background: active ? colors.deepMoss : 'transparent',
                                            padding: `${space(2)} ${space(3)}`,
                                            cursor: 'pointer',
                                            fontFamily: fonts.sans,
                                        }}
                                    >
                                        <span style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: space(2),
                                            fontSize: '0.88rem',
                                            color: active ? colors.parchment : colors.textMuted,
                                            fontWeight: active ? 600 : 400,
                                        }}
                                        >
                                            <span
                                                className={`tl-nav-check${done ? ' is-done' : ''}`}
                                                title={done ? 'Complete' : 'Not complete'}
                                                aria-hidden
                                            >
                                                {done ? '✓' : '○'}
                                            </span>
                                            {mod.essential && (
                                                <span title="Essential" style={{ color: colors.buttermilk }}>★</span>
                                            )}
                                            <span style={{ flex: 1 }}>{mod.title}</span>
                                            {hasOpenQ && (
                                                <span className="tl-nav-q" title="Question open">?</span>
                                            )}
                                        </span>
                                        <span style={{
                                            display: 'block',
                                            marginTop: 2,
                                            marginLeft: 22,
                                            fontSize: '0.72rem',
                                            color: colors.textDim,
                                        }}
                                        >
                                            {mod.readTimeMin} min
                                        </span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                ))}
            </div>

            {openQuestions > 0 && (
                <p className="tl-sidebar-footer">
                    {openQuestions} open question{openQuestions === 1 ? '' : 's'} for Matthew
                </p>
            )}
        </aside>
    );
}
