import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { IDEA_FIELDS, IDEA_TYPES } from '../utils/constants';

interface IdeaLogButtonProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ideaLogTable: any;
    source?: string;
}

type IdeaType = (typeof IDEA_TYPES)[number];

export function IdeaLogButton({ ideaLogTable, source = 'TL Onboarding' }: IdeaLogButtonProps) {
    const [open, setOpen] = useState(false);
    const [idea, setIdea] = useState('');
    const [detail, setDetail] = useState('');
    const [type, setType] = useState<IdeaType>('AI could do this');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    const canCreate = useMemo(() => {
        if (!ideaLogTable) return false;
        try {
            return ideaLogTable.checkPermissionsForCreateRecord().hasPermission as boolean;
        } catch {
            return false;
        }
    }, [ideaLogTable]);

    const reset = useCallback(() => {
        setIdea('');
        setDetail('');
        setType('AI could do this');
        setError(null);
        setDone(false);
    }, []);

    const close = useCallback(() => {
        setOpen(false);
        // brief delay so the closing animation doesn't show a reset form
        setTimeout(reset, 200);
    }, [reset]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') close();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, close]);

    const submit = useCallback(async () => {
        if (!ideaLogTable || !idea.trim()) return;
        setSaving(true);
        setError(null);
        try {
            await ideaLogTable.createRecordAsync({
                [IDEA_FIELDS.IDEA]: idea.trim(),
                [IDEA_FIELDS.DETAIL]: detail.trim(),
                [IDEA_FIELDS.TYPE]: { name: type },
                [IDEA_FIELDS.STATUS]: { name: 'New' },
                [IDEA_FIELDS.SOURCE]: source,
            });
            setDone(true);
            setTimeout(close, 1400);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not save the idea.');
        } finally {
            setSaving(false);
        }
    }, [ideaLogTable, idea, detail, type, source, close]);

    // If the table isn't wired up yet, hide the button entirely.
    if (!ideaLogTable) return null;

    return (
        <>
            <button
                type="button"
                className="tl-idea-fab"
                onClick={() => setOpen(true)}
                title="AI-first: could AI do this quicker or better? Log the idea."
            >
                <span className="tl-idea-fab-bulb" aria-hidden>✦</span>
                Log an idea
            </button>

            {open && (
                <div className="tl-idea-overlay" onClick={close}>
                    <div
                        className="tl-idea-modal"
                        role="dialog"
                        aria-label="Log an idea"
                        onClick={e => e.stopPropagation()}
                    >
                        {done ? (
                            <div className="tl-idea-done">
                                <p className="tl-idea-done-mark" aria-hidden>✓</p>
                                <p>Logged. Thank you — that&apos;s the AI-first instinct.</p>
                            </div>
                        ) : (
                            <>
                                <div className="tl-idea-head">
                                    <h2>Log an idea</h2>
                                    <button type="button" className="tl-idea-close" onClick={close} aria-label="Close">×</button>
                                </div>
                                <p className="tl-idea-prompt">
                                    Could AI do something here quicker or better? Spotted a smarter process or asset?
                                    Capture it — no idea is too small.
                                </p>

                                {!canCreate && (
                                    <p className="tl-idea-error">
                                        You don&apos;t have permission to add to the Idea Log. Ask Matthew to share the
                                        AI Idea Log table with edit access.
                                    </p>
                                )}
                                {error && <p className="tl-idea-error">{error}</p>}

                                <label className="tl-idea-label" htmlFor="idea-title">The idea</label>
                                <input
                                    id="idea-title"
                                    className="tl-idea-input"
                                    placeholder="e.g. AI could draft the first pass of the audit one-pager"
                                    value={idea}
                                    disabled={!canCreate || saving}
                                    onChange={e => setIdea(e.target.value)}
                                    autoFocus
                                />

                                <label className="tl-idea-label" htmlFor="idea-detail">A little more (optional)</label>
                                <textarea
                                    id="idea-detail"
                                    className="tl-textarea"
                                    rows={3}
                                    placeholder="What's the task today, and where could AI take over?"
                                    value={detail}
                                    disabled={!canCreate || saving}
                                    onChange={e => setDetail(e.target.value)}
                                />

                                <label className="tl-idea-label" htmlFor="idea-type">Type</label>
                                <select
                                    id="idea-type"
                                    className="tl-idea-select"
                                    value={type}
                                    disabled={!canCreate || saving}
                                    onChange={e => setType(e.target.value as IdeaType)}
                                >
                                    {IDEA_TYPES.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>

                                <div className="tl-btn-row">
                                    <button
                                        type="button"
                                        className="tl-btn tl-btn--primary"
                                        disabled={!canCreate || !idea.trim() || saving}
                                        onClick={() => { void submit(); }}
                                    >
                                        {saving ? 'Saving…' : 'Log it'}
                                    </button>
                                    <button type="button" className="tl-btn tl-btn--ghost" onClick={close}>
                                        Cancel
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
