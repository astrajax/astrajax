import React, { useEffect, useState } from 'react';
import { ITEM } from '../utils/constants';
import { colors, fonts, microLabel, space } from '../utils/theme';
import { DetailField } from './DetailField';

interface CanonicalTextEditorProps {
    recordId: string;
    value: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    itemsTable: any;
}

export function CanonicalTextEditor({ recordId, value, itemsTable }: CanonicalTextEditorProps) {
    const [draft, setDraft] = useState(value);
    const [busy, setBusy] = useState(false);
    const canWrite = Boolean(itemsTable?.updateRecordAsync);

    useEffect(() => {
        setDraft(value);
    }, [value, recordId]);

    const dirty = draft !== value;

    async function save() {
        if (!itemsTable?.updateRecordAsync || !dirty) return;
        setBusy(true);
        try {
            await itemsTable.updateRecordAsync(recordId, {
                [ITEM.CANONICAL_TEXT]: draft,
                [ITEM.LAST_REVIEWED]: new Date(),
            });
        } catch (error) {
            console.error('[CanonicalTextEditor] save', error);
            window.alert('Could not save Canonical Text. Check that this Interface allows editing that field.');
        } finally {
            setBusy(false);
        }
    }

    if (!canWrite) {
        return <DetailField label="Full text" value={value} multiline />;
    }

    return (
        <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: space(2) }}>
                <span style={microLabel}>Full text — editable</span>
                <textarea
                    value={draft}
                    disabled={busy}
                    onChange={e => setDraft(e.target.value)}
                    rows={8}
                    className="clive-select"
                    style={{
                        fontSize: '0.8rem',
                        lineHeight: 1.55,
                        resize: 'vertical',
                        minHeight: 120,
                        fontFamily: fonts.sans,
                        color: colors.textMuted,
                    }}
                />
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: space(2), alignItems: 'center', marginTop: space(2) }}>
                <button
                    type="button"
                    disabled={busy || !dirty}
                    className="clive-btn clive-btn-primary"
                    style={{ fontSize: '0.7rem', padding: `${space(2)} ${space(3)}` }}
                    onClick={() => save()}
                >
                    Save text
                </button>
                {dirty ? (
                    <button
                        type="button"
                        disabled={busy}
                        className="clive-btn"
                        style={{ fontSize: '0.7rem', padding: `${space(2)} ${space(3)}` }}
                        onClick={() => setDraft(value)}
                    >
                        Discard
                    </button>
                ) : null}
                <span style={{ ...microLabel, color: colors.textDim, textTransform: 'none', letterSpacing: 0 }}>
                    Quick fix — saves straight to Airtable
                </span>
            </div>
        </div>
    );
}
