import { initializeBlock } from '@airtable/blocks/interface/ui';
import { type Base } from '@airtable/blocks/interface/models';
import { App } from './App';

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
        console.error('[clive-context-workbench] Swallowed SDK subscriber crash');
    });
    window.addEventListener('error', (event) => {
        if (!looksLikeSDKChangeCrash(event.error)) return;
        event.preventDefault();
        console.error('[clive-context-workbench] Swallowed SDK window error');
    });
}

export function getCustomProperties(base: Base) {
    return [
        {
            key: 'agentsTable',
            label: 'Agent Environments table',
            type: 'table' as const,
            defaultValue: base.tables.find(table => /Agent Environments/i.test(table.name)),
        },
        {
            key: 'itemsTable',
            label: 'Context Items table',
            type: 'table' as const,
            defaultValue: base.tables.find(table => /Context Items/i.test(table.name)),
        },
        {
            key: 'changeLogTable',
            label: 'Change Log table',
            type: 'table' as const,
            defaultValue: base.tables.find(table => /Change Log/i.test(table.name)),
        },
    ];
}

initializeBlock({
    interface: () => <App />,
});
