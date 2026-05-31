import React, { useEffect, useMemo, useState } from 'react';
import { useCustomProperties } from '@airtable/blocks/interface/ui';
import './styles.css';
import { Sidebar } from './components/Sidebar';
import { DocViewer } from './components/DocViewer';
import { IdeaLogButton } from './components/IdeaLogButton';
import { useOnboardingModules } from './hooks/useOnboardingModules';
import {
    countCompleted,
    countOpenQuestions,
    useOnboardingProgress,
} from './hooks/useOnboardingProgress';
import { getCustomProperties } from './index';
import { PROGRESS_FIELDS } from './utils/constants';
import { colors, fonts, space } from './utils/theme';

function useWritePermissions(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    progressTable: any,
    sampleRecordId: string | undefined,
): { canWriteProgress: boolean; canWriteReply: boolean } {
    return useMemo(() => {
        if (!progressTable || !sampleRecordId) {
            return { canWriteProgress: false, canWriteReply: false };
        }
        const notesField = progressTable.getFieldByNameIfExists(PROGRESS_FIELDS.TL_NOTES);
        const replyField = progressTable.getFieldByNameIfExists(PROGRESS_FIELDS.MATTHEW_REPLY);
        let canWriteProgress = false;
        let canWriteReply = false;
        if (notesField) {
            canWriteProgress = progressTable.checkPermissionsForUpdateRecord(
                sampleRecordId,
                { [notesField.id]: 'x' },
            ).hasPermission;
        }
        if (replyField) {
            canWriteReply = progressTable.checkPermissionsForUpdateRecord(
                sampleRecordId,
                { [replyField.id]: 'x' },
            ).hasPermission;
        }
        return { canWriteProgress, canWriteReply };
    }, [progressTable, sampleRecordId]);
}

export function App() {
    const { customPropertyValueByKey, errorState } = useCustomProperties(getCustomProperties);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onboardingTable = customPropertyValueByKey.onboardingTable as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const progressTable = customPropertyValueByKey.progressTable as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ideaLogTable = customPropertyValueByKey.ideaLogTable as any;

    const modules = useOnboardingModules(onboardingTable);
    const progressByModule = useOnboardingProgress(progressTable);
    const [activeId, setActiveId] = useState<string | null>(null);

    const progressRecords = useMemo(
        () => Array.from(progressByModule.values()),
        [progressByModule],
    );
    const sampleProgressRecordId = progressRecords[0]?.id;

    const { canWriteProgress, canWriteReply } = useWritePermissions(
        progressTable,
        sampleProgressRecordId,
    );

    const totalReadMin = useMemo(
        () => modules.reduce((sum, m) => sum + m.readTimeMin, 0),
        [modules],
    );
    const completedCount = countCompleted(progressByModule);
    const openQuestions = countOpenQuestions(progressByModule);

    useEffect(() => {
        if (modules.length && !activeId) {
            setActiveId(modules[0].id);
        }
    }, [modules, activeId]);

    const activeModule = modules.find(m => m.id === activeId) ?? null;
    const activeProgress = activeId ? progressByModule.get(activeId) : undefined;

    if (errorState) {
        return (
            <div className="tl-root" style={{ padding: space(6), color: colors.burntApricot, fontFamily: fonts.sans }}>
                Configuration error: {errorState.error.message}
            </div>
        );
    }

    if (!onboardingTable) {
        return (
            <div className="tl-root" style={{ padding: space(6), color: colors.textMuted, fontFamily: fonts.sans }}>
                Select the <strong>TL Onboarding</strong> table in this extension&apos;s settings.
            </div>
        );
    }

    if (!modules.length) {
        return (
            <div className="tl-root" style={{ padding: space(6), color: colors.textMuted, fontFamily: fonts.sans }}>
                No onboarding modules found. Run <code>python3 scripts/seed_tl_onboarding.py</code> to populate the table.
            </div>
        );
    }

    return (
        <div
            className="tl-root"
            style={{
                display: 'flex',
                minHeight: '100%',
                color: colors.parchment,
                fontFamily: fonts.sans,
            }}
        >
            <Sidebar
                modules={modules}
                progressByModule={progressByModule}
                activeId={activeId}
                onSelect={setActiveId}
                totalReadMin={totalReadMin}
                completedCount={completedCount}
                openQuestions={openQuestions}
            />
            <main style={{ flex: 1, overflowY: 'auto', background: colors.deepMoss }}>
                {!progressTable && (
                    <div className="tl-banner tl-banner--warn">
                        Progress table not configured — you can read modules but cannot save notes or mark complete.
                    </div>
                )}
                <DocViewer
                    module={activeModule}
                    progress={activeProgress}
                    progressTable={progressTable}
                    canWriteProgress={canWriteProgress}
                    canWriteReply={canWriteReply}
                />
            </main>
            <IdeaLogButton ideaLogTable={ideaLogTable} source="TL Onboarding" />
        </div>
    );
}
