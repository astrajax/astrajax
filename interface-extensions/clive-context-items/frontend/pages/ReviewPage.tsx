import React, { useMemo, useState } from 'react';
import { colors, fonts, microLabel, space } from '../utils/theme';
import { ITEM_STATUS, REVIEW_STATUSES } from '../utils/constants';
import { matchesSearch } from '../utils/cells';
import type { ContextItemRow } from '../hooks/useContextItems';
import { sortByAgentThenNewest, uniqueAgents } from '../hooks/useContextItems';
import { ItemCard } from '../components/ItemCard';

export type ReviewTab = 'review' | 'draft' | 'proposed' | 'needs_decision' | 'all';

interface ReviewPageProps {
    rows: ContextItemRow[];
    activeTab: ReviewTab;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    itemsTable: any;
}

export function ReviewPage({ rows, activeTab, itemsTable }: ReviewPageProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [agentFilter, setAgentFilter] = useState('all');

    const agents = useMemo(() => uniqueAgents(rows), [rows]);

    const filtered = useMemo(() => {
        let list = rows;

        switch (activeTab) {
            case 'review':
                list = list.filter(row => REVIEW_STATUSES.includes(row.status as typeof REVIEW_STATUSES[number]));
                break;
            case 'draft':
                list = list.filter(row => row.status === ITEM_STATUS.DRAFT);
                break;
            case 'proposed':
                list = list.filter(row => row.status === ITEM_STATUS.PROPOSED || row.status === ITEM_STATUS.AGENT_PROPOSED);
                break;
            case 'needs_decision':
                list = list.filter(row => row.status === ITEM_STATUS.NEEDS_DECISION);
                break;
            default:
                break;
        }

        if (agentFilter !== 'all') {
            list = list.filter(row => {
                const agent = row.proposedByAgent.trim() || '— unset —';
                return agent === agentFilter;
            });
        }

        if (searchQuery.trim()) {
            list = list.filter(row => matchesSearch(
                searchQuery,
                row.title,
                row.canonicalText,
                row.proposedByAgent,
                row.bootstrapSource,
                row.sourceNotes,
                row.createdBy,
            ));
        }

        return sortByAgentThenNewest(list);
    }, [rows, activeTab, agentFilter, searchQuery]);

    const countLabel = `${filtered.length} record${filtered.length === 1 ? '' : 's'}`;

    return (
        <div style={{ fontFamily: fonts.sans }}>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(220px, 1.4fr) minmax(180px, 1fr) auto',
                    gap: space(3),
                    alignItems: 'end',
                    marginBottom: space(4),
                }}
            >
                <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <span style={microLabel}>search title, text, or agent</span>
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={event => setSearchQuery(event.target.value)}
                        placeholder="e.g. Clive Curator, bootstrap, positioning"
                        className="clive-input"
                        style={{ fontSize: '0.78rem', padding: '8px 10px', width: '100%' }}
                    />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <span style={microLabel}>filter by proposed by agent</span>
                    <select
                        value={agentFilter}
                        onChange={event => setAgentFilter(event.target.value)}
                        className="clive-select"
                        style={{ fontSize: '0.74rem', padding: '8px 10px', width: '100%' }}
                    >
                        <option value="all">All agents</option>
                        {agents.map(agent => (
                            <option key={agent} value={agent}>{agent}</option>
                        ))}
                    </select>
                </label>

                <span style={{ ...microLabel, paddingBottom: 8 }}>{countLabel}</span>
            </div>

            <p
                style={{
                    margin: `0 0 ${space(4)}`,
                    fontSize: '0.78rem',
                    color: colors.textMuted,
                    lineHeight: 1.5,
                    maxWidth: 760,
                }}
            >
                <strong style={{ color: colors.text }}>Created By</strong> only says Agent, Matthew, or TL.
                {' '}
                <strong style={{ color: colors.clive }}>Proposed By Agent</strong> names which agent (or build session) put this forward.
                Default sort is by agent, then newest first.
            </p>

            {filtered.length === 0 ? (
                <div
                    style={{
                        padding: space(8),
                        textAlign: 'center',
                        fontFamily: fonts.mono,
                        fontSize: '0.8rem',
                        color: colors.textMuted,
                        background: colors.bgRaised,
                        border: `1px dashed ${colors.border}`,
                    }}
                >
                    No records match this queue and filter.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: space(3) }}>
                    {filtered.map(row => (
                        <ItemCard key={row.id} row={row} itemsTable={itemsTable} />
                    ))}
                </div>
            )}
        </div>
    );
}
