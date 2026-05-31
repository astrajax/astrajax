import React from 'react';
import { embedUrlForPdf } from '../utils/pdfUrl';

export interface SlideAttachment {
    url: string;
    filename: string;
}

interface SlidesResourceProps {
    attachments: SlideAttachment[];
    externalUrl?: string;
    /** When true, show PDF inline (iframe) as well as open-in-tab link. Default true. */
    embed?: boolean;
    linkLabel?: string;
}

export function SlidesResource({
    attachments,
    externalUrl,
    embed = true,
    linkLabel,
}: SlidesResourceProps) {
    const hasUrl = Boolean(externalUrl?.trim());
    if (!attachments.length && !hasUrl) return null;

    const primary = attachments[0];
    const externalEmbed = hasUrl ? embedUrlForPdf(externalUrl!) : null;
    const attachmentEmbed = embed && primary?.url ? primary.url : null;
    const iframeSrc = attachmentEmbed ?? externalEmbed;

    return (
        <div className="tl-resource-card tl-resource-card--slides">
            {embed && iframeSrc && (
                <div className="tl-pdf-embed-wrap">
                    <iframe
                        className="tl-pdf-embed"
                        src={iframeSrc}
                        title={primary?.filename || linkLabel || 'Slide deck'}
                    />
                </div>
            )}
            {attachments.map((file, i) => (
                <p key={i} className="tl-resource-note">
                    <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tl-slides-link"
                    >
                        Open {file.filename || 'slides (PDF)'}
                    </a>
                    <span className="tl-slides-hint"> — full screen in a new tab</span>
                </p>
            ))}
            {hasUrl && (
                <p className="tl-resource-note">
                    <a
                        href={externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tl-slides-link"
                    >
                        {linkLabel ?? 'Open slides (PDF)'}
                    </a>
                    <span className="tl-slides-hint"> — external link</span>
                </p>
            )}
        </div>
    );
}
