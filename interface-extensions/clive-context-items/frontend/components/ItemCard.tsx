import React, { useState } from 'react';
import { useSession } from '@airtable/blocks/interface/ui';
import { ItemDetail } from './ItemDetail';
import { resolveConfirmedByHuman } from '../utils/confirmedByHuman';
import { colors, fonts, itemStatusColor, microLabel, space } from '../utils/theme';
import {
    CONFIRMATION_METHODS,
    ITEM,
    ITEM_STATUS,
} from '../utils/constants';
import { formatRelative, truncate } from '../utils/cells';
import type { ContextItemRow } from '../hooks/useContextItems';

interface MetaProps {
    label: string;
    value: string;
    highlight?: boolean;
}

function Meta({ label, value, highlight }: MetaProps) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span style={microLabel}>{label}</span>
            <span
                style={{
                    fontSize: '0.78rem',
                    color: highlight ? colors.clive : colors.text,
                    fontFamily: fonts.mono,
                    wordBreak: 'break-word',
                }}
            >
                {value || '—'}
            </span>
        </div>
    );
}

interface ItemRecordActionsProps {
    row: ContextItemRow;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    itemsTable: any;
}

export const ItemRecordActions = React.memo(function ItemRecordActions({
    row,
    itemsTable,
}: ItemRecordActionsProps) {
    const session = useSession();
    const confirmedBy = resolveConfirmedByHuman(session.currentUser);
    const [busy, setBusy] = useState(false);
    const canWrite = Boolean(itemsTable?.updateRecordAsync);
    const awaitingHuman = !row.confirmedByHuman && row.status !== ITEM_STATUS.APPROVED;

    async function patchStatus(status: string) {
        if (!itemsTable?.updateRecordAsync || !status) return;
        setBusy(true);
        try {
            await itemsTable.updateRecordAsync(row.id, {
                [ITEM.STATUS]: { name: status },
                [ITEM.LAST_REVIEWED]: new Date(),
            });
        } catch (error) {
            console.error('[ItemRecordActions] patchStatus', error);
            window.alert('Could not update Status on this Context Item.');
        } finally {
            setBusy(false);
        }
    }

    async function applyHumanDecision(status: string, notes: string) {
        if (!itemsTable?.updateRecordAsync) return;
        if (!confirmedBy) {
            window.alert(
                'Could not identify you as Matthew or TL. Approve via a direct Airtable edit instead.',
            );
            return;
        }
        setBusy(true);
        try {
            await itemsTable.updateRecordAsync(row.id, {
                [ITEM.STATUS]: { name: status },
                [ITEM.CONFIRMED_BY_HUMAN]: { name: confirmedBy },
                [ITEM.CONFIRMATION_METHOD]: { name: CONFIRMATION_METHODS.INTERFACE_BUTTON },
                [ITEM.APPROVAL_NOTES]: notes,
                [ITEM.LAST_REVIEWED]: new Date(),
            });
        } catch (error) {
            console.error('[ItemRecordActions] updateRecordAsync', error);
            window.alert(
                'Could not update this Context Item. Check that this Interface allows editing approval fields.',
            );
        } finally {
            setBusy(false);
        }
    }

    return (
        <div
            style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'flex-end',
                gap: space(3),
                marginTop: space(3),
                paddingTop: space(3),
                borderTop: `1px solid ${colors.border}`,
            }}
        >
            {canWrite && awaitingHuman && !confirmedBy ? (
                <span style={{ ...microLabel, color: colors.warm, textTransform: 'none', letterSpacing: 0 }}>
                    Approve/Reject unavailable — logged-in user is not mapped to Matthew or TL.
                </span>
            ) : null}

            {canWrite && awaitingHuman && confirmedBy ? (
                <>
                    <button
                        type="button"
                        disabled={busy}
                        className="clive-btn clive-btn-primary"
                        style={{ fontSize: '0.7rem', padding: `${space(2)} ${space(3)}` }}
                        onClick={() => applyHumanDecision(
                            ITEM_STATUS.APPROVED,
                            'Approved via Clive Context Items interface.',
                        )}
                    >
                        Approve
                    </button>
                    <button
                        type="button"
                        disabled={busy}
                        className="clive-btn"
                        style={{ fontSize: '0.7rem', padding: `${space(2)} ${space(3)}` }}
                        onClick={() => applyHumanDecision(
                            ITEM_STATUS.REJECTED,
                            'Rejected via Clive Context Items interface.',
                        )}
                    >
                        Reject
                    </button>
                </>
            ) : null}

            {canWrite ? (
                <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <span style={microLabel}>set status</span>
                    <select
                        aria-label="Context item status"
                        disabled={busy}
                        value={row.status || ''}
                        onChange={e => patchStatus(e.target.value)}
                        className="clive-select"
                        style={{ fontSize: '0.74rem', padding: '6px 9px', maxWidth: 'min(100%, 220px)' }}
                    >
                        {!row.status ? <option value="" disabled>—</option> : null}
                        <option value={ITEM_STATUS.DRAFT}>{ITEM_STATUS.DRAFT}</option>
                        <option value={ITEM_STATUS.AGENT_PROPOSED}>{ITEM_STATUS.AGENT_PROPOSED}</option>
                        <option value={ITEM_STATUS.PROPOSED}>{ITEM_STATUS.PROPOSED}</option>
                        <option value={ITEM_STATUS.NEEDS_DECISION}>{ITEM_STATUS.NEEDS_DECISION}</option>
                        <option value={ITEM_STATUS.APPROVED}>{ITEM_STATUS.APPROVED}</option>
                        <option value={ITEM_STATUS.REJECTED}>{ITEM_STATUS.REJECTED}</option>
                    </select>
                </label>
            ) : itemsTable != null && !canWrite ? (
                <span style={{ ...microLabel, color: colors.textMuted, textTransform: 'none', letterSpacing: 0 }}>
                    Inline approval unavailable (no write access on this Interface).
                </span>
            ) : null}
        </div>
    );
});

interface ItemCardProps {
    row: ContextItemRow;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    itemsTable: any;
}

export const ItemCard = React.memo(function ItemCard({ row, itemsTable }: ItemCardProps) {
    const [expanded, setExpanded] = useState(false);
    const statusColor = itemStatusColor(row.status);
    const agentLabel = row.proposedByAgent.trim() || '— unset —';
    const trace = row.bootstrapSource || row.sourceNotes || '—';

    return (
        <article
            className="clive-card"
            style={{
                padding: space(4),
                paddingLeft: space(5),
                fontFamily: fonts.sans,
                borderLeft: `2px solid ${statusColor}`,
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: space(2),
                    alignItems: 'center',
                    marginBottom: space(3),
                }}
            >
                <span
                    style={{
                        fontFamily: fonts.mono,
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: colors.clive,
                        background: colors.cliveSoft,
                        border: `1px solid ${colors.clive}55`,
                        padding: '4px 10px',
                        maxWidth: '100%',
                        wordBreak: 'break-word',
                    }}
                    title="Proposed By Agent — which agent proposed this item"
                >
                    Agent: {agentLabel}
                </span>
                <span
                    style={{
                        fontFamily: fonts.mono,
                        fontSize: '0.64rem',
                        fontWeight: 600,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: statusColor,
                        background: `${statusColor}1A`,
                        border: `1px solid ${statusColor}55`,
                        padding: '2px 8px',
                    }}
                >
                    {row.status || '—'}
                </span>
                <span style={{ fontSize: '0.7rem', color: colors.textMuted, fontFamily: fonts.mono }}>
                    {row.category || '—'}
                </span>
                <span style={{ ...microLabel, marginLeft: 'auto' }}>
                    {formatRelative(row.createdAt)}
                </span>
            </div>

            <h3
                style={{
                    margin: 0,
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: colors.text,
                    lineHeight: 1.35,
                }}
            >
                {row.title || 'Untitled context item'}
            </h3>

            <p style={{ margin: `${space(2)} 0 0`, fontSize: '0.84rem', color: colors.textMuted, lineHeight: 1.55 }}>
                {truncate(row.canonicalText, 240)}
            </p>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: space(3),
                    marginTop: space(3),
                }}
            >
                <Meta label="created by" value={row.createdBy} />
                <Meta label="confirmed by" value={row.confirmedByHuman} />
                <Meta label="owner" value={row.owner} />
                <Meta label="authority" value={row.authority} />
                <Meta label="source" value={trace} highlight={Boolean(row.bootstrapSource)} />
            </div>

            <div style={{ marginTop: space(3), paddingTop: space(3), borderTop: `1px solid ${colors.border}` }}>
                <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    className="clive-btn"
                    style={{ fontSize: '0.7rem', padding: `${space(2)} ${space(3)}` }}
                    aria-expanded={expanded}
                >
                    {expanded ? 'Hide details' : 'Show details'}
                </button>
                {expanded ? <ItemDetail row={row} itemsTable={itemsTable} /> : null}
            </div>

            <ItemRecordActions row={row} itemsTable={itemsTable} />
        </article>
    );
});
