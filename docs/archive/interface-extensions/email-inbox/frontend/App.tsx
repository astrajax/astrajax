import { useMemo, useState } from 'react';
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
                <span style={microLabel}>config error</span>
                <p style={{ marginTop: space(2) }}>{errorState.error.message}</p>
            </div>
        );
    }

    if (!emailsTable) {
        return (
            <div className="clive-root" style={{ minHeight: '100%', padding: space(6), fontFamily: fonts.mono, color: colors.textMuted }}>
                <span style={microLabel}>awaiting source</span>
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
            <div className="email-shell">
                <header style={{ marginBottom: space(5) }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: space(3), flexWrap: 'wrap' }}>
                        <span
                            style={{
                                ...microLabel,
                                color: colors.clive,
                                background: colors.cliveSoft,
                                border: `1px solid ${colors.borderStrong}`,
                                padding: `${space(1)} ${space(2)}`,
                            }}
                        >
                            Clive Email Inbox
                        </span>
                        <span style={{ ...microLabel, color: colors.textDim }}>v1 - by category</span>
                    </div>
                    <h1
                        style={{
                            margin: `${space(3)} 0 0`,
                            fontSize: 'clamp(1.8rem, 4vw, 3rem)',
                            fontWeight: 700,
                            letterSpacing: '-0.04em',
                            lineHeight: 1,
                            maxWidth: 760,
                        }}
                    >
                        Captured email, arranged for quick human review.
                    </h1>
                    <p
                        style={{
                            margin: `${space(3)} 0 0`,
                            fontSize: '1rem',
                            color: colors.textMuted,
                            maxWidth: 720,
                            lineHeight: 1.6,
                        }}
                    >
                        Gmail lands in Airtable, AI adds a category and summary, then this view gives you the subject, sender, preview, and full body in a readable order.
                    </p>
                    <hr className="clive-rule" style={{ marginTop: space(5) }} />
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
        </div>
    );
}
