import React, { useMemo } from 'react';
import type { CellAttachment } from '../utils/cells';
import { ExternalVideoEmbed } from './ExternalVideoEmbed';
import { SlidesResource } from './SlidesResource';
import { YouTubeEmbed } from './YouTubeEmbed';

const YOUTUBE_PLACEHOLDER = /<div\s+class="tl-youtube"([^>]*)><\/div>/gi;
const EXTERNAL_VIDEO_PLACEHOLDER = /<div\s+class="tl-external-video"([^>]*)><\/div>/gi;
const SLIDES_PLACEHOLDER = /<div\s+class="tl-slides"([^>]*)><\/div>/gi;

function parseAttrs(attrString: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    const re = /data-([a-z-]+)="([^"]*)"/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(attrString)) !== null) {
        attrs[m[1]] = m[2];
    }
    return attrs;
}

type Segment =
    | { type: 'html'; content: string }
    | { type: 'youtube'; videoId: string; title?: string }
    | { type: 'external-video'; title?: string }
    | { type: 'slides'; linkLabel?: string };

type Marker = { index: number; length: number; segment: Exclude<Segment, { type: 'html' }> };

function findMarkers(html: string): Marker[] {
    const markers: Marker[] = [];

    let match: RegExpExecArray | null;
    const ytRe = new RegExp(YOUTUBE_PLACEHOLDER.source, 'gi');
    while ((match = ytRe.exec(html)) !== null) {
        const attrs = parseAttrs(match[1] ?? '');
        if (attrs.id) {
            markers.push({
                index: match.index,
                length: match[0].length,
                segment: { type: 'youtube', videoId: attrs.id, title: attrs.title },
            });
        }
    }

    const extRe = new RegExp(EXTERNAL_VIDEO_PLACEHOLDER.source, 'gi');
    while ((match = extRe.exec(html)) !== null) {
        const attrs = parseAttrs(match[1] ?? '');
        markers.push({
            index: match.index,
            length: match[0].length,
            segment: { type: 'external-video', title: attrs.title },
        });
    }

    const slidesRe = new RegExp(SLIDES_PLACEHOLDER.source, 'gi');
    while ((match = slidesRe.exec(html)) !== null) {
        const attrs = parseAttrs(match[1] ?? '');
        markers.push({
            index: match.index,
            length: match[0].length,
            segment: { type: 'slides', linkLabel: attrs['link-label'] },
        });
    }

    markers.sort((a, b) => a.index - b.index);
    return markers;
}

function segmentHtml(html: string): Segment[] {
    const markers = findMarkers(html);
    if (!markers.length) return [{ type: 'html', content: html }];

    const segments: Segment[] = [];
    let lastIndex = 0;

    for (const m of markers) {
        if (m.index > lastIndex) {
            segments.push({ type: 'html', content: html.slice(lastIndex, m.index) });
        }
        segments.push(m.segment);
        lastIndex = m.index + m.length;
    }

    if (lastIndex < html.length) {
        segments.push({ type: 'html', content: html.slice(lastIndex) });
    }

    return segments;
}

interface DocBodyProps {
    html: string;
    slidesPdf?: CellAttachment[];
    slidesUrl?: string;
    videoUrl?: string;
}

function SlidesBlock({
    attachments,
    externalUrl,
    linkLabel,
    missingHint,
}: {
    attachments: CellAttachment[];
    externalUrl: string;
    linkLabel?: string;
    missingHint?: string;
}) {
    if (!attachments.length && !externalUrl?.trim()) {
        return (
            <p className="tl-video-missing">
                {missingHint ?? 'Slide deck not attached yet.'}
            </p>
        );
    }
    return (
        <SlidesResource
            attachments={attachments}
            externalUrl={externalUrl}
            linkLabel={linkLabel}
        />
    );
}

export function DocBody({ html, slidesPdf = [], slidesUrl = '', videoUrl = '' }: DocBodyProps) {
    const segments = useMemo(() => segmentHtml(html), [html]);
    let slidesShown = false;

    return (
        <div className="doc-body">
            {segments.map((seg, i) => {
                if (seg.type === 'youtube') {
                    const nodes: React.ReactNode[] = [
                        <YouTubeEmbed
                            key={`yt-${seg.videoId}-${i}`}
                            videoId={seg.videoId}
                            title={seg.title}
                        />,
                    ];
                    if (!slidesShown && (slidesPdf.length || slidesUrl)) {
                        slidesShown = true;
                        nodes.push(
                            <SlidesBlock
                                key="slides-after-yt"
                                attachments={slidesPdf}
                                externalUrl={slidesUrl}
                                linkLabel="Open Airspace slides (PDF)"
                            />,
                        );
                    }
                    return nodes;
                }
                if (seg.type === 'external-video') {
                    return (
                        <ExternalVideoEmbed
                            key={`ext-vid-${i}`}
                            url={videoUrl}
                            title={seg.title}
                        />
                    );
                }
                if (seg.type === 'slides') {
                    slidesShown = true;
                    return (
                        <SlidesBlock
                            key={`slides-${i}`}
                            attachments={slidesPdf}
                            externalUrl={slidesUrl}
                            linkLabel={seg.linkLabel}
                            missingHint="Training deck not attached yet — drag the PDF into Slides PDF on this record in Airtable, or ask Matthew."
                        />
                    );
                }
                if (!seg.content.trim()) return null;
                return (
                    <div
                        key={`html-${i}`}
                        dangerouslySetInnerHTML={{ __html: seg.content }}
                    />
                );
            })}
            {!slidesShown && (slidesPdf.length > 0 || slidesUrl) && (
                <SlidesBlock
                    attachments={slidesPdf}
                    externalUrl={slidesUrl}
                    linkLabel="Open slides (PDF)"
                />
            )}
        </div>
    );
}
