import { memo, useMemo, useState } from 'react';
import { AgentCard } from '../components/AgentCard';
import { matchesSearch } from '../utils/cells';
import { AGENT, AGENT_TRIGGER_NAMES } from '../utils/constants';
import { colors, fonts, microLabel, space } from '../utils/theme';
import type { AgentEnvironmentRow } from '../hooks/useAgentEnvironments';

interface FleetPageProps {
    rows: AgentEnvironmentRow[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    agentsTable: any;
}

export const FleetPage = memo(function FleetPage({ rows, agentsTable }: FleetPageProps) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const statuses = useMemo(() => {
        const set = new Set<string>();
        for (const row of rows) {
            if (row.status) set.add(row.status);
        }
        return Array.from(set).sort();
    }, [rows]);

    const filtered = useMemo(() => {
        return rows
            .filter(row => !statusFilter || row.status === statusFilter)
            .filter(row => matchesSearch(
                search,
                row.agentName,
                row.purpose,
                row.repoPath,
                row.skills,
                row.packNames.join(' '),
            ))
            .sort((a, b) => a.agentName.localeCompare(b.agentName));
    }, [rows, search, statusFilter]);

    const curatorRow = useMemo(
        () => rows.find(row => row.agentName === AGENT_TRIGGER_NAMES.CURATOR),
        [rows],
    );
    const scannerRow = useMemo(
        () => rows.find(row => row.agentName === AGENT_TRIGGER_NAMES.SCANNER),
        [rows],
    );
    const canWrite = Boolean(agentsTable?.updateRecordAsync);
    const [opsBusy, setOpsBusy] = useState(false);
    const activeCount = useMemo(
        () => rows.filter(row => row.status === 'Active').length,
        [rows],
    );
    const needsRepoPathCount = useMemo(
        () => rows.filter(row => !row.repoPath.trim()).length,
        [rows],
    );
    const linkedPackCount = useMemo(() => {
        const set = new Set<string>();
        for (const row of rows) {
            for (const pack of row.packNames) set.add(pack);
        }
        return set.size;
    }, [rows]);

    async function pulseRowTrigger(rowId: string, fieldId: string) {
        if (!agentsTable?.updateRecordAsync) return;
        setOpsBusy(true);
        try {
            await agentsTable.updateRecordAsync(rowId, { [fieldId]: true });
        } catch (error) {
            console.error('[FleetPage] pulseRowTrigger', error);
            window.alert('Could not send trigger. Check Workbench has Edit on the trigger fields.');
        } finally {
            setOpsBusy(false);
        }
    }

    return (
        <div>
            <section className="workbench-page-header">
                <div>
                    <div style={{ ...microLabel, color: colors.accent }}>Agent operations</div>
                    <h2 style={{ margin: `${space(2)} 0 0`, fontSize: '1.45rem', lineHeight: 1.15, color: colors.text }}>
                        Check the fleet before changing the context environment.
                    </h2>
                    <p style={{ margin: `${space(2)} 0 0`, fontSize: '0.92rem', color: colors.textMuted, maxWidth: 720, lineHeight: 1.6 }}>
                        Runtime, skills, and permissions are reference-only here. Use this tab to see which agents exist, which packs they depend on, and whether the Curator or Scanner needs a manual nudge.
                    </p>
                </div>
                <div className="workbench-stat-grid">
                    <div className="workbench-stat">
                        <div style={microLabel}>Active</div>
                        <strong style={{ display: 'block', marginTop: space(1), fontFamily: fonts.mono, fontSize: '1.25rem', color: colors.success }}>
                            {activeCount}
                        </strong>
                    </div>
                    <div className="workbench-stat">
                        <div style={microLabel}>Linked packs</div>
                        <strong style={{ display: 'block', marginTop: space(1), fontFamily: fonts.mono, fontSize: '1.25rem', color: colors.text }}>
                            {linkedPackCount}
                        </strong>
                    </div>
                    <div className="workbench-stat">
                        <div style={microLabel}>Missing repo path</div>
                        <strong style={{ display: 'block', marginTop: space(1), fontFamily: fonts.mono, fontSize: '1.25rem', color: needsRepoPathCount > 0 ? colors.warm : colors.textMuted }}>
                            {needsRepoPathCount}
                        </strong>
                    </div>
                </div>
            </section>

            {canWrite && (curatorRow || scannerRow) ? (
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: space(2),
                        marginBottom: space(5),
                        padding: space(4),
                        border: `1px solid ${colors.clive}44`,
                        background: colors.cliveSoft,
                        alignItems: 'center',
                    }}
                >
                    <div style={{ flex: '1 1 260px' }}>
                        <div style={{ ...microLabel, color: colors.clive }}>Manual triggers</div>
                        <p style={{ margin: `${space(1)} 0 0`, fontSize: '0.82rem', color: colors.textMuted, lineHeight: 1.5 }}>
                            These set Airtable trigger checkboxes. The agents still run through their guarded automation paths.
                        </p>
                    </div>
                    {curatorRow ? (
                        <button
                            type="button"
                            disabled={opsBusy || curatorRow.triggerCurator}
                            className="clive-btn clive-btn-primary"
                            style={{ fontSize: '0.72rem', minHeight: 44, padding: `${space(2)} ${space(4)}` }}
                            onClick={() => pulseRowTrigger(curatorRow.id, AGENT.TRIGGER_CURATOR)}
                        >
                            {curatorRow.triggerCurator ? 'Curator audit queued…' : 'Run Curator audit'}
                        </button>
                    ) : null}
                    {scannerRow ? (
                        <button
                            type="button"
                            disabled={opsBusy || scannerRow.triggerScanner}
                            className="clive-btn clive-btn-primary"
                            style={{ fontSize: '0.72rem', minHeight: 44, padding: `${space(2)} ${space(4)}` }}
                            onClick={() => pulseRowTrigger(scannerRow.id, AGENT.TRIGGER_SCANNER)}
                        >
                            {scannerRow.triggerScanner ? 'Scanner queued…' : 'Run Context Scanner'}
                        </button>
                    ) : null}
                </div>
            ) : null}

            <div className="workbench-filterbar">
                <label style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: '1 1 200px' }}>
                    <span style={microLabel}>Search</span>
                    <input
                        type="search"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Agent name, pack, repo path…"
                        className="clive-select"
                        style={{ fontSize: '0.84rem', padding: '10px 12px' }}
                    />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <span style={microLabel}>Status</span>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="clive-select"
                        style={{ fontSize: '0.84rem', padding: '10px 12px' }}
                    >
                        <option value="">All</option>
                        {statuses.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </label>
            </div>

            {filtered.length === 0 ? (
                <p style={{ fontFamily: fonts.mono, fontSize: '0.82rem', color: colors.textMuted }}>
                    No agents match this filter.
                </p>
            ) : (
                <div className="workbench-card-list">
                    {filtered.map(row => (
                        <AgentCard key={row.id} row={row} agentsTable={agentsTable} />
                    ))}
                </div>
            )}
        </div>
    );
});
