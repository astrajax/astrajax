import React, { useMemo, useState } from 'react';
import { colors, fonts, microLabel, space } from '../utils/theme';
import {
    DOWNSTREAM_STATUSES,
    INTAKE_STATUS,
} from '../utils/constants';
import type { IntakeRow } from '../hooks/useContextIntake';
import { IntakeCard } from '../components/IntakeCard';

export type QueueTab = 'review' | 'clarify' | 'duplicates' | 'matthew' | 'tl' | 'integrity' | 'all';

interface QueuePageProps {
    rows: IntakeRow[];
    activeTab: QueueTab;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    intakeTable: any;
}

function isIntegrityViolation(row: IntakeRow): boolean {
    if (!DOWNSTREAM_STATUSES.includes(row.status as typeof DOWNSTREAM_STATUSES[number])) return false;
    if (row.submittedBy === 'Matthew') return false;
    if (!row.createdAt) return false;
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return row.createdAt.valueOf() >= weekAgo;
}

export function QueuePage({ rows, activeTab, intakeTable }: QueuePageProps) {
    const [destinationFilter, setDestinationFilter] = useState<string>('all');

    const filtered = useMemo(() => {
        let list = rows;

        switch (activeTab) {
            case 'review':
                list = list.filter(r => r.status === INTAKE_STATUS.READY_FOR_REVIEW);
                break;
            case 'clarify':
                list = list.filter(r => r.status === INTAKE_STATUS.NEEDS_CLARIFICATION);
                break;
            case 'duplicates':
                list = list.filter(r => r.status === INTAKE_STATUS.POSSIBLE_DUPLICATE);
                break;
            case 'matthew':
                list = list.filter(r => r.nextOwner === 'Matthew');
                break;
            case 'tl':
                list = list.filter(r => r.nextOwner === 'TL');
                break;
            case 'integrity':
                list = list.filter(isIntegrityViolation);
                break;
            default:
                break;
        }

        if (destinationFilter !== 'all') {
            list = list.filter(r => r.destination === destinationFilter);
        }

        return list;
    }, [rows, activeTab, destinationFilter]);

    const destinations = useMemo(() => {
        const set = new Set<string>();
        for (const r of rows) {
            if (r.destination) set.add(r.destination);
        }
        return Array.from(set).sort();
    }, [rows]);

    const countLabel = `${filtered.length} record${filtered.length === 1 ? '' : 's'}`;

    return (
        <div style={{ fontFamily: fonts.sans }}>
            {activeTab === 'review' || activeTab === 'all' ? (
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: space(3),
                        alignItems: 'center',
                        marginBottom: space(4),
                    }}
                >
                    <span style={microLabel}>destination</span>
                    <select
                        value={destinationFilter}
                        onChange={e => setDestinationFilter(e.target.value)}
                        className="clive-select"
                        style={{ fontSize: '0.74rem', padding: '6px 10px' }}
                    >
                        <option value="all">All destinations</option>
                        {destinations.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                    <span style={{ ...microLabel, marginLeft: 'auto' }}>{countLabel}</span>
                </div>
            ) : (
                <p style={{ ...microLabel, margin: `0 0 ${space(4)}` }}>{countLabel}</p>
            )}

            {activeTab === 'integrity' && filtered.length === 0 ? (
                <EmptyState
                    accent
                    text="Integrity check clear — no downstream statuses set by non-Matthew intake in the last 7 days."
                />
            ) : null}

            {filtered.length === 0 && activeTab !== 'integrity' ? (
                <EmptyState text="No records in this queue." />
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: space(3) }}>
                    {filtered.map(row => (
                        <IntakeCard key={row.id} row={row} intakeTable={intakeTable} />
                    ))}
                </div>
            )}
        </div>
    );
}

interface EmptyStateProps {
    text: string;
    accent?: boolean;
}

function EmptyState({ text, accent }: EmptyStateProps) {
    return (
        <div
            style={{
                padding: space(8),
                textAlign: 'center',
                fontFamily: fonts.mono,
                fontSize: '0.8rem',
                color: accent ? colors.accent : colors.textMuted,
                background: colors.bgRaised,
                border: `1px dashed ${accent ? colors.accentLine : colors.border}`,
            }}
        >
            <div className="clive-pulse" style={{ ...microLabel, marginBottom: space(2), color: accent ? colors.accent : colors.textDim }}>
                {accent ? '// clear' : '// empty'}
            </div>
            {text}
        </div>
    );
}
