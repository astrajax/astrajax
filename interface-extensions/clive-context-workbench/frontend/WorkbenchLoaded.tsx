import { useMemo, useState } from 'react';
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

    const agentRows = useMemo(() => agents ?? [], [agents]);
    const itemRows = useMemo(() => items ?? [], [items]);
    const changeLogRows = useMemo(() => changeLog ?? [], [changeLog]);

    const approvedCount = useMemo(
        () => itemRows.filter(row => row.status === ITEM_STATUS.APPROVED).length,
        [itemRows],
    );
    const inReviewCount = useMemo(
        () => itemRows.filter(row => IN_REVIEW_STATUSES.includes(row.status as typeof IN_REVIEW_STATUSES[number])).length,
        [itemRows],
    );
    const activeAgentCount = useMemo(
        () => agentRows.filter(row => row.status === 'Active').length,
        [agentRows],
    );
    const agentsWithoutRepoPath = useMemo(
        () => agentRows.filter(row => !row.repoPath.trim()).length,
        [agentRows],
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
            <div className="workbench-shell">
                <header className="workbench-hero">
                    <section className="workbench-panel">
                        <div style={{ display: 'flex', alignItems: 'center', gap: space(2), flexWrap: 'wrap' }}>
                            <span
                                style={{
                                    ...microLabel,
                                    color: colors.clive,
                                    background: colors.cliveSoft,
                                    border: `1px solid ${colors.borderStrong}`,
                                    padding: `${space(1)} ${space(2)}`,
                                }}
                            >
                                Clive Context Workbench
                            </span>
                            <span style={{ ...microLabel, color: colors.textDim }}>v1 - context health</span>
                        </div>
                        <h1
                            style={{
                                margin: `${space(4)} 0 0`,
                                fontSize: 'clamp(1.8rem, 4vw, 3rem)',
                                fontWeight: 700,
                                letterSpacing: '-0.04em',
                                lineHeight: 1,
                                color: colors.text,
                                maxWidth: 760,
                            }}
                        >
                            Keep Clive&apos;s agents, approved context, and paper trail in one place.
                        </h1>
                        <p
                            style={{
                                margin: `${space(3)} 0 0`,
                                fontSize: '1rem',
                                color: colors.textMuted,
                                maxWidth: 760,
                                lineHeight: 1.6,
                            }}
                        >
                            This is the maintenance layer. Intake and approval happen elsewhere; this view helps you check the fleet, read the approved library, and spot whether the audit trail still lines up.
                        </p>
                        <div className="workbench-flow" aria-label="Workbench workflow">
                            <div className="workbench-flow-card">
                                <div style={{ ...microLabel, color: colors.accent }}>1. Agents</div>
                                <p style={{ margin: `${space(2)} 0 0`, fontSize: '0.84rem', color: colors.textMuted, lineHeight: 1.5 }}>
                                    Who is running, what they are allowed to read, and which packs they depend on.
                                </p>
                            </div>
                            <div className="workbench-flow-card">
                                <div style={{ ...microLabel, color: colors.success }}>2. Approved context</div>
                                <p style={{ margin: `${space(2)} 0 0`, fontSize: '0.84rem', color: colors.textMuted, lineHeight: 1.5 }}>
                                    The source shelf agents should trust after Matthew has approved the record.
                                </p>
                            </div>
                            <div className="workbench-flow-card">
                                <div style={{ ...microLabel, color: colors.clive }}>3. Paper trail</div>
                                <p style={{ margin: `${space(2)} 0 0`, fontSize: '0.84rem', color: colors.textMuted, lineHeight: 1.5 }}>
                                    What changed, who signed it off, and whether the tamper check passes.
                                </p>
                            </div>
                        </div>
                    </section>

                    <aside className="workbench-stat-grid" aria-label="Workbench totals">
                        <div className="workbench-stat">
                            <div style={microLabel}>Active agents</div>
                            <strong style={{ display: 'block', marginTop: space(1), fontFamily: fonts.mono, fontSize: '1.5rem', color: colors.success }}>
                                {activeAgentCount}
                            </strong>
                        </div>
                        <div className="workbench-stat">
                            <div style={microLabel}>Approved items</div>
                            <strong style={{ display: 'block', marginTop: space(1), fontFamily: fonts.mono, fontSize: '1.5rem', color: colors.success }}>
                                {approvedCount}
                            </strong>
                        </div>
                        <div className="workbench-stat">
                            <div style={microLabel}>In review elsewhere</div>
                            <strong style={{ display: 'block', marginTop: space(1), fontFamily: fonts.mono, fontSize: '1.5rem', color: colors.warm }}>
                                {inReviewCount}
                            </strong>
                        </div>
                        <div className="workbench-stat">
                            <div style={microLabel}>Missing repo path</div>
                            <strong style={{ display: 'block', marginTop: space(1), fontFamily: fonts.mono, fontSize: '1.5rem', color: agentsWithoutRepoPath > 0 ? colors.warm : colors.textMuted }}>
                                {agentsWithoutRepoPath}
                            </strong>
                        </div>
                    </aside>
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
        </div>
    );
}
