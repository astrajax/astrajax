import React, { useMemo, useState } from 'react';
import { useCustomProperties } from '@airtable/blocks/interface/ui';
import './styles.css';
import { TabBar } from './components/TabBar';
import { QueuePage, type QueueTab } from './pages/QueuePage';
import { useContextIntake } from './hooks/useContextIntake';
import { getCustomProperties } from './index';
import { colors, fonts, microLabel, space } from './utils/theme';
import {
    DOWNSTREAM_STATUSES,
    INTAKE_STATUS,
} from './utils/constants';

export function App() {
    const { customPropertyValueByKey, errorState } = useCustomProperties(getCustomProperties);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const intakeTable = customPropertyValueByKey.intakeTable as any;

    const rows = useContextIntake(intakeTable);
    const [activeTab, setActiveTab] = useState<QueueTab>('review');

    const counts = useMemo(() => ({
        review: rows.filter(r => r.status === INTAKE_STATUS.READY_FOR_REVIEW).length,
        clarify: rows.filter(r => r.status === INTAKE_STATUS.NEEDS_CLARIFICATION).length,
        duplicates: rows.filter(r => r.status === INTAKE_STATUS.POSSIBLE_DUPLICATE).length,
        matthew: rows.filter(r => r.nextOwner === 'Matthew').length,
        tl: rows.filter(r => r.nextOwner === 'TL').length,
        integrity: rows.filter(r => {
            if (!DOWNSTREAM_STATUSES.includes(r.status as typeof DOWNSTREAM_STATUSES[number])) return false;
            if (r.submittedBy === 'Matthew') return false;
            if (!r.createdAt) return false;
            const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            return r.createdAt.valueOf() >= weekAgo;
        }).length,
        all: rows.length,
    }), [rows]);

    const tabs = useMemo(() => ([
        { id: 'review', label: 'Ready for review', count: counts.review },
        { id: 'clarify', label: 'Needs clarification', count: counts.clarify },
        { id: 'duplicates', label: 'Possible duplicates', count: counts.duplicates },
        { id: 'matthew', label: 'Matthew queue', count: counts.matthew },
        { id: 'tl', label: 'TL queue', count: counts.tl },
        { id: 'integrity', label: 'Integrity check', count: counts.integrity },
        { id: 'all', label: 'All', count: counts.all },
    ]), [counts]);

    if (errorState) {
        return (
            <div className="clive-root" style={{ minHeight: '100%', padding: space(6), fontFamily: fonts.mono, color: colors.danger }}>
                <span style={microLabel}>// config error</span>
                <p style={{ marginTop: space(2), color: colors.danger }}>{errorState.error.message}</p>
            </div>
        );
    }

    if (!intakeTable) {
        return (
            <div className="clive-root" style={{ minHeight: '100%', padding: space(6), fontFamily: fonts.mono, color: colors.textMuted }}>
                <span style={microLabel}>// awaiting source</span>
                <p style={{ marginTop: space(2), color: colors.textMuted }}>
                    Select the Context Intake table in this extension&apos;s settings.
                </p>
            </div>
        );
    }

    return (
        <div
            className="clive-root"
            style={{
                minHeight: '100%',
                color: colors.text,
                fontFamily: fonts.sans,
                padding: space(6),
            }}
        >
            <header style={{ marginBottom: space(4) }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: space(3), flexWrap: 'wrap' }}>
                    <h1
                        style={{
                            margin: 0,
                            fontSize: '1.25rem',
                            fontWeight: 600,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                        }}
                    >
                        Clive
                        {' '}
                        <span style={{ color: colors.clive }}>// Context Intake</span>
                    </h1>
                    <span style={{ ...microLabel, color: colors.warm }}>v1 · 2026-05-29</span>
                </div>
                <p
                    style={{
                        margin: `${space(2)} 0 0`,
                        fontSize: '0.82rem',
                        color: colors.textMuted,
                        maxWidth: 640,
                        lineHeight: 1.5,
                    }}
                >
                    Review captured context from Clive Intake. Approve, clarify, or open records for full editing.
                </p>
                <hr className="clive-rule" style={{ marginTop: space(4) }} />
            </header>

            <div style={{ marginBottom: space(4), overflowX: 'auto' }}>
                <TabBar
                    tabs={tabs}
                    activeId={activeTab}
                    onChange={id => setActiveTab(id as QueueTab)}
                />
            </div>

            <QueuePage rows={rows} activeTab={activeTab} intakeTable={intakeTable} />
        </div>
    );
}
