import { initializeBlock } from '@airtable/blocks/interface/ui';
import { type Base } from '@airtable/blocks/interface/models';
import { App } from './App';

export function getCustomProperties(base: Base) {
    const onboardingTable = base.tables.find(t => /TL Onboarding/i.test(t.name) && !/Progress/i.test(t.name));
    return [
        {
            key: 'onboardingTable',
            label: 'TL Onboarding table',
            type: 'table' as const,
            defaultValue: onboardingTable,
        },
        {
            key: 'progressTable',
            label: 'TL Onboarding Progress table',
            type: 'table' as const,
            defaultValue: base.tables.find(t => /TL Onboarding Progress/i.test(t.name)),
        },
        {
            key: 'ideaLogTable',
            label: 'AI Idea Log table (for the Log an idea button)',
            type: 'table' as const,
            defaultValue: base.tables.find(t => /Idea Log/i.test(t.name)),
        },
    ];
}

initializeBlock({
    interface: () => <App />,
});
