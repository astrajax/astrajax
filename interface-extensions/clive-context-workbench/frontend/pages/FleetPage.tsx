import React, { useMemo, useState } from 'react';
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

export const FleetPage = React.memo(function FleetPage({ rows, agentsTable }: FleetPageProps) {
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
            <p style={{ margin: `0 0 ${space(4)}`, fontSize: '0.82rem', color: colors.textMuted, maxWidth: 720, lineHeight: 1.5 }}>
                Agent roster with linked packs and repo paths. Runtime, skills, and permissions are
                {' '}
                <strong style={{ color: colors.text }}>reference only</strong>
                {' '}
                — edit behaviour in Cursor, not here.
            </p>

            {canWrite && (curatorRow || scannerRow) ? (
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: space(2),
                        marginBottom: space(4),
                        padding: space(3),
                        border: `1px solid ${colors.border}`,
                        background: colors.cliveSoft,
                    }}
                >
                    <span style={{ ...microLabel, alignSelf: 'center', marginRight: space(2) }}>Quick ops</span>
                    {curatorRow ? (
                        <button
                            type="button"
                            disabled={opsBusy || curatorRow.triggerCurator}
                            className="clive-btn clive-btn-primary"
                            style={{ fontSize: '0.7rem', padding: `${space(2)} ${space(3)}` }}
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
                            style={{ fontSize: '0.7rem', padding: `${space(2)} ${space(3)}` }}
                            onClick={() => pulseRowTrigger(scannerRow.id, AGENT.TRIGGER_SCANNER)}
                        >
                            {scannerRow.triggerScanner ? 'Scanner queued…' : 'Run Context Scanner'}
                        </button>
                    ) : null}
                </div>
            ) : null}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: space(3), marginBottom: space(4) }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: '1 1 200px' }}>
                    <span style={microLabel}>Search</span>
                    <input
                        type="search"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Agent name, pack, repo path…"
                        className="clive-select"
                        style={{ fontSize: '0.74rem', padding: '8px 10px' }}
                    />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <span style={microLabel}>Status</span>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="clive-select"
                        style={{ fontSize: '0.74rem', padding: '8px 10px' }}
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: space(4) }}>
                    {filtered.map(row => (
                        <AgentCard key={row.id} row={row} agentsTable={agentsTable} />
                    ))}
                </div>
            )}
        </div>
    );
});
