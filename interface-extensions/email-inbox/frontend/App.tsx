import React, { useMemo, useState } from 'react';
import { useCustomProperties } from '@airtable/blocks/interface/ui';
import './styles.css';
import { TabBar } from './components/TabBar';
import { InboxPage } from './pages/InboxPage';
import { countByCategory, useEmails } from './hooks/useEmails';
import { getCustomProperties } from './index';
import { CATEGORY_TABS, type CategoryTab } from './utils/constants';
import { tabLabel } from './utils/cells';
import { colors, fonts, microLabel, space } from './utils/theme';

export function App() {
    const { customPropertyValueByKey, errorState } = useCustomProperties(getCustomProperties);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emailsTable = customPropertyValueByKey.emailsTable as any;

    const rows = useEmails(emailsTable);
    const [activeTab, setActiveTab] = useState<CategoryTab>('all');

    const counts = useMemo(() => countByCategory(rows), [rows]);

    const tabs = useMemo(() => CATEGORY_TABS.map(tab => ({
        id: tab,
        label: tabLabel(tab),
        count: counts[tab === 'all' ? 'all' : tab] ?? 0,
    })), [counts]);

    if (errorState) {
        return (
            <div className="clive-root" style={{ minHeight: '100%', padding: space(6), fontFamily: fonts.mono, color: colors.danger }}>
                <span style={microLabel}>// config error</span>
                <p style={{ marginTop: space(2) }}>{errorState.error.message}</p>
            </div>
        );
    }

    if (!emailsTable) {
        return (
            <div className="clive-root" style={{ minHeight: '100%', padding: space(6), fontFamily: fonts.mono, color: colors.textMuted }}>
                <span style={microLabel}>// awaiting source</span>
                <p style={{ marginTop: space(2) }}>
                    Select the Emails table in this extension&apos;s settings.
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
                        <span style={{ color: colors.clive }}>// Email Inbox</span>
                    </h1>
                    <span style={{ ...microLabel, color: colors.warm }}>v1 · by category</span>
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
                    All Gmail captured into Airtable. Browse by category, search, and open the full message or jump back to Gmail.
                </p>
                <hr className="clive-rule" style={{ marginTop: space(4) }} />
            </header>

            <div style={{ marginBottom: space(4), overflowX: 'auto' }}>
                <TabBar
                    tabs={tabs}
                    activeId={activeTab}
                    onChange={id => setActiveTab(id as CategoryTab)}
                />
            </div>

            <InboxPage rows={rows} activeTab={activeTab} />
        </div>
    );
}
