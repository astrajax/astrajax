import { initializeBlock } from '@airtable/blocks/interface/ui';
import { type Base } from '@airtable/blocks/interface/models';
import { App } from './App';

// SDK subscriber crash guard (same pattern as performance-analysis-dashboard).
if (typeof window !== 'undefined') {
    const SDK_CRASH_SIGNATURE = /(getFieldById|primaryField|triggerOnChangeForDirtyPaths|_processPublicLiveappMessageQueueAsync)/;
    const looksLikeSDKChangeCrash = (err: unknown): boolean => {
        if (!err) return false;
        const stack = err instanceof Error ? (err.stack ?? '') : String(err);
        return SDK_CRASH_SIGNATURE.test(stack);
    };
    window.addEventListener('unhandledrejection', (event) => {
        if (!looksLikeSDKChangeCrash(event.reason)) return;
        event.preventDefault();
        const reason = event.reason;
        const message = reason instanceof Error ? reason.message : String(reason);
        console.error('[clive-context-intake] Swallowed SDK subscriber crash:', message);
    });
    window.addEventListener('error', (event) => {
        if (!looksLikeSDKChangeCrash(event.error)) return;
        event.preventDefault();
        console.error('[clive-context-intake] Swallowed SDK window error:', event.message);
    });
}

export function getCustomProperties(base: Base) {
    return [
        {
            key: 'intakeTable',
            label: 'Context Intake table',
            type: 'table' as const,
            defaultValue: base.tables.find(t => /Context Intake/i.test(t.name)),
        },
    ];
}

initializeBlock({
    interface: () => <App />,
});
