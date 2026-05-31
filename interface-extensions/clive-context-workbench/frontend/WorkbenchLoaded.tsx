import React, { useMemo, useState } from 'react';
import { TabBar } from './components/TabBar';
import { FleetPage } from './pages/FleetPage';
import { LibraryPage } from './pages/LibraryPage';
import { ChangeLogPage } from './pages/ChangeLogPage';
import { useAgentEnvironments } from './hooks/useAgentEnvironments';
import { useLibraryItems } from './hooks/useLibraryItems';
import { useChangeLog } from './hooks/useChangeLog';
import { IN_REVIEW_STATUSES, ITEM_STATUS } from './utils/constants';
import { colors, fonts, microLabel, space } from './utils/theme';

export type WorkbenchTab = 'fleet' | 'library' | 'changelog';

interface WorkbenchLoadedProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    agentsTable: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    itemsTable: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    changeLogTable: any;
}

/** Hooks run here only — after all three tables are configured. */
export function WorkbenchLoaded({ agentsTable, itemsTable, changeLogTable }: WorkbenchLoadedProps) {
    const agents = useAgentEnvironments(agentsTable);
    const items = useLibraryItems(itemsTable);
    const changeLog = useChangeLog(changeLogTable);

    const [activeTab, setActiveTab] = useState<WorkbenchTab>('fleet');

    const dataLoading = agents === null || items === null || changeLog === null;

    const agentRows = agents ?? [];
    const itemRows = items ?? [];
    const changeLogRows = changeLog ?? [];

    const approvedCount = useMemo(
        () => itemRows.filter(row => row.status === ITEM_STATUS.APPROVED).length,
        [itemRows],
    );
    const inReviewCount = useMemo(
        () => itemRows.filter(row => IN_REVIEW_STATUSES.includes(row.status as typeof IN_REVIEW_STATUSES[number])).length,
        [itemRows],
    );

    const tabs = useMemo(() => ([
        { id: 'fleet', label: 'Agent Fleet', count: agentRows.length },
        { id: 'library', label: 'Context Library', count: approvedCount || undefined },
        { id: 'changelog', label: 'Change Log', count: changeLogRows.length || undefined },
    ]), [agentRows.length, approvedCount, changeLogRows.length]);

    if (dataLoading) {
        return (
            <div
                className="clive-root"
                style={{
                    minHeight: '100%',
                    padding: space(6),
                    fontFamily: fonts.mono,
                    color: colors.textMuted,
                }}
            >
                <span style={microLabel}>Loading workbench data…</span>
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
                            color: colors.text,
                        }}
                    >
                        Clive
                        {' '}
                        <span style={{ color: colors.clive }}>// Workbench</span>
                    </h1>
                    <span style={{ ...microLabel, color: colors.clive }}>v1 · read layer</span>
                </div>
                <p
                    style={{
                        margin: `${space(2)} 0 0`,
                        fontSize: '0.82rem',
                        color: colors.textMuted,
                        maxWidth: 760,
                        lineHeight: 1.5,
                    }}
                >
                    Fleet roster, approved context library, and change history.
                    {' '}
                    {inReviewCount > 0 ? `${inReviewCount} item(s) in review — approve on Context Items first.` : ''}
                </p>
                <hr className="clive-rule" style={{ marginTop: space(4) }} />
            </header>

            <div style={{ marginBottom: space(4), overflowX: 'auto' }}>
                <TabBar
                    tabs={tabs}
                    activeId={activeTab}
                    onChange={id => setActiveTab(id as WorkbenchTab)}
                />
            </div>

            {activeTab === 'fleet' ? <FleetPage rows={agentRows} agentsTable={agentsTable} /> : null}
            {activeTab === 'library' ? <LibraryPage rows={itemRows} itemsTable={itemsTable} /> : null}
            {activeTab === 'changelog' ? <ChangeLogPage rows={changeLogRows} /> : null}
        </div>
    );
}
