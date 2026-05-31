import React, { useMemo } from 'react';
import type { OnboardingModule } from '../hooks/useOnboardingModules';
import type { ModuleProgress, ProgressByModuleId } from '../hooks/useOnboardingProgress';
import { DocBody } from './DocBody';
import { ProgressPanel } from './ProgressPanel';
import { colors, fonts, space } from '../utils/theme';

interface DocViewerProps {
    module: OnboardingModule | null;
    progress: ModuleProgress | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    progressTable: any;
    canWriteProgress: boolean;
    canWriteReply: boolean;
}

export function DocViewer({
    module,
    progress,
    progressTable,
    canWriteProgress,
    canWriteReply,
}: DocViewerProps) {
    if (!module) {
        return (
            <div style={{ padding: space(8), color: colors.textMuted, fontFamily: fonts.sans }}>
                Select a section from the sidebar.
            </div>
        );
    }

    return (
        <article className="tl-doc" style={{ padding: space(6), maxWidth: 720, margin: '0 auto' }}>
            <header style={{ marginBottom: space(6), borderBottom: `1px solid ${colors.border}`, paddingBottom: space(4) }}>
                <p style={{
                    margin: 0,
                    fontSize: '0.68rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: colors.sageSignal,
                }}
                >
                    {module.section}
                    {module.essential && ' · Essential'}
                    {progress?.completed && ' · Complete'}
                </p>
                <h1 style={{
                    margin: `${space(2)} 0 0`,
                    fontFamily: fonts.sans,
                    fontSize: '1.75rem',
                    fontWeight: 600,
                    color: colors.parchment,
                    lineHeight: 1.25,
                }}
                >
                    {module.title}
                </h1>
                <p style={{
                    margin: `${space(2)} 0 0`,
                    fontSize: '1rem',
                    color: colors.textMuted,
                    lineHeight: 1.5,
                }}
                >
                    {module.summary}
                </p>
                <p style={{ margin: `${space(2)} 0 0`, fontSize: '0.8rem', color: colors.textDim }}>
                    ~{module.readTimeMin} min read
                </p>
            </header>
            <DocBody
                html={module.htmlBody}
                slidesPdf={module.slidesPdf}
                slidesUrl={module.slidesUrl}
                videoUrl={module.videoUrl}
            />
            <ProgressPanel
                progressTable={progressTable}
                progress={progress}
                moduleTitle={module.title}
                moduleId={module.id}
                canWriteProgress={canWriteProgress}
                canWriteReply={canWriteReply}
            />
        </article>
    );
}
