import React, { useMemo, useState } from 'react';
import { useCustomProperties } from '@airtable/blocks/interface/ui';
import './styles.css';
import { TabBar } from './components/TabBar';
import { ReviewPage, type ReviewTab } from './pages/ReviewPage';
import { useContextItems } from './hooks/useContextItems';
import { getCustomProperties } from './index';
import { colors, fonts, microLabel, space } from './utils/theme';
import { ITEM_STATUS, REVIEW_STATUSES } from './utils/constants';

export function App() {
    const { customPropertyValueByKey, errorState } = useCustomProperties(getCustomProperties);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const itemsTable = customPropertyValueByKey.itemsTable as any;

    const rows = useContextItems(itemsTable);
    const [activeTab, setActiveTab] = useState<ReviewTab>('review');

    const counts = useMemo(() => ({
        review: rows.filter(row => REVIEW_STATUSES.includes(row.status as typeof REVIEW_STATUSES[number])).length,
        draft: rows.filter(row => row.status === ITEM_STATUS.DRAFT).length,
        proposed: rows.filter(row => row.status === ITEM_STATUS.PROPOSED || row.status === ITEM_STATUS.AGENT_PROPOSED).length,
        needs_decision: rows.filter(row => row.status === ITEM_STATUS.NEEDS_DECISION).length,
        all: rows.length,
    }), [rows]);

    const tabs = useMemo(() => ([
        { id: 'review', label: 'Matthew review', count: counts.review },
        { id: 'draft', label: 'Draft / quarantine', count: counts.draft },
        { id: 'proposed', label: 'Proposed', count: counts.proposed },
        { id: 'needs_decision', label: 'Needs decision', count: counts.needs_decision },
        { id: 'all', label: 'All', count: counts.all },
    ]), [counts]);

    if (errorState) {
        return (
            <div className="clive-root" style={{ minHeight: '100%', padding: space(6), fontFamily: fonts.mono, color: colors.danger }}>
                <span style={microLabel}>// config error</span>
                <p style={{ marginTop: space(2) }}>{errorState.error.message}</p>
            </div>
        );
    }

    if (!itemsTable) {
        return (
            <div className="clive-root" style={{ minHeight: '100%', padding: space(6), fontFamily: fonts.mono, color: colors.textMuted }}>
                <span style={microLabel}>// awaiting source</span>
                <p style={{ marginTop: space(2) }}>
                    Select the Context Items table in this extension&apos;s settings.
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
                        <span style={{ color: colors.clive }}>// Context Items</span>
                    </h1>
                    <span style={{ ...microLabel, color: colors.warm }}>v1 · Matthew review</span>
                </div>
                <p
                    style={{
                        margin: `${space(2)} 0 0`,
                        fontSize: '0.82rem',
                        color: colors.textMuted,
                        maxWidth: 720,
                        lineHeight: 1.5,
                    }}
                >
                    Review proposed canonical context. Each card shows which agent proposed it.
                    Approve or reject here — that sets your human confirmation in Airtable.
                </p>
                <hr className="clive-rule" style={{ marginTop: space(4) }} />
            </header>

            <div style={{ marginBottom: space(4), overflowX: 'auto' }}>
                <TabBar
                    tabs={tabs}
                    activeId={activeTab}
                    onChange={id => setActiveTab(id as ReviewTab)}
                />
            </div>

            <ReviewPage rows={rows} activeTab={activeTab} itemsTable={itemsTable} />
        </div>
    );
}
