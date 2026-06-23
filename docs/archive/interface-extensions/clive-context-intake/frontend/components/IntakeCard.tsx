import React, { useState } from 'react';
import { IntakeDetail } from './IntakeDetail';
import { colors, fonts, microLabel, space, destinationColor, statusColor } from '../utils/theme';
import { INTAKE, REVIEW_STATUS_OPTIONS } from '../utils/constants';
import { formatRelative, truncate } from '../utils/cells';
import type { IntakeRow } from '../hooks/useContextIntake';

const selectStyle: React.CSSProperties = {
    fontSize: '0.74rem',
    padding: '6px 9px',
    maxWidth: 'min(100%, 220px)',
};

interface IntakeRecordActionsProps {
    row: IntakeRow;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    intakeTable: any;
}

export const IntakeRecordActions = React.memo(function IntakeRecordActions({
    row,
    intakeTable,
}: IntakeRecordActionsProps) {
    const [busy, setBusy] = useState(false);
    const canWrite = Boolean(intakeTable?.updateRecordAsync);

    async function patchStatus(optionName: string) {
        if (!intakeTable?.updateRecordAsync || !optionName) return;
        setBusy(true);
        try {
            await intakeTable.updateRecordAsync(row.id, {
                [INTAKE.STATUS]: { name: optionName },
            });
        } catch (e) {
            console.error('[IntakeRecordActions] updateRecordAsync', e);
            window.alert(
                'Could not update Status. Check that this Interface allows editing Status on Context Intake.',
            );
        } finally {
            setBusy(false);
        }
    }

    const statusUnknown = row.status && !REVIEW_STATUS_OPTIONS.includes(row.status as typeof REVIEW_STATUS_OPTIONS[number]);

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
            {canWrite ? (
                <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <span style={microLabel}>set status</span>
                    <select
                        aria-label="Intake status"
                        disabled={busy}
                        value={row.status || ''}
                        onChange={e => patchStatus(e.target.value)}
                        className="clive-select"
                        style={selectStyle}
                    >
                        {!row.status ? (
                            <option value="" disabled>—</option>
                        ) : null}
                        {statusUnknown ? (
                            <option value={row.status}>{row.status}</option>
                        ) : null}
                        {REVIEW_STATUS_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </label>
            ) : intakeTable != null && !canWrite ? (
                <span style={{ ...microLabel, color: colors.textMuted, textTransform: 'none', letterSpacing: 0 }}>
                    Inline status edits unavailable (no write access on this Interface).
                </span>
            ) : null}
        </div>
    );
});

interface IntakeCardProps {
    row: IntakeRow;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    intakeTable: any;
    showActions?: boolean;
}

interface MetaProps {
    label: string;
    value: string;
}

function Meta({ label, value }: MetaProps) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span style={microLabel}>{label}</span>
            <span style={{ fontSize: '0.78rem', color: colors.text, fontFamily: fonts.mono }}>
                {value || '—'}
            </span>
        </div>
    );
}

export const IntakeCard = React.memo(function IntakeCard({
    row,
    intakeTable,
    showActions = true,
}: IntakeCardProps) {
    const [expanded, setExpanded] = useState(false);
    const summary = row.cleanSummary || row.rawSubmission;
    const sColor = statusColor(row.status);

    return (
        <article
            className="clive-card"
            style={{
                padding: space(4),
                paddingLeft: space(5),
                fontFamily: fonts.sans,
                // status accent on the leading edge
                borderLeft: `2px solid ${sColor}`,
            }}
        >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: space(2), alignItems: 'center', marginBottom: space(2) }}>
                <span
                    style={{
                        fontFamily: fonts.mono,
                        fontSize: '0.64rem',
                        fontWeight: 600,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: sColor,
                        background: `${sColor}1A`,
                        border: `1px solid ${sColor}55`,
                        padding: '2px 8px',
                    }}
                >
                    {row.status || '—'}
                </span>
                <span style={{ fontSize: '0.7rem', color: colors.textMuted, fontFamily: fonts.mono }}>
                    {row.category || '—'}
                </span>
                <span
                    style={{
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        fontFamily: fonts.mono,
                        color: destinationColor(row.destination),
                    }}
                >
                    → {row.destination || '—'}
                </span>
                {row.secondaryDestination ? (
                    <span style={{ fontSize: '0.7rem', color: colors.textDim, fontFamily: fonts.mono }}>
                        + {row.secondaryDestination}
                    </span>
                ) : null}
                <span style={{ ...microLabel, marginLeft: 'auto' }}>
                    {formatRelative(row.createdAt)}
                </span>
            </div>

            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: colors.text, lineHeight: 1.35, letterSpacing: '0.01em' }}>
                {row.title || 'Untitled intake'}
            </h3>

            <p style={{ margin: `${space(2)} 0 0`, fontSize: '0.84rem', color: colors.textMuted, lineHeight: 1.55 }}>
                {truncate(summary, 220)}
            </p>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                    gap: space(3),
                    marginTop: space(3),
                }}
            >
                <Meta label="owner" value={row.nextOwner} />
                <Meta label="by" value={row.submittedBy} />
                <Meta label="via" value={row.sourceInterface} />
                <Meta label="action" value={row.suggestedAction} />
                <Meta label="confidence" value={row.confidence} />
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
                {expanded ? <IntakeDetail row={row} /> : null}
            </div>

            {showActions ? (
                <IntakeRecordActions row={row} intakeTable={intakeTable} />
            ) : null}
        </article>
    );
});
