import React, { useCallback, useEffect, useState } from 'react';
import type { ModuleProgress } from '../hooks/useOnboardingProgress';
import { PROGRESS_FIELDS, QUESTION_STATUS } from '../utils/constants';
import { colors, fonts, space } from '../utils/theme';

interface ProgressPanelProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    progressTable: any;
    progress: ModuleProgress | undefined;
    moduleTitle: string;
    moduleId: string;
    canWriteProgress: boolean;
    canWriteReply: boolean;
}

function fieldPayload(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    table: any,
    fields: Record<string, unknown>,
): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [name, value] of Object.entries(fields)) {
        const field = table.getFieldByNameIfExists(name);
        if (field) out[field.id] = value;
    }
    return out;
}

export function ProgressPanel({
    progressTable,
    progress,
    moduleTitle,
    moduleId,
    canWriteProgress,
    canWriteReply,
}: ProgressPanelProps) {
    const [notes, setNotes] = useState('');
    const [question, setQuestion] = useState('');
    const [reply, setReply] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setNotes(progress?.tlNotes ?? '');
        setQuestion(progress?.question ?? '');
        setReply(progress?.matthewReply ?? '');
        setError(null);
    }, [progress?.id, progress?.tlNotes, progress?.question, progress?.matthewReply]);

    const saveProgress = useCallback(async (fields: Record<string, unknown>) => {
        if (!progressTable || !progress) return;
        setSaving(true);
        setError(null);
        try {
            const payload = fieldPayload(progressTable, fields);
            await progressTable.updateRecordAsync(progress.id, payload);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not save');
        } finally {
            setSaving(false);
        }
    }, [progressTable, progress]);

    const toggleComplete = async () => {
        if (!canWriteProgress || !progress) return;
        await saveProgress({ [PROGRESS_FIELDS.COMPLETED]: !progress.completed });
    };

    const saveNotes = async () => {
        if (!canWriteProgress || !progress) return;
        if (notes === (progress.tlNotes ?? '')) return;
        await saveProgress({ [PROGRESS_FIELDS.TL_NOTES]: notes });
    };

    const submitQuestion = async () => {
        if (!canWriteProgress || !progress || !question.trim()) return;
        await saveProgress({
            [PROGRESS_FIELDS.QUESTION]: question.trim(),
            [PROGRESS_FIELDS.QUESTION_STATUS]: QUESTION_STATUS.OPEN,
        });
    };

    const saveReply = async (markAnswered: boolean) => {
        if (!canWriteReply || !progress) return;
        const fields: Record<string, unknown> = {
            [PROGRESS_FIELDS.MATTHEW_REPLY]: reply.trim(),
        };
        if (markAnswered && reply.trim()) {
            fields[PROGRESS_FIELDS.QUESTION_STATUS] = QUESTION_STATUS.ANSWERED;
        }
        await saveProgress(fields);
    };

    if (!progress) {
        return (
            <section className="tl-progress tl-progress--missing" style={{ marginTop: space(6) }}>
                <p style={{ color: colors.textMuted, fontSize: '0.9rem' }}>
                    Progress tracking is not set up for this section. Ask Matthew to run{' '}
                    <code>python3 scripts/seed_tl_onboarding.py --progress-only</code>.
                </p>
            </section>
        );
    }

    const isOpen = progress.questionStatus === QUESTION_STATUS.OPEN;
    const isAnswered = progress.questionStatus === QUESTION_STATUS.ANSWERED;

    return (
        <section className="tl-progress" style={{ marginTop: space(8) }}>
            <div className="tl-progress-header">
                <h2>Your progress</h2>
                {saving && <span className="tl-progress-meta">Saving…</span>}
            </div>

            {error && (
                <p className="tl-progress-error">{error}</p>
            )}

            <label className={`tl-complete-row${progress.completed ? ' is-done' : ''}`}>
                <input
                    type="checkbox"
                    checked={progress.completed}
                    disabled={!canWriteProgress}
                    onChange={() => { void toggleComplete(); }}
                />
                <span>Mark &ldquo;{moduleTitle}&rdquo; as complete</span>
            </label>

            <div className="tl-field">
                <label htmlFor={`notes-${moduleId}`}>Your notes</label>
                <textarea
                    id={`notes-${moduleId}`}
                    className="tl-textarea"
                    rows={4}
                    placeholder="Jot down anything you want to remember — only you and Matthew see this."
                    value={notes}
                    disabled={!canWriteProgress}
                    onChange={e => setNotes(e.target.value)}
                    onBlur={() => { void saveNotes(); }}
                />
            </div>

            <div className="tl-field">
                <label htmlFor={`question-${moduleId}`}>Question for Matthew</label>
                <textarea
                    id={`question-${moduleId}`}
                    className="tl-textarea"
                    rows={3}
                    placeholder="Not sure about a claim, priority, or wording? Ask here."
                    value={question}
                    disabled={!canWriteProgress}
                    onChange={e => setQuestion(e.target.value)}
                />
                {canWriteProgress && (
                    <button
                        type="button"
                        className="tl-btn tl-btn--primary"
                        disabled={!question.trim() || saving}
                        onClick={() => { void submitQuestion(); }}
                    >
                        Send question to Matthew
                    </button>
                )}
                {isOpen && !isAnswered && (
                    <p className="tl-status tl-status--open">Waiting for Matthew&apos;s reply</p>
                )}
            </div>

            {(isAnswered || progress.matthewReply) && (
                <div className="tl-reply-box">
                    <p className="tl-reply-label">Matthew&apos;s reply</p>
                    {canWriteReply ? (
                        <>
                            <textarea
                                className="tl-textarea"
                                rows={3}
                                placeholder="Write your reply for Tara…"
                                value={reply}
                                onChange={e => setReply(e.target.value)}
                            />
                            <div className="tl-btn-row">
                                <button
                                    type="button"
                                    className="tl-btn tl-btn--primary"
                                    disabled={!reply.trim() || saving}
                                    onClick={() => { void saveReply(true); }}
                                >
                                    Send reply &amp; mark answered
                                </button>
                                <button
                                    type="button"
                                    className="tl-btn tl-btn--ghost"
                                    disabled={saving}
                                    onClick={() => { void saveReply(false); }}
                                >
                                    Save draft
                                </button>
                            </div>
                        </>
                    ) : (
                        <p className="tl-reply-text">{progress.matthewReply || '—'}</p>
                    )}
                </div>
            )}

            {canWriteReply && isOpen && !progress.matthewReply && (
                <div className="tl-reply-box tl-reply-box--matthew">
                    <p className="tl-reply-label">Reply to Tara</p>
                    <textarea
                        className="tl-textarea"
                        rows={3}
                        placeholder="Write your reply…"
                        value={reply}
                        onChange={e => setReply(e.target.value)}
                    />
                    <button
                        type="button"
                        className="tl-btn tl-btn--primary"
                        disabled={!reply.trim() || saving}
                        onClick={() => { void saveReply(true); }}
                    >
                        Send reply &amp; mark answered
                    </button>
                </div>
            )}
        </section>
    );
}
