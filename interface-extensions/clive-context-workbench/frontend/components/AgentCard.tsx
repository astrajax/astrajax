import React, { useState } from 'react';
import { AGENT } from '../utils/constants';
import { githubTreeUrl } from '../utils/github';
import { formatRelative } from '../utils/cells';
import { agentStatusColor, colors, fonts, microLabel, space } from '../utils/theme';
import type { AgentEnvironmentRow } from '../hooks/useAgentEnvironments';

interface AgentCardProps {
    row: AgentEnvironmentRow;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    agentsTable: any;
}

function DisplayOnlyBlock({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ minWidth: 0 }}>
            <div style={{ ...microLabel, marginBottom: 4 }}>
                {label}
                {' '}
                <span style={{ color: colors.textDim, textTransform: 'none', letterSpacing: 0 }}>
                    (reference only)
                </span>
            </div>
            <p
                style={{
                    margin: 0,
                    fontSize: '0.78rem',
                    color: colors.textMuted,
                    lineHeight: 1.5,
                    fontFamily: fonts.mono,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                }}
            >
                {value || '—'}
            </p>
        </div>
    );
}

export const AgentCard = React.memo(function AgentCard({ row, agentsTable }: AgentCardProps) {
    const [busy, setBusy] = useState(false);
    const [notesDraft, setNotesDraft] = useState(row.notes);
    const canWrite = Boolean(agentsTable?.updateRecordAsync);
    const statusColor = agentStatusColor(row.status);
    const repoUrl = row.repoPath ? githubTreeUrl(row.repoPath) : '';

    async function markReviewedToday() {
        if (!agentsTable?.updateRecordAsync) return;
        setBusy(true);
        try {
            await agentsTable.updateRecordAsync(row.id, {
                [AGENT.LAST_CONFIG_REVIEW]: new Date(),
            });
        } catch (error) {
            console.error('[AgentCard] markReviewedToday', error);
            window.alert('Could not update Last Config Review.');
        } finally {
            setBusy(false);
        }
    }

    async function saveNotes() {
        if (!agentsTable?.updateRecordAsync) return;
        setBusy(true);
        try {
            await agentsTable.updateRecordAsync(row.id, {
                [AGENT.NOTES]: notesDraft,
            });
        } catch (error) {
            console.error('[AgentCard] saveNotes', error);
            window.alert('Could not save Notes.');
        } finally {
            setBusy(false);
        }
    }

    return (
        <article
            className="clive-card"
            style={{
                padding: space(4),
                paddingLeft: space(5),
                borderLeft: `2px solid ${statusColor}`,
            }}
        >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: space(2), alignItems: 'center', marginBottom: space(3) }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: colors.text }}>
                    {row.agentName || 'Unnamed agent'}
                </h3>
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
                {row.platform.length > 0 ? (
                    <span style={{ fontSize: '0.7rem', color: colors.textMuted, fontFamily: fonts.mono }}>
                        {row.platform.join(' · ')}
                    </span>
                ) : null}
            </div>

            <p style={{ margin: `0 0 ${space(3)}`, fontSize: '0.84rem', color: colors.textMuted, lineHeight: 1.55 }}>
                {row.purpose || '—'}
            </p>

            {row.repoPath ? (
                <div
                    style={{
                        marginBottom: space(3),
                        padding: space(3),
                        background: colors.cliveSoft,
                        border: `1px solid ${colors.clive}44`,
                    }}
                >
                    <div style={microLabel}>Repo path — edit in Cursor only</div>
                    <a
                        href={repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-block',
                            marginTop: space(2),
                            fontFamily: fonts.mono,
                            fontSize: '0.78rem',
                            color: colors.clive,
                            wordBreak: 'break-all',
                        }}
                    >
                        {row.repoPath}
                    </a>
                    <p style={{ margin: `${space(2)} 0 0`, fontSize: '0.72rem', color: colors.textDim }}>
                        System prompts and skills live in the repo, not in Airtable. Open the path in GitHub, then edit in Cursor.
                    </p>
                </div>
            ) : (
                <p style={{ margin: `0 0 ${space(3)}`, fontSize: '0.78rem', color: colors.warm }}>
                    No Repo Path set — add one on the Agent Environment record.
                </p>
            )}

            {row.packNames.length > 0 ? (
                <div style={{ marginBottom: space(3) }}>
                    <div style={microLabel}>Linked context packs</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: space(2), marginTop: space(2) }}>
                        {row.packNames.map(pack => (
                            <span
                                key={pack}
                                style={{
                                    fontFamily: fonts.mono,
                                    fontSize: '0.68rem',
                                    padding: '3px 8px',
                                    border: `1px solid ${colors.border}`,
                                    color: colors.textMuted,
                                }}
                            >
                                {pack}
                            </span>
                        ))}
                    </div>
                </div>
            ) : (
                <p style={{ margin: `0 0 ${space(3)}`, fontSize: '0.78rem', color: colors.warm }}>
                    No Context Packs linked.
                </p>
            )}

            <div style={{ display: 'grid', gap: space(3) }}>
                <DisplayOnlyBlock label="Runtime environment" value={row.runtimeEnvironment} />
                <DisplayOnlyBlock label="Skills" value={row.skills} />
                <DisplayOnlyBlock label="Tool permissions" value={row.toolPermissions} />
            </div>

            <div
                style={{
                    marginTop: space(4),
                    paddingTop: space(3),
                    borderTop: `1px solid ${colors.border}`,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: space(3),
                    alignItems: 'flex-end',
                }}
            >
                <div>
                    <div style={microLabel}>Last config review</div>
                    <span style={{ fontFamily: fonts.mono, fontSize: '0.78rem', color: colors.textMuted }}>
                        {row.lastConfigReview ? formatRelative(row.lastConfigReview) : 'Never'}
                    </span>
                </div>

                {canWrite ? (
                    <>
                        <button
                            type="button"
                            disabled={busy}
                            className="clive-btn clive-btn-primary"
                            style={{ fontSize: '0.7rem', padding: `${space(2)} ${space(3)}` }}
                            onClick={() => markReviewedToday()}
                        >
                            Mark reviewed today
                        </button>
                        <label style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                            <span style={microLabel}>Notes (editable)</span>
                            <textarea
                                value={notesDraft}
                                disabled={busy}
                                onChange={e => setNotesDraft(e.target.value)}
                                rows={2}
                                className="clive-select"
                                style={{ fontSize: '0.74rem', resize: 'vertical', minHeight: 48 }}
                            />
                        </label>
                        <button
                            type="button"
                            disabled={busy || notesDraft === row.notes}
                            className="clive-btn"
                            style={{ fontSize: '0.7rem', padding: `${space(2)} ${space(3)}` }}
                            onClick={() => saveNotes()}
                        >
                            Save notes
                        </button>
                    </>
                ) : null}
            </div>
        </article>
    );
});
